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
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.SEARCH(clinicId), { query, ...filters });
    },
    { enabled: !!clinicId && !!query, refetchInterval: isConnected ? false : 300_000 }
  );
};

/**
 * Hook to get clinic critical alerts
 * 🔒 clinicId is used for cache key only — server action auto-sources from session
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
      return await clinicApiClient.get(API_ENDPOINTS.EHR_CLINIC.CRITICAL_ALERTS(clinicId), filters);
    },
    { enabled: !!clinicId, refetchInterval: isConnected ? false : 120_000 }
  );
};
