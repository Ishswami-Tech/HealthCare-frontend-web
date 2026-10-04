'use server';

import { authenticatedApi, getServerSession } from './auth.server';

/**
 * A patient's own place in today's clinic queue.
 *
 * Backend route (`QueueController`):
 *   GET queue/me                      the caller's live queue entry for today, or `null`
 *   GET queue/me?appointmentId=<id>   the same, for one visit
 *
 * Patients are not allowed the staff queue list (`GET queue`), so this is the only way a
 * patient learns their position. The action mirrors `fetchHealthLibraryPosts`: it resolves the
 * clinic from the session, sends it as `X-Clinic-ID`, and returns a discriminated result
 * instead of throwing.
 */

const MY_QUEUE_ENDPOINT = '/queue/me';

/** Mirrors the backend `MyQueuePosition`. Only what the route returns — no other patients. */
export interface MyQueuePosition {
  appointmentId: string;
  doctorId: string;
  locationId: string | null;
  /** Upper case queue status, for example WAITING or IN_PROGRESS. */
  status: string;
  /** 1-based position in this doctor's live queue. */
  position: number;
  patientsAhead: number;
  totalInQueue: number;
  /** True when someone in this queue is with the doctor right now. */
  nowServing: boolean;
  /** Minutes. 0 when the patient is with the doctor. */
  estimatedWaitTime: number;
  checkedInAt: string | null;
}

export type PatientQueueErrorCode =
  | 'UNAUTHENTICATED'
  | 'CLINIC_CONTEXT_REQUIRED'
  | 'FORBIDDEN'
  | 'NETWORK'
  | 'UNKNOWN';

type PatientQueueFailure = { success: false; error: string; code?: PatientQueueErrorCode };

type ClinicContext = { clinicId: string } | PatientQueueFailure;

async function resolveClinicContext(): Promise<ClinicContext> {
  const session = await getServerSession();
  const sessionUser = session?.user as
    | { clinicId?: string; primaryClinicId?: string; id?: string; sub?: string }
    | undefined;

  const userId = sessionUser?.id || sessionUser?.sub;
  if (!userId) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };
  }

  const clinicId = sessionUser?.clinicId || sessionUser?.primaryClinicId;
  if (!clinicId) {
    return {
      success: false,
      error: 'Clinic context is required to load your queue position',
      code: 'CLINIC_CONTEXT_REQUIRED',
    };
  }

  return { clinicId };
}

function statusFailure(status: number): PatientQueueFailure | null {
  if (status === 401) {
    return { success: false, error: 'Session expired. Please sign in again.', code: 'UNAUTHENTICATED' };
  }
  if (status === 403) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }
  if (status >= 400) {
    return { success: false, error: `Queue position request failed with status ${status}`, code: 'NETWORK' };
  }
  return null;
}

function caughtFailure(error: unknown): PatientQueueFailure {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : NaN;
  const message = error instanceof Error ? error.message : 'Unknown error';
  if (statusCode === 401) {
    return { success: false, error: message, code: 'UNAUTHENTICATED' };
  }
  if (statusCode === 403) {
    return { success: false, error: message, code: 'FORBIDDEN' };
  }
  return { success: false, error: message, code: 'NETWORK' };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function wholeNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

/**
 * The route answers `{ success, data: MyQueuePosition | null, meta }`. The API client lifts
 * `data` out of that envelope; this also accepts the envelope itself, so either shape works.
 */
function readQueuePosition(payload: unknown): MyQueuePosition | null {
  const outer = asRecord(payload);
  if (!outer) return null;
  const entry = typeof outer.appointmentId === 'string' ? outer : asRecord(outer.data);
  if (!entry || typeof entry.appointmentId !== 'string' || !entry.appointmentId) return null;

  const patientsAhead = wholeNumber(entry.patientsAhead, 0);
  const position = Math.max(1, wholeNumber(entry.position, patientsAhead + 1));
  return {
    appointmentId: entry.appointmentId,
    doctorId: typeof entry.doctorId === 'string' ? entry.doctorId : '',
    locationId: typeof entry.locationId === 'string' && entry.locationId ? entry.locationId : null,
    status: String(entry.status || 'WAITING').toUpperCase(),
    position,
    patientsAhead,
    totalInQueue: Math.max(position, wholeNumber(entry.totalInQueue, position)),
    nowServing: entry.nowServing === true,
    estimatedWaitTime: wholeNumber(entry.estimatedWaitTime, 0),
    checkedInAt: typeof entry.checkedInAt === 'string' && entry.checkedInAt ? entry.checkedInAt : null,
  };
}

/**
 * Loads the signed-in patient's own queue entry for today.
 * `data` is `null` when the patient is not in a queue (not checked in, or the visit is over).
 */
export async function fetchMyQueuePosition(
  appointmentId?: string
): Promise<{ success: true; data: MyQueuePosition | null } | PatientQueueFailure> {
  try {
    const context = await resolveClinicContext();
    if (!('clinicId' in context)) {
      return context;
    }

    const visitId = String(appointmentId || '').trim();
    const endpoint = visitId
      ? `${MY_QUEUE_ENDPOINT}?appointmentId=${encodeURIComponent(visitId)}`
      : MY_QUEUE_ENDPOINT;

    const { status, data } = await authenticatedApi<unknown>(endpoint, {
      headers: { 'X-Clinic-ID': context.clinicId },
      omitClinicId: true,
      cache: 'no-store',
    });

    const failure = statusFailure(status);
    if (failure) {
      return failure;
    }

    return { success: true, data: readQueuePosition(data) };
  } catch (error) {
    return caughtFailure(error);
  }
}
