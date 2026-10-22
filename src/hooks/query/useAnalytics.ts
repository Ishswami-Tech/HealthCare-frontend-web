import { useQueryData } from '../core/useQueryData';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';

// ===== ANALYTICS HOOKS =====

/**
 * Hook to get dashboard analytics
 */
export const useDashboardAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'month', clinicId?: string) => {
  return useQueryData(['dashboardAnalytics', period, clinicId], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD, { period, clinicId });
    return result.data ?? result;
  });
};

/**
 * Hook to get appointment analytics
 */
export const useAppointmentAnalytics = (
  filters?: {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    clinicId?: string;
  },
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
) => {
  return useQueryData(['appointmentAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.APPOINTMENTS, filters);
    return result.data ?? result;
  }, {
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime,
  });
};

/**
 * Hook to get patient analytics
 */
export const usePatientAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  ageGroup?: string;
  gender?: string;
}) => {
  return useQueryData(['patientAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.PATIENTS, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to get revenue analytics
 */
export const useRevenueAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  clinicId?: string;
  serviceId?: string;
}) => {
  return useQueryData(['revenueAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.REVENUE, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to get clinic performance analytics
 */
export const useClinicPerformanceAnalytics = (clinicId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQueryData(['clinicPerformanceAnalytics', clinicId, period], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.CLINICS_PERFORMANCE, { clinicId, period });
    return result.data ?? result;
  });
};

/**
 * Hook to get service utilization analytics
 */
export const useServiceUtilizationAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  serviceCategory?: string;
}) => {
  return useQueryData(['serviceUtilizationAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.SERVICES_UTILIZATION, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to get wait time analytics
 */
export const useWaitTimeAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  doctorId?: string;
}) => {
  return useQueryData(['waitTimeAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.WAIT_TIMES, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to get patient satisfaction analytics
 */
export const usePatientSatisfactionAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  clinicId?: string;
  doctorId?: string;
}) => {
  return useQueryData(['patientSatisfactionAnalytics', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.SATISFACTION, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to get queue analytics
 */
export const useQueueAnalytics = (
  clinicId: string,
  filters?: {
    period?: 'day' | 'week' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
    queueType?: string;
    doctorId?: string;
  }
) => {
  return useQueryData(['queueAnalytics', clinicId, filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.QUEUE, { ...filters, clinicId });
    return result.data ?? result;
  }, {
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000,
  });
};

// No report or custom-analytics hooks: the backend has no /reports/*, /analytics/custom,
// /analytics/custom-queries or /analytics/doctors/performance routes. Screens use the /analytics/* reads above.

// ===== UTILITY HOOKS =====

/**
 * Hook to format analytics data for charts
 */
export const useFormatChartData = () => {
  return (data: any[], xKey: string, yKey: string) => {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      x: item[xKey],
      y: item[yKey],
      ...item
    }));
  };
};

/**
 * Hook to calculate percentage change
 */
export const useCalculatePercentageChange = () => {
  return (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };
};

/**
 * Hook to format currency
 */
export const useFormatCurrency = () => {
  return (amount: number, currency: string = 'USD'): string => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
    });
  };
};

/**
 * Hook to format percentage
 */
export const useFormatPercentage = () => {
  return (value: number, decimals: number = 1): string => {
    return `${value.toFixed(decimals)}%`;
  };
};
