import { useEffect } from 'react';
import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import type { TherapistAppointment, TherapistPatient, TherapistSession } from '@/types/medical-records.types';
import {
  getAppointments,
  getAppointmentsByPatientId,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getClients,
  getClientsByTherapistId,
  updateClientSession,
} from '@/lib/actions/therapist.server';
import { usePatientStore } from '@/stores';

// ===== THERAPIST QUERY HOOKS =====

/**
 * Hook to get all therapist appointments
 */
export const useTherapistAppointments = (therapistId?: string, filters?: {
  status?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}) => {
  return useQueryData(
    ['therapistAppointments', therapistId, filters],
    async () => {
      const cleanedFilters = filters
        ? {
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.startDate ? { startDate: filters.startDate } : {}),
            ...(filters.endDate ? { endDate: filters.endDate } : {}),
          }
        : undefined;
      return await getAppointments(therapistId || '', cleanedFilters);
    },
    {
      enabled: !!therapistId,
    }
  );
};

/**
 * Hook to get therapist appointments for a specific patient
 */
export const useTherapistPatientAppointments = (therapistId: string, patientId: string, filters?: {
  status?: string | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
}) => {
  return useQueryData(
    ['therapistPatientAppointments', therapistId, patientId, filters],
    async () => {
      const cleanedFilters = filters
        ? {
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.startDate ? { startDate: filters.startDate } : {}),
            ...(filters.endDate ? { endDate: filters.endDate } : {}),
          }
        : undefined;
      return await getAppointmentsByPatientId(therapistId, patientId, cleanedFilters);
    },
    {
      enabled: !!therapistId && !!patientId,
    }
  );
};

/**
 * Hook to get all clients for a therapist
 */
export const useTherapistClients = (therapistId?: string, filters?: {
  search?: string | undefined;
  status?: string | undefined;
  condition?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}) => {
  const setCollection = usePatientStore((state) => state.setCollection);

  const query = useQueryData(
    ['therapistClients', therapistId, filters],
    async () => {
      const cleanedFilters = filters
        ? {
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.condition ? { condition: filters.condition } : {}),
            ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
            ...(typeof filters.offset === 'number' ? { offset: filters.offset } : {}),
          }
        : undefined;
      return await getClients(therapistId || '', cleanedFilters);
    },
    {
      enabled: true,
    }
  );

  useEffect(() => {
    const normalizedClients = Array.isArray((query.data as any)?.clients)
      ? (query.data as any).clients
      : Array.isArray(query.data)
        ? query.data
        : [];

    setCollection('therapist', normalizedClients);
  }, [query.data, setCollection]);

  return query;
};

/**
 * Hook to get therapist clients by ID
 */
export const useTherapistClient = (therapistId: string, clientId: string) => {
  return useQueryData(
    ['therapistClient', therapistId, clientId],
    async () => await getClientsByTherapistId(therapistId, clientId),
    {
      enabled: !!therapistId && !!clientId,
    }
  );
};

// ===== THERAPIST MUTATION HOOKS =====

/**
 * Hook to create a new therapy appointment
 */
export const useCreateTherapistAppointment = () => {
  return useMutationOperation(
    async (appointmentData: TherapistAppointment) => {
      return await createAppointment(appointmentData);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CREATE,
      loadingMessage: 'Creating appointment...',
      successMessage: 'Appointment created successfully',
      invalidateQueries: [['therapistAppointments']],
    }
  );
};

/**
 * Hook to update a therapy appointment
 */
export const useUpdateTherapistAppointment = () => {
  return useMutationOperation(
    async ({ appointmentId, updates }: { appointmentId: string; updates: Partial<TherapistAppointment> }) => {
      return await updateAppointment(appointmentId, updates);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Updating appointment...',
      successMessage: 'Appointment updated successfully',
      invalidateQueries: [['therapistAppointments']],
    }
  );
};

/**
 * Hook to delete a therapy appointment
 */
export const useDeleteTherapistAppointment = () => {
  return useMutationOperation(
    async (appointmentId: string) => {
      return await deleteAppointment(appointmentId);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.DELETE,
      loadingMessage: 'Deleting appointment...',
      successMessage: 'Appointment deleted successfully',
      invalidateQueries: [['therapistAppointments']],
    }
  );
};

/**
 * Hook to update client session
 */
export const useUpdateTherapistClientSession = () => {
  return useMutationOperation(
    async ({ therapistId, clientId, sessionData }: {
      therapistId: string;
      clientId: string;
      sessionData: {
        sessionDate?: string;
        notes?: string;
        nextSessionDate?: string;
      };
    }) => {
      return await updateClientSession(therapistId, clientId, sessionData);
    },
    {
      toastId: TOAST_IDS.PROFILE.COMPLETE,
      loadingMessage: 'Updating session...',
      successMessage: 'Session updated successfully',
      invalidateQueries: [['therapistClients'], ['therapistClient']],
    }
  );
};
