"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { newUploadId } from "./usePatientDocuments";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { UPLOAD_OPTIONS, type UploadType } from "@/components/patient/health/patient-health.logic";
import { listPatientUploads, type PatientUpload } from "@/lib/actions/patient-uploads.server";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { clinicHeaders } from "@/lib/utils/clinic-id";

export const patientUploadKeys = {
  all: ["patient-uploads"] as const,
  list: (clinicId: string, patientId: string) => ["patient-uploads", "list", clinicId, patientId] as const,
};

/** Files on the patient's own record (`GET /patients/:id/documents`). */
export const usePatientUploads = (clinicId: string, patientId: string) =>
  useQueryData(
    patientUploadKeys.list(clinicId, patientId),
    async () => {
      const result = await listPatientUploads(clinicId, patientId);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch your files");
      }
      return result.data;
    },
    { enabled: !!patientId },
  );

export interface UploadPatientFileVariables {
  clinicId: string;
  patientId: string;
  type: UploadType;
  file: File;
  /** Note for the doctor; the default line says what kind of file it is. */
  description?: string;
  /** Report name (stored as the document title instead of the file name). */
  title?: string;
  /** Date of the report itself, yyyy-mm-dd (not the upload date). */
  reportDate?: string;
}

/**
 * Browser-side multipart upload to `POST /patients/:id/documents`.
 * The API client de-duplicates in-flight requests with the same URL and method, so every
 * attempt carries its own `uploadId`.
 */
async function uploadPatientFile({
  clinicId,
  patientId,
  type,
  file,
  description,
  title,
  reportDate,
}: UploadPatientFileVariables): Promise<PatientUpload> {
  const endpoint = `${API_ENDPOINTS.PATIENTS.DOCUMENTS(patientId)}?uploadId=${encodeURIComponent(newUploadId())}`;
  const label = UPLOAD_OPTIONS.find((option) => option.type === type)?.label ?? "Document";
  const response = await clinicApiClient.upload<PatientUpload>(
    endpoint,
    file,
    {
      category: type,
      description: description || `${label} uploaded by the patient`,
      ...(title ? { title } : {}),
      ...(reportDate ? { reportDate } : {}),
    },
    clinicId ? { headers: clinicHeaders(clinicId) } : undefined,
  );
  if (!response.data || typeof response.data !== "object") {
    throw new Error("Upload did not return a document");
  }
  return response.data;
}

export interface DeletePatientFileVariables {
  clinicId: string;
  patientId: string;
  documentId: string;
}

/** `DELETE /patients/:id/documents/:documentId`: a patient may delete only files they uploaded. */
export const useDeletePatientFile = () =>
  useMutationOperation(
    async ({ clinicId, patientId, documentId }: DeletePatientFileVariables) => {
      const id = documentId.trim();
      if (!id) throw new Error("Choose a report to delete");
      await clinicApiClient.delete(
        `${API_ENDPOINTS.PATIENTS.DOCUMENTS(patientId)}/${encodeURIComponent(id)}`,
        clinicId ? { headers: clinicHeaders(clinicId) } : undefined,
      );
      return { id };
    },
    {
      toastId: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
      loadingMessage: "Deleting report...",
      successMessage: "Report deleted",
      errorMessage: "We could not delete this report. Please try again.",
      invalidateQueries: [[...patientUploadKeys.all], ["ehr", "comprehensive"], ["medicalRecords", "patient"]],
    },
  );

export const useUploadPatientFile = () =>
  useMutationOperation(async (variables: UploadPatientFileVariables) => uploadPatientFile(variables), {
    toastId: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
    loadingMessage: "Uploading file...",
    successMessage: "Report uploaded",
    errorMessage: "We could not upload this file. Please try again.",
    // An upload shows up in the patient's own file list, in the full health record
    // (`documents`) and in the patient's medical-record list; nothing else reads it.
    invalidateQueries: [[...patientUploadKeys.all], ["ehr", "comprehensive"], ["medicalRecords", "patient"]],
  });

/**
 * Bytes of a file on the patient's record through the authenticated
 * `GET /patients/:id/documents/:documentId/content` stream (local disk or S3), so a
 * download never depends on a public storage URL.
 */
export async function fetchPatientFileBlob(contentUrl: string, clinicId?: string | null): Promise<Blob> {
  const response = await clinicApiClient.get<Blob | string>(
    contentUrl,
    undefined,
    clinicId ? { headers: clinicHeaders(clinicId) } : undefined,
  );
  const data = response.data;
  if (data instanceof Blob) return data;
  if (typeof data === "string") return new Blob([data], { type: "text/plain" });
  throw new Error("Unexpected response while loading the file");
}
