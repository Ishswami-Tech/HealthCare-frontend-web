import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
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
 * Hook to get doctor performance analytics
 */
export const useDoctorPerformanceAnalytics = (doctorId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQueryData(['doctorPerformanceAnalytics', doctorId, period], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.DOCTORS_PERFORMANCE, { doctorId, period });
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

// ===== REPORTS HOOKS =====

/**
 * Hook to generate appointment report
 */
export const useGenerateAppointmentReport = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel' | 'csv';
      clinicId?: string;
      doctorId?: string;
      status?: string;
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.REPORTS.APPOINTMENTS, filters);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Generating appointment report...',
      successMessage: 'Appointment report generated successfully',
    }
  );
};

/**
 * Hook to generate patient report
 */
export const useGeneratePatientReport = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel' | 'csv';
      clinicId?: string;
      includeDetails?: boolean;
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.REPORTS.PATIENTS, filters);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Generating patient report...',
      successMessage: 'Patient report generated successfully',
    }
  );
};

/**
 * Hook to generate revenue report
 */
export const useGenerateRevenueReport = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel' | 'csv';
      clinicId?: string;
      groupBy?: 'day' | 'week' | 'month';
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.REPORTS.REVENUE, filters);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Generating revenue report...',
      successMessage: 'Revenue report generated successfully',
    }
  );
};

/**
 * Hook to generate doctor performance report
 */
export const useGenerateDoctorPerformanceReport = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel' | 'csv';
      doctorId?: string;
      clinicId?: string;
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.REPORTS.DOCTORS_PERFORMANCE, filters);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Generating doctor performance report...',
      successMessage: 'Doctor performance report generated successfully',
    }
  );
};

/**
 * Hook to generate clinic summary report
 */
export const useGenerateClinicSummaryReport = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'pdf' | 'excel' | 'csv';
      clinicId?: string;
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.REPORTS.CLINICS_SUMMARY, filters);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Generating clinic summary report...',
      successMessage: 'Clinic summary report generated successfully',
    }
  );
};

/**
 * Hook to get report history
 */
export const useReportHistory = (filters?: {
  type?: string;
  status?: 'pending' | 'completed' | 'failed';
  limit?: number;
}) => {
  return useQueryData(['reportHistory', filters], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.REPORTS.HISTORY, filters);
    return result.data ?? result;
  });
};

/**
 * Hook to download report
 */
export const useDownloadReport = () => {
  return useMutationOperation(
    async (reportId: string) => {
      const result = await clinicApiClient.get(API_ENDPOINTS.REPORTS.DOWNLOAD(reportId));
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Downloading report...',
      successMessage: 'Report downloaded successfully',
    }
  );
};

/**
 * Hook to delete report
 */
export const useDeleteReport = () => {
  return useMutationOperation(
    async (reportId: string) => {
      const result = await clinicApiClient.delete(API_ENDPOINTS.REPORTS.DELETE(reportId));
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Deleting report...',
      successMessage: 'Report deleted successfully',
      invalidateQueries: [['reportHistory']],
    }
  );
};

// ===== CUSTOM ANALYTICS HOOKS =====

/**
 * Hook to get custom analytics
 */
export const useCustomAnalytics = () => {
  return useMutationOperation(
    async (query: {
      metrics: string[];
      dimensions: string[];
      filters?: Record<string, any>;
      startDate: string;
      endDate: string;
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.ANALYTICS.CUSTOM, query);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Fetching custom analytics...',
      successMessage: 'Custom analytics retrieved successfully',
      showToast: false, // Query-like operation
    }
  );
};

/**
 * Hook to save custom analytics query
 */
export const useSaveCustomAnalyticsQuery = () => {
  return useMutationOperation(
    async (queryData: {
      name: string;
      description?: string;
      query: {
        metrics: string[];
        dimensions: string[];
        filters?: Record<string, any>;
      };
    }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.ANALYTICS.CUSTOM_QUERIES.CREATE, queryData);
      return result.data ?? result;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_GENERATE,
      loadingMessage: 'Saving custom analytics query...',
      successMessage: 'Custom analytics query saved successfully',
      invalidateQueries: [['savedAnalyticsQueries']],
    }
  );
};

/**
 * Hook to get saved analytics queries
 */
export const useSavedAnalyticsQueries = () => {
  return useQueryData(['savedAnalyticsQueries'], async () => {
    const result = await clinicApiClient.get(API_ENDPOINTS.ANALYTICS.CUSTOM_QUERIES.GET_ALL);
    return result.data ?? result;
  });
};

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
