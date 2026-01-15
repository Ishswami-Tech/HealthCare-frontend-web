import React from 'react';
import { useQueryData } from '../core/useQueryData';
import { useMutationData } from '../core/useMutationData';
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
  return useMutationData(['updateQueueStatus'], async ({ patientId, status }: {
    patientId: string;
    status: string;
  }) => {
    const result = await updateQueueStatus(patientId, status);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to call next patient
 */
export const useCallNextPatient = () => {
  return useMutationData(['callNextPatient'], async ({ queueType }: {
    queueType: string;
  }) => {
    const result = await callNextPatient(queueType);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to add patient to queue
 */
export const useAddToQueue = () => {
  return useMutationData(['addToQueue'], async (queueData: {
    patientId: string;
    appointmentId?: string;
    queueType: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    estimatedDuration?: number;
  }) => {
    const result = await addToQueue(queueData);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to remove patient from queue
 */
export const useRemoveFromQueue = () => {
  return useMutationData(['removeFromQueue'], async ({ queueId, reason }: {
    queueId: string;
    reason?: string;
  }) => {
    const result = await removeFromQueue(queueId, reason);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to reorder queue
 */
export const useReorderQueue = () => {
  return useMutationData(['reorderQueue'], async ({ queueType, patientIds }: {
    queueType: string;
    patientIds: string[];
  }) => {
    const result = await reorderQueue(queueType, patientIds);
    return { status: 200, data: result };
  }, 'queue');
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
  return useMutationData(['updateQueuePosition'], async ({ queueId, newPosition }: {
    queueId: string;
    newPosition: number;
  }) => {
    const result = await updateQueuePosition(queueId, newPosition);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to pause queue
 */
export const usePauseQueue = () => {
  return useMutationData(['pauseQueue'], async ({ queueType, reason }: {
    queueType: string;
    reason?: string;
  }) => {
    const result = await pauseQueue(queueType, reason);
    return { status: 200, data: result };
  }, 'queue');
};

/**
 * Hook to resume queue
 */
export const useResumeQueue = () => {
  return useMutationData(['resumeQueue'], async ({ queueType }: {
    queueType: string;
  }) => {
    const result = await resumeQueue(queueType);
    return { status: 200, data: result };
  }, 'queue');
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
  return useMutationData(['updateQueueConfig'], async (config: {
    maxWaitTime?: number;
    averageConsultationTime?: number;
    autoCallNext?: boolean;
    allowWalkIns?: boolean;
    priorityEnabled?: boolean;
  }) => {
    const result = await updateQueueConfig(config);
    return { status: 200, data: result };
  }, 'queue');
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
  return useMutationData(['markQueueNotificationAsRead'], async ({ notificationId }: {
    notificationId: string;
  }) => {
    const result = await markQueueNotificationAsRead(notificationId);
    return { status: 200, data: result };
  }, 'queueNotifications');
};

/**
 * Hook to send queue notification
 */
export const useSendQueueNotification = () => {
  return useMutationData(['sendQueueNotification'], async (notificationData: {
    patientId: string;
    type: 'CALLED' | 'DELAYED' | 'CANCELLED' | 'REMINDER';
    message: string;
    channels?: ('sms' | 'email' | 'push')[];
  }) => {
    const result = await sendQueueNotification(notificationData);
    return { status: 200, data: result };
  });
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
  return useMutationData(['estimateWaitTime'], async ({ queueType, priority }: {
    queueType: string;
    priority?: string;
  }) => {
    const result = await estimateWaitTime(queueType, priority);
    return { status: 200, data: result };
  });
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
  return useMutationData(['updateQueueCapacity'], async ({ queueType, capacity }: {
    queueType: string;
    capacity: number;
  }) => {
    const result = await updateQueueCapacity(queueType, capacity);
    return { status: 200, data: result };
  }, 'queueCapacity');
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
  return useMutationData(['exportQueueData'], async (filters: {
    startDate: string;
    endDate: string;
    format: 'csv' | 'excel' | 'pdf';
    queueType?: string;
  }) => {
    const result = await exportQueueData(filters);
    return { status: 200, data: result };
  });
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
  return useMutationData(['createQueueAlert'], async (alertData: {
    type: 'LONG_WAIT' | 'CAPACITY_FULL' | 'NO_SHOW' | 'DELAY';
    threshold: number;
    queueType?: string;
    enabled: boolean;
  }) => {
    const result = await createQueueAlert(alertData);
    return { status: 200, data: result };
  }, 'queueAlerts');
};

/**
 * Hook to update queue alert
 */
export const useUpdateQueueAlert = () => {
  return useMutationData(['updateQueueAlert'], async ({ alertId, updates }: {
    alertId: string;
    updates: {
      threshold?: number;
      enabled?: boolean;
    };
  }) => {
    const result = await updateQueueAlert(alertId, updates);
    return { status: 200, data: result };
  }, 'queueAlerts');
};

/**
 * Hook to delete queue alert
 */
export const useDeleteQueueAlert = () => {
  return useMutationData(['deleteQueueAlert'], async ({ alertId }: {
    alertId: string;
  }) => {
    const result = await deleteQueueAlert(alertId);
    return { status: 200, data: result };
  }, 'queueAlerts');
};
