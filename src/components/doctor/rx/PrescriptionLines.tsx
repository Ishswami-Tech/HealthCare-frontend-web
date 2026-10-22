"use client";

import { useId } from "react";
import { Check, CircleAlert, Info, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FIELD_LABEL_SMALL } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { Medicine } from "@/types/pharmacy.types";
import {
  frequencyOptionsFor,
  quantityOf,
  stockLine,
  stockOf,
  type PrescriptionFormAction,
  type PrescriptionMedicationRow,
} from "./rx-form.logic";
import { STOCK_TONE_CLASS } from "./MedicineCatalogue";

const SMALL_FIELD = "h-[38px] rounded-[10px] px-2.5 text-[13px] font-semibold md:text-[13px]";

type RowField = Extract<PrescriptionFormAction, { type: "updateMedication" }>["field"];

/**
 * The medicine lines of a prescription: dose, one "How often" choice (how many times a day and
 * when), days and quantity. Stock sits on the same line as the name; no prices are shown.
 */
export function PrescriptionLines({
  medications,
  medicinesById,
  stockTracked,
  locked = false,
  onUpdate,
  onRemove,
}: {
  medications: PrescriptionMedicationRow[];
  medicinesById: ReadonlyMap<string, Medicine>;
  stockTracked: boolean;
  locked?: boolean;
  onUpdate: (id: string, field: RowField, value: string) => void;
  onRemove: (id: string) => void;
}) {
  const fieldId = useId();

  if (medications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-muted">
        No medicines added yet. Press Add next to a medicine in the pharmacy stock, add a kit, or speak them.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {medications.map((medication, index) => {
        const medicine = medication.medicineId ? medicinesById.get(medication.medicineId) : undefined;
        const stock = medicine ? stockOf(medicine) : 0;
        const left = stock - quantityOf(medication);
        const line = medication.medicineId && !medicine ? { label: "", tone: "none" as const } : stockLine(medicine, stockTracked);
        const rowId = `${fieldId}-${medication.id}`;
        const update = (field: RowField) => (value: string) => onUpdate(medication.id, field, value);

        return (
          <fieldset
            key={medication.id}
            disabled={locked}
            className="m-0 flex min-w-0 flex-col gap-2.5 rounded-2xl border border-line bg-[#fbfdfc] p-3.5 dark:bg-white/5"
          >
            <legend className="sr-only">Medicine {index + 1}</legend>
            <div className="flex items-start gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-xs font-extrabold text-[#065f46] dark:bg-emerald-500/15 dark:text-emerald-300">
                {index + 1}
              </span>
              {medication.medicineId ? (
                <span className="min-w-0 flex-1 break-words text-[15px] font-extrabold leading-snug text-ink">
                  {medication.name}
                  {line.label ? (
                    <span className={cn("ml-1.5 whitespace-nowrap text-xs font-bold", STOCK_TONE_CLASS[line.tone])}>· {line.label}</span>
                  ) : null}
                </span>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Input
                    aria-label={`Name of outside medicine ${index + 1}`}
                    className="h-[38px] min-w-0 flex-1 rounded-[10px] px-2.5 text-sm font-bold"
                    placeholder="Medicine name and strength"
                    value={medication.name}
                    onChange={(event) => update("name")(event.target.value)}
                  />
                  <span className="whitespace-nowrap text-xs text-ink-muted">Outside medicine</span>
                </span>
              )}
              <button
                type="button"
                aria-label={`Remove ${medication.name || `medicine ${index + 1}`}`}
                className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-[9px] border border-line bg-card text-ink-soft hover:bg-well focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
                onClick={() => onRemove(medication.id)}
              >
                <X className="size-[13px]" strokeWidth={2.6} aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1fr_1.7fr_0.6fr_0.6fr]">
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${rowId}-dose`} className={FIELD_LABEL_SMALL}>
                  Dose
                </label>
                <Input
                  id={`${rowId}-dose`}
                  className={SMALL_FIELD}
                  placeholder="e.g. 1 tablet"
                  value={medication.dosage}
                  onChange={(event) => update("dosage")(event.target.value)}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${rowId}-frequency`} className={FIELD_LABEL_SMALL}>
                  How often
                </label>
                <Select value={medication.frequency} onValueChange={update("frequency")}>
                  <SelectTrigger id={`${rowId}-frequency`} className={cn(SMALL_FIELD, "w-full data-[size=default]:h-[38px]")}>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptionsFor(medication.frequency).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${rowId}-days`} className={FIELD_LABEL_SMALL}>
                  Days
                </label>
                <Input
                  id={`${rowId}-days`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  className={SMALL_FIELD}
                  placeholder="10"
                  value={medication.days}
                  onChange={(event) => update("days")(event.target.value)}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor={`${rowId}-quantity`} className={FIELD_LABEL_SMALL}>
                  Qty
                </label>
                <Input
                  id={`${rowId}-quantity`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  className={SMALL_FIELD}
                  placeholder="1"
                  value={medication.quantity}
                  onChange={(event) => update("quantity")(event.target.value)}
                />
              </div>
            </div>

            {medicine ? (
              !stockTracked ? (
                <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-ink-muted">
                  <Info className="size-3" strokeWidth={2.6} aria-hidden="true" />
                  The pharmacy has not recorded stock for this medicine yet. It is saved on the prescription.
                </span>
              ) : left >= 0 ? (
                <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-brand">
                  <Check className="size-3" strokeWidth={2.8} aria-hidden="true" />
                  {left} left in stock after this
                </span>
              ) : (
                <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-[#b45309] dark:text-amber-300">
                  <CircleAlert className="size-3" strokeWidth={2.6} aria-hidden="true" />
                  {stock <= 0
                    ? "Not in stock. It is saved on the prescription; the pharmacy can give it once stock is added."
                    : `Only ${stock} in stock. The pharmacy cannot give ${quantityOf(medication)} yet.`}
                </span>
              )
            ) : !medication.medicineId ? (
              <span className="inline-flex items-center gap-[5px] text-xs font-semibold text-ink-muted">
                <Info className="size-3" strokeWidth={2.6} aria-hidden="true" />
                Not sent to the pharmacy. It is saved in the visit notes for the patient to buy outside.
              </span>
            ) : null}
          </fieldset>
        );
      })}
    </div>
  );
}
