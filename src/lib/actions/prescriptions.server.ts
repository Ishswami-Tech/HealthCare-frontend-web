'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { Prescription } from '@/types/medical-records.types';

/**
 * Get all prescriptions
 */
export async function getPrescriptions(
  doctorId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    patientName?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ prescriptions: Prescription[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.patientName) params.append('patientName', filters.patientName);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${baseUrl}/doctors/${doctorId}/prescriptions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch prescriptions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch prescriptions', error);
    throw error;
  }
}

/**
 * Get prescriptions for a specific patient
 */
export async function getPrescriptionsByPatientId(
  doctorId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ prescriptions: Prescription[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${baseUrl}/doctors/${doctorId}/patients/${patientId}/prescriptions?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient prescriptions');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch prescriptions', error);
    throw error;
  }
}

/**
 * Create a new prescription
 */
export async function createPrescription(
  prescriptionData: Prescription
): Promise<{ prescription: Prescription }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/doctors/${prescriptionData.doctorId}/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(prescriptionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create prescription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('create prescription', error);
    throw error;
  }
}

/**
 * Update a prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  updates: Partial<Prescription>
): Promise<{ prescription: Prescription }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/doctors/prescriptions/${prescriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update prescription');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update prescription', error);
    throw error;
  }
}

/**
 * Delete a prescription
 */
export async function deletePrescription(prescriptionId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/doctors/prescriptions/${prescriptionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete prescription');
    }

    await response.json();
  } catch (error) {
    HealthcareErrorsService.logError('delete prescription', error);
    throw error;
  }
}
