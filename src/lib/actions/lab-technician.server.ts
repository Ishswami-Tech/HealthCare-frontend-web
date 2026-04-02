'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { LabResult } from '@/types/medical-records.types';
import { clinicApiClient as api } from '@/lib/api/client';

/**
 * Get all lab results
 */
export async function getLabResults(
  labTechnicianId?: string,
  filters?: {
    testType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    priority?: string;
  }
): Promise<{ results: LabResult[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.testType) params.append('testType', filters.testType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.priority) params.append('priority', filters.priority);

    // Backend: GET /ehr/lab-reports/:userId — use the technician's own userId
    const userPath = labTechnicianId ? `/ehr/lab-reports/${labTechnicianId}` : '/ehr/lab-reports/me';
    const response = await api.get<{ results: LabResult[] }>(
      `${userPath}?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch lab results');
    }

    return response.data || { results: [] };
  } catch (error) {
    HealthcareErrorsService.logError('fetch lab results', error);
    throw error;
  }
}

/**
 * Get lab results for a specific patient
 */
export async function getLabResultsByPatientId(
  labTechnicianId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ results: LabResult[] }> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<{ results: LabResult[] }>(
      `/ehr/lab-reports/${patientId}?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch patient lab results');
    }

    return response.data || { results: [] };
  } catch (error) {
    HealthcareErrorsService.logError('fetch patient lab results', error);
    throw error;
  }
}

/**
 * Create a new lab result
 */
export async function createLabResult(
  resultData: LabResult
): Promise<{ result: LabResult }> {
  try {
    const response = await api.post<{ result: LabResult }>(
      '/ehr/lab-reports',
      resultData
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to create lab result');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('create lab result', error);
    throw error;
  }
}

/**
 * Update a lab result
 */
export async function updateLabResult(
  resultId: string,
  updates: Partial<LabResult>
): Promise<{ result: LabResult }> {
  try {
    const response = await api.put<{ result: LabResult }>(
      `/ehr/lab-reports/${resultId}`,
      updates
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to update lab result');
    }

    return response.data!;
  } catch (error) {
    HealthcareErrorsService.logError('update lab result', error);
    throw error;
  }
}

/**
 * Delete a lab result
 */
export async function deleteLabResult(resultId: string): Promise<void> {
  try {
    const response = await api.delete(
      `/ehr/lab-reports/${resultId}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to delete lab result');
    }
  } catch (error) {
    HealthcareErrorsService.logError('delete lab result', error);
    throw error;
  }
}
