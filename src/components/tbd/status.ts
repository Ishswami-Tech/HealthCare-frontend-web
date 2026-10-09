import type { PillTone } from "./primitives";

/**
 * One place that decides how a status looks, so the same status has the same colour on
 * every screen: green = confirmed / ready / paid, amber = waiting, blue = in progress,
 * slate = finished, rose = cancelled / failed / urgent.
 */
const STATUS_TONES: Record<string, PillTone> = {
  // appointments
  CONFIRMED: "green",
  SCHEDULED: "blue",
  PENDING: "amber",
  AWAITING_SLOT_CONFIRMATION: "amber",
  RESCHEDULED: "blue",
  IN_PROGRESS: "blue",
  WAITING: "amber",
  ON_HOLD: "amber",
  COMPLETED: "teal",
  DISCHARGED: "slate",
  CANCELLED: "rose",
  NO_SHOW: "rose",
  EXPIRED: "slate",
  FOLLOW_UP_SCHEDULED: "blue",
  CHECKED_IN: "green",
  // queue
  QUEUED: "amber",
  CALLED: "blue",
  SKIPPED: "slate",
  // payments, invoices
  PAID: "green",
  SUCCESS: "green",
  SUCCEEDED: "green",
  CAPTURED: "green",
  UNPAID: "amber",
  DUE: "amber",
  OVERDUE: "rose",
  PARTIAL: "blue",
  PARTIALLY_PAID: "blue",
  REFUNDED: "slate",
  FAILED: "rose",
  DRAFT: "slate",
  VOID: "slate",
  // prescriptions, pharmacy
  ACTIVE: "green",
  READY_TO_DISPENSE: "green",
  READY: "green",
  AWAITING_PAYMENT: "amber",
  PAYMENT_PENDING: "amber",
  PARTIALLY_DISPENSED: "blue",
  DISPENSED: "slate",
  FILLED: "slate",
  REVERSED: "rose",
  // stock
  IN_STOCK: "green",
  LOW_STOCK: "amber",
  OUT_OF_STOCK: "rose",
  EXPIRING: "amber",
  EXPIRED_STOCK: "rose",
  // generic
  URGENT: "rose",
  HIGH: "rose",
  NORMAL: "slate",
  LOW: "slate",
  INACTIVE: "slate",
  VERIFIED: "green",
};

export function normalizeStatus(status?: string | null): string {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

/** Pill colour for a status code. Unknown statuses are neutral. */
export function statusTone(status?: string | null): PillTone {
  return STATUS_TONES[normalizeStatus(status)] ?? "slate";
}

/** Readable label for a status code: IN_PROGRESS -> "In progress". */
export function statusLabel(status?: string | null): string {
  const key = normalizeStatus(status);
  if (!key) return "Unknown";
  if (key === "NO_SHOW") return "Missed";
  const text = key.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
