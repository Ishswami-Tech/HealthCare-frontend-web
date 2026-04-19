import { AppointmentWithRelations } from '@/types/appointment.types';

export interface NormalizedPatientAppointment {
  id: string;
  raw: any;
  status: string;
  type: string;
  dateTime: Date | null;
  normalizedDate: string;
  normalizedTime: string;
  doctorName: string;
  locationName: string;
  isOnline: boolean;
}

const IN_PERSON_DEFAULT_DURATION_MINUTES = 3;
const VIDEO_DEFAULT_DURATION_MINUTES = 15;

export const IST_TIMEZONE = 'Asia/Kolkata';

export function normalizeAppointmentStatus(value: unknown): string {
  const normalized = String(value || '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  switch (normalized) {
    case 'PENDING':
    case 'AWAITING_SLOT_CONFIRMATION':
    case 'FOLLOW_UP_SCHEDULED':
    case 'RESCHEDULED':
      return 'SCHEDULED';
    case 'ACTIVE':
      return 'IN_PROGRESS';
    case 'ENDED':
      return 'COMPLETED';
    default:
      return normalized;
  }
}

function normalizeDateInput(value: Date | string): Date | null {
  const parsed = value instanceof Date ? value : new Date(value);
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
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(parsed);
}

export function formatISODateInIST(value: Date | string): string {
  return formatDateInIST(
    value,
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    'en-CA'
  );
}

export function isVideoAppointmentPaymentCompleted(appointment: any): boolean {
  if (!appointment) return false;

  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  if (type !== 'VIDEO_CALL') {
    return true;
  }

  const paymentStatus = getAppointmentPaymentStatus(appointment);

  return paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS' || paymentStatus === 'PAID';
}

export function getAppointmentPaymentStatus(appointment: any): string {
  const paymentStatus = String(
    appointment?.payment?.status ||
      appointment?.paymentStatus ||
      appointment?.billing?.paymentStatus ||
      appointment?.invoice?.paymentStatus ||
      appointment?.invoice?.status ||
      ''
  )
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase();

  if (!paymentStatus) {
    return 'N_A';
  }

  switch (paymentStatus) {
    case 'SUCCESS':
    case 'COMPLETED':
      return 'PAID';
    case 'OPEN':
    case 'PROCESSING':
    case 'CREATED':
    case 'AWAITING_PAYMENT':
      return 'PENDING';
    default:
      return paymentStatus;
  }
}

export function isAppointmentAwaitingPayment(appointment: any): boolean {
  const paymentStatus = getAppointmentPaymentStatus(appointment);
  return paymentStatus === 'PENDING' || paymentStatus === 'OVERDUE';
}

export function getAppointmentDateTimeValue(appointment: any): Date | null {
  const directDateTime =
    appointment?.startTime || appointment?.appointmentDate || appointment?.scheduledAt;

  if (typeof directDateTime === 'string' && directDateTime) {
    const parsed = new Date(directDateTime);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof appointment?.date === 'string' && appointment.date) {
    const directDate = new Date(appointment.date);
    const looksLikeFullDateTime =
      appointment.date.includes('T') ||
      appointment.date.endsWith('Z') ||
      /[+-]\d{2}:\d{2}$/.test(appointment.date);

    if (!Number.isNaN(directDate.getTime()) && (looksLikeFullDateTime || !appointment?.time)) {
      return directDate;
    }
  }

  if (appointment?.date) {
    const normalizedTime =
      typeof appointment.time === 'string' && appointment.time
        ? appointment.time.slice(0, 5)
        : '00:00';
    const parsed = new Date(`${appointment.date}T${normalizedTime}:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function getAppointmentDoctorName(appointment: any): string {
  return (
    appointment?.doctorName ||
    appointment?.doctor?.user?.name ||
    appointment?.doctor?.name ||
    `${appointment?.doctor?.user?.firstName || appointment?.doctor?.firstName || ''} ${
      appointment?.doctor?.user?.lastName || appointment?.doctor?.lastName || ''
    }`.trim() ||
    'Unknown Doctor'
  );
}

export function getAppointmentPatientName(appointment: any): string {
  return (
    appointment?.patientName ||
    appointment?.patient?.user?.name ||
    appointment?.patient?.name ||
    `${appointment?.patient?.user?.firstName || appointment?.patient?.firstName || ""} ${
      appointment?.patient?.user?.lastName || appointment?.patient?.lastName || ""
    }`.trim() ||
    "Unknown Patient"
  );
}

export function getAppointmentLocationName(appointment: any): string {
  return (
    (typeof appointment?.location === 'string'
      ? appointment.location
      : appointment?.location?.name ||
        appointment?.location?.address ||
        appointment?.locationName) ||
    appointment?.clinic?.name ||
    'Location TBD'
  );
}

export function normalizePatientAppointment(appointment: any): NormalizedPatientAppointment {
  const dateTime = getAppointmentDateTimeValue(appointment);
  const normalizedStatus = normalizeAppointmentStatus(appointment?.status);
  const normalizedTime =
    appointment?.time ||
    (dateTime
      ? formatTimeInIST(dateTime, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '');

  return {
    id: appointment?.id || '',
    raw: appointment,
    status: normalizedStatus,
    type: appointment?.type || appointment?.appointmentType || 'Consultation',
    dateTime,
    normalizedDate: dateTime ? formatISODateInIST(dateTime) : appointment?.date || '',
    normalizedTime,
    doctorName: getAppointmentDoctorName(appointment),
    locationName: getAppointmentLocationName(appointment),
    isOnline:
      Boolean(appointment?.isOnline) ||
      appointment?.type === 'VIDEO_CALL' ||
      appointment?.appointmentType === 'VIDEO_CALL',
  };
}

export function getDisplayAppointmentDuration(appointment: any): number | undefined {
  const rawDuration = Number(appointment?.duration);
  const hasNumericDuration = Number.isFinite(rawDuration) && rawDuration > 0;
  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();

  if (type === 'VIDEO_CALL') {
    if (!hasNumericDuration || rawDuration <= IN_PERSON_DEFAULT_DURATION_MINUTES) {
      return VIDEO_DEFAULT_DURATION_MINUTES;
    }
    return rawDuration;
  }

  if (hasNumericDuration) {
    return rawDuration;
  }

  if (type === 'IN_PERSON') {
    return IN_PERSON_DEFAULT_DURATION_MINUTES;
  }

  return undefined;
}

export function getNextAvailableTime(currentTime: string, duration: number = 30): string {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const nextTime = new Date();
  nextTime.setHours(hours || 0, (minutes || 0) + duration, 0, 0);
  return nextTime.toTimeString().substring(0, 5);
}

export function isAppointmentOverdue(appointment: AppointmentWithRelations): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const timeDiff = now.getTime() - appointmentDateTime.getTime();
  // Consider overdue if more than 30 minutes past scheduled time
  return timeDiff > 30 * 60 * 1000 && ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
}

export function calculateAppointmentDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function getAppointmentStatusDisplayName(status: string): string {
  const normalizedStatus = normalizeAppointmentStatus(status);
  const statusNames: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return statusNames[normalizedStatus] || normalizedStatus;
}

export function isAwaitingDoctorSlotConfirmation(appointment: any): boolean {
  const status = String(appointment?.status || '').toUpperCase();
  if (status === 'AWAITING_SLOT_CONFIRMATION') return true;

  const type = String(appointment?.type || appointment?.appointmentType || '').toUpperCase();
  if (type !== 'VIDEO_CALL') return false;

  const hasProposedSlots =
    Array.isArray(appointment?.proposedSlots) && appointment.proposedSlots.length > 0;
  const confirmedSlotIndex = appointment?.confirmedSlotIndex;
  const hasConfirmedSlot =
    confirmedSlotIndex !== null &&
    confirmedSlotIndex !== undefined &&
    !Number.isNaN(Number(confirmedSlotIndex));

  return status === 'SCHEDULED' && hasProposedSlots && !hasConfirmedSlot;
}

export function getAppointmentStatusBadgeLabel(appointment: any): string {
  if (isAwaitingDoctorSlotConfirmation(appointment)) {
    return 'Scheduled (Awaiting Doctor Confirmation)';
  }
  return getAppointmentStatusDisplayName(String(appointment?.status || ''));
}

// Theme-aware status colors
export function getAppointmentStatusColor(status: string): string {
  // Normalize status to lowercase for comparison if needed, or match keys exactly
  // Assuming keys are uppercase from backend
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-primary/10 text-primary border-primary/20',
    CONFIRMED: 'bg-primary/10 text-primary border-primary/20',
    IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
    COMPLETED: 'bg-green-500/10 text-green-700 border-green-500/20', // Distinct green for completed
    CANCELLED: 'bg-destructive/10 text-destructive border-destructive/20',
    NO_SHOW: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  
  // Handle lowercase variants just in case
  const normalizedStatus = normalizeAppointmentStatus(status);
  return statusColors[normalizedStatus] || 'bg-muted text-muted-foreground border-border';
}

export function formatAppointmentDateTime(date: string, time: string): string {
  return formatDateInIST(
    new Date(`${date}T${time}`),
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    },
    'en-IN'
  );
}

export function formatAppointmentDate(dateString: string): string {
  return formatDateInIST(
    dateString,
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    },
    'en-IN'
  );
}

export function formatAppointmentTime(timeString: string): string {
  // Append dummy date to parse time correctly
  return formatTimeInIST(
    new Date(`2000-01-01T${timeString}`),
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
    'en-IN'
  );
}

/**
 * Parse a receptionist appointment raw API object into a Date.
 *
 * The backend may return:
 *   - startTime: "HH:mm" (time-only) + appointmentDate: "YYYY-MM-DD" or full ISO
 *   - time: "HH:mm" (alias) + date/appointmentDate
 *   - startTime: full ISO string
 *   - date: "YYYY-MM-DD" + time: "HH:mm"
 *
 * Handles all variants without producing Invalid Date.
 */
export function parseReceptionistAppointmentDateTime(app: Record<string, unknown>): Date | null {
  const startTime = typeof app.startTime === 'string' ? app.startTime : '';
  const timeField = typeof app.time === 'string' ? app.time : '';
  const appointmentDate =
    typeof app.appointmentDate === 'string' ? app.appointmentDate : '';
  const date = typeof app.date === 'string' ? app.date : '';

  // Determine the effective time string (prefer startTime, fall back to time)
  const effectiveTime = startTime || timeField;

  // Case 1: time value is "HH:mm" (time-only) — combine with date field
  if (effectiveTime && /^\d{2}:\d{2}/.test(effectiveTime) && !effectiveTime.includes('T')) {
    const datePart = (appointmentDate || date).slice(0, 10);
    if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const d = new Date(`${datePart}T${effectiveTime.slice(0, 5)}:00`);
      if (!Number.isNaN(d.getTime())) return d;
    }
    // time-only with no usable date context — use dummy date for time display
    const d = new Date(`2000-01-01T${effectiveTime.slice(0, 5)}:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 2: startTime is a full ISO datetime
  if (startTime && startTime.includes('T')) {
    const d = new Date(startTime);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 3: appointmentDate is a full ISO datetime (may include time)
  if (appointmentDate) {
    const d = new Date(appointmentDate);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Case 4: date + time
  if (date) {
    const normalizedTime = timeField ? timeField.slice(0, 5) : '00:00';
    const d = new Date(`${date}T${normalizedTime}:00`);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/** Formats any raw date/ISO string into a readable date label in IST. */
function formatRawDateLabel(raw: string, locale: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Returns a human-readable date label for a receptionist appointment row.
 * Falls back to 'TBD' if no valid date can be parsed.
 */
export function getReceptionistAppointmentDateLabel(
  app: Record<string, unknown>,
  locale = 'en-IN'
): string {
  const parsed = parseReceptionistAppointmentDateTime(app);
  const startTime = typeof app.startTime === 'string' ? app.startTime : '';
  const timeField = typeof app.time === 'string' ? app.time : '';
  const effectiveTime = startTime || timeField;
  const appointmentDate = typeof app.appointmentDate === 'string' ? app.appointmentDate : '';
  const date = typeof app.date === 'string' ? app.date : '';

  if (!parsed) {
    // Try to format the raw date string nicely
    const rawDate = appointmentDate || date;
    return rawDate ? formatRawDateLabel(rawDate, locale) : 'TBD';
  }

  // If time-only with no real date context (dummy 2000-01-01), return TBD for date
  const hasDateContext = Boolean(appointmentDate || date);
  const isTimeOnlyField = effectiveTime && /^\d{2}:\d{2}/.test(effectiveTime) && !effectiveTime.includes('T');
  if (isTimeOnlyField && !hasDateContext) {
    return 'TBD';
  }

  // If parsed from dummy date (2000-01-01), don't show that fake date
  if (parsed.getFullYear() === 2000 && parsed.getMonth() === 0 && parsed.getDate() === 1 && isTimeOnlyField) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

/**
 * Returns a human-readable time label for a receptionist appointment row.
 * Falls back to 'TBD' if no valid time can be parsed.
 */
export function getReceptionistAppointmentTimeLabel(
  app: Record<string, unknown>,
  locale = 'en-IN'
): string {
  const parsed = parseReceptionistAppointmentDateTime(app);
  if (!parsed) {
    const startTime = typeof app.startTime === 'string' ? app.startTime : '';
    const time = typeof app.time === 'string' ? app.time : '';
    return startTime || time || 'TBD';
  }
  return new Intl.DateTimeFormat(locale, {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsed);
}
