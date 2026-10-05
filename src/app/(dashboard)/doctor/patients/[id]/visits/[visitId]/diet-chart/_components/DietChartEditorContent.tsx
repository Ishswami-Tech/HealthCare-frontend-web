"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DietChartPanel } from "@/components/patient/case-sheet/DietChartPanel";
import { Note } from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useVisitCaseSheet } from "@/hooks/query/usePatientVisits";
import { formatDateInIST } from "@/lib/utils/date-time";
import { DietChartEditorHeader } from "./DietChartEditorHeader";

interface DietChartEditorContentProps {
  patientId: string;
  visitId: string;
}

/** Data for the diet chart page: who the patient is and which visit, then the editor. */
export function DietChartEditorContent({ patientId, visitId }: DietChartEditorContentProps) {
  const { clinicId } = useClinicContext();
  const { data: caseSheet, isPending, error } = useVisitCaseSheet(clinicId || "", visitId);
  const visit = caseSheet?.visit;
  const patient = caseSheet?.patient;

  return (
    <DashboardPageShell>
      <DietChartEditorHeader
        backHref={`/doctor/patients/${patientId}`}
        isLoading={isPending}
        patientName={patient?.name || "Patient"}
        age={patient?.age ?? null}
        gender={patient?.gender ?? null}
        opdNumber={visit?.opdNumber ?? null}
        visitDate={visit?.registrationDate ? formatDateInIST(visit.registrationDate) : ""}
      />
      {error ? <Note tone="rose">Could not load the visit. {error.message}</Note> : null}
      <DietChartPanel clinicId={clinicId || ""} patientId={patientId} visitId={visitId} />
    </DashboardPageShell>
  );
}
