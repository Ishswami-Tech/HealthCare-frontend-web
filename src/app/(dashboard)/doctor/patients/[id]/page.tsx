"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PatientClinicalRecordView } from "@/components/patient/PatientClinicalRecordView";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  usePatientAppointments,
  usePatientCarePlan,
  usePatientLabResults,
  usePatientMedicalRecords,
  usePatientVitalSigns,
  usePatient,
} from "@/hooks/query/usePatients";
import { useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";

type PatientRecord = Record<string, any>;

function toArray(value: unknown): PatientRecord[] {
  if (Array.isArray(value)) return value as PatientRecord[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "appointments", "history", "labs", "results"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as PatientRecord[];
    }
  }
  return [];
}

function getDisplayName(patient?: PatientRecord | null): string {
  return (
    patient?.name ||
    `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
    patient?.user?.name ||
    `${patient?.user?.firstName || ""} ${patient?.user?.lastName || ""}`.trim() ||
    patient?.email ||
    patient?.user?.email ||
    "Patient Record"
  );
}

export default function DoctorPatientDetailPage() {
  const params = useParams<{ id?: string }>();
  const patientId = String(params?.id || "").trim();
  const { clinicId } = useClinicContext();

  const { data: patient, isPending: patientPending, error: patientError } = usePatient(
    clinicId || "",
    patientId
  );

  const patientRecord = (patient || {}) as PatientRecord;
  const patientUserId = String(patientRecord.userId || patientRecord.user?.id || patientId || "").trim();

  const { data: ehrData } = useComprehensiveHealthRecord(patientUserId);
  const { data: appointmentsData } = usePatientAppointments(patientId);
  const { data: historyData } = usePatientMedicalRecords(clinicId || "", patientId, {
    enabled: !!clinicId && !!patientId,
  });
  const { data: vitalsData } = usePatientVitalSigns(patientId);
  const { data: labsData } = usePatientLabResults(patientId);
  const { data: carePlanData } = usePatientCarePlan(patientId);

  const displayName = getDisplayName(patientRecord);
  const appointments = useMemo(() => toArray(appointmentsData), [appointmentsData]);
  const history = useMemo(() => toArray(historyData), [historyData]);
  const vitals = useMemo(() => toArray(vitalsData), [vitalsData]);
  const labs = useMemo(() => toArray(labsData), [labsData]);
  const carePlanItems = useMemo(() => toArray(carePlanData), [carePlanData]);
  const ehrRecord = (ehrData || {}) as PatientRecord;

  const isLoading = patientPending && !patient;
  const hasError = Boolean(patientError);

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Patients"
        title={displayName}
        description="End-to-end clinical record with appointments, EHR history, labs, vitals, and medications."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Patient ID: {patientId || "Unavailable"}</span>
            {patientRecord.gender ? <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{String(patientRecord.gender)}</span> : null}
            {patientRecord.bloodGroup ? <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">{String(patientRecord.bloodGroup)}</span> : null}
          </div>
        }
        actions={[
          {
            label: "Back to Patients",
            href: "/doctor/patients",
            variant: "outline",
            icon: <ArrowLeft className="h-4 w-4" />,
          },
        ]}
      />

      {hasError ? (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">Patient record not available</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                The backend returned an error while loading this patient. The ID may be invalid or the patient may not belong to your clinic.
              </p>
            </div>
            <Button asChild variant="outline">
              <a href="/doctor/patients">Return to patient list</a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!hasError && isLoading ? (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">Loading patient record...</CardContent>
        </Card>
      ) : null}

      {!hasError && !isLoading ? (
        <PatientClinicalRecordView
          patient={patientRecord}
          ehr={ehrRecord}
          appointments={appointments}
          history={history}
          vitals={vitals}
          labs={labs}
          carePlan={carePlanItems}
          className="mt-6"
        />
      ) : null}
    </DashboardPageShell>
  );
}
