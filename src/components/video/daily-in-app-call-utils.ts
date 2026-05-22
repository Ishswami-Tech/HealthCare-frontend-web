export const DOCTOR_ROLES = new Set([
  "DOCTOR",
  "ASSISTANT_DOCTOR",
  "THERAPIST",
  "COUNSELOR",
])

export function isDoctorRole(role: string | undefined): boolean {
  return DOCTOR_ROLES.has(
    String(role || "")
      .toUpperCase()
      .trim(),
  )
}
