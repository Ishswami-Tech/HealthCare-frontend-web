import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import { readCollection } from '@/lib/utils/collection-response';
import { isProfileCompletionAccessError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import type { Clinic, ClinicLocation, ClinicStats } from '@/types/clinic.types';

/**
 * Clinic reads made straight from the browser to the backend.
 *
 * The clinic query hooks used to call the matching server actions in `clinic.server.ts`. Every
 * call (first load, and a poll every 2-5 minutes while the socket is down) then ran a Vercel
 * Function. These do the same request with the browser's own token and keep each action's
 * result: a failed read gives an empty list or `null`, as before.
 */

function logReadFailure(what: string, error: unknown): void {
  logger.error(`Failed to get ${what}`, error instanceof Error ? error : new Error(String(error)));
}

export async function fetchClinics(): Promise<Clinic[]> {
  try {
    const response = await clinicApiClient.get<Clinic[]>(API_ENDPOINTS.CLINICS.GET_ALL);
    return response.data || [];
  } catch (error) {
    logReadFailure('clinics', error);
    return [];
  }
}

export async function fetchClinicById(id: string): Promise<Clinic | null> {
  try {
    const response = await clinicApiClient.get<Clinic>(API_ENDPOINTS.CLINICS.GET_BY_ID(id));
    return response.data ?? null;
  } catch (error) {
    logReadFailure('clinic by ID', error);
    return null;
  }
}

export async function fetchMyClinic(): Promise<Clinic | null> {
  try {
    const response = await clinicApiClient.get<Clinic>('/clinics/my-clinic');
    return response.data || null;
  } catch (error) {
    logReadFailure('current clinic', error);
    return null;
  }
}

export async function fetchClinicStats(clinicId: string): Promise<ClinicStats | null> {
  try {
    const response = await clinicApiClient.get<ClinicStats>(API_ENDPOINTS.CLINICS.STATS(clinicId));
    return response.data || null;
  } catch (error) {
    logReadFailure('clinic stats', error);
    return null;
  }
}

export async function fetchClinicLocations(
  clinicId: string,
  includeInactive = false
): Promise<ClinicLocation[]> {
  try {
    const response = await clinicApiClient.get<unknown>(
      API_ENDPOINTS.CLINIC_LOCATIONS.GET_ALL(clinicId),
      { includeInactive: includeInactive ? 'true' : 'false' },
      { clinicId, requireClinicId: true, cache: 'no-store' } as RequestInit
    );
    return readCollection<ClinicLocation>(response.data, 'locations');
  } catch (error) {
    logReadFailure('clinic locations', error);
    if (isProfileCompletionAccessError(error)) {
      throw new Error('PROFILE_INCOMPLETE');
    }
    return [];
  }
}
