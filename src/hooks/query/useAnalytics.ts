import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getDashboardAnalytics,
  getAppointmentAnalytics,
  getPatientAnalytics,
  getRevenueAnalytics,
  getDoctorPerformanceAnalytics,
  getClinicPerformanceAnalytics,
  getServiceUtilizationAnalytics,
  getWaitTimeAnalytics,
  getPatientSatisfactionAnalytics,
  getQueueAnalytics,
  generateAppointmentReport,
  generatePatientReport,
  generateRevenueReport,
  generateDoctorPerformanceReport,
  generateClinicSummaryReport,
  getReportHistory,
  downloadReport,
  deleteReport,
  getCustomAnalytics,
  saveCustomAnalyticsQuery,
  getSavedAnalyticsQueries
} from '@/lib/actions/analytics.server';

// ===== ANALYTICS HOOKS =====

/**
 * Hook to get dashboard analytics
 */
export const useDashboardAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'month', clinicId?: string) => {
  return useQueryData(['dashboardAnalytics', period, clinicId], async () => {
    return await getDashboardAnalytics(period, clinicId);
  });
};

/**
 * Hook to get appointment analytics
 */
export const useAppointmentAnalytics = (filters?: {
  period?: 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  clinicId?: string;
}) => {
  return useQueryData(['appointmentAnalytics', filters], async () => {
    return await getAppointmentAnalytics(filters);
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
    return await getPatientAnalytics(filters);
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
    return await getRevenueAnalytics(filters);
  });
};

/**
 * Hook to get doctor performance analytics
 */
export const useDoctorPerformanceAnalytics = (doctorId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQueryData(['doctorPerformanceAnalytics', doctorId, period], async () => {
    return await getDoctorPerformanceAnalytics(doctorId, period);
  });
};

/**
 * Hook to get clinic performance analytics
 */
export const useClinicPerformanceAnalytics = (clinicId?: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
  return useQueryData(['clinicPerformanceAnalytics', clinicId, period], async () => {
    return await getClinicPerformanceAnalytics(clinicId, period);
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
    return await getServiceUtilizationAnalytics(filters);
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
    return await getWaitTimeAnalytics(filters);
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
    return await getPatientSatisfactionAnalytics(filters);
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
    return await getQueueAnalytics({ ...filters, clinicId });
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
      return await generateAppointmentReport(filters);
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
      return await generatePatientReport(filters);
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
      return await generateRevenueReport(filters);
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
      return await generateDoctorPerformanceReport(filters);
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
      return await generateClinicSummaryReport(filters);
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
    return await getReportHistory(filters);
  });
};

/**
 * Hook to download report
 */
export const useDownloadReport = () => {
  return useMutationOperation(
    async (reportId: string) => {
      return await downloadReport(reportId);
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
      return await deleteReport(reportId);
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
      return await getCustomAnalytics(query);
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
      return await saveCustomAnalyticsQuery(queryData);
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
    return await getSavedAnalyticsQueries();
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
