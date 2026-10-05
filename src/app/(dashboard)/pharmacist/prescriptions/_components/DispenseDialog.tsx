"use client";

import { useMemo } from "react";
import { CircleAlert, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar, Note } from "@/components/tbd";
import { DispenseLineCard } from "./DispenseLineCard";
import {
  dateTimeLabel,
  getRemainingQuantity,
  getTotalBatchQuantity,
  paymentSummary,
  type CatalogMedicine,
  type DispenseBatchRow,
  type DispenseLineState,
  type PrescriptionRow,
} from "./pharmacist-prescriptions.logic";
import type { LineField } from "./usePharmacistPrescriptionsState";

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
    <Dialog
      open={prescription !== null}
      onOpenChange={(open) => {
        if (!open && !isDispensing) onClose();
      }}
    >
      <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[880px]">
        {prescription ? (
          <>
            <div className="flex items-start gap-3 px-4 pb-3.5 pt-[22px] sm:px-6">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <DialogTitle>Review dispense</DialogTitle>
                <DialogDescription>
                  Prescription {prescription.reference} ·{" "}
                  {givenEarlier > 0
                    ? "Partially dispensed. Give what is left, then confirm."
                    : "Check the quantity and batch of each medicine, then confirm."}
                </DialogDescription>
              </div>
              <DialogClose
                disabled={isDispensing}
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-5 pt-1 sm:px-6">
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
                    note={dateTimeLabel(prescription.prescribedAt)}
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

              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="dispense-notes" className="text-xs font-bold text-ink-soft">
                  Pharmacist notes
                </label>
                <Textarea
                  id="dispense-notes"
                  value={notes}
                  onChange={(event) => onNotesChange(event.target.value)}
                  placeholder="Optional notes for the dispense record"
                  disabled={isDispensing}
                  className="min-h-16"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2.5 border-t border-hair bg-[#f8fafc] px-4 py-3.5 sm:flex-row sm:items-center sm:px-6 dark:bg-white/5">
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
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
