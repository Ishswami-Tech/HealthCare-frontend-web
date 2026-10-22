"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, KeyRound, Loader2, QrCode, ShieldCheck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DialogError,
  Field,
  LoadError,
  Note,
  Pill,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  showUndoToast,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePrescription } from "@/hooks/query/usePharmacy";
import {
  useConfirmPrescriptionHandover,
  usePrescriptionHandover,
  useUndoPrescriptionHandover,
  useVerifyPrescriptionHandover,
} from "@/hooks/query/usePharmacyOps";
import { HANDOVER_INPUT_MAX_LENGTH, normalizeHandoverInput, parseHandoverCode } from "@/lib/pharmacy/pharmacy-ops.logic";
import { showSuccessToast } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import type { PharmacyHandover } from "@/types/pharmacy-ops.types";
import { dateTimeLabel, normalizePrescription } from "../../prescriptions/_components/pharmacist-prescriptions.logic";

// The camera scanner is browser-only and heavy; load it when the pharmacist opens it.
const QRScanner = dynamic(() => import("@/components/qr/QRScanner").then((module) => module.QRScanner), { ssr: false });

/**
 * PhHandover: verified hand-over at the counter, in three steps: verify the patient (6-digit code
 * or the QR from the app), check the items, record who received them. Confirming starts the
 * undo window the API allows (`canUndo`); stock was already moved by the dispense.
 */
export function HandoverContent({ prescriptionId }: { prescriptionId: string }) {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const prescriptionQuery = usePrescription(prescriptionId);
  const handoverQuery = usePrescriptionHandover(scopedClinicId, prescriptionId);
  const prescription = useMemo(
    () => (prescriptionQuery.data ? normalizePrescription(prescriptionQuery.data) : null),
    [prescriptionQuery.data],
  );
  const handover = handoverQuery.data ?? null;

  const backProps = { backHref: "/pharmacist/handover", backLabel: "Hand-over" };
  if ((prescriptionQuery.isPending && !prescriptionQuery.data) || (handoverQuery.isPending && handoverQuery.data === undefined)) {
    return (
      <TbdPage title="Hand over at counter" {...backProps}>
        <Surface flush>
          <SkeletonRows rows={3} />
        </Surface>
      </TbdPage>
    );
  }
  if (prescriptionQuery.error || !prescription) {
    return (
      <TbdPage title="Hand over at counter" {...backProps}>
        <Surface flush role="alert">
          <LoadError
            title="We could not load this prescription"
            message={prescriptionQuery.error instanceof Error ? prescriptionQuery.error.message : undefined}
            onRetry={() => void prescriptionQuery.refetch()}
          />
        </Surface>
      </TbdPage>
    );
  }

  return (
    <TbdPage
      title="Hand over at counter"
      description={`${prescription.reference} · ${prescription.patientName} · verify, check, acknowledge`}
      {...backProps}
    >
      {handover?.status === "HANDED_OVER" ? (
        <HandedOverCard handover={handover} />
      ) : handover?.verified && handover.status === "PENDING_VERIFICATION" ? (
        <ChecklistStep handover={handover} defaultReceiver={prescription.patientName} />
      ) : (
        <VerifyStep prescriptionId={prescriptionId} undone={handover?.status === "UNDONE"} />
      )}
    </TbdPage>
  );
}

function VerifyStep({ prescriptionId, undone }: { prescriptionId: string; undone: boolean }) {
  const verify = useVerifyPrescriptionHandover();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedCode = parseHandoverCode(code);

  const submit = (input: string) => {
    if (verify.isPending) return;
    const parsed = parseHandoverCode(input);
    if (!parsed) {
      setError("Enter the 6-digit code from the patient's app, or scan their QR.");
      return;
    }
    setError(null);
    verify
      .mutateAsync({ prescriptionId, ...parsed })
      .catch((failure: unknown) => setError(sanitizeErrorMessage(failure)));
  };

  return (
    <Surface as="section" aria-label="Verify the patient">
      <SectionTitle icon={ShieldCheck} title="1. Verify the patient" description="The patient opens Collect medicines in the app and shows the code or QR." />
      {undone ? <Note tone="amber">The last hand-over was undone. Verify the patient again to hand over.</Note> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Field label="6-digit code or scanned QR text" htmlFor="handover-code" required>
            <Input
              id="handover-code"
              autoComplete="one-time-code"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={HANDOVER_INPUT_MAX_LENGTH}
              value={code}
              disabled={verify.isPending}
              placeholder="123456"
              onChange={(event) => {
                setCode(normalizeHandoverInput(event.target.value));
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                // Keyboard-wedge scanners type the QR text and finish with Enter (or Tab).
                if (event.key === "Enter" || (event.key === "Tab" && parsedCode?.method === "QR")) {
                  event.preventDefault();
                  submit(code);
                }
              }}
            />
          </Field>
          <Button className="self-start" size="md" disabled={verify.isPending || !parsedCode} onClick={() => submit(code)}>
            {verify.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
            Verify code
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {scanning ? (
            <QRScanner autoStart onScanSuccess={(text) => { setScanning(false); submit(text); }} onEnterCode={() => setScanning(false)} />
          ) : (
            <Button variant="outline" size="md" className="self-start" onClick={() => setScanning(true)}>
              <QrCode />
              Scan the patient&apos;s QR
            </Button>
          )}
          <p className="m-0 text-xs text-ink-muted">The code is valid for 15 minutes. Five wrong tries lock it; the patient can make a new one.</p>
        </div>
      </div>
      <DialogError message={error} />
    </Surface>
  );
}

function ChecklistStep({
  handover,
  defaultReceiver,
}: {
  handover: PharmacyHandover;
  defaultReceiver: string;
}) {
  const confirm = useConfirmPrescriptionHandover();
  const undo = useUndoPrescriptionHandover();
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(handover.items.map((item) => [item.prescriptionItemId, true])),
  );
  const [receiver, setReceiver] = useState(handover.patientName || defaultReceiver);
  const [error, setError] = useState<string | null>(null);
  const checkedCount = handover.items.filter((item) => checked[item.prescriptionItemId]).length;

  const submit = () => {
    if (confirm.isPending) return;
    setError(null);
    confirm
      .mutateAsync({
        handoverId: handover.id,
        itemChecklist: handover.items.map((item) => ({
          prescriptionItemId: item.prescriptionItemId,
          handedOver: Boolean(checked[item.prescriptionItemId]),
        })),
        acknowledgedBy: receiver,
      })
      .then((done) => {
        // The hook shows no toast of its own, so there is exactly one "handed over" toast.
        if (done.canUndo) {
          showUndoToast({
            id: `handover-${done.id}`,
            message: "Medicines handed over",
            durationMs: 10_000,
            onUndo: () => undo.mutateAsync({ handoverId: done.id }).then(() => undefined),
          });
        } else {
          showSuccessToast("Medicines handed over", { id: `handover-${done.id}` });
        }
      })
      .catch((failure: unknown) => setError(sanitizeErrorMessage(failure)));
  };

  return (
    <>
      <Note tone="green" icon={CheckCircle2}>
        Patient verified{handover.method ? ` by ${handover.method === "QR" ? "QR" : "code"}` : ""}
        {handover.verifiedAt ? ` at ${dateTimeLabel(handover.verifiedAt)}` : ""}.
      </Note>
      <Surface as="section" aria-label="Check the items">
        <SectionTitle title="2. Check the items" description={`${checkedCount} of ${handover.items.length} checked`} />
        <ul className="m-0 flex list-none flex-col p-0">
          {handover.items.map((item) => (
            <li key={item.prescriptionItemId} className="flex items-start gap-3 border-b border-hair py-3 last:border-b-0">
              <Checkbox
                id={`item-${item.prescriptionItemId}`}
                checked={Boolean(checked[item.prescriptionItemId])}
                onCheckedChange={(value) => setChecked((current) => ({ ...current, [item.prescriptionItemId]: value === true }))}
                className="mt-0.5"
              />
              <label htmlFor={`item-${item.prescriptionItemId}`} className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">{item.medicineName}</span>
                <span className="text-xs text-ink-muted">
                  {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" · ")}
                </span>
              </label>
              <span className="shrink-0 text-sm font-bold text-ink">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </Surface>
      <Surface as="section" aria-label="Patient acknowledgement">
        <SectionTitle title="3. Acknowledgement" description="The patient confirms the medicines and the advice (dose, timing, allergies) were explained and received." />
        <Field label="Received by" htmlFor="handover-receiver" required>
          <Input id="handover-receiver" value={receiver} maxLength={120} onChange={(event) => setReceiver(event.target.value)} />
        </Field>
        <DialogError message={error} />
        <Button
          className="self-start"
          size="md"
          disabled={confirm.isPending || checkedCount === 0 || receiver.trim().length === 0}
          onClick={submit}
        >
          {confirm.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          Confirm hand-over
        </Button>
      </Surface>
    </>
  );
}

function HandedOverCard({ handover }: { handover: PharmacyHandover }) {
  const undo = useUndoPrescriptionHandover();
  return (
    <Surface as="section" aria-label="Handed over">
      <SectionTitle icon={CheckCircle2} title="Handed over" description={[dateTimeLabel(handover.handedOverAt), handover.acknowledgedBy ? `received by ${handover.acknowledgedBy}` : ""].filter(Boolean).join(" · ")} />
      <ul className="m-0 flex list-none flex-col p-0">
        {handover.items.map((item) => (
          <li key={item.prescriptionItemId} className="flex items-center justify-between gap-3 border-b border-hair py-2.5 last:border-b-0">
            <span className="text-sm font-semibold text-ink">{item.medicineName}</span>
            <Pill tone="green">× {item.quantity}</Pill>
          </li>
        ))}
      </ul>
      {handover.canUndo ? (
        <Button
          variant="outline"
          className="self-start"
          disabled={undo.isPending}
          onClick={() => void undo.mutateAsync({ handoverId: handover.id })}
        >
          <Undo2 />
          Undo hand-over
        </Button>
      ) : (
        <p className="m-0 text-xs text-ink-muted">The undo window has passed. To take stock back, reverse the dispense from Prescriptions.</p>
      )}
    </Surface>
  );
}
