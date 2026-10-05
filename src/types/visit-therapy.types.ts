/**
 * Therapy / Panchakarma plans and sessions for an OPD visit.
 * Mirrors `HealthCareBackend/src/libs/dtos/visit-therapy.dto.ts`.
 */

export const THERAPY_PROCEDURES = [
  "ABHYANGA",
  "SWEDANA",
  "BASTI",
  "VIRECHANA",
  "NASYA",
  "RAKTAMOKSHANA",
  "SHIRODHARA",
  "AGNIKARMA",
  "VIDDHAKARMA",
  "PANCHAKARMA",
  "THERAPY",
] as const;

export type TherapyProcedure = (typeof THERAPY_PROCEDURES)[number];

export const THERAPY_PROCEDURE_LABELS: Record<TherapyProcedure, string> = {
  ABHYANGA: "Abhyanga (oil massage)",
  SWEDANA: "Swedana (sudation)",
  BASTI: "Basti (enema)",
  VIRECHANA: "Virechana (purgation)",
  NASYA: "Nasya (nasal)",
  RAKTAMOKSHANA: "Raktamokshana (bloodletting)",
  SHIRODHARA: "Shirodhara",
  AGNIKARMA: "Agnikarma",
  VIDDHAKARMA: "Viddhakarma",
  PANCHAKARMA: "Panchakarma (course)",
  THERAPY: "Other therapy",
};

export const THERAPY_STATUSES = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "PAUSED",
] as const;

export type TherapyStatus = (typeof THERAPY_STATUSES)[number];

export const THERAPY_STATUS_LABELS: Record<TherapyStatus, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PAUSED: "Paused",
};

export interface VisitTherapySession {
  id: string;
  planId: string;
  visitId: string;
  clinicId: string;
  sessionNumber: number;
  sessionDate: string;
  durationMinutes: number | null;
  observations: string | null;
  patientResponse: string | null;
  painScore: number | null;
  status: TherapyStatus;
  performedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistRef {
  userId: string;
  name: string;
}

export interface VisitTherapyPlan {
  id: string;
  visitId: string;
  opdNumber: string | null;
  patientId: string;
  clinicId: string;
  /** Any TreatmentType value; the picker only offers THERAPY_PROCEDURES. */
  procedure: TherapyProcedure | string;
  procedureLabel: string | null;
  plannedSessions: number;
  completedSessions: number;
  frequency: string | null;
  startDate: string;
  endDate: string | null;
  therapistUserId: string | null;
  therapist: TherapistRef | null;
  medicinesUsed: string | null;
  notes: string | null;
  status: TherapyStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: VisitTherapySession[];
}

/** A plan on the therapist's work list, with the patient it belongs to. */
export interface TherapyWorkItem extends VisitTherapyPlan {
  patientName: string | null;
  patientPhone: string | null;
}

export interface TherapyProgressVitalsPoint {
  visitId: string;
  opdNumber: string;
  date: string;
  painScore: number | null;
  weightKg: number | null;
  bmi: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
}

export interface TherapyProgress {
  plans: VisitTherapyPlan[];
  totals: { planned: number; completed: number };
  vitalsSeries: TherapyProgressVitalsPoint[];
}

export interface TherapistOption {
  userId: string;
  name: string;
  phone?: string | null;
}

export interface CreateTherapyPlanInput {
  procedure: TherapyProcedure | string;
  procedureLabel?: string;
  plannedSessions: number;
  frequency?: string;
  /** ISO date or YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  therapistUserId?: string;
  medicinesUsed?: string;
  notes?: string;
}

export interface UpdateTherapyPlanInput {
  procedure?: TherapyProcedure | string;
  procedureLabel?: string;
  plannedSessions?: number;
  frequency?: string;
  startDate?: string;
  /** Empty string clears the end date. */
  endDate?: string;
  /** Empty string unassigns the therapist. */
  therapistUserId?: string;
  medicinesUsed?: string;
  notes?: string;
  status?: TherapyStatus;
}

export interface RecordTherapySessionInput {
  /** Defaults to now on the server. */
  sessionDate?: string;
  durationMinutes?: number;
  observations?: string;
  patientResponse?: string;
  painScore?: number;
}

export interface UpdateTherapySessionInput {
  sessionDate?: string;
  durationMinutes?: number;
  observations?: string;
  patientResponse?: string;
  painScore?: number;
  status?: TherapyStatus;
}

export function therapyProcedureLabel(plan: Pick<VisitTherapyPlan, "procedure" | "procedureLabel">): string {
  if (plan.procedureLabel?.trim()) return plan.procedureLabel.trim();
  const known = THERAPY_PROCEDURE_LABELS[plan.procedure as TherapyProcedure];
  if (known) return known;
  return plan.procedure
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
