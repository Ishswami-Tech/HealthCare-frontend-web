"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, SkeletonRows, statusLabel, statusTone, Surface } from "@/components/tbd";
import { medicineTitle } from "./rx-form.logic";
import type { Prescription } from "@/types/medical-records.types";

interface OngoingMedicinesPanelProps {
  /** The patient's current medicines, or null when nothing can be shown. */
  ongoing: OngoingMedicinesPanelData | null;
  /** The per-patient list is still loading: show a skeleton, no error noise. */
  isLoading: boolean;
  /** Per row: whether "+" may add it right now (stock rules of the current authoring mode,
   *  and the lock once the medicines reached the pharmacy). */
  canAdd: (medicine: OngoingMedicineRow) => boolean;
  onAdd: (medicine: OngoingMedicineRow) => void;
}

/** A medicine of the panel (the patient's current course). */
export interface OngoingMedicineRow {
  key: string;
  name: string;
  strength: string;
  dosage: string;
  frequency: string;
  days: string;
}

/** Which of the patient's prescriptions the rows come from. */
export interface OngoingMedicinesPanelData {
  /** "active": an open prescription; "recent": the most recent finished one. */
  source: "active" | "recent";
  /** The status of that prescription (for the pill on each row). */
  status: string;
  medicines: OngoingMedicineRow[];
}

const SOURCE_HINT: Record<OngoingMedicinesPanelData["source"], string> = {
  active: "From the patient's most recent active prescription",
  recent: "From the patient's most recent dispensed prescription",
};

const CLOSED_STATUSES = new Set(["CANCELLED", "CANCELED", "EXPIRED", "REVERSED"]);
const FINISHED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED"]);

/** "5 days" / "2 weeks" / "1 month" -> days as a number; "" when the duration has none. */
function daysFromDurationText(duration: string): string {
  const match = /(\d+)\s*(day|d|week|w|month|m)/i.exec(duration);
  if (!match) return "";
  const n = Number(match[1]);
  const unit = match[2]!.charAt(0).toLowerCase();
  const days = unit === "w" ? n * 7 : unit === "m" ? n * 30 : n;
  return Number.isFinite(days) ? String(days) : "";
}

function medicineRowsOf(prescription: Prescription | undefined | null): OngoingMedicineRow[] {
  const medications = (prescription?.medications ?? []) as Array<Record<string, unknown>>;
  return medications.map((item, index) => {
    const name = String(item.name ?? item.medicineName ?? "").trim();
    const strength = String(item.strength ?? "").trim();
    if (!name && !strength) return null;
    return {
      key: `med-${index}`,
      name: name || "Medicine",
      strength,
      dosage: String(item.dosage ?? "").trim(),
      frequency: String(item.frequency ?? "").trim(),
      days: daysFromDurationText(String(item.duration ?? "")),
    };
  }).filter((row): row is OngoingMedicineRow => row !== null);
}

/** The patient's ongoing prescription and its medicines, or null when there is nothing to show. */
export function toOngoingMedicinesPanel(
  rows: Prescription[] | undefined | null,
): OngoingMedicinesPanelData | null {
  const prescriptions = (rows ?? [])
    .filter((row) => row)
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const statusOf = (row: Prescription) => String(row.status ?? "").toUpperCase();
  const isOpen = (status: string) =>
    !CLOSED_STATUSES.has(status) && !FINISHED_STATUSES.has(status);

  const active = prescriptions.find((row) => isOpen(statusOf(row)) && medicineRowsOf(row).length > 0);
  const recent =
    active ??
    prescriptions.find((row) => FINISHED_STATUSES.has(statusOf(row)) && medicineRowsOf(row).length > 0);
  const source = active ?? recent;
  if (!source) return null;

  const medicines = medicineRowsOf(source);
  if (medicines.length === 0) return null;

  return { source: active ? "active" : "recent", status: statusOf(source), medicines };
}

/** "1 tablet · Twice a day, after meal · 10 days": dose, how often, days. "" when a row has none. */
export function ongoingMedicineSummary(medicine: OngoingMedicineRow): string {
  return [medicine.dosage, medicine.frequency, medicine.days ? `${medicine.days} days` : ""]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The patient's CURRENT / ongoing medicines, shown on the prescribe screen so the doctor sees
 * what the patient is already taking. Each row can be added to the new prescription with "+".
 * Loading shows a skeleton; an empty or failed list hides the panel entirely (no error noise on
 * a secondary panel).
 */
export function OngoingMedicinesPanel({
  ongoing,
  isLoading,
  canAdd,
  onAdd,
}: OngoingMedicinesPanelProps) {
  if (isLoading) {
    return (
      <Surface flush as="section" aria-label="Current medicines">
        <div className="px-4 py-3">
          <SkeletonRows rows={2} />
        </div>
      </Surface>
    );
  }

  if (!ongoing || ongoing.medicines.length === 0) return null;

  const rows = ongoing.medicines;

  return (
    <Surface flush as="section" aria-label="Current medicines">
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <div>
          <h3 className="m-0 text-[13px] font-bold text-ink">Patient's current medicines</h3>
          <p className="m-0 text-xs text-ink-muted">{SOURCE_HINT[ongoing.source]}</p>
        </div>
        <ul className="m-0 flex flex-col gap-2 p-0">
          {rows.map((medicine) => {
            const summary = ongoingMedicineSummary(medicine);
            return (
              <li
                key={medicine.key}
                className="flex items-center gap-2.5 rounded-[10px] border border-hair px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">
                    {medicineTitle({ name: medicine.name, strength: medicine.strength })}
                  </span>
                  {summary ? <span className="block truncate text-xs text-ink-muted">{summary}</span> : null}
                </span>
                <Pill tone={statusTone(ongoing.status)}>{statusLabel(ongoing.status)}</Pill>
                {canAdd(medicine) ? (
                  <Button
                    type="button"
                    variant="soft"
                    size="compact"
                    aria-label={`Add ${medicine.name} to the prescription`}
                    onClick={() => onAdd(medicine)}
                  >
                    <Plus aria-hidden="true" />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </Surface>
  );
}
