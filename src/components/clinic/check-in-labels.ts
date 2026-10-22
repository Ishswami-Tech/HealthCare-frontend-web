/** Labels and tones of the check-in log (CaCheckInLog, CaFailedCheckIns); shared by reception screens. */
import type { PillTone } from "@/components/tbd";
import { CHECK_IN_CLOSES_MINUTES_AFTER, CHECK_IN_OPENS_MINUTES_BEFORE } from "@/lib/utils/appointmentUtils";
import type { CheckInAttempt, CheckInFailureReason, CheckInMethod } from "@/types/clinic-admin-ops.types";

export const CHECK_IN_METHOD_LABEL: Record<CheckInMethod, string> = { QR: "QR", MANUAL: "Manual", WALK_IN: "Walk-in" };

/** Labels for every `checkInMethod` value the backend writes (history rows carry free text). */
const CHECK_IN_SOURCE_LABEL: Record<string, string> = {
  ...CHECK_IN_METHOD_LABEL,
  QR_CODE: "QR",
  QR_SCAN: "QR",
  DESK_CODE: "Desk code",
  STAFF: "Staff",
  RECEPTION: "Staff",
  RECEPTIONIST: "Staff",
  DESK: "Staff",
};

/** "QR", "Manual", "Walk-in", "Staff", "Desk code"; an unknown value is shown as sent, "Unknown" when empty. */
export function checkInMethodLabel(method: unknown): string {
  const key = String(method ?? "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  if (!key) return "Unknown";
  return CHECK_IN_SOURCE_LABEL[key] ?? key.replace(/_/g, " ").toLowerCase().replace(/^./, (first) => first.toUpperCase());
}

export const FAILURE_REASON_LABEL: Record<CheckInFailureReason, string> = {
  EXPIRED_QR: "Expired QR",
  INVALID_QR: "Invalid QR",
  WRONG_LOCATION: "Wrong location",
  NOT_BOOKED: "Not booked",
  TOO_EARLY: "Too early",
  TOO_LATE: "Too late",
  EXPIRED: "Visit expired",
  ALREADY_CHECKED_IN: "Already checked in",
  LOCATION_INACTIVE: "Location closed",
  LOCATION_REQUIRED: "No location (desk code)",
  TOO_FAR: "Too far from clinic",
  NO_ACTIVE_PLAN: "No active plan",
  OTHER: "Other",
};

/** What the clinic can do about each failure (shown under the patient on the failed list). */
export const FAILURE_REASON_HINT: Record<CheckInFailureReason, string> = {
  EXPIRED_QR: "The poster QR was replaced or the pass is old. Check the patient in by hand or point them to the new poster.",
  INVALID_QR: "The scanned code is not a clinic QR.",
  WRONG_LOCATION: "Booked at another location. Check in here by hand only if the doctor sees them here today.",
  NOT_BOOKED: "No in-person booking today at this location. Register as a walk-in or book a slot.",
  TOO_EARLY: `Check-in opens ${CHECK_IN_OPENS_MINUTES_BEFORE} minutes before the slot. Reception can check in by hand any time today.`,
  TOO_LATE: `Self check-in closed ${CHECK_IN_CLOSES_MINUTES_AFTER} minutes after the slot start. Check in by hand if the doctor still sees them today, or rebook.`,
  EXPIRED: "The visit expired or was marked no-show. Rebook today.",
  ALREADY_CHECKED_IN: "Already in the queue; nothing to do.",
  LOCATION_INACTIVE: "The location is closed today.",
  LOCATION_REQUIRED: "The desk code was typed without location. Ask the patient to allow location or scan the QR, or check them in at the desk.",
  TOO_FAR: "The desk code was typed away from the clinic. Check them in at the desk once they arrive.",
  NO_ACTIVE_PLAN: "The visit is not covered by an active monthly plan. Start or renew the plan, then check the patient in.",
  OTHER: "Check the booking with the patient.",
};

export function failureLabel(reason: CheckInFailureReason | null | undefined): string {
  return reason ? FAILURE_REASON_LABEL[reason] ?? reason : "Failed";
}

export function attemptResult(attempt: CheckInAttempt): { label: string; tone: PillTone } {
  if (attempt.outcome === "SUCCESS") return { label: "Checked in", tone: "green" };
  if (attempt.resolution === "MANUAL_CHECK_IN") return { label: "Resolved · checked in", tone: "teal" };
  if (attempt.resolution === "IGNORED") return { label: "Ignored", tone: "slate" };
  if (attempt.resolution === "CALLED") return { label: "Called", tone: "blue" };
  return { label: failureLabel(attempt.failureReason), tone: "rose" };
}
