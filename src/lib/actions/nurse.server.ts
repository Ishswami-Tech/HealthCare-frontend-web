'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { NursePatientRecord, PatientVitals } from '@/types/medical-records.types';
import { clinicApiClient as api } from '@/lib/api/client';

/**
 * Get all nurse patients
 */
export async function getNursePatients(
  nurseId?: string,
  filters?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
    patientId?: string;
    vitalsOnly?: boolean;
  }
): Promise<unknown> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (typeof filters?.limit === 'number') {
      params.append('limit', filters.limit.toString());
      const page =
        typeof filters?.offset === 'number' ? Math.floor(filters.offset / filters.limit) + 1 : 1;
      params.append('page', String(Math.max(page, 1)));
    }
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.vitalsOnly) params.append('vitalsOnly', filters.vitalsOnly.toString());

    // Using the standardized /api/v1/patients endpoint
    const response = await api.get<
      { patients: NursePatientRecord[]; total?: number; page?: number; totalPages?: number } | NursePatientRecord[]
    >(
      `/patients?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch nurse patients');
    }

    return response.data || { patients: [] };
  } catch (error) {
    HealthcareErrorsService.logError('fetch nurse patients', error);
    throw error;
  }
}

/**
 * Create nurse patient record
 */
export async function createNursePatientRecord(
  recordData: NursePatientRecord | PatientVitals
): Promise<{ record: NursePatientRecord }> {
  try {
    const response = await api.post<{ record: NursePatientRecord }>(
      '/ehr/vitals',
      recordData
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to create nurse record');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('create nurse record', error);
    throw error;
  }
}

/**
 * Update nurse patient record
 */
export async function updateNursePatientRecord(
  recordId: string,
  updates: Partial<NursePatientRecord | PatientVitals>
): Promise<{ record: NursePatientRecord }> {
  try {
    const response = await api.put<{ record: NursePatientRecord }>(
      `/ehr/vitals/${recordId}`,
      updates
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to update nurse record');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('update nurse record', error);
    throw error;
  }
}
