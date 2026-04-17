'use server';

import { authenticatedApi } from './auth.server';
import { cookies } from 'next/headers';
import type { TherapistAppointment, TherapistPatient, TherapistSession } from '@/types/medical-records.types';

// ===== THERAPIST SERVER ACTIONS =====
// Therapists are doctors with the THERAPIST role.
// Appointments → /appointments (filtered by doctorId)
// Clients     → /patients/clinic/:clinicId (filtered by doctorId)
// Sessions    → /ehr/medical-history (session notes stored as medical history)

async function getClinicId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('clinic_id')?.value || '';
  } catch {
    return '';
  }
}

/**
 * Get all therapist appointments — proxied through GET /appointments?doctorId=therapistId
 */
export async function getAppointments(
  therapistId?: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ appointments: TherapistAppointment[] }> {
  if (!therapistId) return { appointments: [] };

  const params = new URLSearchParams();
  params.append('doctorId', therapistId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await authenticatedApi<{ appointments: TherapistAppointment[] } | TherapistAppointment[]>(
    `/appointments?${params.toString()}`
  );

  const appointments = Array.isArray(data)
    ? data
    : (data as any)?.appointments || (data as any)?.data || [];
  return { appointments };
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
  const params = new URLSearchParams();
  params.append('doctorId', therapistId);
  params.append('patientId', patientId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await authenticatedApi<{ appointments: TherapistAppointment[] } | TherapistAppointment[]>(
    `/appointments?${params.toString()}`
  );

  const appointments = Array.isArray(data)
    ? data
    : (data as any)?.appointments || (data as any)?.data || [];
  return { appointments };
}

/**
 * Get all clients for a therapist — proxied through GET /patients/clinic/:clinicId?doctorId=therapistId
 */
export async function getClients(
  _therapistId?: string,
  filters?: {
    search?: string;
    status?: string;
    condition?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ clients: TherapistPatient[] }> {
  const clinicId = await getClinicId();
  if (!clinicId) return { clients: [] };

  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (typeof filters?.limit === 'number') params.append('limit', filters.limit.toString());
  if (typeof filters?.offset === 'number') params.append('offset', filters.offset.toString());

  const { data } = await authenticatedApi<{ patients: TherapistPatient[] } | TherapistPatient[]>(
    `/patients/clinic/${clinicId}?${params.toString()}`
  );

  const clients = Array.isArray(data)
    ? data
    : (data as any)?.patients || (data as any)?.data || [];
  return { clients };
}

/**
 * Get therapist client by ID — proxied through GET /patients/:patientId
 */
export async function getClientsByTherapistId(
  _therapistId: string,
  clientId: string
): Promise<{ client: TherapistPatient }> {
  const { data } = await authenticatedApi<TherapistPatient>(
    `/patients/${clientId}`
  );
  return { client: data as TherapistPatient };
}

/**
 * Create therapy appointment — proxied through POST /appointments
 */
export async function createAppointment(
  appointmentData: TherapistAppointment
): Promise<{ appointment: TherapistAppointment }> {
  const { data } = await authenticatedApi<{ appointment: TherapistAppointment } | TherapistAppointment>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        patientId: appointmentData.patientId || appointmentData.clientId,
        doctorId: appointmentData.therapistId || appointmentData.doctorId,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type || 'IN_PERSON',
        treatmentType: appointmentData.treatmentType || 'THERAPY',
        notes: appointmentData.notes,
        duration: appointmentData.duration,
      }),
    }
  );

  const appointment = (data as any)?.appointment || data;
  return { appointment };
}

/**
 * Update therapy appointment — proxied through PATCH /appointments/:id
 */
export async function updateAppointment(
  appointmentId: string,
  updates: Partial<TherapistAppointment>
): Promise<{ appointment: TherapistAppointment }> {
  const { data } = await authenticatedApi<{ appointment: TherapistAppointment } | TherapistAppointment>(
    `/appointments/${appointmentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  );

  const appointment = (data as any)?.appointment || data;
  return { appointment };
}

/**
 * Delete (cancel) therapy appointment — PATCH /appointments/:id/status with CANCELLED
 */
export async function deleteAppointment(appointmentId: string): Promise<void> {
  await authenticatedApi(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
}

/**
 * Update client session — stored as EHR medical history note
 */
export async function updateClientSession(
  _therapistId: string,
  clientId: string,
  sessionData: {
    sessionDate?: string;
    notes?: string;
    nextSessionDate?: string;
  }
): Promise<{ session: TherapistSession }> {
  const { data } = await authenticatedApi<TherapistSession>(
    '/ehr/medical-history',
    {
      method: 'POST',
      body: JSON.stringify({
        userId: clientId,
        type: 'TREATMENT',
        title: 'Therapy Session',
        description: sessionData.notes || '',
        date: sessionData.sessionDate || new Date().toISOString(),
        ...(sessionData.nextSessionDate ? { followUpDate: sessionData.nextSessionDate } : {}),
      }),
    }
  );

  const session: TherapistSession = {
    ...(data as any),
    id: (data as any).id || (data as any)._id,
    therapistId: _therapistId,
    patientId: clientId,
    ...(sessionData.sessionDate ? { sessionDate: sessionData.sessionDate } : {}),
    ...(sessionData.notes ? { notes: sessionData.notes } : {}),
    ...(sessionData.nextSessionDate ? { nextSessionDate: sessionData.nextSessionDate } : {}),
  };

  return { session };
}
