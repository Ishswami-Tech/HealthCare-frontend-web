/**
 * Doctor weekly schedule <-> `Doctor.workingHours` JSON (backend `doctor-schedule.util.ts`).
 *
 * The backend has no `/doctors/:id/schedule` route: the schedule is the doctor's `workingHours`,
 * read with `GET /doctors/:id` and written with `PATCH /doctors/:id { workingHours }`. The JSON is
 * `{ monday: [{ start: 'HH:mm', end: 'HH:mm' }], ... }`; an empty array means "not available".
 */

const WEEK_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
type WeekDay = (typeof WEEK_DAYS)[number];

export interface WorkingHoursSession {
  start: string;
  end: string;
}

export type DoctorWorkingHours = Record<WeekDay, WorkingHoursSession[]>;

/** One day of the schedule screen: `day` is "Monday", `dayOfWeek` 0 = Sunday. */
export interface WeeklyScheduleDay {
  day: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface WeeklyScheduleInput {
  /** 0 = Sunday ... 6 = Saturday. */
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function time(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = TIME.exec(value.trim());
  return match ? `${match[1]?.padStart(2, "0")}:${match[2]}` : null;
}

function sessionsOf(value: unknown): WorkingHoursSession[] {
  const list = Array.isArray(value) ? value : isRecord(value) ? [value] : [];
  return list.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const start = time(entry.start);
    const end = time(entry.end);
    return start && end ? [{ start, end }] : [];
  });
}

const capitalize = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

/** The `workingHours` JSON of a doctor answer (bare, in `data`, or in `doctor`). */
export function workingHoursOf(doctor: unknown): unknown {
  if (!isRecord(doctor)) return null;
  if ("workingHours" in doctor) return doctor.workingHours;
  if (isRecord(doctor.data)) return workingHoursOf(doctor.data);
  if (isRecord(doctor.doctor)) return workingHoursOf(doctor.doctor);
  return null;
}

/** The seven days of the week; empty when the doctor has no per-day JSON schedule yet. */
export function workingHoursToWeeklySchedule(workingHours: unknown): WeeklyScheduleDay[] {
  if (!isRecord(workingHours) || !WEEK_DAYS.some((day) => day in workingHours)) return [];
  return WEEK_DAYS.map((day, dayOfWeek) => {
    const sessions = sessionsOf(workingHours[day]);
    return {
      day: capitalize(day),
      dayOfWeek,
      startTime: sessions[0]?.start ?? "",
      endTime: sessions[sessions.length - 1]?.end ?? "",
      isAvailable: sessions.length > 0,
    };
  });
}

/** The per-day JSON to PATCH. Days left out are unavailable (the screen sends the whole week). */
export function weeklyScheduleToWorkingHours(schedule: readonly WeeklyScheduleInput[]): DoctorWorkingHours {
  const byDay = Object.fromEntries(WEEK_DAYS.map((day) => [day, [] as WorkingHoursSession[]])) as DoctorWorkingHours;
  for (const entry of schedule) {
    const day = WEEK_DAYS[entry.dayOfWeek];
    if (!day || !entry.isAvailable) continue;
    const start = time(entry.startTime);
    const end = time(entry.endTime);
    if (!start || !end || end <= start) {
      throw new Error(`${capitalize(day)}: the end time must be after the start time.`);
    }
    byDay[day] = [{ start, end }];
  }
  return byDay;
}
