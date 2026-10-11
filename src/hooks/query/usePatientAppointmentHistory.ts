import { useInfiniteQuery } from "@tanstack/react-query";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";

/** The OPD visit of an appointment, as sent on `visit`. */
export interface AppointmentVisitRef {
  id: string;
  opdNumber: string;
}

export interface PatientAppointmentHistoryRow {
  id: string;
  type: string;
  status: string;
  date: string;
  time: string;
  duration: number | null;
  notes: string;
  cancellationReason: string;
  doctorName: string;
  /**
   * `null`: the appointment has no OPD visit yet. `undefined`: the server did not say
   * (older backend), so nothing may be offered that depends on it.
   */
  visit: AppointmentVisitRef | null | undefined;
}

export interface PatientAppointmentHistoryPage {
  rows: PatientAppointmentHistoryRow[];
  page: number;
  hasMore: boolean;
}

export const PATIENT_APPOINTMENT_HISTORY_KEY = "patientAppointmentHistory";
export const APPOINTMENT_HISTORY_PAGE_SIZE = 10;

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

function toVisitRef(raw: Raw): AppointmentVisitRef | null | undefined {
  if (!("visit" in raw)) return undefined;
  const visit = asRecord(raw.visit);
  const id = asText(visit.id);
  return id ? { id, opdNumber: asText(visit.opdNumber) } : null;
}

export function toAppointmentHistoryRow(value: unknown): PatientAppointmentHistoryRow {
  const raw = asRecord(value);
  const duration = Number(raw.duration);
  return {
    id: asText(raw.id),
    type: asText(raw.type) || asText(raw.treatmentType),
    status: asText(raw.status),
    date: asText(raw.date),
    time: asText(raw.time),
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
    notes: asText(raw.notes),
    cancellationReason: asText(raw.cancellationReason),
    doctorName: asText(asRecord(raw.doctor).name),
    visit: toVisitRef(raw),
  };
}

/**
 * Every appointment of one patient (video and in-person), newest first, a page at a time.
 * Clinical staff only: GET /ehr/clinic/patients/:patientId/appointments -> { data, meta }.
 */
export const usePatientAppointmentHistory = (patientId: string, enabled = true) =>
  useInfiniteQuery<PatientAppointmentHistoryPage>({
    queryKey: [PATIENT_APPOINTMENT_HISTORY_KEY, patientId],
    initialPageParam: 1,
    enabled: enabled && !!patientId,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam) || 1;
      const response = await clinicApiClient.get<unknown[]>(API_ENDPOINTS.EHR_CLINIC.PATIENT_APPOINTMENTS(patientId), {
        page,
        limit: APPOINTMENT_HISTORY_PAGE_SIZE,
      });
      const rows = (Array.isArray(response.data) ? response.data : []).map(toAppointmentHistoryRow);
      const totalPages = response.meta?.totalPages;
      const hasMore =
        typeof response.meta?.hasNext === "boolean"
          ? response.meta.hasNext
          : typeof totalPages === "number"
            ? page < totalPages
            : rows.length === APPOINTMENT_HISTORY_PAGE_SIZE;
      return { rows, page, hasMore };
    },
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
