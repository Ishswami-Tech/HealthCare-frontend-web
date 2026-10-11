import { Role } from "@/types/auth.types";

/**
 * Roles that may open an OPD case sheet (clinical notes). The backend allows exactly these on
 * GET /patient-visits/:visitId/case-sheet. Receptionists, nurses, pharmacists and patients never see it.
 */
const CASE_SHEET_ROLES: ReadonlySet<string> = new Set([
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.CLINIC_ADMIN,
  Role.SUPER_ADMIN,
]);

export function canViewCaseSheet(role: string | null | undefined): boolean {
  return CASE_SHEET_ROLES.has(String(role ?? "").toUpperCase());
}
