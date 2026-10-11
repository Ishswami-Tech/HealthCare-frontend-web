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
}

/**
 * Browser-side multipart upload to `POST /patients/:id/documents`.
 * The API client de-duplicates in-flight requests with the same URL and method, so every
 * attempt carries its own `uploadId`.
 */
async function uploadPatientFile({ clinicId, patientId, type, file }: UploadPatientFileVariables): Promise<PatientUpload> {
  const endpoint = `${API_ENDPOINTS.PATIENTS.DOCUMENTS(patientId)}?uploadId=${encodeURIComponent(newUploadId())}`;
  const label = UPLOAD_OPTIONS.find((option) => option.type === type)?.label ?? "Document";
  const response = await clinicApiClient.upload<PatientUpload>(
    endpoint,
    file,
    { category: type, description: `${label} uploaded by the patient` },
    clinicId ? { headers: clinicHeaders(clinicId) } : undefined,
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
    // An upload shows up in the patient's own file list, in the full health record
    // (`documents`) and in the patient's medical-record list; nothing else reads it.
    invalidateQueries: [[...patientUploadKeys.all], ["ehr", "comprehensive"], ["medicalRecords", "patient"]],
  });
