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
  EXPIRING_SOON: "amber",
  EXPIRED_STOCK: "rose",
  // purchase orders
  SENT: "blue",
  PROCESSING: "blue",
  PARTIALLY_RECEIVED: "blue",
  SHIPPED: "amber",
  RECEIVED: "green",
  DELIVERED: "green",
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

/** "video" for a video visit, "clinic" for one at the clinic, null for anything else. */
export function visitTypeKind(type?: string | null): "video" | "clinic" | null {
  const key = normalizeStatus(type);
  if (key.includes("VIDEO")) return "video";
  if (key.includes("PERSON") || key.includes("CLINIC")) return "clinic";
  return null;
}

/** "VIDEO_CALL" -> "Video call", "IN_PERSON" -> "In-clinic", anything else in sentence case. */
export function visitTypeLabel(type?: string | null): string {
  const key = normalizeStatus(type);
  if (!key) return "Consultation";
  if (key === "VIDEO_CALL" || key === "VIDEO") return "Video call";
  if (key === "IN_PERSON" || key === "IN_CLINIC") return "In-clinic";
  const text = key.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
