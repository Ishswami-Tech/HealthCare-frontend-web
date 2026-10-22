"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { FileText, History, MessageCircle, Printer, RotateCcw, Send, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyBlock,
  GridHead,
  GridRow,
  Kv,
  ListRow,
  LoadError,
  Note,
  ReasonDialog,
  SectionTitle,
  SkeletonRows,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { InvoiceStatusPill } from "@/components/billing/clinic-admin/BillingAdminNav";
import { RecordInvoicePaymentDialog } from "@/components/billing/RecordInvoicePaymentDialog";
import { invoiceStatusKey } from "@/components/billing/clinic-admin/billing-admin.logic";
import { invoiceNumberLabel, paymentMethodLabel } from "@/components/billing/staff/billing.logic";
import {
  useClinicInvoice,
  useInvoiceReceipt,
  useInvoiceReminders,
  useRefundClinicPayment,
  useSendInvoiceReminders,
} from "@/hooks/query/useClinicAdminBilling";
import { useClinicAudit } from "@/hooks/query/useClinicStaffAdmin";
import { useClinicPayments, useSendInvoiceViaWhatsApp } from "@/hooks/query/useBilling";
import { useInvoicePdfDownload } from "@/hooks/query/useInvoicePdfDownload";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { formatRupees } from "@/lib/utils/currency";
import { invoiceReceiptFileName } from "@/lib/utils/prescription-pdf-download";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/utils/date-time";
import type { Invoice } from "@/types/billing.types";
import type { ReceiptLineItem } from "@/types/clinic-admin-ops.types";

const ITEM_COLUMNS = "2fr 0.6fr 0.8fr 0.8fr";

/** Receipt lineItems arrive as an array (pharmacy) or `{ items: [...] }` (appointment/manual invoices). */
function normalizeLineItems(raw: unknown): ReceiptLineItem[] {
  if (Array.isArray(raw)) return raw as ReceiptLineItem[];
  if (raw && typeof raw === "object") {
    const items = (raw as { items?: unknown }).items;
    if (Array.isArray(items)) return items as ReceiptLineItem[];
  }
  return [];
}

/** Invoice total after discount/tax: prefer totalAmount, fall back to amount only when absent. */
function invoiceTotal(data: Record<string, unknown> | undefined): number {
  const value = data?.totalAmount ?? data?.amount;
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

// CaInvoiceDetail (B1): one invoice with line items, payments, reminders, audit trail and actions.
export default function CaInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = String(params?.id ?? "");
  const clinicId = useCurrentClinicId();
  const invoice = useClinicInvoice(invoiceId);
  const receipt = useInvoiceReceipt(invoiceId);
  const reminders = useInvoiceReminders(invoiceId);
  const audit = useClinicAudit({ entityId: invoiceId, limit: 20 }, Boolean(invoiceId));
  const payments = useClinicPayments();
  const whatsapp = useSendInvoiceViaWhatsApp();
  const remind = useSendInvoiceReminders();
  const refund = useRefundClinicPayment();
  const { downloadPdf, downloadingPdfId } = useInvoicePdfDownload();
  const [collectOpen, setCollectOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const data = invoice.data as (Invoice & Record<string, unknown>) | undefined;
  const r = receipt.data;
  const invoicePayments = useMemo(
    () => (payments.data ?? []).filter((payment) => payment.invoiceId === invoiceId),
    [payments.data, invoiceId],
  );
  const refundable = invoicePayments.filter((payment) => String(payment.status).toUpperCase() === "COMPLETED");
  const lineItems = useMemo(() => normalizeLineItems(r?.lineItems), [r?.lineItems]);
  const total = r?.total ?? invoiceTotal(data);
  const received = r ? r.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) : refundable.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, Math.round((total - received) * 100) / 100);
  const statusKey = invoiceStatusKey(data?.status ?? r?.status);
  const number = data ? invoiceNumberLabel(data) : r?.receiptNumber ?? "Invoice";
  const patientName = r?.patientName || data?.patientName || "Patient";
  // Receipts exist only for a settled invoice: the PDF/WhatsApp endpoints refuse an unpaid one.
  const isPaid = statusKey === "PAID";
  const receiptFileName = invoiceReceiptFileName(data?.invoiceNumber || r?.receiptNumber || number, r?.patientName || data?.patientName);
  const whatsappInFlight = useRef(false);

  const resendWhatsApp = () => {
    // Single flight: a second click while the first send is running must not post again.
    if (whatsappInFlight.current || whatsapp.isPending) return;
    whatsappInFlight.current = true;
    whatsapp
      .mutateAsync(invoiceId)
      .catch(() => undefined) // the mutation's error toast already reports it
      .finally(() => {
        whatsappInFlight.current = false;
      });
  };

  const doRefund = async (reason: string) => {
    setRefundError(null);
    try {
      for (const payment of refundable) await refund.mutateAsync({ paymentId: payment.id, reason });
      setRefundOpen(false);
    } catch (caught) {
      setRefundError(caught instanceof Error ? caught.message : "Refund failed");
    }
  };

  if (invoice.error && !data) {
    return (
      <TbdPage title="Invoice" backHref="/clinic-admin/billing/invoices" backLabel="Invoices">
        <LoadError title="Invoice could not be loaded" message={invoice.error.message} onRetry={() => void invoice.refetch()} />
      </TbdPage>
    );
  }

  return (
    <TbdPage
      title={number}
      description={data?.createdAt ? `Created ${formatDateTimeLabel(data.createdAt)}` : undefined}
      backHref="/clinic-admin/billing/invoices"
      backLabel="Invoices"
      actions={<InvoiceStatusPill status={data?.status ?? r?.status} />}
    >
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Invoice total" value={invoice.isPending && receipt.isPending ? "…" : formatRupees(total)} />
        <StatTile tone="brand" label="Received" value={formatRupees(received)} />
        <StatTile tone={balance > 0 ? "amber" : "ink"} label="Balance due" value={formatRupees(balance)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface flush as="section" aria-label="Items">
            <div className="p-5 pb-0">
              <SectionTitle title={patientName} description={r?.description ?? r?.billType ?? undefined} icon={FileText} />
            </div>
            {receipt.isPending ? (
              <div className="p-5">
                <SkeletonRows rows={3} />
              </div>
            ) : receipt.error ? (
              <div className="p-5">
                <LoadError title="Line items could not be loaded" message={receipt.error.message} onRetry={() => void receipt.refetch()} />
              </div>
            ) : (
              <div role="table" aria-label="Invoice items">
                <GridHead columns={ITEM_COLUMNS} labels={["Item", "Qty", "Rate", "Amount"]} />
                {lineItems.map((item, index) => {
                  const qty = Number(item.quantity ?? 1) || 1;
                  const lineAmount = item.total ?? item.amount;
                  // Appointment invoices carry only the line amount: the rate is amount / quantity.
                  const rate = Number(item.unitPrice ?? item.rate ?? (lineAmount !== undefined ? Number(lineAmount) / qty : 0));
                  return (
                    <GridRow key={index} columns={ITEM_COLUMNS}>
                      <span className="font-bold text-ink">{item.description ?? item.name ?? "Item"}</span>
                      <span>{qty}</span>
                      <span>{formatRupees(rate)}</span>
                      <span className="font-extrabold">{formatRupees(Number(item.total ?? item.amount ?? qty * rate))}</span>
                    </GridRow>
                  );
                })}
                <div className="flex flex-col gap-1 p-5">
                  <Kv label="Subtotal" value={formatRupees(r?.subtotal ?? total)} />
                  {r?.tax ? <Kv label="Tax" value={formatRupees(r.tax)} /> : null}
                  <Kv label="Discount" value={formatRupees(r?.discount ?? 0)} />
                  <Kv label="Total" value={formatRupees(total)} strong />
                </div>
              </div>
            )}
          </Surface>

          <Surface as="section" aria-label="Payments">
            <SectionTitle title="Payments" icon={Wallet} count={r?.payments.length ?? invoicePayments.length} />
            {(r?.payments ?? []).length === 0 && invoicePayments.length === 0 ? (
              <EmptyBlock icon={Wallet} title="No payment recorded yet" />
            ) : (
              (r?.payments.length ? r.payments.map((payment, index) => ({ key: String(index), method: payment.method, amount: payment.amount, at: payment.paidAt, status: "COMPLETED" })) : invoicePayments.map((payment) => ({ key: payment.id, method: payment.method, amount: payment.amount, at: payment.paymentDate ?? payment.createdAt, status: payment.status }))).map((row) => (
                <ListRow
                  key={row.key}
                  title={paymentMethodLabel(row.method)}
                  description={formatDateTimeLabel(row.at)}
                  right={<span className="font-extrabold text-ink">{formatRupees(row.amount)}</span>}
                />
              ))
            )}
            {balance > 0 ? (
              <ListRow title="Balance outstanding" description={data?.dueDate ? `Due ${formatDateLabel(data.dueDate)}` : undefined} right={<span className="font-extrabold text-[#b45309]">{formatRupees(balance)}</span>} />
            ) : null}
          </Surface>

          <Surface as="section" aria-label="Audit trail">
            <SectionTitle title="Audit trail" description="Every change is logged and cannot be edited" icon={History} />
            {audit.isPending ? (
              <SkeletonRows rows={3} />
            ) : (audit.data ?? []).length === 0 ? (
              <EmptyBlock icon={History} title="No audit entries yet" />
            ) : (
              (audit.data ?? []).map((event) => (
                <ListRow
                  key={event.id}
                  title={event.action.replace(/_/g, " ").toLowerCase()}
                  description={`${event.actorName ?? "System"}${event.actorRole ? ` · ${event.actorRole}` : ""} · ${formatDateTimeLabel(event.at)}`}
                />
              ))
            )}
          </Surface>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Actions" className="flex flex-col gap-2">
            <SectionTitle title="Actions" />
            <Button disabled={balance <= 0 || !clinicId} onClick={() => setCollectOpen(true)}>
              <Wallet aria-hidden="true" /> {balance > 0 ? `Collect ${formatRupees(balance)}` : "Fully paid"}
            </Button>
            <Button variant="outline" disabled={!isPaid || whatsapp.isPending} onClick={resendWhatsApp}>
              <MessageCircle aria-hidden="true" /> Resend receipt via WhatsApp
            </Button>
            <Button
              variant="outline"
              disabled={!isPaid || downloadingPdfId === invoiceId}
              onClick={() => void downloadPdf(invoiceId, receiptFileName)}
            >
              <Printer aria-hidden="true" /> Print receipt (PDF)
            </Button>
            {!isPaid ? <p className="text-xs text-ink-muted">Receipt available after payment.</p> : null}
            {!isPaid && statusKey !== "VOID" && statusKey !== "REFUNDED" ? (
              <Button
                variant="outline"
                disabled={balance <= 0 || remind.isPending}
                onClick={() => remind.mutate({ invoiceIds: [invoiceId], input: { channel: "WHATSAPP", language: "en" } })}
              >
                <Send aria-hidden="true" /> Send payment reminder
              </Button>
            ) : null}
            <Button variant="danger" disabled={refundable.length === 0 || statusKey === "REFUNDED"} onClick={() => setRefundOpen(true)}>
              <RotateCcw aria-hidden="true" /> Refund {formatRupees(refundable.reduce((sum, p) => sum + p.amount, 0))}
            </Button>
            <Note tone="blue">Refunds return to the original payment mode and need a reason.</Note>
          </Surface>

          <Surface as="section" aria-label="Reminders">
            <SectionTitle title="Reminders sent" icon={Send} count={reminders.data?.length ?? 0} />
            {(reminders.data ?? []).length === 0 ? (
              <p className="text-sm text-ink-muted">No reminder sent yet.</p>
            ) : (
              (reminders.data ?? []).map((reminder) => (
                <ListRow
                  key={reminder.id}
                  title={`${reminder.channel === "SMS" ? "SMS" : "WhatsApp"} · ${reminder.language.toUpperCase()}`}
                  description={formatDateTimeLabel(reminder.sentAt ?? reminder.scheduledFor ?? reminder.createdAt)}
                  right={<InvoiceStatusPill status={reminder.status === "SENT" ? "PAID" : "PENDING"} />}
                />
              ))
            )}
          </Surface>

          <Surface as="section" aria-label="Details">
            <SectionTitle title="Details" />
            <Kv label="Bill type" value={r?.billType ?? String(data?.billType ?? "—")} />
            <Kv label="Due date" value={data?.dueDate ? formatDateLabel(data.dueDate) : "—"} />
            <Kv label="Receipt no." value={r?.receiptNumber ?? "—"} />
          </Surface>
        </div>
      </div>

      {clinicId ? (
        <RecordInvoicePaymentDialog
          clinicId={clinicId}
          invoiceId={invoiceId}
          invoiceNumber={number}
          balance={balance}
          open={collectOpen}
          onOpenChange={setCollectOpen}
          onRecorded={() => {
            void invoice.refetch();
            void receipt.refetch();
            void payments.refetch();
          }}
        />
      ) : null}
      <ReasonDialog
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title={`Refund ${number}?`}
        description="The full amount goes back to the original payment mode. This is recorded in the audit log."
        presets={["Billed twice", "Visit cancelled", "Service not given", "Fee waived"]}
        confirmLabel="Refund"
        busyLabel="Refunding…"
        tone="danger"
        busy={refund.isPending}
        error={refundError}
        onConfirm={(reason) => void doRefund(reason)}
      />
    </TbdPage>
  );
}
