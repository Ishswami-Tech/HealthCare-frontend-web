export const DOCTOR_ROLES = new Set([
  "DOCTOR",
  "ASSISTANT_DOCTOR",
  "THERAPIST",
  "COUNSELOR",
])

/**
 * True for the roles that run a consultation. Accepts the role code ("ASSISTANT_DOCTOR")
 * and the label shown in the call ("Assistant Doctor").
 */
export function isDoctorRole(role: string | undefined): boolean {
  return DOCTOR_ROLES.has(
    String(role || "")
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_"),
  )
}

export function isPatientRole(role: string | undefined): boolean {
  return (
    String(role || "")
      .trim()
      .toUpperCase() === "PATIENT"
  )
}

export type VideoCallExitReason = "left" | "completed" | "dropped"

/**
 * Where a person goes after the call screen.
 * - Patient: "left" keeps the visit open (they can rejoin), "dropped" explains the call ended
 *   by itself, "completed" shows the visit summary.
 * - Doctor who leaves without completing: the dashboard, where "Complete this visit" picks it up.
 * - Everything else: `null` — keep the page's own exit route.
 */
export function getVideoCallExitRoute(
  appointmentId: string,
  role: string | undefined,
  reason: VideoCallExitReason,
): string | null {
  const meetRoute = `/meet/${encodeURIComponent(appointmentId)}`
  if (isPatientRole(role)) {
    if (reason === "completed") return `${meetRoute}/summary`
    if (reason === "dropped") return `${meetRoute}/left?reason=dropped`
    return `${meetRoute}/left`
  }
  if (isDoctorRole(role) && reason === "left") {
    return "/doctor/dashboard"
  }
  return null
}

/** True when an appointment status means the doctor has completed the visit. */
export function isCompletedVisitStatus(status: unknown): boolean {
  return (
    String(status ?? "")
      .trim()
      .toUpperCase() === "COMPLETED"
  )
}
