export function buildVideoSessionRoute(appointmentId: string): string {
  return `/video-appointments/meet/${encodeURIComponent(appointmentId)}`;
}

export function buildVideoSessionMeetRoute(appointmentId: string): string {
  return `/video-appointments/meet/${encodeURIComponent(appointmentId)}`;
}

export function normalizeVideoSessionAppointmentId(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  return raw.startsWith("video-session-") ? raw.replace(/^video-session-/, "") : raw;
}

export function getVideoSessionExitRoute(role?: string): string {
  const normalizedRole = String(role || "").trim().toUpperCase();

  if (normalizedRole === "PATIENT") {
    return "/patient/appointments";
  }

  return "/video-appointments";
}
