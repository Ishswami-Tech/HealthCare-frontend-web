import { routeFor } from "@/lib/config/tbdRoutes";

/** Links between the assistant-doctor screens (one place, so a moved route is changed once). */

function withQuery(path: string, query: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) search.set(key, value);
  const text = search.toString();
  return text ? `${path}?${text}` : path;
}

export const ASSISTANT_ROUTES = {
  dashboard: "/assistant-doctor/dashboard",
  appointments: "/assistant-doctor/appointments",
  patients: "/assistant-doctor/patients",
  queue: "/queue",
  drafts: "/assistant-doctor/drafts",
  stock: "/assistant-doctor/stock",
  dispense: "/assistant-doctor/dispense",
  patient: (patientId: string) => `/assistant-doctor/patients/${encodeURIComponent(patientId)}`,
  draft: (draftId: string) => routeFor("/assistant-doctor/drafts/[id]", { id: draftId }),
  returnedDraft: (draftId: string) => routeFor("/assistant-doctor/drafts/[id]/returned", { id: draftId }),
  visit: (appointmentId: string) => routeFor("/assistant-doctor/visit/[appointmentId]", { appointmentId }),
  /** Prepare a draft; with a patient the draft dialog opens straight away. */
  prescribe: (query: { patientId?: string; appointmentId?: string } = {}) => withQuery("/assistant-doctor/prescribe", query),
  quickRx: (query: { patientId?: string; appointmentId?: string } = {}) => withQuery("/assistant-doctor/prescribe/quick", query),
  /** Dispense to a patient (optional), or hand over the medicines of an approved prescription. */
  dispenseTo: (query: { patientId?: string } = {}) => withQuery("/assistant-doctor/dispense", query),
  dispensePrescription: (prescriptionId: string) => routeFor("/assistant-doctor/dispense/[id]", { id: prescriptionId }),
  dispenseSuccess: (dispenseId: string) => routeFor("/assistant-doctor/dispense/[id]/success", { id: dispenseId }),
} as const;

export const DOCTOR_DRAFT_ROUTES = {
  inbox: "/doctor/drafts",
  review: (draftId: string) => routeFor("/doctor/drafts/[id]", { id: draftId }),
} as const;
