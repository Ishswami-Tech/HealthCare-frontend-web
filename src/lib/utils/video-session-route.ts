export function buildVideoSessionRoute(appointmentId: string): string {
  return `/video-appointments/${encodeURIComponent(appointmentId)}`;
}
