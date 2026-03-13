import { AppointmentWithRelations } from '@/types/appointment.types';

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

export function formatAppointmentDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatAppointmentTime(timeString: string): string {
  // Append dummy date to parse time correctly
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
