import React from 'react';
import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getQueue,
  getQueueStats,
  updateQueueStatus,
  callNextPatient,
  getQueueHistory,
  addToQueue,
  removeFromQueue,
  reorderQueue,
  getQueueAnalytics,
  updateQueuePosition,
  pauseQueue,
  resumeQueue,
  getQueueConfig,
  updateQueueConfig,
  getQueueNotifications,
  markQueueNotificationAsRead,
  sendQueueNotification,
  getQueueWaitTimes,
  estimateWaitTime,
  getQueueCapacity,
  updateQueueCapacity,
  getQueuePerformanceMetrics,
  exportQueueData,
  getQueueAlerts,
  createQueueAlert,
  updateQueueAlert,
  deleteQueueAlert,
} from '@/lib/actions/queue.server';

// ===== QUEUE MANAGEMENT HOOKS =====

/**
 * Hook to get queue data for a clinic
 */
export const useQueue = (clinicId: string, filters?: {
  type?: string;
  status?: string;
  doctorId?: string;
  date?: string;
  enabled?: boolean;
}) => {
  return useQueryData(['queue', clinicId, filters], async () => {
    return await getQueue({ ...filters, clinicId });
  }, {
    enabled: !!clinicId && (filters?.enabled !== false),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
};

/**
 * Hook to get queue statistics
 */
export const useQueueStats = (options?: { enabled?: boolean }) => {
  return useQueryData(['queueStats'], async () => {
    return await getQueueStats();
  }, {
    enabled: options?.enabled !== false,
    refetchInterval: 60000, // Refetch every minute
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
      return await updateQueueStatus(patientId, status);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue status...',
      successMessage: 'Queue status updated successfully',
      invalidateQueries: [['queue']],
    }
  );
};

/**
 * Hook to call next patient
 */
export const useCallNextPatient = () => {
  return useMutationOperation(
    async ({ queueType }: {
      queueType: string;
    }) => {
      return await callNextPatient(queueType);
    },
    {
      toastId: TOAST_IDS.QUEUE.CALL_NEXT,
      loadingMessage: 'Calling next patient...',
      successMessage: 'Next patient called successfully',
      invalidateQueries: [['queue']],
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
      return await addToQueue(queueData);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Adding to queue...',
      successMessage: 'Patient added to queue successfully',
      invalidateQueries: [['queue']],
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
      return await removeFromQueue(queueId, reason);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Removing from queue...',
      successMessage: 'Patient removed from queue successfully',
      invalidateQueries: [['queue']],
    }
  );
};

/**
 * Hook to reorder queue
 */
export const useReorderQueue = () => {
  return useMutationOperation(
    async ({ queueType, patientIds }: {
      queueType: string;
      patientIds: string[];
    }) => {
      return await reorderQueue(queueType, patientIds);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Reordering queue...',
      successMessage: 'Queue reordered successfully',
      invalidateQueries: [['queue']],
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
    return await getQueueHistory(filters);
  });
};

/**
 * Hook to get queue analytics
 */
export const useQueueAnalytics = (period: 'day' | 'week' | 'month' | 'year' = 'day') => {
  return useQueryData(['queueAnalytics', period], async () => {
    return await getQueueAnalytics(period);
  });
};

// ===== SPECIALIZED QUEUE HOOKS =====

/**
 * Hook for consultation queue
 */
export const useConsultationQueue = () => {
  return useQueue('consultation', { type: 'consultation' });
};

/**
 * Hook for panchakarma queue
 */
export const usePanchkarmaQueue = () => {
  return useQueue('panchakarma', { type: 'panchakarma' });
};

/**
 * Hook for agnikarma queue
 */
export const useAgnikarmaQueue = () => {
  return useQueue('agnikarma', { type: 'agnikarma' });
};

/**
 * Hook for nadi pariksha queue
 */
export const useNadiParikshaQueue = () => {
  return useQueue('nadi-pariksha', { type: 'nadi-pariksha' });
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

// ===== REAL-TIME QUEUE HOOKS =====

/**
 * Hook for real-time queue updates using WebSocket
 */
export const useRealTimeQueue = (queueType?: string) => {
  // This would integrate with your WebSocket implementation
  // For now, we'll use polling as a fallback
  
  const { data: queueData, refetch } = useQueue(queueType || '', { 
    type: queueType,
    enabled: true 
  } as any);

  // Set up polling for real-time updates
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  return {
    queueData,
    refetch,
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
      return await updateQueuePosition(queueId, newPosition);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue position...',
      successMessage: 'Queue position updated successfully',
      invalidateQueries: [['queue']],
    }
  );
};

/**
 * Hook to pause queue
 */
export const usePauseQueue = () => {
  return useMutationOperation(
    async ({ queueType, reason }: {
      queueType: string;
      reason?: string;
    }) => {
      return await pauseQueue(queueType, reason);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Pausing queue...',
      successMessage: 'Queue paused successfully',
      invalidateQueries: [['queue']],
    }
  );
};

/**
 * Hook to resume queue
 */
export const useResumeQueue = () => {
  return useMutationOperation(
    async ({ queueType }: {
      queueType: string;
    }) => {
      return await resumeQueue(queueType);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Resuming queue...',
      successMessage: 'Queue resumed successfully',
      invalidateQueries: [['queue']],
    }
  );
};

/**
 * Hook to get queue configuration
 */
export const useQueueConfig = () => {
  return useQueryData(['queueConfig'], async () => {
    return await getQueueConfig();
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
      return await updateQueueConfig(config);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue configuration...',
      successMessage: 'Queue configuration updated successfully',
      invalidateQueries: [['queue'], ['queueConfig']],
    }
  );
};

/**
 * Hook to get queue notifications
 */
export const useQueueNotifications = (userId?: string) => {
  return useQueryData(['queueNotifications', userId], async () => {
    return await getQueueNotifications(userId);
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
      return await markQueueNotificationAsRead(notificationId);
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
      return await sendQueueNotification(notificationData);
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
    return await getQueueWaitTimes(queueType);
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
      return await estimateWaitTime(queueType, priority);
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
    return await getQueueCapacity(queueType);
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
      return await updateQueueCapacity(queueType, capacity);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating queue capacity...',
      successMessage: 'Queue capacity updated successfully',
      invalidateQueries: [['queueCapacity']],
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
    return await getQueuePerformanceMetrics(filters);
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
      return await exportQueueData(filters);
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
    return await getQueueAlerts();
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
      return await createQueueAlert(alertData);
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
      return await updateQueueAlert(alertId, updates);
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
      return await deleteQueueAlert(alertId);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Deleting queue alert...',
      successMessage: 'Queue alert deleted successfully',
      invalidateQueries: [['queueAlerts']],
    }
  );
};
