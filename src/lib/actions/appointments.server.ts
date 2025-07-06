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
  AppointmentConfirmation
} from '@/types/appointment.types';
import { authenticatedApi } from './auth.server';

// ===== APPOINTMENT CRUD OPERATIONS =====

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>('/appointments', {
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
  const response = await authenticatedApi<AppointmentWithRelations[]>(endpoint);
  return response.data;
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/${id}`);
  return response.data;
}

/**
 * Update an appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(id: string): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/${id}`, {
    method: 'DELETE',
  });
  return response.data;
}

// ===== DOCTOR AVAILABILITY =====

/**
 * Get doctor availability for a specific date
 */
export async function getDoctorAvailability(doctorId: string, date: string): Promise<DoctorAvailability> {
  const response = await authenticatedApi<DoctorAvailability>(`/appointments/doctor/${doctorId}/availability?date=${date}`);
  return response.data;
}

/**
 * Get user's upcoming appointments
 */
export async function getUserUpcomingAppointments(userId: string): Promise<AppointmentWithRelations[]> {
  const response = await authenticatedApi<AppointmentWithRelations[]>(`/appointments/user/${userId}/upcoming`);
  return response.data;
}

/**
 * Get current user's own appointments (for patients)
 */
export async function getMyAppointments(): Promise<AppointmentWithRelations[]> {
  const response = await authenticatedApi<AppointmentWithRelations[]>('/appointments/my-appointments');
  return response.data;
}

// ===== CHECK-IN OPERATIONS =====

/**
 * Process patient check-in
 */
export async function processCheckIn(data: ProcessCheckInData): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>('/check-in/process', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Get patient queue position
 */
export async function getPatientQueuePosition(appointmentId: string): Promise<QueuePosition> {
  const response = await authenticatedApi<QueuePosition>(`/check-in/patient-position/${appointmentId}`);
  return response.data;
}

/**
 * Reorder appointment queue
 */
export async function reorderQueue(data: ReorderQueueData): Promise<AppointmentWithRelations[]> {
  const response = await authenticatedApi<AppointmentWithRelations[]>('/check-in/reorder-queue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

// ===== APPOINTMENT QUEUE =====

/**
 * Get doctor queue
 */
export async function getDoctorQueue(doctorId: string, date: string): Promise<AppointmentQueue> {
  const response = await authenticatedApi<AppointmentQueue>(`/appointments/queue/doctor/${doctorId}`, {
    method: 'GET',
    body: JSON.stringify({ date }),
  });
  return response.data;
}

/**
 * Get patient queue position
 */
export async function getQueuePosition(appointmentId: string): Promise<QueuePosition> {
  const response = await authenticatedApi<QueuePosition>(`/appointments/queue/position/${appointmentId}`);
  return response.data;
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(appointmentId: string): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/queue/confirm/${appointmentId}`, {
    method: 'POST',
  });
  return response.data;
}

/**
 * Start consultation
 */
export async function startConsultation(appointmentId: string, data: StartConsultationData): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/queue/start/${appointmentId}`, {
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
  const response = await authenticatedApi<QRCodeResponse>(`/appointments/confirmation/${appointmentId}/qr`);
  return response.data;
}

/**
 * Verify appointment QR code
 */
export async function verifyAppointmentQR(data: VerifyAppointmentQRData): Promise<AppointmentConfirmation> {
  const response = await authenticatedApi<AppointmentConfirmation>('/appointments/confirmation/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Mark appointment as completed
 */
export async function markAppointmentCompleted(appointmentId: string, data: CompleteAppointmentData): Promise<AppointmentWithRelations> {
  const response = await authenticatedApi<AppointmentWithRelations>(`/appointments/confirmation/${appointmentId}/complete`, {
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
export async function canCancelAppointment(appointment: AppointmentWithRelations):  Promise<boolean> {
  const cancellableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return cancellableStatuses.includes(appointment.status);
}

/**
 * Check if appointment can be rescheduled
 */
export async function canRescheduleAppointment(appointment: AppointmentWithRelations): Promise<boolean> {
  const reschedulableStatuses = ['SCHEDULED', 'CONFIRMED'];
  return reschedulableStatuses.includes(appointment.status);
} 