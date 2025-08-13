'use server';

import { authenticatedApi } from './auth.server';

// ===== ANALYTICS & REPORTING =====

/**
 * Get dashboard analytics
 */
export async function getDashboardAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month', clinicId?: string) {
  const params = new URLSearchParams({ period });
  if (clinicId) params.append('clinicId', clinicId);
  
  const { data } = await authenticatedApi(`/analytics/dashboard?${params.toString()}`);
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
  
  const endpoint = `/analytics/appointments${params.toString() ? `?${params.toString()}` : ''}`;
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
  
  const endpoint = `/analytics/patients${params.toString() ? `?${params.toString()}` : ''}`;
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
  
  const endpoint = `/analytics/revenue${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get doctor performance analytics
 */
export async function getDoctorPerformanceAnalytics(doctorId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const params = new URLSearchParams({ period });
  if (doctorId) params.append('doctorId', doctorId);
  
  const { data } = await authenticatedApi(`/analytics/doctors/performance?${params.toString()}`);
  return data;
}

/**
 * Get clinic performance analytics
 */
export async function getClinicPerformanceAnalytics(clinicId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const params = new URLSearchParams({ period });
  if (clinicId) params.append('clinicId', clinicId);
  
  const { data } = await authenticatedApi(`/analytics/clinics/performance?${params.toString()}`);
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
  
  const endpoint = `/analytics/services/utilization${params.toString() ? `?${params.toString()}` : ''}`;
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
  
  const endpoint = `/analytics/wait-times${params.toString() ? `?${params.toString()}` : ''}`;
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
  
  const endpoint = `/analytics/satisfaction${params.toString() ? `?${params.toString()}` : ''}`;
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
  const { data } = await authenticatedApi('/reports/appointments', {
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
  const { data } = await authenticatedApi('/reports/patients', {
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
  const { data } = await authenticatedApi('/reports/revenue', {
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
  const { data } = await authenticatedApi('/reports/doctors/performance', {
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
  const { data } = await authenticatedApi('/reports/clinics/summary', {
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
  
  const endpoint = `/reports/history${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Download report
 */
export async function downloadReport(reportId: string) {
  const { data } = await authenticatedApi(`/reports/${reportId}/download`);
  return data;
}

/**
 * Delete report
 */
export async function deleteReport(reportId: string) {
  const { data } = await authenticatedApi(`/reports/${reportId}`, {
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
  const { data } = await authenticatedApi('/analytics/custom', {
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
  const { data } = await authenticatedApi('/analytics/custom/queries', {
    method: 'POST',
    body: JSON.stringify(queryData),
  });
  return data;
}

/**
 * Get saved analytics queries
 */
export async function getSavedAnalyticsQueries() {
  const { data } = await authenticatedApi('/analytics/custom/queries');
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

  const endpoint = `/analytics/queue${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Export analytics data
 */
export async function exportAnalyticsData(format: 'csv' | 'excel' | 'pdf', data: any) {
  const { data: result } = await authenticatedApi('/analytics/export', {
    method: 'POST',
    body: JSON.stringify({ format, data }),
  });
  return result;
}
