/**
 * Small readers shared by the video pages around the call (waiting room, "you left the call",
 * consultation summary). They only pick display values out of an appointment record.
 */

import { asRecord, firstString } from "@/lib/utils/coerce";
import { ROUTES } from "@/lib/config/routes";
import { Role } from "@/types/auth.types";

/** The doctor's photo, when the appointment carries a usable URL. */
export function getAppointmentDoctorPhoto(appointment: unknown): string | undefined {
  const record = asRecord(appointment);
  const doctor = asRecord(record?.doctor);
  const doctorUser = asRecord(doctor?.user);
  const url = firstString(
    doctor?.profilePicture,
    doctor?.avatar,
    doctor?.photoUrl,
    doctorUser?.profilePicture,
    doctorUser?.avatar,
    record?.doctorAvatar,
  );
  return /^(https?:)?\/\//.test(url) || url.startsWith("/") ? url : undefined;
}

/** Upper-case role code with underscores ("assistant doctor" → "ASSISTANT_DOCTOR"). */
export function normalizeVideoViewerRole(role?: string | null): string {
  return String(role ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

/** The appointments list of the viewer (where the top-bar back link of the video pages goes). */
export function videoAppointmentsRoute(role?: string | null): string {
  const key = normalizeVideoViewerRole(role);
  if (key === "" || key === Role.PATIENT) return ROUTES.PATIENT_APPOINTMENTS;
  if (key === Role.DOCTOR) return ROUTES.DOCTOR_APPOINTMENTS;
  return ROUTES.SHARED_APPOINTMENTS;
}
