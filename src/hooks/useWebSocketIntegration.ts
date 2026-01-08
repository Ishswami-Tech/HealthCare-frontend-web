"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketStore } from '@/stores/websocket.store';
import { useAppStore, useAppointmentsStore } from '@/stores';
import { websocketManager } from '@/lib/websocket/websocket-manager';
import { APP_CONFIG } from '@/lib/config/config';
import type { Appointment } from '@/stores/appointments.store';

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
  const { 
    updateAppointment, 
    addAppointment, 
    addPendingUpdate, 
    applyPendingUpdates 
  } = useAppointmentsStore();
  
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
        console.log('🆕 New appointment created:', data);
        addAppointment(data);
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['appointment-stats'] });
      });

      const unsubscribeAppointmentUpdated = subscribe('appointment:updated', (rawData: unknown) => {
        const data = rawData as { id: string; updates: Partial<Appointment> };
        console.log('📝 Appointment updated:', data);
        addPendingUpdate(data.id, data.updates);
        
        // Apply updates after a short delay to batch them
        setTimeout(() => {
          applyPendingUpdates();
          queryClient.invalidateQueries({ 
            queryKey: ['appointments'],
            exact: false 
          });
        }, 100);
      });

      const unsubscribeAppointmentDeleted = subscribe('appointment:deleted', (rawData: unknown) => {
        const data = rawData as { id: string };
        console.log('🗑️ Appointment deleted:', data);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      });

      const unsubscribeAppointmentStatusChanged = subscribe('appointment:status_changed', (rawData: unknown) => {
        const data = rawData as { id: string; status: string; timestamp: string };
        console.log('🔄 Appointment status changed:', data);
        updateAppointment(data.id, { 
          status: data.status as any,
          updatedAt: data.timestamp 
        });
        
        // Update specific appointment query
        queryClient.setQueryData(['appointment', data.id], (oldData: any) => {
          if (oldData) {
            return { ...oldData, status: data.status, updatedAt: data.timestamp };
          }
          return oldData;
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
      const unsubscribeQueueUpdate = subscribe('queue:update', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.log('📊 Queue updated:', data);
        // Invalidate queue-related queries
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        queryClient.invalidateQueries({ queryKey: ['queue-metrics'] });
      });

      const unsubscribeQueuePatientAdded = subscribe('queue:patient_added', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.log('👤 Patient added to queue:', data);
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
      });

      const unsubscribeQueuePatientRemoved = subscribe('queue:patient_removed', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        console.log('👤 Patient removed from queue:', data);
        queryClient.invalidateQueries({ queryKey: ['queue-status'] });
      });

      unsubscribeCallbacks.push(
        unsubscribeQueueUpdate,
        unsubscribeQueuePatientAdded,
        unsubscribeQueuePatientRemoved
      );
    }

    // Subscribe to general notifications
    const unsubscribeNotification = subscribe('notification', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      console.log('🔔 Received notification:', data);
      useAppStore.getState().addNotification({
        type: (data.type as 'error' | 'success' | 'warning' | 'info') || 'info',
        title: data.title as string,
        message: data.message as string,
        read: false,
      });
    });

    const unsubscribeSystemUpdate = subscribe('system:update', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      console.log('⚙️ System update:', data);
      // Handle system-wide updates
      if (data.type === 'maintenance') {
        useAppStore.getState().addNotification({
          type: 'warning',
          title: 'System Maintenance',
          message: data.message as string,
          persistent: true,
          read: false,
        });
      }
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
    addAppointment,
    updateAppointment,
    addPendingUpdate,
    applyPendingUpdates,
    queryClient
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
        queryClient.setQueryData(['queue-status', queueName], data.status);
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
  }, [isConnected, queueName, subscribe, queryClient]);

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
export { useRealTimeAppointments, useRealTimeAppointmentMutation } from './useRealTimeQueries';