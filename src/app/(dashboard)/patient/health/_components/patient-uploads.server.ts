"use server";

import { authenticatedApi, getServerSession } from "@/lib/actions/auth.server";

/**
 * Files a patient keeps on their own record.
 *
 * Backend: `PatientsController` — `GET /patients/:id/documents` and
 * `POST /patients/:id/documents` both allow the PATIENT role and check that the record is the
 * caller's own (`:id` may be the patient id or the user id).
 * The staff routes under `/patient-documents` and `/ehr/medical-records` do not allow patients.
 */
export interface PatientUpload {
  id: string;
  category: string;
  description?: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  url?: string;
  recordType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

// The upload itself is NOT a server action: the browser posts multipart directly through
// `clinicApiClient.upload` (see usePatientUploads.ts) so files never pass through the
// Next.js server (1 MB body limit on server actions).

export async function listPatientUploads(clinicId: string, patientId: string): Promise<PatientUpload[]> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }

  const { data } = await authenticatedApi<PatientUpload[]>(
    `/patients/${encodeURIComponent(patientId)}/documents`,
    { headers: clinicId ? { "X-Clinic-ID": clinicId } : {} },
  );
  return Array.isArray(data) ? data : [];
}
