export const IST_TIMEZONE = 'Asia/Kolkata';

function normalizeDateInput(value: Date | string): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(parsed);
}

export function formatMonthShortInIST(value: Date | string, locale = 'en-US'): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    month: 'short',
  }).format(parsed);
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

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(parsed);

  const hourPart = timeParts.find((part) => part.type === 'hour')?.value || '00';
  const minutePart = timeParts.find((part) => part.type === 'minute')?.value || '00';

  if (options.hour12 === false) {
    return `${hourPart}:${minutePart}`;
  }

  const hour24 = Number(hourPart);
  const hour12 = hour24 % 12 || 12;
  const suffix = hour24 >= 12 ? 'pm' : 'am';
  return `${String(hour12).padStart(2, '0')}:${minutePart} ${suffix}`;
}

export function formatISODateInIST(value: Date | string): string {
  return formatDateKeyInIST(value);
}

export function formatDateKeyInIST(value: Date | string): string {
  const parsed = normalizeDateInput(value);
  if (!parsed) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return year && month && day ? `${year}-${month}-${day}` : '';
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
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(parsed);
}

function getNowIso(): string {
  return new Date().toISOString();
}

export { getNowIso as nowIso };
