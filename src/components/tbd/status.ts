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
  // lab bookings
  REQUESTED: "amber",
  SAMPLE_COLLECTED: "blue",
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

/**
 * The one appointment-status vocabulary for staff screens (doctor dashboard and list, reception
 * desk, shared queue, clinic admin), so the same visit reads the same word everywhere:
 * Not checked in -> Waiting (checked in) -> With doctor -> Done (or Missed / Cancelled / Expired).
 * Video visits have no check-in, so their pre-visit words differ ("Booked", "Ready to join").
 */
const APPOINTMENT_STATUS_GROUPS: Record<string, string> = {
  SCHEDULED: "BOOKED",
  RESCHEDULED: "BOOKED",
  FOLLOW_UP_SCHEDULED: "BOOKED",
  PROPOSED: "BOOKED",
  PENDING: "PAYMENT_PENDING",
  AWAITING_PAYMENT: "PAYMENT_PENDING",
  PENDING_PAYMENT: "PAYMENT_PENDING",
  WAITING_FOR_PAYMENT: "PAYMENT_PENDING",
  CONFIRMED: "CHECKED_IN",
  CHECKED_IN: "CHECKED_IN",
  WAITING: "CHECKED_IN",
  QUEUED: "CHECKED_IN",
  CALLED: "CALLED",
  IN_PROGRESS: "WITH_DOCTOR",
  STARTED: "WITH_DOCTOR",
  COMPLETED: "DONE",
  ENDED: "DONE",
  NO_SHOW: "MISSED",
  CANCELLED: "CANCELLED",
  CANCELED: "CANCELLED",
  EXPIRED: "EXPIRED",
};

const APPOINTMENT_GROUP_LABELS: Record<string, { clinic: string; video: string }> = {
  BOOKED: { clinic: "Not checked in", video: "Booked" },
  PAYMENT_PENDING: { clinic: "Payment pending", video: "Payment pending" },
  CHECKED_IN: { clinic: "Waiting", video: "Ready to join" },
  CALLED: { clinic: "Called", video: "Called" },
  WITH_DOCTOR: { clinic: "With doctor", video: "With doctor" },
  DONE: { clinic: "Done", video: "Done" },
  MISSED: { clinic: "Missed", video: "Missed" },
  CANCELLED: { clinic: "Cancelled", video: "Cancelled" },
  EXPIRED: { clinic: "Expired", video: "Expired" },
};

/**
 * Staff-facing label for an appointment status code. `visitType` is the appointment type
 * ("VIDEO_CALL", "IN_PERSON", ...) or the kind ("video" / "clinic"); unknown means in-clinic.
 * Statuses outside the appointment lifecycle fall back to `statusLabel`.
 */
export function appointmentStatusLabel(status?: string | null, visitType?: string | null): string {
  const group = APPOINTMENT_STATUS_GROUPS[normalizeStatus(status)];
  const labels = group ? APPOINTMENT_GROUP_LABELS[group] : undefined;
  if (!labels) return statusLabel(status);
  return visitTypeKind(visitType) === "video" ? labels.video : labels.clinic;
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
