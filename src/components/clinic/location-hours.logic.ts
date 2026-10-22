/** Weekly hours of one clinic location (`ClinicLocation.workingHours`), as the location edit screen edits them. */

export const WEEK_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export interface DaySession {
  start: string;
  end: string;
}

export interface DayHours {
  open: boolean;
  start: string;
  end: string;
  /** Split sessions read from the server (e.g. 09:00-13:00 + 16:00-20:00), kept until the day is edited. */
  sessions?: DaySession[];
}

export type WeekHours = Record<WeekDay, DayHours>;

/** What the backend validator accepts (working-hours.util.ts): one session for every day, or per day. */
export type WorkingHoursPayload = DaySession | Record<WeekDay, DaySession | DaySession[] | null>;

const DEFAULT_DAY: DayHours = { open: true, start: "09:30", end: "20:00" };
const TIME = /^\d{2}:\d{2}$/;

function parseRaw(value: unknown): Record<string, unknown> {
  let raw: unknown = value;
  // The column has held a JSON string, sometimes encoded twice ("\"{...}\"").
  for (let depth = 0; depth < 2 && typeof raw === "string"; depth += 1) {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = {};
    }
  }
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

function asSession(value: unknown): DaySession | null {
  if (!value || typeof value !== "object") return null;
  const { start, end } = value as { start?: unknown; end?: unknown };
  if (typeof start !== "string" || typeof end !== "string") return null;
  return { start: start.slice(0, 5), end: end.slice(0, 5) };
}

function readDay(entry: unknown): DayHours | null {
  if (Array.isArray(entry)) {
    const sessions = entry.map(asSession).filter((session): session is DaySession => session !== null);
    if (sessions.length === 0) return null;
    const first = sessions[0] as DaySession;
    const last = sessions[sessions.length - 1] as DaySession;
    return { open: true, start: first.start, end: last.end, ...(sessions.length > 1 ? { sessions } : {}) };
  }
  const session = asSession(entry);
  return session ? { open: true, ...session } : null;
}

/**
 * Reads the stored value (object or JSON string, keys in any case). Accepts the flat
 * `{ start, end }` form (same hours every day) and the per-day form (`{ start, end }`, an array of
 * sessions, or null per day). Days missing from a per-day value are closed; an empty / unreadable
 * value falls back to Mon-Sat open.
 */
export function readWeekHours(value: unknown): WeekHours {
  const source = parseRaw(value);
  const lower: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(source)) lower[key.toLowerCase()] = entry;

  const flat = asSession(lower);
  const result = {} as WeekHours;
  if (flat && !WEEK_DAYS.some((day) => day in lower)) {
    for (const day of WEEK_DAYS) result[day] = { open: true, ...flat };
    return result;
  }

  const hasAnyDay = WEEK_DAYS.some((day) => day in lower);
  for (const day of WEEK_DAYS) {
    const read = readDay(lower[day]);
    result[day] = read ?? { ...DEFAULT_DAY, open: !hasAnyDay && day !== "sunday" };
  }
  return result;
}

/**
 * The value to save. Every day open with the same single session is written in the flat
 * `{ start, end }` form (how such locations are stored); otherwise per day, closed days as null and
 * untouched split days as their sessions.
 */
export function writeWeekHours(hours: WeekHours): WorkingHoursPayload {
  const first = hours.monday;
  const uniform = WEEK_DAYS.every((day) => {
    const entry = hours[day];
    return entry.open && !entry.sessions && entry.start === first.start && entry.end === first.end;
  });
  if (uniform) return { start: first.start, end: first.end };

  const out = {} as Record<WeekDay, DaySession | DaySession[] | null>;
  for (const day of WEEK_DAYS) {
    const entry = hours[day];
    if (!entry.open) out[day] = null;
    else if (entry.sessions && entry.sessions.length > 1) out[day] = entry.sessions.map((session) => ({ ...session }));
    else out[day] = { start: entry.start, end: entry.end };
  }
  return out;
}

/** Applies an edit to one day; an edited split day becomes a single session. */
export function editDay(hours: WeekHours, day: WeekDay, patch: Partial<Omit<DayHours, "sessions">>): WeekHours {
  const { sessions, ...current } = hours[day];
  const touchesTimes = patch.start !== undefined || patch.end !== undefined;
  const next: DayHours = { ...current, ...patch, ...(sessions && !touchesTimes ? { sessions } : {}) };
  return { ...hours, [day]: next };
}

/** First problem in the week, or null: open days need HH:mm times with start before end, and at least one day must be open. */
export function weekHoursError(hours: WeekHours): string | null {
  if (WEEK_DAYS.every((day) => !hours[day].open)) {
    return "Keep at least one day open. To stop bookings here, deactivate the location instead.";
  }
  for (const day of WEEK_DAYS) {
    const entry = hours[day];
    if (!entry.open) continue;
    if (!TIME.test(entry.start) || !TIME.test(entry.end)) return `Enter both times for ${day}.`;
    if (entry.start >= entry.end) return `On ${day} the opening time must be before the closing time.`;
  }
  return null;
}

export function copyMondayToWeekdays(hours: WeekHours): WeekHours {
  const next = { ...hours };
  for (const day of ["tuesday", "wednesday", "thursday", "friday"] as const) next[day] = { ...hours.monday };
  return next;
}

export interface LocationBasics {
  name: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

/**
 * The PATCH body: only the fields that changed (trimmed), and the hours only when they changed.
 * An untouched blank field is never sent, so a form that could not read a value cannot wipe it.
 */
export function locationChanges(
  initial: LocationBasics,
  edited: LocationBasics,
  initialHours: WeekHours,
  editedHours: WeekHours,
): Partial<LocationBasics> & { workingHours?: WorkingHoursPayload } {
  const changes: Partial<LocationBasics> & { workingHours?: WorkingHoursPayload } = {};
  for (const key of ["name", "phone", "address", "city", "zipCode"] as const) {
    const next = edited[key].trim();
    if (next !== initial[key].trim()) changes[key] = next;
  }
  const nextHours = writeWeekHours(editedHours);
  if (JSON.stringify(nextHours) !== JSON.stringify(writeWeekHours(initialHours))) changes.workingHours = nextHours;
  return changes;
}
