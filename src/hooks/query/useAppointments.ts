"use client";
import { nowIso } from '@/lib/utils/date-time';

// ✅ Appointments Hooks - Backend Integration
// This file provides hooks that integrate with the backend appointments system

import { useCallback, useMemo } from 'react';
import { useCurrentClinicId } from './useClinics';
import { useRBAC } from '../utils/useRBAC';
import { Permission } from '@/types/rbac.types';
import { logger } from '@/lib/utils/logger';
import { useQueryData, useMutationOperation, useOptimisticMutation, useQueryClient } from '../core';
import { TOAST_IDS, useToast } from '../utils/use-toast';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { useAuth } from '../auth/useAuth';
import { Role } from '@/types/auth.types';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import {
  createAppointment,
  getMyAppointments,
  getAppointmentServiceCatalog,
  updateAppointment,
  updateAppointmentStatus, // Consolidated status update
  bulkUpdateAppointmentStatus,
  getUserUpcomingAppointments,
  cancelAppointment,
  testAppointmentContext,
  proposeVideoAppointment,
  confirmVideoSlot,
  confirmFinalVideoSlot,
  rescheduleAppointment,
  rejectVideoProposal,
  reassignAppointmentDoctor,
  getAssistantDoctorCoverage,
  updateAssistantDoctorCoverage,
  checkInAppointment,
  forceCheckInAppointment,
  scanLocationQRAndCheckIn,
} from '@/lib/actions/appointments.server';
import {
  getQueue,
  addToQueue,
  callNextPatient,
  getQueueStats,
} from '@/lib/actions/queue.server';
import {
  getQueueListQueryKey,
  getQueueStatsQueryKey,
} from '@/lib/queue/queue-cache';
import {
  serializeAppointmentQueryKey,
  getAppointmentQueryKey,
  getAppointmentStatsQueryKey,
  toAppointmentFilterParams,
} from '@/lib/query/appointment-query-keys';
import type { 
  CreateAppointmentData, 
  UpdateAppointmentData,
  AppointmentFilters,
  Appointment,
  AppointmentServiceDefinition,
  AssistantDoctorCoverageAssignment,
} from '@/types/appointment.types';

const extractAppointments = (payload: unknown): Appointment[] => {
  const dedupe = (items: Appointment[]) =>
    Array.from(
      new Map(
        items.map((appointment) => {
          const compositeKey = [
            String((appointment as any)?.date || (appointment as any)?.appointmentDate || ""),
            String((appointment as any)?.time || (appointment as any)?.appointmentTime || ""),
            String((appointment as any)?.doctorId || (appointment as any)?.doctor?.id || ""),
            String((appointment as any)?.patientId || (appointment as any)?.patient?.id || ""),
            String((appointment as any)?.type || (appointment as any)?.appointmentType || ""),
            String((appointment as any)?.status || ""),
            String((appointment as any)?.locationId || (appointment as any)?.location?.id || ""),
            String((appointment as any)?.clinicId || (appointment as any)?.clinic?.id || ""),
          ].join("|");

          const id = String(appointment?.id || "");
          return [compositeKey || id, appointment];
        })
      ).values()
    );

  if (Array.isArray(payload)) return dedupe(payload as Appointment[]);
  if (payload && typeof payload === 'object') {
    const record = payload as { appointments?: unknown; data?: unknown };
    if (Array.isArray(record.appointments)) return dedupe(record.appointments as Appointment[]);
    if (Array.isArray(record.data)) return dedupe(record.data as Appointment[]);
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as { appointments?: unknown };
      if (Array.isArray(nested.appointments)) return dedupe(nested.appointments as Appointment[]);
    }
  }
  return [];
};

const getAppointmentCacheId = (appointment: unknown): string => {
  if (!appointment || typeof appointment !== 'object') {
    return '';
  }

  const record = appointment as Record<string, unknown>;
  return String(record.appointmentId || record.id || '');
};

const getAppointmentTimestamp = (appointment: unknown): number => {
  if (!appointment || typeof appointment !== 'object') {
    return 0;
  }

  const record = appointment as Record<string, unknown>;
  const timestamp = String(record.updatedAt || record.updated_at || record.createdAt || record.created_at || '');
  const parsed = new Date(timestamp);
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0;
};

const patchConfirmedAppointmentInPayload = (payload: unknown, updatedAppointment: Appointment): unknown => {
  const targetId = getAppointmentCacheId(updatedAppointment);
  const incomingTimestamp = getAppointmentTimestamp(updatedAppointment);
  if (!targetId) {
    return payload;
  }

  const mergeAppointment = (item: unknown): unknown => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const itemRecord = item as Record<string, unknown>;
    const itemId = getAppointmentCacheId(itemRecord);
    if (!itemId || itemId !== targetId) {
      return item;
    }

    const currentTimestamp = getAppointmentTimestamp(itemRecord);
    if (currentTimestamp > 0 && incomingTimestamp > 0 && currentTimestamp > incomingTimestamp) {
      return item;
    }

    return {
      ...itemRecord,
      ...updatedAppointment,
      id: (updatedAppointment as any).id || itemRecord.id,
      appointmentId: (updatedAppointment as any).appointmentId || itemRecord.appointmentId || itemRecord.id,
      status: (updatedAppointment as any).status || itemRecord.status,
      rawStatus: (updatedAppointment as any).rawStatus || (updatedAppointment as any).status || itemRecord.rawStatus || itemRecord.status,
      confirmedSlotIndex:
        (updatedAppointment as any).confirmedSlotIndex ??
        (updatedAppointment as any).confirmed_slot_index ??
        itemRecord.confirmedSlotIndex ??
        itemRecord.confirmed_slot_index ??
        null,
      confirmed_slot_index:
        (updatedAppointment as any).confirmed_slot_index ??
        (updatedAppointment as any).confirmedSlotIndex ??
        itemRecord.confirmed_slot_index ??
        itemRecord.confirmedSlotIndex ??
        null,
      date:
        (updatedAppointment as any).date ||
        itemRecord.date ||
        itemRecord.appointmentDate ||
        itemRecord.startTime ||
        null,
      appointmentDate:
        (updatedAppointment as any).appointmentDate ||
        (updatedAppointment as any).date ||
        itemRecord.appointmentDate ||
        itemRecord.date ||
        null,
      time:
        (updatedAppointment as any).time ||
        itemRecord.time ||
        itemRecord.appointmentTime ||
        itemRecord.startTime ||
        null,
      appointmentTime:
        (updatedAppointment as any).appointmentTime ||
        (updatedAppointment as any).time ||
        itemRecord.appointmentTime ||
        itemRecord.time ||
        null,
      startTime:
        (updatedAppointment as any).startTime ||
        (updatedAppointment as any).time ||
        itemRecord.startTime ||
        itemRecord.appointmentTime ||
        null,
      endTime:
        (updatedAppointment as any).endTime ||
        itemRecord.endTime ||
        null,
    };
  };

  if (Array.isArray(payload)) {
    return payload.map(mergeAppointment);
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const nextRecord: Record<string, unknown> = { ...record };
  let changed = false;

  if (Array.isArray(record.appointments)) {
    nextRecord.appointments = record.appointments.map(mergeAppointment);
    changed = true;
  }

  if (Array.isArray(record.data)) {
    nextRecord.data = record.data.map(mergeAppointment);
    changed = true;
  }

  if (record.data && typeof record.data === 'object') {
    const nestedData = record.data as Record<string, unknown>;
    if (Array.isArray(nestedData.appointments)) {
      nextRecord.data = {
        ...nestedData,
        appointments: nestedData.appointments.map(mergeAppointment),
      };
      changed = true;
    }
    if (Array.isArray(nestedData.data)) {
      nextRecord.data = {
        ...nestedData,
        data: nestedData.data.map(mergeAppointment),
      };
      changed = true;
    }
  }

  return changed ? nextRecord : payload;
};

const normalizeConfirmedVideoAppointment = (
  appointment: Appointment,
  appointmentId: string
): Appointment => {
  const confirmedSlotIndex =
    (appointment as any).confirmedSlotIndex ??
    (appointment as any).confirmed_slot_index ??
    null;

  return {
    ...appointment,
    id: (appointment as any).appointmentId || (appointment as any).id || appointmentId,
    appointmentId: (appointment as any).appointmentId || appointmentId || (appointment as any).id,
    status: 'CONFIRMED',
    rawStatus: 'CONFIRMED',
    confirmedSlotIndex,
    confirmed_slot_index: confirmedSlotIndex,
    updatedAt: (appointment as any).updatedAt || nowIso(),
  } as Appointment;
};

const upsertAppointmentInPayload = (payload: unknown, appointmentToInsert: Appointment): unknown => {
  const targetId = getAppointmentCacheId(appointmentToInsert);
  if (!targetId) {
    return payload;
  }

  const insertOrReplace = (items: unknown): unknown => {
    if (!Array.isArray(items)) {
      return items;
    }

    const existingIndex = items.findIndex((item) => getAppointmentCacheId(item) === targetId);
    if (existingIndex >= 0) {
      return items.map((item, index) => (index === existingIndex ? { ...item, ...appointmentToInsert } : item));
    }

    return [...items, appointmentToInsert];
  };

  if (Array.isArray(payload)) {
    return insertOrReplace(payload);
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const nextRecord: Record<string, unknown> = { ...record };
  let changed = false;

  if (Array.isArray(record.appointments)) {
    nextRecord.appointments = insertOrReplace(record.appointments);
    changed = true;
  }

  if (Array.isArray(record.data)) {
    nextRecord.data = insertOrReplace(record.data);
    changed = true;
  }

  if (record.data && typeof record.data === 'object') {
    const nestedData = record.data as Record<string, unknown>;
    if (Array.isArray(nestedData.appointments)) {
      nextRecord.data = {
        ...nestedData,
        appointments: insertOrReplace(nestedData.appointments),
      };
      changed = true;
    }
    if (Array.isArray(nestedData.data)) {
      nextRecord.data = {
        ...nestedData,
        data: insertOrReplace(nestedData.data),
      };
      changed = true;
    }
  }

  return changed ? nextRecord : payload;
};

// ✅ Appointment Management Hooks

/**
 * Hook for fetching appointments with filters (Optimized for 100K users)
 */
export const useAppointments = (
  clinicIdOrFilters?: string | (AppointmentFilters & { omitClinicId?: boolean }),
  options?: { enabled?: boolean }
) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  // Memoize query key for performance
  const queryKey = useMemo(
    () => serializeAppointmentQueryKey(clinicId, clinicIdOrFilters),
    [clinicId, clinicIdOrFilters]
  );
  
  // Memoize query function
  const queryFn = useCallback(async (): Promise<any> => {
    // ✅ Consolidated: Use filters parameter only (removed legacy clinicId parameter)
    let filters: AppointmentFilters & { omitClinicId?: boolean } = {};
    
    if (typeof clinicIdOrFilters === 'string') {
      filters = { clinicId: clinicIdOrFilters };
    } else {
      filters = { ...clinicIdOrFilters };
      // Only include clinicId if not explicitly omitted and it exists
      if (!filters.omitClinicId && clinicId) {
        filters.clinicId = clinicId;
      }
    }

    if (!filters.clinicId && !filters.omitClinicId) {
      throw new Error('No clinic ID available and omitClinicId not set');
    }

    const response = await clinicApiClient.get<unknown>(
      API_ENDPOINTS.APPOINTMENTS.GET_ALL,
      toAppointmentFilterParams(filters)
    );
    if (!response.success) {
      throw new Error(response.message || response.error || 'Failed to fetch appointments');
    }

    const appointments = extractAppointments(response.data);
    return {
      success: true,
      appointments,
      data: appointments,
      meta: response.meta,
    } as any;
  }, [clinicId, clinicIdOrFilters]);
  
  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled:
        (options?.enabled ?? true) &&
        (!!clinicId || (typeof clinicIdOrFilters === 'object' && (!!clinicIdOrFilters.omitClinicId || !!clinicIdOrFilters.clinicId))) &&
        hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 5 * 60 * 1000, // 5 minutes for better caching
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnMount: true, // Refetch when invalidated so post-payment redirects see fresh data
      refetchOnReconnect: true,
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied')) {
          return false;
        }
        return failureCount < 2; // Reduce retry attempts
      },
    }
  );
};

export const useAppointmentServices = (enabled: boolean = true) => {
  return useQueryData(
    ['appointment-services'],
    async () => {
      const result = await getAppointmentServiceCatalog();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch appointment services');
      }
      return (result.services || []).filter(
        (service): service is AppointmentServiceDefinition => !!service?.active
      );
    },
    {
      enabled,
      staleTime: 30 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    }
  );
};

// ✅ Removed duplicate useAppointmentsOriginal - useAppointments above handles all cases

/**
 * Hook for fetching a specific appointment by ID
 */
export const useAppointment = (appointmentId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    ['appointment', appointmentId],
    async (): Promise<any> => {
      const response = await clinicApiClient.getAppointmentById(appointmentId);
      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to fetch appointment');
      }
      const appointment =
        response.data && typeof response.data === 'object' && 'appointment' in response.data
          ? (response.data as { appointment?: Appointment }).appointment
          : (response.data as Appointment | undefined);
      return appointment as any;
    },
    {
      enabled: !!appointmentId && hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied') || error.message.includes('not found')) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
};

/**
 * Hook for creating a new appointment with React 19 useOptimistic
 * Provides optimistic UI updates for better UX
 */
export const useCreateAppointment = (clinicId?: string) => {
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  // Memoize mutation function
  const mutationFn = useCallback(async (data: CreateAppointmentData) => {
    if (!hasPermission(Permission.CREATE_APPOINTMENTS)) {
      throw new Error('Insufficient permissions to create appointment');
    }
    
    const result = await createAppointment(data);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create appointment');
    }
    if (!result.appointment) {
        throw new Error('No appointment returned');
    }
    return result.appointment;
  }, [hasPermission]);
  
  // Use optimistic mutation hook
  const queryClient = useQueryClient();
  const { optimisticData, addOptimistic, mutation, isPending } = useOptimisticMutation({
    queryKey: serializeAppointmentQueryKey(clinicId),
    mutationFn,
    optimisticUpdate: (current, variables) => {
      // Create optimistic appointment
      const optimisticAppointment = {
        ...variables,
        id: `temp-${Date.now()}`,
        status: 'SCHEDULED',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        tempId: true,
      } as Appointment & { tempId: boolean };
      return [...current, optimisticAppointment];
    },
    mutationOptions: {
      onSuccess: (appointment: Appointment) => {
        // Invalidate both appointments and myAppointments so all views refresh
        void queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: getAppointmentQueryKey(clinicId), exact: false });
        void queryClient.refetchQueries({ queryKey: getAppointmentQueryKey(clinicId), exact: false, type: 'active' });
        void queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: ['userUpcomingAppointments'], exact: false });
        void queryClient.invalidateQueries({ queryKey: getAppointmentStatsQueryKey(), exact: false });
        if (appointment) {
          toast({
            title: 'Success',
            description: `Appointment scheduled for ${appointment.date ?? ''} at ${appointment.time ?? ''}`,
            id: TOAST_IDS.APPOINTMENT.CREATE, // ✅ Prevent duplicates
          });
        }
      },
      onError: (error: Error) => {
        logger.error('Failed to create appointment', error, { component: 'useAppointments' });
        // ✅ Use centralized error handler
        toast({
          title: 'Error',
          description: sanitizeErrorMessage(error) || 'Failed to create appointment',
          variant: 'destructive',
          id: TOAST_IDS.APPOINTMENT.CREATE, // ✅ Prevent duplicates
        });
      },
      mutationKey: ['createAppointment'],
    },
  });
  
  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    optimisticData,
    addOptimistic,
    isPending,
    data: mutation.data,
    error: mutation.error,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    isIdle: mutation.isIdle,
    reset: mutation.reset,
    status: mutation.status,
    variables: mutation.variables,
  };
};

/**
 * Hook for proposing video appointment with 3-4 time slots (patient flow)
 */
export const useProposeVideoAppointment = () => {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  return useMutationOperation(
    async (data: {
      patientId: string;
      doctorId: string;
      clinicId: string;
      locationId?: string;
      duration: number;
      treatmentType: string;
      proposedSlots: Array<{ date: string; time: string }>;
      notes?: string;
    }) => {
      if (!hasPermission(Permission.CREATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions');
      }
      const result = await proposeVideoAppointment(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to propose video appointment');
      }
      if (!result.appointment) {
          throw new Error('No appointment returned');
      }
      return result.appointment;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CREATE,
      loadingMessage: 'Proposing video appointment...',
      successMessage: 'Slots proposed. Doctor will confirm one.',
      invalidateQueries: [
        ['appointments'],
        ['video-appointments'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['clinicDoctors'],
        ['clinicLocations'],
        ['clinics'],
        ['clinic'],
        ['myClinic'],
        ['queue'],
      ],
      onSuccess: (appointment) => {
        const createdAppointment = appointment as any;
        const appointmentId = String(createdAppointment?.appointmentId || createdAppointment?.id || '');
        if (!appointmentId) {
          return;
        }

        const normalizedCreatedAppointment = {
          ...createdAppointment,
          id: createdAppointment.appointmentId || createdAppointment.id || appointmentId,
          appointmentId: createdAppointment.appointmentId || appointmentId || createdAppointment.id,
          status: (createdAppointment as any).status || 'SCHEDULED',
          rawStatus: (createdAppointment as any).rawStatus || (createdAppointment as any).status || 'SCHEDULED',
        } as Appointment;

        void queryClient.setQueryData(['appointment', appointmentId], normalizedCreatedAppointment);
        void queryClient.setQueryData(['video-appointment', appointmentId], normalizedCreatedAppointment);
        void queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, normalizedCreatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, normalizedCreatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, normalizedCreatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['userUpcomingAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, normalizedCreatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, normalizedCreatedAppointment)
        );
      },
    }
  );
};

/**
 * Hook for confirming video slot (doctor flow)
 */
export const useConfirmVideoSlot = () => {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  return useMutationOperation(
    async ({ appointmentId, confirmedSlotIndex }: { appointmentId: string; confirmedSlotIndex: number }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions');
      }
      const result = await confirmVideoSlot(appointmentId, confirmedSlotIndex);
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm slot');
      }
      if (!result.appointment) {
          throw new Error('No appointment returned');
      }
      return result.appointment;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Confirming slot...',
      successMessage: 'Slot confirmed. Patient can now pay.',
      invalidateQueries: [
        ['appointments'],
        ['video-appointments'],
        ['appointment'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['video-appointment'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['clinicDoctors'],
        ['clinicLocations'],
        ['clinics'],
        ['clinic'],
        ['myClinic'],
      ],
      onSuccess: (confirmedAppointment) => {
        const appointmentId = String((confirmedAppointment as any)?.appointmentId || (confirmedAppointment as any)?.id || '');
        const updatedAppointment = normalizeConfirmedVideoAppointment(
          confirmedAppointment as Appointment,
          appointmentId
        );

        if (appointmentId) {
          void queryClient.setQueryData(['appointment', appointmentId], updatedAppointment);
          void queryClient.setQueryData(['video-appointment', appointmentId], updatedAppointment);
        }
        void queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['appointment'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['userUpcomingAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['video-appointment'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAvailability'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
      },
    }
  );
};

/**
 * Hook for updating an appointment
 */
export const useUpdateAppointment = () => {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  
  return useMutationOperation(
    async ({ id, data }: { id: string; data: UpdateAppointmentData }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to update appointment');
      }
      
      const result = await updateAppointment(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      if (!result.appointment) {
         throw new Error('No appointment returned');
      }
      return result.appointment;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Updating appointment...',
      successMessage: 'Appointment updated successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
      onSuccess: (updatedAppointment) => {
        const appointmentId = String((updatedAppointment as any)?.appointmentId || (updatedAppointment as any)?.id || '');
        if (!appointmentId) {
          return;
        }

        void queryClient.setQueryData(['appointment', appointmentId], updatedAppointment);
        void queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
        void queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
        void queryClient.setQueriesData({ queryKey: ['userUpcomingAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
        void queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
          upsertAppointmentInPayload(current, updatedAppointment as Appointment)
        );
      },
    }
  );
};

// ✅ Fix: cancelAppointment return type (void/success only)
export const useCancelAppointment = () => {
  const { hasPermission } = useRBAC();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutationOperation<{ success: boolean }, { id: string; reason?: string }>(
    async ({ id, reason }: { id: string; reason?: string }) => {
      const isPatient = String(user?.role || '').toUpperCase() === Role.PATIENT;
      const hasAccess = isPatient || hasPermission(Permission.UPDATE_APPOINTMENTS);
      if (!hasAccess) {
        throw new Error('Insufficient permissions to cancel appointment');
      }
      
      const result = await cancelAppointment(id, reason);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CANCEL,
      loadingMessage: 'Cancelling appointment...',
      successMessage: 'Appointment cancelled successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
      onError: (error: Error) => {
        logger.error('Failed to cancel appointment', error, { component: 'useAppointments' });
      },
    }
  );
};

/**
 * Hook for confirming an appointment
 */
export const useConfirmAppointment = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<{ success: boolean }, string>(
    async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to confirm appointment');
      }
      
      const result = await updateAppointmentStatus(appointmentId, { status: 'CONFIRMED' });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Confirming appointment...',
      successMessage: 'Appointment confirmed successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
    }
  );
};

/**
 * Hook for fetching upcoming appointments for the current user
 */
export const useUserUpcomingAppointments = () => {
  const { hasPermission } = useRBAC();

  return useQueryData(
    ['userUpcomingAppointments'],
    async () => {
      // ✅ Fix: No arguments needed for this action
      const result = await getUserUpcomingAppointments() as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.appointments;
    },
    {
      enabled: hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    }
  );
};

// Removed redundant useProcessCheckIn (useCheckInAppointment covers it)

/**
 * Hook for checking in an appointment
 */
export const useCheckInAppointment = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<
    { success: boolean },
    string | { appointmentId: string; reason?: string; locationId?: string }
  >(
    async (
      payload: string | { appointmentId: string; reason?: string; locationId?: string }
    ) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to check in appointment');
      }

      const appointmentId = typeof payload === 'string' ? payload : payload.appointmentId;
      
      const result = await checkInAppointment(
        appointmentId,
        typeof payload === 'string'
          ? undefined
          : {
              ...(payload.reason ? { reason: payload.reason } : {}),
              ...(payload.locationId ? { locationId: payload.locationId } : {}),
            }
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to check in appointment');
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Checking in patient...',
      successMessage: 'Patient check-in confirmed successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
    }
  );
};

/**
 * Hook for starting an appointment
 */
export const useStartAppointment = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<{ success: boolean }, string>(
    async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to start appointment');
      }
      
      const result = await updateAppointmentStatus(appointmentId, { status: 'IN_PROGRESS' });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.START,
      loadingMessage: 'Starting appointment...',
      successMessage: 'Appointment started successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
    }
  );
};

/**
 * Hook for completing an appointment
 */
export const useCompleteAppointment = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<{ success: boolean }, { 
      id: string; 
      data: {
        diagnosis?: string;
        prescription?: string;
        notes?: string;
        treatmentPlan?: string;
        medications?: string[];
        followUpDate?: string;
        followUpNotes?: string;
      }
    }>(
    async ({ id, data }: { 
      id: string; 
      data: {
        diagnosis?: string;
        prescription?: string;
        notes?: string;
        treatmentPlan?: string;
        medications?: string[];
        followUpDate?: string;
        followUpNotes?: string;
        metadata?: Record<string, unknown>;
      }
    }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to complete appointment');
      }
      
      const result = await updateAppointmentStatus(id, { ...data, status: 'COMPLETED' });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.COMPLETE,
      loadingMessage: 'Completing appointment...',
      successMessage: 'Appointment completed successfully',
      invalidateQueries: [
        ['appointments'],
        ['appointment'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['video-appointments'],
        ['prescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
      ],
    }
  );
};

/**
 * Hook for confirming the final video slot, including custom doctor-picked slots.
 */
export const useConfirmFinalVideoSlot = () => {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  return useMutationOperation(
    async (data: {
      appointmentId: string;
      confirmedSlotIndex?: number;
      date?: string;
      time?: string;
      reason?: string;
    }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions');
      }
      const payload: {
        confirmedSlotIndex?: number;
        date?: string;
        time?: string;
        reason?: string;
      } = {};
      if (data.confirmedSlotIndex !== undefined) payload.confirmedSlotIndex = data.confirmedSlotIndex;
      if (data.date !== undefined) payload.date = data.date;
      if (data.time !== undefined) payload.time = data.time;
      if (data.reason !== undefined) payload.reason = data.reason;
      const result = await confirmFinalVideoSlot(data.appointmentId, payload);
      if (!result.success) {
        throw new Error(result.error || 'Failed to confirm final slot');
      }
      if (!result.appointment) {
        throw new Error('No appointment returned');
      }
      return result.appointment;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Confirming final slot...',
      successMessage: 'Final slot confirmed successfully',
      invalidateQueries: [
        ['appointments'],
        ['video-appointments'],
        ['appointment'],
        ['myAppointments'],
        ['userUpcomingAppointments'],
        ['video-appointment'],
        ['doctorAppointments'],
        ['doctorSchedule'],
        ['doctorAvailability'],
        ['clinicDoctors'],
        ['clinicLocations'],
        ['clinics'],
        ['clinic'],
      ['myClinic'],
      ],
      onSuccess: (confirmedAppointment) => {
        const appointmentId = String((confirmedAppointment as any)?.appointmentId || (confirmedAppointment as any)?.id || '');
        const updatedAppointment = normalizeConfirmedVideoAppointment(
          confirmedAppointment as Appointment,
          appointmentId
        );

        if (appointmentId) {
          void queryClient.setQueryData(['appointment', appointmentId], updatedAppointment);
          void queryClient.setQueryData(['video-appointment', appointmentId], updatedAppointment);
        }
        void queryClient.setQueriesData({ queryKey: ['appointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['video-appointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['myAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['userUpcomingAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAppointments'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorSchedule'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
        void queryClient.setQueriesData({ queryKey: ['doctorAvailability'], exact: false }, (current) =>
          patchConfirmedAppointmentInPayload(current, updatedAppointment)
        );
      },
    }
  );
};

/**
 * Hook for receptionist force check-in
 */
export const useForceCheckInAppointment = () => {
  const { hasPermission } = useRBAC();

  return useMutationOperation<
    { success: boolean },
    string | { appointmentId: string; reason?: string; locationId?: string }
  >(
    async (
      payload: string | { appointmentId: string; reason?: string; locationId?: string }
    ) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to check in appointment');
      }

      const appointmentId = typeof payload === 'string' ? payload : payload.appointmentId;

      const result = await forceCheckInAppointment(
        appointmentId,
        typeof payload === 'string'
          ? undefined
          : {
              ...(payload.reason ? { reason: payload.reason } : {}),
              ...(payload.locationId ? { locationId: payload.locationId } : {}),
            }
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to force check in appointment');
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Checking in patient...',
      successMessage: 'Patient check-in confirmed successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments'], ['queue']],
    }
  );
};

/**
 * Hook for marking an appointment as no-show
 */
export const useMarkAppointmentNoShow = () => {
  const { hasPermission } = useRBAC();

  return useMutationOperation<{ success: boolean }, string>(
    async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error("Insufficient permissions to update appointment");
      }

      const result = await updateAppointmentStatus(appointmentId, { status: "NO_SHOW" });
      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: "Marking appointment as no-show...",
      successMessage: "Appointment marked as no-show",
      invalidateQueries: [["appointments"], ["appointment"], ["myAppointments"]],
    }
  );
};

/**
 * Hook for reassigning appointment doctor
 */
export const useReassignAppointmentDoctor = () => {
  const { hasPermission } = useRBAC();

  return useMutationOperation<
    { success: boolean },
    { appointmentId: string; doctorId: string; reason?: string }
  >(
    async ({ appointmentId, doctorId, reason }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error("Insufficient permissions to reassign appointment");
      }

      const result = await reassignAppointmentDoctor(appointmentId, {
        doctorId,
        ...(reason ? { reason } : {}),
      });
      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.REASSIGN,
      loadingMessage: "Reassigning appointment...",
      successMessage: "Appointment reassigned successfully",
      invalidateQueries: [["appointments"], ["appointment"], ["myAppointments"]],
      showLoading: false,
    }
  );
};
  
/**
 * Hook for fetching queue (Optimized for 100K users with smart polling)
 */
export const useQueue = (queueType: string) => {
  const { hasPermission } = useRBAC();
  
  // Memoize query key
  const queryKey = useMemo(
    () => getQueueListQueryKey(undefined, { treatmentType: queueType }),
    [queueType]
  );
  
  // Memoize query function
  const queryFn = useCallback(async () => {
    // ✅ Fix: queueType is passed as filter object
    const result = await getQueue({ treatmentType: queueType }) as any;
    if (!result) {
      throw new Error('Failed to fetch queue');
    }
    return Array.isArray(result?.queue) ? result.queue : result;
  }, [queueType]);
  
  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled: !!queueType && hasPermission(Permission.VIEW_QUEUE),
      staleTime: 15 * 1000, // 15 seconds for real-time feel
    gcTime: 2 * 60 * 1000, // 2 minutes GC for queue data
    refetchInterval: (query) => {
      // Smart polling: faster when queue is active, slower when empty
      const data = query.state.data as any[] | undefined;
      const queueLength = data?.length || 0;
      if (queueLength === 0) return 2 * 60 * 1000; // 2 minutes when empty
      if (queueLength > 10) return 30 * 1000; // 30 seconds when busy
      return 45 * 1000; // 45 seconds default
    },
    refetchIntervalInBackground: false, // Don't poll in background
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Hook for adding patient to queue
 */
export const useAddToQueue = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation(
    async (data: {
      patientId: string;
      appointmentId?: string;
      queueType: string;
      priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    }) => {
      if (!hasPermission(Permission.MANAGE_QUEUE)) {
        throw new Error('Insufficient permissions to add to queue');
      }
      
      const result = await addToQueue(data) as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.queueEntry;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CREATE,
      loadingMessage: 'Adding to queue...',
      successMessage: 'Patient added to queue successfully',
      invalidateQueries: [['queue'], ['queue-status']],
    }
  );
};

/**
 * Hook for calling next patient from queue
 */
export const useCallNextPatient = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation(
    async ({ doctorId, appointmentId }: { doctorId: string; appointmentId: string }) => {
      if (!hasPermission(Permission.MANAGE_QUEUE)) {
        throw new Error('Insufficient permissions to call next patient');
      }
      
      const result = await callNextPatient(doctorId, appointmentId) as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.patient;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Calling next patient...',
      successMessage: 'Next patient called successfully',
      invalidateQueries: [['queue'], ['queue-status']],
    }
  );
};

/**
 * Hook for fetching queue statistics
 */
export const useQueueStats = (locationId?: string) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    getQueueStatsQueryKey(locationId),
    async () => {
      if (!locationId) throw new Error('Location ID required for queue stats');
      // getQueueStats returns raw data directly (no .success/.stats wrapper)
      return await getQueueStats(locationId);
    },
    {
      enabled: !!locationId && hasPermission(Permission.VIEW_QUEUE),
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 60 * 1000, // 1 minute
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied')) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
};

// ✅ Utility Hooks

/**
 * Hook for appointment-aware queries
 */
export const useAppointmentAwareQuery = <T>(
  queryKey: string[],
  queryFn: (appointmentId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    [...queryKey],
    () => queryFn(queryKey[queryKey.length - 1] as string),
    {
      enabled: hasPermission(Permission.VIEW_APPOINTMENTS) && (options?.enabled ?? true),
      refetchInterval: options?.refetchInterval || false,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied')) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
};

/**
 * Hook for checking appointment permissions
 */
export const useAppointmentPermissions = () => {
  const { hasPermission } = useRBAC();
  
  return {
    canRead: hasPermission(Permission.VIEW_APPOINTMENTS),
    canCreate: hasPermission(Permission.CREATE_APPOINTMENTS),
    canUpdate: hasPermission(Permission.UPDATE_APPOINTMENTS),
    canDelete: hasPermission(Permission.DELETE_APPOINTMENTS),
    canManageQueue: hasPermission(Permission.VIEW_QUEUE) && hasPermission(Permission.MANAGE_QUEUE),
  };
};

/**
 * Hook for appointment context
 */
export const useAppointmentContext = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    clinicId,
    hasPermission,
    isAuthenticated: !!clinicId,
    canManageAppointments: hasPermission(Permission.VIEW_APPOINTMENTS) && hasPermission(Permission.UPDATE_APPOINTMENTS),
    canManageQueue: hasPermission(Permission.VIEW_QUEUE) && hasPermission(Permission.MANAGE_QUEUE),
  };
};

// ✅ Additional Hooks for New Functionality

/**
 * Hook for fetching my appointments
 */
export const useMyAppointments = (filters?: {
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}, options?: {
  enabled?: boolean;
}) => {
  const { hasPermission } = useRBAC();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  
  const query = useQueryData(
    ['myAppointments', userId, userRole, filters],
    async (): Promise<any> => {
      // Use server action path so appointmentDate -> date/time normalization
      // stays consistent with the rest of appointment surfaces.
      const result = await getMyAppointments(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch appointments');
      }
      const successfulResult = result as any;
      const appointments = extractAppointments(successfulResult.appointments ?? successfulResult.data);
      return {
        success: true,
        appointments,
        data: {
          appointments,
        },
        meta: successfulResult.meta,
      } as any;
    },
    {
      enabled: (options?.enabled ?? true) && !!userId && hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 2 * 60 * 1000, // reuse recent appointment data across patient pages
      gcTime: 10 * 60 * 1000,
      refetchOnMount: true, // Refetch when invalidated so payment callback navigation refreshes the list
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied')) {
          return false;
        }
        return failureCount < 3;
      },
    }
  );

  return query;
};

/**
 * Hook for fetching doctor availability
 */
export const useDoctorAvailability = (
  clinicId: string,
  doctorId: string,
  date: string,
  locationId?: string,
  appointmentType?: string,
  options?: {
    enabled?: boolean;
    refetchIntervalMs?: number;
  }
) => {
  
  return useQueryData(
    ['doctorAvailability', clinicId, doctorId, date, locationId, appointmentType],
    async (): Promise<any> => {
      const response = await clinicApiClient.getDoctorAvailability(
        doctorId,
        date,
        locationId,
        appointmentType
      );
      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to fetch doctor availability');
      }
      const availability =
        response.data && typeof response.data === 'object' && 'availability' in response.data
          ? (response.data as { availability?: unknown }).availability
          : response.data;
      return availability as any;
    },
    {
      enabled: !!doctorId && !!date && (options?.enabled ?? true), // Enabled for everyone, including guests
      staleTime: options?.refetchIntervalMs ? 0 : 30 * 1000, // Video availability refreshes more aggressively
      gcTime: 2 * 60 * 1000, // 2 minutes garbage collection
      refetchOnMount: true, // Always re-fetch when dialog opens
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchInterval: options?.refetchIntervalMs ?? false,
      retry: (failureCount, error: Error) => {
        if (error.message.includes('Access denied')) {
          return false;
        }
        return failureCount < 2; // Fewer retries for faster feedback
      },
    }
  );
};

// Removed duplicate useUserUpcomingAppointments

/**
 * Hook for testing appointment context (debugging)
 */
export const useTestAppointmentContext = () => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    ['testAppointmentContext'],
    async () => {
      const result = await testAppointmentContext() as any;
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.context;
    },
    {
      enabled: hasPermission(Permission.VIEW_APPOINTMENTS) && process.env.NODE_ENV === 'development',
      staleTime: 0, // Always fresh for debugging
      retry: false,
    }
  );
};

/**
 * Enhanced hook for appointments with better error handling (Optimized for 100K users)
 */
export const useAppointmentsWithErrorHandling = (filters?: AppointmentFilters) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  // Memoize query configuration
  const queryConfig = useMemo(() => {
    const queryKey = ['appointments-enhanced', clinicId, filters];
    
    const queryFn = async (): Promise<any> => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      
      const response = await clinicApiClient.get<unknown>(
        API_ENDPOINTS.APPOINTMENTS.GET_ALL,
        toAppointmentFilterParams({ ...filters, clinicId })
      );
      if (!response.success) {
        // ✅ Use centralized error handler
        const { ERROR_MESSAGES: MSGS } = await import('@/lib/config/config');
        
        // Handle specific error cases with better UX
        const errorMessage = response.message || response.error || MSGS.UNKNOWN_ERROR;
        if (errorMessage.includes('Access denied') || errorMessage.includes('permission')) {
          throw new Error(MSGS.FORBIDDEN);
        }
        if (errorMessage.includes('Network')) {
          throw new Error(MSGS.NETWORK_ERROR);
        }
        if (errorMessage.includes('timeout')) {
          throw new Error(MSGS.TIMEOUT_ERROR);
        }
        
        // Sanitize and use centralized error messages
        const { sanitizeErrorMessage } = await import('@/lib/utils/error-handler');
        throw new Error(sanitizeErrorMessage(errorMessage));
      }
      const appointments = extractAppointments(response.data);
      return { success: true, appointments, data: appointments, meta: response.meta } as any;
    };
    
    return {
      queryKey,
      queryFn,
      enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 3 * 60 * 1000, // 3 minutes for better caching
      gcTime: 5 * 60 * 1000, // 5 minutes GC time
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount: number, error: Error) => {
        // Don't retry on permission errors
        if (error.message.includes('permission') || error.message.includes('Access denied')) {
          return false;
        }
        // Retry network errors with exponential backoff
        if (error.message.includes('Network') || error.message.includes('timeout')) {
          return failureCount < 3;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    };
  }, [clinicId, filters, hasPermission]);
  
  return useQueryData(
    queryConfig.queryKey,
    queryConfig.queryFn,
    {
      enabled: queryConfig.enabled,
      staleTime: queryConfig.staleTime,
      gcTime: queryConfig.gcTime,
      refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
      refetchOnReconnect: queryConfig.refetchOnReconnect,
      retry: queryConfig.retry,
      retryDelay: queryConfig.retryDelay,
    }
  );
};

/**
 * Hook for bulk appointment operations (Optimized for 100K users)
 */
export const useBulkAppointmentOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  // Memoize bulk update function - uses server action for batch processing with failedIds
  const bulkUpdateFn = useCallback(async (data: { 
    appointmentIds: string[]; 
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' 
  }) => {
    if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
      throw new Error('Insufficient permissions for bulk operations');
    }
    
    const result = await bulkUpdateAppointmentStatus(data.appointmentIds, data.status);
    
    return {
      successful: result.updated ?? 0,
      failed: result.failed ?? 0,
      total: data.appointmentIds.length,
      failedIds: result.failedIds ?? [],
      failedReasons: result.failedReasons ?? {},
    };
  }, [hasPermission]);
  
  // Optimized success handler - shows failedIds when available
  const onSuccess = useCallback((
    result: { successful: number; failed: number; total: number; failedIds?: string[]; failedReasons?: Record<string, string> }
  ) => {
    // More targeted cache invalidation
    queryClient.invalidateQueries({ 
      queryKey: ['appointments'],
      refetchType: 'inactive'
    });
    
    if (result.failed > 0) {
      const failedDetail = result.failedIds?.length
        ? ` Failed: ${result.failedIds.slice(0, 5).join(', ')}${result.failedIds.length > 5 ? ` +${result.failedIds.length - 5} more` : ''}`
        : '';
      const reasonSample = result.failedReasons && Object.keys(result.failedReasons).length > 0
        ? ` — ${Object.values(result.failedReasons)[0]}`
        : '';
      toast({
        title: 'Partial Success',
        description: `Updated ${result.successful} appointments. ${result.failed} failed.${failedDetail}${reasonSample}`,
        variant: 'default',
        id: TOAST_IDS.APPOINTMENT.BULK_UPDATE,
      });
    } else {
      toast({
        title: 'Success',
        description: `Successfully updated ${result.successful} appointments.`,
        id: TOAST_IDS.APPOINTMENT.BULK_UPDATE,
      });
    }
  }, [queryClient, toast]);
  
  // Memoized error handler
  const onError = useCallback((error: Error) => {
    logger.error('Bulk operation failed', error, { component: 'useAppointments' });
    // ✅ Use centralized error handler
    toast({
      title: 'Error',
      description: sanitizeErrorMessage(error) || 'Bulk operation failed',
      variant: 'destructive',
      id: TOAST_IDS.APPOINTMENT.BULK_UPDATE, // ✅ Prevent duplicates
    });
  }, [toast]);
  
  const bulkUpdateStatus = useMutationOperation(
    bulkUpdateFn,
    {
      toastId: TOAST_IDS.APPOINTMENT.BULK_UPDATE,
      loadingMessage: 'Updating appointments...',
      successMessage: 'Appointments updated successfully',
      invalidateQueries: [['appointments'], ['myAppointments']],
      onSuccess: (data, _variables) => {
        onSuccess(data);
      },
      onError: (error) => {
        onError(error);
      },
    }
  );
  
  return {
    bulkUpdateStatus: {
      mutate: bulkUpdateStatus.mutate,
      mutateAsync: bulkUpdateStatus.mutateAsync,
      isPending: bulkUpdateStatus.isPending,
    },
  };
};

// ✅ Missing hooks that components are trying to import

/**
 * Hook for appointment statistics
 */
export const useAppointmentStats = () => {
  const { hasPermission } = useRBAC();
  const clinicId = useCurrentClinicId();
  
  return useQueryData(
    getAppointmentStatsQueryKey(clinicId),
    async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      // ✅ Consolidated: Use filters parameter only (removed legacy clinicId parameter)
      const response = await clinicApiClient.get<unknown>(
        API_ENDPOINTS.APPOINTMENTS.GET_ALL,
        { clinicId }
      );
      if (!response.success) {
        throw new Error(response.message || response.error || 'Failed to fetch appointments');
      }
      
      const appointments = extractAppointments(response.data);
      const today = new Date().toDateString();
      
      return {
        totalAppointments: appointments.length,
        todayAppointments: appointments.filter((apt: Appointment) => 
          new Date(apt.date).toDateString() === today
        ).length,
        completedAppointments: appointments.filter((apt: Appointment) => 
          apt.status === 'COMPLETED'
        ).length,
        cancelledAppointments: appointments.filter((apt: Appointment) => 
          apt.status === 'CANCELLED'
        ).length,
      };
    },
    {
      enabled: !!clinicId && hasPermission(Permission.VIEW_APPOINTMENTS),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook for processing check-in
 */
/**
 * Hook for processing check-in
 */
export const useProcessCheckIn = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<{ success: boolean }, { appointmentId: string; patientId: string }>(
    async ({ appointmentId }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to process check-in');
      }
      
      // patientId is not used in the new status update flow
      const result = await updateAppointmentStatus(appointmentId, { status: 'CONFIRMED' });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CHECK_IN,
      loadingMessage: 'Confirming patient arrival...',
      successMessage: 'Patient confirmed and added to queue successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['queue'], ['myAppointments']],
    }
  );
};

// ...

// Removed duplicate useUserUpcomingAppointments

import type { QueueItem } from '@/types/queue.types';

/**
 * Hook for patient queue position
 */
export const usePatientQueuePosition = (patientId: string, queueType: string) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    ['patientQueuePosition', patientId, queueType],
    async () => {
      // ✅ Fix: Pass object to getQueue
      const result = (await getQueue({ type: queueType })) as any;
      if (!result) {
        throw new Error('Failed to fetch queue');
      }
      
      const queue = (Array.isArray(result?.queue) ? result.queue : result || []) as QueueItem[];
      const position = queue.findIndex((entry) => entry.patientId === patientId);
      
      return {
        position: position >= 0 ? position + 1 : null,
        estimatedWaitTime: position >= 0 ? queue[position]?.estimatedWaitTime : null,
        totalInQueue: queue.length,
      };
    },
    {
      enabled: !!patientId && !!queueType && hasPermission(Permission.VIEW_QUEUE),
      refetchInterval: 30 * 1000, 
    }
  );
};

/**
 * Hook for doctor queue
 */
export const useDoctorQueue = (doctorId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    getQueueListQueryKey(undefined, { doctorId }),
    async () => {
      // ✅ Fix: Pass object to getQueue
      const result = (await getQueue({ doctorId })) as any;
      if (!result) {
        throw new Error('Failed to fetch queue');
      }
      
      const queue = (Array.isArray(result?.queue) ? result.queue : result || []) as QueueItem[];
      return queue.filter((entry) => {
        return entry.appointmentId; 
      });
    },
    {
      enabled: !!doctorId && hasPermission(Permission.VIEW_QUEUE),
      refetchInterval: 30 * 1000, 
    }
  );
};

/**
 * Hook for starting consultation
 */
export const useStartConsultation = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation<{ success: boolean }, string>(
    async (appointmentId: string) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to start consultation');
      }
      
      const result = await updateAppointmentStatus(appointmentId, { status: 'IN_PROGRESS' });
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.START,
      loadingMessage: 'Starting consultation...',
      successMessage: 'Consultation started successfully',
      invalidateQueries: [['appointments'], ['myAppointments']],
    }
  );
};

/**
 * Hook to check if appointment can be cancelled
 */
export const useCanCancelAppointment = (appointmentId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQueryData(
    ['canCancelAppointment', appointmentId],
    async () => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        return { canCancel: false, reason: 'Insufficient permissions' };
      }
      
      const response = await clinicApiClient.getAppointmentById(appointmentId);
      const appointment =
        response.data && typeof response.data === 'object' && 'appointment' in response.data
          ? (response.data as { appointment?: Appointment }).appointment
          : (response.data as Appointment | undefined);

      if (!response.success || !appointment) {
        return { canCancel: false, reason: 'Appointment not found' };
      }
      
      const now = new Date();
      const appointmentDate = new Date(`${appointment.date} ${appointment.time}`);
      const hoursDifference = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Can cancel if appointment is more than 2 hours away and not already completed/cancelled
      const canCancel = hoursDifference > 2 && 
                       !['COMPLETED', 'CANCELLED'].includes(appointment.status);
      
      return {
        canCancel,
        reason: canCancel ? null : 
                hoursDifference <= 2 ? 'Cannot cancel within 2 hours of appointment' :
                'Appointment is already completed or cancelled'
      };
    },
    {
      enabled: !!appointmentId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

/**
 * Hook for assistant doctor coverage configuration
 */
export const useAssistantDoctorCoverage = () => {
  return useQueryData(
    ["assistantDoctorCoverage"],
    async () => {
      const result = await getAssistantDoctorCoverage();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch assistant doctor coverage");
      }
      return result.entries || [];
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );
};

/**
 * Hook for updating assistant doctor coverage configuration
 */
export const useUpdateAssistantDoctorCoverage = () => {
  return useMutationOperation<
    AssistantDoctorCoverageAssignment[],
    AssistantDoctorCoverageAssignment[]
  >(
    async (entries) => {
      const result = await updateAssistantDoctorCoverage(entries);
      if (!result.success) {
        throw new Error(result.error || "Failed to update assistant doctor coverage");
      }
      return result.entries || [];
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: "Saving assistant coverage...",
      successMessage: "Assistant doctor coverage saved successfully",
      invalidateQueries: [["assistantDoctorCoverage"]],
    }
  );
};

/**
 * Hook for rescheduling an appointment
 */
export const useRescheduleAppointment = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation(
    async ({ id, data }: { id: string; data: { date: string; time: string; reason?: string } }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to reschedule appointment');
      }
      
      const result = await rescheduleAppointment(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      if (!result.appointment) {
         throw new Error('No appointment returned');
      }
      return result.appointment;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Rescheduling appointment...',
      successMessage: 'Appointment rescheduled successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
    }
  );
};

/**
 * Hook for rejecting video appointment proposal
 */
export const useRejectVideoProposal = () => {
  const { hasPermission } = useRBAC();
  
  return useMutationOperation(
    async ({ id, reason }: { id: string; reason: string }) => {
      if (!hasPermission(Permission.UPDATE_APPOINTMENTS)) {
        throw new Error('Insufficient permissions to reject proposal');
      }
      
      const result = await rejectVideoProposal(id, reason);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { success: true };
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Rejecting proposal...',
      successMessage: 'Proposal rejected successfully',
      invalidateQueries: [['appointments'], ['appointment'], ['myAppointments']],
    }
  );
};

export interface QrCheckInAppointment {
  appointmentId?: string;
  locationId?: string;
  locationName?: string;
  checkedInAt?: string;
  queuePosition?: number;
  totalInQueue?: number;
  estimatedWaitTime?: number;
  doctorId?: string;
  doctorName?: string;
}

export interface QrCheckInSelectionCandidate {
  id: string;
  doctorName?: string;
  doctor?: { name?: string; firstName?: string; lastName?: string };
  startTime?: string;
  time?: string;
  type?: string;
}

export interface QrCheckInResult {
  success: boolean;
  appointment?: QrCheckInAppointment;
  requiresSelection?: boolean;
  appointments?: QrCheckInSelectionCandidate[];
  message?: string;
  error?: string;
  code?: string;
}

export const useScanLocationQrAndCheckIn = () => {
  return useMutationOperation<
    QrCheckInResult,
    {
      code: string;
      locationId?: string;
      appointmentId?: string;
      coordinates?: { lat: number; lng: number };
    }
  >(
    async (data) => {
      const result = (await scanLocationQRAndCheckIn(data)) as QrCheckInResult;
      if (!result.success && !result.requiresSelection) {
        throw new Error(result.error || 'QR check-in failed');
      }
      return result;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CHECK_IN,
      loadingMessage: 'Checking you in...',
      successMessage: 'Check-in successful',
      invalidateQueries: [['appointments'], ['queue'], ['myAppointments']],
      showToast: false,
    }
  );
};
