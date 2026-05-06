"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useEffect, useCallback, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@/hooks/core';
import { useWebSocketStore, useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { APP_CONFIG } from '@/lib/config/config';
import { refreshToken } from '@/lib/actions/auth.server';
import {
  getQueueStatusQueryKey,
  normalizeQueueStatusSnapshot,
} from '@/lib/queue/queue-cache';
import { getAppointmentStatsQueryKey } from '@/lib/query/appointment-query-keys';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment } from '@/types/appointment.types';
import { useNotificationStore, Notification } from '@/stores/notifications.store';
import { showInfoToast, showWarningToast, TOAST_IDS } from '@/hooks/utils/use-toast';
import { logger } from '@/lib/utils/logger';

export function invalidateAppointmentQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['userUpcomingAppointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['appointment'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['video-appointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['video-appointment'], exact: false });
  void queryClient.invalidateQueries({
    queryKey: getAppointmentStatsQueryKey(),
    exact: false,
  });
  void queryClient.invalidateQueries({ queryKey: ['clinics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['myClinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicLocations'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicLocation'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicDoctors'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctors'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctor'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorSchedule'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorAvailability'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorAppointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorPatients'], exact: false });
}

export function invalidateBillingQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['billing'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-invoices'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['payments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-payments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['subscriptions'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['active-subscription'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-ledger'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['billing-analytics'], exact: false });
}

function getRealtimeAppointmentId(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  return String(record.appointmentId || record.id || '');
}

function mergeRealtimeAppointmentPayload(payload: unknown, appointment: Appointment): unknown {
  const targetId = getRealtimeAppointmentId(appointment);
  if (!targetId) {
    return payload;
  }

  const mergeItem = (item: unknown): unknown => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const itemRecord = item as Record<string, unknown>;
    const itemId = getRealtimeAppointmentId(itemRecord);
    if (!itemId || itemId !== targetId) {
      return item;
    }

    return {
      ...itemRecord,
      ...appointment,
      id: (appointment as any).id || itemRecord.id,
      appointmentId: (appointment as any).appointmentId || itemRecord.appointmentId || itemRecord.id,
      status: (appointment as any).status || itemRecord.status,
      rawStatus: (appointment as any).rawStatus || (appointment as any).status || itemRecord.rawStatus || itemRecord.status,
      confirmedSlotIndex:
        (appointment as any).confirmedSlotIndex ??
        (appointment as any).confirmed_slot_index ??
        itemRecord.confirmedSlotIndex ??
        itemRecord.confirmed_slot_index ??
        null,
      confirmed_slot_index:
        (appointment as any).confirmed_slot_index ??
        (appointment as any).confirmedSlotIndex ??
        itemRecord.confirmed_slot_index ??
        itemRecord.confirmedSlotIndex ??
        null,
      updatedAt: (appointment as any).updatedAt || (appointment as any).updated_at || itemRecord.updatedAt || nowIso(),
    };
  };

  if (Array.isArray(payload)) {
    return payload.map(mergeItem);
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const nextRecord: Record<string, unknown> = { ...record };
  let changed = false;

  if (Array.isArray(record.appointments)) {
    nextRecord.appointments = record.appointments.map(mergeItem);
    changed = true;
  }

  if (Array.isArray(record.data)) {
    nextRecord.data = record.data.map(mergeItem);
    changed = true;
  }

  if (record.data && typeof record.data === 'object') {
    const nestedData = record.data as Record<string, unknown>;
    if (Array.isArray(nestedData.appointments)) {
      nextRecord.data = {
        ...nestedData,
        appointments: nestedData.appointments.map(mergeItem),
      };
      changed = true;
    }
    if (Array.isArray(nestedData.data)) {
      nextRecord.data = {
        ...nestedData,
        data: nestedData.data.map(mergeItem),
      };
      changed = true;
    }
  }

  return changed ? nextRecord : payload;
}

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
  const session = useAuthStore((state) => state.session);
  const { addNotification } = useNotificationStore();
  
  const {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    subscribe,
    emit,
    clearError
  } = useWebSocketStore();

  const subscriptionsRef = useRef<(() => void)[]>([]);
  const hasSyncedOnConnectRef = useRef(false);
  const authRefreshInFlightRef = useRef(false);

  const logAppointmentNamespace = useCallback((action: string, context?: Record<string, unknown>) => {
    logger.info(`Appointment live websocket: ${action}`, {
      component: 'appointment-live-ws',
      action,
      ...context,
    });
  }, []);

  const {
    autoConnect = true,
    subscribeToQueues = true,
    subscribeToAppointments = true,
    tenantId = currentClinic?.id || session?.user?.clinicId || 'default',
    userId = user?.id || undefined,
    clinicId = currentClinic?.id || session?.user?.clinicId
  } = options;

  // Initialize WebSocket connection - Real-time enabled
  useEffect(() => {
    if (!autoConnect) return;

    // Create async function to handle WebSocket initialization
    const initializeWebSocket = async () => {
      try {
        // ⚠️ SECURITY: Use APP_CONFIG instead of hardcoded URLs
        const websocketUrl =
          APP_CONFIG.WEBSOCKET.URL ||
          APP_CONFIG.API.RAW_URL ||
          (typeof window !== 'undefined' ? window.location.origin : '');

        const accessToken = session?.access_token;
        if (!accessToken) {
          disconnect();
          clearError();
          return;
        }

        // Connect to main namespace
        connect(websocketUrl, {
          tenantId,
          userId,
          token: accessToken,
          withCredentials: true,
          autoReconnect: true,
          reconnectionAttempts: 5,
          onAuthError: async () => {
            if (authRefreshInFlightRef.current) return;
            authRefreshInFlightRef.current = true;
            try {
              const refreshedSession = await refreshToken();
              if (!refreshedSession?.access_token) {
                return;
              }

              useAuthStore.getState().setSession(refreshedSession);
              connect(websocketUrl, {
                tenantId,
                userId,
                token: refreshedSession.access_token,
                withCredentials: true,
                autoReconnect: true,
                reconnectionAttempts: 5,
              });
            } catch (refreshError) {
              logger.warn('Socket auth refresh failed', {
                component: 'appointment-live-ws',
                error: refreshError instanceof Error ? refreshError.message : String(refreshError),
              });
            } finally {
              authRefreshInFlightRef.current = false;
            }
          },
        });

      } catch (error) {
      }
    };

    // Call the async function
    initializeWebSocket();

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [autoConnect, tenantId, userId, session?.access_token, connect, disconnect, clearError]);

  // Refresh once on connect so missed payment/slot changes are reconciled from the backend snapshot.
  useEffect(() => {
    if (!isConnected) {
      hasSyncedOnConnectRef.current = false;
      return;
    }

    if (hasSyncedOnConnectRef.current) return;
    hasSyncedOnConnectRef.current = true;
    logAppointmentNamespace('sync-on-connect');
    invalidateAppointmentQueryFamilies(queryClient);
  }, [isConnected, logAppointmentNamespace, queryClient]);

  // Subscribe to real-time events once connected
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribeCallbacks: (() => void)[] = [];

    // Subscribe to appointment updates
    if (subscribeToAppointments && clinicId) {
      const invalidateAppointmentQueries = () => {
        invalidateAppointmentQueryFamilies(queryClient);
      };

      const unsubscribeAppointmentCreated = subscribe('appointment.created', (rawData: unknown) => {
        const data = rawData as Appointment & { clinicId?: string; doctorId?: string };
        logAppointmentNamespace('appointment.created', {
          appointmentId: (data as { appointmentId?: string }).appointmentId || data?.id || '',
          clinicId: data.clinicId,
          doctorId: data.doctorId,
        });
        invalidateAppointmentQueries();
      });

      const unsubscribeAppointmentUpdated = subscribe('appointment.updated', (rawData: unknown) => {
        const data = rawData as { appointmentId?: string; id?: string; appointment?: Appointment; updates?: Partial<Appointment> };
        const appointmentRecord = data.appointment as { appointmentId?: string; id?: string } | undefined;
        const appointmentId = String(appointmentRecord?.appointmentId || data.appointmentId || data.id || appointmentRecord?.id || '');
        const patch = (data.appointment || data.updates || {}) as Appointment;
        logAppointmentNamespace('appointment.updated', {
          appointmentId,
          clinicId: (data.appointment as { clinicId?: string } | undefined)?.clinicId,
          doctorId: (data.appointment as { doctorId?: string } | undefined)?.doctorId,
        });
        if (appointmentId) {
          queryClient.setQueryData(['appointment', appointmentId], (oldData: Appointment | undefined) =>
            oldData ? { ...oldData, ...patch } : (data.appointment as Appointment | undefined) || oldData
          );
          queryClient.setQueryData(['video-appointment', appointmentId], (oldData: Appointment | undefined) =>
            oldData ? { ...oldData, ...patch } : (data.appointment as Appointment | undefined) || oldData
          );
          queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
            mergeRealtimeAppointmentPayload(current, {
              ...patch,
              id: appointmentId,
              appointmentId,
            } as Appointment)
          );
          queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
            mergeRealtimeAppointmentPayload(current, {
              ...patch,
              id: appointmentId,
              appointmentId,
            } as Appointment)
          );
          queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
            mergeRealtimeAppointmentPayload(current, {
              ...patch,
              id: appointmentId,
              appointmentId,
            } as Appointment)
          );
          queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
            mergeRealtimeAppointmentPayload(current, {
              ...patch,
              id: appointmentId,
              appointmentId,
            } as Appointment)
          );
          queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
            mergeRealtimeAppointmentPayload(current, {
              ...patch,
              id: appointmentId,
              appointmentId,
            } as Appointment)
          );
        }
        invalidateAppointmentQueries();
      });

      const unsubscribeAppointmentDeleted = subscribe('appointment.deleted', (rawData: unknown) => {
        const data = rawData as { id?: string; appointmentId?: string };
        const appointmentId = String(data.appointmentId || data.id || '');
        logAppointmentNamespace('appointment.deleted', { appointmentId });
        if (appointmentId) {
          void queryClient.removeQueries({ queryKey: ['appointment', appointmentId], exact: true });
        }
        invalidateAppointmentQueries();
      });

      const unsubscribeAppointmentStatusChanged = subscribe('appointment.status_changed', (rawData: unknown) => {
        const data = rawData as { id: string; status: string; timestamp: string };
        logAppointmentNamespace('appointment.status_changed', {
          appointmentId: data.id,
          status: data.status,
        });
        queryClient.setQueryData(['appointment', data.id], (oldData: any) => {
          if (oldData) {
            return { ...oldData, status: data.status, updatedAt: data.timestamp };
          }
          return oldData;
        });
        invalidateAppointmentQueries();
      });

      const appointmentLifecycleEvents = [
        'appointment.reassigned',
        'appointment.checked_in',
        'appointment.confirmed',
        'appointment.rescheduled',
        'appointment.cancelled',
        'appointment.completed',
        'appointment.slot.confirmed',
        'appointment.consultation_started',
        'appointment.noshow',
      ] as const;

      const unsubscribeAppointmentLifecycleEvents = appointmentLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as { appointmentId?: string; id?: string; clinicId?: string; appointment?: Appointment };
          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          const appointmentId = String(data.appointmentId || data.id || '');
          logAppointmentNamespace(event, {
            appointmentId,
            clinicId: data.clinicId,
          });
          if (appointmentId) {
            const updatedAppointment = {
              ...(data.appointment || {}),
              id: appointmentId,
              appointmentId,
            } as Appointment;
            queryClient.setQueryData(['appointment', appointmentId], (oldData: Appointment | undefined) =>
              oldData ? { ...oldData, ...updatedAppointment } : updatedAppointment
            );
            queryClient.setQueryData(['video-appointment', appointmentId], (oldData: Appointment | undefined) =>
              oldData ? { ...oldData, ...updatedAppointment } : updatedAppointment
            );
            queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
          }
          invalidateAppointmentQueries();
          invalidateBillingQueryFamilies(queryClient);
        })
      );

      const paymentLifecycleEvents = [
        'billing.payment.updated',
        'billing.invoice.paid',
        'payment.completed',
      ] as const;

      const unsubscribePaymentLifecycleEvents = paymentLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as {
            clinicId?: string;
            appointmentId?: string;
            invoiceId?: string;
            paymentId?: string;
            appointment?: Appointment;
          };

          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          const appointmentRecord = data.appointment as { appointmentId?: string; id?: string } | undefined;
          const appointmentId = String(appointmentRecord?.appointmentId || data.appointmentId || appointmentRecord?.id || '');
          logAppointmentNamespace(event, {
            appointmentId,
            clinicId: data.clinicId,
          });
          if (appointmentId) {
            const updatedAppointment = {
              ...(data.appointment || {}),
              id: appointmentId,
              appointmentId,
            } as Appointment;
            queryClient.setQueryData(['appointment', appointmentId], (oldData: Appointment | undefined) =>
              oldData ? { ...oldData, ...updatedAppointment } : updatedAppointment
            );
            queryClient.setQueryData(['video-appointment', appointmentId], (oldData: Appointment | undefined) =>
              oldData ? { ...oldData, ...updatedAppointment } : updatedAppointment
            );
            queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
            queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
              mergeRealtimeAppointmentPayload(current, updatedAppointment)
            );
          }

          invalidateAppointmentQueries();
          invalidateBillingQueryFamilies(queryClient);
        })
      );

      unsubscribeCallbacks.push(
        unsubscribeAppointmentCreated,
        unsubscribeAppointmentUpdated,
        unsubscribeAppointmentDeleted,
        unsubscribeAppointmentStatusChanged,
        ...unsubscribeAppointmentLifecycleEvents,
        ...unsubscribePaymentLifecycleEvents
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
        invalidateQueueQueries(data);
      });

      const unsubscribeQueueUpdated = subscribe('queue.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueuePositionUpdated = subscribe('queue.position.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueuePatientAdded = subscribe('queue:patient_added', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueuePatientRemoved = subscribe('queue:patient_removed', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeEnterpriseQueueUpdated = subscribe('appointment.queue.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeEnterpriseQueuePosition = subscribe(
        'appointment.queue.position.updated',
        (rawData: unknown) => {
          const data = rawData as Record<string, unknown>;
          invalidateQueueQueries(data);
        }
      );

      const unsubscribeAppointmentReassigned = subscribe('appointment.reassigned', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeAppointmentCheckedIn = subscribe('appointment.checked_in', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueueMetrics = subscribe('queue_metrics_update', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
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
          invalidateMedicineDeskQueries();
        }
      );

      unsubscribeCallbacks.push(
        unsubscribeQueueUpdate,
        unsubscribeQueueUpdated,
        unsubscribeQueuePositionUpdated,
        unsubscribeQueuePatientAdded,
        unsubscribeQueuePatientRemoved,
        unsubscribeEnterpriseQueueUpdated,
        unsubscribeEnterpriseQueuePosition,
        unsubscribeAppointmentReassigned,
        unsubscribeAppointmentCheckedIn,
        unsubscribeQueueMetrics,
        unsubscribeMedicineDeskUpdated
      );
    }

    // Subscribe to general notifications
    // Backend handles push/email/SMS/WhatsApp delivery
    // Frontend only shows in-app notification and toast for reading
    const unsubscribeNotification = subscribe('notification', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      
      if (!userId) return;

      // Map WebSocket notification to store format
      const notificationType = (data.type || data.category || 'SYSTEM') as Notification['type'];
      const notification: Notification = {
        id: data.id as string || `ws-${Date.now()}-${Math.random()}`,
        userId,
        type: notificationType,
        title: (data.title as string) || 'New Notification',
        message: (data.message as string) || (data.body as string) || '',
        data: {
          ...((data.data || data.metadata || {}) as Record<string, any>),
          url: (data.url as string) || (data.link as string),
        },
        isRead: false,
        createdAt: (data.createdAt as string) || nowIso(),
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
      if (data.type !== 'maintenance' || !userId) return;

      const notification: Notification = {
        id: `system-${Date.now()}-${Math.random()}`,
        userId,
        type: 'SYSTEM',
        title: 'System Maintenance',
        message: (data.message as string) || 'System maintenance scheduled',
        data: (data.data as Record<string, any>) || {},
        isRead: false,
        createdAt: nowIso(),
      };
      
      // Show toast
      showWarningToast(notification.title, {
        id: TOAST_IDS.NOTIFICATION.NEW,
        description: notification.message,
        duration: 5000,
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
    userId
  ]);

  // Auto-subscribe to relevant channels once connected
  useEffect(() => {
    if (!isConnected || !clinicId) return;

    emit('joinRoom', { room: `clinic:${clinicId}` });

    if (subscribeToAppointments && userId) {
      emit('joinRoom', { room: `user:${userId}` });
    }
  }, [isConnected, clinicId, userId, subscribeToAppointments, emit]);

  // Utility functions
  const reconnect = useCallback(() => {
    const { reconnect: reconnectSocket } = useWebSocketStore.getState();
    reconnectSocket();
  }, []);

  const emitEvent = useCallback((event: string, data: Record<string, unknown>) => {
    if (isConnected) {
      emit(event, data);
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
  const normalizedQueueName = queueName.trim();

  const subscribeToQueue = useCallback((filters?: Record<string, unknown>) => {
    if (isConnected && normalizedQueueName) {
      emit('subscribe_queue', { queueName: normalizedQueueName, filters });
    }
  }, [isConnected, emit, normalizedQueueName]);

  const unsubscribeFromQueue = useCallback(() => {
    if (isConnected && normalizedQueueName) {
      emit('unsubscribe_queue', { queueName: normalizedQueueName });
    }
  }, [isConnected, emit, normalizedQueueName]);

  const getQueueMetrics = useCallback((detailed = false) => {
    if (isConnected && normalizedQueueName) {
      emit('get_queue_metrics', { queueNames: [normalizedQueueName], detailed });
    }
  }, [isConnected, emit, normalizedQueueName]);

  useEffect(() => {
    if (!isConnected || !normalizedQueueName) return;

    const unsubscribeQueueStatus = subscribe('queue_status', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      if (data.queueName === normalizedQueueName) {
        queryClient.setQueryData(
          getQueueStatusQueryKey(
            currentClinic?.id,
            typeof data.locationId === 'string' ? data.locationId : undefined,
            normalizedQueueName
          ),
          normalizeQueueStatusSnapshot(data.status)
        );
      }
    });

    const unsubscribeQueueMetrics = subscribe('queue_metrics_update', (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;
      if (data.queueName === normalizedQueueName) {
        queryClient.setQueryData(['queue-metrics', normalizedQueueName], data.metrics);
      }
    });

    return () => {
      unsubscribeQueueStatus();
      unsubscribeQueueMetrics();
    };
  }, [currentClinic?.id, isConnected, queryClient, normalizedQueueName, subscribe]);

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
  const { currentClinic } = useAppStore();

  const subscribeToAppointmentUpdates = useCallback((filters?: { 
    doctorId?: string; 
    patientId?: string; 
    date?: string; 
  }) => {
    if (isConnected && currentClinic) {
      emit('joinRoom', {
        room: `clinic:${currentClinic.id}`,
        ...(filters || {}),
      } as Record<string, unknown>);
    }
  }, [isConnected, emit, currentClinic]);

  const notifyAppointmentChange = useCallback((appointmentId: string, action: string, data?: Record<string, unknown>) => {
    if (isConnected) {
      emit('appointment_action', {
        appointmentId,
        action,
        data,
        timestamp: nowIso(),
      });
    }
  }, [isConnected, emit]);

  return {
    subscribeToAppointmentUpdates,
    notifyAppointmentChange,
    isConnected,
  };
}
