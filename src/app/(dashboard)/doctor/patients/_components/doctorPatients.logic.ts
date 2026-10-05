import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";

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
  upcomingAppointments: number;
  followUps: number;
  recoveryRate: number;
}

export interface DoctorPatientsPageMeta {
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const asText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

const firstText = (...values: unknown[]): string => {
  for (const value of values) {
    const text = asText(value).trim();
    if (text) return text;
  }
  return "";
};

export function extractPatients(value: unknown): Raw[] {
  if (Array.isArray(value)) return value as Raw[];
  if (value && typeof value === "object") {
    const record = value as Raw;
    for (const key of ["patients", "data", "items", "records"]) {
      const candidate = record[key];
      if (Array.isArray(candidate)) return candidate as Raw[];
    }
  }
  return [];
}

export function extractAppointments(value: unknown): Raw[] {
  if (Array.isArray(value)) return value as Raw[];
  const nested = asRecord(value).appointments;
  return Array.isArray(nested) ? (nested as Raw[]) : [];
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

export function getPatientName(patient: unknown): string {
  const record = asRecord(patient);
  const user = asRecord(record.user);
  return (
    firstText(
      record.name,
      `${asText(record.firstName)} ${asText(record.lastName)}`,
      user.name,
      `${asText(user.firstName)} ${asText(user.lastName)}`,
      record.email,
      user.email,
    ) || "Unknown Patient"
  );
}

function ageFromBirthDate(dateOfBirth: string, today: Date): number | null {
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const age = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? years - 1 : years;
  return age >= 0 ? age : null;
}

/** Turns one patient from the API (flat, or nested under `user`) into a table row. */
export function toDoctorPatientRow(patient: unknown, today: Date = new Date()): DoctorPatientRow {
  const record = asRecord(patient);
  const user = asRecord(record.user);
  const dateOfBirth = firstText(record.dateOfBirth, user.dateOfBirth);
  const givenAge = Number(record.age);
  const age =
    Number.isFinite(givenAge) && givenAge > 0 ? givenAge : dateOfBirth ? ageFromBirthDate(dateOfBirth, today) : null;
  const visits = record.totalVisits;
  const totalVisits = visits === undefined || visits === null || Number.isNaN(Number(visits)) ? null : Number(visits);

  return {
    id: asText(record.id),
    name: getPatientName(record),
    age,
    gender: firstText(record.gender, user.gender),
    phone: firstText(record.phone, user.phone),
    email: firstText(record.email, user.email),
    totalVisits,
    lastVisit: firstText(record.lastVisit) || null,
  };
}

export function genderLabel(gender: string): string {
  const clean = gender.trim().replace(/_/g, " ");
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : "";
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

/** The three numbers next to "Total Patients", worked out from the doctor's appointments. */
export function computeDoctorPatientsStats(
  appointments: Raw[],
  totalPatientsCount: number,
  now: Date = new Date(),
): DoctorPatientsStats {
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + 7);

  const upcomingAppointments = appointments.filter((appointment) => {
    const parsed = getAppointmentDateTimeValue(appointment as Parameters<typeof getAppointmentDateTimeValue>[0]);
    return (
      parsed &&
      !Number.isNaN(parsed.getTime()) &&
      parsed >= now &&
      parsed <= weekEnd &&
      ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(asText(appointment.status).toUpperCase())
    );
  }).length;

  const followUps = appointments.filter((appointment) => {
    const raw = asText(appointment.followUpDate);
    const followUpDate = raw ? new Date(raw) : null;
    return followUpDate && !Number.isNaN(followUpDate.getTime()) && followUpDate >= now && followUpDate <= weekEnd;
  }).length;

  const visitsByPatient = new Map<string, number>();
  for (const appointment of appointments) {
    const patientId = asText(appointment.patientId);
    if (!patientId) continue;
    visitsByPatient.set(patientId, (visitsByPatient.get(patientId) ?? 0) + 1);
  }
  const improvedPatients = Array.from(visitsByPatient.values()).filter((count) => count > 1).length;
  const recoveryRate = totalPatientsCount > 0 ? Math.round((improvedPatients / totalPatientsCount) * 100) : 0;

  return { upcomingAppointments, followUps, recoveryRate };
}
