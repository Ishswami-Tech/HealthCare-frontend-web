"use client";

import { useMemo, useState } from "react";

import { PatientRecordsView } from "@/app/(dashboard)/patient/health/_components/PatientRecordsView";
import { ReportUploadDialog } from "@/app/(dashboard)/patient/health/_components/ReportUploadDialog";
import {
  asList,
  asRecord,
  buildAllergies,
  buildHistory,
  buildRecordPrescriptions,
  buildReportRows,
  buildVitalHistory,
  type UploadType,
} from "@/app/(dashboard)/patient/health/_components/patient-health.logic";
import {
  usePatientUploads,
  useUploadPatientFile,
} from "@/app/(dashboard)/patient/health/_components/usePatientUploads";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAllergies, useComprehensiveHealthRecord } from "@/hooks/query/useMedicalRecords";

type PatientMedicalRecordsProps = {
  /** True when a page already provides the page column (the hub shows this as its Records section). */
  embedded?: boolean;
};

/**
 * Records: the patient's health record (history, prescriptions, reports and files, vitals,
 * allergies, diet) from `GET ehr/comprehensive/:userId`, plus the files on their record.
 *
 * Uploading goes through `POST /patients/:id/documents`, the route the backend opens to
 * patients. The older create-record-then-attach flow (`POST /ehr/medical-records` and
 * `/ehr/medical-records/:id/upload`) is staff-only and always answered 403 for a patient.
 */
export default function PatientMedicalRecords({ embedded = false }: PatientMedicalRecordsProps) {
  const { session, isPending: authLoading } = useAuth();
  const user = session?.user;
  const userId = user?.id || "";
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: healthData, isPending, error, refetch } = useComprehensiveHealthRecord(userId);
  const { data: allergiesData } = useAllergies(userId);
  const clinicId = user?.clinicId || "";
  const { data: uploadsData } = usePatientUploads(clinicId, userId);
  const uploadFile = useUploadPatientFile();

  const model = useMemo(() => {
    // `null` = the profile is not complete yet: the record is simply empty.
    const record = asRecord(healthData);
    return {
      history: buildHistory(record.medicalHistory),
      prescriptions: buildRecordPrescriptions(record.prescriptions),
      reports: buildReportRows({
        labReports: record.labReports,
        radiologyReports: record.radiologyReports,
        uploads: [...asList(record.documents), ...asList(uploadsData)],
        userId,
      }),
      vitals: buildVitalHistory(record.vitals),
      allergies: buildAllergies(Array.isArray(allergiesData) ? allergiesData : record.allergies),
    };
  }, [healthData, allergiesData, uploadsData, userId]);

  // The layout sends a signed-out visitor to login; nothing to draw meanwhile.
  if (!authLoading && !user) {
    return null;
  }

  const handleUpload = (type: UploadType, file: File) => {
    if (!userId) return;
    uploadFile
      .mutateAsync({ clinicId, patientId: userId, type, file })
      .then(() => setUploadOpen(false))
      // The hook already tells the patient what went wrong; the dialog stays open to retry.
      .catch(() => undefined);
  };

  const content = (
    <>
      <PatientRecordsView
        isLoading={!error && healthData === undefined && (authLoading || isPending)}
        // A failed background refresh keeps the record that is already on screen.
        failed={Boolean(error) && healthData === undefined}
        onRetry={() => void refetch()}
        history={model.history}
        prescriptions={model.prescriptions}
        reports={model.reports}
        vitals={model.vitals}
        allergies={model.allergies}
        onUpload={() => setUploadOpen(true)}
      />
      <ReportUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        isUploading={uploadFile.isPending}
      />
    </>
  );

  return embedded ? content : <DashboardPageShell>{content}</DashboardPageShell>;
}
