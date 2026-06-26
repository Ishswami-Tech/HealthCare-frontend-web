import { useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import { useAuth } from '@/hooks/auth/useAuth';
import { nowIso } from '@/lib/utils/date-time';
import { usePatientStore } from '@/stores';
import type { CounselorAppointment } from '@/types/medical-records.types';

/**
 * Hook to get all counselor appointments
 */
export const useCounselorAppointments = (
  counselorId?: string,
  filters?: {
    status?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
  }
) => {
  return useQueryData(
    ['counselorAppointments', counselorId, filters],
    async () => {
      const response = await clinicApiClient.get(API_ENDPOINTS.APPOINTMENTS.GET_ALL, {
        ...(counselorId ? { doctorId: counselorId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.startDate ? { startDate: filters.startDate } : {}),
        ...(filters?.endDate ? { endDate: filters.endDate } : {}),
      });
      const result = response.data as any;
      const appointments = Array.isArray(result) ? result : (result?.appointments ?? result?.data ?? []);
      return { appointments };
    },
    {
      enabled: !!counselorId,
      placeholderData: keepPreviousData,
    }
  );
};

/**
 * Hook to get all counselor clients
 */
export const useCounselorClients = (
  counselorId?: string,
  filters?: {
    search?: string | undefined;
    status?: string | undefined;
    condition?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    clientId?: string | undefined;
  }
) => {
  const setCollection = usePatientStore((state) => state.setCollection);
  const { session } = useAuth();
  const clinicId = session?.user?.clinicId;

  const query = useQueryData(
    ['counselorClients', counselorId, filters],
    async () => {
      const cleanedFilters = filters
        ? {
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.condition ? { condition: filters.condition } : {}),
            ...(typeof filters.limit === 'number' ? { limit: filters.limit } : {}),
            ...(typeof filters.offset === 'number' ? { offset: filters.offset } : {}),
            ...(filters.clientId ? { clientId: filters.clientId } : {}),
          }
        : undefined;

      if (!clinicId) return { clients: [] };

      const params = {
        ...(cleanedFilters?.search ? { search: cleanedFilters.search } : {}),
        ...(cleanedFilters?.status ? { status: cleanedFilters.status } : {}),
        ...(cleanedFilters?.clientId ? { patientId: cleanedFilters.clientId } : {}),
        ...(typeof cleanedFilters?.limit === 'number' ? { limit: cleanedFilters.limit } : {}),
        ...(typeof cleanedFilters?.offset === 'number' ? { offset: cleanedFilters.offset } : {}),
      };

      return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.GET_CLINIC_PATIENTS(clinicId), params)).data;
    },
    {
      enabled: true,
      placeholderData: keepPreviousData,
    }
  );

  useEffect(() => {
    const rawClients = (query.data as any)?.clients ?? query.data;
    const normalizedClients = Array.isArray(rawClients)
      ? rawClients
      : Array.isArray((rawClients as any)?.patients)
        ? (rawClients as any).patients
        : Array.isArray((rawClients as any)?.data)
          ? (rawClients as any).data
          : [];

    setCollection('counselor', normalizedClients);
  }, [
    query.data,
    setCollection,
    filters?.search,
    filters?.status,
    filters?.condition,
    filters?.limit,
    filters?.offset,
    filters?.clientId,
  ]);

  return query;
};

/**
 * Hook to get counselor client by ID
 */
export const useCounselorClient = (counselorId: string, clientId: string) => {
  const { session } = useAuth();
  const clinicId = session?.user?.clinicId;

  return useQueryData(
    ['counselorClient', counselorId, clientId],
    async () => {
      if (!clinicId) return { clients: [] };
      return (await clinicApiClient.get(API_ENDPOINTS.PATIENTS.GET_BY_ID(clinicId, clientId))).data;
    },
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
      return (await clinicApiClient.post(API_ENDPOINTS.APPOINTMENTS.CREATE, {
        patientId: appointmentData.patientId || appointmentData.clientId,
        doctorId: appointmentData.counselorId || appointmentData.doctorId,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type || 'IN_PERSON',
        treatmentType: appointmentData.treatmentType || 'THERAPY',
        notes: appointmentData.notes,
        duration: appointmentData.duration,
      })).data;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.CREATE,
      loadingMessage: 'Creating appointment...',
      successMessage: 'Appointment created successfully',
      invalidateQueries: [
        ['counselorAppointments'],
        ['counselorClients'],
        ['counselorClient'],
      ],
    }
  );
};

/**
 * Hook to update a counseling appointment
 */
export const useUpdateCounselorAppointment = () => {
  return useMutationOperation(
    async ({ appointmentId, updates }: { appointmentId: string; updates: Partial<CounselorAppointment> }) => {
      return (await clinicApiClient.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(appointmentId), updates)).data;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.UPDATE,
      loadingMessage: 'Updating appointment...',
      successMessage: 'Appointment updated successfully',
      invalidateQueries: [
        ['counselorAppointments'],
        ['counselorClients'],
        ['counselorClient'],
      ],
    }
  );
};

/**
 * Hook to delete a counseling appointment
 */
export const useDeleteCounselorAppointment = () => {
  return useMutationOperation(
    async (appointmentId: string) => {
      return (await clinicApiClient.patch(API_ENDPOINTS.APPOINTMENTS.STATUS(appointmentId), { status: 'CANCELLED' })).data;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.DELETE,
      loadingMessage: 'Deleting appointment...',
      successMessage: 'Appointment deleted successfully',
      invalidateQueries: [
        ['counselorAppointments'],
        ['counselorClients'],
        ['counselorClient'],
      ],
    }
  );
};

/**
 * Hook to update client session
 */
export const useUpdateCounselorClientSession = () => {
  return useMutationOperation(
    async ({ clientId, sessionData }: {
      counselorId: string;
      clientId: string;
      sessionData: {
        sessionDate?: string;
        notes?: string;
        nextSessionDate?: string;
      };
    }) => {
      return (await clinicApiClient.post(API_ENDPOINTS.EHR.MEDICAL_HISTORY.CREATE, {
        userId: clientId,
        type: 'TREATMENT',
        title: 'Counseling Session',
        description: sessionData.notes || '',
        date: sessionData.sessionDate || nowIso(),
        ...(sessionData.nextSessionDate ? { followUpDate: sessionData.nextSessionDate } : {}),
      })).data;
    },
    {
      toastId: TOAST_IDS.PROFILE.COMPLETE,
      loadingMessage: 'Updating session...',
      successMessage: 'Session updated successfully',
      invalidateQueries: [
        ['counselorClients'],
        ['counselorClient'],
        ['counselorAppointments'],
      ],
    }
  );
};
