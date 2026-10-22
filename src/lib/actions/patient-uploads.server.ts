"use server";

import { authenticatedApi } from "./auth.server";
import {
  actionSuccess,
  caughtFailure,
  clinicHeaders,
  requireSession,
  statusFailure,
  type ActionResult,
} from "./_shared";
import { API_ENDPOINTS } from "../config/config";

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
  /** Display name (report name typed by the patient, else the file name). */
  title?: string;
  /** Name to save the file under, e.g. "Lipid profile.pdf". */
  downloadFileName?: string;
  /** Date of the report itself (yyyy-mm-dd), when the patient gave one. */
  reportDate?: string;
  fileSize?: number;
  fileType?: string;
  url?: string;
  /** Authenticated stream path (`/patients/:id/documents/:docId/content`), local disk or S3. */
  contentUrl?: string;
  recordType?: string;
  uploadedBy?: string;
  uploadedAt: string;
}

// The upload itself is NOT a server action: the browser posts multipart directly through
// `clinicApiClient.upload` (see `usePatientUploads.ts`) so files never pass through the
// Next.js server (1 MB body limit on server actions).

export async function listPatientUploads(
  clinicId: string,
  patientId: string,
): Promise<ActionResult<PatientUpload[]>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status, data } = await authenticatedApi<PatientUpload[]>(API_ENDPOINTS.PATIENTS.DOCUMENTS(patientId), {
      headers: clinicHeaders(clinicId),
    });
    return statusFailure(status, "Patient files") ?? actionSuccess(Array.isArray(data) ? data : []);
  } catch (error) {
    return caughtFailure(error);
  }
}
