// ✅ Consolidated Appointments Server Actions
// This file is the single source of truth for appointments and doctor availability.

'use server';

import { revalidatePath } from 'next/cache';

import { authenticatedApi, publicApi, getServerSession, getClientInfo } from './auth.server';
import { revalidateCache } from '@/lib/utils/revalidate-cache';
import { auditLog } from '@/lib/utils/audit';
import { validateClinicAccess } from '@/lib/config/permissions';
import { logger } from '@/lib/utils/logger';
import { isApiError } from '@/lib/utils/error-handler';
import { API_ENDPOINTS, APP_CONFIG } from '@/lib/config/config';
import {
  collectAppointmentListPages,
  extractAppointmentListPage,
  type AppointmentListQueryInput,
} from '@/lib/api/client';
import { formatISODateInIST, formatTimeInIST } from '@/lib/utils/appointmentUtils';
import { normalizeAppointment as normalizeAppointmentShared } from '@/lib/utils/appointmentUtils';
import type {
  Appointment,
  CreateAppointmentData,
  UpdateAppointmentData,
  AppointmentFilters,
  DoctorAvailability,
  AppointmentServiceDefinition,
  AppointmentReassignmentCandidate,
  AssistantDoctorCoverageAssignment,
  FollowUpPlan,
  RecurringAppointmentSeries,
} from '@/types/appointment.types';

// ===== SCHEMAS =====

import { 
  scanQRSchema, 
  createAppointmentSchema, 
  updateAppointmentSchema, 
  completeAppointmentSchema,
  updateAppointmentStatusSchema,
  bulkCompleteAppointmentsSchema,
  rescheduleAppointmentSchema,
  rejectVideoProposalSchema
} from '@/lib/schema/appointments.schema';
import { z } from 'zod';

const IST_UTC_OFFSET = '+05:30';

function toIstAppointmentIso(date: string, time: string): string {
  // Normalize incoming date/time to IST first, then store as UTC ISO for backend consistency.
  const normalizedDate = String(date || '')
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '')
    .trim();
  return new Date(`${normalizedDate}T${time}:00${IST_UTC_OFFSET}`).toISOString();
}

function normalizeAppointment(raw: Appointment | (Appointment & { appointmentDate?: string })) {
  return normalizeAppointmentShared(raw as unknown as Record<string, unknown>) as Appointment;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Several appointment routes answer HTTP 200 with `{ success: false, message, error }`
 * (for example an invalid status transition), sometimes nested one level down under
 * `data`. Returns the backend's message for such a body, otherwise `null`.
 */
function readRejectedOutcome(payload: unknown): string | null {
  if (!isPlainRecord(payload) || payload.success !== false) return null;
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  const error = typeof payload.error === 'string' ? payload.error.trim() : '';
  return message || error || 'The request was not applied';
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

    const [statusResult, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi(API_ENDPOINTS.APPOINTMENTS.STATUS(id), {
        method: 'PATCH',
        body: JSON.stringify(validatedData)
      }),
      getClientInfo(),
    ]);
    const rejectedStatusChange = readRejectedOutcome(statusResult.data);
    if (rejectedStatusChange) {
      return { success: false, error: rejectedStatusChange };
    }
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
 * Start a consultation.
 *
 * Backend contract: PATCH /appointments/:id/status with
 * `{ status: 'IN_PROGRESS', consultationType?, notes? }` (UpdateAppointmentStatusDto;
 * roles PATIENT, DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST, CLINIC_ADMIN, NURSE). There is
 * no `/start-consultation` route and the DTO has no `doctorId`: the backend uses the
 * doctor already assigned to the appointment. An in-person visit must be checked in
 * (status CONFIRMED) first, otherwise the backend answers with a business-rule error
 * whose message is returned to the caller.
 *
 * `data.doctorId` is accepted for existing callers and is not sent.
 */
export async function startConsultation(
  id: string,
  data: {
    doctorId?: string;
    consultationType?: string;
    notes?: string;
  } = {}
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const payload = {
      status: 'IN_PROGRESS' as const,
      ...(data.consultationType ? { consultationType: data.consultationType } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
    };

    const [{ data: startResult }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<unknown>(API_ENDPOINTS.APPOINTMENTS.STATUS(id), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
      getClientInfo(),
    ]);
    const rejectedStart = readRejectedOutcome(startResult);
    if (rejectedStart) {
      return { success: false, error: rejectedStart };
    }
    // The status route answers `{ success, data: <consultation data> }`, not an appointment row.
    const appointment = (
      isPlainRecord(startResult) && 'data' in startResult ? startResult.data : startResult
    ) as Appointment | undefined;
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_CONSULTATION_STARTED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: payload,
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidatePath('/doctor/dashboard');
    revalidatePath('/doctor/appointments');
    revalidatePath('/doctor/appointments');
    revalidatePath('/patient/appointments');
    revalidateCache('appointments');
    revalidateCache('myAppointments');
    revalidateCache('queue');
    revalidateCache('queue-status');
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to start consultation', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to start consultation' };
  }
}

/**
 * Complete an appointment: POST /appointments/:id/complete (CompleteAppointmentDto;
 * roles DOCTOR, ASSISTANT_DOCTOR, THERAPIST, COUNSELOR, NURSE, RECEPTIONIST).
 *
 * `doctorId` is never sent. The backend treats it as the Doctor record id and uses it
 * as the key of the live queue the patient is removed from; when it is absent the
 * backend takes the doctor from the appointment, which is always the right queue.
 * Sending the signed-in USER id here left the patient in the queue. The parameter is
 * still accepted so existing callers keep compiling.
 */
export async function completeAppointment(
  id: string,
  data: {
    doctorId?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    treatmentPlan?: string;
    medications?: string[];
    followUpDate?: string;
    followUpNotes?: string;
    followUpInstructions?: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { doctorId: _doctorId, ...rest } = data;
    const { followUpNotes, ...validatedData } = completeAppointmentSchema.parse(rest);
    // `followUpNotes` is not a DTO field (the request would be rejected as an unknown
    // property); the DTO's name for the follow-up text is `followUpInstructions`.
    const followUpInstructions = validatedData.followUpInstructions || followUpNotes;
    const payload = {
      ...validatedData,
      ...(followUpInstructions ? { followUpInstructions } : {}),
    };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.COMPLETE(id), {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      getClientInfo(),
    ]);
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_COMPLETED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: {
        ...payload,
        appointmentId: id,
      },
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidatePath('/doctor/dashboard');
    revalidatePath('/doctor/appointments');
    revalidatePath('/patient/appointments');
    revalidateCache('appointments');
    revalidateCache('myAppointments');
    revalidateCache('queue');
    revalidateCache('queue-status');
    revalidateCache('prescriptions');
    revalidateCache('patient-prescriptions');
    revalidateCache('medical-records');
    return { success: true, appointment };
  } catch (error) {
    logger.error('Failed to complete appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to complete appointment' };
  }
}

/**
 * Mark multiple selected appointments as completed in one call.
 * Used by the doctor/receptionist appointments list bulk-action bar.
 *
 * POST /appointments/complete/bulk (BulkCompleteAppointmentDto: appointmentIds 1..50,
 * doctorId?, notes?, metadata?; roles DOCTOR, ASSISTANT_DOCTOR, THERAPIST, COUNSELOR,
 * NURSE, RECEPTIONIST, CLINIC_ADMIN). `doctorId`, when given, must be the Doctor RECORD
 * id (never the user id): it becomes the queue key for every listed appointment. Leave
 * it out and the backend uses each appointment's own doctor.
 */
export async function bulkCompleteAppointments(data: {
  appointmentIds: string[];
  doctorId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const validatedData = bulkCompleteAppointmentsSchema.parse(data);

    const [{ data: result }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<{ completed: number; failed: number }>(API_ENDPOINTS.APPOINTMENTS.COMPLETE_BULK, {
        method: 'POST',
        body: JSON.stringify(validatedData),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_BULK_COMPLETED',
      resource: 'APPOINTMENT',
      resourceId: validatedData.appointmentIds.join(','),
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: {
        appointmentIds: validatedData.appointmentIds,
        completed: result.completed,
        failed: result.failed,
      },
    });

    revalidatePath('/doctor/dashboard');
    revalidatePath('/doctor/appointments');
    revalidatePath('/appointments');
    revalidateCache('appointments');
    revalidateCache('myAppointments');
    revalidateCache('queue');
    revalidateCache('queue-status');

    return { success: true, completed: result.completed, failed: result.failed };
  } catch (error) {
    logger.error('Failed to bulk complete appointments', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to bulk complete appointments' };
  }
}

/**
 * Cancel an appointment using the dedicated ownership-aware backend route:
 * DELETE /appointments/:id (roles PATIENT, RECEPTIONIST, DOCTOR, ASSISTANT_DOCTOR,
 * NURSE, CLINIC_ADMIN). The route takes no body: the backend records the fixed reason
 * "Cancelled by user", so `reason` is kept only in the web audit log.
 */
export async function cancelAppointment(id: string, reason?: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [cancelResult, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi(API_ENDPOINTS.APPOINTMENTS.DELETE(id), {
        method: 'DELETE',
      }),
      getClientInfo(),
    ]);
    const rejectedCancellation = readRejectedOutcome(cancelResult.data);
    if (rejectedCancellation) {
      return { success: false, error: rejectedCancellation };
    }
    await auditLog({
      userId: session.user.id,
      action: 'APPOINTMENT_CANCELLED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { reason },
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');
    revalidateCache('appointment');
    revalidateCache('myAppointments');
    revalidateCache('queue');

    return { success: true };
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to cancel appointment', normalizedError);
    return { success: false, error: normalizedError.message || 'Failed to cancel appointment' };
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
    // `familyMemberId` (optional, CreateAppointmentDto): who the visit is for when it is not the patient.
    const validatedData = createAppointmentSchema
      .extend({ familyMemberId: z.string().uuid().optional() })
      .parse(data);
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };
    const { user, session_id: sessionId } = session;
    const userId = user.id;

    const hasAccess = await validateClinicAccess(userId, 'appointments.create');
    if (!hasAccess) return { success: false, error: 'Access denied' };

    // Use the session's current clinicId (already normalized on login/profile completion)
    const clinicIdToSend = session.user.clinicId || APP_CONFIG.CLINIC.ID;

    const appointmentDate = toIstAppointmentIso(validatedData.date, validatedData.time);
    const { date: _date, time: _time, ...restPayload } = validatedData;
    const payload = {
      ...restPayload,
      appointmentDate,
    };

    const { data: response } = await authenticatedApi<{
      success?: boolean;
      data?: Appointment;
      appointment?: Appointment;
      message?: string;
      error?: string;
      code?: string;
    }>(API_ENDPOINTS.APPOINTMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'X-Clinic-ID': clinicIdToSend,
      },
    });

    const appointment = (response?.data || response?.appointment || response) as Appointment | undefined;
    if (!response || response.success === false) {
      const errorResult: { success: false; error: string; code?: string } = {
        success: false,
        error: response?.message || response?.error || 'Failed to create appointment',
      };
      if (response?.code) {
        errorResult.code = response.code;
      }
      return errorResult;
    }

    if (!appointment || typeof appointment !== 'object') {
      return { success: false, error: 'No appointment returned' };
    }

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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

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

    const sanitizedServices = services.flatMap((service) => {
      const appointmentModes = Array.isArray(service.appointmentModes)
        ? service.appointmentModes.filter(
            (mode): mode is 'IN_PERSON' | 'VIDEO_CALL' => mode === 'IN_PERSON' || mode === 'VIDEO_CALL'
          )
        : [];

      if (!appointmentModes.length) {
        return [];
      }

      return [
        {
          ...service,
          appointmentModes,
        },
      ];
    });

    return { success: true, services: sanitizedServices };
  } catch (error) {
    logger.error(
      'Failed to get appointment service catalog',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch appointment services' };
  }
}

export async function getCheckInLocations(): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data } = await authenticatedApi<{
      data?: unknown[];
      locations?: unknown[];
    }>(API_ENDPOINTS.APPOINTMENTS.CHECK_IN_LOCATIONS, {});

    const locations = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.locations)
        ? data.locations
        : Array.isArray(data as unknown[])
          ? (data as unknown[])
          : [];

    return { success: true, data: locations };
  } catch (error) {
    logger.error(
      'Failed to get check-in locations',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch check-in locations' };
  }
}

export async function getCheckInHistory(): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data } = await authenticatedApi<unknown>(API_ENDPOINTS.APPOINTMENTS.CHECK_IN_HISTORY, {});
    return { success: true, data };
  } catch (error) {
    logger.error(
      'Failed to get check-in history',
      error instanceof Error ? error : new Error(String(error))
    );
    return { success: false, error: 'Failed to fetch check-in history' };
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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

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
 * Get appointments with filtering.
 *
 * GET /appointments reads only: userId, doctorId, status (comma separated), date,
 * dateFrom, dateTo, locationId, page, limit. `startDate` / `endDate` are translated to
 * `dateFrom` / `dateTo`, and a `limit` above the backend cap of 100 is read page by page
 * (bounded; see collectAppointmentListPages). Rows come back newest first.
 */
export async function getAppointments(filters?: AppointmentFilters & { omitClinicId?: boolean }) {
  try {
    const session = await getServerSession();
    const { omitClinicId: _omitClinicId, ...restFilters } = filters || {};
    const requestContext = {
      clinicId: restFilters.clinicId || session?.user?.clinicId || APP_CONFIG.CLINIC.ID,
      status: restFilters.status,
      date: restFilters.date,
      startDate: restFilters.startDate,
      endDate: restFilters.endDate,
      page: restFilters.page,
      limit: restFilters.limit,
    };
    logger.debug('getAppointments request', requestContext);
    const resolvedClinicId = session?.user?.clinicId || restFilters.clinicId || APP_CONFIG.CLINIC.ID;
    const listParams: AppointmentListQueryInput = {
      doctorId: restFilters.doctorId,
      patientId: restFilters.patientId,
      clinicId: restFilters.clinicId,
      locationId: restFilters.locationId,
      status: restFilters.status,
      date: restFilters.date,
      startDate: restFilters.startDate,
      endDate: restFilters.endDate,
      page: restFilters.page,
      limit: restFilters.limit,
    };

    const outcome = { profileIncomplete: false };
    const page = await collectAppointmentListPages(listParams, async (query) => {
      const queryParams = new URLSearchParams(query).toString();
      const endpoint = queryParams
        ? `${API_ENDPOINTS.APPOINTMENTS.GET_ALL}?${queryParams}`
        : API_ENDPOINTS.APPOINTMENTS.GET_ALL;
      const { status, data } = await authenticatedApi<unknown>(endpoint, {
        ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
        omitClinicId: true,
        cache: 'no-store',
      });

      // Detect profile-incomplete 403 returned gracefully by authenticatedApi
      if (status === 403 && !data) {
        outcome.profileIncomplete = true;
        return { appointments: [] };
      }
      return extractAppointmentListPage(data);
    });

    if (outcome.profileIncomplete) {
      return { success: false, error: 'Profile incomplete. Please complete your profile to access appointments.', code: 'PROFILE_INCOMPLETE' as const };
    }

    const appointments = (page.appointments as Appointment[]).map(appointment => normalizeAppointment(appointment));
    const meta = page.pagination;
    logger.debug('getAppointments response', { appointmentsCount: appointments.length, hasMeta: !!meta });
    return { success: true, appointments, meta };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get appointments', error instanceof Error ? error : new Error(errorMessage));
    const normalizedCode =
      isApiError(error) && typeof error.code === 'string'
        ? error.code.replace(/[\s_-]+/g, '_').toUpperCase()
        : '';

    // Preserve specific error types for proper UI feedback
    if (
      normalizedCode === 'PROFILE_INCOMPLETE' ||
      normalizedCode === 'USER_PROFILE_INCOMPLETE' ||
      errorMessage.includes('Profile Incomplete') ||
      errorMessage.includes('requiresProfileCompletion')
    ) {
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
 * ClinicId is resolved server-side from the session cookie to avoid stale client state.
 */
export async function getMyAppointments(filters?: any) {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as
      | { clinicId?: string; primaryClinicId?: string }
      | undefined;
    const requestContext = {
      clinicId: filters?.clinicId || sessionUser?.clinicId || sessionUser?.primaryClinicId || APP_CONFIG.CLINIC.ID,
      status: filters?.status,
      date: filters?.date,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      page: filters?.page,
      limit: filters?.limit,
    };
    logger.debug('getMyAppointments request', requestContext);
    // Use the authoritative session clinicId — the cookie is always current after login/profile completion.
    // Only use filters.clinicId as a fallback when session doesn't have clinicId.
    const resolvedClinicId =
      sessionUser?.clinicId ||
      sessionUser?.primaryClinicId ||
      filters?.clinicId ||
      APP_CONFIG.CLINIC.ID;

    if (!resolvedClinicId) {
      return {
        success: false,
        error: 'Clinic context is required to fetch appointments.',
        code: 'CLINIC_CONTEXT_REQUIRED' as const,
      };
    }
    const normalizedFilters = {
      page: 1,
      limit: 100,
      ...(filters || {}),
    };
    const queryInput = Object.entries(normalizedFilters).reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        accumulator[key] = String(value);
      }
      return accumulator;
    }, {});
    const queryParams = new URLSearchParams(queryInput).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS}?${queryParams}` : API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS;
    
    const { status, data } = await authenticatedApi<{
      data?: Appointment[] | { appointments?: Appointment[]; pagination?: any };
      appointments?: Appointment[];
      pagination?: any;
      meta?: any;
    }>(endpoint, {
      ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
      omitClinicId: true,
      cache: 'no-store',
    });

    // Detect profile-incomplete 403 returned gracefully by authenticatedApi
    if (status === 403 && !data) {
      return {
        success: false,
        error: 'Profile incomplete. Please complete your profile to access appointments.',
        code: 'PROFILE_INCOMPLETE' as const,
      };
    }

    if (!data) {
      return { success: false, error: 'No appointment data available' };
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
    logger.debug('getMyAppointments response', { appointmentsCount: appointments.length, hasMeta: !!meta });
    return { success: true, appointments, meta };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Failed to get my appointments', error instanceof Error ? error : new Error(errorMessage));
    const normalizedCode =
      isApiError(error) && typeof error.code === 'string'
        ? error.code.replace(/[\s_-]+/g, '_').toUpperCase()
        : '';
    if (
      normalizedCode === 'PROFILE_INCOMPLETE' ||
      normalizedCode === 'USER_PROFILE_INCOMPLETE' ||
      errorMessage.includes('Profile Incomplete') ||
      errorMessage.includes('requiresProfileCompletion')
    ) {
      return {
        success: false,
        error: 'Profile incomplete. Please complete your profile to access appointments.',
        code: 'PROFILE_INCOMPLETE' as const,
      };
    }
    return { success: false, error: 'Failed to fetch appointments' };
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data } = await authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id), {
      cache: 'no-store',
    });
    return { success: true, appointment: normalizeAppointment(data as Appointment) };
  } catch (error) {
    logger.error('Failed to get appointment by ID', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Appointment not found' };
  }
}

const APPOINTMENT_PRIORITIES = ['EMERGENCY', 'URGENT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW', 'ROUTINE'] as const;
type AppointmentPriorityValue = (typeof APPOINTMENT_PRIORITIES)[number];

function toAppointmentPriority(value: unknown): AppointmentPriorityValue | undefined {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return APPOINTMENT_PRIORITIES.find((priority) => priority === normalized);
}

/**
 * Update appointment: PUT /appointments/:id (UpdateAppointmentDto; roles PATIENT,
 * RECEPTIONIST, DOCTOR, ASSISTANT_DOCTOR). There is no PATCH /appointments/:id.
 *
 * Only fields that are both in the DTO and stored on the appointment are sent:
 * appointmentDate, duration, status, priority, treatmentType, notes, metadata.
 * - `priority` is required by the DTO, so the caller's value is used, else the visit's
 *   current priority is read first (GET /appointments/:id) and sent back unchanged.
 * - diagnosis / prescription / treatmentPlan / symptoms / followUpDate have no column on
 *   the appointment: they are stored in `metadata.consultationDraft`, the same place the
 *   consultation screens already use.
 * - `metadata` replaces the stored metadata, so callers pass the full object.
 */
export async function updateAppointment(
  id: string,
  data: UpdateAppointmentData & { priority?: string }
) {
  try {
    const validatedData = updateAppointmentSchema.parse({
      ...data,
      ...(data.priority !== undefined ? { priority: toAppointmentPriority(data.priority) } : {}),
    });
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    let appointmentDate: string | undefined;
    if (validatedData.date && validatedData.time) {
      appointmentDate = toIstAppointmentIso(validatedData.date, validatedData.time);
    }

    const clinicalFields = {
      ...(validatedData.diagnosis ? { diagnosis: validatedData.diagnosis } : {}),
      ...(validatedData.prescription ? { prescription: validatedData.prescription } : {}),
      ...(validatedData.treatmentPlan ? { treatmentPlan: validatedData.treatmentPlan } : {}),
      ...(validatedData.symptoms?.length ? { symptoms: validatedData.symptoms } : {}),
      ...(validatedData.followUpDate ? { followUpDate: validatedData.followUpDate } : {}),
    };
    const hasClinicalFields = Object.keys(clinicalFields).length > 0;

    // The current visit is needed for the priority the DTO requires, and for the stored
    // metadata when clinical text has to be merged into it.
    let currentAppointment: Record<string, unknown> | undefined;
    if (!validatedData.priority || (hasClinicalFields && !validatedData.metadata)) {
      try {
        const { data: current } = await authenticatedApi<unknown>(
          API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id),
          { cache: 'no-store' }
        );
        currentAppointment = isPlainRecord(current) ? current : undefined;
      } catch (lookupError) {
        logger.warn('Could not read the appointment before updating it', {
          appointmentId: id,
          error: lookupError instanceof Error ? lookupError.message : String(lookupError),
        });
      }
    }

    const priority = validatedData.priority ?? toAppointmentPriority(currentAppointment?.priority);
    if (!priority) {
      // Sending a default here would silently reset an urgent visit to NORMAL.
      return {
        success: false,
        error: 'Could not read the current priority of this appointment, so it was not updated. Please try again.',
      };
    }

    let metadata = validatedData.metadata;
    if (hasClinicalFields) {
      const baseMetadata =
        metadata ?? (isPlainRecord(currentAppointment?.metadata) ? currentAppointment.metadata : {});
      const existingDraft = isPlainRecord(baseMetadata.consultationDraft)
        ? baseMetadata.consultationDraft
        : {};
      metadata = {
        ...baseMetadata,
        consultationDraft: {
          ...existingDraft,
          ...clinicalFields,
          savedAt: new Date().toISOString(),
          savedBy: session.user.id,
        },
      };
    }

    const payload = {
      ...(appointmentDate ? { appointmentDate } : {}),
      ...(validatedData.duration !== undefined ? { duration: validatedData.duration } : {}),
      ...(validatedData.status ? { status: validatedData.status } : {}),
      priority,
      ...(validatedData.treatmentType ? { treatmentType: validatedData.treatmentType } : {}),
      ...(validatedData.notes !== undefined ? { notes: validatedData.notes } : {}),
      ...(metadata ? { metadata } : {}),
    };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
      getClientInfo(),
    ]);
    // The route answers 200 with `{ success: false, message }` when the update was not
    // applied (unknown visit, invalid status change, scheduling conflict).
    const rejectedUpdate = readRejectedOutcome(appointment);
    if (rejectedUpdate) {
      return { success: false, error: rejectedUpdate };
    }
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
    return {
      success: false,
      error: isApiError(error) && error.message ? error.message : 'Failed to update appointment',
    };
  }
}

/**
 * Check in appointment
 */
export async function checkInAppointment(
  id: string,
  options?: {
    reason?: string;
    locationId?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const fallbackReason = options?.reason || 'Manual receptionist check-in override';
    const staffRoles = new Set(['RECEPTIONIST', 'DOCTOR', 'ASSISTANT_DOCTOR', 'NURSE']);
    const isStaff = staffRoles.has(String(session.user.role || '').toUpperCase());

    try {
      await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id), {
        method: 'POST',
        body: JSON.stringify({
          checkInMethod: 'manual',
          notes: 'Manual receptionist check-in',
          ...(options?.locationId ? { locationId: options.locationId } : {}),
        }),
      });
    } catch (checkInError) {
      if (!isStaff) {
        throw checkInError;
      }

      await authenticatedApi(API_ENDPOINTS.APPOINTMENTS.FORCE_CHECK_IN(id), {
        method: 'POST',
        body: JSON.stringify({
          reason: fallbackReason,
          ...(options?.locationId ? { locationId: options.locationId } : {}),
        }),
      });
    }

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
      metadata: {
        checkInMethod: 'manual',
        forceFallbackEnabled: true,
        ...(options?.locationId ? { locationId: options.locationId } : {}),
      },
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
 * Force check-in appointment for staff receptionist/manual workflow.
 */
export async function forceCheckInAppointment(
  id: string,
  options?: {
    reason?: string;
    locationId?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const reason = options?.reason || 'Manual receptionist check-in override';
    const [{ data }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi(API_ENDPOINTS.APPOINTMENTS.FORCE_CHECK_IN(id), {
        method: 'POST',
        body: JSON.stringify({
          reason,
          ...(options?.locationId ? { locationId: options.locationId } : {}),
        }),
      }),
      getClientInfo(),
    ]);
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
      metadata: {
        checkInMethod: 'manual',
        forceFallbackEnabled: false,
        ...(options?.locationId ? { locationId: options.locationId } : {}),
      },
    });

    revalidateCache('appointments');
    revalidateCache('queue');
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to force check in appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to force check in appointment' };
  }
}

/**
 * Reschedule appointment: PATCH /appointments/:id/reschedule with `{ newDate, newTime }`
 * (roles PATIENT, DOCTOR, ASSISTANT_DOCTOR, NURSE, RECEPTIONIST, CLINIC_ADMIN). The
 * backend does not store a reschedule reason; `reason` is kept in the web audit log.
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

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id), {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
      getClientInfo(),
    ]);
    const rejectedReschedule = readRejectedOutcome(appointment);
    if (rejectedReschedule) {
      return { success: false, error: rejectedReschedule };
    }
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

    const [{ data: result }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi(API_ENDPOINTS.APPOINTMENTS.VIDEO_REJECT_PROPOSAL(id), {
        method: 'POST',
        body: JSON.stringify(validatedData)
      }),
      getClientInfo(),
    ]);
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
  coordinates?: { lat: number; lng: number };
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const validatedData = scanQRSchema.parse(data);
    const payload = {
      qrCode: validatedData.code,
      ...(validatedData.locationId ? { locationId: validatedData.locationId } : {}),
      ...(validatedData.appointmentId ? { appointmentId: validatedData.appointmentId } : {}),
      ...(validatedData.coordinates ? { coordinates: validatedData.coordinates } : {}),
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

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.REASSIGN_DOCTOR(id),
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
      getClientInfo(),
    ]);
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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

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
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const normalizedStatus = status.toUpperCase();
    const results = await Promise.allSettled(
      appointmentIds.map((appointmentId) =>
        authenticatedApi(API_ENDPOINTS.APPOINTMENTS.STATUS(appointmentId), {
          method: 'PATCH',
          body: JSON.stringify({ status: normalizedStatus }),
        })
      )
    );

    const failedIds = results
      .map((result, index) => (result.status === 'rejected' ? appointmentIds[index] : null))
      .filter((id): id is string => !!id);

    const updated = results.length - failedIds.length;
    const failedReasons = failedIds.reduce<Record<string, string>>((acc, appointmentId) => {
      acc[appointmentId] = 'Bulk update failed';
      return acc;
    }, {});
    revalidateCache('appointments');
    return { success: failedIds.length === 0, updated, failed: failedIds.length, failedIds, failedReasons };
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
 * ClinicId is resolved server-side from the session cookie to avoid stale client state.
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

    // Resolve clinicId server-side from session cookie.
    // This is authoritative — the cookie is always current after login/profile completion.
    // The optional `clinicId` parameter is used as a fallback for guest/public flows only.
    const session = await getServerSession();
    const serverClinicId = session?.user?.clinicId;
    const resolvedClinicId = serverClinicId || clinicId || APP_CONFIG.CLINIC.ID;

    const clinicHeaders = { 'X-Clinic-ID': resolvedClinicId };

    let data: DoctorAvailability;

    if (session?.user) {
      // Prefer authenticated: avoids @Public() guard chain (JwtAuthGuard → ProfileCompletionGuard)
      // rejecting requests that have no token during booking.
      const result = await authenticatedApi<DoctorAvailability>(url, {
        headers: clinicHeaders,
        cache: 'no-store',
      });
      data = result.data;
    } else {
      // Guest/public fallback — use publicApi so no auth header is sent.
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
export async function getUserUpcomingAppointments(filters?: { clinicId?: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const result = await getMyAppointments({
      ...(filters?.clinicId ? { clinicId: filters.clinicId } : {}),
      limit: 100,
    });

    if (!result.success) {
      return result;
    }

    const now = new Date();
    const appointments = Array.isArray(result.appointments)
      ? (result.appointments as unknown as Array<Record<string, unknown>>).filter(appointment => {
          const status = String(appointment.status || '').toUpperCase();
          if (['CANCELLED', 'COMPLETED', 'NO_SHOW', 'EXPIRED'].includes(status)) {
            return false;
          }

          const dateValue =
            typeof appointment.appointmentDate === 'string'
              ? appointment.appointmentDate
              : typeof appointment.date === 'string' && typeof appointment.time === 'string'
                ? `${appointment.date}T${appointment.time}`
                : typeof appointment.date === 'string'
                  ? appointment.date
                  : undefined;
          const appointmentDate = dateValue ? new Date(dateValue) : null;

          return !appointmentDate || Number.isNaN(appointmentDate.getTime()) || appointmentDate >= now;
        })
      : [];

    return { success: true, appointments };
  } catch (error) {
    logger.error('Failed to get upcoming appointments', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch upcoming appointments' };
  }
}

// ===== DOCTOR DAILY SUMMARY =====

const triggerSummarySchema = z.object({
  dateKey: z.string().optional(),
});

type TriggerSummaryResponse = {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  todayKey: string;
  enqueuedCount: number;
  skipCount: number;
  totalDoctors: number;
  message?: string;
};

/**
 * Manually trigger doctor daily appointment summary.
 * Requires SUPER_ADMIN or CLINIC_ADMIN role (enforced by backend).
 */
export async function triggerDoctorDailySummary(input: { dateKey?: string }): Promise<TriggerSummaryResponse> {
  try {
    const parsed = triggerSummarySchema.parse(input);

    const session = await getServerSession();
    if (!session?.user?.id) {
      return { success: false, todayKey: '', enqueuedCount: 0, skipCount: 0, totalDoctors: 0, message: 'Unauthorized' };
    }

    const response = await authenticatedApi<TriggerSummaryResponse>(
      API_ENDPOINTS.APPOINTMENTS.SUMMARY_TRIGGER,
      {
        method: 'POST',
        body: JSON.stringify(parsed),
      }
    );

    if (response.status >= 200 && response.status < 300) {
      revalidatePath('/dashboard');
      return response.data as TriggerSummaryResponse;
    }

    return { success: false, todayKey: '', enqueuedCount: 0, skipCount: 0, totalDoctors: 0, message: 'Failed to trigger summary' };
  } catch (error) {
    const message = isApiError(error) ? error.message : 'Something went wrong';
    logger.error('Failed to trigger doctor daily summary', error instanceof Error ? error : new Error(String(error)));
    return { success: false, todayKey: '', enqueuedCount: 0, skipCount: 0, totalDoctors: 0, message };
  }
}

// ===== VIDEO APPOINTMENTS =====

export async function proposeVideoAppointment(data: {
  patientId: string;
  doctorId: string;
  clinicId?: string;
  locationId?: string;
  duration: number;
  treatmentType?: string;
  proposedSlots: Array<{ date: string; time: string }>;
  notes?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const payload = {
      ...data,
      clinicId: data.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID,
    };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.VIDEO_PROPOSE, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'VIDEO_APPOINTMENT_PROPOSED',
      resource: 'APPOINTMENT',
      resourceId: appointment?.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: payload,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, appointment: normalizeAppointment(appointment) };
  } catch (error) {
    logger.error('Failed to propose video appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to propose video appointment' };
  }
}

export async function confirmVideoSlot(
  id: string,
  data: { confirmedSlotIndex: number }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.VIDEO_CONFIRM_SLOT(id), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'VIDEO_APPOINTMENT_SLOT_CONFIRMED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: data,
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');

    return { success: true, appointment: normalizeAppointment(appointment) };
  } catch (error) {
    logger.error('Failed to confirm video slot', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm video slot' };
  }
}

export async function confirmFinalVideoSlot(
  id: string,
  data: {
    confirmedSlotIndex?: number;
    date?: string;
    time?: string;
    reason?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.VIDEO_CONFIRM_FINAL_SLOT(id), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'VIDEO_APPOINTMENT_FINAL_SLOT_CONFIRMED',
      resource: 'APPOINTMENT',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: data,
    });

    revalidatePath(`/dashboard/appointments/${id}`);
    revalidateCache('appointments');

    return { success: true, appointment: normalizeAppointment(appointment) };
  } catch (error) {
    logger.error('Failed to confirm final video slot', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to confirm final video slot' };
  }
}

// ===== NO-SHOW =====

export async function checkNoShow(data?: {
  checkDaysBefore?: number;
  checkStatuses?: string[];
  sendPatientNotifications?: boolean;
  clinicId?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const payload = {
      ...data,
      clinicId: data?.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID,
    };

    const result = await authenticatedApi<{
      totalChecked: number;
      cancelled: number;
      failed: number;
      details: Array<{
        appointmentId: string;
        patientId: string;
        doctorId: string;
        appointmentDate: string;
        reason: string;
      }>;
    }>(API_ENDPOINTS.APPOINTMENTS.NO_SHOW_CHECK, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    revalidateCache('appointments');
    revalidateCache('queue');

    return { success: true, ...result.data };
  } catch (error) {
    logger.error('Failed to check no-show', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check no-show' };
  }
}

// ===== FOLLOW-UP PLANS =====

export async function getPatientFollowUpPlans(
  patientId: string,
  filters?: { status?: string; clinicId?: string }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);

    const resolvedClinicId = filters?.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID;
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.APPOINTMENTS.PATIENT_FOLLOW_UP_PLANS(patientId)}?${queryString}`
      : API_ENDPOINTS.APPOINTMENTS.PATIENT_FOLLOW_UP_PLANS(patientId);

    const { data } = await authenticatedApi<FollowUpPlan[]>(endpoint, {
      ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
      cache: 'no-store',
    });

    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    logger.error('Failed to get patient follow-up plans', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch patient follow-up plans' };
  }
}

export async function scheduleFollowUpFromPlan(
  followUpPlanId: string,
  data: { appointmentDate: string; doctorId?: string; locationId?: string }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data: appointment }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<Appointment>(API_ENDPOINTS.APPOINTMENTS.FOLLOW_UP_PLAN_SCHEDULE(followUpPlanId), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'FOLLOW_UP_APPOINTMENT_SCHEDULED',
      resource: 'FOLLOW_UP_PLAN',
      resourceId: followUpPlanId,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: { followUpPlanId, ...data },
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, appointment: normalizeAppointment(appointment) };
  } catch (error) {
    logger.error('Failed to schedule follow-up from plan', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to schedule follow-up' };
  }
}

export async function updateFollowUpPlan(
  id: string,
  data: {
    followUpType?: string;
    scheduledFor?: string;
    daysAfter?: number;
    priority?: string;
    instructions?: string;
    medications?: string[];
    tests?: string[];
    restrictions?: string[];
    notes?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data: plan }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<FollowUpPlan>(API_ENDPOINTS.APPOINTMENTS.FOLLOW_UP_PLAN_UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'FOLLOW_UP_PLAN_UPDATED',
      resource: 'FOLLOW_UP_PLAN',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: data,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, data: plan };
  } catch (error) {
    logger.error('Failed to update follow-up plan', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update follow-up plan' };
  }
}

export async function cancelFollowUpPlan(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<{ message: string }>(API_ENDPOINTS.APPOINTMENTS.FOLLOW_UP_PLAN_DELETE(id), {
        method: 'DELETE',
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'FOLLOW_UP_PLAN_CANCELLED',
      resource: 'FOLLOW_UP_PLAN',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, ...data };
  } catch (error) {
    logger.error('Failed to cancel follow-up plan', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel follow-up plan' };
  }
}

// ===== RECURRING SERIES =====

export async function createRecurringSeries(data: {
  templateId: string;
  patientId: string;
  startDate: string;
  endDate?: string;
  clinicId?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const payload = {
      ...data,
      clinicId: data.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID,
    };

    const [{ data: series }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<RecurringAppointmentSeries>(API_ENDPOINTS.APPOINTMENTS.RECURRING_CREATE, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'RECURRING_SERIES_CREATED',
      resource: 'RECURRING_SERIES',
      resourceId: series?.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: payload,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, data: series };
  } catch (error) {
    logger.error('Failed to create recurring series', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create recurring series' };
  }
}

export async function getRecurringSeries(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const { data } = await authenticatedApi<RecurringAppointmentSeries>(API_ENDPOINTS.APPOINTMENTS.RECURRING_GET(id), {
      cache: 'no-store',
    });

    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get recurring series', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch recurring series' };
  }
}

export async function updateRecurringSeries(
  id: string,
  data: {
    templateId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data: series }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<RecurringAppointmentSeries>(API_ENDPOINTS.APPOINTMENTS.RECURRING_UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'RECURRING_SERIES_UPDATED',
      resource: 'RECURRING_SERIES',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
      metadata: data,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, data: series };
  } catch (error) {
    logger.error('Failed to update recurring series', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update recurring series' };
  }
}

export async function cancelRecurringSeries(id: string) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const [{ data }, { ipAddress, userAgent }] = await Promise.all([
      authenticatedApi<{ message: string }>(API_ENDPOINTS.APPOINTMENTS.RECURRING_DELETE(id), {
        method: 'DELETE',
      }),
      getClientInfo(),
    ]);

    await auditLog({
      userId: session.user.id,
      action: 'RECURRING_SERIES_CANCELLED',
      resource: 'RECURRING_SERIES',
      resourceId: id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress,
      userAgent,
      sessionId: session.session_id,
    });

    revalidatePath('/dashboard/appointments');
    revalidateCache('appointments');

    return { success: true, ...data };
  } catch (error) {
    logger.error('Failed to cancel recurring series', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel recurring series' };
  }
}

// ===== ANALYTICS =====

export async function getCheckInPatterns(filters: {
  from: string;
  to: string;
  locationId?: string;
  clinicId?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const queryParams = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });

    if (filters.locationId) {
      queryParams.append('locationId', filters.locationId);
    }

    const resolvedClinicId = filters.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID;
    const endpoint = `${API_ENDPOINTS.APPOINTMENTS.ANALYTICS_CHECK_IN_PATTERNS}?${queryParams.toString()}`;

    const { data } = await authenticatedApi<unknown>(endpoint, {
      ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
      cache: 'no-store',
    });

    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get check-in patterns', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch check-in patterns' };
  }
}

export async function getNoShowCorrelation(filters: {
  from: string;
  to: string;
  locationId?: string;
  clinicId?: string;
}) {
  try {
    const session = await getServerSession();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const queryParams = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });

    if (filters.locationId) {
      queryParams.append('locationId', filters.locationId);
    }

    const resolvedClinicId = filters.clinicId || session.user.clinicId || APP_CONFIG.CLINIC.ID;
    const endpoint = `${API_ENDPOINTS.APPOINTMENTS.ANALYTICS_NO_SHOW_CORRELATION}?${queryParams.toString()}`;

    const { data } = await authenticatedApi<unknown>(endpoint, {
      ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
      cache: 'no-store',
    });

    return { success: true, data };
  } catch (error) {
    logger.error('Failed to get no-show correlation', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to fetch no-show correlation' };
  }
}

