'use server';

/**
 * EHR Clinic Server Actions
 * Handles clinic-wide EHR features (analytics, search, alerts)
 * 
 * 🔒 TENANT ISOLATION: clinicId is sourced from the server session cookie,
 * NOT from function parameters. This prevents any frontend component from
 * passing an arbitrary clinicId. The backend ClinicGuard also validates
 * the URL param against the guard context as a second layer of defense.
 */

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { APP_CONFIG } from '@/lib/config/config';
import { logger } from '@/lib/utils/logger';

/**
 * 🔒 Get the validated clinicId from server session
 * Falls back to APP_CONFIG.CLINIC.ID for single-clinic deployments
 */
async function getSessionClinicId(): Promise<string> {
  const session = await getServerSession();
  const clinicId = session?.user?.clinicId || APP_CONFIG.CLINIC.ID;
  if (!clinicId) {
    throw new Error('No clinic context available. Please log in again.');
  }
  return clinicId;
}

/**
 * Get comprehensive EHR for a user
 */
export async function getComprehensiveEHR(userId: string) {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.EHR_CLINIC.COMPREHENSIVE(userId), {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get comprehensive EHR', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get all patient records for a clinic
 * 🔒 clinicId is auto-sourced from session — callers cannot override
 */
export async function getClinicPatientRecords(clinicId?: string, filters?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    // 🔒 TENANT ISOLATION: Use session clinicId, ignore parameter
    const validatedClinicId = await getSessionClinicId();
    if (clinicId && clinicId !== validatedClinicId) {
      logger.warn('getClinicPatientRecords: Caller-supplied clinicId differs from session. Using session value.', {
        supplied: clinicId,
        session: validatedClinicId,
      });
    }

    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.PATIENT_RECORDS(validatedClinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(url, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic patient records', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get clinic EHR analytics
 * 🔒 clinicId is auto-sourced from session — callers cannot override
 */
export async function getClinicEHRAnalytics(clinicId?: string, period?: 'day' | 'week' | 'month' | 'year') {
  try {
    // 🔒 TENANT ISOLATION: Use session clinicId, ignore parameter
    const validatedClinicId = await getSessionClinicId();
    if (clinicId && clinicId !== validatedClinicId) {
      logger.warn('getClinicEHRAnalytics: Caller-supplied clinicId differs from session. Using session value.', {
        supplied: clinicId,
        session: validatedClinicId,
      });
    }

    const params = period ? `?period=${period}` : '';
    const { data } = await authenticatedApi(`${API_ENDPOINTS.EHR_CLINIC.ANALYTICS(validatedClinicId)}${params}`, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic EHR analytics', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get patient summary for clinic
 * 🔒 clinicId is auto-sourced from session — callers cannot override
 */
export async function getClinicPatientSummary(clinicId?: string, filters?: {
  page?: number;
  limit?: number;
}) {
  try {
    // 🔒 TENANT ISOLATION: Use session clinicId, ignore parameter
    const validatedClinicId = await getSessionClinicId();
    if (clinicId && clinicId !== validatedClinicId) {
      logger.warn('getClinicPatientSummary: Caller-supplied clinicId differs from session. Using session value.', {
        supplied: clinicId,
        session: validatedClinicId,
      });
    }

    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.PATIENT_SUMMARY(validatedClinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(url, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic patient summary', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Search clinic EHR records
 * 🔒 clinicId is auto-sourced from session — callers cannot override
 */
export async function searchClinicEHRRecords(clinicId?: string, query?: string, filters?: {
  recordType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  try {
    // 🔒 TENANT ISOLATION: Use session clinicId, ignore parameter
    const validatedClinicId = await getSessionClinicId();
    if (clinicId && clinicId !== validatedClinicId) {
      logger.warn('searchClinicEHRRecords: Caller-supplied clinicId differs from session. Using session value.', {
        supplied: clinicId,
        session: validatedClinicId,
      });
    }

    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (filters?.recordType) params.append('recordType', filters.recordType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const { data } = await authenticatedApi(`${API_ENDPOINTS.EHR_CLINIC.SEARCH(validatedClinicId)}?${params.toString()}`, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to search clinic EHR records', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get critical alerts for clinic
 * 🔒 clinicId is auto-sourced from session — callers cannot override
 */
export async function getClinicCriticalAlerts(clinicId?: string, filters?: {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    // 🔒 TENANT ISOLATION: Use session clinicId, ignore parameter
    const validatedClinicId = await getSessionClinicId();
    if (clinicId && clinicId !== validatedClinicId) {
      logger.warn('getClinicCriticalAlerts: Caller-supplied clinicId differs from session. Using session value.', {
        supplied: clinicId,
        session: validatedClinicId,
      });
    }

    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.resolved !== undefined) params.append('resolved', filters.resolved.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.CRITICAL_ALERTS(validatedClinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(url, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic critical alerts', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
