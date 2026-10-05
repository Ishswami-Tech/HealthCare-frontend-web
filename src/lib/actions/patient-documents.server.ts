"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  PatientDocument,
  PatientDocumentAccessUrl,
  PatientDocumentCategory,
  PatientDocumentDisposition,
  PatientDocumentListFilters,
  PatientDocumentListResult,
  UpdatePatientDocumentInput,
} from "@/types/patient-document.types";

// Uploads are NOT server actions: the browser posts multipart directly through
// `clinicApiClient.upload` (see hooks/query/usePatientDocuments.ts) so large
// files never transit the Next.js server twice.

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

export async function listPatientDocuments(
  clinicId: string,
  patientId: string,
  filters: PatientDocumentListFilters = {},
): Promise<PatientDocumentListResult> {
  await requireSession();
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.visitId) params.set("visitId", filters.visitId);
  if (filters.subType) params.set("subType", filters.subType);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));
  const query = params.toString();
  const endpoint = `${API_ENDPOINTS.PATIENT_DOCUMENTS.LIST_BY_PATIENT(patientId)}${query ? `?${query}` : ""}`;
  const { data } = await authenticatedApi<PatientDocumentListResult>(endpoint, {
    headers: clinicHeaders(clinicId),
  });
  return data ?? { documents: [], total: 0 };
}

export async function listVisitDocuments(
  clinicId: string,
  visitId: string,
  category?: PatientDocumentCategory,
): Promise<PatientDocument[]> {
  await requireSession();
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const { data } = await authenticatedApi<PatientDocument[]>(
    `${API_ENDPOINTS.PATIENT_DOCUMENTS.LIST_BY_VISIT(visitId)}${query}`,
    { headers: clinicHeaders(clinicId) },
  );
  return Array.isArray(data) ? data : [];
}

export async function getPatientDocumentAccessUrl(
  clinicId: string,
  documentId: string,
  disposition: PatientDocumentDisposition = "inline",
): Promise<PatientDocumentAccessUrl> {
  await requireSession();
  const { data } = await authenticatedApi<PatientDocumentAccessUrl>(
    `${API_ENDPOINTS.PATIENT_DOCUMENTS.URL(documentId)}?disposition=${disposition}`,
    { headers: clinicHeaders(clinicId) },
  );
  return data;
}

export async function updatePatientDocument(
  clinicId: string,
  documentId: string,
  input: UpdatePatientDocumentInput,
): Promise<PatientDocument> {
  await requireSession();
  const { data } = await authenticatedApi<PatientDocument>(
    API_ENDPOINTS.PATIENT_DOCUMENTS.UPDATE(documentId),
    {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

export async function deletePatientDocument(clinicId: string, documentId: string): Promise<void> {
  await requireSession();
  await authenticatedApi<void>(API_ENDPOINTS.PATIENT_DOCUMENTS.DELETE(documentId), {
    method: "DELETE",
    headers: clinicHeaders(clinicId),
  });
}
