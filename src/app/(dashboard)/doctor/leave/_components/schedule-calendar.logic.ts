/**
 * Pure helpers for the doctor's "Month at a glance" schedule calendar. The page component
 * renders the marks, this module only decides which day gets which mark — no React in here,
 * so every function is unit-testable on its own.
 *
 * Conventions shared with the rest of the leave page:
 * - a day key is an IST "YYYY-MM-DD" string (the page's `formatDateKeyInIST` convention);
 * - weekday keys are lowercase names ("monday") in the slot-engine's Monday-first order.
 *
 * Day arithmetic here is plain calendar-date arithmetic on the "YYYY-MM-DD" text (anchored at
 * UTC midnight so the parts never shift): a day key is a date, not an instant, so the IST
 * offset only matters when a key is turned into a timestamp for display.
 */
import type { OpdDay, OpdWeek, TimeBlock } from "./DoctorWeeklyOPDSchedule";

/** Slot-engine weekday keys, Monday first — the same keys the OPD editor and profile save use. */
export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAY_KEYS: readonly WeekdayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

/** An IST day key, "YYYY-MM-DD" — the first ten characters of any stored timestamp. */
export type DayKey = string;

/**
 * A mark the calendar draws on one day cell:
 * - "LEAVE" — a PENDING or APPROVED full-day leave row covers this day (rose tint);
 * - "PARTIAL" — a PENDING or APPROVED reduced-hours / break row covers this day (amber dot).
 * Appointment counts stay in the day-detail strip only; a counter in every cell would just
 * add noise. A day can carry both marks at once.
 */
export type DayMark = "LEAVE" | "PARTIAL";

/** The minimal shape this module reads from a leave-request row. */
export interface LeaveMarkRow {
  kind: string;
  startDate: DayKey;
  endDate: DayKey;
  status: string;
}

/** The statuses a day mark is drawn for — declined and cancelled rows leave no trace. */
const MARKED_LEAVE_STATUSES = new Set(["PENDING", "APPROVED"]);

/** "YYYY-MM-DD" IST -> "YYYY-MM", the month a day key belongs to. */
export function monthKeyOf(dayKey: DayKey): string {
  return dayKey.slice(0, 7);
}

/** The calendar date a day key points at, anchored at UTC midnight so its parts are stable. */
function dateOfDayKey(dayKey: DayKey): Date | null {
  const parsed = new Date(`${dayKey}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * The weekday of a day key, in the slot-engine's Monday-first keys. `null` when the key is
 * not a readable date.
 */
export function weekdayKeyOf(dayKey: DayKey): WeekdayKey | null {
  const parsed = dateOfDayKey(dayKey);
  if (!parsed) return null;
  const jsDay = parsed.getUTCDay(); // 0 = Sunday
  return jsDay === 0 ? "sunday" : (WEEKDAY_KEYS[jsDay - 1] ?? null);
}

/** All day keys of one "YYYY-MM" month: "YYYY-MM-01" through the month's last day. */
export function monthDayKeys(monthKey: string): DayKey[] {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return [];
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const keys: DayKey[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    keys.push(`${monthKey}-${String(day).padStart(2, "0")}`);
  }
  return keys;
}

/**
 * Every day key in `startDate`–`endDate` (both ends inclusive), or an empty list when the
 * pair is malformed or inverted. "YYYY-MM-DD" strings compare chronologically, so the bounds
 * check is a plain string compare and the walk steps one calendar day at a time.
 */
export function dayKeysInRange(startDate: DayKey, endDate: DayKey): DayKey[] {
  if (!startDate || !endDate || endDate < startDate) return [];
  if (startDate === endDate) return [startDate];

  const days: DayKey[] = [];
  let cursor = dateOfDayKey(startDate);
  if (!cursor) return days;
  // One day at a time; the length cap guards a malformed range.
  while (days.length < 1_000) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}-${String(cursor.getUTCDate()).padStart(2, "0")}`;
    if (key > endDate) break;
    days.push(key);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

/** Does `dayKey` fall inside the row's inclusive start–end window? */
export function leaveRowCoversDay(
  row: Pick<LeaveMarkRow, "startDate" | "endDate">,
  dayKey: DayKey,
): boolean {
  if (!dayKey) return false;
  const from = row.startDate ?? "";
  const to = row.endDate ?? "";
  return from !== "" && to !== "" && dayKey >= from && dayKey <= to;
}

/**
 * Which leave rows paint which day cells: PENDING and APPROVED full-day leaves get the rose
 * "LEAVE" mark, PENDING and APPROVED reduced hours / breaks get the amber "PARTIAL" mark.
 * Rows overlap, so the marks are combined; only day keys inside `monthDays` are returned —
 * leave that spills into another month is collected when that month is displayed.
 */
export function leaveMarksForMonth(
  rows: readonly LeaveMarkRow[],
  monthDays: readonly DayKey[],
): Map<DayKey, DayMark[]> {
  const marks = new Map<DayKey, DayMark[]>();
  if (monthDays.length === 0) return marks;
  const dayKeys = new Set(monthDays);

  for (const row of rows) {
    if (!MARKED_LEAVE_STATUSES.has(row.status)) continue;
    const mark: DayMark = row.kind === "LEAVE" ? "LEAVE" : "PARTIAL";
    for (const key of dayKeysInRange(row.startDate, row.endDate)) {
      if (!dayKeys.has(key)) continue;
      const existing = marks.get(key) ?? [];
      if (!existing.includes(mark)) marks.set(key, [...existing, mark]);
    }
  }

  return marks;
}

/**
 * The weekday keys with no OPD block in a parsed weekly schedule (`loadOpdWeek`'s result,
 * the same shape the OPD editor below the calendar keeps) — the "closed" cells the calendar
 * mutes. A day that is missing, not available, or carries no readable block all count as
 * closed, which is the safe booking interpretation: no block, no slot, no patient.
 */
export function closedWeekdaysOf(week: OpdWeek | unknown): Set<WeekdayKey> {
  const parsed = week && typeof week === "object" && !Array.isArray(week) ? (week as OpdWeek) : {};
  const closed = new Set<WeekdayKey>();
  for (const day of WEEKDAY_KEYS) {
    const state: OpdDay | undefined = parsed[day];
    const hasBlock = Array.isArray(state?.blocks) && state.blocks.some((block) => block?.start && block?.end);
    if (!hasBlock) closed.add(day);
  }
  return closed;
}

/** The OPD blocks one weekday holds in a parsed weekly schedule (the detail strip lists these). */
export function opdBlocksForDay(week: OpdWeek | unknown, weekday: WeekdayKey): TimeBlock[] {
  const parsed = week && typeof week === "object" && !Array.isArray(week) ? (week as OpdWeek) : {};
  const state = parsed[weekday];
  if (!state || !Array.isArray(state.blocks)) return [];
  return state.blocks.filter((block) => block?.start && block?.end);
}
