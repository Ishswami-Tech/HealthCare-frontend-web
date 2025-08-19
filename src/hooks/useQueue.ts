import React from 'react';
import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  getQueue,
  getQueueStats,
  updateQueueStatus,
  callNextPatient,
  getQueueHistory,
  addToQueue,
  removeFromQueue,
  reorderQueue,
  getQueueAnalytics
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
 * Hook for queue notifications
 */
export const useQueueNotifications = () => {
  const [notifications, setNotifications] = React.useState<any[]>([]);

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
};
