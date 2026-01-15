"use client";

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useWebSocketIntegration } from './useWebSocketIntegration';
import { useAppStore, useAppointmentsStore } from '@/stores';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment, AppointmentFilters } from '@/types/appointment.types';
import type { User } from '@/types/auth.types';
import type { Clinic } from '@/types/clinic.types';

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
      const { API_ENDPOINTS } = await import('@/lib/config/config');
      const params = new URLSearchParams({
        clinicId: currentClinic.id,
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, String(value)])
        )
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
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: Appointment[] } | undefined) => {
            if (oldData?.success && oldData?.data) {
              const newData = [...oldData.data, data.appointment];
              return { ...oldData, data: newData };
            }
            return oldData;
          });
          break;

        case 'updated':
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: Appointment[] } | undefined) => {
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
          queryClient.setQueryData(['appointments', filters, currentClinic.id], (oldData: { success: boolean; data: Appointment[] } | undefined) => {
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
      
      const { API_ENDPOINTS } = await import('@/lib/config/config');
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
      
      return { success: true, data: response.data };
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['appointments'] });

      // Snapshot the previous value
      const previousAppointments = queryClient.getQueryData(['appointments']);

      // Optimistically update the cache
      queryClient.setQueryData(['appointments'], (old: { success: boolean; data: Appointment[] } | undefined) => {
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
      const { API_ENDPOINTS } = await import('@/lib/config/config');
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

// ============================================================================
// MASTER REAL-TIME INTEGRATION HOOK
// ============================================================================
// Master hook for complete real-time integration
// Combines WebSocket integration with store synchronization and query invalidation

export function useRealTimeIntegration() {
  const queryClient = useQueryClient();
  const { user, currentClinic } = useAppStore();
  
  // Initialize WebSocket integration
  const webSocketIntegration = useWebSocketIntegration({
    autoConnect: true,
    subscribeToQueues: true,
    subscribeToAppointments: true,
    tenantId: currentClinic?.id,
    userId: user?.id,
  });

  // Sync Zustand stores with server state
  useEffect(() => {
    if (!webSocketIntegration.isReady) return;

    // Subscribe to real-time store synchronization events
    const unsubscribeFunctions: (() => void)[] = [];

    // Sync appointments store
    const unsubscribeAppointmentSync = webSocketIntegration.subscribe('store:sync:appointments', (data: unknown) => {
      const { setAppointments } = useAppointmentsStore.getState();
      const typedData = data as { appointments: Appointment[] };
      setAppointments(typedData.appointments);
    });

    // Sync user data
    const unsubscribeUserSync = webSocketIntegration.subscribe('store:sync:user', (data: unknown) => {
      const { setUser } = useAppStore.getState();
      const typedData = data as { user: User | null };
      if (typedData.user) {
        // Map auth.types.User to app.store.User
        const authUser = typedData.user as any; // Type assertion for missing properties
        const appUser: import('@/stores/app.store').User = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.name || `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || 'User',
          role: authUser.role as any,
          clinicId: authUser.clinicId,
          avatarUrl: authUser.avatarUrl || authUser.profilePicture,
          permissions: authUser.permissions || [],
          isActive: authUser.isActive ?? true,
          lastLoginAt: authUser.lastLoginAt,
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
    });

    // Sync clinic data
    const unsubscribeClinicSync = webSocketIntegration.subscribe('store:sync:clinic', (data: unknown) => {
      const { setCurrentClinic } = useAppStore.getState();
      const typedData = data as { clinic: Clinic | null };
      if (typedData.clinic) {
        // Map clinic.types.Clinic to app.store.Clinic
        const clinicData = typedData.clinic as any;
        let settings: import('@/stores/app.store').ClinicSettings;
        
        if (typeof clinicData.settings === 'object' && clinicData.settings !== null && !Array.isArray(clinicData.settings)) {
          const clinicSettings = clinicData.settings;
          // Ensure all required ClinicSettings properties exist
          settings = {
            appointmentDuration: clinicSettings.appointmentDuration || clinicSettings.appointmentSettings?.appointmentDuration || 30,
            workingHours: clinicSettings.workingHours || {
              start: clinicSettings.appointmentSettings?.minAdvanceBooking ? '09:00' : '09:00',
              end: '17:00',
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            },
            timeZone: clinicSettings.timeZone || clinicData.timezone || 'UTC',
            features: {
              queue: clinicSettings.features?.queue ?? true,
              notifications: clinicSettings.notifications?.push ?? true,
              telemedicine: clinicSettings.features?.telemedicine ?? true,
              pharmacy: clinicSettings.features?.pharmacy ?? true,
            },
          };
        } else {
          settings = {
            appointmentDuration: 30,
            workingHours: { start: '09:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
            timeZone: clinicData.timezone || 'UTC',
            features: { queue: true, notifications: true, telemedicine: true, pharmacy: true },
          };
        }
        
        const appClinic: import('@/stores/app.store').Clinic = {
          id: clinicData.id,
          name: clinicData.name,
          address: clinicData.address || '',
          phone: clinicData.phone || '',
          email: clinicData.email || '',
          settings,
        };
        setCurrentClinic(appClinic);
      } else {
        setCurrentClinic(null);
      }
    });

    unsubscribeFunctions.push(
      unsubscribeAppointmentSync,
      unsubscribeUserSync,
      unsubscribeClinicSync
    );

    return () => {
      unsubscribeFunctions.forEach(fn => fn());
    };
  }, [webSocketIntegration.isReady, webSocketIntegration.subscribe]);

  // Invalidate queries on reconnection
  useEffect(() => {
    if (webSocketIntegration.isConnected && webSocketIntegration.connectionStatus === 'connected') {
      // Invalidate all queries to ensure fresh data after reconnection
      queryClient.invalidateQueries();
    }
  }, [webSocketIntegration.isConnected, webSocketIntegration.connectionStatus, queryClient]);

  return {
    ...webSocketIntegration,
    
    // Additional utilities
    syncStoreWithServer: () => {
      if (webSocketIntegration.isReady) {
        webSocketIntegration.emit('request:store:sync', {
          userId: user?.id,
          clinicId: currentClinic?.id,
        });
      }
    },

    // Force refresh all data
    refreshAllData: () => {
      queryClient.invalidateQueries();
      if (webSocketIntegration.isReady) {
        webSocketIntegration.emit('request:data:refresh', {
          userId: user?.id,
          clinicId: currentClinic?.id,
        });
      }
    },
  };
}