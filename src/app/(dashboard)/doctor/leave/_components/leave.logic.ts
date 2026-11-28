import type { CreateLeaveInput, LeaveKind, LeaveRequest, LeaveStatus } from "@/hooks/query/useLeaveRequests";
import type { PillTone } from "@/components/tbd";
import { formatDateKeyInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";

export const LEAVE_KIND_LABEL: Record<LeaveKind, string> = {
  LEAVE: "Full day leave",
  HALF_DAY: "Reduced hours",
  BREAK: "Break",
};

export const LEAVE_STATUS: Record<LeaveStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "Waiting for approval", tone: "amber" },
  APPROVED: { label: "Approved", tone: "green" },
  DECLINED: { label: "Declined", tone: "rose" },
  CANCELLED: { label: "Cancelled", tone: "slate" },
};

const CLOSED_STATUSES = new Set(["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"]);

/** HH:mm in the clinic time zone. */
function clockOf(date: Date): string {
  return formatTimeInIST(date, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * The doctor's open appointments that fall inside a leave window (the "N booked patients will be
 * told to reschedule" preview). Full-day leave covers whole days; reduced hours and breaks only
 * their time range.
 */
export function appointmentsInLeave(appointments: readonly unknown[], leave: CreateLeaveInput): Record<string, unknown>[] {
  if (!leave.startDate || !leave.endDate) return [];
  const timed = leave.kind !== "LEAVE" && Boolean(leave.startTime && leave.endTime);
  return appointments.map(asRecordOrEmpty).filter((appointment) => {
    if (CLOSED_STATUSES.has(textOf(appointment.status).toUpperCase())) return false;
    if (leave.locationId && textOf(appointment.locationId) && textOf(appointment.locationId) !== leave.locationId) return false;
    const startsAt = getAppointmentDateTimeValue(appointment);
    if (!startsAt) return false;
    const day = formatDateKeyInIST(startsAt);
    if (day < leave.startDate || day > leave.endDate) return false;
    if (!timed) return true;
    const clock = clockOf(startsAt);
    return clock >= (leave.startTime ?? "") && clock < (leave.endTime ?? "");
  });
}

/** Leave that has not ended yet, soonest first; then the past, newest first. */
export function sortLeave(rows: readonly LeaveRequest[], todayKey: string): LeaveRequest[] {
  const upcoming = rows.filter((row) => row.endDate >= todayKey).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = rows.filter((row) => row.endDate < todayKey).sort((a, b) => b.startDate.localeCompare(a.startDate));
  return [...upcoming, ...past];
}

/** Basic checks before sending; the server validates again. */
export function leaveProblem(input: CreateLeaveInput, todayKey: string): string | null {
  if (!input.startDate || !input.endDate) return "Choose the first and last day.";
  if (input.endDate < input.startDate) return "The last day is before the first day.";
  if (input.startDate < todayKey) return "Leave can only start today or later.";
  if (input.kind !== "LEAVE") {
    if (!input.startTime || !input.endTime) return "Choose the start and end time.";
    if (input.endTime <= input.startTime) return "The end time must be after the start time.";
  }
  return null;
}
