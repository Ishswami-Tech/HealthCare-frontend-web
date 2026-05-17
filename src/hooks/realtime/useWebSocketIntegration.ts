"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useEffect, useCallback, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@/hooks/core';
import { useWebSocketStore, useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { APP_CONFIG } from '@/lib/config/config';
import {
  getQueueStatusQueryKey,
  normalizeQueueStatusSnapshot,
} from '@/lib/queue/queue-cache';
import { getAppointmentStatsQueryKey } from '@/lib/query/appointment-query-keys';
import { refreshClientSessionForRealtime } from '@/lib/utils/auth-recovery';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment } from '@/types/appointment.types';
import type { BillingPlan, Invoice, Payment, Subscription } from '@/types/billing.types';
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

export function invalidateDashboardQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['clinicStats'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['appointmentAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['patientAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['revenueAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['serviceUtilizationAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['waitTimeAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['patientSatisfactionAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['queueAnalytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['pharmacyStats'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['medicineDeskQueue'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['prescriptions'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['medicalRecords'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['ehr'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['ehrClinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['billing-plans'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['billing-plan'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['subscriptions'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-subscriptions'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['active-subscription'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['billing-analytics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['invoices'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-invoices'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['payments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-payments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic-ledger'], exact: false });
}

export function invalidateUserQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['user'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['patients'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctors'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['receptionists'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicAdmins'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicUsers'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicUsersByRole'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicDoctors'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicPatients'], exact: false });
}

export function invalidateDoctorAvailabilityQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['doctorAvailability'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorSchedule'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorAppointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['doctorPatients'], exact: false });
}

export function invalidateClinicQueryFamilies(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['clinics'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicByAppName'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['myClinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['current-clinic'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicLocations'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicLocation'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['activeLocations'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicDoctors'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicStaff'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicUsers'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicUsersByRole'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicPatients'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicStats'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicOperatingHours'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicSettings'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['clinicCommunication'], exact: false });
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

function extractRealtimeAppointmentSnapshot(rawData: unknown): Appointment | null {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  const record = rawData as Record<string, unknown>;
  const candidates = [
    record.appointment,
    record.payload,
    record.data,
    record.updates,
    record,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      continue;
    }

    const appointment = candidate as Appointment & { appointmentId?: string };
    if (getRealtimeAppointmentId(appointment) || 'status' in appointment || 'startedAt' in appointment) {
      return appointment;
    }
  }

  return null;
}

function extractRealtimeAppointmentSnapshots(rawData: unknown): Appointment[] {
  if (!rawData || typeof rawData !== 'object') {
    return [];
  }

  const record = rawData as Record<string, unknown>;
  const snapshots = new Map<string, Appointment>();

  const addSnapshot = (candidate: unknown): void => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return;
    }

    const appointment = candidate as Appointment;
    const appointmentId = getRealtimeAppointmentId(appointment);
    if (!appointmentId) {
      return;
    }

    snapshots.set(appointmentId, {
      ...appointment,
      id: (appointment as any).id || appointmentId,
    });
  };

  const candidates = [record.appointment, record.payload, record.data, record.updates, record];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      candidate.forEach(addSnapshot);
      continue;
    }

    addSnapshot(candidate);
  }

  for (const arrayKey of ['appointments', 'items', 'records'] as const) {
    const candidate = record[arrayKey];
    if (Array.isArray(candidate)) {
      candidate.forEach(addSnapshot);
    }
  }

  return Array.from(snapshots.values());
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

function upsertRealtimeAppointmentCaches(queryClient: QueryClient, appointment: Appointment): void {
  const targetId = getRealtimeAppointmentId(appointment);
  if (!targetId) {
    return;
  }

  queryClient.setQueryData(['appointment', targetId], (oldData: Appointment | undefined) =>
    oldData ? { ...oldData, ...appointment } : appointment
  );
  queryClient.setQueryData(['video-appointment', targetId], (oldData: Appointment | undefined) =>
    oldData ? { ...oldData, ...appointment } : appointment
  );
  queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['userUpcomingAppointments'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
  queryClient.setQueriesData({ queryKey: ['doctorPatients'], exact: false }, (current) =>
    mergeRealtimeAppointmentPayload(current, appointment)
  );
}

function upsertRealtimeAppointmentCacheBatch(queryClient: QueryClient, appointments: Appointment[]): void {
  for (const appointment of appointments) {
    upsertRealtimeAppointmentCaches(queryClient, appointment);
  }
}

function hasRealtimeAppointmentSnapshot(rawData: unknown): boolean {
  return extractRealtimeAppointmentSnapshots(rawData).length > 0;
}

type RealtimeBillingEntity = {
  id?: string;
  clinicId?: string;
  userId?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

function getRealtimeBillingEntityId(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return '';
  }

  const record = value as Record<string, unknown>;
  return String(
    record.id ||
      record.invoiceId ||
      record.paymentId ||
      record.subscriptionId ||
      record.planId ||
      ''
  );
}

function extractRealtimeBillingSnapshot<T extends RealtimeBillingEntity>(
  rawData: unknown,
  entityKeys: readonly string[]
): T | null {
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  const record = rawData as Record<string, unknown>;
  const containerCandidates = [
    record,
    record.payload,
    record.data,
    record.updates,
  ];

  for (const container of containerCandidates) {
    if (!container || typeof container !== 'object' || Array.isArray(container)) {
      continue;
    }

    const containerRecord = container as Record<string, unknown>;
    for (const key of entityKeys) {
      const candidate = containerRecord[key];
      if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        continue;
      }

      const entity = candidate as T;
      if (getRealtimeBillingEntityId(entity)) {
        return entity;
      }
    }
  }

  return null;
}

function mergeRealtimeBillingListPayload<T extends RealtimeBillingEntity>(
  payload: unknown,
  entity: T
): unknown {
  const targetId = getRealtimeBillingEntityId(entity);
  if (!targetId) {
    return payload;
  }

  const mergeItem = (item: unknown): unknown => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const itemRecord = item as Record<string, unknown>;
    const itemId = getRealtimeBillingEntityId(itemRecord);
    if (!itemId || itemId !== targetId) {
      return item;
    }

    return {
      ...itemRecord,
      ...entity,
      id: (entity as any).id || itemRecord.id,
      updatedAt: (entity as any).updatedAt || itemRecord.updatedAt || nowIso(),
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

  for (const arrayKey of ['items', 'data', 'records', 'invoices', 'payments', 'subscriptions', 'plans'] as const) {
    if (Array.isArray(record[arrayKey])) {
      nextRecord[arrayKey] = (record[arrayKey] as unknown[]).map(mergeItem);
      changed = true;
    }
  }

  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nestedData = record.data as Record<string, unknown>;
    const nestedNext: Record<string, unknown> = { ...nestedData };
    let nestedChanged = false;

    for (const arrayKey of ['items', 'data', 'records', 'invoices', 'payments', 'subscriptions', 'plans'] as const) {
      if (Array.isArray(nestedData[arrayKey])) {
        nestedNext[arrayKey] = (nestedData[arrayKey] as unknown[]).map(mergeItem);
        nestedChanged = true;
      }
    }

    if (nestedChanged) {
      nextRecord.data = nestedNext;
      changed = true;
    }
  }

  return changed ? nextRecord : payload;
}

function upsertRealtimeBillingCaches(
  queryClient: QueryClient,
  entity:
    | (Invoice & RealtimeBillingEntity)
    | (Payment & RealtimeBillingEntity)
    | (Subscription & RealtimeBillingEntity)
    | (BillingPlan & RealtimeBillingEntity),
  entityType: 'invoice' | 'payment' | 'subscription' | 'plan'
): void {
  const targetId = getRealtimeBillingEntityId(entity);
  if (!targetId) {
    return;
  }

  const listKeysByType: Record<typeof entityType, readonly string[]> = {
    invoice: ['invoices', 'clinic-invoices'],
    payment: ['payments', 'clinic-payments'],
    subscription: ['subscriptions', 'clinic-subscriptions'],
    plan: ['billing-plans'],
  };

  const exactKeyByType: Record<typeof entityType, string[]> = {
    invoice: ['invoice', targetId],
    payment: ['payment', targetId],
    subscription: ['subscription', targetId],
    plan: ['billing-plan', targetId],
  };

  queryClient.setQueryData(exactKeyByType[entityType], (oldData: unknown) =>
    oldData ? { ...(oldData as Record<string, unknown>), ...entity } : entity
  );

  queryClient.setQueriesData({ queryKey: listKeysByType[entityType], exact: false }, (current) =>
    mergeRealtimeBillingListPayload(current, entity)
  );

  if (entityType === 'subscription') {
    queryClient.setQueriesData({ queryKey: ['active-subscription'], exact: false }, (current) => {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return current;
      }

      const currentRecord = current as Record<string, unknown>;
      const currentId = getRealtimeBillingEntityId(currentRecord);
      if (currentId && currentId !== targetId) {
        return current;
      }

      return {
        ...currentRecord,
        ...entity,
      };
    });
  }
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
              const refreshedSession = await refreshClientSessionForRealtime('appointment-live-ws');
              if (!refreshedSession?.access_token) {
                return;
              }

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
        logger.warn('Failed to initialize appointment websocket', {
          component: 'appointment-live-ws',
          error: error instanceof Error ? error.message : String(error),
        });
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
        const appointment = extractRealtimeAppointmentSnapshot(rawData) || data;
        logAppointmentNamespace('appointment.created', {
          appointmentId: getRealtimeAppointmentId(appointment),
          clinicId: (appointment as { clinicId?: string }).clinicId || data.clinicId,
          doctorId: (appointment as { doctorId?: string }).doctorId || data.doctorId,
        });
        if (appointment) {
          upsertRealtimeAppointmentCaches(queryClient, appointment);
        }
        if (!hasRealtimeAppointmentSnapshot(rawData)) {
          invalidateAppointmentQueries();
        }
      });

      const unsubscribeAppointmentUpdated = subscribe('appointment.updated', (rawData: unknown) => {
        const data = rawData as { appointmentId?: string; id?: string; appointment?: Appointment; updates?: Partial<Appointment> };
        const appointment = extractRealtimeAppointmentSnapshot(rawData);
        const appointmentId = String(
          getRealtimeAppointmentId(appointment || data.appointment || data.updates || data) || ''
        );
        const patch = (appointment || data.appointment || data.updates || {}) as Appointment;
        logAppointmentNamespace('appointment.updated', {
          appointmentId,
          clinicId: (appointment as { clinicId?: string } | undefined)?.clinicId || (data.appointment as { clinicId?: string } | undefined)?.clinicId,
          doctorId: (appointment as { doctorId?: string } | undefined)?.doctorId || (data.appointment as { doctorId?: string } | undefined)?.doctorId,
        });
        if (appointmentId) {
          upsertRealtimeAppointmentCaches(queryClient, {
            ...patch,
            id: appointmentId,
            appointmentId,
          } as Appointment);
        }
        if (!hasRealtimeAppointmentSnapshot(rawData)) {
          invalidateAppointmentQueries();
        }
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
        const data = rawData as { id: string; status: string; timestamp: string; appointment?: Appointment };
        const appointment = extractRealtimeAppointmentSnapshot(rawData);
        const appointmentId = String(getRealtimeAppointmentId(appointment || data.appointment || data) || data.id || '');
        logAppointmentNamespace('appointment.status_changed', {
          appointmentId,
          status: data.status,
        });
        if (appointmentId) {
          upsertRealtimeAppointmentCaches(queryClient, {
            ...(appointment || data.appointment || {}),
            id: appointmentId,
            appointmentId,
            status: data.status,
            updatedAt: data.timestamp,
          } as Appointment);
        }
        if (!hasRealtimeAppointmentSnapshot(rawData)) {
          invalidateAppointmentQueries();
        }
      });

      const appointmentLifecycleEvents = [
        'appointment.followup.plan.created',
        'appointment.followup.scheduled',
        'appointment.followup.plan.updated',
        'appointment.followup.plan.cancelled',
        'appointment.series.created',
        'appointment.series.updated',
        'appointment.conflict-resolved',
        'appointment.reassigned',
        'appointment.checked_in',
        'appointment.confirmed',
        'appointment.rescheduled',
        'appointment.cancelled',
        'appointment.completed',
        'appointment.slot.confirmed',
        'appointment.consultation_started',
        'doctor.availability.changed',
        'appointment.noshow',
      ] as const;

      const unsubscribeAppointmentLifecycleEvents = appointmentLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as { appointmentId?: string; id?: string; clinicId?: string; appointment?: Appointment; payload?: Appointment };
          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          const appointment = extractRealtimeAppointmentSnapshot(rawData);
          const appointmentId = String(getRealtimeAppointmentId(appointment || data.appointment || data.payload || data) || data.appointmentId || data.id || '');
          logAppointmentNamespace(event, {
            appointmentId,
            clinicId: data.clinicId,
          });
          const snapshots = extractRealtimeAppointmentSnapshots(rawData);
          if (snapshots.length > 0) {
            upsertRealtimeAppointmentCacheBatch(queryClient, snapshots);
          } else if (appointmentId) {
            upsertRealtimeAppointmentCaches(queryClient, {
              ...(appointment || data.appointment || data.payload || {}),
              id: appointmentId,
              appointmentId,
            } as Appointment);
          }

          if (!hasRealtimeAppointmentSnapshot(rawData)) {
            invalidateAppointmentQueries();
          }

          invalidateDashboardQueryFamilies(queryClient);
          if (event === 'doctor.availability.changed') {
            invalidateDoctorAvailabilityQueryFamilies(queryClient);
          }

        })
      );

      const billingLifecycleEvents = [
        'billing.plan.created',
        'billing.plan.updated',
        'billing.plan.deleted',
        'billing.subscription.created',
        'billing.subscription.updated',
        'billing.subscription.cancelled',
        'billing.subscription.renewed',
        'billing.subscription.quota_reset',
        'billing.invoice.created',
        'billing.invoice.updated',
        'billing.invoice.paid',
        'billing.invoice.pdf_generated',
        'billing.invoice.sent_whatsapp',
        'billing.appointment.booked',
        'billing.appointment.cancelled',
        'billing.receipt.sent_whatsapp',
        'billing.payment.created',
        'billing.payment.updated',
        'billing.receipt.paid',
        'billing.payout.pending',
        'billing.payout.success',
        'payment.pending',
        'payment.completed',
        'payment.failed',
        'payment.cancelled',
        'payment.intent.created',
        'payment.refunded',
      ] as const;

      const unsubscribePaymentLifecycleEvents = billingLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as {
            clinicId?: string;
            appointmentId?: string;
            invoiceId?: string;
            paymentId?: string;
            appointment?: Appointment;
            invoice?: Invoice;
            payment?: Payment;
            subscription?: Subscription;
            plan?: BillingPlan;
          };

          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          const appointmentRecord = data.appointment as { appointmentId?: string; id?: string } | undefined;
          const appointmentId = String(
            appointmentRecord?.appointmentId || data.appointmentId || appointmentRecord?.id || ''
          );

          const invoice = extractRealtimeBillingSnapshot<Invoice & RealtimeBillingEntity>(rawData, ['invoice']);
          const payment = extractRealtimeBillingSnapshot<Payment & RealtimeBillingEntity>(rawData, ['payment']);
          const subscription = extractRealtimeBillingSnapshot<Subscription & RealtimeBillingEntity>(rawData, ['subscription']);
          const plan = extractRealtimeBillingSnapshot<BillingPlan & RealtimeBillingEntity>(rawData, ['plan']);

          logAppointmentNamespace(event, {
            appointmentId,
            clinicId: data.clinicId,
          });

          if (invoice) {
            upsertRealtimeBillingCaches(queryClient, invoice, 'invoice');
          }

          if (payment) {
            upsertRealtimeBillingCaches(queryClient, payment, 'payment');
          }

          if (subscription) {
            upsertRealtimeBillingCaches(queryClient, subscription, 'subscription');
          }

          if (plan) {
            upsertRealtimeBillingCaches(queryClient, plan, 'plan');
          }

          if (appointmentId && data.appointment) {
            upsertRealtimeAppointmentCaches(queryClient, {
              ...(data.appointment || {}),
              id: appointmentId,
              appointmentId,
            } as Appointment);
          }

          if (event.startsWith('billing.plan.')) {
            if (!plan) {
              queryClient.invalidateQueries({ queryKey: ['billing-plans'], exact: false });
              queryClient.invalidateQueries({ queryKey: ['billing-plan'], exact: false });
            }
            queryClient.invalidateQueries({ queryKey: ['billing-analytics'], exact: false });
          } else if (event.startsWith('billing.subscription.')) {
            if (!subscription) {
              queryClient.invalidateQueries({ queryKey: ['subscriptions'], exact: false });
              queryClient.invalidateQueries({ queryKey: ['clinic-subscriptions'], exact: false });
              queryClient.invalidateQueries({ queryKey: ['active-subscription'], exact: false });
            }
            queryClient.invalidateQueries({ queryKey: ['billing-analytics'], exact: false });
          } else if (
            event.startsWith('billing.invoice.') ||
            event.startsWith('billing.payment.') ||
            event.startsWith('payment.')
          ) {
            if (!invoice && !payment) {
              invalidateBillingQueryFamilies(queryClient);
            } else {
              queryClient.invalidateQueries({ queryKey: ['clinic-ledger'], exact: false });
              queryClient.invalidateQueries({ queryKey: ['billing-analytics'], exact: false });
            }
            invalidateDashboardQueryFamilies(queryClient);
            if (event === 'payment.completed' || event === 'billing.payment.updated') {
              invalidateAppointmentQueries();
            }
          }

          if (appointmentId && event.startsWith('billing.payment.')) {
            if (!hasRealtimeAppointmentSnapshot(rawData)) {
              invalidateAppointmentQueries();
            }
            invalidateDashboardQueryFamilies(queryClient);
          }
        })
      );

      const userLifecycleEvents = [
        'user.created',
        'user.updated',
        'user.deleted',
        'user.registered',
        'profile.completed',
      ] as const;

      const unsubscribeUserLifecycleEvents = userLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as { clinicId?: string };
          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          invalidateUserQueryFamilies(queryClient);
          invalidateDashboardQueryFamilies(queryClient);
        })
      );

      const clinicLifecycleEvents = ['clinic.created', 'clinic.updated', 'clinic.deleted'] as const;

      const unsubscribeClinicLifecycleEvents = clinicLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as { clinicId?: string; id?: string; clinic?: { id?: string } };
          const resolvedClinicId = String(data.clinicId || data.id || data.clinic?.id || '');

          logger.info(`Realtime clinic event: ${event}`, {
            clinicId: resolvedClinicId,
            currentClinicId: clinicId,
          });

          invalidateClinicQueryFamilies(queryClient);
          invalidateDashboardQueryFamilies(queryClient);
        })
      );

      const ehrLifecycleEvents = [
        'ehr.prescription.created',
        'ehr.medical_history.created',
        'ehr.medical_history.updated',
        'ehr.medical_history.deleted',
        'ehr.lab_report.created',
        'ehr.lab_report.updated',
        'ehr.lab_report.deleted',
        'ehr.radiology_report.created',
        'ehr.radiology_report.updated',
        'ehr.radiology_report.deleted',
        'ehr.surgical_record.created',
        'ehr.surgical_record.updated',
        'ehr.surgical_record.deleted',
        'ehr.vital.created',
        'ehr.vital.updated',
        'ehr.vital.deleted',
        'ehr.allergy.created',
        'ehr.allergy.updated',
        'ehr.allergy.deleted',
        'ehr.medication.created',
        'ehr.medication.updated',
        'ehr.medication.deleted',
        'ehr.immunization.created',
        'ehr.immunization.updated',
        'ehr.immunization.deleted',
        'video.medical_note.saved_to_ehr',
        'video.transcription.saved_to_ehr',
      ] as const;

      const unsubscribeEhrLifecycleEvents = ehrLifecycleEvents.map((event) =>
        subscribe(event, (rawData: unknown) => {
          const data = rawData as { clinicId?: string };
          if (data.clinicId && clinicId && data.clinicId !== clinicId) {
            return;
          }

          invalidateDashboardQueryFamilies(queryClient);
          queryClient.invalidateQueries({ queryKey: ['ehr'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['ehrClinic'], exact: false });
          queryClient.invalidateQueries({ queryKey: ['medicalRecords'], exact: false });

          if (
            event === 'ehr.prescription.created' ||
            event === 'video.medical_note.saved_to_ehr' ||
            event === 'video.transcription.saved_to_ehr'
          ) {
            queryClient.invalidateQueries({ queryKey: ['prescriptions'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['medicineDeskQueue'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['pharmacyStats'], exact: false });
          }
        })
      );

      unsubscribeCallbacks.push(
        unsubscribeAppointmentCreated,
        unsubscribeAppointmentUpdated,
        unsubscribeAppointmentDeleted,
        unsubscribeAppointmentStatusChanged,
        ...unsubscribeAppointmentLifecycleEvents,
        ...unsubscribePaymentLifecycleEvents,
        ...unsubscribeUserLifecycleEvents,
        ...unsubscribeClinicLifecycleEvents,
        ...unsubscribeEhrLifecycleEvents
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
        invalidateDashboardQueryFamilies(queryClient);

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

      const unsubscribeAppointmentQueueReordered = subscribe('appointment.queue.reordered', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

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

      const unsubscribeQueueMetricsEnterprise = subscribe('queue.metrics.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        if (currentClinic?.id) {
          const payloadLocationId =
            typeof data.locationId === 'string' ? data.locationId : undefined;
          const payloadQueueName =
            typeof data.queueName === 'string' ? data.queueName : undefined;
          const snapshot = normalizeQueueStatusSnapshot(data.metrics || data.status || data);

          queryClient.setQueryData(
            getQueueStatusQueryKey(currentClinic.id, payloadLocationId, payloadQueueName),
            snapshot
          );
        }

        invalidateQueueQueries(data);
      });

      const unsubscribeQueueHealthChanged = subscribe('queue.health.changed', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueueAlertCreated = subscribe('queue.alert.created', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueueAlertResolved = subscribe('queue.alert.resolved', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        invalidateQueueQueries(data);
      });

      const unsubscribeQueueReportGenerated = subscribe('queue.report.generated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
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
        unsubscribeAppointmentQueueReordered,
        unsubscribeAppointmentReassigned,
        unsubscribeAppointmentCheckedIn,
        unsubscribeQueueMetrics,
        unsubscribeQueueMetricsEnterprise,
        unsubscribeQueueHealthChanged,
        unsubscribeQueueAlertCreated,
        unsubscribeQueueAlertResolved,
        unsubscribeQueueReportGenerated,
        unsubscribeMedicineDeskUpdated
      );
    }

    // Subscribe to general notifications
    // Backend handles push/email/SMS/WhatsApp delivery
    // Frontend only shows in-app notification and toast for reading
    const handleNotificationEvent = (rawData: unknown) => {
      const data = rawData as Record<string, unknown>;

      if (!userId) return;

      // Map WebSocket notification to store format
      const notificationType = (data.type || data.category || 'SYSTEM') as Notification['type'];
      const notification: Notification = {
        id: (data.id as string) || `ws-${Date.now()}-${Math.random()}`,
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
    };

    const unsubscribeNotification = subscribe('notification', handleNotificationEvent);
    const unsubscribeCommunicationSent = subscribe('communication.sent', handleNotificationEvent);
    const unsubscribePatientNotification = subscribe(
      'communication.patient.notification',
      handleNotificationEvent
    );

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

    unsubscribeCallbacks.push(
      unsubscribeNotification,
      unsubscribeCommunicationSent,
      unsubscribePatientNotification,
      unsubscribeSystemUpdate
    );

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
