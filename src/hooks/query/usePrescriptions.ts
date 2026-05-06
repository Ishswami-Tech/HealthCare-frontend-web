import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getPrescriptions,
  getPrescriptionsByPatientId,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '@/lib/actions/prescriptions.server';
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
    async () => await getPrescriptions(doctorId, filters),
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
    async () => await getPrescriptionsByPatientId(doctorId, patientId, filters),
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
      return await createPrescription(prescriptionData);
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
      return await updatePrescription(prescriptionId, updates);
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
      return await deletePrescription(prescriptionId);
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
