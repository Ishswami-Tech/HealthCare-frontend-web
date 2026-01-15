// ✅ Enhanced Appointments Server Actions - Complete Backend Integration
// This file provides comprehensive server actions that integrate with ALL backend appointment endpoints

'use server';

import { logger } from '@/lib/utils/logger';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { clinicApiClient } from '@/lib/api/client';
import { auditLog } from '@/lib/utils/audit';
import { validateClinicAccess } from '@/lib/config/permissions';
import { ERROR_MESSAGES, APP_CONFIG } from '@/lib/config/config';
import type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  QueueEntry,
  QueueStats,
  DoctorAvailability 
} from '@/types/appointment.types';

// ✅ Enhanced Input Validation Schemas
const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  type: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
  clinicId: z.string().uuid().optional(),
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

const addToQueueSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  queueType: z.string().min(1).max(50),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

// ✅ Helper Functions
async function getSessionData() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  if (!accessToken || !sessionId) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  // Try to extract user ID from JWT token
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] || ''));
    const userId = payload.sub;
    // ✅ Use centralized config instead of direct env access
    const { APP_CONFIG } = await import('@/lib/config/config');
    const clinicId = payload.clinicId || APP_CONFIG.CLINIC.ID;
    
    return { sessionId, userId, clinicId, userRole, accessToken };
  } catch {
    throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
  }
}

async function getClientInfo(): Promise<{ ipAddress: string; userAgent: string }> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  
  return {
    ipAddress: headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown',
    userAgent: headersList.get('user-agent') || 'unknown'
  };
}

// ✅ Core Appointment Management Server Actions

/**
 * Create a new appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string; 
}> {
  try {
    // Validate input
    const validatedData = createAppointmentSchema.parse(data);

    // Get session data
    const { userId, clinicId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.create');
    if (!hasAccess) {
      const { ipAddress, userAgent } = await getClientInfo();
      
      await auditLog({
        userId,
        action: 'CREATE_APPOINTMENT_DENIED',
        resource: 'APPOINTMENT',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress,
        userAgent
      });
      
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS' 
      };
    }

    // Create appointment via enhanced API client
    const appointmentData: any = {
      ...validatedData,
      // ✅ Use centralized config instead of direct env access
      clinicId: clinicId || validatedData.clinicId || APP_CONFIG.CLINIC.ID
    };
    
    // Only include notes if it has a value
    if (validatedData.notes) {
      appointmentData.notes = validatedData.notes;
    }
    
    const response = await clinicApiClient.createAppointment(appointmentData);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to create appointment',
        code: response.code || 'APPOINTMENT_CREATE_FAILED'
      };
    }

    // Audit log successful creation
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_CREATED',
      resource: 'APPOINTMENT',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      metadata: {
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        appointmentDate: validatedData.date,
        appointmentTime: validatedData.time,
        appointmentType: validatedData.type,
        priority: validatedData.priority
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidatePath('/appointments');
    revalidateTag('appointments', 'max');
    revalidateTag('queue', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to create appointment', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues[0]?.message}`,
        code: 'VALIDATION_ERROR'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while creating the appointment',
      code: 'APPOINTMENT_CREATE_FAILED'
    };
  }
}

/**
 * ✅ Consolidated: Get appointments with enhanced filtering
 * Removed legacy clinicIdOrFilters parameter - now uses filters only
 * Follows DRY, SOLID, KISS principles
 */
export async function getAppointments(filters?: AppointmentFilters): Promise<{ 
  success: boolean; 
  appointments?: Appointment[]; 
  meta?: any; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get appointments via enhanced API client
    const appointmentParams: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    };
    
    if (filters?.doctorId) appointmentParams.doctorId = filters.doctorId;
    if (filters?.status) appointmentParams.status = filters.status;
    if (filters?.date) appointmentParams.date = filters.date;
    if (filters?.locationId) appointmentParams.locationId = filters.locationId;
    if (filters?.clinicId) appointmentParams.clinicId = filters.clinicId;
    
    const response = await clinicApiClient.getAppointments(appointmentParams);

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to fetch appointments',
        code: response.code || 'APPOINTMENTS_FETCH_FAILED'
      };
    }

    return { 
      success: true, 
      appointments: (response as any).data?.data || [], 
      meta: (response as any).data?.meta 
    };
    
  } catch (error) {
    logger.error('Failed to get appointments', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching appointments',
      code: 'APPOINTMENTS_FETCH_FAILED'
    };
  }
}

/**
 * Get user's own appointments
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
  code?: string;
}> {
  try {
    await getSessionData();

    // Get my appointments via enhanced API client
    const myAppointmentParams: any = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
    };
    
    if (filters?.status) myAppointmentParams.status = filters.status;
    if (filters?.date) myAppointmentParams.date = filters.date;
    
    const response = await clinicApiClient.getMyAppointments(myAppointmentParams);

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to fetch appointments',
        code: response.code || 'MY_APPOINTMENTS_FETCH_FAILED'
      };
    }

    return { 
      success: true, 
      appointments: (response as any).data?.data || [], 
      meta: (response as any).data?.meta 
    };
    
  } catch (error) {
    logger.error('Failed to get my appointments', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching appointments',
      code: 'MY_APPOINTMENTS_FETCH_FAILED'
    };
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get appointment via enhanced API client
    const response = await clinicApiClient.getAppointmentById(id);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Appointment not found',
        code: response.code || 'APPOINTMENT_NOT_FOUND'
      };
    }

    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to get appointment', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching the appointment',
      code: 'APPOINTMENT_FETCH_FAILED'
    };
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentData): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    // Validate input
    const validatedData = updateAppointmentSchema.parse(data);

    // Get session data
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      const { ipAddress, userAgent } = await getClientInfo();
      
      await auditLog({
        userId,
        action: 'UPDATE_APPOINTMENT_DENIED',
        resource: 'APPOINTMENT',
        resourceId: id,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress,
        userAgent
      });
      
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Update appointment via enhanced API client
    const updateData: any = {};
    Object.keys(validatedData).forEach(key => {
      const value = (validatedData as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    const response = await clinicApiClient.updateAppointment(id, updateData);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to update appointment',
        code: response.code || 'APPOINTMENT_UPDATE_FAILED'
      };
    }

    // Audit log successful update
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_UPDATED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      metadata: {
        updatedFields: Object.keys(validatedData)
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidatePath(`/appointments/${id}`);
    revalidateTag('appointments', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to update appointment', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues[0]?.message}`,
        code: 'VALIDATION_ERROR'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while updating the appointment',
      code: 'APPOINTMENT_UPDATE_FAILED'
    };
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(id: string, reason?: string): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Cancel appointment via enhanced API client
    const response = await clinicApiClient.cancelAppointment(id);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to cancel appointment',
        code: response.code || 'APPOINTMENT_CANCEL_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_CANCELLED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      metadata: {
        reason: reason || 'No reason provided'
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidatePath('/appointments');
    revalidateTag('appointments', 'max');
    revalidateTag('queue', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to cancel appointment', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while cancelling the appointment',
      code: 'APPOINTMENT_CANCEL_FAILED'
    };
  }
}

// ✅ Enhanced Appointment Status Management

/**
 * Confirm appointment
 */
export async function confirmAppointment(id: string): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Confirm appointment via enhanced API client
    const response = await clinicApiClient.confirmAppointment(id);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to confirm appointment',
        code: response.code || 'APPOINTMENT_CONFIRM_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_CONFIRMED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to confirm appointment', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while confirming the appointment',
      code: 'APPOINTMENT_CONFIRM_FAILED'
    };
  }
}

/**
 * Check in appointment
 */
export async function checkInAppointment(id: string): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Check in appointment via enhanced API client
    const response = await clinicApiClient.checkInAppointment(id);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to check in appointment',
        code: response.code || 'APPOINTMENT_CHECKIN_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_CHECKED_IN',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments', 'max');
    revalidateTag('queue', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to check in appointment', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while checking in the appointment',
      code: 'APPOINTMENT_CHECKIN_FAILED'
    };
  }
}

/**
 * Start appointment
 */
export async function startAppointment(id: string): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Start appointment via enhanced API client
    const response = await clinicApiClient.startAppointment(id);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to start appointment',
        code: response.code || 'APPOINTMENT_START_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_STARTED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments', 'max');
    revalidateTag('queue', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to start appointment', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while starting the appointment',
      code: 'APPOINTMENT_START_FAILED'
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
}): Promise<{ 
  success: boolean; 
  appointment?: Appointment; 
  error?: string;
  code?: string;
}> {
  try {
    // Validate input
    const validatedData = completeAppointmentSchema.parse(data);

    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Complete appointment via enhanced API client
    const completeData: any = {};
    if (validatedData.diagnosis) completeData.diagnosis = validatedData.diagnosis;
    if (validatedData.prescription) completeData.prescription = validatedData.prescription;
    if (validatedData.notes) completeData.notes = validatedData.notes;
    if (validatedData.followUpDate) completeData.followUpDate = validatedData.followUpDate;
    
    const response = await clinicApiClient.completeAppointment(id, completeData);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to complete appointment',
        code: response.code || 'APPOINTMENT_COMPLETE_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_COMPLETED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      metadata: {
        hasDiagnosis: !!validatedData.diagnosis,
        hasPrescription: !!validatedData.prescription,
        hasFollowUp: !!validatedData.followUpDate
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments', 'max');
    revalidateTag('queue', 'max');
    
    return { success: true, appointment: response.data as Appointment };
    
  } catch (error) {
    logger.error('Failed to complete appointment', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues[0]?.message}`,
        code: 'VALIDATION_ERROR'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while completing the appointment',
      code: 'APPOINTMENT_COMPLETE_FAILED'
    };
  }
}

// ✅ Doctor Availability Management

/**
 * Get doctor availability
 */
export async function getDoctorAvailability(doctorId: string, date: string): Promise<{ 
  success: boolean; 
  availability?: DoctorAvailability; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.read');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get doctor availability via enhanced API client
    const response = await clinicApiClient.getDoctorAvailability(doctorId, date);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to get doctor availability',
        code: response.code || 'DOCTOR_AVAILABILITY_FAILED'
      };
    }

    return { success: true, availability: response.data as DoctorAvailability };
    
  } catch (error) {
    logger.error('Failed to get doctor availability', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching doctor availability',
      code: 'DOCTOR_AVAILABILITY_FAILED'
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
  code?: string;
}> {
  try {
    const { userId: currentUserId } = await getSessionData();

    // Validate permissions (users can only access their own upcoming appointments unless they're staff)
    const hasAccess = await validateClinicAccess(currentUserId, 'appointments.read');
    if (!hasAccess && currentUserId !== userId) {
      return { 
        success: false, 
        error: 'Access denied: Can only access your own appointments',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get user upcoming appointments via enhanced API client
    const response = await clinicApiClient.getUserUpcomingAppointments(userId);

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to get upcoming appointments',
        code: response.code || 'UPCOMING_APPOINTMENTS_FAILED'
      };
    }

    return { success: true, appointments: response.data as Appointment[] };
    
  } catch (error) {
    logger.error('Failed to get upcoming appointments', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching upcoming appointments',
      code: 'UPCOMING_APPOINTMENTS_FAILED'
    };
  }
}

// ✅ Queue Management Server Actions

/**
 * Get queue for a specific type
 */
export async function getQueue(queueType: string): Promise<{ 
  success: boolean; 
  queue?: QueueEntry[]; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get queue via enhanced API client
    const response = await clinicApiClient.getQueue(queueType);

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to fetch queue',
        code: response.code || 'QUEUE_FETCH_FAILED'
      };
    }

    return { success: true, queue: response.data as QueueEntry[] || [] };
    
  } catch (error) {
    logger.error('Failed to get queue', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching the queue',
      code: 'QUEUE_FETCH_FAILED'
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
}): Promise<{ 
  success: boolean; 
  queueEntry?: QueueEntry; 
  error?: string;
  code?: string;
}> {
  try {
    // Validate input
    const validatedData = addToQueueSchema.parse(data);

    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.create');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Add to queue via enhanced API client
    const queueData: any = {
      patientId: validatedData.patientId,
      queueType: validatedData.queueType,
      priority: validatedData.priority,
    };
    
    if (validatedData.appointmentId) {
      queueData.appointmentId = validatedData.appointmentId;
    }
    
    const response = await clinicApiClient.addToQueue(queueData);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to add to queue',
        code: response.code || 'QUEUE_ADD_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'PATIENT_ADDED_TO_QUEUE',
      resource: 'QUEUE',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      metadata: {
        patientId: validatedData.patientId,
        queueType: validatedData.queueType,
        priority: validatedData.priority || 'NORMAL'
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/queue');
    revalidateTag('queue', 'max');
    
    return { success: true, queueEntry: response.data as QueueEntry };
    
  } catch (error) {
    logger.error('Failed to add to queue', error instanceof Error ? error : new Error(String(error)));
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.issues[0]?.message}`,
        code: 'VALIDATION_ERROR'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while adding to queue',
      code: 'QUEUE_ADD_FAILED'
    };
  }
}

/**
 * Call next patient from queue
 */
export async function callNextPatient(queueType: string): Promise<{ 
  success: boolean; 
  patient?: any; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Call next patient via enhanced API client
    const response = await clinicApiClient.callNextPatient(queueType);

    if (!response.success || !response.data) {
      return { 
        success: false, 
        error: response.message || 'Failed to call next patient',
        code: response.code || 'QUEUE_CALL_FAILED'
      };
    }

    // Audit log
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'NEXT_PATIENT_CALLED',
      resource: 'QUEUE',
      resourceId: 'next',
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      metadata: {
        queueType,
        patientId: (response.data as any).patientId
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/queue');
    revalidateTag('queue', 'max');
    
    return { success: true, patient: response.data };
    
  } catch (error) {
    logger.error('Failed to call next patient', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while calling next patient',
      code: 'QUEUE_CALL_FAILED'
    };
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ 
  success: boolean; 
  stats?: QueueStats; 
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'queue.read');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    // Get queue stats via enhanced API client
    const response = await clinicApiClient.getQueueStats();

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to fetch queue statistics',
        code: response.code || 'QUEUE_STATS_FAILED'
      };
    }

    return { success: true, stats: response.data as QueueStats };
    
  } catch (error) {
    logger.error('Failed to get queue stats', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while fetching queue statistics',
      code: 'QUEUE_STATS_FAILED'
    };
  }
}

// ✅ Additional Utility Functions

/**
 * Test appointment context (for debugging)
 */
export async function testAppointmentContext(): Promise<{ 
  success: boolean; 
  context?: any; 
  error?: string;
  code?: string;
}> {
  try {
    await getSessionData();

    // Test appointment context via enhanced API client
    const response = await clinicApiClient.testAppointmentContext();

    if (!response.success) {
      return { 
        success: false, 
        error: response.message || 'Failed to test appointment context',
        code: response.code || 'CONTEXT_TEST_FAILED'
      };
    }

    return { success: true, context: response.data };
    
  } catch (error) {
    logger.error('Failed to test appointment context', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred while testing appointment context',
      code: 'CONTEXT_TEST_FAILED'
    };
  }
}

/**
 * Bulk operations helper
 */
export async function bulkUpdateAppointmentStatus(appointmentIds: string[], status: string): Promise<{ 
  success: boolean; 
  updated?: number; 
  failed?: number;
  error?: string;
  code?: string;
}> {
  try {
    const { userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'appointments.update');
    if (!hasAccess) {
      return { 
        success: false, 
        error: 'Access denied: Insufficient permissions',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      };
    }

    let updated = 0;
    let failed = 0;

    // Process appointments in batches
    for (const id of appointmentIds) {
      try {
        const response = await clinicApiClient.updateAppointment(id, { status } as any);
        if (response.success) {
          updated++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    // Audit log bulk operation
    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'BULK_APPOINTMENT_UPDATE',
      resource: 'APPOINTMENT',
      resourceId: 'bulk',
      result: updated > 0 ? 'SUCCESS' : 'FAILURE',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      metadata: {
        totalRequested: appointmentIds.length,
        updated,
        failed,
        status
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/appointments');
    revalidateTag('appointments', 'max');

    const result: any = { 
      success: updated > 0, 
      updated, 
      failed
    };
    
    if (failed > 0) {
      result.error = `${failed} appointments failed to update`;
    }
    
    return result;
    
  } catch (error) {
    logger.error('Failed bulk appointment update', error instanceof Error ? error : new Error(String(error)));
    return { 
      success: false, 
      updated: 0,
      failed: appointmentIds.length,
      error: error instanceof Error ? error.message : 'Bulk update failed',
      code: 'BULK_UPDATE_FAILED'
    };
  }
}