'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { LabResult } from '@/types/medical-records.types';

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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.testType) params.append('testType', filters.testType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await fetch(`${baseUrl}/lab-technician/${labTechnicianId}/results?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch lab results');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${baseUrl}/lab-technician/${labTechnicianId}/patients/${patientId}/results?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient lab results');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch lab results', error);
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/lab-technician/${resultData.labTechnicianId}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(resultData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create lab result');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/lab-technician/results/${resultId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update lab result');
    }

    const data = await response.json();
    return data;
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
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/lab-technician/results/${resultId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete lab result');
    }

    await response.json();
  } catch (error) {
    HealthcareErrorsService.logError('delete lab result', error);
    throw error;
  }
}
