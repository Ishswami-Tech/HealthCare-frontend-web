import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getCounselorAppointments,
  getCounselorClients,
  createCounselorAppointment,
  updateCounselorAppointment,
  deleteCounselorAppointment,
  updateCounselorClientSession,
} from '@/lib/actions/counselor.server';
import type { CounselorAppointment, CounselorClient, CounselorSession } from '@/types/medical-records.types';

/**
 * Hook to get all counselor appointments
 */
export const useCounselorAppointments = (counselorId?: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQueryData(
    ['counselorAppointments', counselorId, filters],
    async () => await getCounselorAppointments(counselorId, filters),
    {
      enabled: !!counselorId,
    }
  );
};

/**
 * Hook to get all counselor clients
 */
export const useCounselorClients = (counselorId?: string, filters?: {
  search?: string;
  status?: string;
  condition?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(
    ['counselorClients', counselorId, filters],
    async () => await getCounselorClients(counselorId, filters),
    {
      enabled: !!counselorId,
    }
  );
};

/**
 * Hook to get counselor client by ID
 */
export const useCounselorClient = (counselorId: string, clientId: string) => {
  return useQueryData(
    ['counselorClient', counselorId, clientId],
    async () => await getCounselorClients(counselorId, { clientId }),
    {
      enabled: !!counselorId && !!clientId,
    }
  );
};

/**
 * Hook to create a new counseling appointment
 */
export const useCreateCounselorAppointment = () => {
  return useMutationOperation(
    async (appointmentData: CounselorAppointment) => {
      return await createCounselorAppointment(appointmentData);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CREATE,
      loadingMessage: 'Creating appointment...',
      successMessage: 'Appointment created successfully',
      invalidateQueries: [['counselorAppointments']],
    }
  );
};

/**
 * Hook to update a counseling appointment
 */
export const useUpdateCounselorAppointment = () => {
  return useMutationOperation(
    async ({ appointmentId, updates }: { appointmentId: string; updates: Partial<CounselorAppointment> }) => {
      return await updateCounselorAppointment(appointmentId, updates);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Updating appointment...',
      successMessage: 'Appointment updated successfully',
      invalidateQueries: [['counselorAppointments']],
    }
  );
};

/**
 * Hook to delete a counseling appointment
 */
export const useDeleteCounselorAppointment = () => {
  return useMutationOperation(
    async (appointmentId: string) => {
      return await deleteCounselorAppointment(appointmentId);
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.DELETE,
      loadingMessage: 'Deleting appointment...',
      successMessage: 'Appointment deleted successfully',
      invalidateQueries: [['counselorAppointments']],
    }
  );
};

/**
 * Hook to update client session
 */
export const useUpdateCounselorClientSession = () => {
  return useMutationOperation(
    async ({ counselorId, clientId, sessionData }: {
      counselorId: string;
      clientId: string;
      sessionData: {
        sessionDate?: string;
        notes?: string;
        nextSessionDate?: string;
      };
    }) => {
      return await updateCounselorClientSession(counselorId, clientId, sessionData);
    },
    {
      toastId: TOAST_IDS.PROFILE.COMPLETE,
      loadingMessage: 'Updating session...',
      successMessage: 'Session updated successfully',
      invalidateQueries: [['counselorClients'], ['counselorClient']],
    }
  );
};
