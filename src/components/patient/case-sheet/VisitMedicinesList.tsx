"use client";

import { Pill as PillIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Note } from "@/components/tbd";
import type { VisitCaseSheet } from "@/types/patient-visit.types";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/**
 * The medicines the patient is currently on (active, from anywhere), read from `medications`
 * of the visit's case sheet — no fetch of its own, so it shows whenever that sheet is loaded.
 */
export function VisitMedicinesList({ caseSheet }: { caseSheet?: VisitCaseSheet }) {
  const medicines = (caseSheet?.medications ?? []).map((raw) => {
    const record = asRecord(raw);
    const name = asText(record.name) || "Unknown medicine";
    const details = [asText(record.dosage), asText(record.frequency)].filter(Boolean).join(" · ");
    const endDate = asText(record.endDate);
    const duration = endDate ? `until ${endDate.slice(0, 10)}` : "";
    return { key: asText(record.id) || name, name, details: [details, duration].filter(Boolean).join(" · "), duration };
  });

  if (!caseSheet) {
    return (
      <div className="flex flex-col gap-1.5" role="status" aria-label="Loading medicines">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-44 rounded" />
      </div>
    );
  }
  if (medicines.length === 0) {
    return <Note tone="blue" icon={PillIcon}>No current medicines on the patient's record.</Note>;
  }
  return (
    <ul className="m-0 list-none p-0">
      {medicines.map((medicine) => (
        <li key={medicine.key} className="border-b border-hair py-2 text-[13px] first:pt-0 last:border-b-0 last:pb-0">
          <span className="font-bold text-ink">{medicine.name}</span>
          {medicine.details ? <span className="text-ink-muted"> · {medicine.details}</span> : null}
        </li>
      ))}
    </ul>
  );
}
