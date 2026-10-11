"use client";

import { useMemo, useState } from "react";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { VisitCaseSheet } from "@/components/patient/case-sheet/VisitCaseSheet";
import { MAX_VISITS, VisitSelectorView } from "@/components/patient/case-sheet/VisitSelector";
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
import { useCreatePatientVisit, usePatientVisits } from "@/hooks/query/usePatientVisits";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { patientSummaryLine, toDoctorPatientRow } from "../../_components/doctorPatients.logic";
import { DoctorEhrView } from "./DoctorEhrView";
import { useEhrPatient } from "./useEhrPatient";
import { asRecordOrEmpty, trimmedString, unwrapList } from "@/lib/utils/coerce";

type Raw = Record<string, unknown>;

function toArray(value: unknown): Raw[] {
  return unwrapList(value, "data", "items", "records", "appointments", "history", "labs", "results") as Raw[];
}

/** The dedicated list when it has rows, otherwise the same section of the full health record. */
function preferList(primary: unknown, fallback: unknown): Raw[] {
  const rows = toArray(primary);
  return rows.length > 0 ? rows : toArray(fallback);
}

/**
 * Data for the EHR workspace at `/doctor/patients/[id]`: the patient, the OPD visits, the
 * health record and the prescription dialog. The layout is `DoctorEhrView`.
 *
 * Two ids are in play. The route `[id]` is the Patient-record id (Patient.id): visits,
 * appointments and prescriptions use it. The `/patients/:id` and `/ehr/*` routes are keyed on
 * the patient's USER id, which `useEhrPatient` resolves from the patient row.
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
  const visits = visitsQuery.data?.visits ?? [];
  // The newest visit is open until the doctor picks another one.
  const visitId = pickedVisitId ?? visits[0]?.id ?? null;

  // `patientUserId` stays "" until the patient row is found, which keeps the user-keyed queries off.
  const { patient, patientUserId, loading, failed, retry } = useEhrPatient(
    clinic,
    patientId,
    visitId,
    visitsQuery.isPending,
  );
  const patientRecord = useMemo(() => patient ?? {}, [patient]);
  const patientEntityId = trimmedString(patientRecord.id) || patientId;

  // Keyed on the patient's USER id.
  const { data: ehrData, isPending: ehrPending } = useComprehensiveHealthRecord(patientUserId);
  const { data: historyData } = usePatientMedicalRecords(clinic, patientUserId, {
    enabled: !!clinic && !!patientUserId,
  });
  const { data: vitalsData } = usePatientVitalSigns(patientUserId);
  const { data: labsData } = usePatientLabResults(patientUserId);
  // Keyed on the Patient-record id: this doctor's appointments with the patient.
  const appointmentsQuery = usePatientAppointments(patientEntityId);
  // The server has no care plan: `{ available: false, items: [], message }`, and no request is sent.
  const { data: carePlanData } = usePatientCarePlan(patientEntityId);

  const ehr = useMemo(() => asRecordOrEmpty(ehrData), [ehrData]);
  const record = useMemo(
    () => ({
      patient: patientRecord,
      ehr,
      appointments: toArray(appointmentsQuery.data),
      history: preferList(historyData, ehr.medicalHistory),
      vitals: preferList(vitalsData, ehr.vitals),
      labs: preferList(labsData, ehr.labReports),
      carePlan: toArray(carePlanData?.items),
      prescriptions: toArray(ehr.prescriptions),
    }),
    [appointmentsQuery.data, carePlanData, ehr, historyData, labsData, patientRecord, vitalsData],
  );

  const row = useMemo(() => toDoctorPatientRow(patientRecord), [patientRecord]);
  const summary = row.age === null && !row.gender ? "" : patientSummaryLine(row);
  const header = {
    name: patient ? row.name : "",
    summary,
    idLabel: patientEntityId.slice(0, 8).toUpperCase(),
    fullId: patientEntityId,
    bloodGroup:
      trimmedString(patientRecord.bloodGroup) || trimmedString(asRecordOrEmpty(patientRecord.user).bloodGroup) || trimmedString(ehr.bloodGroup),
    phone: row.phone,
    email: row.email,
  };

  const handleNewVisit = async () => {
    try {
      const visit = await createVisit.mutateAsync({ clinicId: clinic, input: { patientId: patientEntityId } });
      setPickedVisitId(visit.id);
    } catch {
      // The mutation hook shows the error.
    }
  };

  const canOpenCaseSheet = Boolean(clinic && patient && patientUserId);
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
            loading={!!clinic && visitsQuery.isPending}
            selectedVisitId={visitId}
            onSelect={setPickedVisitId}
          />
        }
        onNewVisit={clinic && patient ? () => void handleNewVisit() : undefined}
        newVisitPending={createVisit.isPending}
        onPrescribe={canPrescribe ? () => setPrescribing(true) : undefined}
        record={record}
        recordLoading={(Boolean(patientUserId) && ehrPending) || (appointmentsQuery.isPending && !appointmentsQuery.error)}
        appointmentsFailed={Boolean(appointmentsQuery.error)}
        onRetryAppointments={() => void appointmentsQuery.refetch()}
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
