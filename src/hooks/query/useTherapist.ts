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

// ===== THERAPIST QUERY HOOKS =====

/**
 * Hook to get all therapist appointments
 */
export const useTherapistAppointments = (therapistId?: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQueryData(
    ['therapistAppointments', therapistId, filters],
    async () => await getAppointments(therapistId, filters),
    {
      enabled: !!therapistId,
    }
  );
};

/**
 * Hook to get therapist appointments for a specific patient
 */
export const useTherapistPatientAppointments = (therapistId: string, patientId: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQueryData(
    ['therapistPatientAppointments', therapistId, patientId, filters],
    async () => await getAppointmentsByPatientId(therapistId, patientId, filters),
    {
      enabled: !!therapistId && !!patientId,
    }
  );
};

/**
 * Hook to get all clients for a therapist
 */
export const useTherapistClients = (therapistId?: string, filters?: {
  search?: string;
  status?: string;
  condition?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(
    ['therapistClients', therapistId, filters],
    async () => await getClients(therapistId, filters),
    {
      enabled: !!therapistId,
    }
  );
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
