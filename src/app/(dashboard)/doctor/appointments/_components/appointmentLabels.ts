import type { TransformedAppointment } from "../page";

/** "VIDEO_CALL" -> "Video call", "IN_PERSON" -> "In-clinic", anything else in sentence case. */
export function getVisitTypeLabel(type: string | null | undefined): string {
  const key = String(type ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!key) return "Consultation";
  if (key === "VIDEO_CALL" || key === "VIDEO") return "Video call";
  if (key === "IN_PERSON" || key === "IN_CLINIC") return "In-clinic";
  const text = key.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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
