'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { PatientDashboardSummaryResponse } from '@/types/patient-dashboard.types';

/**
 * Fetches the patient's dashboard summary in a single round-trip.
 *
 * Replaces what used to be 5-7 separate server actions on the patient
 * dashboard (appointments, vitals, prescriptions, comprehensive EHR,
 * invoices, payments). The backend endpoint fans out internally and
 * serves from a 60-second cache, so subsequent visits are sub-200ms.
 *
 * Mirrors the `getMyAppointments` server action shape so the consumer
 * hook can treat its return value the same way:
 *   - `success: true, data: <summary>` on 2xx
 *   - `success: false, code: 'PROFILE_INCOMPLETE'` on 403 with
 *     `profile_completion_required` marker
 *   - `success: false, code: 'UNAUTHENTICATED'` when no session
 *   - `success: false, code: 'CLINIC_CONTEXT_REQUIRED'` when no
 *     clinic id can be resolved (e.g. patient hasn't been linked yet)
 */
export async function fetchPatientDashboardSummary(): Promise<
  | { success: true; data: PatientDashboardSummaryResponse }
  | { success: false; error: string; code?: 'UNAUTHENTICATED' | 'CLINIC_CONTEXT_REQUIRED' | 'PROFILE_INCOMPLETE' | 'NETWORK' | 'UNKNOWN' }
> {
  try {
    const session = await getServerSession();
    const sessionUser = session?.user as
      | { clinicId?: string; primaryClinicId?: string; id?: string; sub?: string }
      | undefined;

    const userId = sessionUser?.id || sessionUser?.sub;
    if (!userId) {
      return {
        success: false,
        error: 'Not authenticated',
        code: 'UNAUTHENTICATED',
      };
    }

    const resolvedClinicId =
      sessionUser?.clinicId || sessionUser?.primaryClinicId;

    if (!resolvedClinicId) {
      return {
        success: false,
        error: 'Clinic context is required to load the dashboard',
        code: 'CLINIC_CONTEXT_REQUIRED',
      };
    }

    const { status, data } = await authenticatedApi<{
      // Backend returns the DTO directly (not wrapped in {data: ...})
      generatedAt: string;
      errors?: Record<string, string>;
      appointments?: unknown[];
      prescriptions?: unknown[];
      comprehensive?: unknown;
      invoices?: unknown[];
      payments?: unknown[];
    }>(API_ENDPOINTS.PATIENTS.DASHBOARD_SUMMARY, {
      headers: { 'X-Clinic-ID': resolvedClinicId },
      omitClinicId: true,
      cache: 'no-store',
    });

    if (status === 401) {
      return {
        success: false,
        error: 'Session expired. Please sign in again.',
        code: 'UNAUTHENTICATED',
      };
    }

    if (status === 403) {
      // Mirror getMyAppointments: the patient profile may not yet be
      // complete. Surface a stable code so the page can route to
      // profile completion without breaking the rest of the dashboard.
      const isProfileIncomplete =
        (data as unknown as { code?: string })?.code === 'PROFILE_INCOMPLETE' ||
        (data as unknown as { message?: string })?.message
          ?.toLowerCase()
          .includes('profile');
      if (isProfileIncomplete) {
        return {
          success: false,
          error: 'Please complete your profile to view the dashboard',
          code: 'PROFILE_INCOMPLETE',
        };
      }
      return {
        success: false,
        error: 'Access denied',
        code: 'UNKNOWN',
      };
    }

    if (status >= 400) {
      return {
        success: false,
        error: `Dashboard summary request failed with status ${status}`,
        code: 'NETWORK',
      };
    }

    return { success: true, data: data as PatientDashboardSummaryResponse };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      code: 'NETWORK',
    };
  }
}
