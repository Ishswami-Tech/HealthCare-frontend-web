export function buildVideoSessionRoute(appointmentId: string): string {
  return `/video-appointments/${encodeURIComponent(appointmentId)}`;
}

export function normalizeVideoSessionAppointmentId(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  return raw.startsWith("video-session-") ? raw.replace(/^video-session-/, "") : raw;
}
