'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== ANALYTICS & REPORTING =====

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month', clinicId?: string) {
  const params = new URLSearchParams({ period });
  if (clinicId) params.append('clinicId', clinicId);
  
  const { data } = await authenticatedApi(`${API_ENDPOINTS.ANALYTICS.DASHBOARD}?${params.toString()}`);
  return data;
}

/**
 * Get appointment analytics
 */
export async function getAppointmentAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  clinicId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.APPOINTMENTS}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get patient analytics
 */
export async function getPatientAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  ageGroup?: string;
  gender?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.PATIENTS}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  serviceId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.REVENUE}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get doctor performance analytics
 */
export async function getDoctorPerformanceAnalytics(doctorId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const params = new URLSearchParams({ period });
  if (doctorId) params.append('doctorId', doctorId);
  
  const { data } = await authenticatedApi(`${API_ENDPOINTS.ANALYTICS.DOCTORS_PERFORMANCE}?${params.toString()}`);
  return data;
}

/**
 * Get clinic performance analytics
 */
export async function getClinicPerformanceAnalytics(clinicId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const params = new URLSearchParams({ period });
  if (clinicId) params.append('clinicId', clinicId);
  
  const { data } = await authenticatedApi(`${API_ENDPOINTS.ANALYTICS.CLINICS_PERFORMANCE}?${params.toString()}`);
  return data;
}

/**
 * Get service utilization analytics
 */
export async function getServiceUtilizationAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  serviceCategory?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.SERVICES_UTILIZATION}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get wait time analytics
 */
export async function getWaitTimeAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  doctorId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.WAIT_TIMES}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get patient satisfaction analytics
 */
export async function getPatientSatisfactionAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  doctorId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  
  const endpoint = `${API_ENDPOINTS.ANALYTICS.SATISFACTION}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

// ===== REPORTS GENERATION =====

/**
 * Generate appointment report
 */
export async function generateAppointmentReport(filters: {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  clinicId?: string;
  doctorId?: string;
  status?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.APPOINTMENTS, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Generate patient report
 */
export async function generatePatientReport(filters: {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  clinicId?: string;
  includeDetails?: boolean;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.PATIENTS, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Generate revenue report
 */
export async function generateRevenueReport(filters: {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  clinicId?: string;
  groupBy?: 'day' | 'week' | 'month';
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.REVENUE, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Generate doctor performance report
 */
export async function generateDoctorPerformanceReport(filters: {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  doctorId?: string;
  clinicId?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.DOCTORS_PERFORMANCE, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Generate clinic summary report
 */
export async function generateClinicSummaryReport(filters: {
  startDate: string;
  endDate: string;
  format: 'pdf' | 'excel' | 'csv';
  clinicId?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.CLINICS_SUMMARY, {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Get report history
 */
export async function getReportHistory(filters?: {
  type?: string;
  status?: 'pending' | 'completed' | 'failed';
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }
  
  const endpoint = `${API_ENDPOINTS.REPORTS.HISTORY}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Download report
 */
export async function downloadReport(reportId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.DOWNLOAD(reportId));
  return data;
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.REPORTS.DELETE(reportId), {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get custom analytics
 */
export async function getCustomAnalytics(query: {
  metrics: string[];
  dimensions: string[];
  filters?: Record<string, any>;
  startDate: string;
  endDate: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.ANALYTICS.CUSTOM, {
    method: 'POST',
    body: JSON.stringify(query),
  });
  return data;
}

/**
 * Save custom analytics query
 */
export async function saveCustomAnalyticsQuery(queryData: {
  name: string;
  description?: string;
  query: {
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, any>;
  };
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.ANALYTICS.CUSTOM_QUERIES.CREATE, {
    method: 'POST',
    body: JSON.stringify(queryData),
  });
  return data;
}

/**
 * Get saved analytics queries
 */
export async function getSavedAnalyticsQueries() {
  const { data } = await authenticatedApi(API_ENDPOINTS.ANALYTICS.CUSTOM_QUERIES.GET_ALL);
  return data;
}

/**
 * Get queue analytics
 */
export async function getQueueAnalytics(filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  queueType?: string;
  doctorId?: string;
  clinicId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const endpoint = `${API_ENDPOINTS.ANALYTICS.QUEUE}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Export analytics data
 */
export async function exportAnalyticsData(format: 'csv' | 'excel' | 'pdf', data: any) {
  const { data: result } = await authenticatedApi(API_ENDPOINTS.ANALYTICS.EXPORT, {
    method: 'POST',
    body: JSON.stringify({ format, data }),
  });
  return result;
}
