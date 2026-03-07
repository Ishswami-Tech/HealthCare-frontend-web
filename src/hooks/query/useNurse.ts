import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getNursePatients,
  createNursePatientRecord,
  updateNursePatientRecord,
} from '@/lib/actions/nurse.server';
import type { NursePatientRecord, PatientVitals } from '@/types/medical-records.types';

/**
 * Hook to get all nurse patients
 */
export const useNursePatients = (nurseId?: string, filters?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(
    ['nursePatients', nurseId, filters],
    async () => await getNursePatients(nurseId, filters),
    {
      enabled: !!nurseId,
    }
  );
};

/**
 * Hook to get nurse patient by ID
 */
export const useNursePatient = (nurseId: string, patientId: string) => {
  return useQueryData(
    ['nursePatient', nurseId, patientId],
    async () => await getNursePatients(nurseId, { patientId }),
    {
      enabled: !!nurseId && !!patientId,
    }
  );
};

/**
 * Hook to get patient vitals
 */
export const useNursePatientVitals = (nurseId: string, patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  return useQueryData(
    ['nursePatientVitals', nurseId, patientId, filters],
    async () => await getNursePatients(nurseId, { patientId, vitalsOnly: true }),
    {
      enabled: !!nurseId && !!patientId,
    }
  );
};

/**
 * Hook to create nurse patient record
 */
export const useCreateNursePatientRecord = () => {
  return useMutationOperation(
    async (recordData: NursePatientRecord | PatientVitals) => {
      return await createNursePatientRecord(recordData);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_CREATE,
      loadingMessage: 'Creating patient record...',
      successMessage: 'Record created successfully',
      invalidateQueries: [['nursePatients'], ['nursePatient']],
    }
  );
};

/**
 * Hook to update nurse patient record
 */
export const useUpdateNursePatientRecord = () => {
  return useMutationOperation(
    async ({ recordId, updates }: { recordId: string; updates: Partial<NursePatientRecord | PatientVitals> }) => {
      return await updateNursePatientRecord(recordId, updates);
    },
    {
      toastId: TOAST_IDS.EHR.VITAL_UPDATE,
      loadingMessage: 'Updating patient record...',
      successMessage: 'Record updated successfully',
      invalidateQueries: [['nursePatients'], ['nursePatient'], ['nursePatientVitals']],
    }
  );
};
