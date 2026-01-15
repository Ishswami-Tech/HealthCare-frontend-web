/**
 * EHR Clinic Hooks
 * Handles clinic-wide EHR features (analytics, search, alerts)
 */

import { useQueryData } from '../core/useQueryData';
import {
  getComprehensiveEHR,
  getClinicPatientRecords,
  getClinicEHRAnalytics,
  getClinicPatientSummary,
  searchClinicEHRRecords,
  getClinicCriticalAlerts,
} from '@/lib/actions/ehr-clinic.server';

/**
 * Hook to get comprehensive EHR for a user
 */
export const useComprehensiveEHR = (userId: string) => {
  return useQueryData(
    ['ehrClinic', 'comprehensive', userId],
    async () => {
      return await getComprehensiveEHR(userId);
    },
    { enabled: !!userId }
  );
};

/**
 * Hook to get clinic patient records
 */
export const useClinicPatientRecords = (
  clinicId: string,
  filters?: {
    page?: number;
    limit?: number;
    search?: string;
  }
) => {
  return useQueryData(
    ['ehrClinic', 'patientRecords', clinicId, filters],
    async () => {
      return await getClinicPatientRecords(clinicId, filters);
    },
    { enabled: !!clinicId }
  );
};

/**
 * Hook to get clinic EHR analytics
 */
export const useClinicEHRAnalytics = (clinicId: string, period?: 'day' | 'week' | 'month' | 'year') => {
  return useQueryData(
    ['ehrClinic', 'analytics', clinicId, period],
    async () => {
      return await getClinicEHRAnalytics(clinicId, period);
    },
    { enabled: !!clinicId }
  );
};

/**
 * Hook to get clinic patient summary
 */
export const useClinicPatientSummary = (
  clinicId: string,
  filters?: {
    page?: number;
    limit?: number;
  }
) => {
  return useQueryData(
    ['ehrClinic', 'patientSummary', clinicId, filters],
    async () => {
      return await getClinicPatientSummary(clinicId, filters);
    },
    { enabled: !!clinicId }
  );
};

/**
 * Hook to search clinic EHR records
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
  return useQueryData(
    ['ehrClinic', 'search', clinicId, query, filters],
    async () => {
      return await searchClinicEHRRecords(clinicId, query, filters);
    },
    { enabled: !!clinicId && !!query }
  );
};

/**
 * Hook to get clinic critical alerts
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
  return useQueryData(
    ['ehrClinic', 'criticalAlerts', clinicId, filters],
    async () => {
      return await getClinicCriticalAlerts(clinicId, filters);
    },
    { enabled: !!clinicId }
  );
};



