"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useEffect, useRef, useCallback } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { useQueryData, useOptimisticMutation, useQueryClient } from '@/hooks/core';
import {
  invalidateAppointmentQueryFamilies,
  invalidateBillingQueryFamilies,
  invalidateDashboardQueryFamilies,
} from './useWebSocketIntegration';
import { useWebSocketContext, useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useAppStore, useAuthStore } from '@/stores';
import { useAuth } from '@/hooks/auth/useAuth';
import {
  createAppointment as createAppointmentAction,
  cancelAppointment as cancelAppointmentAction,
  getAppointments,
  updateAppointment as updateAppointmentAction,
} from '@/lib/actions/appointments.server';
import { getAppointmentAnalytics } from '@/lib/actions/analytics.server';
import { getQueueStats } from '@/lib/actions/queue.server';
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

function resolveRealtimeClinicId(
  currentClinic: { id?: string } | null | undefined,
  sessionUser: { clinicId?: string; clinic?: { id?: string } } | undefined
): string | undefined {
  return sessionUser?.clinicId || sessionUser?.clinic?.id || currentClinic?.id;
}

const CRITICAL_REALTIME_QUERY_PREFIXES: readonly ReadonlyArray<string>[] = [
  ['appointments'],
  ['appointment'],
  ['appointmentStats'],
  ['myAppointments'],
  ['userUpcomingAppointments'],
  ['video-appointments'],
  ['video-appointment'],
  ['doctorAppointments'],
  ['doctorSchedule'],
  ['doctorAvailability'],
  ['doctorPatients'],
  ['doctors'],
  ['doctor'],
  ['counselorAppointments'],
  ['counselorClients'],
  ['counselorClient'],
  ['therapistAppointments'],
  ['therapistPatientAppointments'],
  ['therapistClients'],
  ['therapistClient'],
  // Patient dashboard summary — single-round-trip composition endpoint.
  // Invalidating this key on lifecycle events (appointments, billing,
  // prescriptions) busts the cache so the next visit fetches fresh data.
  ['patientDashboardSummary'],
  ['queue'],
  ['queue-status'],
  ['queue-metrics'],
  ['queueHistory'],
  ['queueAnalytics'],
  ['queueConfig'],
  ['queueNotifications'],
  ['queueWaitTimes'],
  ['queueCapacity'],
  ['queuePerformanceMetrics'],
  ['queueAlerts'],
  ['billing'],
  ['billing-plans'],
  ['billing-plan'],
  ['subscriptions'],
  ['clinic-subscriptions'],
  ['active-subscription'],
  ['invoices'],
  ['clinic-invoices'],
  ['payments'],
  ['clinic-payments'],
  ['clinic-ledger'],
  ['billing-analytics'],
  ['clinicStats'],
  ['dashboardAnalytics'],
  ['appointmentAnalytics'],
  ['patientAnalytics'],
  ['revenueAnalytics'],
  ['serviceUtilizationAnalytics'],
  ['waitTimeAnalytics'],
  ['patientSatisfactionAnalytics'],
  ['pharmacyStats'],
  ['medicineDeskQueue'],
  ['prescriptions'],
  ['medicalRecords'],
  ['medicineCategories'],
  ['medicines'],
  ['medicineInventory'],
  ['pharmacyOrders'],
  ['pharmacySales'],
  ['pharmacyBatchAudit'],
  ['ehr'],
  ['ehrClinic'],
  ['clinics'],
  ['clinic'],
  ['clinicByAppName'],
  ['myClinic'],
  ['current-clinic'],
  ['clinicLocations'],
  ['clinicLocation'],
  ['activeLocations'],
  ['clinicDoctors'],
  ['clinicStaff'],
  ['clinicUsers'],
  ['clinicUsersByRole'],
  ['clinicPatients'],
  ['clinicOperatingHours'],
  ['clinicSettings'],
  ['clinicCommunication'],
  ['notifications'],
  ['userProfile'],
  ['user'],
  ['users'],
  ['patients'],
  ['receptionists'],
  ['clinicAdmins'],
];

async function refetchCriticalRealtimeQueries(queryClient: QueryClient) {
  await Promise.all(
    CRITICAL_REALTIME_QUERY_PREFIXES.map((queryKey) =>
      queryClient.refetchQueries({
        queryKey,
        exact: false,
      })
    )
  );
}

// Enhanced query hooks with real-time WebSocket integration

export function useRealTimeAppointments(filters: AppointmentFilters = {}) {
  const { currentClinic } = useAppStore();
  const { session } = useAuth();
  const { isConnected } = useWebSocketContext();
  const sessionUser = session?.user as { clinicId?: string; clinic?: { id?: string } } | undefined;
  const resolvedClinicId = resolveRealtimeClinicId(currentClinic, sessionUser);
  const hasDoctorFilter = Object.prototype.hasOwnProperty.call(filters, 'doctorId');
  const doctorFilterReady = !hasDoctorFilter || Boolean(filters.doctorId);

  const query = useQueryData(
    getAppointmentQueryKey(resolvedClinicId, filters),
    async () => {
      if (!resolvedClinicId) throw new Error('No clinic selected');

      const response = await getAppointments({ ...filters, clinicId: resolvedClinicId });
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch appointments');
      }

      const appointments = response.appointments || [];
      return { success: true, data: appointments };
    },
    {
      enabled: !!resolvedClinicId && doctorFilterReady,
      staleTime: 60 * 1000, // 1 minute (optimized for 10M users - real-time updates reduce need for frequent refetch)
      gcTime: 10 * 60 * 1000, // 10 minutes (increased for 10M users)
      refetchOnWindowFocus: false,
      // ✅ Realtime coverage via WebSocket invalidates this query on
      // appointment.* events. refetchOnReconnect after a token-refresh
      // cycle was the source of the post-401 revalidation storm — every
      // reconnect fired N parallel server-action POSTs that all 401'd in
      // unison and surfaced empty skeletons because `placeholderData` had
      // no previous data to fall back to once `gcTime` elapsed.
      refetchOnReconnect: false,
      refetchInterval: isConnected ? false : 30_000,
      // Keep the last-good list visible during a 401/refresh cycle or any
      // other refetch failure. Without this the dashboard flashes a skeleton
      // for ~30s while the socket reconnects and the next refetch lands.
      placeholderData: keepPreviousData,
    }
  );

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeAppointmentStats() {
  const { currentClinic } = useAppStore();
  const { session } = useAuth();
  const { isConnected, subscribe } = useWebSocketContext();
  const sessionUser = session?.user as { clinicId?: string; clinic?: { id?: string } } | undefined;
  const resolvedClinicId = resolveRealtimeClinicId(currentClinic, sessionUser);

  const query = useQueryData(
    getAppointmentStatsQueryKey(resolvedClinicId),
    async () => {
      if (!resolvedClinicId) throw new Error('No clinic selected');

      const response = await getAppointmentAnalytics({ clinicId: resolvedClinicId });
      if (!response) {
        throw new Error('Failed to fetch appointment stats');
      }

      return { success: true, data: response as Record<string, unknown> };
    },
    {
      enabled: !!resolvedClinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
      gcTime: 15 * 60 * 1000, // 15 minutes
      refetchInterval: isConnected ? false : 10 * 60 * 1000, // 10 minutes if not real-time (increased for 10M users)
      refetchOnWindowFocus: false,
      // ✅ Realtime coverage invalidates on appointment.* events; see
      // note in useRealTimeAppointments above. Stats must refetch on
      // reconnect after long disconnects though — keeping true here so
      // a 30-minute disconnect still produces a fresh analytics rollup
      // once the socket returns. The 30s polling fallback (when
      // !isConnected) still runs as a safety net.
      refetchOnReconnect: false,
      placeholderData: keepPreviousData,
    }
  );

  return {
    ...query,
    isRealTimeEnabled: isConnected,
  };
}

export function useRealTimeQueueStatus(queueName?: string, locationId?: string) {
  const queryClient = useQueryClient();
  const { currentClinic } = useAppStore();
  const { session } = useAuth();
  const { isConnected } = useWebSocketStatus();
  const { subscribe } = useWebSocketContext();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  const sessionUser = session?.user as { clinicId?: string; clinic?: { id?: string } } | undefined;
  const resolvedClinicId = resolveRealtimeClinicId(currentClinic, sessionUser);
  const queryKey = getQueueStatusQueryKey(resolvedClinicId, locationId, queueName);

  const query = useQueryData(
    queryKey,
    async () => {
      if (!resolvedClinicId) throw new Error('No clinic selected');

      const response = await getQueueStats(locationId || resolvedClinicId);
      if (!response) {
        throw new Error('Failed to fetch queue status');
      }

      return normalizeQueueStatusSnapshot(response as QueueStatusSnapshot);
    },
    {
      enabled: !!resolvedClinicId && !!locationId,
      staleTime: 30 * 1000, // 30 seconds (optimized for 10M users)
      gcTime: 5 * 60 * 1000, // 5 minutes
      // Keep queue status fresh even when the websocket is connected because
      // the backend socket layer does not emit the same location-level stats
      // shape that this hook reads from the API. Pause during auth refresh so
      // we don't pile 401s on top of the reconnect.
      refetchInterval: isAuthRefreshing ? false : 15 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  const invalidateQueueStatus = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: getQueueStatusQueryKey(resolvedClinicId, locationId, queueName),
      exact: false,
    });
  }, [locationId, queueName, queryClient, resolvedClinicId]);

  useEffect(() => {
    if (!isConnected || !resolvedClinicId) return;

    const queueEvents = [
      'queue_status_update',
      'queue.updated',
      'queue.position.updated',
      'appointment.queue.reordered',
      'queue_metrics_update',
      'queue.metrics.updated',
      'queue.alert.created',
      'queue.alert.resolved',
      'queue.report.generated',
      'queue.health.changed',
    ] as const;

    const unsubscribes = queueEvents.map((event) =>
      subscribe(event, (rawData: unknown) => {
        const data = rawData as {
          clinicId?: string;
          queueName?: string;
          locationId?: string;
          status?: QueueStatusSnapshot;
        };

        if (data.clinicId && data.clinicId !== resolvedClinicId) {
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
            getQueueStatusQueryKey(resolvedClinicId, locationId, queueName),
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
  }, [invalidateQueueStatus, isConnected, locationId, queueName, queryClient, resolvedClinicId, subscribe]);

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

      const response = await createAppointmentAction({
        ...(appointmentData as any),
        clinicId: currentClinic.id,
      });

      if (!response.success || !response.appointment) {
        throw new Error(response.error || 'Failed to create appointment');
      }

      return response.appointment;
    },
    optimisticUpdate: (current, variables) => {
      // Create optimistic appointment
      const optimisticAppointment = {
        ...variables,
        id: `temp-${Date.now()}`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
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
      const response = await updateAppointmentAction(id, updates as any);

      if (!response.success || !response.appointment) {
        throw new Error(response.error || 'Failed to update appointment');
      }

      return response.appointment;
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
      const response = await cancelAppointmentAction(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete appointment');
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

/**
 * Compatibility shim — historically this hook set up a giant duplicate
 * subscription tree (cache:invalidate, cache:update, billing.*,
 * appointment.*, check-in, batch_invalidate, plus a disconnected-mode
 * fallback refetch) on every consumer mount. That tree was duplicated
 * by `useWebSocketIntegration` (mounted at the provider level), so each
 * consumer added another full listener graph that re-ran on every
 * reconnect — the source of the post-token-expiry revalidation storm.
 *
 * The provider-level integration is now the single source of truth.
 * This hook is kept as a no-op so the ~45 call sites that import it
 * continue to type-check. New consumers should not need this hook at all;
 * the WebSocket is already wired up by being inside the provider.
 */
export function useWebSocketQuerySync() {
  const { isConnected } = useWebSocketContext();
  return { isConnected };
}


// ============================================================================
// MASTER REAL-TIME INTEGRATION HOOK
// ============================================================================
// Master hook for complete real-time integration
// Combines WebSocket integration with store synchronization and query invalidation
