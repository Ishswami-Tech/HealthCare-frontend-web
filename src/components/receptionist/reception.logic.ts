import { statusLabel, statusTone, type PillTone } from "@/components/tbd";
import { toManagerVisit } from "@/components/appointments/manager/managerData";
import type { ManagerVisit } from "@/components/appointments/manager/types";
import { checkInMethodLabel } from "@/components/clinic/check-in-labels";
import { asRow, firstText, isCheckedInClinicVisit, text, type Row } from "@/components/patient/home/homeData";
import {
  formatDateInIST,
  formatISODateInIST,
  formatTimeInIST,
  getAppointmentDateTimeValue,
  isTerminalAppointment,
  normalizeAppointmentStatus,
} from "@/lib/utils/appointmentUtils";

/**
 * The front desk's view of an appointment. Pure functions: the reception hooks call them with live
 * rows, nothing here fetches. Built on the shared `toManagerVisit` (status, reschedule rule, when
 * label), so reception, the patient list and the doctor list agree on every rule.
 *
 * Reception is the front desk: the model carries no clinical field (no notes, diagnosis, vitals).
 */

/**
 * Where an appointment stands at the desk (product rules v2: no vitals stage).
 * booked = not in the queue yet; checked_in = confirmed at the clinic and waiting for the doctor;
 * with_doctor = the doctor started the visit; then completed / missed / cancelled.
 */
export type ReceptionStage = "booked" | "checked_in" | "with_doctor" | "completed" | "missed" | "cancelled";

export interface ReceptionVisit {
  id: string;
  kind: "video" | "clinic";
  stage: ReceptionStage;
  /** The appointment status as the API sends it (normalised), for an undo. */
  status: string;
  patientId: string;
  /** The patient's user id (User.id): the key of `GET /patients/:id` and the desk patient links. */
  patientUserId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  locationId: string;
  /** "Today · 02:00 PM" */
  whenLabel: string;
  /** "02:00 pm", or "" when the visit has no time. */
  timeLabel: string;
  /** yyyy-mm-dd in IST, or "" */
  dayKey: string;
  startsAtMs: number | null;
  statusLabel: string;
  statusTone: PillTone;
  /** "K-021" when the queue has given the patient a token. */
  tokenLabel: string;
  /** "11:42 am" */
  checkedInLabel: string;
  checkedInAtMs: number | null;
  isWalkIn: boolean;
  isUrgent: boolean;
  /** One click check-in at the desk: today's in-clinic visit, not checked in, not closed. */
  canCheckIn: boolean;
  /** The visit time has passed and the patient never came. */
  canMarkNoShow: boolean;
  canReschedule: boolean;
  /** "1 of 2 changes left" */
  rescheduleHint: string | null;
  /** Lower-case text the desk search matches (name, phone, booking id). */
  searchText: string;
}

const CHECK_IN_STATUSES = new Set(["SCHEDULED", "CONFIRMED", "PENDING", "RESCHEDULED"]);
/**
 * Statuses the backend lets the desk move to NO_SHOW (appointment state contract: CONFIRMED and
 * WAITING, plus SCHEDULED for a past in-clinic visit). Anything else would be refused.
 */
const NO_SHOW_STATUSES = new Set(["CONFIRMED", "WAITING", "SCHEDULED"]);

/** Location id of an appointment row. */
export function appointmentLocationId(appointment: Row): string {
  return firstText(appointment.locationId, asRow(appointment.location)?.id);
}

function patientOf(appointment: Row): Row | undefined {
  return asRow(appointment.patient);
}

function patientPhone(appointment: Row): string {
  const patient = patientOf(appointment);
  return firstText(appointment.patientPhone, patient?.phone, asRow(patient?.user)?.phone);
}

function patientId(appointment: Row): string {
  return firstText(appointment.patientId, patientOf(appointment)?.id);
}

function patientUserId(appointment: Row): string {
  const patient = patientOf(appointment);
  return firstText(patient?.userId, asRow(patient?.user)?.id, appointment.patientUserId, appointment.userId);
}

function doctorId(appointment: Row): string {
  return firstText(appointment.doctorId, asRow(appointment.doctor)?.id);
}

function tokenOf(appointment: Row): string {
  const explicit = firstText(appointment.tokenLabel, appointment.queueToken, appointment.token, asRow(appointment.queue)?.tokenLabel);
  if (explicit) return explicit;
  const position = Number(appointment.queuePosition ?? asRow(appointment.queue)?.position);
  return Number.isFinite(position) && position > 0 ? `#${position}` : "";
}

function timeOfDay(value: Date): string {
  return formatTimeInIST(value, { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
}

function stageOf(appointment: Row, visit: ManagerVisit): ReceptionStage {
  const status = normalizeAppointmentStatus(appointment.status);
  if (status === "COMPLETED") return "completed";
  if (status === "NO_SHOW") return "missed";
  if (status === "CANCELLED" || status === "EXPIRED") return "cancelled";
  if (status === "IN_PROGRESS") return "with_doctor";
  return visit.clinicStage === "queue" ? "checked_in" : "booked";
}

const STAGE_LABEL: Record<ReceptionStage, string> = {
  booked: "",
  checked_in: "Checked in",
  with_doctor: "With doctor",
  completed: statusLabel("COMPLETED"),
  missed: statusLabel("NO_SHOW"),
  cancelled: "",
};

const STAGE_TONE: Partial<Record<ReceptionStage, PillTone>> = {
  checked_in: statusTone("CHECKED_IN"),
  with_doctor: statusTone("IN_PROGRESS"),
};

/** One appointment row for the desk. `now` decides "today" and whether the visit time has passed. */
export function toReceptionVisit(appointment: Row, now: number): ReceptionVisit {
  const visit = toManagerVisit(appointment, { now, viewerRole: "RECEPTIONIST", staffView: true });
  const stage = stageOf(appointment, visit);
  const startsAt = getAppointmentDateTimeValue(appointment);
  const dayKey = startsAt ? formatISODateInIST(startsAt) : "";
  const today = formatISODateInIST(new Date(now));
  const status = normalizeAppointmentStatus(appointment.status);
  const terminal = isTerminalAppointment(appointment);
  const checkedInAt = text(appointment.checkedInAt);
  const checkedInDate = checkedInAt ? new Date(checkedInAt) : null;
  const checkedInValid = checkedInDate && !Number.isNaN(checkedInDate.getTime()) ? checkedInDate : null;
  const isClinic = visit.kind === "clinic";
  const priority = text(appointment.priority).toUpperCase();
  const phone = patientPhone(appointment);

  return {
    id: visit.id,
    kind: visit.kind,
    stage,
    status,
    patientId: patientId(appointment),
    patientUserId: patientUserId(appointment),
    patientName: visit.title,
    patientPhone: phone,
    doctorId: doctorId(appointment),
    doctorName: visit.doctorName,
    locationId: appointmentLocationId(appointment),
    whenLabel: visit.whenLabel,
    timeLabel: startsAt ? timeOfDay(startsAt) : "",
    dayKey,
    startsAtMs: startsAt ? startsAt.getTime() : null,
    statusLabel: STAGE_LABEL[stage] || visit.statusLabel,
    statusTone: STAGE_TONE[stage] ?? visit.statusTone,
    tokenLabel: stage === "checked_in" || stage === "with_doctor" ? tokenOf(appointment) : "",
    checkedInLabel: checkedInValid ? timeOfDay(checkedInValid) : "",
    checkedInAtMs: checkedInValid ? checkedInValid.getTime() : null,
    isWalkIn: appointment.isWalkIn === true,
    isUrgent: priority === "URGENT" || priority === "HIGH" || priority === "EMERGENCY",
    canCheckIn:
      isClinic && !terminal && stage === "booked" && dayKey === today && CHECK_IN_STATUSES.has(status) && !isCheckedInClinicVisit(appointment),
    canMarkNoShow:
      isClinic && stage === "booked" && !terminal && NO_SHOW_STATUSES.has(status) && startsAt !== null && startsAt.getTime() < now,
    canReschedule: visit.canReschedule,
    rescheduleHint: visit.rescheduleHint,
    searchText: [visit.title, phone, visit.id, visit.doctorName].join(" ").toLowerCase(),
  };
}

/** Rows of the API response (`{ appointments }`, `{ data }`, or a plain list). */
export function readAppointmentRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((item): item is Row => Boolean(asRow(item)));
  const record = asRow(data);
  if (!record) return [];
  for (const key of ["appointments", "data"] as const) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is Row => Boolean(asRow(item)));
    const nested = asRow(value)?.appointments;
    if (Array.isArray(nested)) return nested.filter((item): item is Row => Boolean(asRow(item)));
  }
  return [];
}

/** The desk's visits: only the reception location (when the user has one), soonest first. */
export function buildReceptionVisits(data: unknown, locationId: string | null, now: number): ReceptionVisit[] {
  return readAppointmentRows(data)
    .filter((row) => !locationId || !appointmentLocationId(row) || appointmentLocationId(row) === locationId)
    .map((row) => toReceptionVisit(row, now))
    .filter((visit) => Boolean(visit.id))
    .sort((left, right) => (left.startsAtMs ?? Number.MAX_SAFE_INTEGER) - (right.startsAtMs ?? Number.MAX_SAFE_INTEGER));
}

// ── Filters ─────────────────────────────────────────────────────────────────

export type ReceptionStatusFilter = "all" | ReceptionStage;

export const RECEPTION_STATUS_FILTERS: Array<{ value: ReceptionStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "booked", label: "Booked" },
  { value: "checked_in", label: "Checked in" },
  { value: "with_doctor", label: "With doctor" },
  { value: "completed", label: "Completed" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

/** The check-in list filters (design RecCheckIn: All / Not checked in / Checked in). */
export type CheckInFilter = "all" | "waiting" | "done";

export function matchesSearch(visit: ReceptionVisit, search: string): boolean {
  const query = search.trim().toLowerCase();
  return !query || visit.searchText.includes(query);
}

export function filterByStage(visits: ReceptionVisit[], filter: ReceptionStatusFilter, search = ""): ReceptionVisit[] {
  return visits.filter((visit) => (filter === "all" || visit.stage === filter) && matchesSearch(visit, search));
}

export function countByStage(visits: ReceptionVisit[]): Record<ReceptionStatusFilter, number> {
  const counts: Record<ReceptionStatusFilter, number> = {
    all: visits.length,
    booked: 0,
    checked_in: 0,
    with_doctor: 0,
    completed: 0,
    missed: 0,
    cancelled: 0,
  };
  for (const visit of visits) counts[visit.stage] += 1;
  return counts;
}

/** Arrived at the desk: checked in, with the doctor, or already done. */
export function hasArrived(visit: ReceptionVisit): boolean {
  return visit.stage === "checked_in" || visit.stage === "with_doctor" || visit.stage === "completed";
}

/** Today's in-clinic visits of the check-in list. Video visits never need a check-in. */
export function checkInRows(visits: ReceptionVisit[], todayKey: string, filter: CheckInFilter, search = ""): ReceptionVisit[] {
  return visits.filter(
    (visit) =>
      visit.kind === "clinic" &&
      visit.dayKey === todayKey &&
      visit.stage !== "cancelled" &&
      (filter === "all" || (filter === "done" ? hasArrived(visit) : visit.stage === "booked")) &&
      matchesSearch(visit, search),
  );
}

/** Minutes since a time, for the "waiting 14 min" line. */
export function minutesSince(ms: number | null, now: number): number | null {
  if (ms === null) return null;
  return Math.max(0, Math.round((now - ms) / 60_000));
}

/** "in 43 min", "in 4 h 28 min", "now". */
export function startsInLabel(ms: number | null, now: number): string {
  if (ms === null) return "";
  const minutes = Math.round((ms - now) / 60_000);
  if (minutes <= 0) return "now";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `in ${hours} h ${rest} min` : `in ${hours} h`;
}

/** Day heading for a date key: "Tue, 20 Oct 2026". */
export function dayHeading(dayKey: string): string {
  const parsed = new Date(`${dayKey}T00:00:00+05:30`);
  return Number.isNaN(parsed.getTime())
    ? dayKey
    : formatDateInIST(parsed, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** yyyy-mm-dd of the day `offset` days after `dayKey` (IST). */
export function shiftDayKey(dayKey: string, offset: number): string {
  const parsed = new Date(`${dayKey}T00:00:00+05:30`);
  if (Number.isNaN(parsed.getTime())) return dayKey;
  return formatISODateInIST(new Date(parsed.getTime() + offset * 24 * 60 * 60 * 1000));
}

// ── Doctors ─────────────────────────────────────────────────────────────────

export interface DoctorOption {
  id: string;
  name: string;
}

/**
 * Doctors who see patients (role DOCTOR) from the `useDoctors` response. The assistant doctor
 * never runs a visit, so a walk-in or a reassignment goes to a doctor.
 */
export function readDoctorOptions(data: unknown): DoctorOption[] {
  const record = asRow(data);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRow(record?.data)?.doctors)
      ? (asRow(record?.data)?.doctors as unknown[])
      : Array.isArray(record?.doctors)
        ? (record?.doctors as unknown[])
        : Array.isArray(record?.data)
          ? (record?.data as unknown[])
          : [];
  const seen = new Set<string>();
  const options: DoctorOption[] = [];
  for (const item of list) {
    const row = asRow(item);
    if (!row) continue;
    const doctor = asRow(row.doctor);
    const user = asRow(row.user) ?? asRow(doctor?.user);
    const role = firstText(row.role, user?.role).toUpperCase();
    if (role && role !== "DOCTOR") continue;
    const id = firstText(doctor?.id, row.doctorId, row.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const rawName =
      firstText(row.name, user?.name) || `${firstText(row.firstName, user?.firstName)} ${firstText(row.lastName, user?.lastName)}`.trim();
    const name = rawName ? (/^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`) : "Doctor";
    options.push({ id, name });
  }
  return options;
}

// ── Patient contact (no clinical fields) ───────────────────────────────────

export interface PatientContact {
  patientId: string;
  /** The patient's user account id (plans / subscriptions are keyed by it); "" when unknown. */
  userId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  age: number | null;
  /** Clinic patient number (UHID) when there is one. */
  uhid: string;
  registeredAt: string;
}

function ageFrom(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/**
 * The contact part of a patient record (`GET /clinics/:clinicId/patients/:id`, or a directory row).
 * Only names and ways to reach the patient: whatever clinical data the response carries is dropped here.
 */
export function readPatientContact(data: unknown, fallbackId = ""): PatientContact | null {
  const root = asRow(data);
  const record = asRow(root?.data) ?? root;
  if (!record) return null;
  const user = asRow(record.user) ?? record;
  // `GET /patients/:userId` answers with the User row and the Patient record nested under `patient`.
  const nestedPatient = asRow(record.patient);
  const name =
    firstText(record.name, user.name) ||
    `${firstText(record.firstName, user.firstName)} ${firstText(record.lastName, user.lastName)}`.trim();
  const ageValue = Number(record.age);
  const email = firstText(user.email, record.email);
  const address = [firstText(user.address, record.address), firstText(user.city, record.city)].filter(Boolean).join(", ");
  return {
    patientId: nestedPatient
      ? firstText(record.patientId, nestedPatient.id)
      : firstText(record.patientId, record.id, fallbackId),
    userId: firstText(record.userId, asRow(record.user)?.id, nestedPatient?.userId, nestedPatient ? record.id : ""),
    name: name || "Patient",
    phone: firstText(user.phone, record.phone),
    // Desk registrations without an email get a generated "@clinic.local" address: not a real one.
    email: /@clinic\.local$/i.test(email) ? "" : email,
    address,
    gender: firstText(user.gender, record.gender),
    age: Number.isFinite(ageValue) && ageValue > 0 ? ageValue : ageFrom(firstText(user.dateOfBirth, record.dateOfBirth)),
    uhid: firstText(record.uhid, record.patientNumber),
    registeredAt: firstText(record.registeredAt, record.createdAt, user.createdAt),
  };
}

/** "38 years · Female" */
export function ageGenderLabel(contact: Pick<PatientContact, "age" | "gender">): string {
  const gender = contact.gender ? contact.gender.charAt(0).toUpperCase() + contact.gender.slice(1).toLowerCase() : "";
  return [contact.age !== null ? `${contact.age} years` : "Age not set", gender].filter(Boolean).join(" · ");
}

// ── Check-in history (`GET /appointments/check-in/history`) ────────────────

export interface CheckInHistoryEntry {
  id: string;
  patientName: string;
  doctorName: string;
  locationName: string;
  checkedInAtMs: number | null;
  /** How the visit was checked in: "QR", "Manual", "Walk-in", "Staff", "Desk code" (`checkInMethodLabel`). */
  methodLabel: string;
}

/** History rows, newest first, from any of the envelopes the route returns. */
export function readCheckInHistory(data: unknown): CheckInHistoryEntry[] {
  return readAppointmentRows(data)
    .map((row) => {
      const at = text(row.checkedInAt);
      const parsed = at ? new Date(at) : null;
      const ms = parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : null;
      return {
        id: text(row.id),
        patientName: text(row.patientName) || "Patient",
        doctorName: text(row.doctorName),
        locationName: text(row.locationName),
        checkedInAtMs: ms,
        methodLabel: checkInMethodLabel(row.checkInMethod),
      };
    })
    .filter((entry) => Boolean(entry.id))
    .sort((left, right) => (right.checkedInAtMs ?? 0) - (left.checkedInAtMs ?? 0));
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "Fri 23 Oct, 10:00 AM" for an IST day key ("YYYY-MM-DD") and an IST "HH:mm" slot. */
export function nextSlotLabel(dateKey: string, time: string): string {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const clock = /^(\d{2}):(\d{2})$/.exec(time);
  if (!day || !clock) return [dateKey, time].filter(Boolean).join(", ");
  const calendar = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])));
  const hours = Number(clock[1]);
  const clockLabel = `${hours % 12 || 12}:${clock[2]} ${hours >= 12 ? "PM" : "AM"}`;
  return `${WEEKDAY_SHORT[calendar.getUTCDay()]} ${calendar.getUTCDate()} ${MONTH_SHORT[calendar.getUTCMonth()]}, ${clockLabel}`;
}
