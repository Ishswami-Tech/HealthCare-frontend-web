import { useCallback, useMemo } from 'react';
import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import { useCurrentClinicId } from './useClinics';
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
export const useLabTechnicianResults = (filters?: {
  labTechnicianId?: string;
  testType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
  omitClinicId?: boolean;
}) => {
  const clinicId = useCurrentClinicId();

  const queryKey = useMemo(
    () => ['labTechnicianResults', clinicId, filters],
    [clinicId, filters]
  );

  const queryFn = useCallback(async () => {
    return await getLabResults(filters?.labTechnicianId, filters);
  }, [filters]);

  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled: !!clinicId || !!filters?.omitClinicId,
    }
  );
};

/**
 * Hook to get lab results by patient ID
 */
export const usePatientLabResults = (patientId: string, filters?: {
  labTechnicianId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  omitClinicId?: boolean;
}) => {
  const clinicId = useCurrentClinicId();

  const queryKey = useMemo(
    () => ['patientLabResults', clinicId, patientId, filters],
    [clinicId, patientId, filters]
  );

  const queryFn = useCallback(async () => {
    return await getLabResultsByPatientId(filters?.labTechnicianId || '', patientId, filters);
  }, [filters, patientId]);

  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled: (!!clinicId || !!filters?.omitClinicId) && !!patientId,
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
      invalidateQueries: [['labTechnicianResults'], ['patientLabResults']],
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
      invalidateQueries: [['labTechnicianResults'], ['patientLabResults']],
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
      invalidateQueries: [['labTechnicianResults'], ['patientLabResults']],
    }
  );
};
