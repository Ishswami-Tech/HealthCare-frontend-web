/**
 * One medicine-desk stage for a prescription, read from the backend fields, shared by the patient
 * and the doctor portals so the same prescription never reads "Payment pending" for one and
 * "Ready to dispense" for the other.
 *
 * Precedence (explicit backend flags first, amounts only as a fallback):
 *   cancelled  > dispensed > partially dispensed
 *   > ready (readyForHandover / READY_FOR_HANDOVER / paymentStatus PAID / canDispense)
 *   > payment pending (waitingForPayment / WAITING_FOR_PAYMENT / pendingAmount > 0 / PENDING).
 * Returns null when the payload says nothing about the desk.
 */
export type PrescriptionDeskStage =
  | "CANCELLED"
  | "DISPENSED"
  | "PARTIAL"
  | "READY_TO_DISPENSE"
  | "PAYMENT_PENDING";

const DISPENSED_STATUSES = new Set(["FILLED", "DISPENSED", "COMPLETED"]);
const PARTIAL_STATUSES = new Set(["PARTIAL", "PARTIALLY_DISPENSED"]);

function upper(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : "";
}

function positive(value: unknown): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

export function resolvePrescriptionDeskStage(
  prescription: Record<string, unknown>,
  options: { partiallyDispensed?: boolean } = {},
): PrescriptionDeskStage | null {
  const status = upper(prescription.status);
  const queueStatus = upper(prescription.queueStatus);
  const paymentStatus = upper(prescription.paymentStatus);

  if (status === "CANCELLED" || queueStatus === "CANCELLED") return "CANCELLED";
  if (DISPENSED_STATUSES.has(status) || queueStatus === "DISPENSED") return "DISPENSED";
  if (PARTIAL_STATUSES.has(status) || PARTIAL_STATUSES.has(queueStatus) || options.partiallyDispensed) return "PARTIAL";
  if (
    prescription.readyForHandover === true ||
    status === "READY_FOR_HANDOVER" ||
    paymentStatus === "PAID" ||
    prescription.canDispense === true
  ) {
    return "READY_TO_DISPENSE";
  }
  if (
    prescription.waitingForPayment === true ||
    status === "WAITING_FOR_PAYMENT" ||
    positive(prescription.pendingAmount) ||
    status === "PENDING" ||
    Boolean(paymentStatus)
  ) {
    return "PAYMENT_PENDING";
  }
  return null;
}
