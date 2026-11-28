'use server';

import { API_ENDPOINTS } from '../config/config';
import { clinicOpsRequest, withQuery } from './_ops-request';
import type { ActionResult } from './_shared';
import type {
  CheckInAttempt,
  CheckInLogFilters,
  CheckInResolution,
  CheckInSummary,
  LocationQr,
} from '@/types/clinic-admin-ops.types';

/**
 * Location QR and the check-in log (CaLocationQr, CaQrPrint, CaQrRegenerate, CaCheckInLog,
 * CaFailedCheckIns). The QR routes take the CHECK-IN location id (`CheckInLocation.id`, see
 * `getCheckInLocations` in appointments.server.ts); the log uses the clinic location id.
 *
 * Check-in itself (patient QR scan and staff one-click) is `submitInPersonCheckIn` in
 * in-person.server.ts (POST /in-person/check-in); do not add another check-in action here.
 */

const OPS = API_ENDPOINTS.CLINIC_ADMIN_OPS;

export async function fetchLocationQr(checkInLocationId: string): Promise<ActionResult<LocationQr>> {
  return clinicOpsRequest<LocationQr>(withQuery(OPS.LOCATION_QR(checkInLocationId), { format: 'base64' }), {
    what: 'Location QR',
  });
}

export async function regenerateLocationQr(checkInLocationId: string, reason?: string): Promise<ActionResult<LocationQr>> {
  return clinicOpsRequest<LocationQr>(OPS.LOCATION_QR_REGENERATE(checkInLocationId), {
    method: 'POST',
    body: reason ? { reason } : {},
    what: 'QR regeneration',
  });
}

export async function fetchCheckInLog(filters: CheckInLogFilters = {}): Promise<ActionResult<CheckInAttempt[]>> {
  return clinicOpsRequest<CheckInAttempt[]>(withQuery(OPS.CHECK_IN_LOG, { ...filters }), { what: 'Check-in log' });
}

/** Failed scans of a day. `includeResolved` also returns handled / ignored ones (for the Resolved and Ignored tabs). */
export async function fetchFailedCheckIns(
  date?: string,
  options: { includeResolved?: boolean } = {}
): Promise<ActionResult<CheckInAttempt[]>> {
  return clinicOpsRequest<CheckInAttempt[]>(
    withQuery(OPS.CHECK_IN_FAILED, { date, ...(options.includeResolved ? { includeResolved: true } : {}) }),
    { what: 'Failed check-ins' }
  );
}

export async function fetchCheckInSummary(date?: string): Promise<ActionResult<CheckInSummary>> {
  return clinicOpsRequest<CheckInSummary>(withQuery(OPS.CHECK_IN_SUMMARY, { date }), { what: 'Check-in summary' });
}

export async function resolveCheckInAttempt(
  attemptId: string,
  resolution: CheckInResolution,
  note?: string
): Promise<ActionResult<CheckInAttempt>> {
  return clinicOpsRequest<CheckInAttempt>(OPS.CHECK_IN_RESOLVE(attemptId), {
    method: 'POST',
    body: { resolution, ...(note ? { note } : {}) },
    what: 'Check-in resolution',
  });
}
