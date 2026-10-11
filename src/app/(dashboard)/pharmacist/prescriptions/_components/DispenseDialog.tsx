"use client";

import { useMemo } from "react";
import { CircleAlert, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, InitialsAvatar, Note, DialogActions, DialogBody, DialogShell } from "@/components/tbd";
import { DispenseLineCard } from "./DispenseLineCard";
import {
  getRemainingQuantity,
  getTotalBatchQuantity,
  paymentSummary,
  type CatalogMedicine,
  type DispenseBatchRow,
  type DispenseLineState,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";
import type { LineField } from "./usePharmacistPrescriptionsState";
import { formatDateTimeLabel } from "@/lib/utils/date-time";

export interface DispenseDialogProps {
  /** The prescription being dispensed; null closes the dialog. */
  prescription: PrescriptionRow | null;
  lines: DispenseLineState[];
  notes: string;
  /** First problem found in the form, or the message of the failed request. */
  errorMessage?: string | null;
  isDispensing?: boolean;
  /** Clinic inventory, for substitutes and their stock. */
  catalog: CatalogMedicine[];
  onBatchChange: (
    medicineIndex: number,
    batchIndex: number,
    field: keyof Omit<DispenseBatchRow, "id">,
    value: string,
  ) => void;
  onAddBatch: (medicineIndex: number) => void;
  onRemoveBatch: (medicineIndex: number, batchIndex: number) => void;
  onLineFieldChange: (medicineIndex: number, field: LineField, value: string) => void;
  onClearSubstitute: (medicineIndex: number) => void;
  onNotesChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-px">
      <span className="text-[11px] font-bold text-ink-muted">{label}</span>
      <span className="truncate text-[13px] font-bold text-ink">{value}</span>
      {note ? <span className="truncate text-xs font-medium text-ink-muted">{note}</span> : null}
    </span>
  );
}

/**
 * "Review dispense" — the pharmacist checks the quantity and batch of each medicine and
 * confirms. Nothing is dispensed until "Confirm dispense" is pressed.
 */
export function DispenseDialog({
  prescription,
  lines,
  notes,
  errorMessage = null,
  isDispensing = false,
  catalog,
  onBatchChange,
  onAddBatch,
  onRemoveBatch,
  onLineFieldChange,
  onClearSubstitute,
  onNotesChange,
  onConfirm,
  onClose,
}: DispenseDialogProps) {
  const catalogById = useMemo(
    () => new Map(catalog.map((medicine) => [medicine.id, medicine] as const)),
    [catalog],
  );

  const toGive = lines.reduce((total, line) => total + getTotalBatchQuantity(line), 0);
  const left = lines.reduce((total, line) => total + getRemainingQuantity(line), 0);
  const givenEarlier = lines.reduce((total, line) => total + line.dispensedQuantity, 0);
  const completes = left > 0 && toGive === left;
  const payment = prescription ? paymentSummary(prescription) : { title: "", note: "" };

  return (
    <DialogShell
      open={prescription !== null}
      onClose={onClose}
      busy={isDispensing}
      title="Review dispense"
      description={
        prescription
          ? `Prescription ${prescription.reference} · ${
              givenEarlier > 0
                ? "Partially dispensed. Give what is left, then confirm."
                : "Check the quantity and batch of each medicine, then confirm."
            }`
          : undefined
      }
      width={880}
      stretch
      dense
      className="max-h-[calc(100dvh-2rem)]"
    >
      {prescription ? (
        <>
          <DialogBody>
            <div className="grid grid-cols-2 items-center gap-x-[22px] gap-y-3 rounded-[14px] border border-hair bg-[#f8fafc] px-4 py-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)_auto_auto] dark:bg-white/5">
              <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                <InitialsAvatar name={prescription.patientName} size={40} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-extrabold text-ink">{prescription.patientName}</span>
                  <span className="truncate text-xs font-medium text-ink-muted">
                    {[prescription.patientPhone, prescription.locationName].filter(Boolean).join(" · ") ||
                      prescription.reference}
                  </span>
                </span>
              </div>
              <div className="col-span-2 min-w-0 md:col-span-1">
                <Fact
                  label="Prescribed by"
                  value={prescription.doctorName}
                  note={formatDateTimeLabel(prescription.prescribedAt)}
                />
              </div>
              <Fact label="Payment" value={payment.title} note={payment.note} />
              <Fact
                label="To give now"
                value={`${toGive} of ${left} ${left === 1 ? "unit" : "units"}`}
                note={givenEarlier > 0 ? `${givenEarlier} given earlier` : "Full prescription"}
              />
            </div>

            {errorMessage ? (
              <Note tone="rose" icon={CircleAlert}>
                <span role="alert">{errorMessage}</span>
              </Note>
            ) : null}

            {lines.map((line, medicineIndex) => (
              <DispenseLineCard
                key={`${line.prescriptionItemId}-${medicineIndex}`}
                index={medicineIndex}
                line={line}
                showGiven={givenEarlier > 0}
                catalog={catalog}
                catalogById={catalogById}
                disabled={isDispensing}
                onBatchChange={(batchIndex, field, value) => onBatchChange(medicineIndex, batchIndex, field, value)}
                onAddBatch={() => onAddBatch(medicineIndex)}
                onRemoveBatch={(batchIndex) => onRemoveBatch(medicineIndex, batchIndex)}
                onLineFieldChange={(field, value) => onLineFieldChange(medicineIndex, field, value)}
                onClearSubstitute={() => onClearSubstitute(medicineIndex)}
              />
            ))}

            <Field label="Pharmacist notes" htmlFor="dispense-notes">
              <Textarea
                id="dispense-notes"
                value={notes}
                onChange={(event) => onNotesChange(event.target.value)}
                placeholder="Optional notes for the dispense record"
                disabled={isDispensing}
                className="min-h-16"
              />
            </Field>
          </DialogBody>

          <DialogActions className="flex-col">
            <span className="inline-flex flex-1 items-center gap-2 text-[13px] text-ink-muted">
              <CircleAlert className="size-[15px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
              {completes
                ? givenEarlier > 0
                  ? "This completes the prescription."
                  : "Stock is reduced when you confirm."
                : toGive > 0
                  ? "The rest stays open to give later."
                  : "Enter what you hand over now."}
            </span>
            <div className="flex gap-2.5 [&>*]:flex-1 sm:[&>*]:flex-none">
              <Button size="md" variant="outline" onClick={onClose} disabled={isDispensing}>
                Cancel
              </Button>
              <Button size="md" onClick={onConfirm} disabled={isDispensing}>
                <Package aria-hidden="true" />
                {isDispensing ? "Dispensing…" : "Confirm dispense"}
              </Button>
            </div>
          </DialogActions>
        </>
      ) : null}
    </DialogShell>
  );
}
