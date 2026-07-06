"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@/hooks/core';
import { useWebSocketStore, useAppStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { APP_CONFIG } from '@/lib/config/config';
import {
  getQueueStatusQueryKey,
  normalizeQueueStatusSnapshot,
} from '@/lib/queue/queue-cache';
import { getJwtRefreshDelayMs, refreshClientSessionForRealtime, refreshClientSessionOnce } from '@/lib/utils/auth-recovery';
import { ROUTES } from '@/lib/config/routes';
// ✅ Consolidated: Import types from @/types (single source of truth)
import type { Appointment } from '@/types/appointment.types';
import type { BillingPlan, Invoice, Payment, Subscription } from '@/types/billing.types';
import { useNotificationStore, Notification } from '@/stores/notifications.store';
import { showInfoToast, showWarningToast, TOAST_IDS } from '@/hooks/utils/use-toast';
import { logger } from '@/lib/utils/logger';

// Single source of truth for every appointment-surface query key prefix.
// Defined in `useAppointments.ts` so mutations, the realtime hook, and the
// prefetch helper all share the same list. Re-exported here to keep call
// sites within this file readable.
import { APPOINTMENT_QUERY_FAMILIES } from '@/hooks/query/useAppointments';
import {
  coalesceRealtimeInvalidation,
} from '@/hooks/realtime/useRealtimeInvalidationCoalescer';

export function invalidateAppointmentQueryFamilies(queryClient: QueryClient) {
  // Fan-out invalidation: every appointment-surface query refetches on the
  // next mount. With `placeholderData: keepPreviousData` on the consuming
  // hooks, the previous data remains visible during the refetch so the
  // skeleton doesn't flash. `refetchType: 'none'` is intentionally NOT
  // used here — the realtime event is a state-change signal, not a
  // hint to silently invalidate.
  for (const queryKey of APPOINTMENT_QUERY_FAMILIES) {
    void queryClient.invalidateQueries({ queryKey, exact: false, refetchType: 'none' });
  }
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

function removeAppointmentFromListCaches(
  queryClient: QueryClient,
  id: string,
  ctx: { clinicId?: string; userId?: string } = {}
): void {
  if (!id) {
    return;
  }
  // Each list cache has its own scope field at position [1] of the query key.
  // React Query's setQueriesData({ queryKey, exact: false }) matches any
  // cache whose key array STARTS WITH the provided key array. So we build a
  // per-list prefix that uses whichever scope the actual cache uses:
  //   useAppointments        -> ['appointments', clinicId, serializedFilters]
  //   useMyAppointments      -> ['myAppointments', userId, userRole, filters]
  //   useUserUpcoming        -> ['userUpcomingAppointments']               (bare)
  //   useVideoAppointments   -> ['video-appointments', ...]                (variable)
  //   useDoctorAppointments  -> ['doctorAppointments', doctorId, filters]   (doctorId)
  //   useDoctorSchedule      -> ['doctorSchedule', clinicId, doctorId, date]
  //   useDoctorPatients      -> ['doctorPatients', clinicId, filters]
  // We can't safely construct a prefix for doctor-scoped caches without the
  // doctorId; for those we fall back to the bare list key (acceptable inside
  // a single auth session — no cross-tenant risk).
  const listKeys: Array<readonly unknown[]> = [
    ctx.clinicId ? ['appointments', ctx.clinicId] : ['appointments'],
    ctx.userId ? ['myAppointments', ctx.userId] : ['myAppointments'],
    ['userUpcomingAppointments'],
    ctx.clinicId ? ['video-appointments', ctx.clinicId] : ['video-appointments'],
    ['doctorAppointments'],
    ['doctorSchedule'],
    ctx.clinicId ? ['doctorPatients', ctx.clinicId] : ['doctorPatients'],
  ];

  for (const queryKey of listKeys) {
    queryClient.setQueriesData({ queryKey, exact: false }, (current) =>
      Array.isArray(current)
        ? (current as Appointment[]).filter(
            (a) => String((a as Appointment).appointmentId || (a as Appointment).id || '') !== id
          )
        : current
    );
  }

  // Single-record caches — exact match.
  queryClient.removeQueries({ queryKey: ['appointment', id], exact: true });
  queryClient.removeQueries({ queryKey: ['video-appointment', id], exact: true });
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

function removeRealtimeBillingCaches(
  queryClient: QueryClient,
  id: string,
  entityType: 'invoice' | 'payment' | 'subscription' | 'plan',
  ctx: { clinicId?: string; userId?: string } = {}
): void {
  if (!id) {
    return;
  }

  // Each list cache uses clinicId at position [1] (or no scope). Build a
  // per-list prefix that React Query's setQueriesData({ exact: false }) can
  // match: the provided key must be a prefix of the actual stored key.
  const listKeysByType: Record<typeof entityType, Array<readonly unknown[]>> = {
    invoice: ctx.clinicId
      ? [['invoices', ctx.clinicId], ['clinic-invoices', ctx.clinicId]]
      : [['invoices'], ['clinic-invoices']],
    payment: ctx.clinicId
      ? [['payments', ctx.clinicId], ['clinic-payments', ctx.clinicId]]
      : [['payments'], ['clinic-payments']],
    subscription: ctx.clinicId
      ? [['subscriptions', ctx.clinicId], ['clinic-subscriptions', ctx.clinicId]]
      : [['subscriptions'], ['clinic-subscriptions']],
    plan: [['billing-plans']],
  };

  const exactKeyByType: Record<typeof entityType, readonly unknown[]> = {
    invoice: ['invoice', id],
    payment: ['payment', id],
    subscription: ['subscription', id],
    plan: ['billing-plan', id],
  };

  const listKeys = listKeysByType[entityType];

  for (const queryKey of listKeys) {
    queryClient.setQueriesData({ queryKey, exact: false }, (current) =>
      Array.isArray(current)
        ? (current as Array<Record<string, unknown>>).filter(
            (entry) => {
              const entryId = String(entry?.id || entry?.invoiceId || entry?.paymentId || entry?.subscriptionId || entry?.planId || '');
              return entryId !== id;
            }
          )
        : current
    );
  }

  queryClient.removeQueries({ queryKey: exactKeyByType[entityType], exact: true });

  // For cancelled subscriptions, also evict any active-subscription cache
  // that points at this id (otherwise the UI can keep showing the cancelled
  // subscription as the active one).
  if (entityType === 'subscription') {
    queryClient.setQueriesData({ queryKey: ['active-subscription'], exact: false }, (current) => {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return current;
      }
      const record = current as Record<string, unknown>;
      const currentId = String(record.id || record.subscriptionId || '');
      return currentId === id ? null : current;
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

// Dev/test JWT pattern guard. Manual `localStorage.clear()` rewrites during
// browser console debugging may leave placeholders that look like expired
// tokens. We only check the token VALUE itself — never localStorage keys
// (which can false-positive on production feature flags like
// 'app:feature:stagingclinic_overrides'). This guard is intentionally narrow
// so a dev pattern in some unrelated config can't suppress a real auth error.
const DEV_TOKEN_PATTERN = /currentclinic|stagingclinic|release-/i;

export function shouldBypassAuthRefresh(token: unknown): boolean {
  if (typeof token !== 'string' || token.length === 0) return false;
  return DEV_TOKEN_PATTERN.test(token);
}

export function useWebSocketIntegration(options: UseWebSocketIntegrationOptions = {}) {
  const queryClient = useQueryClient();
  const { user, currentClinic } = useAppStore();
  const session = useAuthStore((state) => state.session);
  const { addNotification } = useNotificationStore();
  const currentClinicId = currentClinic?.id;

  const {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    subscribe,
    emit,
    clearError,
    connectionMetrics,
  } = useWebSocketStore();

  // Expose the most recent disconnect reason so consumers can render messages
  // like "Reconnecting because your session expired…" without traversing the
  // store. Reading directly from connectionMetrics (not a ref) so updates
  // trigger re-renders.
  const lastDisconnectReason = connectionMetrics.lastDisconnectReason;

  const subscriptionsRef = useRef<(() => void)[]>([]);
  const hasSyncedOnConnectRef = useRef(false);
  const authRefreshInFlightRef = useRef(false);
  const websocketUrl =
    APP_CONFIG.WEBSOCKET.URL ||
    APP_CONFIG.API.RAW_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const autoConnect = options.autoConnect ?? true;
  const subscribeToQueues = options.subscribeToQueues ?? true;
  const subscribeToAppointments = options.subscribeToAppointments ?? true;
  const resolvedTenantId = useMemo(
    () =>
      options.tenantId ||
      currentClinicId ||
      session?.user?.clinicId ||
      'default',
    [currentClinicId, options.tenantId, session?.user?.clinicId]
  );
  const resolvedUserId = useMemo(
    () => options.userId || user?.id || undefined,
    [options.userId, user?.id]
  );
  const resolvedClinicId = useMemo(
    () => options.clinicId || currentClinicId || session?.user?.clinicId,
    [currentClinicId, options.clinicId, session?.user?.clinicId]
  );
  const accessToken = session?.access_token;
  const latestAccessTokenRef = useRef(accessToken);
  const hasAccessToken = Boolean(accessToken);
  const tenantId = resolvedTenantId;
  const clinicId = resolvedClinicId;

  const logAppointmentNamespace = useCallback((action: string, context?: Record<string, unknown>) => {
    logger.info(`Appointment live websocket: ${action}`, {
      component: 'appointment-live-ws',
      action,
      ...context,
    });
  }, []);

  const handleNotificationEvent = useCallback((rawData: unknown) => {
    const data = rawData as Record<string, unknown>;

    if (!resolvedUserId) return;

    const notificationType = (data.type || data.category || 'SYSTEM') as Notification['type'];
    const notification: Notification = {
      id: (data.id as string) || `ws-${Date.now()}-${Math.random()}`,
      userId: resolvedUserId,
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

    if (notificationType === 'SYSTEM' || notificationType === 'APPOINTMENT') {
      showInfoToast(notification.title, {
        id: TOAST_IDS.NOTIFICATION.NEW,
        description: notification.message,
        duration: 5000,
      });
    }

    addNotification(notification);
  }, [addNotification, resolvedUserId]);

  const handleSystemUpdateEvent = useCallback((rawData: unknown) => {
    const data = rawData as Record<string, unknown>;

    if (data.type !== 'maintenance' || !resolvedUserId) return;

    const notification: Notification = {
      id: `system-${Date.now()}-${Math.random()}`,
      userId: resolvedUserId,
      type: 'SYSTEM',
      title: 'System Maintenance',
      message: (data.message as string) || 'System maintenance scheduled',
      data: (data.data as Record<string, any>) || {},
      isRead: false,
      createdAt: nowIso(),
    };

    showWarningToast(notification.title, {
      id: TOAST_IDS.NOTIFICATION.NEW,
      description: notification.message,
      duration: 5000,
    });

    addNotification(notification);
  }, [addNotification, resolvedUserId]);

  const registerRealtimeSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((unsubscribe) => unsubscribe());

    const unsubscribeCallbacks: (() => void)[] = [];

    if (subscribeToAppointments && clinicId) {
      // Coalesce so a burst of appointment events (e.g. a single backend
      // mutation producing created+updated+status_changed+checked_in in quick
      // succession, or a token-expiry reconnect firing all handlers at once)
      // collapses into a single invalidation pass within a 200ms window,
      // instead of fanning out N times to 40+ query keys.
      const invalidateAppointmentQueries = () => {
        coalesceRealtimeInvalidation(queryClient, 'appointments', (qc) => {
          invalidateAppointmentQueryFamilies(qc);
        });
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

        if (['EXPIRED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'CONFIRMED', 'RESCHEDULED'].includes(
          String(data.status || '').toUpperCase()
        )) {
          coalesceRealtimeInvalidation(queryClient, 'doctor-availability', (qc) => {
            invalidateDoctorAvailabilityQueryFamilies(qc);
          });
        }
      });

      const unsubscribeAppointmentUpdated = subscribe('appointment.updated', (rawData: unknown) => {
        const data = rawData as {
          appointmentId?: string;
          id?: string;
          status?: string;
          appointment?: Appointment;
          updates?: Partial<Appointment>;
        };
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

        if (['EXPIRED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'CONFIRMED', 'RESCHEDULED'].includes(
          String(data.status || '').toUpperCase()
        )) {
          coalesceRealtimeInvalidation(queryClient, 'doctor-availability', (qc) => {
            invalidateDoctorAvailabilityQueryFamilies(qc);
          });
        }
      });

      // Note: backend does not emit `appointment.deleted` — soft-cancel is the
      // only removal path. List-eviction for cancellations lives in the shared
      // lifecycle handler below (the `appointment.cancelled` branch).

      const unsubscribeAppointmentStatusChanged = subscribe('appointment.status_changed', (rawData: unknown) => {
        const data = rawData as {
          id?: string;
          status?: string;
          timestamp?: string;
          appointment?: Appointment;
        };
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

          // For cancel events the row should disappear from list caches, not
          // just be marked cancelled. Skip the upsert path entirely so we
          // don't briefly insert-then-remove the same row.
          if (event === 'appointment.cancelled' && appointmentId) {
            removeAppointmentFromListCaches(queryClient, appointmentId, {
              clinicId: data.clinicId,
              userId: resolvedUserId,
            });
          } else {
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
          }

          if (!hasRealtimeAppointmentSnapshot(rawData)) {
            invalidateAppointmentQueries();
          }

          if (
            [
              'appointment.confirmed',
              'appointment.rescheduled',
              'appointment.cancelled',
              'appointment.completed',
              'appointment.slot.confirmed',
              'appointment.consultation_started',
              'appointment.noshow',
            ].includes(event)
          ) {
            coalesceRealtimeInvalidation(queryClient, 'doctor-availability', (qc) => {
              invalidateDoctorAvailabilityQueryFamilies(qc);
            });
          }

          // Dashboard/doctor-availability families also coalesce through the
          // same window so a multi-event burst doesn't run them N times.
          coalesceRealtimeInvalidation(queryClient, 'dashboard', (qc) => {
            invalidateDashboardQueryFamilies(qc);
          });
          if (event === 'doctor.availability.changed') {
            coalesceRealtimeInvalidation(queryClient, 'doctor-availability', (qc) => {
              invalidateDoctorAvailabilityQueryFamilies(qc);
            });
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
            if (event === 'billing.subscription.cancelled') {
              // Cancelled subscriptions should not linger in list caches even
              // when the snapshot is missing. Try to derive the id from the
              // snapshot, then from common id fields, and evict aggressively.
              const cancelledId = getRealtimeBillingEntityId(subscription || rawData) ||
                String((data as { subscriptionId?: string }).subscriptionId || '');
              if (cancelledId) {
                removeRealtimeBillingCaches(queryClient, cancelledId, 'subscription', {
                  clinicId: data.clinicId,
                  userId: resolvedUserId,
                });
              }
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
            if (
              event === 'payment.completed' ||
              event === 'billing.payment.updated' ||
              event === 'payment.failed' ||
              event === 'payment.pending'
            ) {
              invalidateAppointmentQueries();
            }
          }

          if (appointmentId && event.startsWith('billing.payment.')) {
            if (!hasRealtimeAppointmentSnapshot(rawData)) {
              invalidateAppointmentQueries();
            }
            invalidateDashboardQueryFamilies(queryClient);
          }

          if (appointmentId && (event === 'payment.failed' || event === 'payment.pending')) {
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
        unsubscribeAppointmentStatusChanged,
        ...unsubscribeAppointmentLifecycleEvents,
        ...unsubscribePaymentLifecycleEvents,
        ...unsubscribeUserLifecycleEvents,
        ...unsubscribeClinicLifecycleEvents,
        ...unsubscribeEhrLifecycleEvents
      );
    }

    // Server emits 'token_expired' (e.g. { message, canReconnect: true }) when
    // the access JWT expires mid-session. Refresh proactively so the socket
    // reconnects without waiting for the first connect_error round-trip.
    const unsubscribeTokenExpired = subscribe('token_expired', async (rawData: unknown) => {
      const data = (rawData ?? {}) as { canReconnect?: boolean; message?: string };
      if (data.canReconnect !== true) {
        return;
      }
      if (authRefreshInFlightRef.current) {
        return;
      }
      authRefreshInFlightRef.current = true;
      try {
        const refreshedSession = await refreshClientSessionOnce('appointment-live-ws');
        if (!refreshedSession?.access_token) {
          // Proactive refresh didn't return a token — schedule a
          // bounded retry with exponential backoff so we don't
          // hammer the auth endpoint after a transient failure.
          scheduleTokenExpiredBackoffRetry(websocketUrl, {
            tenantId,
            userId: resolvedUserId,
            onSuccess: (newToken) => scheduleAuthRefresh(newToken),
            onConnect: registerRealtimeSubscriptions,
            context: 'appointment-live-ws',
            connect,
          });
          return;
        }
        connect(websocketUrl, {
          tenantId,
          userId: resolvedUserId,
          token: refreshedSession.access_token,
          withCredentials: true,
          autoReconnect: true,
          reconnectionAttempts: 5,
          forceReconnect: true,
          onConnect: registerRealtimeSubscriptions,
          onAuthError: async () => {
            // The refresh-token was also stale (or the new access token
            // expired immediately). Fall back to the standard refresh path.
            if (authRefreshInFlightRef.current) return;
            authRefreshInFlightRef.current = true;
            try {
              if (shouldBypassAuthRefresh(refreshedSession.access_token)) {
                return;
              }
              const failedRefreshSession = await refreshClientSessionOnce('appointment-live-ws');
              if (!failedRefreshSession?.access_token) {
                scheduleTokenExpiredBackoffRetry(websocketUrl, {
                  tenantId,
                  userId: resolvedUserId,
                  onSuccess: (newToken) => scheduleAuthRefresh(newToken),
                  onConnect: registerRealtimeSubscriptions,
                  context: 'appointment-live-ws',
                  connect,
                });
                return;
              }
              connect(websocketUrl, {
                tenantId,
                userId: resolvedUserId,
                token: failedRefreshSession.access_token,
                withCredentials: true,
                autoReconnect: true,
                reconnectionAttempts: 5,
                forceReconnect: true,
                onConnect: registerRealtimeSubscriptions,
              });
            } finally {
              authRefreshInFlightRef.current = false;
            }
          },
        });
        scheduleAuthRefresh(refreshedSession.access_token);
      } catch {
        // Refresh threw — schedule a bounded retry with backoff
        // instead of silently leaving the socket dead. Without
        // this the user sees a stuck skeleton even though the
        // server told us reconnection is allowed.
        scheduleTokenExpiredBackoffRetry(websocketUrl, {
          tenantId,
          userId: resolvedUserId,
          onSuccess: (newToken) => scheduleAuthRefresh(newToken),
          onConnect: registerRealtimeSubscriptions,
          context: 'appointment-live-ws',
          connect,
        });
      } finally {
        authRefreshInFlightRef.current = false;
      }
    });
    unsubscribeCallbacks.push(unsubscribeTokenExpired);

    if (subscribeToQueues && clinicId) {
      const invalidateQueueQueries = (qc: QueryClient, payload?: Record<string, unknown>) => {
        const payloadLocationId =
          typeof payload?.locationId === 'string' ? payload.locationId : undefined;
        const payloadQueueName =
          typeof payload?.queueName === 'string' ? payload.queueName : undefined;

        void qc.invalidateQueries({ queryKey: ['queue'], exact: false });
        qc.invalidateQueries({ queryKey: ['queue-status'] });
        qc.invalidateQueries({ queryKey: ['queue-metrics'] });
        if (payloadLocationId || payloadQueueName) {
          void qc.invalidateQueries({
            queryKey: getQueueStatusQueryKey(currentClinicId, payloadLocationId, payloadQueueName),
            exact: true,
          });
        }
      };

      const invalidateMedicineDeskQueries = (qc: QueryClient) => {
        qc.invalidateQueries({ queryKey: ['prescriptions'], exact: false });
        qc.invalidateQueries({ queryKey: ['medicineDeskQueue'], exact: false });
        qc.invalidateQueries({ queryKey: ['pharmacyStats'], exact: false });
      };

      // Hoist + coalesce: a single backend mutation can fire several of these
      // queue events back-to-back. Without coalescing, each one fans out to
      // ~12 queue query keys (queue, queue-status, queue-metrics,
      // queueHistory, queueAnalytics, queueConfig, queueNotifications,
      // queueWaitTimes, queueCapacity, queuePerformanceMetrics, queueAlerts,
      // prescriptions, medicineDeskQueue, pharmacyStats). With 5 events in
      // 200ms that's 60+ refetches scheduled, instead of 12.
      const handleQueueEvent = (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        coalesceRealtimeInvalidation(queryClient, 'queue', (qc) => {
          invalidateQueueQueries(qc, data);
        });
      };

      const queueEventNames = [
        'queue:update',
        'queue.updated',
        'queue.position.updated',
        'queue:patient_added',
        'queue:patient_removed',
        'appointment.queue.updated',
        'appointment.queue.position.updated',
        'appointment.queue.reordered',
        'queue.alert.created',
        'queue.alert.resolved',
        'queue.report.generated',
      ] as const;

      const queueEventUnsubscribers = queueEventNames.map((eventName) =>
        subscribe(eventName, handleQueueEvent)
      );

      const unsubscribeQueueMetrics = subscribe('queue_metrics_update', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        if (currentClinicId) {
          const payloadLocationId =
            typeof data.locationId === 'string' ? data.locationId : undefined;
          const payloadQueueName =
            typeof data.queueName === 'string' ? data.queueName : undefined;
          const snapshot = normalizeQueueStatusSnapshot(data.status || data.metrics || data);

          queryClient.setQueryData(
            getQueueStatusQueryKey(currentClinicId, payloadLocationId, payloadQueueName),
            snapshot
          );
        }

        handleQueueEvent(rawData);
      });

      const unsubscribeQueueMetricsEnterprise = subscribe('queue.metrics.updated', (rawData: unknown) => {
        const data = rawData as Record<string, unknown>;
        if (currentClinicId) {
          const payloadLocationId =
            typeof data.locationId === 'string' ? data.locationId : undefined;
          const payloadQueueName =
            typeof data.queueName === 'string' ? data.queueName : undefined;
          const snapshot = normalizeQueueStatusSnapshot(data.metrics || data.status || data);

          queryClient.setQueryData(
            getQueueStatusQueryKey(currentClinicId, payloadLocationId, payloadQueueName),
            snapshot
          );
        }

        handleQueueEvent(rawData);
      });

      const unsubscribeQueueHealthChanged = subscribe('queue.health.changed', (rawData: unknown) => {
        handleQueueEvent(rawData);
      });

      const unsubscribeMedicineDeskUpdated = subscribe(
        'pharmacy.medicine_desk.updated',
        (rawData: unknown) => {
          coalesceRealtimeInvalidation(queryClient, 'medicine-desk', (qc) => {
            invalidateMedicineDeskQueries(qc);
          });
        }
      );

      unsubscribeCallbacks.push(
        ...queueEventUnsubscribers,
        unsubscribeQueueMetrics,
        unsubscribeQueueMetricsEnterprise,
        unsubscribeQueueHealthChanged,
        unsubscribeMedicineDeskUpdated
      );
    }

    const unsubscribeNotification = subscribe('notification', handleNotificationEvent);
    const unsubscribeCommunicationSent = subscribe('communication.sent', handleNotificationEvent);
    const unsubscribePatientNotification = subscribe(
      'communication.patient.notification',
      handleNotificationEvent
    );

    const unsubscribeSystemUpdate = subscribe('system:update', handleSystemUpdateEvent);

    unsubscribeCallbacks.push(
      unsubscribeNotification,
      unsubscribeCommunicationSent,
      unsubscribePatientNotification,
      unsubscribeSystemUpdate
    );

    if (clinicId) {
      emit('joinRoom', { room: `clinic:${clinicId}` });

      if (subscribeToAppointments && resolvedUserId) {
        emit('joinRoom', { room: `user:${resolvedUserId}` });
      }
    }

    subscriptionsRef.current = unsubscribeCallbacks;

    // Post-auth-refresh reconciliation: when the socket reconnects after a
    // proactive or reactive token refresh, we have a new token but stale
    // appointment caches (the prior refetches were skipped via
    // `isAuthRefreshing`). Do exactly one refetch — coalesced into a single
    // fan-out — so the UI is fresh without piling on extra polling/mount
    // refetches. The realtime event handlers will keep it fresh afterwards.
    if (postAuthRefreshRef.current) {
      postAuthRefreshRef.current = false;
      authFailureCountRef.current = 0;
      invalidateAppointmentQueryFamilies(queryClient);
    }
  }, [
    clinicId,
    emit,
    currentClinicId,
    handleNotificationEvent,
    handleSystemUpdateEvent,
    logAppointmentNamespace,
    queryClient,
    subscribe,
    subscribeToAppointments,
    subscribeToQueues,
    resolvedUserId,
  ]);

  const authRefreshTimerRef = useRef<number | null>(null);

  // Circuit breaker: prevent auth-error storms when the refresh flow itself
  // is broken (e.g. the user is logged out but the page hasn't unmounted yet,
  // or a refresh token is invalid). Without this, every re-render of the
  // hook re-attempts `connect()` -> backend logs "Token expired" repeatedly.
  const authFailureCountRef = useRef(0);
  const authCircuitOpenRef = useRef(false);
  const authCircuitResetTimerRef = useRef<number | null>(null);
  // Set when a `connect()` call follows a successful auth refresh. Cleared
  // after the post-refresh `onConnect` runs a single coalesced refetch of the
  // appointment caches so the UI reconciles without piling on background
  // refetches.
  const postAuthRefreshRef = useRef(false);

  const tripAuthCircuit = useCallback((reason: string) => {
    if (authCircuitOpenRef.current) return;
    authCircuitOpenRef.current = true;
    logger.warn('Socket auth circuit breaker tripped - pausing reconnect attempts', {
      component: 'appointment-live-ws',
      reason,
    });
    if (authCircuitResetTimerRef.current === null) {
      authCircuitResetTimerRef.current = window.setTimeout(() => {
        authCircuitOpenRef.current = false;
        authFailureCountRef.current = 0;
        authCircuitResetTimerRef.current = null;
      }, 60_000);
    }
  }, []);

  const clearAuthRefreshTimer = useCallback(() => {
    if (authRefreshTimerRef.current !== null) {
      window.clearTimeout(authRefreshTimerRef.current);
      authRefreshTimerRef.current = null;
    }
  }, []);

  const scheduleAuthRefresh = useCallback(
    (accessToken?: string) => {
      clearAuthRefreshTimer();
      if (!accessToken) {
        return;
      }

      const delayMs = getJwtRefreshDelayMs(accessToken);
      if (delayMs === null) {
        return;
      }

      authRefreshTimerRef.current = window.setTimeout(async () => {
        if (authRefreshInFlightRef.current) {
          return;
        }

        authRefreshInFlightRef.current = true;
        try {
          const refreshedSession = await refreshClientSessionOnce('appointment-live-ws');
          if (!refreshedSession?.access_token) {
            return;
          }

          postAuthRefreshRef.current = true;
          connect(websocketUrl, {
            tenantId,
            userId: resolvedUserId,
            token: refreshedSession.access_token,
            withCredentials: true,
            autoReconnect: true,
            reconnectionAttempts: 5,
            forceReconnect: true,
            onConnect: registerRealtimeSubscriptions,
            onAuthError: async () => {
              if (authRefreshInFlightRef.current) return;
              authRefreshInFlightRef.current = true;
              try {
                if (shouldBypassAuthRefresh(refreshedSession?.access_token)) {
                  return;
                }
                const failedRefreshSession = await refreshClientSessionOnce('appointment-live-ws');
                if (!failedRefreshSession?.access_token) {
                  return;
                }

                postAuthRefreshRef.current = true;
                connect(websocketUrl, {
                  tenantId,
                  userId: resolvedUserId,
                  token: failedRefreshSession.access_token,
                  withCredentials: true,
                  autoReconnect: true,
                  reconnectionAttempts: 5,
                  forceReconnect: true,
                  onConnect: registerRealtimeSubscriptions,
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

          scheduleAuthRefresh(refreshedSession.access_token);
        } catch (refreshError) {
          logger.warn('Scheduled socket auth refresh failed', {
            component: 'appointment-live-ws',
            error: refreshError instanceof Error ? refreshError.message : String(refreshError),
          });
        } finally {
          authRefreshInFlightRef.current = false;
        }
      }, Math.max(delayMs, 5_000));
    },
    [clearAuthRefreshTimer, connect, registerRealtimeSubscriptions, tenantId, resolvedUserId, websocketUrl]
  );

  useEffect(() => {
    latestAccessTokenRef.current = accessToken;
    if (!autoConnect) return;
    scheduleAuthRefresh(accessToken);
  }, [accessToken, autoConnect, scheduleAuthRefresh]);

  // Initialize WebSocket connection - Real-time enabled
  useEffect(() => {
    if (!autoConnect) return;

    // Create async function to handle WebSocket initialization
    const initializeWebSocket = async () => {
      try {
        // ⚠️ SECURITY: Use APP_CONFIG instead of hardcoded URLs
        const tokenForConnect = latestAccessTokenRef.current;
        if (!tokenForConnect) {
          disconnect();
          clearError();
          return;
        }

        // Connect to main namespace
        connect(websocketUrl, {
          tenantId,
          userId: resolvedUserId,
          token: tokenForConnect,
          withCredentials: true,
          autoReconnect: true,
          reconnectionAttempts: 5,
          onConnect: registerRealtimeSubscriptions,
          onAuthError: async () => {
            if (authCircuitOpenRef.current) {
              return;
            }
            if (authRefreshInFlightRef.current) return;
            authRefreshInFlightRef.current = true;
            try {
              if (shouldBypassAuthRefresh(tokenForConnect)) {
                tripAuthCircuit('bypass');
                return;
              }
              const refreshedSession = await refreshClientSessionOnce('appointment-live-ws');
              if (!refreshedSession?.access_token) {
                authFailureCountRef.current += 1;
                if (authFailureCountRef.current >= 2) {
                  tripAuthCircuit('refresh-returned-no-token');
                }
                return;
              }

              authFailureCountRef.current = 0;
              postAuthRefreshRef.current = true;
              connect(websocketUrl, {
                tenantId,
                userId: resolvedUserId,
                token: refreshedSession.access_token,
                withCredentials: true,
                autoReconnect: true,
                reconnectionAttempts: 5,
                forceReconnect: true,
                onConnect: registerRealtimeSubscriptions,
              });
            } catch (refreshError) {
              authFailureCountRef.current += 1;
              logger.warn('Socket auth refresh failed', {
                component: 'appointment-live-ws',
                error: refreshError instanceof Error ? refreshError.message : String(refreshError),
                attempt: authFailureCountRef.current,
              });
              if (authFailureCountRef.current >= 2) {
                tripAuthCircuit('refresh-threw');
              }
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
      clearAuthRefreshTimer();
      if (authCircuitResetTimerRef.current !== null) {
        window.clearTimeout(authCircuitResetTimerRef.current);
        authCircuitResetTimerRef.current = null;
      }
      subscriptionsRef.current.forEach((unsubscribe) => unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [hasAccessToken, autoConnect, tenantId, resolvedUserId, websocketUrl, connect, disconnect, clearError, clearAuthRefreshTimer, registerRealtimeSubscriptions, tripAuthCircuit]);

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
    lastDisconnectReason,

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
  const currentClinicId = currentClinic?.id;
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
            currentClinicId,
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
  }, [currentClinicId, isConnected, queryClient, normalizedQueueName, subscribe]);

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

// ────────────────────────────────────────────────────────────────────────────
// Module-level backoff helper for the proactive token-expired recovery path.
// ────────────────────────────────────────────────────────────────────────────
//
// When the server emits `token_expired` we kick off a refresh + reconnect.
// If that refresh fails (network blip, expired refresh token, etc.) we MUST
// still retry — otherwise the user's socket stays dead and they see a
// skeleton indefinitely. The previous implementation silently swallowed
// the failure in a `catch {}` block.
//
// This helper schedules a bounded retry with exponential backoff (capped
// at 30s) and a 4-attempt limit. The cap is on purpose: persistent
// failures should surface as a real auth error so the user can re-login,
// not spin in the background forever.
//
// We use a module-level timer reference (not a React ref) because this
// can be called from a `subscribe('token_expired', ...)` callback that
// lives outside the hook lifecycle. We deliberately do not track per-call
// state because two near-simultaneous `token_expired` events should be
// coalesced — if the socket is mid-refresh, we don't need a second one.

interface BackoffRetryArgs {
  tenantId?: string;
  userId?: string;
  context: string;
  connect: (url: string, options: Record<string, unknown>) => void;
  onConnect?: () => void;
  onSuccess: (newToken: string) => void;
}

const BACKOFF_MAX_ATTEMPTS = 4;
const BACKOFF_BASE_DELAY_MS = 2_000;
const BACKOFF_MAX_DELAY_MS = 30_000;
let tokenExpiredBackoffTimer: number | null = null;
let tokenExpiredBackoffAttempts = 0;
let tokenExpiredBackoffInFlight = false;

function clearTokenExpiredBackoffTimer() {
  if (tokenExpiredBackoffTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(tokenExpiredBackoffTimer);
  }
  tokenExpiredBackoffTimer = null;
}

function scheduleTokenExpiredBackoffRetry(
  websocketUrl: string,
  args: BackoffRetryArgs
) {
  if (typeof window === 'undefined') return;
  clearTokenExpiredBackoffTimer();

  if (tokenExpiredBackoffAttempts >= BACKOFF_MAX_ATTEMPTS) {
    // Out of retries — the user has been offline / auth-failing for
    // a while. Force a hard redirect to the login screen so they can
    // re-authenticate instead of staring at a stale skeleton. We use
    // `window.location.assign` (full reload) rather than router push
    // because we want to also wipe any in-memory auth state — that
    // mirrors the pattern used by `useAuth.ts` after sign-out.
    logger.warn('Socket token-expired recovery exhausted retries — forcing re-auth', {
      component: args.context,
      attempts: tokenExpiredBackoffAttempts,
    });
    tokenExpiredBackoffAttempts = 0;
    tokenExpiredBackoffInFlight = false;
    if (typeof window !== 'undefined') {
      // Use a `reset` flag so the login page can show "Session
      // expired — please sign in again" rather than the default
      // auth landing copy. Same convention as `useAuth.ts`.
      const resetFlag = 'reset=true';
      const target =
        ROUTES.LOGIN + (ROUTES.LOGIN.includes('?') ? '&' : '?') + resetFlag;
      window.location.assign(target);
    }
    return;
  }

  // Exponential backoff: 2s, 4s, 8s, 16s — capped at 30s.
  const delayMs = Math.min(
    BACKOFF_BASE_DELAY_MS * 2 ** tokenExpiredBackoffAttempts,
    BACKOFF_MAX_DELAY_MS
  );
  tokenExpiredBackoffAttempts += 1;

  tokenExpiredBackoffTimer = window.setTimeout(() => {
    tokenExpiredBackoffTimer = null;
    if (tokenExpiredBackoffInFlight) return;
    tokenExpiredBackoffInFlight = true;
    void (async () => {
      try {
        const refreshed = await refreshClientSessionOnce(args.context);
        if (!refreshed?.access_token) {
          // Try again with the next backoff window.
          scheduleTokenExpiredBackoffRetry(websocketUrl, args);
          return;
        }
        // Reset the backoff on success — a fresh token puts us back in
        // a stable state.
        tokenExpiredBackoffAttempts = 0;
        args.connect(websocketUrl, {
          tenantId: args.tenantId,
          userId: args.userId,
          token: refreshed.access_token,
          withCredentials: true,
          autoReconnect: true,
          reconnectionAttempts: 5,
          forceReconnect: true,
          onConnect: args.onConnect,
        });
        args.onSuccess(refreshed.access_token);
      } catch (error) {
        logger.warn('Token-expired backoff refresh failed', {
          component: args.context,
          attempt: tokenExpiredBackoffAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
        scheduleTokenExpiredBackoffRetry(websocketUrl, args);
      } finally {
        tokenExpiredBackoffInFlight = false;
      }
    })();
  }, delayMs);
}
