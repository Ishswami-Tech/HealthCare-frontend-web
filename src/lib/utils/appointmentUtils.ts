import { AppointmentWithRelations } from '@/types/appointment.types';

export function getNextAvailableTime(currentTime: string, duration: number = 30): string {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const nextTime = new Date();
  nextTime.setHours(hours, minutes + duration, 0, 0);
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
  const statusNames: Record<string, string> = {
    SCHEDULED: 'Scheduled',
    CONFIRMED: 'Confirmed',
    CHECKED_IN: 'Checked In',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };
  return statusNames[status] || status;
}

export function getAppointmentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CHECKED_IN: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-orange-100 text-orange-800',
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function formatAppointmentDateTime(date: string, time: string): string {
  const appointmentDate = new Date(`${date}T${time}`);
  return appointmentDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
} 