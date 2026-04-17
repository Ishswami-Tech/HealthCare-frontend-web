'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { Prescription } from '@/types/medical-records.types';
import { clinicApiClient as api } from '@/lib/api/client';

/**
 * Get all prescriptions for the current doctor/clinic
 * Backend: GET /pharmacy/prescriptions (clinic-scoped via guard)
 */
export async function getPrescriptions(
  doctorId?: string,
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
    const params = new URLSearchParams();
    if (doctorId) params.append('doctorId', doctorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.patientName) params.append('patientName', filters.patientName);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get<unknown>(
      `/pharmacy/prescriptions?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch prescriptions');
    }

    const data = response.data;
    // Backend returns array or { prescriptions: [...] }
    const prescriptions = Array.isArray(data)
      ? (data as Prescription[])
      : ((data as { prescriptions?: Prescription[] })?.prescriptions ?? []);

    return { prescriptions };
  } catch (error) {
    HealthcareErrorsService.logError('fetch prescriptions', error);
    throw error;
  }
}

/**
 * Get prescriptions for a specific patient
 * Backend: GET /pharmacy/prescriptions/patient/:userId
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
    const params = new URLSearchParams();
    if (doctorId) params.append('doctorId', doctorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<unknown>(
      `/pharmacy/prescriptions/patient/${patientId}?${params.toString()}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch patient prescriptions');
    }

    const data = response.data;
    const prescriptions = Array.isArray(data)
      ? (data as Prescription[])
      : ((data as { prescriptions?: Prescription[] })?.prescriptions ?? []);

    return { prescriptions };
  } catch (error) {
    HealthcareErrorsService.logError('fetch patient prescriptions', error);
    throw error;
  }
}

/**
 * Create a new prescription
 * Backend: POST /pharmacy/prescriptions
 */
export async function createPrescription(
  prescriptionData: Prescription
): Promise<{ prescription: Prescription }> {
  try {
    const response = await api.post<unknown>(
      '/pharmacy/prescriptions',
      prescriptionData
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to create prescription');
    }

    const data = response.data;
    const prescription = ((data as { prescription?: Prescription })?.prescription ?? data) as Prescription;

    return { prescription };
  } catch (error) {
    HealthcareErrorsService.logError('create prescription', error);
    throw error;
  }
}

/**
 * Update a prescription status
 * Backend: PATCH /pharmacy/prescriptions/:id/status
 */
export async function updatePrescription(
  prescriptionId: string,
  updates: Partial<Prescription>
): Promise<{ prescription: Prescription }> {
  try {
    const response = await api.patch<unknown>(
      `/pharmacy/prescriptions/${prescriptionId}/status`,
      updates
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to update prescription');
    }

    const data = response.data;
    const prescription = ((data as { prescription?: Prescription })?.prescription ?? data) as Prescription;

    return { prescription };
  } catch (error) {
    HealthcareErrorsService.logError('update prescription', error);
    throw error;
  }
}

/**
 * Delete a prescription
 * Backend: No direct delete endpoint — use status update to CANCELLED
 */
export async function deletePrescription(prescriptionId: string): Promise<void> {
  try {
    const response = await api.patch<unknown>(
      `/pharmacy/prescriptions/${prescriptionId}/status`,
      { status: 'CANCELLED' }
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to cancel prescription');
    }
  } catch (error) {
    HealthcareErrorsService.logError('delete prescription', error);
    throw error;
  }
}
