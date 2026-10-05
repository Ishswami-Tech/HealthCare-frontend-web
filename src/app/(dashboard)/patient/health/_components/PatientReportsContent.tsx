"use client";

import { useMemo, useState } from "react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLabReports, useRadiologyReports } from "@/hooks/query/useMedicalRecords";
import { usePrescriptions } from "@/hooks/query/usePharmacy";
import { PatientReportsView } from "./PatientReportsView";
import { ReportUploadDialog } from "./ReportUploadDialog";
import { buildPrescriptions, buildReportRows, type UploadType } from "./patient-health.logic";
import { usePatientUploads, useUploadPatientFile } from "./usePatientUploads";

/** Reports & Lab: loads the patient's lab reports, imaging, prescriptions and uploaded files. */
export default function PatientReportsContent() {
  const { session, isPending: authLoading } = useAuth();
  const user = session?.user;
  const userId = user?.id || "";
  const [uploadOpen, setUploadOpen] = useState(false);

  const labReports = useLabReports(userId);
  const radiologyReports = useRadiologyReports(userId);
  const clinicId = user?.clinicId || "";
  const uploads = usePatientUploads(clinicId, userId);
  // Same arguments as the Medicines screen, so both read one cached list.
  const canLoadPrescriptions = !!user?.clinicId && !!user?.id;
  const prescriptions = usePrescriptions(user?.clinicId || "", {
    ...(user?.id ? { patientId: user.id } : {}),
    enabled: canLoadPrescriptions,
  });
  const uploadFile = useUploadPatientFile();

  const rows = useMemo(
    () =>
      buildReportRows({
        labReports: labReports.data,
        radiologyReports: radiologyReports.data,
        uploads: uploads.data,
        prescriptions: buildPrescriptions(prescriptions.data),
        userId,
      }),
    [labReports.data, radiologyReports.data, uploads.data, prescriptions.data, userId],
  );

  const queries = [labReports, radiologyReports, uploads, prescriptions];
  const failedCount = queries.filter((query) => query.error).length;
  // A query that cannot run (no clinic on the session) stays pending for ever: do not wait for it.
  const stillLoading = [labReports, radiologyReports, uploads, ...(canLoadPrescriptions ? [prescriptions] : [])].some(
    (query) => query.isPending && !query.error,
  );
  const isLoading = authLoading || (!!userId && stillLoading && rows.length === 0);

  const retry = () => {
    queries.forEach((query) => {
      if (query.error) void query.refetch();
    });
  };

  const handleUpload = (type: UploadType, file: File) => {
    if (!userId) return;
    uploadFile
      .mutateAsync({ clinicId, patientId: userId, type, file })
      .then(() => setUploadOpen(false))
      // The hook already tells the patient what went wrong; the dialog stays open to retry.
      .catch(() => undefined);
  };

  return (
    <DashboardPageShell>
      <PatientReportsView
        rows={rows}
        isLoading={isLoading}
        failed={failedCount === queries.length && rows.length === 0}
        partlyFailed={failedCount > 0 && failedCount < queries.length}
        onRetry={retry}
        onUpload={() => setUploadOpen(true)}
      />
      <ReportUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
        isUploading={uploadFile.isPending}
      />
    </DashboardPageShell>
  );
}
