import React, { useEffect, useCallback } from 'react';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useAuthStore } from '@/stores/auth.store';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import { keepPreviousData } from '@tanstack/react-query';
import { isSessionInvalidError } from '@/lib/utils/auth-recovery';
import {
  getQueueListQueryKey,
  getQueueStatsQueryKey,
  type QueueListFilters,
} from '@/lib/queue/queue-cache';

// ===== QUEUE MANAGEMENT HOOKS =====

const queueQueryRetry = (failureCount: number, error: unknown) => {
  if (isSessionInvalidError(error)) {
    return false;
  }

  return failureCount < 2;
};

/**
 * Hook to get queue data for a clinic or global queue view.
 * clinicId is optional so superadmins can load the shared queue surface
 * without being forced into a single clinic context.
 */
export const useQueue = (clinicId?: string, filters?: {
  type?: string;
  treatmentType?: string;
  status?: string;
  doctorId?: string;
  date?: string;
  enabled?: boolean;
}) => {
  const normalizedClinicId = clinicId?.trim();
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  const { enabled, ...queueRequestFilters } = filters ?? {};
  const canonicalTreatmentType = filters?.treatmentType || filters?.type;
  const queueFilters: QueueListFilters | undefined = filters
    ? {
        ...(canonicalTreatmentType ? { treatmentType: canonicalTreatmentType } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(filters.date ? { date: filters.date } : {}),
      }
    : undefined;

  return useQueryData(getQueueListQueryKey(normalizedClinicId, queueFilters), async () => {
    try {
      const response = await clinicApiClient.get(API_ENDPOINTS.QUEUE.GET, {
        ...queueRequestFilters,
        ...(normalizedClinicId ? { clinicId: normalizedClinicId } : {}),
      });
      return response.data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: enabled !== false,
    // Websocket invalidation owns freshness when connected; polling becomes fallback only.
    refetchInterval: isConnected || isAuthRefreshing ? false : 30000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    retry: queueQueryRetry,
  });
};

/**
 * Hook to get queue statistics
 */
export const useQueueStats = (locationId?: string, options?: { enabled?: boolean }) => {
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData(getQueueStatsQueryKey(locationId), async () => {
    try {
      if (!locationId) throw new Error('Location ID required for queue stats');
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.STATS, { locationId })).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  }, {
    enabled: !!locationId && options?.enabled !== false,
    refetchInterval: isConnected || isAuthRefreshing ? false : 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: keepPreviousData,
    retry: queueQueryRetry,
  });
};

/**
 * Hook to fetch the backend queue filter catalog
 */
export const useQueueFilters = (options?: { enabled?: boolean }) => {
  return useQueryData(['queue-filters'], async () => {
    try {
      const result = (await clinicApiClient.get(API_ENDPOINTS.QUEUE.FILTERS)).data;
      if (!result) {
        throw new Error('Failed to fetch queue filters');
      }
      const payload = Array.isArray(result) ? result : (result as { availableQueueFilterCatalog?: unknown[]; data?: unknown })?.availableQueueFilterCatalog ?? (result as { data?: unknown })?.data;
      return Array.isArray(payload) ? payload : [];
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: options?.enabled !== false,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: queueQueryRetry,
  });
};

/**
 * Hook to update queue status
 */
export const useUpdateQueueStatus = () => {
  return useMutationOperation(
    async ({ patientId, status }: {
      patientId: string;
      status: string;
    }) => {
      return (await clinicApiClient.patch(API_ENDPOINTS.QUEUE.UPDATE_STATUS(patientId), { status })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue status...',
      successMessage: 'Queue status updated successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to call next patient
 */
export const useCallNextPatient = () => {
  return useMutationOperation(
    async ({ doctorId, appointmentId }: {
      doctorId: string;
      appointmentId: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.CALL_NEXT, { doctorId, appointmentId })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.CALL_NEXT,
      loadingMessage: 'Calling next patient...',
      successMessage: 'Next patient called successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to add patient to queue
 */
export const useAddToQueue = () => {
  return useMutationOperation(
    async (queueData: {
      patientId: string;
      appointmentId?: string;
      queueType: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      estimatedDuration?: number;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.ADD, queueData)).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Adding to queue...',
      successMessage: 'Patient added to queue successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to remove patient from queue
 */
export const useRemoveFromQueue = () => {
  return useMutationOperation(
    async ({ queueId, reason }: {
      queueId: string;
      reason?: string;
    }) => {
      return (await clinicApiClient.delete(API_ENDPOINTS.QUEUE.REMOVE(queueId), {
        body: reason ? JSON.stringify({ reason }) : undefined,
      })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Removing from queue...',
      successMessage: 'Patient removed from queue successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to reorder queue
 */
export const useReorderQueue = () => {
  return useMutationOperation(
    async ({ doctorId, date, newOrder }: {
      doctorId: string;
      date: string;
      newOrder: string[];
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.REORDER, { doctorId, date, newOrder })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Reordering queue...',
      successMessage: 'Queue reordered successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to get queue history
 */
export const useQueueHistory = (filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  doctorId?: string;
  limit?: number;
}) => {
  return useQueryData(['queueHistory', filters], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.HISTORY, filters as Record<string, string | number | boolean | undefined>)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  });
};

/**
 * Hook to get queue analytics
 */
export const useQueueAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'day') => {
  return useQueryData(['queueAnalytics', period], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.ANALYTICS, { period })).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  });
};

// ===== SPECIALIZED QUEUE HOOKS =====

/**
 * Hook for consultation queue
 */
export const useConsultationQueue = (clinicId?: string) => {
  return useQueue(clinicId, { treatmentType: 'consultation' });
};

/**
 * Hook for panchakarma queue
 */
export const usePanchkarmaQueue = (clinicId?: string) => {
  return useQueue(clinicId, { treatmentType: 'panchakarma' });
};

/**
 * Hook for agnikarma queue
 */
export const useAgnikarmaQueue = (clinicId?: string) => {
  return useQueue(clinicId, { treatmentType: 'agnikarma' });
};

/**
 * Hook for nadi pariksha queue
 */
export const useNadiParikshaQueue = (clinicId?: string) => {
  return useQueue(clinicId, { treatmentType: 'nadi-pariksha' });
};

// ===== QUEUE UTILITIES =====

/**
 * Hook for queue utilities and calculations
 */
export const useQueueUtils = () => {
  const calculateEstimatedWaitTime = (queuePosition: number, averageConsultationTime: number = 15) => {
    return queuePosition * averageConsultationTime;
  };

  const getQueueStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'waiting':
        return 'text-yellow-600 bg-yellow-100';
      case 'in-progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'no-show':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getQueueStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'waiting':
        return '⏳';
      case 'in-progress':
        return '🔄';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'no-show':
        return '👻';
      default:
        return '❓';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return {
    calculateEstimatedWaitTime,
    getQueueStatusColor,
    getQueueStatusIcon,
    getPriorityColor,
    formatWaitTime,
  };
};

/**
 * Hook to update queue position
 */
export const useUpdateQueuePosition = () => {
  return useMutationOperation(
    async ({ queueId, newPosition }: {
      queueId: string;
      newPosition: number;
    }) => {
      return (await clinicApiClient.patch(API_ENDPOINTS.QUEUE.UPDATE_POSITION(queueId), { newPosition })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue position...',
      successMessage: 'Queue position updated successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to pause queue
 */
export const usePauseQueue = () => {
  return useMutationOperation(
    async ({ doctorId }: {
      doctorId: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.PAUSE, { doctorId })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Pausing queue...',
      successMessage: 'Queue paused successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to transfer a queue entry between logical queues
 */
export const useTransferQueueEntry = () => {
  return useMutationOperation(
    async ({
      entryId,
      targetQueue,
      treatmentType,
      notes,
    }: {
      entryId: string;
      targetQueue: string;
      treatmentType?: string;
      notes?: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.TRANSFER(entryId), {
        targetQueue,
        treatmentType,
        notes,
      })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Moving patient to queue...',
      successMessage: 'Patient moved successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to resume queue
 */
export const useResumeQueue = () => {
  return useMutationOperation(
    async ({ doctorId }: {
      doctorId: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.RESUME, { doctorId })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Resuming queue...',
      successMessage: 'Queue resumed successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to get queue configuration
 */
export const useQueueConfig = () => {
  return useQueryData(['queueConfig'], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.CONFIG)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  });
};

/**
 * Hook to update queue configuration
 */
export const useUpdateQueueConfig = () => {
  return useMutationOperation(
    async (config: {
      maxWaitTime?: number;
      averageConsultationTime?: number;
      autoCallNext?: boolean;
      allowWalkIns?: boolean;
      priorityEnabled?: boolean;
    }) => {
      return (await clinicApiClient.put(API_ENDPOINTS.QUEUE.CONFIG, config)).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue configuration...',
      successMessage: 'Queue configuration updated successfully',
      invalidateQueries: [
        ['queue'],
        ['queue-status'],
        ['queueConfig'],
        ['queueHistory'],
        ['queueAnalytics'],
        ['queuePerformanceMetrics'],
      ],
    }
  );
};

/**
 * Hook to get queue notifications
 */
export const useQueueNotifications = (userId?: string) => {
  return useQueryData(['queueNotifications', userId], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.NOTIFICATIONS.GET, userId ? { userId } : undefined)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  }, {
    enabled: true,
  });
};

/**
 * Hook to mark queue notification as read
 */
export const useMarkQueueNotificationAsRead = () => {
  return useMutationOperation(
    async ({ notificationId }: {
      notificationId: string;
    }) => {
      return (await clinicApiClient.patch(API_ENDPOINTS.QUEUE.NOTIFICATIONS.MARK_READ(notificationId), { read: true })).data;
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.NEW,
      loadingMessage: 'Marking notification as read...',
      successMessage: 'Notification marked as read',
      invalidateQueries: [['queueNotifications']],
      showToast: false,
    }
  );
};

/**
 * Hook to send queue notification
 */
export const useSendQueueNotification = () => {
  return useMutationOperation(
    async (notificationData: {
      patientId: string;
      type: 'CALLED' | 'DELAYED' | 'CANCELLED' | 'REMINDER';
      message: string;
      channels?: ('sms' | 'email' | 'push')[];
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.NOTIFICATIONS.SEND, notificationData)).data;
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.SEND,
      loadingMessage: 'Sending queue notification...',
      successMessage: 'Queue notification sent successfully',
    }
  );
};

/**
 * Hook to get queue wait times
 */
export const useQueueWaitTimes = (queueType?: string) => {
  return useQueryData(['queueWaitTimes', queueType], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.WAIT_TIMES, queueType ? { queueType } : undefined)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  });
};

/**
 * Hook to estimate wait time
 */
export const useEstimateWaitTime = () => {
  return useMutationOperation(
    async ({ queueType, priority }: {
      queueType: string;
      priority?: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.ESTIMATE_WAIT_TIME, { queueType, priority })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Estimating wait time...',
      successMessage: 'Wait time estimated',
      showToast: false,
    }
  );
};

/**
 * Hook to get queue capacity
 */
export const useQueueCapacity = (queueType: string) => {
  return useQueryData(['queueCapacity', queueType], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.CAPACITY, { queueType })).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  }, {
    enabled: !!queueType,
  });
};

/**
 * Hook to update queue capacity
 */
export const useUpdateQueueCapacity = () => {
  return useMutationOperation(
    async ({ queueType, capacity }: {
      queueType: string;
      capacity: number;
    }) => {
      return (await clinicApiClient.put(API_ENDPOINTS.QUEUE.CAPACITY, { queueType, capacity })).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue capacity...',
      successMessage: 'Queue capacity updated successfully',
      invalidateQueries: [
        ['queueCapacity'],
        ['queue'],
        ['queue-status'],
        ['queueHistory'],
        ['queueAnalytics'],
      ],
    }
  );
};

/**
 * Hook to get queue performance metrics
 */
export const useQueuePerformanceMetrics = (filters?: {
  startDate?: string;
  endDate?: string;
  queueType?: string;
  }) => {
  return useQueryData(['queuePerformanceMetrics', filters], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.PERFORMANCE, filters as Record<string, string | number | boolean | undefined>)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return null;
      }
      throw error;
    }
  });
};

/**
 * Hook to export queue data
 */
export const useExportQueueData = () => {
  return useMutationOperation(
    async (filters: {
      startDate: string;
      endDate: string;
      format: 'csv' | 'excel' | 'pdf';
      queueType?: string;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.EXPORT, filters)).data;
    },
    {
      toastId: TOAST_IDS.ANALYTICS.REPORT_DOWNLOAD,
      loadingMessage: 'Exporting queue data...',
      successMessage: 'Queue data exported successfully',
    }
  );
};

/**
 * Hook to get queue alerts
 */
export const useQueueAlerts = () => {
  return useQueryData(['queueAlerts'], async () => {
    try {
      return (await clinicApiClient.get(API_ENDPOINTS.QUEUE.ALERTS.GET)).data;
    } catch (error) {
      if (isSessionInvalidError(error)) {
        return [];
      }
      throw error;
    }
  });
};

/**
 * Hook to create queue alert
 */
export const useCreateQueueAlert = () => {
  return useMutationOperation(
    async (alertData: {
      type: 'LONG_WAIT' | 'CAPACITY_FULL' | 'NO_SHOW' | 'DELAY';
      threshold: number;
      queueType?: string;
      enabled: boolean;
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.QUEUE.ALERTS.CREATE, alertData)).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Creating queue alert...',
      successMessage: 'Queue alert created successfully',
      invalidateQueries: [['queueAlerts']],
    }
  );
};

/**
 * Hook to update queue alert
 */
export const useUpdateQueueAlert = () => {
  return useMutationOperation(
    async ({ alertId, updates }: {
      alertId: string;
      updates: {
        threshold?: number;
        enabled?: boolean;
      };
    }) => {
      return (await clinicApiClient.put(API_ENDPOINTS.QUEUE.ALERTS.UPDATE(alertId), updates)).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue alert...',
      successMessage: 'Queue alert updated successfully',
      invalidateQueries: [['queueAlerts']],
    }
  );
};

/**
 * Hook to delete queue alert
 */
export const useDeleteQueueAlert = () => {
  return useMutationOperation(
    async ({ alertId }: {
      alertId: string;
    }) => {
      return (await clinicApiClient.delete(API_ENDPOINTS.QUEUE.ALERTS.DELETE(alertId))).data;
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Deleting queue alert...',
      successMessage: 'Queue alert deleted successfully',
      invalidateQueries: [['queueAlerts']],
    }
  );
};
