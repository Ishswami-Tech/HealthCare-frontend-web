import { asRow, firstText, text, toHomeVisit, type Row } from "@/components/patient/home/homeData";
import type { HomeVisit } from "@/components/patient/home/types";
import type { MyQueuePosition } from "@/hooks/query/usePatientQueue";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";
import { formatTimeInIST } from "@/lib/utils/date-time";

/**
 * View models for the patient check-in and live queue screens, and the pure functions that
 * build them from API data. The containers call these with live data; the preview calls them
 * with fixtures. Everything here shows only what the API returns: the patient's own place,
 * never other patients.
 */

/** The patient's own place in the queue. Every number is null until the API provides it. */
export interface QueueTicket {
  /** Token printed on the visit, when the appointment carries one. */
  tokenLabel: string | null;
  /** 1 = first in line. */
  position: number | null;
  patientsAhead: number | null;
  totalInQueue: number | null;
  estimatedWaitMinutes: number | null;
  /** Upper case queue status: WAITING, IN_PROGRESS, … */
  statusCode: string;
  /** The patient is with the doctor now. */
  isWithDoctor: boolean;
  /** Someone in this queue is with the doctor now. Null when the API did not say. */
  doctorBusy: boolean | null;
  /** "1:42 PM" */
  checkedInLabel: string | null;
}

/** Who and where: taken from the patient's own appointment. */
export interface QueueVisitInfo {
  doctorName: string | null;
  locationLabel: string | null;
  address: string | null;
  clinicPhone: string | null;
  directionsUrl: string | null;
}

export const EMPTY_VISIT_INFO: QueueVisitInfo = {
  doctorName: null,
  locationLabel: null,
  address: null,
  clinicPhone: null,
  directionsUrl: null,
};

// ── Appointments ───────────────────────────────────────────────────────────

/** `useMyAppointments` resolves to a list, `{ appointments }` or `{ data: { appointments } }`. */
export function readAppointments(payload: unknown): Row[] {
  const outer = asRow(payload);
  const inner = asRow(outer?.data);
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(outer?.appointments)
      ? outer.appointments
      : Array.isArray(inner?.appointments)
        ? inner.appointments
        : Array.isArray(outer?.data)
          ? outer.data
          : [];
  return list.map(asRow).filter((row): row is Row => !!row);
}

const CLOSED = new Set(["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"]);

/**
 * Check-in is only for in-clinic visits that are still open. A video visit never qualifies.
 * (The same rule the check-in page has always used.)
 */
export function isOpenClinicVisit(appointment: Row): boolean {
  const status = normalizeAppointmentStatus(text(appointment.status));
  const type = firstText(appointment.type, appointment.appointmentType).toUpperCase();
  return type === "IN_PERSON" && !CLOSED.has(String(status).toUpperCase());
}

function startTime(visit: HomeVisit): number {
  const time = visit.startsAt ? new Date(visit.startsAt).getTime() : NaN;
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}

/** Open in-clinic visits as Home view models: today's first, then the soonest. */
export function selectClinicVisits(appointments: Row[], now: number): Array<{ row: Row; visit: HomeVisit }> {
  return appointments
    .filter(isOpenClinicVisit)
    .map((row) => ({ row, visit: toHomeVisit(row, now) }))
    .filter(({ visit }) => visit.kind === "clinic" && Boolean(visit.id))
    .sort((first, second) => {
      if (first.visit.isToday !== second.visit.isToday) return first.visit.isToday ? -1 : 1;
      return startTime(first.visit) - startTime(second.visit);
    });
}

/** Clinic name, address, phone and a directions link for a visit, from its appointment row. */
export function toVisitInfo(row: Row | null | undefined, visit?: HomeVisit | null): QueueVisitInfo {
  if (!row) return EMPTY_VISIT_INFO;
  const view = visit ?? toHomeVisit(row, Date.now());
  const location = asRow(row.location);
  const clinic = asRow(row.clinic);
  const address = firstText(location?.address, clinic?.address);
  return {
    doctorName: view.doctorName || null,
    locationLabel: view.locationLabel ?? null,
    address: address && address !== view.locationLabel ? address : null,
    clinicPhone: view.clinicPhone ?? null,
    directionsUrl: view.directionsUrl ?? null,
  };
}

// ── Queue ──────────────────────────────────────────────────────────────────

function countOrNull(value: unknown, min = 0): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min ? Math.round(value) : null;
}

/** "1:42 PM" in clinic time. */
export function clockLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const label = formatTimeInIST(value);
  return label ? label.replace(/^0/, "").replace(/\b(am|pm)\b/i, (meridiem) => meridiem.toUpperCase()) : null;
}

/** The live queue entry (`GET queue/me`) as a ticket. */
export function toQueueTicket(entry: MyQueuePosition, tokenLabel?: string | null): QueueTicket {
  const statusCode = String(entry.status || "WAITING").toUpperCase();
  const isWithDoctor = statusCode === "IN_PROGRESS";
  return {
    tokenLabel: tokenLabel?.trim() || null,
    position: countOrNull(entry.position, 1),
    patientsAhead: isWithDoctor ? 0 : countOrNull(entry.patientsAhead),
    totalInQueue: countOrNull(entry.totalInQueue, 1),
    estimatedWaitMinutes: isWithDoctor ? 0 : countOrNull(entry.estimatedWaitTime),
    statusCode,
    isWithDoctor,
    doctorBusy: isWithDoctor ? true : entry.nowServing,
    checkedInLabel: clockLabel(entry.checkedInAt),
  };
}

/**
 * The numbers the check-in response carries, shown until the first live read arrives.
 * It has a position and a wait, but not how many people are ahead.
 */
export function toCheckInTicket(
  checkIn: { queuePosition?: number; totalInQueue?: number; estimatedWaitTime?: number; checkedInAt?: string },
  tokenLabel?: string | null,
): QueueTicket {
  return {
    tokenLabel: tokenLabel?.trim() || null,
    position: countOrNull(checkIn.queuePosition, 1),
    patientsAhead: null,
    totalInQueue: countOrNull(checkIn.totalInQueue, 1),
    estimatedWaitMinutes: countOrNull(checkIn.estimatedWaitTime),
    statusCode: "WAITING",
    isWithDoctor: false,
    doctorBusy: null,
    checkedInLabel: clockLabel(checkIn.checkedInAt),
  };
}

/** "~18 min", "~1 h 15 min". */
export function formatWait(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes));
  if (whole < 60) return `~${whole} min`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest ? `~${hours} h ${rest} min` : `~${hours} h`;
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** The big figure on the ticket: the token when the visit has one, otherwise the place in line. */
export function ticketHeadline(ticket: QueueTicket): { label: string; value: string } {
  if (ticket.tokenLabel) return { label: "Your token", value: ticket.tokenLabel };
  return { label: "Your place in line", value: ticket.position !== null ? `#${ticket.position}` : "—" };
}

/** How far along the patient is, 0–1: full when nobody is ahead. Null when the API gave no count. */
export function queueProgress(ticket: QueueTicket): number | null {
  if (ticket.isWithDoctor) return 1;
  if (ticket.patientsAhead === null) return null;
  return 1 / (ticket.patientsAhead + 1);
}
