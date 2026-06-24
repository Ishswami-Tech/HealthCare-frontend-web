/**
 * Response shape for `GET /api/patients/me/dashboard-summary`.
 *
 * Mirrors the backend `PatientDashboardSummaryDto`. Sub-fields are
 * optional because any one sub-call can fail without failing the whole
 * summary — the frontend renders whatever is available.
 */
export interface PatientDashboardSummaryResponse {
  /** ISO 8601 timestamp when this summary was generated. */
  generatedAt: string;

  /** Sub-calls that failed during composition. Keyed by sub-call name. */
  errors?: Record<string, string>;

  /** Non-terminal appointments (SCHEDULED / CONFIRMED / IN_PROGRESS). */
  appointments?: unknown[];

  /** Active prescriptions belonging to the patient. */
  prescriptions?: unknown[];

  /** Comprehensive EHR summary (vitals, allergies, medications, etc). */
  comprehensive?: unknown;

  /** User invoices (OPEN + OVERDUE + recent paid), newest first. */
  invoices?: unknown[];

  /** User payments, newest first. */
  payments?: unknown[];
}