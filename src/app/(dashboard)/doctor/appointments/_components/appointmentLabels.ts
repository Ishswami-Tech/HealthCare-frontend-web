import type { TransformedAppointment } from "../page";

/** "52 years · Male". Missing parts say so instead of being left blank. */
export function getPatientLine(appointment: Pick<TransformedAppointment, "patientAge" | "patientGender">): string {
  const age = appointment.patientAge ? `${appointment.patientAge} years` : "Age not set";
  const rawGender = String(appointment.patientGender ?? "").trim();
  const gender = rawGender
    ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
    : "Unknown";
  return `${age} · ${gender}`;
}

/** Phone first, then e-mail; never an empty cell. */
export function getPatientContact(
  appointment: Pick<TransformedAppointment, "patientPhone" | "patientEmail">,
): string {
  return appointment.patientPhone || appointment.patientEmail || "Not available";
}

/** A list (or a plain string) from the patient record as one readable line. */
export function joinRecordList(value: string[] | string | null | undefined, empty = "None"): string {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || empty;
  }
  return value || empty;
}
