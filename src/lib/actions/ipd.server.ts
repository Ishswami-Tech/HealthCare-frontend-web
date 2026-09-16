'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { revalidatePath } from 'next/cache';

// ===== ADMISSIONS =====

export async function getAdmissions(filters?: { wardId?: string; bedId?: string; patientId?: string; status?: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const params = new URLSearchParams();
    if (filters?.wardId) params.set('wardId', filters.wardId);
    if (filters?.bedId) params.set('bedId', filters.bedId);
    if (filters?.patientId) params.set('patientId', filters.patientId);
    if (filters?.status) params.set('status', filters.status);
    const qs = params.toString();
    const { data } = await authenticatedApi(`${API_ENDPOINTS.IPD.ADMISSIONS.LIST}${qs ? `?${qs}` : ''}`);
    return data;
  } catch {
    return [];
  }
}

export async function getAdmission(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.GET_BY_ID(id));
    return data;
  } catch {
    return null;
  }
}

export async function getActiveAdmissions() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.ACTIVE);
    return data;
  } catch {
    return [];
  }
}

export async function createAdmission(payload: {
  patientId: string;
  bedId: string;
  wardId: string;
  admittingDoctorId: string;
  diagnosis?: string;
  notes?: string;
  expectedDurationDays?: number;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create admission' };
  }
}

export async function transferBed(admissionId: string, newBedId: string, reason?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.TRANSFER_BED(admissionId), {
      method: 'POST',
      body: JSON.stringify({ newBedId, reason }),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to transfer bed' };
  }
}

export async function dischargePatient(admissionId: string, payload?: { dischargeSummary?: string; followUpDate?: string }) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.DISCHARGE(admissionId), {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to discharge patient' };
  }
}

export async function getDischargeSummary(admissionId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.ADMISSIONS.DISCHARGE_SUMMARY(admissionId));
    return data;
  } catch {
    return null;
  }
}

// ===== BEDS =====

export async function getBeds(wardId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const url = wardId ? `${API_ENDPOINTS.IPD.BEDS.LIST}?wardId=${encodeURIComponent(wardId)}` : API_ENDPOINTS.IPD.BEDS.LIST;
    const { data } = await authenticatedApi(url);
    return data;
  } catch {
    return [];
  }
}

export async function getBed(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.BEDS.GET_BY_ID(id));
    return data;
  } catch {
    return null;
  }
}

export async function updateBedStatus(id: string, status: string, notes?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.BEDS.UPDATE_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function createBed(payload: {
  wardId: string;
  bedNumber: string;
  bedType: string;
  floor?: number;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.BEDS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function updateBed(id: string, payload: Record<string, unknown>) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.BEDS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function getOccupancyStats() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.BEDS.OCCUPANCY_STATS);
    return data;
  } catch {
    return null;
  }
}

// ===== WARDS =====

export async function getWards() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.WARDS.LIST);
    return data;
  } catch {
    return [];
  }
}

export async function getWard(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.WARDS.UPDATE(id).replace('/update', ''));
    return data;
  } catch {
    return null;
  }
}

export async function createWard(payload: {
  name: string;
  wardType: string;
  floor: number;
  capacity: number;
  description?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.WARDS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function updateWard(id: string, payload: Record<string, unknown>) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.WARDS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ipd');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

export async function getWardStatistics() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.IPD.WARDS.STATISTICS);
    return data;
  } catch {
    return null;
  }
}

// ===== IPD DASHBOARD =====

export async function getIpdDashboard() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const [activeAdmissions, occupancyStats] = await Promise.all([
      getActiveAdmissions(),
      getOccupancyStats(),
    ]);
    return { activeAdmissions, occupancyStats };
  } catch {
    return { activeAdmissions: [], occupancyStats: null };
  }
}
