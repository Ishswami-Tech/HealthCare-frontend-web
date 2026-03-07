'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { TherapistAppointment, TherapistPatient, TherapistSession } from '@/types/medical-records.types';

// ===== THERAPIST SERVER ACTIONS =====

/**
 * Get all therapist appointments
 */
export async function getAppointments(
  therapistId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ appointments: TherapistAppointment[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${baseUrl}/therapist/${therapistId}/appointments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch appointments');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch therapist appointments', error);
    throw error;
  }
}

/**
 * Get therapist appointments for a specific patient
 */
export async function getAppointmentsByPatientId(
  therapistId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ appointments: TherapistAppointment[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${baseUrl}/therapist/${therapistId}/patients/${patientId}/appointments?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient appointments');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch patient appointments', error);
    throw error;
  }
}

/**
 * Get all clients for a therapist
 */
export async function getClients(
  therapistId: string,
  filters?: {
    search?: string;
    status?: string;
    condition?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ clients: TherapistPatient[] }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`${baseUrl}/therapist/${therapistId}/clients?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch clients');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch therapist clients', error);
    throw error;
  }
}

/**
 * Get therapist client by ID
 */
export async function getClientsByTherapistId(
  therapistId: string,
  clientId: string
): Promise<{ client: TherapistPatient }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/therapist/${therapistId}/clients/${clientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch client');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('fetch therapist client', error);
    throw error;
  }
}

/**
 * Create a new therapy appointment
 */
export async function createAppointment(
  appointmentData: TherapistAppointment
): Promise<{ appointment: TherapistAppointment }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/therapist/${appointmentData.therapistId}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(appointmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create appointment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('create therapist appointment', error);
    throw error;
  }
}

/**
 * Update a therapy appointment
 */
export async function updateAppointment(
  appointmentId: string,
  updates: Partial<TherapistAppointment>
): Promise<{ appointment: TherapistAppointment }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/therapist/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update appointment');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update therapist appointment', error);
    throw error;
  }
}

/**
 * Delete a therapy appointment
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/therapist/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete appointment');
    }

    await response.json();
  } catch (error) {
    HealthcareErrorsService.logError('delete therapist appointment', error);
    throw error;
  }
}

/**
 * Update client session information
 */
export async function updateClientSession(
  therapistId: string,
  clientId: string,
  sessionData: {
    sessionDate?: string;
    notes?: string;
    nextSessionDate?: string;
  }
): Promise<{ session: TherapistSession }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/therapist/${therapistId}/clients/${clientId}/sessions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    HealthcareErrorsService.logError('update therapist session', error);
    throw error;
  }
}
