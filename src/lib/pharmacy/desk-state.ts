/**
 * Where a prescription stands at the medicine desk, with the one wording and colour used by
 * the pharmacy screens and by the doctor's prescriptions list.
 */

export type DeskQueueState =
  | "ready_to_dispense"
  | "partially_dispensed"
  | "awaiting_payment"
  | "payment_expired";

export const DESK_STATE_LABEL: Record<DeskQueueState, string> = {
  ready_to_dispense: "Ready to dispense",
  partially_dispensed: "Partially dispensed",
  awaiting_payment: "Payment pending",
  payment_expired: "Payment expired",
};

export const DESK_STATE_TONE: Record<DeskQueueState, "green" | "blue" | "amber" | "slate"> = {
  ready_to_dispense: "green",
  partially_dispensed: "blue",
  awaiting_payment: "amber",
  payment_expired: "slate",
};
