import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import {
  deletePatientDocument,
  listPatientDocuments,
  listVisitDocuments,
  updatePatientDocument,
} from "@/lib/actions/patient-documents.server";
import type {
  PatientDocument,
  PatientDocumentCategory,
  PatientDocumentListFilters,
  UpdatePatientDocumentInput,
  UploadPatientDocumentInput,
} from "@/types/patient-document.types";

export const patientDocumentKeys = {
  all: ["patient-documents"] as const,
  list: (clinicId: string, patientId: string) =>
    ["patient-documents", "list", clinicId, patientId] as const,
  visit: (clinicId: string, visitId: string) =>
    ["patient-documents", "visit", clinicId, visitId] as const,
};

const UPLOAD_ROUTE: Record<PatientDocumentCategory, "investigations" | "documents"> = {
  INVESTIGATION: "investigations",
  DOCUMENT: "documents",
};

/**
 * Unique id per upload attempt. The API client de-duplicates in-flight requests
 * with an identical URL + method, so without a unique query param two files
 * uploaded back-to-back would be silently merged into one request.
 */
export function newUploadId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface UploadPatientDocumentVariables {
  clinicId: string;
  category: PatientDocumentCategory;
  file: File;
  input: UploadPatientDocumentInput;
  /** See `newUploadId` — must be unique per attempt. */
  uploadId: string;
}

/** Browser-side multipart upload (not a server action). */
export async function uploadPatientDocument({
  clinicId,
  category,
  file,
  input,
  uploadId,
}: UploadPatientDocumentVariables): Promise<PatientDocument> {
  const endpoint = `${API_ENDPOINTS.PATIENT_DOCUMENTS.UPLOAD(UPLOAD_ROUTE[category])}?uploadId=${encodeURIComponent(uploadId)}`;
  const fields: Record<string, string> = { patientId: input.patientId };
  if (input.visitId) fields.visitId = input.visitId;
  if (input.subType) fields.subType = input.subType;
  if (input.title) fields.title = input.title;
  if (input.notes) fields.notes = input.notes;
  if (input.reportDate) fields.reportDate = input.reportDate;

  const response = await clinicApiClient.upload<PatientDocument>(endpoint, file, fields, {
    headers: { "X-Clinic-ID": clinicId },
  });
  if (!response.data || typeof response.data !== "object") {
    throw new Error("Upload did not return a document");
  }
  return response.data;
}

/**
 * Fetches the file bytes through the authenticated `/content` endpoint (with
 * the clinic header) for blob-URL previews. Both apps send
 * `X-Frame-Options: DENY`, so PDFs must be embedded from a `blob:` URL rather
 * than pointing an iframe at the API.
 */
export async function fetchPatientDocumentBlob(clinicId: string, documentId: string): Promise<Blob> {
  const response = await clinicApiClient.get<Blob>(
    API_ENDPOINTS.PATIENT_DOCUMENTS.CONTENT(documentId),
    undefined,
    { headers: { "X-Clinic-ID": clinicId } },
  );
  const blob = response.data;
  if (!(blob instanceof Blob)) {
    throw new Error("Unexpected response while loading the file");
  }
  return blob;
}

/** Same-origin proxy used as `<audio>`/`<video>` src so playback and seeking work. */
export function patientDocumentMediaUrl(clinicId: string, documentId: string): string {
  return `/api/patient-documents/${encodeURIComponent(documentId)}/content?clinicId=${encodeURIComponent(clinicId)}`;
}

export const usePatientDocuments = (
  clinicId: string,
  patientId: string,
  filters: PatientDocumentListFilters = {},
) =>
  useQueryData(
    [...patientDocumentKeys.list(clinicId, patientId), filters],
    async () => listPatientDocuments(clinicId, patientId, filters),
    { enabled: !!clinicId && !!patientId },
  );

export const useVisitDocuments = (
  clinicId: string,
  visitId: string,
  category?: PatientDocumentCategory,
) =>
  useQueryData(
    [...patientDocumentKeys.visit(clinicId, visitId), category ?? "ALL"],
    async () => listVisitDocuments(clinicId, visitId, category),
    { enabled: !!clinicId && !!visitId },
  );

export const useUploadPatientDocument = () =>
  useMutationOperation(
    async (variables: UploadPatientDocumentVariables) => uploadPatientDocument(variables),
    {
      toastId: "patient-document-upload",
      loadingMessage: "Uploading file...",
      successMessage: "File uploaded",
      invalidateQueries: [[...patientDocumentKeys.all]],
    },
  );

export const useUpdatePatientDocument = () =>
  useMutationOperation(
    async ({
      clinicId,
      id,
      input,
    }: {
      clinicId: string;
      id: string;
      input: UpdatePatientDocumentInput;
    }) => updatePatientDocument(clinicId, id, input),
    {
      toastId: "patient-document-update",
      loadingMessage: "Saving...",
      successMessage: "File details saved",
      invalidateQueries: [[...patientDocumentKeys.all]],
    },
  );

export const useDeletePatientDocument = () =>
  useMutationOperation(
    async ({ clinicId, id }: { clinicId: string; id: string }) => deletePatientDocument(clinicId, id),
    {
      toastId: "patient-document-delete",
      loadingMessage: "Deleting file...",
      successMessage: "File deleted",
      invalidateQueries: [[...patientDocumentKeys.all]],
    },
  );
