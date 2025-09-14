// ✅ Appointments Server Actions - Backend Integration
// This file provides server actions that integrate with the backend appointments system

'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { clinicApiClient } from '@/lib/api/client';
import { auditLog } from '@/lib/audit';
import { validateClinicAccess } from '@/lib/auth/permissions';
import type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  QueueEntry,
  QueueStats 
} from '@/types/appointment.types';

// ✅ Input Validation Schemas
const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  type: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
  clinicId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  symptoms: z.array(z.string()).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

const updateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  duration: z.number().min(15).max(480).optional(),
  type: z.string().min(1).max(100).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  symptoms: z.array(z.string()).optional(),
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const completeAppointmentSchema = z.object({
  diagnosis: z.string().max(1000).optional(),
  prescription: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  followUpNotes: z.string().max(1000).optional(),
});

// ✅ Helper Functions
async function getSessionData() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  const userId = cookieStore.get('user_id')?.value;
  const clinicId = cookieStore.get('clinic_id')?.value;

  if (!sessionId || !userId) {
    throw new Error('Unauthorized: Please log in again');
  }

  return { sessionId, userId, clinicId };
}

async function getClientIP(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('x-forwarded-for') || 
         headersList.get('x-real-ip') || 
         'unknown';
}

async function getUserAgent(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('user-agent') || 'unknown';
}

// ✅ Appointment Management Server Actions

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    // Validate input
    const validatedData = createAppointmentSchema.parse(data);

    // Get session data
    const { sessionId, userId, clinicId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.create');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'CREATE_APPOINTMENT_DENIED',
        resource: 'APPOINTMENT',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Create appointment via API client
    const appointmentData: any = {
      patientId: validatedData.patientId,
      doctorId: validatedData.doctorId,
      date: validatedData.date,
      time: validatedData.time,
      duration: validatedData.duration,
      type: validatedData.type,
      notes: validatedData.notes || '',
      clinicId: clinicId || validatedData.clinicId,
      symptoms: validatedData.symptoms,
      priority: validatedData.priority,
    };

    if (validatedData.locationId) {
      appointmentData.locationId = validatedData.locationId;
    }

    const response = await clinicApiClient.createAppointment(appointmentData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to create appointment' };
    }

    // Audit log successful creation
    await auditLog({
      userId,
      action: 'APPOINTMENT_CREATED',
      resource: 'APPOINTMENT',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        appointmentDate: validatedData.date,
        appointmentTime: validatedData.time,
        appointmentType: validatedData.type
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to create appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while creating the appointment' 
    };
  }
}

/**
 * Get appointments for a clinic
 */
export async function getAppointments(_clinicId: string, filters?: AppointmentFilters): Promise<{ success: boolean; appointments?: Appointment[]; meta?: any; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }


    // Get appointments via API client (clinic context is handled by the API client)
    const appointmentFilters: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    };
    
    if (filters?.doctorId) appointmentFilters.doctorId = filters.doctorId;
    if (filters?.status) appointmentFilters.status = filters.status;
    if (filters?.date) appointmentFilters.date = filters.date;
    if (filters?.locationId) appointmentFilters.locationId = filters.locationId;

    const response = await clinicApiClient.getAppointments(appointmentFilters);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch appointments' };
    }

    return { 
      success: true, 
      appointments: response.data as Appointment[] || [], 
      meta: response.meta 
    };
    
  } catch (error) {
    console.error('Failed to get appointments:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching appointments' 
    };
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get appointment via enhanced API client
    const response = await clinicApiClient.getAppointmentById(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Appointment not found' };
    }

    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to get appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the appointment' 
    };
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    // Validate input
    const validatedData = updateAppointmentSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'UPDATE_APPOINTMENT_DENIED',
        resource: 'APPOINTMENT',
        resourceId: id,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Update appointment via enhanced API client
    const updateData: any = {};
    
    if (validatedData.date) updateData.date = validatedData.date;
    if (validatedData.time) updateData.time = validatedData.time;
    if (validatedData.duration) updateData.duration = validatedData.duration;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.notes) updateData.notes = validatedData.notes;
    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.symptoms) updateData.symptoms = validatedData.symptoms;
    if (validatedData.diagnosis) updateData.diagnosis = validatedData.diagnosis;
    if (validatedData.prescription) updateData.prescription = validatedData.prescription;
    if (validatedData.followUpDate) updateData.followUpDate = validatedData.followUpDate;

    const response = await clinicApiClient.updateAppointment(id, updateData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to update appointment' };
    }

    // Audit log successful update
    await auditLog({
      userId,
      action: 'APPOINTMENT_UPDATED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        updatedFields: Object.keys(validatedData)
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to update appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while updating the appointment' 
    };
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(id: string, reason?: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Cancel appointment via enhanced API client
    const response = await clinicApiClient.cancelAppointment(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to cancel appointment' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'APPOINTMENT_CANCELLED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        reason: reason || 'No reason provided'
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to cancel appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while cancelling the appointment' 
    };
  }
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(id: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Confirm appointment via enhanced API client
    const response = await clinicApiClient.confirmAppointment(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to confirm appointment' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'APPOINTMENT_CONFIRMED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to confirm appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while confirming the appointment' 
    };
  }
}

/**
 * Check in appointment
 */
export async function checkInAppointment(id: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Check in appointment via enhanced API client
    const response = await clinicApiClient.checkInAppointment(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to check in appointment' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'APPOINTMENT_CHECKED_IN',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to check in appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while checking in the appointment' 
    };
  }
}

/**
 * Start appointment
 */
export async function startAppointment(id: string): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Start appointment via enhanced API client
    const response = await clinicApiClient.startAppointment(id);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to start appointment' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'APPOINTMENT_STARTED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to start appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while starting the appointment' 
    };
  }
}

/**
 * Complete appointment
 */
export async function completeAppointment(id: string, data: {
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  followUpDate?: string;
  followUpNotes?: string;
}): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
  try {
    // Validate input
    const validatedData = completeAppointmentSchema.parse(data);

    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Complete appointment via enhanced API client
    const completionData: any = {};
    
    if (validatedData.diagnosis) completionData.diagnosis = validatedData.diagnosis;
    if (validatedData.prescription) completionData.prescription = validatedData.prescription;
    if (validatedData.notes) completionData.notes = validatedData.notes;
    if (validatedData.followUpDate) completionData.followUpDate = validatedData.followUpDate;

    const response = await clinicApiClient.completeAppointment(id, completionData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to complete appointment' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'APPOINTMENT_COMPLETED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        hasDiagnosis: !!validatedData.diagnosis,
        hasPrescription: !!validatedData.prescription,
        hasFollowUp: !!validatedData.followUpDate
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    console.error('Failed to complete appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while completing the appointment' 
    };
  }
}

// ✅ Queue Management Server Actions

/**
 * Get queue for a specific type
 */
export async function getQueue(queueType: string): Promise<{ success: boolean; queue?: QueueEntry[]; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get queue via enhanced API client
    const response = await clinicApiClient.getQueue(queueType);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch queue' };
    }

    return { success: true, queue: response.data as QueueEntry[] || [] };
    
  } catch (error) {
    console.error('Failed to get queue:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the queue' 
    };
  }
}

/**
 * Add patient to queue
 */
export async function addToQueue(data: {
  patientId: string;
  appointmentId?: string;
  queueType: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}): Promise<{ success: boolean; queueEntry?: QueueEntry; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.create');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Add to queue via enhanced API client
    const response = await clinicApiClient.addToQueue(data);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to add to queue' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'PATIENT_ADDED_TO_QUEUE',
      resource: 'QUEUE',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        patientId: data.patientId,
        queueType: data.queueType,
        priority: data.priority || 'NORMAL'
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/queue');
    revalidateTag('queue');
    
    return { success: true, queueEntry: response.data as QueueEntry };
    
  } catch (error) {
    console.error('Failed to add to queue:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while adding to queue' 
    };
  }
}

/**
 * Call next patient from queue
 */
export async function callNextPatient(queueType: string): Promise<{ success: boolean; patient?: any; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.update');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Call next patient via enhanced API client
    const response = await clinicApiClient.callNextPatient(queueType);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to call next patient' };
    }

    // Audit log
    await auditLog({
      userId,
      action: 'NEXT_PATIENT_CALLED',
      resource: 'QUEUE',
      resourceId: 'next',
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        queueType,
        patientId: (response.data as any).patientId
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/queue');
    revalidateTag('queue');
    
    return { success: true, patient: response.data };
    
  } catch (error) {
    console.error('Failed to call next patient:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while calling next patient' 
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ success: boolean; stats?: QueueStats; error?: string }> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get queue stats via enhanced API client
    const response = await clinicApiClient.getQueueStats();

    if (!response.success) {
      return { success: false, error: 'Failed to fetch queue statistics' };
    }

    return { success: true, stats: response.data as QueueStats };
    
  } catch (error) {
    console.error('Failed to get queue stats:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching queue statistics' 
    };
  }
}

// ✅ Additional Server Actions for Missing Backend Endpoints

/**
 * Get doctor availability
 */
export async function getDoctorAvailability(doctorId: string, date: string): Promise<{ 
  success: boolean; 
  availability?: any; 
  error?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get doctor availability via enhanced API client
    const response = await clinicApiClient.getDoctorAvailability(doctorId, date);

    if (!response.success) {
      return { success: false, error: response.message || 'Failed to get doctor availability' };
    }

    return { success: true, availability: response.data };
    
  } catch (error) {
    console.error('Failed to get doctor availability:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching doctor availability' 
    };
  }
}

/**
 * Get user upcoming appointments
 */
export async function getUserUpcomingAppointments(userId: string): Promise<{ 
  success: boolean; 
  appointments?: Appointment[]; 
  error?: string;
}> {
  try {
    const { userId: currentUserId } = await getSessionData();

    // Validate permissions (users can only access their own upcoming appointments unless they're staff)
    const hasAccess = await validateClinicAccess(currentUserId, 'appointments.read');
    if (!hasAccess && currentUserId !== userId) {
      return { success: false, error: 'Access denied: Can only access your own appointments' };
    }

    // Get user upcoming appointments via enhanced API client
    const response = await clinicApiClient.getUserUpcomingAppointments(userId);

    if (!response.success) {
      return { success: false, error: response.message || 'Failed to get upcoming appointments' };
    }

    return { success: true, appointments: response.data as Appointment[] };
    
  } catch (error) {
    console.error('Failed to get upcoming appointments:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching upcoming appointments' 
    };
  }
}

/**
 * Get my appointments (for current user)
 */
export async function getMyAppointments(filters?: {
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}): Promise<{ 
  success: boolean; 
  appointments?: Appointment[]; 
  meta?: any;
  error?: string;
}> {
  try {
    // Get my appointments via enhanced API client
    const response = await clinicApiClient.getMyAppointments(filters);

    if (!response.success) {
      return { success: false, error: (response as any).message || 'Failed to fetch my appointments' };
    }

    const responseData = response as any;
    return { 
      success: true, 
      appointments: responseData.data?.data || [], 
      meta: responseData.data?.meta 
    };
    
  } catch (error) {
    console.error('Failed to get my appointments:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching your appointments' 
    };
  }
}

/**
 * Test appointment context (for debugging)
 */
export async function testAppointmentContext(): Promise<{ 
  success: boolean; 
  context?: any; 
  error?: string;
}> {
  try {
    // Test appointment context via enhanced API client
    const response = await clinicApiClient.testAppointmentContext();

    if (!response.success) {
      return { success: false, error: response.message || 'Failed to test appointment context' };
    }

    return { success: true, context: response.data };
    
  } catch (error) {
    console.error('Failed to test appointment context:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while testing appointment context' 
    };
  }
}