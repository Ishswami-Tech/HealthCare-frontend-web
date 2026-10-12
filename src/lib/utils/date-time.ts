export const IST_TIMEZONE = 'Asia/Kolkata';

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function normalizeDateInput(value: Date | string): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getIstDateParts(value: Date): {
  year: number;
  month: number;
  day: number;
} {
  const istDate = new Date(value.getTime() + IST_OFFSET_MS);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth() + 1,
    day: istDate.getUTCDate(),
  };
}

export function normalizeTimeInputToTwentyFourHour(timeValue: string): string | null {
  const value = String(timeValue || '').trim().toLowerCase();
  if (!value) {
    return null;
  }

  const directMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm))?$/);
  const dottedMatch = value.match(/^(\d{1,2})\.(\d{2})(?:\s*(am|pm))?$/);
  const hourOnlyMatch = value.match(/^(\d{1,2})(?:\s*(am|pm))$/);
  const matched = directMatch || dottedMatch || hourOnlyMatch;

  if (!matched) {
    return null;
  }

  const hour = Number(matched[1] || '0');
  const minute = Number(matched[2] || '0');
  const second = Number(directMatch?.[3] || '0');
  const meridiem = (directMatch?.[4] || dottedMatch?.[3] || hourOnlyMatch?.[2] || '').toLowerCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute < 0 || minute > 59) {
    return null;
  }

  let normalizedHour = hour;
  if (meridiem === 'am') {
    normalizedHour = hour === 12 ? 0 : hour;
  } else if (meridiem === 'pm') {
    normalizedHour = hour === 12 ? 12 : hour + 12;
  }

  if (!Number.isFinite(normalizedHour) || normalizedHour < 0 || normalizedHour > 23) {
    return null;
  }

  return `${String(normalizedHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(
    Number.isFinite(second) ? second : 0
  ).padStart(2, '0')}`;
}

export function parseIstDateTime(
  dateInput: Date | string | undefined,
  timeInput?: string | null
): Date | null {
  if (!dateInput) {
    return null;
  }

  const dateValue = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(dateValue.getTime())) {
    return null;
  }

  const hasExplicitTimeInput = typeof timeInput === 'string' && timeInput.trim().length > 0;
  if (!hasExplicitTimeInput) {
    if (typeof dateInput === 'string') {
      const direct = new Date(dateInput);
      return Number.isNaN(direct.getTime()) ? null : direct;
    }
    return dateValue;
  }

  const normalizedTime = normalizeTimeInputToTwentyFourHour(timeInput);
  if (!normalizedTime) {
    return null;
  }

  const datePart = formatDateKeyInIST(dateValue);
  const parsed = new Date(`${datePart}T${normalizedTime}+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateInIST(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  },
  locale = 'en-IN'
): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString(locale, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

export function formatMonthShortInIST(value: Date | string, locale = 'en-US'): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString(locale, {
    timeZone: IST_TIMEZONE,
    month: 'short',
  });
}

export function formatTimeInIST(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  locale = 'en-IN'
): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) return '';

  // 24-hour times are always written the en-US way ("09:30"), whatever the locale.
  const twentyFourHour = options.hour12 === false;
  return parsed.toLocaleTimeString(twentyFourHour ? 'en-US' : locale, {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options,
    hour12: !twentyFourHour,
  });
}

export function formatISODateInIST(value: Date | string): string {
  return formatDateKeyInIST(value);
}

export function formatDateKeyInIST(value: Date | string): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) {
    return '';
  }

  const { year, month, day } = getIstDateParts(parsed);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatTimeValueInIST(timeValue: string, locale = 'en-IN'): string {
  const normalizedTime = normalizeTimeInputToTwentyFourHour(timeValue);
  if (normalizedTime) {
    const parsed = new Date(`2000-01-01T${normalizedTime}+05:30`);
    if (!Number.isNaN(parsed.getTime())) {
      return formatTimeInIST(
        parsed,
        {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        },
        locale
      );
    }
  }

  const parsed = new Date(timeValue);
  if (!Number.isNaN(parsed.getTime())) {
    return formatTimeInIST(
      parsed,
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      },
      locale
    );
  }

  return String(timeValue || '').trim();
}

export function formatDateTimeInIST(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  locale = 'en-IN'
): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) return '';
  return parsed.toLocaleDateString(locale, {
    timeZone: IST_TIMEZONE,
    ...options,
  });
}

// ── Labels shown to people ─────────────────────────────────────────────────
// One spelling for every screen: "3 Oct 2026", "08:30 am", "3 Oct 2026, 08:30 am".

type DateLabelInput = Date | string | null | undefined;

/** Shown where a date is missing or cannot be read. */
export const EMPTY_DATE_LABEL = '—';

/** "3 Oct 2026" in IST. `fallback` (default "") when the date is missing or invalid. */
export function formatDateLabel(value: DateLabelInput, fallback = ''): string {
  if (!value) return fallback;
  return formatDateInIST(value, { day: 'numeric', month: 'short', year: 'numeric' }) || fallback;
}

/** "Oct 2026" in IST (an expiry month). `fallback` when the date is missing or invalid. */
export function formatMonthYearLabel(value: DateLabelInput, fallback = ''): string {
  if (!value) return fallback;
  return formatDateInIST(value, { month: 'short', year: 'numeric' }) || fallback;
}

/** Writes the am / pm of a time label in lower case ("10:00 AM" -> "10:00 am"), the one style of the app. */
export function lowerMeridiem(label: string): string {
  return label.replace(/\b(am|pm)\b/gi, (meridiem) => meridiem.toLowerCase());
}

/** "08:30 am" in IST, am / pm in lower case. `fallback` when the time is missing or invalid. */
export function formatTimeLabel(value: DateLabelInput, fallback = ''): string {
  if (!value) return fallback;
  return lowerMeridiem(formatTimeInIST(value)) || fallback;
}

/** "3 Oct 2026, 08:30 am" in IST. `fallback` when the date is missing or invalid. */
export function formatDateTimeLabel(value: DateLabelInput, fallback = ''): string {
  const date = formatDateLabel(value);
  if (!date) return fallback;
  return [date, formatTimeLabel(value)].filter(Boolean).join(', ');
}

// ── Age ────────────────────────────────────────────────────────────────────

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

/** Oldest age shown; a birth date further back is treated as a data-entry mistake. */
const MAX_AGE_YEARS = 130;

function calendarParts(value: Date | string): { year: number; month: number; day: number } | null {
  if (typeof value === 'string') {
    // A stored birthday is UTC midnight ("2018-04-12T00:00:00.000Z"): its first ten characters
    // are the day that was entered, whatever the time zone of this device.
    const match = DATE_KEY_PATTERN.exec(value.trim());
    if (match) return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }
  const parsed = normalizeDateInput(value);
  if (!parsed) return null;
  return { year: parsed.getFullYear(), month: parsed.getMonth() + 1, day: parsed.getDate() };
}

/**
 * Completed months between a birth date and `today` (this device's calendar day).
 * `null` when the birth date is missing, invalid or in the future.
 */
export function ageInMonths(dateOfBirth: DateLabelInput, today: Date = new Date()): number | null {
  if (!dateOfBirth) return null;
  const born = calendarParts(dateOfBirth);
  if (!born) return null;
  const now = { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  let months = (now.year - born.year) * 12 + (now.month - born.month);
  if (now.day < born.day) months -= 1;
  return months >= 0 ? months : null;
}

/**
 * Age in whole years from a birth date. `null` when the birth date is missing, invalid, in
 * the future or more than 130 years back.
 */
export function ageInYears(dateOfBirth: DateLabelInput, today: Date = new Date()): number | null {
  const months = ageInMonths(dateOfBirth, today);
  if (months === null) return null;
  const years = Math.floor(months / 12);
  return years < MAX_AGE_YEARS ? years : null;
}

function getNowIso(): string {
  return new Date().toISOString();
}

export { getNowIso as nowIso };
