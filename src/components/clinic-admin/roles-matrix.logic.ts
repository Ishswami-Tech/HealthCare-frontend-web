/**
 * Permission matrix of CaRoles, derived from the one role -> permission map of the app
 * (`ROLE_PERMISSIONS` in types/rbac.types.ts). Read-only: the backend has no route to store a
 * custom matrix, so the screen shows what each role can do today.
 */
import { Role } from "@/types/auth.types";
import { Permission, ROLE_PERMISSIONS } from "@/types/rbac.types";

export const MATRIX_ROLES = [
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.CLINIC_ADMIN,
  Role.RECEPTIONIST,
  Role.NURSE,
  Role.PHARMACIST,
] as const;

export type MatrixRole = (typeof MATRIX_ROLES)[number];
export type MatrixLevel = "FULL" | "VIEW" | "DRAFT" | "NONE";

export interface MatrixRow {
  group: "Clinical" | "Front desk" | "Billing" | "Pharmacy" | "Administration";
  label: string;
  /** Any of these grants full access. */
  full: Permission[];
  /** Any of these grants read-only access (when `full` is not granted). */
  view?: Permission[];
  /** Any of these grants "draft only" (the doctor approves). */
  draft?: Permission[];
  /** Product rule that overrides the map for one role (e.g. only the doctor completes a visit). */
  only?: MatrixRole;
}

export const MATRIX_ROWS: MatrixRow[] = [
  { group: "Clinical", label: "View patient EHR", full: [Permission.UPDATE_PATIENT_MEDICAL_RECORDS], view: [Permission.VIEW_PATIENT_MEDICAL_RECORDS, Permission.VIEW_MEDICAL_RECORDS] },
  { group: "Clinical", label: "Prepare prescription", full: [Permission.MANAGE_PRESCRIPTIONS], draft: [Permission.DRAFT_PRESCRIPTIONS] },
  { group: "Clinical", label: "Approve prescription", full: [Permission.REVIEW_PRESCRIPTION_DRAFTS], only: Role.DOCTOR },
  { group: "Clinical", label: "Call, start and complete a visit", full: [Permission.CALL_NEXT_PATIENT], only: Role.DOCTOR },
  { group: "Front desk", label: "Check in patients (one click)", full: [Permission.CHECK_IN_PATIENTS] },
  { group: "Front desk", label: "In-clinic queue", full: [Permission.MANAGE_QUEUE], view: [Permission.VIEW_QUEUE] },
  { group: "Front desk", label: "Book and reschedule appointments", full: [Permission.CREATE_APPOINTMENTS, Permission.UPDATE_APPOINTMENTS], view: [Permission.VIEW_APPOINTMENTS] },
  { group: "Billing", label: "View billing amounts and revenue", full: [Permission.MANAGE_BILLING, Permission.VIEW_FINANCIAL_REPORTS] },
  { group: "Billing", label: "Raise invoices and record payments", full: [Permission.CREATE_BILLS, Permission.PROCESS_PAYMENTS] },
  { group: "Pharmacy", label: "Dispense medicines", full: [Permission.DISPENSE_MEDICINES, Permission.DISPENSE_FROM_CLINIC_STOCK] },
  { group: "Pharmacy", label: "Inventory and stock", full: [Permission.MANAGE_INVENTORY], view: [Permission.VIEW_STOCK_READONLY, Permission.VIEW_PHARMACY] },
  { group: "Administration", label: "Manage staff and roles", full: [Permission.MANAGE_CLINIC_STAFF] },
  { group: "Administration", label: "Locations and clinic QR", full: [Permission.MANAGE_LOCATION_QR], view: [Permission.VIEW_CLINICS] },
  { group: "Administration", label: "Schedule, slots and holidays", full: [Permission.MANAGE_DOCTOR_SCHEDULE, Permission.MANAGE_DOCTOR_SCHEDULES] },
  { group: "Administration", label: "Reports", full: [Permission.VIEW_REPORTS] },
];

/** Billing amounts are never shown to these roles, whatever the map says. */
const BILLING_BLIND: readonly MatrixRole[] = [Role.DOCTOR, Role.ASSISTANT_DOCTOR];

export function matrixLevel(row: MatrixRow, role: MatrixRole, map: Partial<Record<Role, Permission[]>> = ROLE_PERMISSIONS): MatrixLevel {
  if (row.only && row.only !== role) return "NONE";
  if (row.group === "Billing" && BILLING_BLIND.includes(role)) return "NONE";
  const granted = new Set(map[role] ?? []);
  const any = (list?: Permission[]) => (list ?? []).some((permission) => granted.has(permission));
  if (any(row.full)) return "FULL";
  if (any(row.draft)) return "DRAFT";
  if (any(row.view)) return "VIEW";
  return "NONE";
}

export function matrixGroups(): Array<{ group: MatrixRow["group"]; rows: MatrixRow[] }> {
  const groups: Array<{ group: MatrixRow["group"]; rows: MatrixRow[] }> = [];
  for (const row of MATRIX_ROWS) {
    const existing = groups.find((entry) => entry.group === row.group);
    if (existing) existing.rows.push(row);
    else groups.push({ group: row.group, rows: [row] });
  }
  return groups;
}
