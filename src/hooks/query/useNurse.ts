import { useCallback, useEffect, useMemo } from 'react';
import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import { useCurrentClinicId } from './useClinics';
import {
  getNursePatients,
  createNursePatientRecord,
  updateNursePatientRecord,
} from '@/lib/actions/nurse.server';
import { usePatientStore } from '@/stores';
import type { NursePatientRecord, PatientVitals } from '@/types/medical-records.types';

/**
 * Hook to get all nurse patients
 */
export const useNursePatients = (filters?: {
  nurseId?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  omitClinicId?: boolean;
}) => {
  const clinicId = useCurrentClinicId();
  const setCollection = usePatientStore((state) => state.setCollection);
  
  const queryKey = useMemo(
    () => ['nursePatients', clinicId, filters],
    [clinicId, filters]
  );

  const queryFn = useCallback(async () => {
    const result = await getNursePatients(filters?.nurseId, filters);
    return result || { patients: [] };
  }, [filters]);

  const query = useQueryData(
    queryKey,
    queryFn,
    {
      enabled: !!clinicId || !!filters?.omitClinicId,
    }
  );

  useEffect(() => {
    const normalizedPatients = Array.isArray(query.data?.patients)
      ? query.data.patients
      : [];

    setCollection('nurse', normalizedPatients);
  }, [query.data, setCollection]);

  return query;
};

/**
 * Hook to get nurse patient by ID
 */
export const useNursePatient = (patientId: string, nurseId?: string) => {
  const clinicId = useCurrentClinicId();

  const queryKey = useMemo(
    () => ['nursePatient', clinicId, patientId, nurseId],
    [clinicId, patientId, nurseId]
  );

  const queryFn = useCallback(async () => {
    const result = await getNursePatients(nurseId, { patientId });
    return result || { patients: [] };
  }, [nurseId, patientId]);

  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled: (!!clinicId && !!patientId),
    }
  );
};

/**
 * Hook to get patient vitals
 */
export const useNursePatientVitals = (
  patientId?: string,
  filters?: {
    nurseId?: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    limit?: number | undefined;
    omitClinicId?: boolean;
  }
) => {
  const clinicId = useCurrentClinicId();

  const queryKey = useMemo(
    () => ['nursePatientVitals', clinicId, patientId, filters],
    [clinicId, patientId, filters]
  );

  const queryFn = useCallback(async () => {
    const result = await getNursePatients(filters?.nurseId, {
      patientId,
      vitalsOnly: true,
      omitClinicId: filters?.omitClinicId,
    } as any); // Type cast to allow omitClinicId through to server action
    const patients = Array.isArray(result?.patients) ? result.patients : [];
    const vitals = patients.flatMap((p: any) => (Array.isArray(p?.vitals) ? p.vitals : []));
    return { vitals };
  }, [filters, patientId]);

  return useQueryData(
    queryKey,
    queryFn,
    {
      enabled: !!clinicId || !!filters?.omitClinicId,
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
      invalidateQueries: [['nursePatients'], ['nursePatient'], ['nursePatientVitals']],
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
