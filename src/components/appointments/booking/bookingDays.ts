/**
 * Which calendar days the booking dialog offers. Mirrors the server, which decides every day with
 * one rule (backend `clinic-working-days.util` `resolveDayBookability` + the session cascade of
 * `getDoctorAvailability`), so a day the calendar offers is a day the slot grid and the booking
 * accept, and a day they refuse is greyed out here:
 *
 *   1. a holiday / closure date is closed;
 *   2. a weekday outside the clinic's `workingDays` setting is closed (unset = Monday to Friday);
 *   3. in-clinic: a location with per-day hours closes the days it has no session on;
 *   4. hours for the day come from the location, else the doctor's own hours for that day, else
 *      the clinic's `operatingWindowsByDay`; when hours are configured somewhere but none cover
 *      the day, it is closed. With no hours stored anywhere the day stays open (server defaults).
 *
 * The doctor's own weekly hours therefore do not close a day the clinic works when the location
 * (or clinic) gives that day hours: turning Saturday on in the clinic settings opens Saturday.
 * Pure: no React, no dates beyond the weekday.
 */

import { readClinicWindows, readWeeklyWindows } from "./clinicHours";

export const BOOKING_WEEK_DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type BookingWeekDay = (typeof BOOKING_WEEK_DAYS)[number];

/** Before the clinic setting existed the server refused Saturday and Sunday. */
export const DEFAULT_BOOKING_WORKING_DAYS: readonly BookingWeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export interface BookingDayInput {
  /** Weekday index of the day, as `Date#getDay()` (0 = Sunday). */
  weekDayIndex: number;
  /** Every key the day may be stored under in the holiday list (local and IST `YYYY-MM-DD`). */
  dateKeys: readonly string[];
  /** Holiday / closure day keys of the clinic. */
  closedDateKeys: ReadonlySet<string>;
  /** `clinic.settings.appointmentSettings` (workingDays, operatingWindowsByDay); null when unknown. */
  appointmentSettings: Record<string, unknown> | null;
  /** Working hours of the location the visit is at (JSON or JSON string); optional. */
  locationWorkingHours?: unknown;
  /** The doctor's weekly hours (`{ monday: [{ start, end }] }`); optional. */
  doctorWorkingHours?: unknown;
  /** In-clinic visits are bound by the location's days; video calls are not. */
  inClinic: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonish(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function toWeekDay(value: unknown): BookingWeekDay | null {
  if (typeof value === "number" && Number.isInteger(value)) return BOOKING_WEEK_DAYS[value] ?? null;
  if (typeof value !== "string") return null;
  const name = value.trim().toLowerCase();
  return BOOKING_WEEK_DAYS.find((day) => day === name || day.slice(0, 3) === name) ?? null;
}

/** The clinic's working days from its settings; an unset, empty or unreadable list is Monday to Friday. */
export function resolveBookingWorkingDays(appointmentSettings: Record<string, unknown> | null): BookingWeekDay[] {
  const raw = appointmentSettings?.workingDays;
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_BOOKING_WORKING_DAYS];
  const days: BookingWeekDay[] = [];
  for (const item of raw) {
    const day = toWeekDay(item);
    if (!day) return [...DEFAULT_BOOKING_WORKING_DAYS];
    if (!days.includes(day)) days.push(day);
  }
  return days;
}

/** Days a location is open from per-day hours, or null when its hours do not name days. */
export function locationOpenWeekDays(workingHours: unknown): BookingWeekDay[] | null {
  const parsed = parseJsonish(workingHours);
  if (!isRecord(parsed)) return null;
  const entries = Object.entries(parsed).map(([key, value]) => [key.toLowerCase(), value] as const);
  if (!entries.some(([key]) => (BOOKING_WEEK_DAYS as readonly string[]).includes(key))) return null;
  return BOOKING_WEEK_DAYS.filter((day) => {
    const value = entries.find(([key]) => key === day)?.[1];
    return Array.isArray(value) ? value.some(isRecord) : isRecord(value);
  });
}

/** True when the booking calendar must grey the day out. */
export function isBookingDayClosed(input: BookingDayInput): boolean {
  if (input.dateKeys.some((key) => input.closedDateKeys.has(key))) return true;
  const weekDay = BOOKING_WEEK_DAYS[input.weekDayIndex];
  if (!weekDay) return false;
  if (!resolveBookingWorkingDays(input.appointmentSettings).includes(weekDay)) return true;

  const locationHours = parseJsonish(input.locationWorkingHours);
  if (input.inClinic) {
    const locationDays = locationOpenWeekDays(locationHours);
    if (locationDays && !locationDays.includes(weekDay)) return true;
  }

  const clinicWindows = input.appointmentSettings?.operatingWindowsByDay;
  const hasOwnHours =
    readWeeklyWindows(locationHours, weekDay).length > 0 ||
    readWeeklyWindows(input.doctorWorkingHours, weekDay).length > 0 ||
    (isRecord(clinicWindows) && readClinicWindows(parseJsonish(clinicWindows[weekDay])).length > 0);
  if (hasOwnHours) return false;
  // Hours are configured somewhere but none cover this weekday: the server says "closed".
  const hoursConfigured = Boolean(locationHours) || Boolean(input.doctorWorkingHours) || isRecord(clinicWindows);
  return hoursConfigured;
}
