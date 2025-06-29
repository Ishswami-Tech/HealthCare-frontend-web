'use server';

import { 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  ProcessCheckInData,
  ReorderQueueData,
  VerifyAppointmentQRData,
  CompleteAppointmentData,
  StartConsultationData,
  AppointmentFilters,
  AppointmentWithRelations,
  DoctorAvailability,
  QueuePosition,
  AppointmentQueue,
  QRCodeResponse,
  AppointmentConfirmation,
  AppointmentLocation,
  DoctorWithUser
} from '@/types/appointment.types';
import { getServerSession } from './auth.server';

// API URL configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID;

/**
 * Base API call function with authentication
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    'Session-ID': session.session_id,
    ...(CLINIC_ID ? { 'X-Clinic-ID': CLINIC_ID } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return { status: response.status, data };
}

// ===== APPOINTMENT CRUD OPERATIONS =====

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get all appointments with optional filtering
 */
export async function getAppointments(filters?: AppointmentFilters): Promise<AppointmentWithRelations[]> {
  const queryParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
  }

  const endpoint = `/appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiCall<AppointmentWithRelations[]>(endpoint);
  return response.data;
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/${id}`);
  return response.data;
}

/**
 * Update an appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id: string): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

// ===== DOCTOR AVAILABILITY =====

/**
 * Get doctor availability for a specific date
 */
export async function getDoctorAvailability(doctorId: string, date: string): Promise<DoctorAvailability> {
  const response = await apiCall<DoctorAvailability>(`/appointments/doctor/${doctorId}/availability?date=${date}`);
  return response.data;
}

/**
 * Get user's upcoming appointments
 */
export async function getUserUpcomingAppointments(userId: string): Promise<AppointmentWithRelations[]> {
  const response = await apiCall<AppointmentWithRelations[]>(`/appointments/user/${userId}/upcoming`);
  return response.data;
}

// ===== APPOINTMENT LOCATIONS =====

/**
 * Get all appointment locations
 */
export async function getAllLocations(): Promise<AppointmentLocation[]> {
  const response = await apiCall<AppointmentLocation[]>('/appointments/locations');
  return response.data;
}

/**
 * Get location by ID
 */
export async function getLocationById(locationId: string): Promise<AppointmentLocation> {
  const response = await apiCall<AppointmentLocation>(`/appointments/locations/${locationId}`);
  return response.data;
}

/**
 * Get doctors by location
 */
export async function getDoctorsByLocation(locationId: string): Promise<DoctorWithUser[]> {
  const response = await apiCall<DoctorWithUser[]>(`/appointments/locations/${locationId}/doctors`);
  return response.data;
}

// ===== CHECK-IN OPERATIONS =====

/**
 * Process patient check-in
 */
export async function processCheckIn(data: ProcessCheckInData): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>('/check-in/process', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get patient queue position
 */
export async function getPatientQueuePosition(appointmentId: string): Promise<QueuePosition> {
  const response = await apiCall<QueuePosition>(`/check-in/patient-position/${appointmentId}`);
  return response.data;
}

/**
 * Reorder appointment queue
 */
export async function reorderQueue(data: ReorderQueueData): Promise<AppointmentWithRelations[]> {
  const response = await apiCall<AppointmentWithRelations[]>('/check-in/reorder-queue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get doctor active queue
 */
export async function getDoctorActiveQueue(doctorId: string): Promise<{ appointments: AppointmentWithRelations[]; queueStats: { total: number; waiting: number; active: number } }> {
  const response = await apiCall<{ appointments: AppointmentWithRelations[]; queueStats: { total: number; waiting: number; active: number } }>(`/check-in/doctor-queue/${doctorId}`);
  return response.data;
}

/**
 * Get location queue
 */
export async function getLocationQueue(): Promise<{ doctor: DoctorWithUser; appointments: AppointmentWithRelations[] }[]> {
  const response = await apiCall<{ doctor: DoctorWithUser; appointments: AppointmentWithRelations[] }[]>('/check-in/location-queue');
  return response.data;
}

// ===== APPOINTMENT QUEUE =====

/**
 * Get doctor queue
 */
export async function getDoctorQueue(doctorId: string, date: string): Promise<AppointmentQueue> {
  const response = await apiCall<AppointmentQueue>(`/appointments/queue/doctor/${doctorId}`, {
    method: 'GET',
    body: JSON.stringify({ date }),
  });
  return response.data;
}

/**
 * Get patient queue position
 */
export async function getQueuePosition(appointmentId: string): Promise<QueuePosition> {
  const response = await apiCall<QueuePosition>(`/appointments/queue/position/${appointmentId}`);
  return response.data;
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(appointmentId: string): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/queue/confirm/${appointmentId}`, {
    method: 'POST',
  });
  return response.data;
}

/**
 * Start consultation
 */
export async function startConsultation(appointmentId: string, data: StartConsultationData): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/queue/start/${appointmentId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== APPOINTMENT CONFIRMATION =====

/**
 * Generate confirmation QR code
 */
export async function generateConfirmationQR(appointmentId: string): Promise<QRCodeResponse> {
  const response = await apiCall<QRCodeResponse>(`/appointments/confirmation/${appointmentId}/qr`);
  return response.data;
}

/**
 * Verify appointment QR code
 */
export async function verifyAppointmentQR(data: VerifyAppointmentQRData): Promise<AppointmentConfirmation> {
  const response = await apiCall<AppointmentConfirmation>('/appointments/confirmation/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Mark appointment as completed
 */
export async function markAppointmentCompleted(appointmentId: string, data: CompleteAppointmentData): Promise<AppointmentWithRelations> {
  const response = await apiCall<AppointmentWithRelations>(`/appointments/confirmation/${appointmentId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get appointment statistics
 */
export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  checkedIn: number;
}

export async function getAppointmentStats(filters?: AppointmentFilters): Promise<AppointmentStats> {
  const appointments = await getAppointments(filters);
  
  const stats: AppointmentStats = {
    total: appointments.length,
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    inProgress: appointments.filter(a => a.status === 'IN_PROGRESS').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
    checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
  };

  return stats;
}

/**
 * Check if appointment can be cancelled
 */
export function canCancelAppointment(appointment: AppointmentWithRelations): boolean {
  const cancellableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return cancellableStatuses.includes(appointment.status);
}

/**
 * Check if appointment can be rescheduled
 */
export function canRescheduleAppointment(appointment: AppointmentWithRelations): boolean {
  const reschedulableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return reschedulableStatuses.includes(appointment.status);
}

/**
 * Format appointment date and time for display
 */
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

/**
 * Get appointment status color for UI
 */
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

/**
 * Get appointment status display name
 */
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

/**
 * Calculate appointment duration in minutes
 */
export function calculateAppointmentDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if appointment is overdue
 */
export function isAppointmentOverdue(appointment: AppointmentWithRelations): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
  const timeDiff = now.getTime() - appointmentDateTime.getTime();
  
  // Consider overdue if more than 30 minutes past scheduled time
  return timeDiff > 30 * 60 * 1000 && 
         ['SCHEDULED', 'CONFIRMED'].includes(appointment.status);
}

/**
 * Get next available appointment time
 */
export function getNextAvailableTime(currentTime: string, duration: number = 30): string {
  const [hours, minutes] = currentTime.split(':').map(Number);
  const nextTime = new Date();
  nextTime.setHours(hours, minutes + duration, 0, 0);
  
  return nextTime.toTimeString().substring(0, 5);
} 