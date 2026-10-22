'use server';

import { authenticatedApi } from './auth.server';
import {
  actionSuccess,
  caughtFailure,
  clinicHeaders,
  resolveClinicContext,
  statusFailure,
  type ActionFailure,
} from './_shared';
import { API_ENDPOINTS } from '../config/config';
import type {
  BookingLocation,
  CheckInFailureCode,
  InPersonCheckInRequest,
  InPersonCheckInResult,
  InPersonDeskBoard,
  InPersonVisit,
  InPersonWalkInRequest,
  InPersonWalkInResult,
  WalkInNextAvailable,
} from '@/types/in-person.types';

/**
 * In-person flow V2 (backend `InPersonController`, API_CONTRACT "In-person flow V2"):
 *   GET  in-person/locations?lat&lng     booking: locations, nearest first
 *   GET  in-person/me/today              patient: today's in-person visits (stage, token, ETA)
 *   GET  in-person/appointments/:id      one visit (live queue / you're next polling)
 *   POST in-person/check-in              patient QR scan | reception one-click (same endpoint)
 *   GET  in-person/desk                  reception: the location's appointments today
 *   POST in-person/walk-in               reception: walk-in visit now + check-in (contract 18.5)
 * Every action resolves the clinic from the session and returns a discriminated result.
 */

const KNOWN_CHECK_IN_CODES: ReadonlySet<string> = new Set<CheckInFailureCode>([
  'WRONG_LOCATION',
  'TOO_EARLY',
  'EXPIRED',
  'NOT_BOOKED',
  'VIDEO_VISIT',
  'NOT_TODAY',
  'INVALID_QR',
  'EXPIRED_QR',
  'LOCATION_INACTIVE',
  'QR_REQUIRED',
  'QR_NOT_FOR_STAFF',
  'APPOINTMENT_REQUIRED',
  'RECEPTION_WRONG_LOCATION',
  'LOCATION_REQUIRED',
  'TOO_FAR',
]);

export type CheckInActionFailure = ActionFailure & {
  reason: CheckInFailureCode;
  /** Walk-in on a full day: the next free slot the server offers (null when none in 14 days). */
  nextAvailable?: WalkInNextAvailable | null;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_TIME = /^\d{2}:\d{2}$/;

/** `details.nextAvailable` of a 409 walk-in refusal, only when well-formed. */
function readNextAvailable(error: unknown): WalkInNextAvailable | null | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const details = (error as { details?: unknown }).details;
  if (typeof details !== 'object' || details === null || !('nextAvailable' in details)) return undefined;
  const raw = (details as { nextAvailable?: unknown }).nextAvailable;
  if (raw === null) return null;
  if (typeof raw !== 'object') return undefined;
  const { date, time, doctorId, locationId } = raw as Record<string, unknown>;
  if (
    typeof date === 'string' &&
    DATE_KEY.test(date) &&
    typeof time === 'string' &&
    SLOT_TIME.test(time) &&
    typeof doctorId === 'string' &&
    doctorId &&
    typeof locationId === 'string' &&
    locationId
  ) {
    return { date, time, doctorId, locationId };
  }
  return undefined;
}

async function getJson<T>(endpoint: string, what: string): Promise<{ success: true; data: T } | ActionFailure> {
  try {
    const context = await resolveClinicContext(`load ${what}`);
    if (!context.success) return context;
    const { status, data } = await authenticatedApi<T>(endpoint, {
      headers: clinicHeaders(context.clinicId),
      omitClinicId: true,
      cache: 'no-store',
    });
    const failure = statusFailure(status, what);
    if (failure) return failure;
    return actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function fetchBookingLocations(
  origin?: { lat: number; lng: number } | null
): Promise<{ success: true; data: BookingLocation[] } | ActionFailure> {
  const query = origin ? `?lat=${encodeURIComponent(origin.lat)}&lng=${encodeURIComponent(origin.lng)}` : '';
  const result = await getJson<BookingLocation[]>(`${API_ENDPOINTS.IN_PERSON.LOCATIONS}${query}`, 'clinic locations');
  return result.success ? actionSuccess(Array.isArray(result.data) ? result.data : []) : result;
}

export async function fetchMyInPersonToday(): Promise<{ success: true; data: InPersonVisit[] } | ActionFailure> {
  const result = await getJson<InPersonVisit[]>(API_ENDPOINTS.IN_PERSON.MY_TODAY, 'your visits today');
  return result.success ? actionSuccess(Array.isArray(result.data) ? result.data : []) : result;
}

export async function fetchInPersonVisit(
  appointmentId: string
): Promise<{ success: true; data: InPersonVisit } | ActionFailure> {
  return getJson<InPersonVisit>(API_ENDPOINTS.IN_PERSON.VISIT(appointmentId), 'the visit');
}

export async function fetchInPersonDesk(
  params: { date?: string; locationId?: string; page?: number; limit?: number } = {}
): Promise<{ success: true; data: InPersonDeskBoard } | ActionFailure> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.locationId) search.set('locationId', params.locationId);
  // Optional paging: one page of visits; the day-wide counts and total come back either way.
  if (params.page !== undefined && Number.isInteger(params.page) && params.page >= 1) {
    search.set('page', String(params.page));
    if (params.limit !== undefined && Number.isInteger(params.limit) && params.limit >= 1) {
      search.set('limit', String(params.limit));
    }
  }
  const query = search.toString();
  return getJson<InPersonDeskBoard>(`${API_ENDPOINTS.IN_PERSON.DESK}${query ? `?${query}` : ''}`, 'the desk');
}

async function postJson<T>(endpoint: string, body: unknown, what: string): Promise<CheckInActionFailure | { success: true; data: T }> {
  try {
    const context = await resolveClinicContext(what);
    if (!context.success) return { ...context, reason: 'UNKNOWN' };
    const { data } = await authenticatedApi<T>(endpoint, {
      method: 'POST',
      headers: clinicHeaders(context.clinicId),
      omitClinicId: true,
      cache: 'no-store',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return actionSuccess(data);
  } catch (error) {
    const failure = caughtFailure(error);
    const raw =
      typeof error === 'object' && error !== null
        ? String((error as { backendCode?: unknown; code?: unknown }).backendCode ?? (error as { code?: unknown }).code ?? '')
        : '';
    const reason = (KNOWN_CHECK_IN_CODES.has(raw) ? raw : 'UNKNOWN') as CheckInFailureCode;
    const nextAvailable = readNextAvailable(error);
    return { ...failure, reason, ...(nextAvailable !== undefined ? { nextAvailable } : {}) };
  }
}

/** Walk-in at the desk: one call creates today's in-person visit (single doctor) and checks it in. */
export async function submitInPersonWalkIn(
  request: InPersonWalkInRequest
): Promise<{ success: true; data: InPersonWalkInResult } | CheckInActionFailure> {
  return postJson<InPersonWalkInResult>(API_ENDPOINTS.IN_PERSON.WALK_IN, request, 'add the walk-in');
}

/**
 * The one check-in call. A refusal comes back as `{ success: false, reason }` with the
 * backend's own message, so the screen can show the matching fix (wrong location, too early...).
 */
export async function submitInPersonCheckIn(
  request: InPersonCheckInRequest
): Promise<{ success: true; data: InPersonCheckInResult } | CheckInActionFailure> {
  try {
    const context = await resolveClinicContext('check in');
    if (!context.success) return { ...context, reason: 'UNKNOWN' };
    const { data } = await authenticatedApi<InPersonCheckInResult>(API_ENDPOINTS.IN_PERSON.CHECK_IN, {
      method: 'POST',
      headers: clinicHeaders(context.clinicId),
      omitClinicId: true,
      cache: 'no-store',
      body: JSON.stringify(request),
    });
    return actionSuccess(data);
  } catch (error) {
    const failure = caughtFailure(error);
    const raw =
      typeof error === 'object' && error !== null
        ? String((error as { backendCode?: unknown; code?: unknown }).backendCode ?? (error as { code?: unknown }).code ?? '')
        : '';
    const reason = (KNOWN_CHECK_IN_CODES.has(raw) ? raw : 'UNKNOWN') as CheckInFailureCode;
    return { ...failure, reason };
  }
}
