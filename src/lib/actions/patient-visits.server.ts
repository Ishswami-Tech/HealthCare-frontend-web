"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  ClassicalExamFinding,
  CreateFamilyHistoryInput,
  CreateFamilyMemberInput,
  CreatePatientVisitInput,
  CreatePrakritiAssessmentInput,
  FamilyHistoryEntry,
  FamilyMember,
  PatientVisit,
  PrakritiAssessment,
  UpdateFamilyHistoryInput,
  UpdateFamilyMemberInput,
  UpdatePatientVisitInput,
  UpsertClassicalExamFindingInput,
  UpsertVisitVitalsExaminationInput,
  VisitCaseSheet,
  VisitVitalsExamination,
} from "@/types/patient-visit.types";

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

// ===== OPD VISITS =====

export async function createPatientVisit(
  clinicId: string,
  input: CreatePatientVisitInput,
): Promise<PatientVisit> {
  await requireSession();
  const { data } = await authenticatedApi<PatientVisit>(API_ENDPOINTS.PATIENT_VISITS.CREATE, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function getPatientVisit(clinicId: string, visitId: string): Promise<PatientVisit> {
  await requireSession();
  const { data } = await authenticatedApi<PatientVisit>(API_ENDPOINTS.PATIENT_VISITS.GET(visitId), {
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function updatePatientVisit(
  clinicId: string,
  visitId: string,
  input: UpdatePatientVisitInput,
): Promise<PatientVisit> {
  await requireSession();
  const { data } = await authenticatedApi<PatientVisit>(API_ENDPOINTS.PATIENT_VISITS.UPDATE(visitId), {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function listPatientVisits(
  clinicId: string,
  patientId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<{ visits: PatientVisit[]; total: number }> {
  await requireSession();
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set("limit", String(options.limit));
  if (options.offset !== undefined) params.set("offset", String(options.offset));
  const query = params.toString();
  const endpoint = `${API_ENDPOINTS.PATIENT_VISITS.LIST_BY_PATIENT(patientId)}${query ? `?${query}` : ""}`;
  const { data } = await authenticatedApi<{ visits: PatientVisit[]; total: number }>(endpoint, {
    headers: clinicHeaders(clinicId),
  });
  return data ?? { visits: [], total: 0 };
}

export async function getVisitCaseSheet(clinicId: string, visitId: string): Promise<VisitCaseSheet> {
  await requireSession();
  const { data } = await authenticatedApi<VisitCaseSheet>(
    API_ENDPOINTS.PATIENT_VISITS.CASE_SHEET(visitId),
    { headers: clinicHeaders(clinicId) },
  );
  return data;
}

export async function upsertVisitVitalsExamination(
  clinicId: string,
  visitId: string,
  input: UpsertVisitVitalsExaminationInput,
): Promise<VisitVitalsExamination> {
  await requireSession();
  const { data } = await authenticatedApi<VisitVitalsExamination>(
    API_ENDPOINTS.PATIENT_VISITS.VITALS_EXAMINATION(visitId),
    {
      method: "PUT",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

export async function upsertClassicalExamFindings(
  clinicId: string,
  visitId: string,
  findings: UpsertClassicalExamFindingInput[],
): Promise<ClassicalExamFinding[]> {
  await requireSession();
  const { data } = await authenticatedApi<ClassicalExamFinding[]>(
    API_ENDPOINTS.PATIENT_VISITS.CLASSICAL_EXAMS(visitId),
    {
      method: "PUT",
      body: JSON.stringify({ findings }),
      headers: clinicHeaders(clinicId),
    },
  );
  return data ?? [];
}

// ===== FAMILY HISTORY =====

export async function getFamilyHistory(clinicId: string, userId: string): Promise<FamilyHistoryEntry[]> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyHistoryEntry[]>(
    API_ENDPOINTS.EHR.FAMILY_HISTORY.GET_BY_USER(userId),
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? [];
}

export async function createFamilyHistory(
  clinicId: string,
  input: CreateFamilyHistoryInput,
): Promise<FamilyHistoryEntry> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyHistoryEntry>(API_ENDPOINTS.EHR.FAMILY_HISTORY.CREATE, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function updateFamilyHistory(
  clinicId: string,
  id: string,
  input: UpdateFamilyHistoryInput,
): Promise<FamilyHistoryEntry> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyHistoryEntry>(API_ENDPOINTS.EHR.FAMILY_HISTORY.UPDATE(id), {
    method: "PUT",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function deleteFamilyHistory(clinicId: string, id: string): Promise<void> {
  await requireSession();
  await authenticatedApi<void>(API_ENDPOINTS.EHR.FAMILY_HISTORY.DELETE(id), {
    method: "DELETE",
    headers: clinicHeaders(clinicId),
  });
}

// ===== FAMILY MEMBERS (dependents) =====

export async function listFamilyMembers(clinicId: string, patientId: string): Promise<FamilyMember[]> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember[]>(
    API_ENDPOINTS.FAMILY_MEMBERS.LIST_BY_PATIENT(patientId),
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? [];
}

export async function createFamilyMember(
  clinicId: string,
  input: CreateFamilyMemberInput,
): Promise<FamilyMember> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember>(API_ENDPOINTS.FAMILY_MEMBERS.CREATE, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function updateFamilyMember(
  clinicId: string,
  id: string,
  input: UpdateFamilyMemberInput,
): Promise<FamilyMember> {
  await requireSession();
  const { data } = await authenticatedApi<FamilyMember>(API_ENDPOINTS.FAMILY_MEMBERS.UPDATE(id), {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

export async function deleteFamilyMember(clinicId: string, id: string): Promise<void> {
  await requireSession();
  await authenticatedApi<void>(API_ENDPOINTS.FAMILY_MEMBERS.DELETE(id), {
    method: "DELETE",
    headers: clinicHeaders(clinicId),
  });
}

// ===== PRAKRITI (constitution) =====

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["data", "items", "records", "assessments"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

export async function getPrakritiAssessmentsForPatient(
  clinicId: string,
  patientId: string,
): Promise<PrakritiAssessment[]> {
  await requireSession();
  const { data } = await authenticatedApi<unknown>(
    API_ENDPOINTS.AYURVEDA.PRAKRITI.GET_BY_PATIENT(patientId),
    { headers: clinicHeaders(clinicId) },
  );
  return toArray<PrakritiAssessment>(data);
}

export async function createPrakritiAssessmentForPatient(
  clinicId: string,
  input: CreatePrakritiAssessmentInput,
): Promise<PrakritiAssessment> {
  await requireSession();
  const { data } = await authenticatedApi<PrakritiAssessment>(API_ENDPOINTS.AYURVEDA.PRAKRITI.CREATE, {
    method: "POST",
    body: JSON.stringify(input),
    headers: clinicHeaders(clinicId),
  });
  return data;
}

// ===== CASH PAYMENT (medicine desk) =====

export async function recordCashPrescriptionPayment(
  clinicId: string,
  prescriptionId: string,
  amount?: number,
): Promise<Record<string, unknown>> {
  await requireSession();
  const { data } = await authenticatedApi<Record<string, unknown>>(
    API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.RECORD_CASH_PAYMENT(prescriptionId),
    {
      method: "POST",
      body: JSON.stringify(amount !== undefined ? { amount } : {}),
      headers: clinicHeaders(clinicId),
    },
  );
  return data ?? {};
}
