"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@/hooks/core';
import { useWebSocketStore, useAppStore } from '@/stores';
import { websocketManager } from '@/lib/config/websocket';
import { APP_CONFIG } from '@/lib/config/config';
import {
  getQueueStatusQueryKey,
  normalizeQueueStatusSnapshot,
} from '@/lib/queue/queue-cache';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment } from '@/types/appointment.types';
import { useNotificationStore, Notification } from '@/stores/notifications.store';
import { showInfoToast, showWarningToast, TOAST_IDS } from '@/hooks/utils/use-toast';

export interface UseWebSocketIntegrationOptions {
  tenantId?: string | undefined;
  userId?: string | undefined;
  clinicId?: string | undefined;
  autoConnect?: boolean;
  subscribeToQueues?: boolean;
  subscribeToAppointments?: boolean;
}

export function useWebSocketIntegration(options: UseWebSocketIntegrationOptions = {}) {
  const queryClient = useQueryClient();
  const { user, currentClinic } = useAppStore();
  const { addNotification } = useNotificationStore();
  
  const {
    isConnected,
    connectionStatus,
    error,
    connect,
    subscribe,
    emit,
    clearError
  } = useWebSocketStore();

  const subscriptionsRef = useRef<(() => void)[]>([]);

  const {
    autoConnect = true,
    subscribeToQueues = true,
    subscribeToAppointments = true,
    tenantId = currentClinic?.id || 'default',
    userId = user?.id || 'anonymous',
    clinicId = currentClinic?.id
  } = options;

  // Initialize WebSocket connection - Real-time enabled
  useEffect(() => {
    if (!autoConnect || !user) return;

    // Create async function to handle WebSocket initialization
    const initializeWebSocket = async () => {
      try {
        websocketManager.initialize({
          autoConnect: false,
        });

        // ✅ SECURITY: Use secure token access (will be migrated to httpOnly cookies)
        const { getAccessToken } = await import('@/lib/utils/token-manager');
        const token = await getAccessToken() || undefined;

        // ⚠️ SECURITY: Use APP_CONFIG instead of hardcoded URLs
        const websocketUrl = APP_CONFIG.WEBSOCKET.URL;
        if (!websocketUrl) {
          throw new Error('NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL must be set in environment variables');
        }

        // Connect to main namespace
        connect(websocketUrl, {
          tenantId,
          userId,
          token,
          autoReconnect: true,
          reconnectionAttempts: 5,
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    // Call the async function
    initializeWebSocket();

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [autoConnect, user, tenantId, userId, connect]);

  // Subscribe to real-time events once connected
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCallbacks: (() => void)[] = [];

    // Subscribe to appointment updates
    if (subscribeToAppointments && clinicId) {
      const unsubscribeAppointmentCreated = subscribe('appointment:created', (rawData: unknown) => {
        const data = rawData as Appointment;
        console.debug('🆕 New appointment created:', data);
        void queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: ['appointment-stats'], exact: false });
      });

      const unsubscribeAppointmentUpdated = subscribe('appointment:updated', (rawData: unknown) => {
        const data = rawData as { id: string; updates: Partial<Appointment> };
        console.debug('📝 Appointment updated:', data);
        queryClient.setQueryData(['appointment', data.id], (oldData: Appointment | undefined) =>
          oldData ? { ...oldData, ...data.updates } : oldData
        );
        void queryClient.invalidateQueries({
          queryKey: ['appointments'],
          exact: false 
        });
        void queryClient.invalidateQueries({
          queryKey: ['myAppointments'],
          exact: false
        });
      });

      const unsubscribeAppointmentDeleted = subscribe('appointment:deleted', (rawData: unknown) => {
        const data = rawData as { id: string };
        console.debug('🗑️ Appointment deleted:', data);
        void queryClient.removeQueries({ queryKey: ['appointment', data.id], exact: true });
        void queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
      });

      const unsubscribeAppointmentStatusChanged = subscribe('appointment:status_changed', (rawData: unknown) => {
        const data = rawData as { id: string; status: string; timestamp: string };
        console.debug('🔄 Appointment status changed:', data);
        queryClient.setQueryData(['appointment', data.id], (oldData: any) => {
          if (oldData) {
            return { ...oldData, status: data.status, updatedAt: data.timestamp };
          }
          return oldData;
        });
        void queryClient.invalidateQueries({
          queryKey: ['appointments'],
          exact: false
        });
        void queryClient.invalidateQueries({
          queryKey: ['myAppointments'],
          exact: false
        });
      });

      unsubscribeCallbacks.push(
        unsubscribeAppointmentCreated,
        unsubscribeAppointmentUpdated,
        unsubscribeAppointmentDeleted,
        unsubscribeAppointmentStatusChanged
      );
    }

    // Subscribe to queue updates
    if (subscribeToQueues && clinicId) {
      const invalidateQueueQueries = (payload?: Record<string, unknown>) => {
        const payloadLocationId =
          typeof payload?.locationId === 'string' ? payload.locationId : undefined;
        const payloadQueueName =
          typeof payload?.queueName === 'string' ? payload.queueName : undefined;

        void queryClient.invalidateQueries({ queryKey: ['queue'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        queryClient.invalidateQueries({ queryKey: ['queue-metrics'] });
        queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });

        if (payloadLocationId || payloadQueueName) {
          void queryClient.invalidateQueries({
            queryKey: getQueueStatusQueryKey(currentClinic?.id, payloadLocationId, payloadQueueName),
            exact: true,
          });
        }
      };

      const invalidateMedicineDeskQueries = () => {
        queryClient.invalidateQueries({ queryKey: ['prescriptions'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['medicineDeskQueue'], exact: false });
        queryClient.invalidateQueries({ queryKey: ['pharmacyStats'], exact: false });
      };

      const unsubscribeQueueUpdate = subscribe('queue:update', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.debug('📊 Queue updated:', data);
        invalidateQueueQueries(data);
      });

      const unsubscribeQueuePatientAdded = subscribe('queue:patient_added', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.debug('👤 Patient added to queue:', data);
        invalidateQueueQueries(data);
      });

      const unsubscribeQueuePatientRemoved = subscribe('queue:patient_removed', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.debug('👤 Patient removed from queue:', data);
        invalidateQueueQueries(data);
      });

      const unsubscribeEnterpriseQueueUpdated = subscribe('appointment.queue.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.debug('📊 Enterprise queue updated:', data);
        invalidateQueueQueries(data);
      });

      const unsubscribeEnterpriseQueuePosition = subscribe(
        'appointment.queue.position.updated',
        (rawData: unknown) => {
          const data = rawData as Record<string, unknown>;
          console.debug('📍 Queue position updated:', data);
          invalidateQueueQueries(data);
        }
      );

      const unsubscribeQueueMetrics = subscribe('queue_metrics_update', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.debug('📈 Queue metrics updated:', data);
        if (currentClinic?.id) {
          const payloadLocationId =
            typeof data.locationId === 'string' ? data.locationId : undefined;
          const payloadQueueName =
            typeof data.queueName === 'string' ? data.queueName : undefined;
          const snapshot = normalizeQueueStatusSnapshot(data.status || data.metrics || data);

          queryClient.setQueryData(
            getQueueStatusQueryKey(currentClinic.id, payloadLocationId, payloadQueueName),
            snapshot
          );
        }

        invalidateQueueQueries(data);
      });

      const unsubscribeMedicineDeskUpdated = subscribe(
        'pharmacy.medicine_desk.updated',
        (rawData: unknown) => {
          const data = rawData as Record<string, unknown>;
          console.debug('💊 Medicine desk queue updated:', data);
          invalidateMedicineDeskQueries();
        }
      );

      unsubscribeCallbacks.push(
        unsubscribeQueueUpdate,
        unsubscribeQueuePatientAdded,
        unsubscribeQueuePatientRemoved,
        unsubscribeEnterpriseQueueUpdated,
        unsubscribeEnterpriseQueuePosition,
        unsubscribeQueueMetrics,
        unsubscribeMedicineDeskUpdated
      );
    }

    // Subscribe to general notifications
    // Backend handles push/email/SMS/WhatsApp delivery
    // Frontend only shows in-app notification and toast for reading
    const unsubscribeNotification = subscribe('notification', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      
      if (!user?.id) return;

      // Map WebSocket notification to store format
      const notificationType = (data.type || data.category || 'SYSTEM') as Notification['type'];
      const notification: Notification = {
        id: data.id as string || `ws-${Date.now()}-${Math.random()}`,
        userId: user.id,
        type: notificationType,
        title: (data.title as string) || 'New Notification',
        message: (data.message as string) || (data.body as string) || '',
        data: {
          ...((data.data || data.metadata || {}) as Record<string, any>),
          url: (data.url as string) || (data.link as string),
        },
        isRead: false,
        createdAt: (data.createdAt as string) || new Date().toISOString(),
      };
      
      // Show toast for important notification types
      if (notificationType === 'SYSTEM' || notificationType === 'APPOINTMENT') {
        showInfoToast(notification.title, {
          id: TOAST_IDS.NOTIFICATION.NEW,
          description: notification.message,
          duration: 5000,
        });
      }
      
      // Add to notification store for reading
      addNotification(notification);
    });

    const unsubscribeSystemUpdate = subscribe('system:update', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      
      // Handle system-wide updates
      // Backend handles delivery via all channels
      // Frontend only shows in-app notification and toast for reading
      if (data.type !== 'maintenance' || !user?.id) return;

      const notification: Notification = {
        id: `system-${Date.now()}-${Math.random()}`,
        userId: user.id,
        type: 'SYSTEM',
        title: 'System Maintenance',
        message: (data.message as string) || 'System maintenance scheduled',
        data: (data.data as Record<string, any>) || {},
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      
      // Show toast
      showWarningToast(notification.title, {
        id: TOAST_IDS.NOTIFICATION.NEW,
        description: notification.message,
        duration: 10000,
      });
      
      // Add to notification store for reading
      addNotification(notification);
    });

    unsubscribeCallbacks.push(unsubscribeNotification, unsubscribeSystemUpdate);

    // Store unsubscribe callbacks
    subscriptionsRef.current = unsubscribeCallbacks;

    return () => {
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [
    isConnected,
    subscribeToAppointments,
    subscribeToQueues,
    clinicId,
    subscribe,
    queryClient,
    addNotification,
    user?.id
  ]);

  // Auto-subscribe to relevant channels once connected
  useEffect(() => {
    if (!isConnected || !clinicId) return;

    // Subscribe to clinic-specific updates
    emit('join_clinic', { clinicId });

    if (subscribeToQueues) {
      emit('subscribe_queue_updates', { clinicId });
    }

    if (subscribeToAppointments) {
      emit('subscribe_appointment_updates', { clinicId, userId });
    }
  }, [isConnected, clinicId, userId, subscribeToQueues, subscribeToAppointments, emit]);

  // Utility functions
  const reconnect = useCallback(() => {
    websocketManager.reconnect();
  }, []);

  const emitEvent = useCallback((event: string, data: Record<string, unknown>) => {
    if (isConnected) {
      emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }, [isConnected, emit]);

  const subscribeToEvent = useCallback((event: string, callback: (data: unknown) => void) => {
    return subscribe(event, callback);
  }, [subscribe]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    error,
    
    // Actions
    reconnect,
    clearError,
    emit: emitEvent,
    subscribe: subscribeToEvent,
    
    // Utilities
    isReady: isConnected && !error,
  };
}

// Hook for queue-specific WebSocket operations
export function useQueueWebSocketIntegration(queueName: string) {
  const { isConnected, emit, subscribe } = useWebSocketStore();
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();

  const subscribeToQueue = useCallback((filters?: Record<string, unknown>) => {
    if (isConnected) {
      emit('subscribe_queue', { queueName, filters });
    }
  }, [isConnected, emit, queueName]);

  const unsubscribeFromQueue = useCallback(() => {
    if (isConnected) {
      emit('unsubscribe_queue', { queueName });
    }
  }, [isConnected, emit, queueName]);

  const getQueueMetrics = useCallback((detailed = false) => {
    if (isConnected) {
      emit('get_queue_metrics', { queueNames: [queueName], detailed });
    }
  }, [isConnected, emit, queueName]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeQueueStatus = subscribe('queue_status', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      if (data.queueName === queueName) {
        queryClient.setQueryData(
          getQueueStatusQueryKey(
            currentClinic?.id,
            typeof data.locationId === 'string' ? data.locationId : undefined,
            queueName
          ),
          normalizeQueueStatusSnapshot(data.status)
        );
      }
    });

    const unsubscribeQueueMetrics = subscribe('queue_metrics_update', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      if (data.queueName === queueName) {
        queryClient.setQueryData(['queue-metrics', queueName], data.metrics);
      }
    });

    return () => {
      unsubscribeQueueStatus();
      unsubscribeQueueMetrics();
    };
  }, [currentClinic?.id, isConnected, queryClient, queueName, subscribe]);

  return {
    subscribeToQueue,
    unsubscribeFromQueue,
    getQueueMetrics,
    isConnected,
  };
}

// Hook for appointment-specific WebSocket operations
export function useAppointmentWebSocketIntegration() {
  const { isConnected, emit } = useWebSocketStore();
  const { user, currentClinic } = useAppStore();

  const subscribeToAppointmentUpdates = useCallback((filters?: { 
    doctorId?: string; 
    patientId?: string; 
    date?: string; 
  }) => {
    if (isConnected && currentClinic) {
      emit('subscribe_appointment_updates', {
        clinicId: currentClinic.id,
        userId: user?.id,
        ...filters,
      });
    }
  }, [isConnected, emit, currentClinic, user]);

  const notifyAppointmentChange = useCallback((appointmentId: string, action: string, data?: Record<string, unknown>) => {
    if (isConnected) {
      emit('appointment_action', {
        appointmentId,
        action,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  }, [isConnected, emit]);

  return {
    subscribeToAppointmentUpdates,
    notifyAppointmentChange,
    isConnected,
  };
}

// Re-export from useRealTimeQueries for convenience
// Real-time appointment hooks are exported from useRealTimeQueries
// Import them directly: import { useRealTimeAppointments } from '@/hooks/realtime/useRealTimeQueries';
