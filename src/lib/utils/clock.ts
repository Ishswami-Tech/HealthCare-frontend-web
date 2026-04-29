import type { AppointmentWithRelations } from '@/types/appointment.types';

import {
  parseIstDateTime,
} from './date-time';

type AppointmentDateTimeLike = {
  startTime?: string | Date | null;
  appointmentDate?: string | Date | null;
  scheduledAt?: string | Date | null;
  date?: string | Date | null;
  time?: string | null;
  status?: string | null;
};

export function getAppointmentDateTimeValue(appointment: AppointmentDateTimeLike | null | undefined): Date | null {
  const directDateTime =
    appointment?.startTime || appointment?.appointmentDate || appointment?.scheduledAt;
  const directParsed = parseIstDateTime(directDateTime ?? undefined);
  if (directParsed) {
    return directParsed;
  }

  return parseIstDateTime(appointment?.date ?? undefined, appointment?.time ?? null);
}

export function getNextAvailableTime(currentTime: string, duration: number = 30): string {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const nextTime = new Date();
  nextTime.setHours(hours || 0, (minutes || 0) + duration, 0, 0);
  return nextTime.toTimeString().substring(0, 5);
}

export function calculateAppointmentDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

export function isAppointmentOverdue(appointment: AppointmentWithRelations): boolean {
  const now = new Date();
  const appointmentDateTime = getAppointmentDateTimeValue(appointment);
  if (!appointmentDateTime) {
    return false;
  }

  const timeDiff = now.getTime() - appointmentDateTime.getTime();
  return timeDiff > 30 * 60 * 1000 && ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
}
