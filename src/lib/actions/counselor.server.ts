'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { CounselorAppointment, CounselorClient, CounselorSession } from '@/types/medical-records.types';

/**
 * Get all counselor appointments
 */
export async function getCounselorAppointments(
  counselorId?: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ appointments: CounselorAppointment[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${baseUrl}/counselor/${counselorId}/appointments?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch counselor appointments');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch counselor appointments', error);
    throw error;
  }
}

/**
 * Get all counselor clients
 */
export async function getCounselorClients(
  counselorId?: string,
  filters?: {
    search?: string;
    status?: string;
    condition?: string;
    limit?: number;
    offset?: number;
    clientId?: string;
  }
): Promise<{ clients: CounselorClient[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.clientId) params.append('clientId', filters.clientId);

    const response = await fetch(`${baseUrl}/counselor/${counselorId}/clients?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch counselor clients');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch counselor clients', error);
    throw error;
  }
}

/**
 * Create a new counseling appointment
 */
export async function createCounselorAppointment(
  appointmentData: CounselorAppointment
): Promise<{ appointment: CounselorAppointment }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/counselor/${appointmentData.counselorId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create counseling appointment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('create counseling appointment', error);
    throw error;
  }
}

/**
 * Update a counseling appointment
 */
export async function updateCounselorAppointment(
  appointmentId: string,
  updates: Partial<CounselorAppointment>
): Promise<{ appointment: CounselorAppointment }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/counselor/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update counseling appointment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update counseling appointment', error);
    throw error;
  }
}

/**
 * Delete a counseling appointment
 */
export async function deleteCounselorAppointment(
  appointmentId: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/counselor/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete counseling appointment');
    }

    await response.json();
  } catch (error) {
    HealthcareErrorsService.logError('delete counseling appointment', error);
    throw error;
  }
}

/**
 * Update counselor client session
 */
export async function updateCounselorClientSession(
  counselorId: string,
  clientId: string,
  sessionData: {
    sessionDate?: string;
    notes?: string;
    nextSessionDate?: string;
  }
): Promise<{ session: CounselorSession }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/counselor/${counselorId}/clients/${clientId}/sessions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update counselor session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update counselor session', error);
    throw error;
  }
}
