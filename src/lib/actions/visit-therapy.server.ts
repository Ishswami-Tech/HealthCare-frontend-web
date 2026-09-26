"use server";

import { authenticatedApi, getServerSession } from "./auth.server";
import { API_ENDPOINTS } from "../config/config";
import type {
  CreateTherapyPlanInput,
  RecordTherapySessionInput,
  TherapistOption,
  TherapyProgress,
  TherapyWorkItem,
  UpdateTherapyPlanInput,
  UpdateTherapySessionInput,
  VisitTherapyPlan,
  VisitTherapySession,
} from "@/types/visit-therapy.types";

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

function clinicHeaders(clinicId: string): Record<string, string> {
  return clinicId ? { "X-Clinic-ID": clinicId } : {};
}

// ===== THERAPY PLANS =====

export async function listVisitTherapyPlans(
  clinicId: string,
  visitId: string,
): Promise<VisitTherapyPlan[]> {
  await requireSession();
  const { data } = await authenticatedApi<VisitTherapyPlan[]>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_PLANS(visitId),
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? [];
}

export async function createVisitTherapyPlan(
  clinicId: string,
  visitId: string,
  input: CreateTherapyPlanInput,
): Promise<VisitTherapyPlan> {
  await requireSession();
  const { data } = await authenticatedApi<VisitTherapyPlan>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_PLANS(visitId),
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

export async function updateVisitTherapyPlan(
  clinicId: string,
  planId: string,
  input: UpdateTherapyPlanInput,
): Promise<VisitTherapyPlan> {
  await requireSession();
  const { data } = await authenticatedApi<VisitTherapyPlan>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_PLAN(planId),
    {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

// ===== THERAPY SESSIONS =====

export async function recordTherapySession(
  clinicId: string,
  planId: string,
  input: RecordTherapySessionInput,
): Promise<VisitTherapyPlan> {
  await requireSession();
  const { data } = await authenticatedApi<VisitTherapyPlan>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_SESSIONS(planId),
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

export async function updateTherapySession(
  clinicId: string,
  sessionId: string,
  input: UpdateTherapySessionInput,
): Promise<VisitTherapySession> {
  await requireSession();
  const { data } = await authenticatedApi<VisitTherapySession>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_SESSION(sessionId),
    {
      method: "PATCH",
      body: JSON.stringify(input),
      headers: clinicHeaders(clinicId),
    },
  );
  return data;
}

// ===== PROGRESS / WORK LIST / PICKER =====

export async function getTherapyProgress(
  clinicId: string,
  patientId: string,
): Promise<TherapyProgress> {
  await requireSession();
  const { data } = await authenticatedApi<TherapyProgress>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPY_PROGRESS(patientId),
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? { plans: [], totals: { planned: 0, completed: 0 }, vitalsSeries: [] };
}

export async function listMyTherapySessions(
  clinicId: string,
  date?: string,
): Promise<TherapyWorkItem[]> {
  await requireSession();
  const query = date ? `?${new URLSearchParams({ date }).toString()}` : "";
  const { data } = await authenticatedApi<TherapyWorkItem[]>(
    `${API_ENDPOINTS.PATIENT_VISITS.THERAPY_MY_SESSIONS}${query}`,
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? [];
}

export async function listTherapists(clinicId: string): Promise<TherapistOption[]> {
  await requireSession();
  const { data } = await authenticatedApi<TherapistOption[]>(
    API_ENDPOINTS.PATIENT_VISITS.THERAPISTS,
    { headers: clinicHeaders(clinicId) },
  );
  return data ?? [];
}
