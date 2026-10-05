"use client";

import { useQueryData } from "@/hooks/core/useQueryData";
import { useMutationOperation } from "@/hooks/core/useMutationOperation";
import { newUploadId } from "@/hooks/query/usePatientDocuments";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import { clinicApiClient } from "@/lib/api/client";
import { listPatientUploads, type PatientUpload } from "./patient-uploads.server";
import { UPLOAD_OPTIONS, type UploadType } from "./patient-health.logic";

export const patientUploadKeys = {
  all: ["patient-uploads"] as const,
  list: (clinicId: string, patientId: string) => ["patient-uploads", "list", clinicId, patientId] as const,
};

/** Files on the patient's own record (`GET /patients/:id/documents`). */
export const usePatientUploads = (clinicId: string, patientId: string) =>
  useQueryData(patientUploadKeys.list(clinicId, patientId), async () => listPatientUploads(clinicId, patientId), {
    enabled: !!patientId,
  });

export interface UploadPatientFileVariables {
  clinicId: string;
  patientId: string;
  type: UploadType;
  file: File;
}

/**
 * Browser-side multipart upload to `POST /patients/:id/documents`.
 * The API client de-duplicates in-flight requests with the same URL and method, so every
 * attempt carries its own `uploadId`.
 */
async function uploadPatientFile({ clinicId, patientId, type, file }: UploadPatientFileVariables): Promise<PatientUpload> {
  const endpoint = `/patients/${encodeURIComponent(patientId)}/documents?uploadId=${encodeURIComponent(newUploadId())}`;
  const label = UPLOAD_OPTIONS.find((option) => option.type === type)?.label ?? "Document";
  const response = await clinicApiClient.upload<PatientUpload>(
    endpoint,
    file,
    { category: type, description: `${label} uploaded by the patient` },
    clinicId ? { headers: { "X-Clinic-ID": clinicId } } : undefined,
  );
  if (!response.data || typeof response.data !== "object") {
    throw new Error("Upload did not return a document");
  }
  return response.data;
}

export const useUploadPatientFile = () =>
  useMutationOperation(async (variables: UploadPatientFileVariables) => uploadPatientFile(variables), {
    toastId: TOAST_IDS.MEDICAL_RECORD.UPLOAD,
    loadingMessage: "Uploading file...",
    successMessage: "Report uploaded",
    errorMessage: "We could not upload this file. Please try again.",
    invalidateQueries: [[...patientUploadKeys.all], ["ehr"], ["medicalRecords"]],
  });
