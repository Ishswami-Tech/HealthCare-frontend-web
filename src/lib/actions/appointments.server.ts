// ✅ Appointments Server Actions - Backend Integration
// This file provides server actions that integrate with the backend appointments system

'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
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

    // Create appointment via API - match the expected API client signature
    const apiData = {
      patientId: validatedData.patientId,
      doctorId: validatedData.doctorId,
      date: validatedData.date,
      time: validatedData.time,
      duration: validatedData.duration,
      type: validatedData.type,
      notes: validatedData.notes || '',
      clinicId: clinicId || validatedData.clinicId
    };

    const response = await clinicApiClient.createAppointment(apiData);

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
export async function getAppointments(clinicId: string, filters?: AppointmentFilters): Promise<{ success: boolean; appointments?: Appointment[]; meta?: any; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Convert AppointmentFilters to PaginationParams for API client
    const paginationParams = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      sortBy: filters?.sortBy || 'createdAt',
      sortOrder: filters?.sortOrder || 'desc',
      search: filters?.search || '',
      filters: {
        status: filters?.status || '',
        date: filters?.date || '',
        doctorId: filters?.doctorId || '',
        patientId: filters?.patientId || '',
        locationId: filters?.locationId || '',
        type: filters?.type || '',
        startDate: filters?.startDate || '',
        endDate: filters?.endDate || '',
      }
    };

    // Get appointments via API
    const response = await clinicApiClient.getAppointments(clinicId, paginationParams);

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
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get appointment via API
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

    // Convert validated data to match API client signature
    const apiData = {
      date: validatedData.date || '',
      time: validatedData.time || '',
      duration: validatedData.duration || 30,
      type: validatedData.type || '',
      notes: validatedData.notes || '',
      status: validatedData.status || '',
    };

    // Update appointment via API
    const response = await clinicApiClient.updateAppointment(id, apiData);

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

    // Cancel appointment via API
    const response = await clinicApiClient.cancelAppointment(id, reason);

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

    // Confirm appointment via API
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

    // Check in appointment via API
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

    // Start appointment via API
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

    // Convert validated data to match API client signature
    const apiData = {
      diagnosis: validatedData.diagnosis || '',
      prescription: validatedData.prescription || '',
      notes: validatedData.notes || '',
      followUpDate: validatedData.followUpDate || '',
    };

    // Complete appointment via API
    const response = await clinicApiClient.completeAppointment(id, apiData);

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
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get queue via API
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

    // Add to queue via API
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

    // Call next patient via API
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
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get queue stats via API
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