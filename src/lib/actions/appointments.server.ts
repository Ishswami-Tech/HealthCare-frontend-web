// ✅ Consolidated Appointments Server Actions
// This file is the single source of truth for appointments and doctor availability.

'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedApi, publicApi, getServerSession, getClientInfo, revalidateCache } from './auth.server';
import { auditLog } from '@/lib/utils/audit';
import { validateClinicAccess } from '@/lib/config/permissions';
import { logger } from '@/lib/utils/logger';
import { API_ENDPOINTS, APP_CONFIG } from '@/lib/config/config';
import type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  DoctorAvailability 
} from '@/types/appointment.types';

// ===== SCHEMAS =====

import { 
  scanQRSchema, 
  createAppointmentSchema, 
  updateAppointmentSchema, 
  completeAppointmentSchema, 
  proposeVideoSlotsSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
  rejectVideoProposalSchema
} from '@/lib/schema/appointments.schema';

const IST_UTC_OFFSET = '+05:30';

function toIstAppointmentIso(date: string, time: string): string {
  // Normalize incoming date/time to IST first, then store as UTC ISO for backend consistency.
  return new Date(`${date}T${time}:00${IST_UTC_OFFSET}`).toISOString();
}

// ===== APPOINTMENT ACTIONS =====

/**
 * Update appointment status (Consolidated)
 */
export async function updateAppointmentStatus(id: string, data: any) {
  try {
    const validatedData = updateAppointmentStatusSchema.parse(data);
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify(validatedData)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: `APPOINTMENT_STATUS_${validatedData.status}`,
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { status: validatedData.status, reason: validatedData.reason }
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');
    revalidateCache('queue');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to update appointment status', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to update status' };
  }
}

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
    const validatedData = createAppointmentSchema.parse(data);
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const hasAccess = await validateClinicAccess(userId, 'appointments.create');
    if (!hasAccess) return { success: false, error: 'Access denied' };

    const appointmentDate = toIstAppointmentIso(validatedData.date, validatedData.time);
    const { date: _date, time: _time, ...restPayload } = validatedData;
    const payload = {
      ...restPayload,
      appointmentDate,
      // Prefer explicit clinic selection from booking flow, then session clinic fallback.
      clinicId: validatedData.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID,
    };

    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(payload.clinicId ? { headers: { 'X-Clinic-ID': payload.clinicId } } : {}),
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId,
      action: 'APPOINTMENT_CREATED',
      resource: 'APPOINTMENT',
      resourceId: appointment.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to create appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create appointment' };
  }
}

/**
 * Get appointments with filtering
 */
export async function getAppointments(filters?: AppointmentFilters) {
  try {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : '';
    const endpoint = queryParams ? `${API_ENDPOINTS.APPOINTMENTS.GET_ALL}?${queryParams}` : API_ENDPOINTS.APPOINTMENTS.GET_ALL;
    
    const { data } = await authenticatedApi<{ data: Appointment[]; meta: any }>(endpoint, {});
    return { success: true, appointments: data.data, meta: data.meta };
  } catch (error) {
    logger.error('Failed to get appointments', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch appointments' };
  }
}

/**
 * Get user's own appointments
 */
export async function getMyAppointments(filters?: any) {
  try {
    const queryParams = filters ? new URLSearchParams(filters).toString() : '';
    const endpoint = queryParams ? `${API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS}?${queryParams}` : API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS;
    
    const { data } = await authenticatedApi<{ data: Appointment[]; meta: any }>(endpoint, {});
    return { success: true, appointments: data.data, meta: data.meta };
  } catch (error) {
    logger.error('Failed to get my appointments', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch appointments' };
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string) {
  try {
    const { data } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id), {});
    return { success: true, appointment: data };
  } catch (error) {
    logger.error('Failed to get appointment by ID', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Appointment not found' };
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(id: string, data: UpdateAppointmentData) {
  try {
    const validatedData = updateAppointmentSchema.parse(data);
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    let appointmentDate: string | undefined;
    if (validatedData.date && validatedData.time) {
      appointmentDate = toIstAppointmentIso(validatedData.date, validatedData.time);
    }

    const payload = {
      ...validatedData,
      appointmentDate,
    };

    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_UPDATED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');
    
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to update appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to update appointment' };
  }
}

/**
 * Cancel appointment
 * @deprecated Use updateAppointmentStatus instead
 */
export async function cancelAppointment(id: string, reason?: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), {
      method: 'POST',
      body: JSON.stringify({ reason })
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_CANCELLED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { reason }
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to cancel appointment' };
  }
}

/**
 * Confirm appointment
 * @deprecated Use updateAppointmentStatus instead
 */
export async function confirmAppointment(id: string) {
  try {
    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.CONFIRM(id), { method: 'POST' });
    revalidateCache('appointments');
    return { success: true };
  } catch (error) {
    logger.error('Failed to confirm appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to confirm appointment' };
  }
}

/**
 * Check in appointment
 * @deprecated Use updateAppointmentStatus instead
 */
export async function checkInAppointment(id: string) {
  try {
    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id), { method: 'POST' });
    revalidateCache('appointments');
    revalidateCache('queue');
    return { success: true };
  } catch (error) {
    logger.error('Failed to check in appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to check in appointment' };
  }
}

/**
 * Start appointment
 * @deprecated Use updateAppointmentStatus instead
 */
export async function startAppointment(id: string) {
  try {
    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.START(id), { method: 'POST' });
    revalidateCache('appointments');
    return { success: true };
  } catch (error) {
    logger.error('Failed to start appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to start appointment' };
  }
}

/**
 * Complete appointment
 * @deprecated Use updateAppointmentStatus instead
 */
export async function completeAppointment(id: string, data: any) {
  try {
    const validatedData = completeAppointmentSchema.parse(data);
    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.COMPLETE(id), {
      method: 'POST',
      body: JSON.stringify(validatedData)
    });
    revalidateCache('appointments');
    return { success: true };
  } catch (error) {
    logger.error('Failed to complete appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to complete appointment' };
  }
}

// ===== DOCTOR AVAILABILITY =====

/**
 * Get doctor availability
 * Uses authenticatedApi when the user is logged in (patient booking flow),
 * falls back to publicApi for guest access.
 */
export async function getDoctorAvailability(clinicId: string, doctorId: string, date: string, locationId?: string) {
  try {
    console.log('[getDoctorAvailability - ENTRY]', { clinicId, doctorId, date, locationId });
    if (!doctorId) {
      logger.warn('[getDoctorAvailability] Missing doctorId, skipping request');
      return { success: false, error: 'Doctor ID is required' };
    }
    const params = new URLSearchParams({ date });
    if (locationId) params.append('locationId', locationId);

    // Use the appointments route path (served under /api/v1)
    const url = `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY(doctorId)}?${params.toString()}`;
    console.log('[getDoctorAvailability - CALLING_API]', { url, clinicId });

    const clinicHeaders = { 'X-Clinic-ID': clinicId };

    // Prefer authenticatedApi — the patient IS logged in when booking.
    // This avoids the backend's @Public() guard chain (JwtAuthGuard → ProfileCompletionGuard)
    // rejecting requests that have no token.
    const session = await getServerSession();
    let data: DoctorAvailability;

    if (session?.user) {
      console.log('[getDoctorAvailability - using authenticatedApi]');
      const result = await authenticatedApi<DoctorAvailability>(url, {
        headers: clinicHeaders,
        cache: 'no-store',
      });
      data = result.data;
    } else {
      console.log('[getDoctorAvailability - using publicApi (guest)]');
      const result = await publicApi<DoctorAvailability>(url, {
        headers: clinicHeaders,
        cache: 'no-store',
      });
      data = result.data;
    }

    console.log('[getDoctorAvailability - API_SUCCESS]', data);
    return { success: true, availability: data };
  } catch (error: any) {
    logger.error('Failed to get doctor availability', error instanceof Error ? error : new Error(String(error)));
    const errorMessage = error?.response?.data?.message || error?.message || 'Failed to fetch availability';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get user upcoming appointments
 */
export async function getUserUpcomingAppointments() {
  try {
    const { data } = await authenticatedApi<Appointment[]>(API_ENDPOINTS.APPOINTMENTS.UPCOMING, {});
    return { success: true, appointments: data };
  } catch (error) {
    logger.error('Failed to get upcoming appointments', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch upcoming appointments' };
  }
}

// ===== VIDEO APPOINTMENT SCHEDULING =====

/**
 * Propose video appointment
 */
export async function proposeVideoAppointment(data: any) {
  try {
    const validatedData = proposeVideoSlotsSchema.parse(data);
    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.VIDEO_PROPOSE, {
      method: 'POST',
      body: JSON.stringify(validatedData)
    });
    revalidateCache('appointments');
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to propose video appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to propose video appointment' };
  }
}

/**
 * Confirm video slot
 */
export async function confirmVideoSlot(appointmentId: string, confirmedSlotIndex: number) {
  try {
    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.VIDEO_CONFIRM_SLOT(appointmentId), {
      method: 'POST',
      body: JSON.stringify({ confirmedSlotIndex })
    });
    revalidateCache('appointments');
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to confirm video slot', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to confirm video slot' };
  }
}

/**
 * Reschedule appointment
 */
export async function rescheduleAppointment(id: string, data: any) {
  try {
    const validatedData = rescheduleAppointmentSchema.parse(data);
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const payload = {
      date: validatedData.date,
      time: validatedData.time,
      reason: validatedData.reason
    };

    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_RESCHEDULED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: payload
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');
    
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to reschedule appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to reschedule appointment' };
  }
}

/**
 * Reject video appointment proposal
 */
export async function rejectVideoProposal(id: string, reason: string) {
  try {
    const validatedData = rejectVideoProposalSchema.parse({ reason });
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data: result } = await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.VIDEO_REJECT_PROPOSAL(id), {
      method: 'POST',
      body: JSON.stringify(validatedData)
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_PROPOSAL_REJECTED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { reason }
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');
    
    return { success: true, ...((result as any) || {}) };
  } catch (error) {
    logger.error('Failed to reject video proposal', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to reject proposal' };
  }
}

// ===== UTILITIES =====

/**
 * Scan location QR and check in
 */
export async function scanLocationQRAndCheckIn(data: { code: string; locationId?: string }) {
  try {
    const validatedData = scanQRSchema.parse(data);
    const payload = {
      qrCode: validatedData.code,
      ...(validatedData.locationId ? { locationId: validatedData.locationId } : {})
    };
    const { data: appointment } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.SCAN_QR, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    revalidateCache('appointments');
    revalidateCache('queue');
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed QR check-in', error instanceof Error ? error : new Error(String(error)));
    const normalizedError = error as Error & {
      code?: string;
      details?: { message?: string; error?: string };
    };
    const detailedMessage =
      normalizedError.details?.message ||
      normalizedError.details?.error ||
      normalizedError.message;

    return {
      success: false,
      error: detailedMessage || 'QR check-in failed',
      code: normalizedError.code,
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
  code?: string; 
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.TEST_CONTEXT, {});
    return { success: true, context: data };
  } catch (error) {
    logger.error('Failed to test appointment context', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to test appointment context', code: 'CONTEXT_TEST_FAILED' };
  }
}

/**
 * Bulk update appointment status
 */
export async function bulkUpdateAppointmentStatus(appointmentIds: string[], status: string) {
  try {
    const { data: result } = await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.BULK_STATUS, {
      method: 'POST',
      body: JSON.stringify({ appointmentIds, status })
    });
    revalidateCache('appointments');
    return { success: true, ...((result as any) || {}) };
  } catch (error) {
    logger.error('Failed bulk appointment update', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Bulk update failed' };
  }
}
