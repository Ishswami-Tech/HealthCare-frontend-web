import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getLabResults,
  getLabResultsByPatientId,
  createLabResult,
  updateLabResult,
  deleteLabResult,
} from '@/lib/actions/lab-technician.server';
import type { LabResult } from '@/types/medical-records.types';

/**
 * Hook to get all lab results
 */
export const useLabTechnicianResults = (labTechnicianId?: string, filters?: {
  testType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
}) => {
  return useQueryData(
    ['labTechnicianResults', labTechnicianId, filters],
    async () => await getLabResults(labTechnicianId, filters),
    {
      enabled: !!labTechnicianId,
    }
  );
};

/**
 * Hook to get lab results for a specific patient
 */
export const useLabTechnicianPatientResults = (
  labTechnicianId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQueryData(
    ['labTechnicianPatientResults', labTechnicianId, patientId, filters],
    async () => await getLabResultsByPatientId(labTechnicianId, patientId, filters),
    {
      enabled: !!labTechnicianId && !!patientId,
    }
  );
};

/**
 * Hook to create a new lab result
 */
export const useCreateLabResult = () => {
  return useMutationOperation(
    async (resultData: LabResult) => {
      return await createLabResult(resultData);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_CREATE,
      loadingMessage: 'Creating lab result...',
      successMessage: 'Lab result created successfully',
      invalidateQueries: [['labTechnicianResults']],
    }
  );
};

/**
 * Hook to update a lab result
 */
export const useUpdateLabResult = () => {
  return useMutationOperation(
    async ({ resultId, updates }: { resultId: string; updates: Partial<LabResult> }) => {
      return await updateLabResult(resultId, updates);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_UPDATE,
      loadingMessage: 'Updating lab result...',
      successMessage: 'Lab result updated successfully',
      invalidateQueries: [['labTechnicianResults']],
    }
  );
};

/**
 * Hook to delete a lab result
 */
export const useDeleteLabResult = () => {
  return useMutationOperation(
    async (resultId: string) => {
      return await deleteLabResult(resultId);
    },
    {
      toastId: TOAST_IDS.EHR.LAB_DELETE,
      loadingMessage: 'Deleting lab result...',
      successMessage: 'Lab result deleted successfully',
      invalidateQueries: [['labTechnicianResults']],
    }
  );
};
