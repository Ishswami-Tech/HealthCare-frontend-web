"use client";

import { useMemo, useState } from "react";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { PatientAppointmentHistory } from "@/components/patient/PatientAppointmentHistory";
import { VisitCaseSheet } from "@/components/patient/case-sheet/VisitCaseSheet";
import {
  MAX_VISITS,
  VisitSelectorView,
  type VisitSelectorVisit,
} from "@/components/patient/case-sheet/VisitSelector";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";
import {
  usePatientAppointments,
  usePatientCarePlan,
  usePatientLabResults,
  usePatientMedicalRecords,
  usePatientVitalSigns,
} from "@/hooks/query/usePatients";
import { usePatientAppointmentHistory } from "@/hooks/query/usePatientAppointmentHistory";
import { usePatientDirectoryEntry } from "@/hooks/query/usePatientDirectory";
import { useCreatePatientVisit, usePatientVisits } from "@/hooks/query/usePatientVisits";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { useAuthStore } from "@/stores/auth.store";
import { canViewCaseSheet } from "@/lib/utils/case-sheet-access";
import { parseIstDateTime } from "@/lib/utils/date-time";
import { Permission } from "@/types/rbac.types";
import { patientSummaryLine, toDoctorPatientRow } from "../../_components/doctorPatients.logic";
import { DoctorEhrView } from "./DoctorEhrView";
import { useEhrPatient } from "./useEhrPatient";

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function toArray(value: unknown): Raw[] {
  if (Array.isArray(value)) return value as Raw[];
  const record = asRecord(value);
  for (const key of ["data", "items", "records", "appointments", "history", "labs", "results"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as Raw[];
  }
  return [];
}

/** One line of a care plan's goals or interventions: { text, done }. */
function planItemRows(items: unknown, kind: string, planId: string): Raw[] {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item, index) => {
    const entry = asRecord(item);
    const text = asText(entry.text);
    if (!text) return [];
    return [{ id: `${planId}-${kind}-${index}`, title: text, description: entry.done === true ? `${kind} (done)` : kind }];
  });
}

/**
 * The care-plan answer is one plan ({ exists, summary, goals, interventions, ... }), while the
 * record shows a list of plan lines: one per goal and intervention, led by the summary.
 */
function carePlanRows(value: unknown): Raw[] {
  const plan = asRecord(value);
  if (plan.exists !== true) return [];
  const planId = asText(plan.id) || "care-plan";
  const summary = asText(plan.summary);
  return [
    ...(summary ? [{ id: `${planId}-summary`, title: asText(plan.title) || "Care plan", description: summary }] : []),
    ...planItemRows(plan.goals, "Goal", planId),
    ...planItemRows(plan.interventions, "Intervention", planId),
  ];
}

/** The dedicated list when it has rows, otherwise the same section of the full health record. */
function preferList(primary: unknown, fallback: unknown): Raw[] {
  const rows = toArray(primary);
  return rows.length > 0 ? rows : toArray(fallback);
}

type VisitListItem = VisitSelectorVisit;

/** Visits from the list, plus visits only known from appointments; newest first, one per id. */
function mergeVisits(
  listed: VisitListItem[],
  pages: ReadonlyArray<{ rows: ReadonlyArray<{ date: string; time: string; visit: { id: string; opdNumber: string } | null | undefined }> }>,
): VisitListItem[] {
  const byId = new Map<string, VisitListItem>(listed.map((visit) => [visit.id, visit]));
  for (const page of pages) {
    for (const row of page.rows) {
      if (!row.visit || byId.has(row.visit.id)) continue;
      const when = parseIstDateTime(row.date, row.time);
      byId.set(row.visit.id, {
        id: row.visit.id,
        opdNumber: row.visit.opdNumber,
        registrationDate: when ? when.toISOString() : row.date,
      });
    }
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime(),
  );
}

/**
 * Data for the EHR workspace at `/doctor/patients/[id]`: the patient, the OPD visits, the
 * health record and the prescription dialog. The layout is `DoctorEhrView`.
 */
export function DoctorEhrContent({ patientId }: { patientId: string }) {
  const { clinicId } = useClinicContext();
  const clinic = clinicId || "";
  const { hasPermission } = useRBAC();
  // Prescription.doctorId is the Doctor entity id, not the signed-in user's id.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(clinic);
  const [pickedVisitId, setPickedVisitId] = useState<string | null>(null);
  const [prescribing, setPrescribing] = useState(false);

  const visitsQuery = usePatientVisits(clinic, patientId, { limit: MAX_VISITS });
  const createVisit = useCreatePatientVisit();
  const role = useAuthStore((state) => state.session?.user?.role);
  const caseSheetAllowed = canViewCaseSheet(role);

  // The visits list plus the visits linked from appointments: an appointment's draft visit
  // counts even when the list has not caught up, so the header never says "none" wrongly.
  const appointmentHistory = usePatientAppointmentHistory(patientId);
  const visits = useMemo(
    () => mergeVisits(visitsQuery.data?.visits ?? [], appointmentHistory.data?.pages ?? []),
    [visitsQuery.data, appointmentHistory.data],
  );
  const visitsLoading = visitsQuery.isPending || (visits.length === 0 && appointmentHistory.isPending);
  // The newest visit is open until the doctor picks another one.
  const visitId = pickedVisitId ?? visits[0]?.id ?? null;

  const { patient, loading, failed, retry } = useEhrPatient(clinic, patientId, visitId, visitsQuery.isPending);
  const patientRecord = useMemo(() => patient ?? {}, [patient]);
  const patientEntityId = asText(patientRecord.id) || patientId;
  // EHR routes are keyed by the patient's user id.
  const patientUserId = patient
    ? asText(patientRecord.userId) || asText(asRecord(patientRecord.user).id) || patientId
    : "";

  const { data: ehrData, isPending: ehrPending } = useComprehensiveHealthRecord(patientUserId);
  const { data: appointmentsData } = usePatientAppointments(patientId);
  const { data: historyData } = usePatientMedicalRecords(clinic, patientUserId, {
    enabled: !!clinic && !!patientUserId,
  });
  const { data: vitalsData } = usePatientVitalSigns(patientUserId);
  const { data: labsData } = usePatientLabResults(patientUserId);
  const { data: carePlanData } = usePatientCarePlan(patientId);

  const ehr = useMemo(() => asRecord(ehrData), [ehrData]);
  const record = useMemo(
    () => ({
      patient: patientRecord,
      ehr,
      appointments: toArray(appointmentsData),
      history: preferList(historyData, ehr.medicalHistory),
      vitals: preferList(vitalsData, ehr.vitals),
      labs: preferList(labsData, ehr.labReports),
      carePlan: preferList(carePlanRows(carePlanData), ehr.carePlan ?? ehr.carePlans),
      prescriptions: toArray(ehr.prescriptions),
    }),
    [appointmentsData, carePlanData, ehr, historyData, labsData, patientRecord, vitalsData],
  );

  // UHID and the contact details kept outside the login (imported patients have no login phone).
  const { data: directoryEntry } = usePatientDirectoryEntry(clinic, patientId);
  const row = useMemo(() => toDoctorPatientRow(patientRecord), [patientRecord]);
  const summary = row.age === null && !row.gender ? "" : patientSummaryLine(row);
  const header = {
    name: patient ? row.name : "",
    summary,
    idLabel: patientEntityId.slice(0, 8).toUpperCase(),
    fullId: patientEntityId,
    uhid: directoryEntry?.uhid ?? "",
    bloodGroup:
      asText(patientRecord.bloodGroup) || asText(asRecord(patientRecord.user).bloodGroup) || asText(ehr.bloodGroup),
    phone: row.phone || directoryEntry?.phone || "",
    email: row.email || directoryEntry?.email || "",
  };

  const handleNewVisit = async () => {
    try {
      const visit = await createVisit.mutateAsync({ clinicId: clinic, input: { patientId: patientEntityId } });
      setPickedVisitId(visit.id);
    } catch {
      // The mutation hook shows the error.
    }
  };

  const canOpenCaseSheet = Boolean(clinic && patient && patientUserId && caseSheetAllowed);
  const canPrescribe = Boolean(patient) && hasPermission(Permission.MANAGE_PRESCRIPTIONS);

  return (
    <>
      <DoctorEhrView
        loading={loading}
        failed={failed}
        onRetry={retry}
        header={header}
        visitSelector={
          <VisitSelectorView
            visits={visits}
            loading={!!clinic && visitsLoading}
            selectedVisitId={visitId}
            onSelect={setPickedVisitId}
          />
        }
        onNewVisit={clinic && patient ? () => void handleNewVisit() : undefined}
        newVisitPending={createVisit.isPending}
        onPrescribe={canPrescribe ? () => setPrescribing(true) : undefined}
        record={record}
        recordLoading={Boolean(patientUserId) && ehrPending}
        renderAppointmentHistory={
          clinic && patient
            ? (openTab) => (
                <PatientAppointmentHistory
                  clinicId={clinic}
                  patientId={patientEntityId}
                  caseSheetAllowed={caseSheetAllowed}
                  onOpenTab={openTab}
                  onOpenVisit={(id) => {
                    setPickedVisitId(id);
                    openTab("history");
                  }}
                />
              )
            : undefined
        }
        caseSheet={
          canOpenCaseSheet && visitId ? (
            <VisitCaseSheet
              clinicId={clinic}
              patientId={patientEntityId}
              patientUserId={patientUserId}
              visitId={visitId}
            />
          ) : canOpenCaseSheet ? (
            <div className="rounded-[20px] border border-dashed border-line bg-card px-5 py-8 text-center text-sm text-ink-muted">
              No OPD visit yet. Use “New OPD visit” above to open a case sheet.
            </div>
          ) : undefined
        }
      />

      {prescribing && patient ? (
        <QuickPrescriptionModal
          isOpen
          onClose={() => setPrescribing(false)}
          patientId={patientEntityId}
          patientName={row.name}
          doctorId={doctorEntityId}
          {...(summary ? { patientSummary: summary } : {})}
        />
      ) : null}
    </>
  );
}
