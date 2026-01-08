/**
 * EHR Clinic Server Actions
 * Handles clinic-wide EHR features (analytics, search, alerts)
 */

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';
import { logger } from '@/lib/logger';

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
 */
export async function getClinicPatientRecords(clinicId: string, filters?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.PATIENT_RECORDS(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
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
 */
export async function getClinicEHRAnalytics(clinicId: string, period?: 'day' | 'week' | 'month' | 'year') {
  try {
    const params = period ? `?period=${period}` : '';
    const { data } = await authenticatedApi(`${API_ENDPOINTS.EHR_CLINIC.ANALYTICS(clinicId)}${params}`, {
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
 */
export async function getClinicPatientSummary(clinicId: string, filters?: {
  page?: number;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.PATIENT_SUMMARY(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
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
 */
export async function searchClinicEHRRecords(clinicId: string, query: string, filters?: {
  recordType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.recordType) params.append('recordType', filters.recordType);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const { data } = await authenticatedApi(`${API_ENDPOINTS.EHR_CLINIC.SEARCH(clinicId)}?${params.toString()}`, {
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
 */
export async function getClinicCriticalAlerts(clinicId: string, filters?: {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  resolved?: boolean;
  page?: number;
  limit?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.resolved !== undefined) params.append('resolved', filters.resolved.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const url = `${API_ENDPOINTS.EHR_CLINIC.CRITICAL_ALERTS(clinicId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const { data } = await authenticatedApi(url, {
      method: 'GET',
    });
    return data;
  } catch (error) {
    logger.error('Failed to get clinic critical alerts', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}



