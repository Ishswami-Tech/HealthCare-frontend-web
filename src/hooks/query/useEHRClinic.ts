/**
 * EHR Clinic Hooks
 * Handles clinic-wide EHR features (analytics, search, alerts)
 * 
 * 🔒 TENANT ISOLATION: clinicId is auto-sourced from the server session
 * in the server actions. These hooks still accept clinicId for cache key 
 * purposes and backward compatibility, but the actual API call uses the
 * session-validated clinicId.
 */

import { useQueryData } from '../core/useQueryData';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';

/**
 * Hook to get comprehensive EHR for a user
 */
export const useComprehensiveEHR = (userId: string) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'comprehensive', userId],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.COMPREHENSIVE(userId));
    },
    { enabled: !!userId, refetchInterval: isConnected ? false : 300_000 }
  );
};

/**
 * Hook to get clinic patient records
 * 🔒 clinicId is used for cache key only — server action auto-sources from session
 */
export const useClinicPatientRecords = (
  clinicId: string,
  filters?: {
    page?: number;
    limit?: number;
    search?: string;
  }
) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'patientRecords', clinicId, filters],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.PATIENT_RECORDS(clinicId), filters);
    },
    { enabled: !!clinicId, refetchInterval: isConnected ? false : 300_000 }
  );
};

/**
 * Hook to get clinic EHR analytics
 * 🔒 clinicId is used for cache key only — server action auto-sources from session
 */
export const useClinicEHRAnalytics = (clinicId: string, period?: 'day' | 'week' | 'month' | 'year') => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'analytics', clinicId, period],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.ANALYTICS(clinicId), { period });
    },
    { enabled: !!clinicId, refetchInterval: isConnected ? false : 600_000 }
  );
};

/**
 * Hook to get clinic patient summary
 * 🔒 clinicId is used for cache key only — server action auto-sources from session
 */
export const useClinicPatientSummary = (
  clinicId: string,
  filters?: {
    page?: number;
    limit?: number;
  }
) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'patientSummary', clinicId, filters],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.PATIENT_SUMMARY(clinicId), filters);
    },
    { enabled: !!clinicId, refetchInterval: isConnected ? false : 300_000 }
  );
};

/**
 * Hook to search clinic EHR records
 * 🔒 clinicId is used for cache key only — server action auto-sources from session
 */
export const useSearchClinicEHR = (
  clinicId: string,
  query: string,
  filters?: {
    recordType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }
) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'search', clinicId, query, filters],
    async () => {
      // GET /ehr/clinic/:clinicId/search reads `q` (the search text) and `types` (comma separated).
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.SEARCH(clinicId), {
        q: query,
        ...(filters?.recordType ? { types: filters.recordType } : {}),
      });
    },
    { enabled: !!clinicId && !!query, refetchInterval: isConnected ? false : 300_000 }
  );
};

type CriticalAlertRow = {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  message: string;
  severity: string;
  createdAt: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asRows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

const asText = (value: unknown): string =>
  typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);

/**
 * GET /ehr/clinic/:clinicId/alerts/critical answers
 * `{ clinicId, alerts: { severeAllergies: { count, patients[] }, criticalVitals: { count, readings[] } },
 *    totalCriticalAlerts }`.
 * The screens read a flat list of alerts, so the two groups are turned into one list here.
 */
function toCriticalAlertRows(payload: unknown): CriticalAlertRow[] {
  if (Array.isArray(payload)) return payload as CriticalAlertRow[];
  const alerts = asRecord(asRecord(payload).alerts);
  const allergies = asRows(asRecord(alerts.severeAllergies).patients).map((row, index) => ({
    id: `allergy-${asText(row.patientId)}-${index}`,
    patientId: asText(row.patientId),
    patientName: asText(row.patientName),
    type: 'Severe allergy',
    message: [asText(row.allergen), asText(row.reaction)].filter(Boolean).join(': '),
    severity: 'Critical',
    createdAt: asText(row.diagnosedDate),
  }));
  const vitals = asRows(asRecord(alerts.criticalVitals).readings).map((row, index) => ({
    id: `vital-${asText(row.patientId)}-${index}`,
    patientId: asText(row.patientId),
    patientName: asText(row.patientName),
    type: 'Critical vital',
    message: [asText(row.vitalType), asText(row.value)].filter(Boolean).join(': '),
    severity: 'Critical',
    createdAt: asText(row.recordedAt),
  }));
  return [...allergies, ...vitals];
}

/**
 * Hook to get clinic critical alerts (a flat list: severe allergies, then critical vitals).
 * Backend: GET /ehr/clinic/:clinicId/alerts/critical — DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST,
 * CLINIC_ADMIN, SUPER_ADMIN. `clinicId` must be the clinic of the request context. The route takes
 * no filters: `limit` is applied to the list here, `severity` / `resolved` / `page` are not used.
 */
export const useClinicCriticalAlerts = (
  clinicId: string,
  filters?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    resolved?: boolean;
    page?: number;
    limit?: number;
  }
) => {
  const { isConnected } = useWebSocketStatus();
  return useQueryData(
    ['ehrClinic', 'criticalAlerts', clinicId, filters],
    async () => {
      const response = await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.CRITICAL_ALERTS(clinicId));
      const rows = toCriticalAlertRows(response.data);
      const limit = typeof filters?.limit === 'number' && filters.limit > 0 ? filters.limit : undefined;
      return limit !== undefined ? rows.slice(0, limit) : rows;
    },
    { enabled: !!clinicId, refetchInterval: isConnected ? false : 120_000 }
  );
};
