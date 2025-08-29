// ✅ Video Appointment Server Actions
// This file provides server actions for video appointment management with Jitsi integration

'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { clinicApiClient } from '@/lib/api/client';
import { auditLog } from '@/lib/audit';
import { validateClinicAccess } from '@/lib/auth/permissions';
import { getSessionData, getClientIP, getUserAgent } from '@/lib/auth/session';

// ✅ Zod Schemas for Video Appointments
const createVideoAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  patientId: z.string().min(1, 'Patient ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional(),
  jitsiRoomId: z.string().optional(),
});

const updateVideoAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
  recordingUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const joinVideoAppointmentSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['doctor', 'patient', 'admin']),
});

// ✅ Create Video Appointment
export async function createVideoAppointment(data: z.infer<typeof createVideoAppointmentSchema>): Promise<{ success: boolean; videoAppointment?: any; error?: string }> {
  try {
    // Validate input
    const validatedData = createVideoAppointmentSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.create');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'CREATE_VIDEO_APPOINTMENT_DENIED',
        resource: 'VIDEO_APPOINTMENT',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Create video appointment via API
    const response = await clinicApiClient.post('/video-appointments', validatedData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to create video appointment' };
    }

    // Audit log successful creation
    await auditLog({
      userId,
      action: 'VIDEO_APPOINTMENT_CREATED',
      resource: 'VIDEO_APPOINTMENT',
      resourceId: (response.data as any).id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        appointmentId: validatedData.appointmentId,
        doctorId: validatedData.doctorId,
        patientId: validatedData.patientId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/video-appointments');
    revalidateTag('video-appointments');
    
    return { success: true, videoAppointment: response.data };
    
  } catch (error) {
    console.error('Failed to create video appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while creating the video appointment' 
    };
  }
}

// ✅ Get Video Appointments
export async function getVideoAppointments(clinicId: string, filters?: {
  page?: number;
  limit?: number;
  status?: string;
  doctorId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; videoAppointments?: any[]; meta?: any; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Convert filters to API parameters
    const params = {
      page: filters?.page || 1,
      limit: filters?.limit || 10,
      status: filters?.status || '',
      doctorId: filters?.doctorId || '',
      patientId: filters?.patientId || '',
      startDate: filters?.startDate || '',
      endDate: filters?.endDate || '',
    };

    // Get video appointments via API
    const response = await clinicApiClient.get(`/clinics/${clinicId}/video-appointments`, params);

    if (!response.success) {
      return { success: false, error: 'Failed to fetch video appointments' };
    }

    return { 
      success: true, 
      videoAppointments: response.data as any[] || [], 
      meta: response.meta 
    };
    
  } catch (error) {
    console.error('Failed to get video appointments:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching video appointments' 
    };
  }
}

// ✅ Get Video Appointment by ID
export async function getVideoAppointmentById(id: string): Promise<{ success: boolean; videoAppointment?: any; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.read');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get video appointment via API
    const response = await clinicApiClient.get(`/video-appointments/${id}`);

    if (!response.success || !response.data) {
      return { success: false, error: 'Video appointment not found' };
    }

    return { success: true, videoAppointment: response.data };
    
  } catch (error) {
    console.error('Failed to get video appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the video appointment' 
    };
  }
}

// ✅ Update Video Appointment
export async function updateVideoAppointment(data: z.infer<typeof updateVideoAppointmentSchema>): Promise<{ success: boolean; videoAppointment?: any; error?: string }> {
  try {
    // Validate input
    const validatedData = updateVideoAppointmentSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.update');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'UPDATE_VIDEO_APPOINTMENT_DENIED',
        resource: 'VIDEO_APPOINTMENT',
        resourceId: validatedData.appointmentId,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Update video appointment via API
    const response = await clinicApiClient.put(`/video-appointments/${validatedData.appointmentId}`, validatedData);

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to update video appointment' };
    }

    // Audit log successful update
    await auditLog({
      userId,
      action: 'VIDEO_APPOINTMENT_UPDATED',
      resource: 'VIDEO_APPOINTMENT',
      resourceId: validatedData.appointmentId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        status: validatedData.status,
        updatedFields: Object.keys(validatedData)
      }
    });

    // Revalidate cache
    revalidatePath('/dashboard/video-appointments');
    revalidatePath(`/dashboard/video-appointments/${validatedData.appointmentId}`);
    revalidateTag('video-appointments');
    
    return { success: true, videoAppointment: response.data };
    
  } catch (error) {
    console.error('Failed to update video appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while updating the video appointment' 
    };
  }
}

// ✅ Join Video Appointment
export async function joinVideoAppointment(data: z.infer<typeof joinVideoAppointmentSchema>): Promise<{ success: boolean; joinUrl?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = joinVideoAppointmentSchema.parse(data);

    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.join');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'JOIN_VIDEO_APPOINTMENT_DENIED',
        resource: 'VIDEO_APPOINTMENT',
        resourceId: validatedData.appointmentId,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Join video appointment via API
    const response = await clinicApiClient.post(`/video-appointments/${validatedData.appointmentId}/join`, {
      userId: validatedData.userId,
      role: validatedData.role,
    });

    if (!response.success || !response.data) {
      return { success: false, error: 'Failed to join video appointment' };
    }

    // Audit log successful join
    await auditLog({
      userId,
      action: 'VIDEO_APPOINTMENT_JOINED',
      resource: 'VIDEO_APPOINTMENT',
      resourceId: validatedData.appointmentId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        joinedUserId: validatedData.userId,
        role: validatedData.role
      }
    });

    return { success: true, joinUrl: (response.data as any).joinUrl };
    
  } catch (error) {
    console.error('Failed to join video appointment:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while joining the video appointment' 
    };
  }
}

// ✅ End Video Appointment
export async function endVideoAppointment(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.end');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'END_VIDEO_APPOINTMENT_DENIED',
        resource: 'VIDEO_APPOINTMENT',
        resourceId: appointmentId,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // End video appointment via API
    const response = await clinicApiClient.post(`/video-appointments/${appointmentId}/end`);

    if (!response.success) {
      return { success: false, error: 'Failed to end video appointment' };
    }

    // Audit log successful end
    await auditLog({
      userId,
      action: 'VIDEO_APPOINTMENT_ENDED',
      resource: 'VIDEO_APPOINTMENT',
      resourceId: appointmentId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/video-appointments');
    revalidateTag('video-appointments');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to end video appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while ending the video appointment' 
    };
  }
}

// ✅ Get Video Appointment Recording
export async function getVideoAppointmentRecording(appointmentId: string): Promise<{ success: boolean; recordingUrl?: string; error?: string }> {
  try {
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.recordings');
    if (!hasAccess) {
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Get recording via API
    const response = await clinicApiClient.get(`/video-appointments/${appointmentId}/recording`);

    if (!response.success || !response.data) {
      return { success: false, error: 'Recording not found' };
    }

    return { success: true, recordingUrl: (response.data as any).recordingUrl };
    
  } catch (error) {
    console.error('Failed to get video appointment recording:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while fetching the recording' 
    };
  }
}

// ✅ Delete Video Appointment
export async function deleteVideoAppointment(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session data
    const { sessionId, userId } = await getSessionData();

    // Validate permissions
    const hasAccess = await validateClinicAccess(userId, 'video-appointments.delete');
    if (!hasAccess) {
      await auditLog({
        userId,
        action: 'DELETE_VIDEO_APPOINTMENT_DENIED',
        resource: 'VIDEO_APPOINTMENT',
        resourceId: appointmentId,
        result: 'FAILURE',
        riskLevel: 'HIGH',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // Delete video appointment via API
    const response = await clinicApiClient.delete(`/video-appointments/${appointmentId}`);

    if (!response.success) {
      return { success: false, error: 'Failed to delete video appointment' };
    }

    // Audit log successful deletion
    await auditLog({
      userId,
      action: 'VIDEO_APPOINTMENT_DELETED',
      resource: 'VIDEO_APPOINTMENT',
      resourceId: appointmentId,
      result: 'SUCCESS',
      riskLevel: 'HIGH',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId
    });

    // Revalidate cache
    revalidatePath('/dashboard/video-appointments');
    revalidateTag('video-appointments');
    
    return { success: true };
    
  } catch (error) {
    console.error('Failed to delete video appointment:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while deleting the video appointment' 
    };
  }
}
