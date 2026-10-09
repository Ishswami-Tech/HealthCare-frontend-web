"use client";

import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Kv, Note } from "@/components/tbd";
import { useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import type { VisitVitalsExamination } from "@/types/patient-visit.types";

function vitalsLine(vitals: VisitVitalsExamination | null): string {
  if (!vitals) return "";
  const parts = [
    vitals.bpSystolic !== null && vitals.bpDiastolic !== null ? `BP ${vitals.bpSystolic}/${vitals.bpDiastolic}` : "",
    vitals.pulse !== null ? `Pulse ${vitals.pulse}` : "",
    vitals.temperatureC !== null ? `Temp ${vitals.temperatureC} C` : "",
    vitals.spo2 !== null ? `SpO2 ${vitals.spo2}%` : "",
    vitals.weightKg !== null ? `Weight ${vitals.weightKg} kg` : "",
  ];
  return parts.filter(Boolean).join(" · ");
}

/**
 * Read-only summary of one OPD case sheet. Clinical notes: render this only for roles that may
 * read them (see `canViewCaseSheet`); the backend refuses everyone else.
 */
export function VisitCaseSheetSummary({ clinicId, visitId }: { clinicId: string; visitId: string }) {
  const { data, isPending, error } = useVisitCaseSheet(clinicId, visitId);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label="Loading case sheet">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Note tone="rose" icon={AlertCircle}>
        The case sheet could not be loaded.
      </Note>
    );
  }

  const { visit } = data;
  const vitals = vitalsLine(data.vitalsExamination);
  const entries: Array<[string, string]> = [
    ["Present complaints", visit.presentComplaints ?? ""],
    ["Present illness", visit.presentIllness ?? ""],
    ["Known case of", visit.knownCaseOf ?? ""],
    ["Vitals", vitals],
    ["Past history notes", visit.pastHistoryNotes ?? ""],
  ];
  const filled = entries.filter(([, value]) => value.trim().length > 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {filled.length === 0 ? (
        <p className="m-0 text-sm text-ink-muted sm:col-span-2">No notes were written in this case sheet yet.</p>
      ) : (
        filled.map(([label, value]) => <Kv key={label} label={label} value={value} strong={false} />)
      )}
      <Kv label="Medicines on record" value={String(data.medications.length)} strong={false} />
      <Kv label="Lab reports on record" value={String(data.labReports.length)} strong={false} />
    </div>
  );
}
