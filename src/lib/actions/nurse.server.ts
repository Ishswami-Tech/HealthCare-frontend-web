'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { NursePatientRecord, PatientVitals } from '@/types/medical-records.types';

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
): Promise<{ patients: NursePatientRecord[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.vitalsOnly) params.append('vitalsOnly', filters.vitalsOnly.toString());

    const response = await fetch(`${baseUrl}/nurse/${nurseId}/patients?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch nurse patients');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/nurse/${recordData.nurseId}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(recordData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create nurse record');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/nurse/patients/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update nurse record');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update nurse record', error);
    throw error;
  }
}
