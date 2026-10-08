"use client";

import { Boxes, PackagePlus, Pencil, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Divider, Kv, Note, Pill } from "@/components/tbd";
import {
  DialogError,
  MedicineSummary,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
} from "./PharmacyDialogParts";
import {
  STATUS_LABEL,
  STATUS_TONE,
  expiryPill,
  formatRupees,
  medicineSubline,
  type MedicineRow,
} from "./pharmacy-inventory.logic";

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex min-w-0 flex-1 basis-[150px] flex-col gap-0.5 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      <span className="text-[22px] font-extrabold leading-[1.2] text-ink">{value}</span>
      <span className="text-xs font-medium text-ink-muted">{hint}</span>
    </div>
  );
}

interface PharmacyMedicineDetailsDialogProps {
  /** The medicine to show; null closes the dialog. */
  medicine: MedicineRow | null;
  /** True while the latest record is being read from the server. */
  refreshing?: boolean;
  /** False hides the write actions (no `MANAGE_INVENTORY` permission). */
  canManage: boolean;
  onClose: () => void;
  /** Opens the receive-stock form (adds a batch). */
  onRestock: (medicine: MedicineRow) => void;
  /** Opens the batches (lots) of the medicine. */
  onBatches: (medicine: MedicineRow) => void;
  onEdit: (medicine: MedicineRow) => void;
  onOrder: (medicine: MedicineRow) => void;
  /** Left out while the backend cannot remove a medicine. */
  onRemove?: (medicine: MedicineRow) => void;
}

/** Board `PhInventoryMedicine`: everything the API holds about one medicine, with its actions. */
export function PharmacyMedicineDetailsDialog({
  medicine,
  refreshing = false,
  canManage,
  onClose,
  onRestock,
  onBatches,
  onEdit,
  onOrder,
  onRemove,
}: PharmacyMedicineDetailsDialogProps) {
  const range = medicine
    ? [
        medicine.unit,
        medicine.minStock > 0 ? `min ${medicine.minStock}` : "",
        medicine.maxStock > 0 ? `max ${medicine.maxStock}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const expiry = medicine?.expiringSoon ? expiryPill(medicine) : null;

  return (
    <PharmacyDialog
      open={medicine !== null}
      onClose={onClose}
      title={medicine?.name ?? "Medicine"}
      description={medicine ? medicineSubline(medicine) || medicine.typeLabel || "Medicine details" : undefined}
      width={720}
    >
      {medicine ? (
        <>
          <PharmacyDialogBody aria-busy={refreshing}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={STATUS_TONE[medicine.status]}>{STATUS_LABEL[medicine.status]}</Pill>
              {expiry ? <Pill tone={expiry.tone}>{expiry.label}</Pill> : null}
              {medicine.prescriptionRequired ? <Pill tone="blue">Prescription required</Pill> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <StatTile label="Stock" value={String(medicine.stock)} hint={range} />
              <StatTile
                label="Price"
                value={medicine.price > 0 ? formatRupees(medicine.price) : "—"}
                hint="per unit"
              />
              <StatTile label="Stock value" value={formatRupees(medicine.stockValue)} hint="at the current price" />
            </div>

            {medicine.facts.length > 0 ? (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
                {medicine.facts.map((fact) => (
                  <Kv key={fact.label} label={fact.label} value={fact.value} className="[&>span:last-child]:break-words" />
                ))}
              </div>
            ) : null}

            {medicine.notes.length > 0 ? (
              <>
                <Divider />
                <dl className="m-0 flex flex-col gap-2.5">
                  {medicine.notes.map((note) => (
                    <div key={note.label} className="grid grid-cols-1 gap-x-3 gap-y-0.5 text-sm sm:grid-cols-[150px_minmax(0,1fr)]">
                      <dt className="text-[13px] text-ink-muted">{note.label}</dt>
                      <dd className="m-0 text-ink">{note.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}
          </PharmacyDialogBody>

          <PharmacyDialogActions
            start={
              canManage && onRemove ? (
                <Button size="md" variant="danger" onClick={() => onRemove(medicine)}>
                  <Trash2 aria-hidden="true" />
                  Remove
                </Button>
              ) : undefined
            }
          >
            {canManage ? (
              <>
                <Button size="md" variant="outline" onClick={() => onOrder(medicine)}>
                  <Truck aria-hidden="true" />
                  Order
                </Button>
                <Button size="md" variant="outline" onClick={() => onEdit(medicine)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                <Button size="md" variant="outline" onClick={() => onBatches(medicine)}>
                  <Boxes aria-hidden="true" />
                  Batches
                </Button>
                <Button size="md" onClick={() => onRestock(medicine)}>
                  <PackagePlus aria-hidden="true" />
                  Receive stock
                </Button>
              </>
            ) : (
              <Button size="md" variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </PharmacyDialogActions>
        </>
      ) : null}
    </PharmacyDialog>
  );
}

interface PharmacyRemoveMedicineDialogProps {
  /** The medicine to remove; null closes the dialog. */
  medicine: MedicineRow | null;
  isRemoving?: boolean;
  errorMessage?: string | null;
  onConfirm: (medicine: MedicineRow) => void;
  onClose: () => void;
}

/** Confirm step before a medicine is taken off the stock list. Nothing happens until "Remove medicine". */
export function PharmacyRemoveMedicineDialog({
  medicine,
  isRemoving = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: PharmacyRemoveMedicineDialogProps) {
  return (
    <PharmacyDialog
      open={medicine !== null}
      onClose={onClose}
      busy={isRemoving}
      title="Remove this medicine?"
      description="It leaves the stock list and the doctor can no longer prescribe it."
      width={520}
    >
      {medicine ? (
        <>
          <PharmacyDialogBody>
            <MedicineSummary medicine={medicine} />
            {medicine.stock > 0 ? (
              <Note tone="amber">
                {medicine.stock} {medicine.unit} are still in stock, worth {formatRupees(medicine.stockValue)}.
              </Note>
            ) : null}
            <DialogError lead="The medicine was not removed." message={errorMessage} />
          </PharmacyDialogBody>
          <PharmacyDialogActions>
            <Button size="md" variant="outline" onClick={onClose} disabled={isRemoving}>
              Keep medicine
            </Button>
            <Button size="md" variant="danger" onClick={() => onConfirm(medicine)} disabled={isRemoving}>
              <Trash2 aria-hidden="true" />
              {isRemoving ? "Removing…" : "Remove medicine"}
            </Button>
          </PharmacyDialogActions>
        </>
      ) : null}
    </PharmacyDialog>
  );
}
