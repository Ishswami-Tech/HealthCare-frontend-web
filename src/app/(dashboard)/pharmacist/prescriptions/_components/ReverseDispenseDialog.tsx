"use client";

import { CircleAlert, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, InitialsAvatar, Note, Pill, DialogActions, DialogBody, DialogShell } from "@/components/tbd";
import {
  getPrescriptionState,
  paymentSummary,
  type PrescriptionMedicine,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";
import { formatDateTimeLabel, formatMonthYearLabel } from "@/lib/utils/date-time";

export interface ReverseDispenseDialogProps {
  /** The prescription whose dispense is reversed; null closes the dialog. */
  prescription: PrescriptionRow | null;
  reason: string;
  /** "Enter a reversal reason." or the message of the failed request. */
  errorMessage?: string | null;
  isReversing?: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/** "Batch PCM2411 · exp Aug 2027" for every batch the medicine was given from. */
function batchLine(medicine: PrescriptionMedicine): string {
  return (medicine.dispenseBatchHistory ?? [])
    .filter((entry) => entry.batchNumber)
    .map((entry) =>
      [`Batch ${entry.batchNumber}`, entry.expiryDate ? `exp ${formatMonthYearLabel(entry.expiryDate)}` : ""]
        .filter(Boolean)
        .join(" · "),
    )
    .filter((value, position, all) => all.indexOf(value) === position)
    .join(", ");
}

/**
 * "Reverse dispense" — takes the handed-over medicines back into stock. A reason is
 * required; nothing is reversed until "Confirm reversal" is pressed.
 */
export function ReverseDispenseDialog({
  prescription,
  reason,
  errorMessage = null,
  isReversing = false,
  onReasonChange,
  onConfirm,
  onClose,
}: ReverseDispenseDialogProps) {
  const state = prescription ? getPrescriptionState(prescription) : null;
  const given = prescription?.medicines.filter((medicine) => medicine.dispensedQuantity > 0) ?? [];
  const payment = prescription ? paymentSummary(prescription) : { title: "", note: "" };

  return (
    <DialogShell
      open={prescription !== null}
      onClose={onClose}
      busy={isReversing}
      title="Reverse dispense"
      description={prescription ? `Prescription ${prescription.reference}` : undefined}
      width={600}
      stretch
      dense
      className="max-h-[calc(100dvh-2rem)]"
    >
      {prescription && state ? (
        <>
          <DialogBody>
            <div className="flex flex-col rounded-[14px] border border-hair bg-[#f8fafc] px-4 pb-0.5 pt-3 dark:bg-white/5">
              <div className="flex items-center gap-3 pb-3">
                <InitialsAvatar name={prescription.patientName} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-extrabold text-ink">{prescription.patientName}</span>
                  <span className="truncate text-xs font-medium text-ink-muted">
                    Prescribed by {prescription.doctorName}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <Pill tone={state.tone}>{state.label}</Pill>
                  <span className="text-xs font-medium text-ink-muted">{payment.title}</span>
                </span>
              </div>
              {given.map((medicine) => {
                const batches = batchLine(medicine);
                return (
                  <div
                    key={medicine.prescriptionItemId}
                    className="flex items-center gap-3 border-t border-hair py-2.5"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-px">
                      <span className="text-sm font-bold text-ink">
                        {medicine.name}{" "}
                        <span className="font-medium text-ink-muted">× {medicine.dispensedQuantity}</span>
                      </span>
                      {batches ? <span className="text-xs font-medium text-ink-muted">{batches}</span> : null}
                    </span>
                    <span className="whitespace-nowrap text-[13px] font-bold text-brand">
                      +{medicine.dispensedQuantity} back to stock
                    </span>
                  </div>
                );
              })}
            </div>

            {prescription.handedOverAt ? (
              <p className="m-0 text-[13px] text-ink-muted">
                Handed over on {formatDateTimeLabel(prescription.handedOverAt)}.
              </p>
            ) : null}

            <Field
              label="Reversal reason"
              htmlFor="reversal-reason"
              hint="Required. It is saved with the reversal in the batch audit."
            >
              <Textarea
                id="reversal-reason"
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Explain why this dispense is being reversed"
                aria-describedby="reversal-reason-hint"
                aria-invalid={errorMessage && !reason.trim() ? true : undefined}
                disabled={isReversing}
                className="min-h-[72px]"
              />
            </Field>

            {errorMessage ? (
              <Note tone="rose" icon={CircleAlert}>
                <span role="alert">{errorMessage}</span>
              </Note>
            ) : null}

            <Note tone="amber" icon={CircleAlert}>
              The medicines go back into stock. The dispense and this reversal both stay in the batch audit.
            </Note>
          </DialogBody>

          <DialogActions className="flex-row [&>*]:flex-1 sm:[&>*]:flex-none">
            <Button size="md" variant="outline" onClick={onClose} disabled={isReversing}>
              Cancel
            </Button>
            <Button size="md" variant="danger" onClick={onConfirm} disabled={isReversing}>
              <Undo2 aria-hidden="true" />
              {isReversing ? "Reversing…" : "Confirm reversal"}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </DialogShell>
  );
}
