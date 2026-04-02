// ✅ Consolidated Appointments Server Actions
// This file is the single source of truth for appointments and doctor availability.

'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedApi, publicApi, getServerSession, getClientInfo, revalidateCache } from './auth.server';
import { auditLog } from '@/lib/utils/audit';
import { validateClinicAccess } from '@/lib/config/permissions';
import { logger } from '@/lib/utils/logger';
import { isApiError } from '@/lib/utils/error-handler';
import { API_ENDPOINTS, APP_CONFIG } from '@/lib/config/config';
import type { 
  Appointment, 
  CreateAppointmentData, 
  UpdateAppointmentData, 
  AppointmentFilters,
  DoctorAvailability,
  AppointmentServiceDefinition,
  AppointmentReassignmentCandidate,
  AssistantDoctorCoverageAssignment,
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

function normalizeAppointment(raw: Appointment | (Appointment & { appointmentDate?: string })) {
  const metadata =
    raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
      ? (raw.metadata as Record<string, unknown>)
      : {};
  const appointmentDate =
    typeof (raw as { appointmentDate?: string }).appointmentDate === 'string'
      ? (raw as { appointmentDate?: string }).appointmentDate
      : undefined;

  const normalizedRaw = {
    ...raw,
    primaryDoctorId:
      typeof raw.primaryDoctorId === 'string'
        ? raw.primaryDoctorId
        : typeof metadata.primaryDoctorId === 'string'
          ? metadata.primaryDoctorId
          : raw.doctorId,
    assignedDoctorId:
      typeof raw.assignedDoctorId === 'string'
        ? raw.assignedDoctorId
        : typeof metadata.assignedDoctorId === 'string'
          ? metadata.assignedDoctorId
          : raw.doctorId,
    doctorRole:
      typeof raw.doctorRole === 'string'
        ? raw.doctorRole
        : typeof (raw as { doctor?: { role?: string; user?: { role?: string } } }).doctor?.role === 'string'
          ? (raw as { doctor?: { role?: string; user?: { role?: string } } }).doctor?.role
          : typeof (raw as { doctor?: { role?: string; user?: { role?: string } } }).doctor?.user?.role ===
              'string'
            ? (raw as { doctor?: { role?: string; user?: { role?: string } } }).doctor?.user?.role
            : undefined,
  };

  if (!appointmentDate) {
    return normalizedRaw;
  }

  const parsedDate = new Date(appointmentDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedRaw;
  }

  // Use IST timezone for both date and time to ensure correct clinic-local values
  const istDate = parsedDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const istTime = parsedDate.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/^24:/, '00:');

  return {
    ...normalizedRaw,
    date: istDate,
    time: istTime,
  };
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
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update appointment status', normalizedError);
    return { success: false, error: normalizedError.message || 'Failed to update status' };
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

export async function getAppointmentServiceCatalog(): Promise<{
  success: boolean;
  services?: AppointmentServiceDefinition[];
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi<{
      services?: AppointmentServiceDefinition[];
      data?: { services?: AppointmentServiceDefinition[] };
    }>(API_ENDPOINTS.APPOINTMENTS.SERVICES, {
      cache: 'force-cache',
    });

    const services = Array.isArray(data?.services)
      ? data.services
      : Array.isArray(data?.data?.services)
        ? data.data.services
        : [];

    return { success: true, services };
  } catch (error) {
    logger.error(
      'Failed to get appointment service catalog',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch appointment services' };
  }
}

export async function getAppointmentReassignmentCandidates(
  id: string
): Promise<{
  success: boolean;
  candidates?: AppointmentReassignmentCandidate[];
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi<{
      candidates?: AppointmentReassignmentCandidate[];
      data?: { candidates?: AppointmentReassignmentCandidate[] };
    }>(API_ENDPOINTS.APPOINTMENTS.REASSIGNMENT_CANDIDATES(id), {});

    const candidates = Array.isArray(data?.candidates)
      ? data.candidates
      : Array.isArray(data?.data?.candidates)
        ? data.data.candidates
        : [];

    return { success: true, candidates };
  } catch (error) {
    logger.error(
      'Failed to get appointment reassignment candidates',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch reassignment candidates' };
  }
}

export async function getAssistantDoctorCoverage(): Promise<{
  success: boolean;
  entries?: AssistantDoctorCoverageAssignment[];
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi<{
      entries?: AssistantDoctorCoverageAssignment[];
      data?: { entries?: AssistantDoctorCoverageAssignment[] };
    }>(API_ENDPOINTS.APPOINTMENTS.ASSISTANT_COVERAGE, {});

    const entries = Array.isArray(data?.entries)
      ? data.entries
      : Array.isArray(data?.data?.entries)
        ? data.data.entries
        : [];

    return { success: true, entries };
  } catch (error) {
    logger.error(
      'Failed to get assistant doctor coverage',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch assistant doctor coverage' };
  }
}

export async function updateAssistantDoctorCoverage(
  entries: AssistantDoctorCoverageAssignment[]
): Promise<{
  success: boolean;
  entries?: AssistantDoctorCoverageAssignment[];
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi<{
      entries?: AssistantDoctorCoverageAssignment[];
      data?: { entries?: AssistantDoctorCoverageAssignment[] };
    }>(API_ENDPOINTS.APPOINTMENTS.ASSISTANT_COVERAGE, {
      method: 'PUT',
      body: JSON.stringify({ entries }),
    });

    const updatedEntries = Array.isArray(data?.entries)
      ? data.entries
      : Array.isArray(data?.data?.entries)
        ? data.data.entries
        : [];

    return { success: true, entries: updatedEntries };
  } catch (error) {
    logger.error(
      'Failed to update assistant doctor coverage',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to save assistant doctor coverage' };
  }
}

/**
 * Get appointments with filtering
 */
export async function getAppointments(filters?: AppointmentFilters & { omitClinicId?: boolean }) {
  try {
    const { omitClinicId, ...restFilters } = filters || {};
    const queryParams = new URLSearchParams(restFilters as any).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.APPOINTMENTS.GET_ALL}?${queryParams}` : API_ENDPOINTS.APPOINTMENTS.GET_ALL;
    
    const { status, data } = await authenticatedApi<{
      data?: Appointment[] | { appointments?: Appointment[]; pagination?: any };
      appointments?: Appointment[];
      pagination?: any;
      meta?: any;
    }>(endpoint, {
      ...(restFilters.clinicId ? { headers: { 'X-Clinic-ID': restFilters.clinicId } } : {}),
    });

    // Detect profile-incomplete 403 returned gracefully by authenticatedApi
    if (status === 403 && !data) {
      return { success: false, error: 'Profile incomplete. Please complete your profile to access appointments.', code: 'PROFILE_INCOMPLETE' as const };
    }

    const payload =
      Array.isArray(data)
        ? data
        : Array.isArray(data.appointments)
          ? data.appointments
          : data.data ?? data;
    const appointments = (Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.appointments)
        ? payload.appointments
        : []).map(appointment => normalizeAppointment(appointment));
    const meta =
      (!Array.isArray(payload) && payload?.pagination) ||
      data.pagination ||
      data.meta;
    return { success: true, appointments, meta };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get appointments', error instanceof Error ? error : new Error(errorMessage));

    // Preserve specific error types for proper UI feedback
    if (errorMessage.includes('Profile Incomplete') || errorMessage.includes('requiresProfileCompletion')) {
      return { success: false, error: 'Profile incomplete. Please complete your profile to access appointments.', code: 'PROFILE_INCOMPLETE' as const };
    }
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      return { success: false, error: errorMessage, code: 'ACCESS_DENIED' as const };
    }

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
    
    const { data } = await authenticatedApi<{
      data?: Appointment[] | { appointments?: Appointment[]; pagination?: any };
      appointments?: Appointment[];
      pagination?: any;
      meta?: any;
    }>(endpoint, {});
    const payload =
      Array.isArray(data)
        ? data
        : Array.isArray(data.appointments)
          ? data.appointments
          : data.data ?? data;
    const appointments = (Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.appointments)
        ? payload.appointments
        : []).map(appointment => normalizeAppointment(appointment));
    const meta =
      (!Array.isArray(payload) && payload?.pagination) ||
      data.pagination ||
      data.meta;
    return { success: true, appointments, meta };
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
    return { success: true, appointment: normalizeAppointment(data as Appointment) };
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
 */
export async function checkInAppointment(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id), {
      method: 'POST',
      body: JSON.stringify({
        checkInMethod: 'manual',
        notes: 'Manual receptionist check-in',
      }),
    });

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_CHECKED_IN',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { checkInMethod: 'manual' },
    });

    revalidateCache('appointments');
    revalidateCache('queue');
    return { success: true };
  } catch (error) {
    logger.error('Failed to check in appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to check in appointment' };
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
      newDate: validatedData.date,
      newTime: validatedData.time,
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
export async function scanLocationQRAndCheckIn(data: {
  code: string;
  locationId?: string;
  appointmentId?: string;
}) {
  try {
    const validatedData = scanQRSchema.parse(data);
    const payload = {
      qrCode: validatedData.code,
      ...(validatedData.locationId ? { locationId: validatedData.locationId } : {}),
      ...(validatedData.appointmentId ? { appointmentId: validatedData.appointmentId } : {}),
    };
    const { data: response } = await authenticatedApi<any>(API_ENDPOINTS.APPOINTMENTS.SCAN_QR, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const responseData = response?.data ?? response;

    if (response?.success === false && responseData?.requiresSelection) {
      return {
        success: false,
        requiresSelection: true,
        appointments: responseData.eligibleAppointments ?? [],
        message: responseData.message ?? 'Multiple appointments found',
      };
    }

    if (response?.success === false) {
      return {
        success: false,
        error: response?.message || responseData?.message || 'QR check-in failed',
      };
    }

    revalidateCache('appointments');
    revalidateCache('queue');
    return {
      success: true,
      appointment: {
        appointmentId: responseData?.appointmentId,
        locationId: responseData?.locationId,
        locationName: responseData?.locationName,
        checkedInAt: responseData?.checkedInAt,
        queuePosition: responseData?.queuePosition,
        totalInQueue: responseData?.totalInQueue,
        estimatedWaitTime: responseData?.estimatedWaitTime,
        doctorId: responseData?.doctorId,
        doctorName: responseData?.doctorName,
      },
    };
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

export async function reassignAppointmentDoctor(
  id: string,
  data: {
    doctorId: string;
    reason?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data: appointment } = await authenticatedApi<Appointment>(
      API_ENDPOINTS.APPOINTMENTS.REASSIGN_DOCTOR(id),
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    const { ipAddress, userAgent } = await getClientInfo();
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_DOCTOR_REASSIGNED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'MEDIUM',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: {
        doctorId: data.doctorId,
        reason: data.reason,
      },
    });

    revalidatePath('/receptionist/appointments');
    revalidatePath('/doctor/appointments');
    revalidatePath('/assistant-doctor/dashboard');
    revalidatePath('/assistant-doctor/appointments');
    revalidateCache('appointments');
    revalidateCache('queue');

    return { success: true, appointment: normalizeAppointment(appointment) };
  } catch (error) {
    logger.error(
      'Failed to reassign appointment doctor',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reassign appointment doctor',
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

// ===== DOCTOR AVAILABILITY =====

/**
 * Get doctor availability
 * Uses authenticatedApi when the user is logged in (patient booking flow),
 * falls back to publicApi for guest access.
 */
export async function getDoctorAvailability(clinicId: string, doctorId: string, date: string, locationId?: string, appointmentType?: string) {
  try {
    if (!doctorId) {
      logger.warn('[getDoctorAvailability] Missing doctorId, skipping request');
      return { success: false, error: 'Doctor ID is required' };
    }
    const params = new URLSearchParams({ date });
    if (locationId) params.append('locationId', locationId);
    if (appointmentType) params.append('type', appointmentType);

    // Use the appointments route path (served under /api/v1)
    const url = `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY(doctorId)}?${params.toString()}`;

    const clinicHeaders = { 'X-Clinic-ID': clinicId };

    // Prefer authenticatedApi — the patient IS logged in when booking.
    // This avoids the backend's @Public() guard chain (JwtAuthGuard → ProfileCompletionGuard)
    // rejecting requests that have no token.
    const session = await getServerSession();
    let data: DoctorAvailability;

    if (session?.user) {
      const result = await authenticatedApi<DoctorAvailability>(url, {
        headers: clinicHeaders,
        cache: 'no-store',
      });
      data = result.data;
    } else {
      const result = await publicApi<DoctorAvailability>(url, {
        headers: clinicHeaders,
        cache: 'no-store',
      });
      data = result.data;
    }

    return { success: true, availability: data };
  } catch (error: unknown) {
    logger.error('Failed to get doctor availability', error instanceof Error ? error : new Error(String(error)));
    const errorMessage = isApiError(error)
      ? (error.message ?? 'Failed to fetch availability')
      : error instanceof Error ? error.message : 'Failed to fetch availability';
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
