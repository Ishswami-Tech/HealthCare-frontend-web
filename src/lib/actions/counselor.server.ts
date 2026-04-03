'use server';

import { authenticatedApi } from './auth.server';
import { cookies } from 'next/headers';
import type { CounselorAppointment, CounselorClient, CounselorSession } from '@/types/medical-records.types';

// ===== COUNSELOR SERVER ACTIONS =====
// Counselors are doctors with the COUNSELOR role.
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
 * Get all counselor appointments — proxied through GET /appointments?doctorId=counselorId
 */
export async function getCounselorAppointments(
  counselorId?: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ appointments: CounselorAppointment[] }> {
  if (!counselorId) return { appointments: [] };

  const params = new URLSearchParams();
  params.append('doctorId', counselorId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const { data } = await authenticatedApi<{ appointments: CounselorAppointment[] } | CounselorAppointment[]>(
    `/appointments?${params.toString()}`
  );

  const appointments = Array.isArray(data)
    ? data
    : (data as any)?.appointments || (data as any)?.data || [];
  return { appointments };
}

/**
 * Get counselor clients — proxied through GET /patients/clinic/:clinicId?doctorId=counselorId
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
  if (!counselorId) return { clients: [] };

  const clinicId = await getClinicId();
  if (!clinicId) return { clients: [] };

  const params = new URLSearchParams();
  params.append('doctorId', counselorId);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (typeof filters?.limit === 'number') params.append('limit', filters.limit.toString());
  if (typeof filters?.offset === 'number') params.append('offset', filters.offset.toString());
  if (filters?.clientId) params.append('patientId', filters.clientId);

  const { data } = await authenticatedApi<{ patients: CounselorClient[] } | CounselorClient[]>(
    `/patients/clinic/${clinicId}?${params.toString()}`
  );

  const clients = Array.isArray(data)
    ? data
    : (data as any)?.patients || (data as any)?.data || [];
  return { clients };
}

/**
 * Create counseling appointment — proxied through POST /appointments
 */
export async function createCounselorAppointment(
  appointmentData: CounselorAppointment
): Promise<{ appointment: CounselorAppointment }> {
  const { data } = await authenticatedApi<{ appointment: CounselorAppointment } | CounselorAppointment>(
    '/appointments',
    {
      method: 'POST',
      body: JSON.stringify({
        patientId: appointmentData.patientId,
        doctorId: appointmentData.counselorId || appointmentData.doctorId,
        date: appointmentData.date,
        time: appointmentData.time,
        type: appointmentData.type || 'COUNSELING',
        notes: appointmentData.notes,
        duration: appointmentData.duration,
      }),
    }
  );

  const appointment = (data as any)?.appointment || data;
  return { appointment };
}

/**
 * Update counseling appointment — proxied through PATCH /appointments/:id
 */
export async function updateCounselorAppointment(
  appointmentId: string,
  updates: Partial<CounselorAppointment>
): Promise<{ appointment: CounselorAppointment }> {
  const { data } = await authenticatedApi<{ appointment: CounselorAppointment } | CounselorAppointment>(
    `/appointments/${appointmentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );

  const appointment = (data as any)?.appointment || data;
  return { appointment };
}

/**
 * Delete (cancel) counseling appointment — PATCH /appointments/:id/status with CANCELLED
 */
export async function deleteCounselorAppointment(appointmentId: string): Promise<void> {
  await authenticatedApi(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
}

/**
 * Update counselor client session — stored as EHR medical history note
 */
export async function updateCounselorClientSession(
  _counselorId: string,
  clientId: string,
  sessionData: {
    sessionDate?: string;
    notes?: string;
    nextSessionDate?: string;
  }
): Promise<{ session: CounselorSession }> {
  const { data } = await authenticatedApi<CounselorSession>(
    '/ehr/medical-history',
    {
      method: 'POST',
      body: JSON.stringify({
        userId: clientId,
        type: 'TREATMENT',
        title: 'Counseling Session',
        description: sessionData.notes || '',
        date: sessionData.sessionDate || new Date().toISOString(),
        ...(sessionData.nextSessionDate ? { followUpDate: sessionData.nextSessionDate } : {}),
      }),
    }
  );

  return { session: data as CounselorSession };
}
