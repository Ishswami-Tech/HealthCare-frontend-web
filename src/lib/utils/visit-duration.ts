/**
 * Clinic visit lengths (same rule as the backend visit-duration.util): the clinic admin sets them
 * in `Clinic.settings.appointmentSettings` (PUT /clinics/:id); slots and bookings use them, never
 * a doctor-profile value. Doctors see them read-only ("Set by clinic admin").
 *   inPersonDurationMinutes  default 3 (legacy `appointmentDuration` counts when absent)
 *   videoDurationMinutes     default 15
 */
export const DEFAULT_IN_PERSON_VISIT_MINUTES = 3;
export const DEFAULT_VIDEO_VISIT_MINUTES = 15;
const MIN_VISIT_MINUTES = 1;
const MAX_VISIT_MINUTES = 240;

export interface ClinicVisitDurations {
  inPersonMinutes: number;
  videoMinutes: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function minutesOf(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value.trim()) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return null;
  const minutes = Math.round(parsed);
  return minutes >= MIN_VISIT_MINUTES && minutes <= MAX_VISIT_MINUTES ? minutes : null;
}

/** `clinic.settings` (whole JSON) or its `appointmentSettings` -> both lengths, defaults filled in. */
export function resolveClinicVisitDurations(settings: unknown): ClinicVisitDurations {
  const root = isRecord(settings) ? settings : {};
  const appt = isRecord(root.appointmentSettings) ? root.appointmentSettings : root;
  return {
    inPersonMinutes:
      minutesOf(appt.inPersonDurationMinutes) ?? minutesOf(appt.appointmentDuration) ?? DEFAULT_IN_PERSON_VISIT_MINUTES,
    videoMinutes: minutesOf(appt.videoDurationMinutes) ?? DEFAULT_VIDEO_VISIT_MINUTES,
  };
}
