"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ChoiceChip,
  DialogError,
  Field,
  Kv,
  Note,
  SectionTitle,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { InvoicePatientPicker } from "@/components/billing/InvoicePatientPicker";
import { PatientPlanStatus } from "@/components/billing/PatientPlanStatus";
import { FeeScheduleDialog } from "@/components/billing/clinic-admin/FeeScheduleDialog";
import {
  discountForPreset,
  draftTotals,
  lineItemsPayload,
  type DraftLine,
} from "@/components/billing/clinic-admin/billing-admin.logic";
import { useCreateInvoice, useSendInvoiceViaWhatsApp } from "@/hooks/query/useBilling";
import { useRecordInvoicePayment } from "@/hooks/query/usePatientBilling";
import { useClinicSettingsSection } from "@/hooks/query/useClinicSettingsSection";
import { showWarningToast } from "@/hooks/utils/use-toast";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { readFeeSchedule } from "@/lib/utils/clinic-settings-sections";
import { formatRupees } from "@/lib/utils/currency";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import type { CollectionMethod } from "@/types/billing.types";
import type { PatientDirectoryRow } from "@/types/patient-directory.types";

const METHODS: CollectionMethod[] = ["UPI", "CASH", "CARD"];
const DISCOUNT_REASONS = ["Senior citizen", "Staff / family", "Follow-up courtesy", "Doctor's instruction", "Other"];

interface PaymentLine {
  method: CollectionMethod;
  amount: string;
  reference: string;
}

let lineSeq = 0;
const nextKey = () => `line-${++lineSeq}`;

// CaNewInvoice (B1): raise an invoice at the desk for a registered patient, split payment, then
// print / send. Uses the existing create-invoice and record-payment routes. In-clinic consultations
// are covered by the patient's monthly in-person plan and video visits are paid when booked, so this
// invoice is for other services / procedures / items only, never a per-visit consultation fee.
export default function CaNewInvoicePage() {
  const router = useRouter();
  const clinicId = useCurrentClinicId();
  const fees = useClinicSettingsSection(readFeeSchedule);
  const createInvoice = useCreateInvoice();
  const recordPayment = useRecordInvoicePayment();
  const whatsapp = useSendInvoiceViaWhatsApp();

  const [patient, setPatient] = useState<PatientDirectoryRow | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [custom, setCustom] = useState({ label: "", rate: "" });
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [paymentLines, setPaymentLines] = useState<PaymentLine[]>([{ method: "UPI", amount: "", reference: "" }]);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [feesOpen, setFeesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Synchronous in-flight guard: `busy` only disables the buttons after a re-render, so a fast
  // double-click could otherwise fire two submits and create two invoices.
  const inFlight = useRef(false);

  const totals = useMemo(() => draftTotals(lines, Number(discount) || 0), [lines, discount]);
  const paid = paymentLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const balance = Math.round((totals.total - paid) * 100) / 100;

  const toggleFee = (code: string) => {
    const fee = fees.value.find((item) => item.code === code);
    if (!fee) return;
    setLines((current) =>
      current.some((line) => line.key === code)
        ? current.filter((line) => line.key !== code)
        : [...current, { key: code, label: fee.label, quantity: 1, rate: fee.amount, ...(fee.detail ? { detail: fee.detail } : {}) }],
    );
  };
  const setQty = (key: string, delta: number) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line)));
  const addCustom = () => {
    const rate = Number(custom.rate);
    if (!custom.label.trim() || !(rate >= 0)) return;
    setLines((current) => [...current, { key: nextKey(), label: custom.label.trim(), quantity: 1, rate }]);
    setCustom({ label: "", rate: "" });
  };
  const updatePayment = (index: number, patch: Partial<PaymentLine>) =>
    setPaymentLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const validate = (collect: boolean): string | null => {
    if (!patient) return "Choose the patient first.";
    if (lines.length === 0) return "Add at least one service or item.";
    if (totals.discount > 0 && !discountReason) return "Pick a reason for the discount.";
    if (collect && paid <= 0) return "Enter the amount received.";
    if (collect && paid - totals.total > 0.009) return "The amount received is more than the total.";
    return null;
  };

  const submit = async (collect: boolean) => {
    if (inFlight.current) return;
    const problem = validate(collect);
    setError(problem);
    if (problem || !patient || !clinicId) return;
    inFlight.current = true;
    setBusy(true);
    let invoiceId: string | undefined;
    try {
      const created = await createInvoice.mutateAsync({
        userId: patient.userId,
        clinicId,
        // The server computes totalAmount = amount + tax - discount, so `amount` is the
        // pre-discount subtotal; sending the discounted total would apply the discount twice.
        amount: totals.subtotal,
        dueDate: formatDateKeyInIST(new Date(Date.now() + 7 * 86_400_000)),
        lineItems: lineItemsPayload(lines),
        ...({
          description: lines.map((line) => line.label).join(" + "),
          discount: totals.discount,
          metadata: { source: "CLINIC_ADMIN_DESK", patientId: patient.patientId, ...(discountReason ? { discountReason } : {}) },
        } as Record<string, unknown>),
      });
      invoiceId = created.invoice?.id;
      if (!invoiceId) throw new Error("The invoice was created but its id was not returned. Open Invoices to continue.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The invoice could not be saved");
      inFlight.current = false;
      setBusy(false);
      return;
    }

    // From here on the invoice exists: never leave the user on this form (a retry would create a
    // duplicate invoice). Record what we can, then open the invoice and say what is still pending.
    if (collect) {
      const toRecord = paymentLines.filter((entry) => Number(entry.amount) > 0);
      let recorded = 0;
      let recordedCount = 0;
      try {
        for (const line of toRecord) {
          await recordPayment.mutateAsync({
            clinicId,
            invoiceId,
            input: { method: line.method, amount: Number(line.amount), ...(line.reference.trim() ? { transactionId: line.reference.trim() } : {}) },
          });
          recorded += Number(line.amount);
          recordedCount += 1;
        }
      } catch (caught) {
        const reason = caught instanceof Error ? caught.message : "a payment could not be recorded";
        showWarningToast("Invoice created, but not all payments were recorded", {
          description: `Recorded ${recordedCount} of ${toRecord.length} payments (${formatRupees(recorded)}). ${reason}. Record the rest from the invoice.`,
          duration: 12000,
        });
      }
      if (sendWhatsApp && recordedCount === toRecord.length) await whatsapp.mutateAsync(invoiceId).catch(() => undefined);
    }
    router.push(`/clinic-admin/billing/invoices/${invoiceId}`);
  };

  return (
    <TbdPage title="Create invoice at the desk" backHref="/clinic-admin/billing" backLabel="Billing">
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Patient">
            <SectionTitle title="1 · Patient" />
            {clinicId ? <InvoicePatientPicker clinicId={clinicId} selected={patient} onSelect={setPatient} /> : null}
            {clinicId && patient?.userId ? <PatientPlanStatus clinicId={clinicId} patientUserId={patient.userId} /> : null}
            <Note tone="blue">Walk-ins without a record are registered at reception first; then raise the invoice here.</Note>
          </Surface>

          <Surface as="section" aria-label="Services and fees">
            <SectionTitle
              title="2 · Services & fees"
              description="Procedures and items only. Consultations are covered by the in-person plan (video visits are paid when booked)."
              action={
                <Button variant="ghost" size="sm" onClick={() => setFeesOpen(true)}>
                  Edit fee schedule
                </Button>
              }
            />
            {fees.value.length === 0 ? (
              <Note tone="amber">No fee schedule yet. Use “Edit fee schedule”, or add a custom item below.</Note>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Fees">
                {fees.value.map((fee) => (
                  <ChoiceChip key={fee.code} active={lines.some((line) => line.key === fee.code)} onClick={() => toggleFee(fee.code)}>
                    {fee.label} · {formatRupees(fee.amount)}
                  </ChoiceChip>
                ))}
              </div>
            )}

            <div className="mt-3 flex flex-col divide-y divide-hair rounded-xl border border-line">
              {lines.map((line) => (
                <div key={line.key} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-ink">{line.label}</span>
                    {line.detail ? <span className="text-xs text-ink-muted">{line.detail}</span> : null}
                  </span>
                  <span className="flex items-center gap-1">
                    <Button variant="outline" size="icon" aria-label={`Fewer ${line.label}`} onClick={() => setQty(line.key, -1)}>
                      <Minus aria-hidden="true" />
                    </Button>
                    <span className="w-6 text-center font-bold">{line.quantity}</span>
                    <Button variant="outline" size="icon" aria-label={`More ${line.label}`} onClick={() => setQty(line.key, 1)}>
                      <Plus aria-hidden="true" />
                    </Button>
                  </span>
                  <span className="w-20 text-right font-extrabold">{formatRupees(line.quantity * line.rate)}</span>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${line.label}`} onClick={() => setLines((current) => current.filter((entry) => entry.key !== line.key))}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 p-3">
                <Input placeholder="Custom item or procedure" aria-label="Custom item" value={custom.label} onChange={(e) => setCustom((c) => ({ ...c, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
                <Input className="w-28" placeholder="₹" inputMode="decimal" aria-label="Custom item rate" value={custom.rate} onChange={(e) => setCustom((c) => ({ ...c, rate: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addCustom()} />
                <Button variant="outline" onClick={addCustom}>Add</Button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Discount (₹)" htmlFor="discount">
                <div className="flex gap-2">
                  <Input id="discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
                  {(["5", "10", "WAIVE"] as const).map((preset) => (
                    <Button key={preset} variant="outline" size="sm" onClick={() => setDiscount(String(discountForPreset(totals.subtotal, preset)))}>
                      {preset === "WAIVE" ? "Waive" : `${preset}%`}
                    </Button>
                  ))}
                </div>
              </Field>
              <Field label="Reason (required if discounted)">
                <div className="flex flex-wrap gap-1.5">
                  {DISCOUNT_REASONS.map((reason) => (
                    <ChoiceChip key={reason} size="sm" active={discountReason === reason} onClick={() => setDiscountReason(reason === discountReason ? "" : reason)}>
                      {reason}
                    </ChoiceChip>
                  ))}
                </div>
              </Field>
            </div>
          </Surface>

          <Surface as="section" aria-label="Payment">
            <SectionTitle title="3 · Payment" description="Split across UPI, cash and card if needed." />
            {paymentLines.map((line, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 py-1.5">
                <div className="flex gap-1.5">
                  {METHODS.map((method) => (
                    <ChoiceChip key={method} size="sm" active={line.method === method} onClick={() => updatePayment(index, { method })}>
                      {method === "CASH" ? "Cash" : method === "CARD" ? "Card" : "UPI"}
                    </ChoiceChip>
                  ))}
                </div>
                <Input className="w-28" inputMode="decimal" placeholder="₹" aria-label="Amount received" value={line.amount} onChange={(e) => updatePayment(index, { amount: e.target.value })} />
                {line.method !== "CASH" ? (
                  <Input className="w-44" placeholder="Reference no." aria-label="Reference number" value={line.reference} onChange={(e) => updatePayment(index, { reference: e.target.value })} />
                ) : null}
                {paymentLines.length > 1 ? (
                  <Button variant="ghost" size="icon" aria-label="Remove payment line" onClick={() => setPaymentLines((current) => current.filter((_, i) => i !== index))}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setPaymentLines((current) => [...current, { method: "CASH", amount: balance > 0 ? String(balance) : "", reference: "" }])}>
                <Plus aria-hidden="true" /> Add split
              </Button>
              <Button variant="ghost" size="sm" onClick={() => updatePayment(0, { amount: String(totals.total) })}>
                Fill total
              </Button>
              <span className="text-sm text-ink-soft">
                Received {formatRupees(paid)} · balance {formatRupees(Math.max(0, balance))}
              </span>
            </div>
          </Surface>
        </div>

        <Surface as="aside" aria-label="Invoice preview" className="flex h-fit flex-col gap-2 lg:sticky lg:top-24">
          <SectionTitle title="Invoice preview" description={fees.clinicName} />
          <Kv label="Billed to" value={patient?.name ?? "—"} />
          {lines.map((line) => (
            <Kv key={line.key} label={`${line.label} × ${line.quantity}`} value={formatRupees(line.quantity * line.rate)} />
          ))}
          <Kv label="Discount" value={`− ${formatRupees(totals.discount)}`} />
          <Kv label="Total payable" value={formatRupees(totals.total)} strong />
          <p className="text-xs text-ink-muted">Healthcare services, GST exempt.</p>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={sendWhatsApp} onCheckedChange={(checked) => setSendWhatsApp(checked === true)} />
            Send on WhatsApp{patient?.phone ? ` to ${patient.phone}` : ""}
          </label>
          <DialogError message={error} />
          <Button disabled={busy} onClick={() => void submit(true)}>
            {busy ? "Saving…" : `Collect ${formatRupees(Math.min(paid, totals.total))} & save`}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void submit(false)}>
            Save as pending
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => router.push("/clinic-admin/billing")}>
            Cancel
          </Button>
        </Surface>
      </div>
      <FeeScheduleDialog open={feesOpen} onClose={() => setFeesOpen(false)} items={fees.value} onSave={fees.save} saving={fees.isSaving} />
    </TbdPage>
  );
}
