/**
 * Small readers shared by the video pages around the call (waiting room, "you left the call",
 * consultation summary). They only pick display values out of an appointment record.
 */

type Row = Record<string, unknown>;

function asRow(value: unknown): Row | null {
  return value && typeof value === "object" ? (value as Row) : null;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** The doctor's photo, when the appointment carries a usable URL. */
export function getAppointmentDoctorPhoto(appointment: unknown): string | undefined {
  const record = asRow(appointment);
  const doctor = asRow(record?.doctor);
  const doctorUser = asRow(doctor?.user);
  const url = firstText(
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
  if (key === "" || key === "PATIENT") return "/patient/appointments";
  if (key === "DOCTOR") return "/doctor/appointments";
  return "/appointments";
}
