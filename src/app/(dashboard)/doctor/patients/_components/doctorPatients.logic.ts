import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { ageInYears, formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import { asRecordOrEmpty, firstText, textOf, unwrapList } from "@/lib/utils/coerce";
import { genderLabel } from "@/lib/utils/labels";
import { patientRecordName } from "@/lib/utils/display-name";

type Raw = Record<string, unknown>;

/** One line of the "My Patients" table. */
export interface DoctorPatientRow {
  id: string;
  name: string;
  /** Whole years, or null when neither an age nor a date of birth is on record. */
  age: number | null;
  gender: string;
  phone: string;
  email: string;
  /** Null when the server did not send a visit count. */
  totalVisits: number | null;
  /** Raw date of the last visit, or null. */
  lastVisit: string | null;
}

export interface DoctorPatientsStats {
  /** Open appointments in the next 7 days. */
  upcomingAppointments: number;
  /** Appointments dated today (IST) that were not cancelled. */
  todayAppointments: number;
  /** Patients with more than one appointment among the loaded appointments. */
  returningPatients: number;
  /** `returningPatients` as a share (0–100) of the patients who have an appointment at all. */
  returningShare: number;
}

export interface DoctorPatientsPageMeta {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

export function extractPatients(value: unknown): Raw[] {
  return unwrapList(value, "patients", "data", "items", "records") as Raw[];
}

export function extractAppointments(value: unknown): Raw[] {
  return unwrapList(value, "appointments") as Raw[];
}

export function extractPaginationMeta(value: unknown, fallbackPageSize: number): DoctorPatientsPageMeta {
  if (Array.isArray(value)) {
    return {
      total: value.length,
      page: 1,
      totalPages: 1,
      pageSize: Math.max(fallbackPageSize, value.length || 1),
    };
  }

  if (!value || typeof value !== "object") {
    return { total: 0, page: 1, totalPages: 1, pageSize: fallbackPageSize };
  }

  const record = value as Raw;
  const total = Number(record.total ?? record.count ?? record.totalCount ?? 0) || extractPatients(value).length;
  const page = Number(record.page ?? record.currentPage ?? 1) || 1;
  const pageSize = Number(record.pageSize ?? record.limit ?? fallbackPageSize) || fallbackPageSize;
  const totalPages =
    Number(record.totalPages ?? record.pageCount ?? Math.max(1, Math.ceil(total / Math.max(pageSize, 1)))) || 1;

  return { total, page, totalPages, pageSize };
}

/** Turns one patient from the API (flat, or nested under `user`) into a table row. */
export function toDoctorPatientRow(patient: unknown, today: Date = new Date()): DoctorPatientRow {
  const record = asRecordOrEmpty(patient);
  const user = asRecordOrEmpty(record.user);
  const dateOfBirth = firstText(record.dateOfBirth, user.dateOfBirth);
  const givenAge = Number(record.age);
  const age =
    Number.isFinite(givenAge) && givenAge > 0 ? givenAge : dateOfBirth ? ageInYears(dateOfBirth, today) : null;
  const visits = record.totalVisits;
  const totalVisits = visits === undefined || visits === null || Number.isNaN(Number(visits)) ? null : Number(visits);

  return {
    id: textOf(record.id),
    name: patientRecordName(record) || "Unknown Patient",
    age,
    gender: firstText(record.gender, user.gender),
    phone: firstText(record.phone, user.phone),
    email: firstText(record.email, user.email),
    totalVisits,
    lastVisit: firstText(record.lastVisit) || null,
  };
}

/** "32 years · Female" */
export function patientSummaryLine(row: Pick<DoctorPatientRow, "age" | "gender">): string {
  const age = row.age === null ? "Age not set" : row.age === 0 ? "Under 1 year" : `${row.age} years`;
  const gender = genderLabel(row.gender);
  return gender ? `${age} · ${gender}` : age;
}

export function visitsLabel(row: Pick<DoctorPatientRow, "totalVisits">): string {
  return row.totalVisits === null ? "—" : `${row.totalVisits} total`;
}

export function lastVisitLabel(row: Pick<DoctorPatientRow, "lastVisit">): string {
  const formatted = row.lastVisit
    ? formatDateInIST(row.lastVisit, { day: "numeric", month: "short", year: "numeric" })
    : "";
  return formatted ? `Last: ${formatted}` : "No visit";
}

/**
 * The three numbers next to "Total Patients", worked out from the doctor's appointments
 * (the appointment list the page loaded, so "returning" covers those appointments only).
 */
export function computeDoctorPatientsStats(appointments: Raw[], now: Date = new Date()): DoctorPatientsStats {
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const upcomingAppointments = appointments.filter((appointment) => {
    const parsed = getAppointmentDateTimeValue(appointment as Parameters<typeof getAppointmentDateTimeValue>[0]);
    return (
      parsed &&
      !Number.isNaN(parsed.getTime()) &&
      parsed >= now &&
      parsed <= weekEnd &&
      ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(textOf(appointment.status).toUpperCase())
    );
  }).length;

  const todayKey = formatDateKeyInIST(now);
  const todayAppointments = appointments.filter((appointment) => {
    const parsed = getAppointmentDateTimeValue(appointment as Parameters<typeof getAppointmentDateTimeValue>[0]);
    return (
      parsed &&
      !Number.isNaN(parsed.getTime()) &&
      formatDateKeyInIST(parsed) === todayKey &&
      !["CANCELLED", "EXPIRED"].includes(textOf(appointment.status).toUpperCase())
    );
  }).length;

  const visitsByPatient = new Map<string, number>();
  for (const appointment of appointments) {
    const patientId = textOf(appointment.patientId);
    if (!patientId) continue;
    visitsByPatient.set(patientId, (visitsByPatient.get(patientId) ?? 0) + 1);
  }
  const returningPatients = Array.from(visitsByPatient.values()).filter((count) => count > 1).length;
  const returningShare =
    visitsByPatient.size > 0 ? Math.round((returningPatients / visitsByPatient.size) * 100) : 0;

  return { upcomingAppointments, todayAppointments, returningPatients, returningShare };
}

/** YYYY-MM-DD for last-visit date filtering, or "" when unknown. */
export function lastVisitDateKey(row: Pick<DoctorPatientRow, "lastVisit">): string {
  if (!row.lastVisit) return "";
  try {
    return formatDateKeyInIST(row.lastVisit);
  } catch {
    return "";
  }
}

/** Inclusive from/to filter on last visit (empty bounds are ignored). */
export function matchesLastVisitRange(
  row: Pick<DoctorPatientRow, "lastVisit">,
  dateFrom: string,
  dateTo: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const key = lastVisitDateKey(row);
  if (!key) return false;
  if (dateFrom && key < dateFrom) return false;
  if (dateTo && key > dateTo) return false;
  return true;
}
