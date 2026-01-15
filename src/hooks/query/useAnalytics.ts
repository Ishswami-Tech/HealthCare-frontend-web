import { useQueryData } from '../core/useQueryData';
import { useMutationData } from '../core/useMutationData';
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
  return useMutationData(['generateAppointmentReport'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel' | 'csv';
    clinicId?: string;
    doctorId?: string;
    status?: string;
  }) => {
    const result = await generateAppointmentReport(filters);
    return { status: 200, data: result };
  });
};

/**
 * Hook to generate patient report
 */
export const useGeneratePatientReport = () => {
  return useMutationData(['generatePatientReport'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel' | 'csv';
    clinicId?: string;
    includeDetails?: boolean;
  }) => {
    const result = await generatePatientReport(filters);
    return { status: 200, data: result };
  });
};

/**
 * Hook to generate revenue report
 */
export const useGenerateRevenueReport = () => {
  return useMutationData(['generateRevenueReport'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel' | 'csv';
    clinicId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const result = await generateRevenueReport(filters);
    return { status: 200, data: result };
  });
};

/**
 * Hook to generate doctor performance report
 */
export const useGenerateDoctorPerformanceReport = () => {
  return useMutationData(['generateDoctorPerformanceReport'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel' | 'csv';
    doctorId?: string;
    clinicId?: string;
  }) => {
    const result = await generateDoctorPerformanceReport(filters);
    return { status: 200, data: result };
  });
};

/**
 * Hook to generate clinic summary report
 */
export const useGenerateClinicSummaryReport = () => {
  return useMutationData(['generateClinicSummaryReport'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'pdf' | 'excel' | 'csv';
    clinicId?: string;
  }) => {
    const result = await generateClinicSummaryReport(filters);
    return { status: 200, data: result };
  });
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
  return useMutationData(['downloadReport'], async (reportId: string) => {
    const result = await downloadReport(reportId);
    return { status: 200, data: result };
  });
};

/**
 * Hook to delete report
 */
export const useDeleteReport = () => {
  return useMutationData(['deleteReport'], async (reportId: string) => {
    const result = await deleteReport(reportId);
    return { status: 200, data: result };
  }, 'reportHistory');
};

// ===== CUSTOM ANALYTICS HOOKS =====

/**
 * Hook to get custom analytics
 */
export const useCustomAnalytics = () => {
  return useMutationData(['customAnalytics'], async (query: {
    metrics: string[];
    dimensions: string[];
    filters?: Record<string, any>;
    startDate: string;
    endDate: string;
  }) => {
    const result = await getCustomAnalytics(query);
    return { status: 200, data: result };
  });
};

/**
 * Hook to save custom analytics query
 */
export const useSaveCustomAnalyticsQuery = () => {
  return useMutationData(['saveCustomAnalyticsQuery'], async (queryData: {
    name: string;
    description?: string;
    query: {
      metrics: string[];
      dimensions: string[];
      filters?: Record<string, any>;
    };
  }) => {
    const result = await saveCustomAnalyticsQuery(queryData);
    return { status: 200, data: result };
  }, 'savedAnalyticsQueries');
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
