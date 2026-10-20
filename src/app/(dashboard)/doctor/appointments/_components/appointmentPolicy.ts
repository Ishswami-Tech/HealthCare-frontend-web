import {
  APPOINTMENT_MAX_RESCHEDULES,
  canCancelAppointment,
  canCancelVideoAppointment,
  canRescheduleInPersonAppointment,
  canRescheduleVideoAppointment,
  getAppointmentRescheduleCount,
  getAppointmentViewState,
  isTerminalAppointmentStatus,
} from "@/lib/utils/appointmentUtils";

/** Whether the doctor may move or cancel a visit now, and why not in plain words. */
export interface VisitChangePolicy {
  canReschedule: boolean;
  /** Null when the visit can be moved. */
  rescheduleBlockedReason: string | null;
  /** How many times the visit has been moved already. */
  rescheduleCount: number;
  canCancel: boolean;
  /** Null when the visit can be cancelled. */
  cancelBlockedReason: string | null;
}

/**
 * The same rules the backend applies (reschedule-policy.ts, appointment-state-contract.ts), from the
 * raw appointment: a video visit moves only while CONFIRMED and inside its join window, an in-person
 * visit in any state but closed or in progress, both at most APPOINTMENT_MAX_RESCHEDULES times. A
 * paid video visit is never cancelled (it is moved, or it expires); a confirmed visit is moved, not
 * cancelled.
 */
export function visitChangePolicy(appointment: unknown, isVideo: boolean): VisitChangePolicy {
  const viewState = getAppointmentViewState(appointment);
  const status = String(viewState.normalizedStatus || "").toUpperCase();
  const closed = isTerminalAppointmentStatus(status);
  const rescheduleCount = getAppointmentRescheduleCount(appointment);

  const canReschedule = isVideo
    ? canRescheduleVideoAppointment(appointment)
    : canRescheduleInPersonAppointment(appointment);
  let rescheduleBlockedReason: string | null = null;
  if (!canReschedule) {
    if (closed) rescheduleBlockedReason = "This visit is closed and cannot be moved.";
    else if (rescheduleCount >= APPOINTMENT_MAX_RESCHEDULES)
      rescheduleBlockedReason = `This visit has already been moved ${APPOINTMENT_MAX_RESCHEDULES} times.`;
    else if (status === "IN_PROGRESS") rescheduleBlockedReason = "A visit in progress cannot be moved.";
    else if (isVideo && status !== "CONFIRMED")
      rescheduleBlockedReason = "A video visit can be moved only once it is confirmed (paid) and before the call starts.";
    else if (isVideo) rescheduleBlockedReason = "The join window of this video visit has closed, so it can no longer be moved.";
    else rescheduleBlockedReason = "This visit cannot be moved now.";
  }

  const canCancel = isVideo ? canCancelVideoAppointment(appointment, false) : canCancelAppointment(status);
  let cancelBlockedReason: string | null = null;
  if (!canCancel) {
    if (closed) cancelBlockedReason = "This visit is already closed.";
    else if (isVideo && viewState.paymentCompleted)
      cancelBlockedReason = "A paid video visit cannot be cancelled: move it to another time, or it expires after its window.";
    else if (status === "CONFIRMED") cancelBlockedReason = "A confirmed visit is not cancelled; move it to another time instead.";
    else if (status === "IN_PROGRESS") cancelBlockedReason = "A visit in progress cannot be cancelled.";
    else cancelBlockedReason = "This visit cannot be cancelled now.";
  }

  return { canReschedule, rescheduleBlockedReason, rescheduleCount, canCancel, cancelBlockedReason };
}

/** "1 of 2 changes left" for the reschedule dialog. */
export function rescheduleHint(rescheduleCount: number): string {
  const left = Math.max(0, APPOINTMENT_MAX_RESCHEDULES - rescheduleCount);
  return `${left} of ${APPOINTMENT_MAX_RESCHEDULES} ${left === 1 ? "change" : "changes"} left`;
}
