"use client";

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useWebSocketIntegration } from './useWebSocketIntegration';
import { useAppStore, useAppointmentsStore } from '@/stores';
import type { Appointment, AppointmentFilters } from '@/stores/appointments.store';
import type { Appointment as AppointmentType } from '@/types/api.types';

// Enhanced query hooks with real-time WebSocket integration

export function useRealTimeAppointments(filters: AppointmentFilters = {}) {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { isConnected, subscribe } = useWebSocketIntegration();
  const subscriptionRef = useRef<(() => void) | null>(null);

  const query = useQuery({
    queryKey: ['appointments', filters, currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      // Use actual API endpoint from config
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
      const params = new URLSearchParams({
        clinicId: currentClinic.id,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        )
      });
      
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.get<AppointmentType[]>(
        `${API_ENDPOINTS.APPOINTMENTS.GET_ALL}?${params}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch appointments');
      }
      
      // Handle both array and object with appointments property
      const appointments = Array.isArray(response.data) 
        ? response.data 
        : (response.data as { appointments?: AppointmentType[] }).appointments || [];
      
      return { success: true, data: appointments };
    },
    enabled: !!currentClinic,
    staleTime: 60 * 1000, // 1 minute (optimized for 10M users - real-time updates reduce need for frequent refetch)
    gcTime: 10 * 60 * 1000, // 10 minutes (increased for 10M users)
    refetchOnWindowFocus: false,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isConnected || !currentClinic) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }

    // Subscribe to appointment updates for this clinic
    const unsubscribe = subscribe('appointment:real_time_update', (rawData: unknown) => {
      const data = rawData as {
        action: 'created' | 'updated' | 'deleted';
        appointment: Appointment;
        clinicId: string;
      };
      if (data.clinicId !== currentClinic.id) return;

      // Update the query cache based on the action
      switch (data.action) {
        case 'created':
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: AppointmentType[] } | undefined) => {
            if (oldData?.success && oldData?.data) {
              const newData = [...oldData.data, data.appointment];
              return { ...oldData, data: newData };
            }
            return oldData;
          });
          break;

        case 'updated':
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: AppointmentType[] } | undefined) => {
            if (oldData?.success && oldData?.data) {
              const updatedData = oldData.data.map((apt: Appointment) =>
                apt.id === data.appointment.id ? { ...apt, ...data.appointment } : apt
              );
              return { ...oldData, data: updatedData };
            }
            return oldData;
          });
          break;

        case 'deleted':
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: AppointmentType[] } | undefined) => {
            if (oldData?.success && oldData?.data) {
              const filteredData = oldData.data.filter((apt: Appointment) => apt.id !== data.appointment.id);
              return { ...oldData, data: filteredData };
            }
            return oldData;
          });
          break;
      }

      // Invalidate related queries to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['appointment-stats'], 
        exact: false 
      });
    });

    subscriptionRef.current = unsubscribe;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [isConnected, currentClinic, filters, subscribe, queryClient]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeAppointmentStats() {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { isConnected, subscribe } = useWebSocketIntegration();

  const query = useQuery({
    queryKey: ['appointment-stats', currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
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
    enabled: !!currentClinic,
    staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: isConnected ? false : 10 * 60 * 1000, // 10 minutes if not real-time (increased for 10M users)
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isConnected || !currentClinic) return;

    const unsubscribe = subscribe('appointment_stats:update', (rawData: unknown) => {
      const data = rawData as {
        clinicId: string;
        stats: Record<string, unknown>;
      };
      if (data.clinicId === currentClinic.id) {
        queryClient.setQueryData(['appointment-stats', currentClinic.id], {
          success: true,
          data: data.stats,
        });
      }
    });

    return unsubscribe;
  }, [isConnected, currentClinic, subscribe, queryClient]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeQueueStatus(queueName?: string) {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { isConnected, subscribe } = useWebSocketIntegration();

  const query = useQuery({
    queryKey: ['queue-status', currentClinic?.id, queueName],
    queryFn: async () => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (queueName) params.append('queueName', queueName);
      
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.get<Record<string, unknown>>(
        `${API_ENDPOINTS.APPOINTMENTS.QUEUE.STATS}?${params}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch queue status');
      }
      
      return { success: true, data: response.data };
    },
    enabled: !!currentClinic,
    staleTime: 30 * 1000, // 30 seconds (optimized for 10M users)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isConnected ? false : 60 * 1000, // 1 minute if not real-time (increased for 10M users)
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isConnected || !currentClinic) return;

    const unsubscribe = subscribe('queue_status_update', (rawData: unknown) => {
      const data = rawData as {
        clinicId: string;
        queueName?: string;
        status: Record<string, unknown>;
      };
      if (data.clinicId === currentClinic.id) {
        if (queueName && data.queueName === queueName) {
          queryClient.setQueryData(['queue-status', currentClinic.id, queueName], {
            success: true,
            data: data.status,
          });
        } else if (!queueName) {
          queryClient.setQueryData(['queue-status', currentClinic.id, undefined], {
            success: true,
            data: data.status,
          });
        }
      }
    });

    return unsubscribe;
  }, [isConnected, currentClinic, queueName, subscribe, queryClient]);

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

// Enhanced mutation hooks with real-time updates
export function useRealTimeAppointmentMutation() {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { emit } = useWebSocketIntegration();

  const createAppointment = useMutation({
    mutationFn: async (appointmentData: Partial<Appointment>) => {
      if (!currentClinic) throw new Error('No clinic selected');
      
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
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
      
      return { success: true, data: response.data };
    },
    onSuccess: (data) => {
      // Optimistically update local cache
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Notify other clients via WebSocket
      emit('appointment:created', {
        appointment: data.data,
        clinicId: currentClinic?.id,
      });
    },
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Appointment> }) => {
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.put<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.UPDATE(id),
        updates
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update appointment');
      }
      
      return { success: true, data: response.data };
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments'] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(['appointments']);

      // Optimistically update the cache
      queryClient.setQueryData(['appointments'], (old: { success: boolean; data: AppointmentType[] } | undefined) => {
        if (old?.success && old?.data) {
          const updatedData = old.data.map((apt: Appointment) =>
            apt.id === id ? { ...apt, ...updates } : apt
          );
          return { ...old, data: updatedData };
        }
        return old;
      });

      // Return context with the previous value
      return { previousAppointments };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(['appointments'], context.previousAppointments);
      }
    },
    onSuccess: (data, { id, updates }) => {
      // Notify other clients via WebSocket
      emit('appointment:updated', {
        id,
        updates: data.data,
        clinicId: currentClinic?.id,
      });
      
      // Update Zustand store
      useAppointmentsStore.getState().updateAppointment(id, updates);
    },
  });

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { API_ENDPOINTS, APP_CONFIG } = await import('@/lib/config/config');
      // ✅ SECURITY: Use centralized API client instead of direct fetch
      const { clinicApiClient } = await import('@/lib/api/client');
      const response = await clinicApiClient.delete<{ message: string }>(
        API_ENDPOINTS.APPOINTMENTS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete appointment');
      }
      
      return { success: true, data: response.data || { message: 'Appointment deleted' } };
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Notify other clients via WebSocket
      emit('appointment:deleted', {
        id,
        clinicId: currentClinic?.id,
      });
    },
  });

  return {
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}

// Utility hook for managing query invalidation based on WebSocket events
export function useWebSocketQuerySync() {
  const queryClient = useQueryClient();
  const { isConnected, subscribe } = useWebSocketIntegration();

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