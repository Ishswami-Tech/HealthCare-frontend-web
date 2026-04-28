"use client";

import { useEffect, useRef } from 'react';
import { useQueryData, useOptimisticMutation, useQueryClient } from '@/hooks/core';
import { invalidateAppointmentQueryFamilies } from './useWebSocketIntegration';
import { useWebSocketContext, useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useAppStore } from '@/stores';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  getQueueStatusQueryKey,
  normalizeQueueStatusSnapshot,
  type QueueStatusSnapshot,
} from '@/lib/queue/queue-cache';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment, AppointmentFilters } from '@/types/appointment.types';
import {
  getAppointmentQueryKey,
  getAppointmentStatsQueryKey,
} from '@/lib/query/appointment-query-keys';

// Enhanced query hooks with real-time WebSocket integration

export function useRealTimeAppointments(filters: AppointmentFilters = {}) {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { session } = useAuth();
  const { isConnected, subscribe } = useWebSocketContext();
  const subscriptionRef = useRef<(() => void) | null>(null);
  const sessionUser = session?.user as { clinicId?: string; clinic?: { id?: string } } | undefined;
  const resolvedClinicId = currentClinic?.id || sessionUser?.clinicId || sessionUser?.clinic?.id;
  const hasDoctorFilter = Object.prototype.hasOwnProperty.call(filters, 'doctorId');
  const doctorFilterReady = !hasDoctorFilter || Boolean(filters.doctorId);

  const query = useQueryData(
    getAppointmentQueryKey(resolvedClinicId, filters),
    async () => {
      if (!resolvedClinicId) throw new Error('No clinic selected');
      
      // Use actual API endpoint from config
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      const params = new URLSearchParams({ clinicId: resolvedClinicId });
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      });
      
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.get<Appointment[]>(
        `${API_ENDPOINTS.APPOINTMENTS.GET_ALL}?${params}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch appointments');
      }
      
      // Handle both array and object with appointments property
      const appointments = Array.isArray(response.data) 
        ? response.data 
        : (response.data as { appointments?: Appointment[] }).appointments || [];
      
      return { success: true, data: appointments };
    },
    {
      enabled: !!resolvedClinicId && doctorFilterReady,
      staleTime: 60 * 1000, // 1 minute (optimized for 10M users - real-time updates reduce need for frequent refetch)
      gcTime: 10 * 60 * 1000, // 10 minutes (increased for 10M users)
      refetchOnWindowFocus: false,
    }
  );

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isConnected || !resolvedClinicId) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Subscribe to appointment updates for this clinic
    const invalidateAppointmentQueries = () => {
      invalidateAppointmentQueryFamilies(queryClient);
    };

    const subscribeAppointmentEvent = (
      event: string,
      handler: (rawData: unknown) => void
    ) => {
      return subscribe(event, (rawData: unknown) => {
        const data = rawData as { clinicId?: string; appointmentId?: string; appointment?: Appointment };
        if (data.clinicId && data.clinicId !== resolvedClinicId) return;
        handler(rawData);
      });
    };

    const unsubscribeCreated = subscribeAppointmentEvent('appointment.created', (rawData: unknown) => {
      const data = rawData as { appointment?: Appointment; appointmentId?: string };
      const appointment = data.appointment || (data as unknown as Appointment);
      if (appointment?.id) {
        queryClient.setQueryData(['appointment', appointment.id], appointment);
      }
      invalidateAppointmentQueries();
    });

    const unsubscribeUpdated = subscribeAppointmentEvent('appointment.updated', (rawData: unknown) => {
      const data = rawData as { appointment?: Appointment; appointmentId?: string };
      const appointment = data.appointment || (data as unknown as Appointment);
      const appointmentId = String(appointment?.id || data.appointmentId || '');
      if (appointmentId) {
        queryClient.setQueryData(['appointment', appointmentId], (oldData: Appointment | undefined) =>
          oldData ? { ...oldData, ...appointment } : appointment
        );
        queryClient.setQueryData(['video-appointment', appointmentId], (oldData: Appointment | undefined) =>
          oldData ? { ...oldData, ...appointment } : appointment
        );
      }
      invalidateAppointmentQueries();
    });

    const unsubscribeDeleted = subscribeAppointmentEvent('appointment.deleted', (rawData: unknown) => {
      const data = rawData as { appointmentId?: string; id?: string };
      const appointmentId = String(data.appointmentId || data.id || '');
      if (appointmentId) {
        void queryClient.removeQueries({ queryKey: ['appointment', appointmentId], exact: true });
      }
      invalidateAppointmentQueries();
    });

    const unsubscribeStatusChanged = subscribeAppointmentEvent('appointment.status_changed', () => {
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

    const unsubscribeLifecycleEvents = appointmentLifecycleEvents.map((event) =>
      subscribeAppointmentEvent(event, () => {
        invalidateAppointmentQueries();
      })
    );

    const paymentLifecycleEvents = [
      'billing.payment.updated',
      'billing.invoice.paid',
      'payment.completed',
    ] as const;

    const unsubscribePaymentLifecycleEvents = paymentLifecycleEvents.map((event) =>
      subscribeAppointmentEvent(event, (rawData: unknown) => {
        const data = rawData as { appointmentId?: string; id?: string; appointment?: Appointment };
        const appointmentId = String(data.appointment?.id || data.id || data.appointmentId || '');
        if (appointmentId) {
          queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId], exact: false });
          queryClient.invalidateQueries({ queryKey: ['video-appointment', appointmentId], exact: false });
        }
        invalidateAppointmentQueries();
      })
    );

    subscriptionRef.current = () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStatusChanged();
      unsubscribeLifecycleEvents.forEach((unsubscribe) => unsubscribe());
      unsubscribePaymentLifecycleEvents.forEach((unsubscribe) => unsubscribe());
    };

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [isConnected, resolvedClinicId, filters, subscribe, queryClient]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeAppointmentStats() {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { isConnected, subscribe } = useWebSocketContext();

  const query = useQueryData(
    getAppointmentStatsQueryKey(currentClinic?.id),
    async () => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.get<Record<string, unknown>>(
        `${API_ENDPOINTS.APPOINTMENTS.ANALYTICS}?clinicId=${currentClinic.id}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch appointment stats');
      }
      
      return { success: true, data: response.data };
    },
    {
      enabled: !!currentClinic,
      staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
      gcTime: 15 * 60 * 1000, // 15 minutes
      refetchInterval: isConnected ? false : 10 * 60 * 1000, // 10 minutes if not real-time (increased for 10M users)
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!isConnected || !currentClinic) return;

    const invalidateStats = (rawData: unknown) => {
      const data = rawData as { clinicId?: string };
      if (!data.clinicId || data.clinicId === currentClinic.id) {
        queryClient.invalidateQueries({
          queryKey: getAppointmentStatsQueryKey(currentClinic.id),
          exact: false,
        });
      }
    };

    const unsubscribeUpdated = subscribe('appointment.updated', invalidateStats);
    const unsubscribeCreated = subscribe('appointment.created', invalidateStats);
    const unsubscribeDeleted = subscribe('appointment.deleted', invalidateStats);

    return () => {
      unsubscribeUpdated();
      unsubscribeCreated();
      unsubscribeDeleted();
    };
  }, [isConnected, currentClinic, subscribe, queryClient]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeQueueStatus(queueName?: string, locationId?: string) {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { isConnected } = useWebSocketStatus();
  const { subscribe } = useWebSocketContext();
  const queryKey = getQueueStatusQueryKey(currentClinic?.id, locationId, queueName);

  const query = useQueryData(
    queryKey,
    async () => {
      if (!currentClinic) throw new Error('No clinic selected');

      const { API_ENDPOINTS } = await import('@/lib/config/config');
      const params = new URLSearchParams({
        locationId: locationId || currentClinic.id,
      });
      if (queueName) params.append('queueName', queueName);

      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.get<Record<string, unknown>>(
        `${API_ENDPOINTS.QUEUE.STATS}?${params}`
      );

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch queue status');
      }

      return normalizeQueueStatusSnapshot(response.data);
    },
    {
      enabled: !!currentClinic && !!locationId,
      staleTime: 30 * 1000, // 30 seconds (optimized for 10M users)
      gcTime: 5 * 60 * 1000, // 5 minutes
      // Keep queue status fresh even when the websocket is connected because
      // the backend socket layer does not emit the same location-level stats
      // shape that this hook reads from the API.
      refetchInterval: 15 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (!isConnected || !currentClinic) return;

    const invalidateQueueStatus = () => {
      queryClient.invalidateQueries({
        queryKey: getQueueStatusQueryKey(currentClinic.id, locationId, queueName),
        exact: false,
      });
    };

    const queueEvents = [
      'queue_status_update',
      'queue.updated',
      'queue.position.updated',
      'queue_metrics_update',
    ] as const;

    const unsubscribes = queueEvents.map((event) =>
      subscribe(event, (rawData: unknown) => {
        const data = rawData as {
          clinicId?: string;
          queueName?: string;
          locationId?: string;
          status?: QueueStatusSnapshot;
        };

        if (data.clinicId && data.clinicId !== currentClinic.id) {
          return;
        }

        const eventLocationId = data.locationId || locationId;
        if (locationId && eventLocationId && eventLocationId !== locationId) {
          return;
        }

        if (queueName && data.queueName && data.queueName !== queueName) {
          return;
        }

        if (data.status) {
          queryClient.setQueryData(
            getQueueStatusQueryKey(currentClinic.id, locationId, queueName),
            normalizeQueueStatusSnapshot(data.status)
          );
        } else {
          invalidateQueueStatus();
        }
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [isConnected, currentClinic, locationId, queueName, queryClient, subscribe]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

// Enhanced mutation hooks with real-time updates
export function useRealTimeAppointmentMutation() {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { emit } = useWebSocketContext();

  const createAppointment = useOptimisticMutation<Appointment, Partial<Appointment>>({
    queryKey: getAppointmentQueryKey(currentClinic?.id),
    mutationFn: async (appointmentData: Partial<Appointment>) => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.post<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.CREATE,
        {
          ...appointmentData,
          clinicId: currentClinic.id,
        }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create appointment');
      }
      
      return response.data;
    },
    optimisticUpdate: (current, variables) => {
      // Create optimistic appointment
      const optimisticAppointment = {
        ...variables,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Appointment;
      return [...(current || []), optimisticAppointment];
    },
    mutationOptions: {
      onSuccess: (data) => {
        // Notify other clients via WebSocket
        emit('appointment.created', {
          appointment: data,
          clinicId: currentClinic?.id,
        });
      },
    },
  });

  const updateAppointment = useOptimisticMutation<Appointment, { id: string; updates: Partial<Appointment> }>({
    queryKey: getAppointmentQueryKey(currentClinic?.id),
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.put<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.UPDATE(id),
        updates
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update appointment');
      }
      
      return response.data;
    },
    optimisticUpdate: (current, variables) => {
      return (current || []).map((apt: Appointment) =>
        apt.id === variables.id ? { ...apt, ...variables.updates } : apt
      );
    },
    mutationOptions: {
      onSuccess: (data, variables) => {
        // Notify other clients via WebSocket
        emit('appointment.updated', {
          id: variables.id,
          updates: data,
          clinicId: currentClinic?.id,
        });
      },
    },
  });

  const deleteAppointment = useOptimisticMutation<Appointment, string>({
    queryKey: getAppointmentQueryKey(currentClinic?.id),
    mutationFn: async (id: string) => {
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.delete<{ message: string }>(
        API_ENDPOINTS.APPOINTMENTS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete appointment');
      }
      
      // Return the deleted appointment for optimistic update
      const appointments = queryClient.getQueryData<{ success: boolean; data: Appointment[] }>(
        getAppointmentQueryKey(currentClinic?.id)
      );
      const deletedAppointment = appointments?.data?.find(apt => apt.id === id);
      return deletedAppointment || ({ id } as Appointment);
    },
    optimisticUpdate: (current, id) => {
      return (current || []).filter((apt: Appointment) => apt.id !== id);
    },
    mutationOptions: {
      onSuccess: (_, id) => {
        // Notify other clients via WebSocket
        emit('appointment.deleted', {
          id,
          clinicId: currentClinic?.id,
        });
      },
    },
  });

  return {
    createAppointment: createAppointment.mutation,
    updateAppointment: updateAppointment.mutation,
    deleteAppointment: deleteAppointment.mutation,
  };
}

// Utility hook for managing query invalidation based on WebSocket events
export function useWebSocketQuerySync() {
  const queryClient = useQueryClient();
  const { isConnected, subscribe } = useWebSocketContext();

  useEffect(() => {
    if (!isConnected) return;

    // Global cache invalidation events
    const unsubscribeGlobalRefresh = subscribe('cache:invalidate', (rawData: unknown) => {
      const data = rawData as {
        queryKeys: string[];
        exact?: boolean;
      };
      data.queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ 
          queryKey: [queryKey], 
          exact: data.exact ?? false 
        });
      });
    });

    // Specific query updates
    const unsubscribeQueryUpdate = subscribe('cache:update', (rawData: unknown) => {
      const data = rawData as {
        queryKey: string[];
        data: Record<string, unknown>;
      };
      queryClient.setQueryData(data.queryKey, data.data);
    });

    // Batch invalidation for performance
    const unsubscribeBatchInvalidate = subscribe('cache:batch_invalidate', (rawData: unknown) => {
      const data = rawData as {
        patterns: string[];
      };
      data.patterns.forEach(pattern => {
        queryClient.invalidateQueries({
          predicate: (query) => 
            query.queryKey.some(key => 
              typeof key === 'string' && key.includes(pattern)
            ),
        });
      });
    });

    return () => {
      unsubscribeGlobalRefresh();
      unsubscribeQueryUpdate();
      unsubscribeBatchInvalidate();
    };
  }, [isConnected, subscribe, queryClient]);

  return { isConnected };
}

// ============================================================================
// MASTER REAL-TIME INTEGRATION HOOK
// ============================================================================
// Master hook for complete real-time integration
// Combines WebSocket integration with store synchronization and query invalidation
