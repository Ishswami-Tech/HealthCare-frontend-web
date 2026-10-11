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

/**
 * "52 years · Male". Only the parts that are known are shown; null when neither is,
 * so the caller can fall back to the phone number or print nothing.
 */
export function getPatientLine(
  appointment: Pick<TransformedAppointment, "patientAge" | "patientGender">,
): string | null {
  const age = appointment.patientAge ? `${appointment.patientAge} years` : "";
  const rawGender = String(appointment.patientGender ?? "").trim();
  const gender =
    rawGender && rawGender.toLowerCase() !== "unknown"
      ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()
      : "";
  return [age, gender].filter(Boolean).join(" · ") || null;
}

/** Phone first, then e-mail; empty when the record has neither. */
export function getPatientContact(
  appointment: Pick<TransformedAppointment, "patientPhone" | "patientEmail">,
): string {
  return appointment.patientPhone || appointment.patientEmail || "";
}

/** A list (or a plain string) from the patient record as one readable line. */
export function joinRecordList(value: string[] | string | null | undefined, empty = "None"): string {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || empty;
  }
  return value || empty;
}
