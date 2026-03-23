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

export const IST_TIMEZONE = 'Asia/Kolkata';

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

  const paymentStatus = String(
    appointment?.payment?.status ||
      appointment?.paymentStatus ||
      appointment?.billing?.paymentStatus ||
      appointment?.invoice?.paymentStatus ||
      ''
  ).toUpperCase();

  return paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCESS' || paymentStatus === 'PAID';
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
    status: String(appointment?.status || ''),
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
  const normalizedStatus = status.toUpperCase();
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
  const normalizedStatus =
    status.toUpperCase();
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
