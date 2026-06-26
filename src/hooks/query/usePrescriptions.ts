import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { Prescription } from '@/types/medical-records.types';

/**
 * Hook to get all prescriptions
 */
export const usePrescriptions = (doctorId?: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  limit?: number;
  offset?: number;
}, options?: {
  enabled?: boolean;
}) => {
  return useQueryData(
    ['prescriptions', doctorId, filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.LIST, { doctorId, ...filters });
      const payload = result.data as { prescriptions?: Prescription[]; data?: Prescription[] } | undefined;
      return { prescriptions: payload?.prescriptions ?? payload?.data ?? [] };
    },
    {
      enabled: (options?.enabled ?? true) && !!doctorId,
    }
  );
};

/**
 * Hook to get prescriptions for a specific patient
 */
export const usePatientPrescriptions = (
  doctorId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQueryData(
    ['patientPrescriptions', doctorId, patientId, filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET_BY_PATIENT(patientId), {
        doctorId,
        ...filters,
      });
      const payload = result.data as { prescriptions?: Prescription[]; data?: Prescription[] } | undefined;
      return { prescriptions: payload?.prescriptions ?? payload?.data ?? [] };
    },
    {
      enabled: !!doctorId && !!patientId,
    }
  );
};

/**
 * Hook to create a new prescription
 */
export const useCreatePrescription = () => {
  return useMutationOperation(
    async (prescriptionData: Prescription) => {
      return await clinicApiClient.post(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.CREATE, prescriptionData);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.CREATE,
      loadingMessage: 'Creating prescription...',
      successMessage: 'Prescription created successfully',
      invalidateQueries: [
        ['prescriptions'],
        ['patientPrescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
        ['medicalRecords'],
        ['ehr'],
        ['ehrClinic'],
      ],
    }
  );
};

/**
 * Hook to update a prescription
 */
export const useUpdatePrescription = () => {
  return useMutationOperation(
    async ({ prescriptionId, updates }: { prescriptionId: string; updates: Partial<Prescription> }) => {
      return await clinicApiClient.put(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.UPDATE_STATUS(prescriptionId), updates);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.UPDATE,
      loadingMessage: 'Updating prescription...',
      successMessage: 'Prescription updated successfully',
      invalidateQueries: [
        ['prescriptions'],
        ['patientPrescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
        ['medicalRecords'],
        ['ehr'],
        ['ehrClinic'],
      ],
    }
  );
};

/**
 * Hook to delete a prescription
 */
export const useDeletePrescription = () => {
  return useMutationOperation(
    async (prescriptionId: string) => {
      return await clinicApiClient.delete(API_ENDPOINTS.PHARMACY.PRESCRIPTIONS.GET(prescriptionId));
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.DELETE,
      loadingMessage: 'Deleting prescription...',
      successMessage: 'Prescription deleted successfully',
      invalidateQueries: [
        ['prescriptions'],
        ['patientPrescriptions'],
        ['patient-prescriptions'],
        ['medical-records'],
        ['medicalRecords'],
        ['ehr'],
        ['ehrClinic'],
      ],
    }
  );
};
