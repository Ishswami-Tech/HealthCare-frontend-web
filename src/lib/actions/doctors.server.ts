'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { revalidateCache } from '@/lib/utils/revalidate-cache';
import { API_ENDPOINTS } from '../config/config';
import { logger } from '@/lib/utils/logger';

function normalizeCollectionResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  const data = payload as {
    value?: T[];
    data?: T[] | { doctors?: T[] };
    doctors?: T[];
    items?: T[];
    results?: T[];
  } | null | undefined;

  if (Array.isArray(data?.value)) {
    return data.value;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.doctors)) {
    return data.doctors;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    const nested = data.data as { doctors?: T[] };
    if (Array.isArray(nested.doctors)) {
      return nested.doctors;
    }
  }

  return [];
}

// ===== DOCTORS MANAGEMENT ACTIONS =====

/**
 * Get all doctors for a clinic
 * ClinicId is resolved server-side from the session cookie to avoid stale client state.
 */
export async function getDoctors(clinicId: string, filters?: {
  search?: string;
  specialization?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  locationId?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Resolve authoritative clinicId server-side — the session cookie is always current.
  const serverClinicId = session.user.clinicId;
  const resolvedClinicId = serverClinicId || clinicId;

  logger.debug('[getDoctors] Called', {
    inputClinicId: clinicId,
    serverClinicId,
    resolvedClinicId,
    userId: session.user.id,
  });

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  if (resolvedClinicId) {
    params.append('clinicId', resolvedClinicId);
  }

  const endpoint = `${API_ENDPOINTS.DOCTORS.GET_ALL}${params.toString() ? `?${params.toString()}` : ''}`;

  logger.debug('[getDoctors] Requesting doctors', { resolvedClinicId, endpoint });

  const { data } = await authenticatedApi<unknown>(endpoint, {
    ...(resolvedClinicId ? { headers: { 'X-Clinic-ID': resolvedClinicId } } : {}),
    cache: 'no-store',
  });
  const responseObject =
    data && typeof data === 'object' && !Array.isArray(data)
      ? (data as { data?: unknown })
      : null;
  const nestedData = responseObject?.data;

  logger.debug('[getDoctors] Response received', {
    hasData: !!data,
    doctorsCount: Array.isArray(data)
      ? data.length
      : nestedData
        ? (Array.isArray(nestedData) ? nestedData.length : 'not array')
        : 'no data',
  });

  return normalizeCollectionResponse(data);
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId: string, clinicId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId), {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
  return data;
}

/**
 * Create doctor
 */
export async function createDoctor(doctorData: {
  userId: string;
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  qualification?: string;
  consultationFee?: number;
  clinicId?: string;
  workingHours?: unknown;
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.CREATE, {
    method: 'POST',
    body: JSON.stringify(doctorData),
  });
  if (doctorData.clinicId) {
    void revalidateCache('doctors');
    void revalidateCache('clinic-doctors');
    void revalidateCache('clinic-locations');
  }
  return data;
}

/**
 * Get doctor schedule
 */
export async function getDoctorSchedule(clinicId: string, doctorId: string, date?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!clinicId || !doctorId) {
    return null;
  }
  // Backend: GET /appointments/doctor/:doctorId/availability?date=X
  const params = date ? `?date=${date}` : '';
  const { data } = await authenticatedApi(`/appointments/doctor/${doctorId}/availability${params}`, {
    headers: { 'X-Clinic-ID': clinicId },
  });
  return data;
}

/**
 * Update doctor schedule
 */
export async function updateDoctorSchedule(doctorId: string, schedule: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}[], clinicId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const workingHours = schedule.reduce<Record<string, { start: string; end: string } | null>>(
    (acc, item) => {
      const day = dayNames[item.dayOfWeek] || null;
      if (!day) {
        return acc;
      }
      acc[day] = item.isAvailable && item.startTime && item.endTime
        ? { start: item.startTime, end: item.endTime }
        : null;
      return acc;
    },
    {}
  );

  return createDoctor({
    userId: doctorId,
    ...(clinicId ? { clinicId } : {}),
    workingHours,
  });
}



/**
 * Get doctor appointments
 */
export async function getDoctorAppointments(doctorId: string, filters?: {
  date?: string;
  status?: string;
  limit?: number;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  // Backend: GET /appointments?doctorId=X (no /doctors/:id/appointments route)
  params.append('doctorId', doctorId);
  const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    cache: 'no-store',
  });
  return data;
}

/**
 * Get doctor patients for the active authenticated doctor in a clinic
 */
export async function getDoctorPatients(clinicId: string, filters?: {
  search?: string;
  gender?: string;
  ageRange?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'limit' && key !== 'offset') params.append(key, String(value));
    });
  }

  if (typeof filters?.limit === 'number') {
    params.append('limit', filters.limit.toString());
  }
  if (typeof filters?.limit === 'number' && typeof filters?.offset === 'number') {
    const page = Math.floor(filters.offset / filters.limit) + 1;
    params.append('page', String(Math.max(page, 1)));
  }

  // Backend: GET /patients/clinic/:clinicId
  // Doctor scoping is derived from the authenticated request user.
  const endpoint = `/patients/clinic/${clinicId}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    headers: { 'X-Clinic-ID': clinicId },
  });
  return data;
}

/**
 * Get a doctor's reviews (GET /doctors/:id/reviews, the id is the doctor's User id).
 * Answers { items: [{ id, rating, comment, createdAt, reviewerName }], averageRating, reviewCount, meta }.
 */
export async function getDoctorReviews(doctorUserId: string, filters?: { page?: number; limit?: number }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (typeof filters?.page === 'number') params.append('page', String(filters.page));
  if (typeof filters?.limit === 'number') params.append('limit', String(filters.limit));
  const query = params.toString();
  const { data } = await authenticatedApi(`${API_ENDPOINTS.DOCTORS.REVIEWS.GET(doctorUserId)}${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });
  return data;
}

/**
 * Rate a doctor after a completed visit (POST /doctors/:id/reviews, patients only).
 * The backend allows one review per appointment and answers 409 when it was already rated.
 */
export async function addDoctorReview(doctorUserId: string, reviewData: {
  appointmentId: string;
  rating: number;
  comment?: string;
}) {
  const session = await getServerSession();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  try {
    const comment = reviewData.comment?.trim();
    const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.REVIEWS.CREATE(doctorUserId), {
      method: 'POST',
      body: JSON.stringify({
        appointmentId: reviewData.appointmentId,
        rating: reviewData.rating,
        ...(comment ? { comment } : {}),
      }),
    });
    void revalidateCache('doctors');
    return { success: true as const, review: data };
  } catch (error) {
    logger.error('Failed to add doctor review', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false as const,
      error: error instanceof Error && error.message ? error.message : 'Failed to submit your rating',
    };
  }
}

/**
 * Update doctor profile
 */
export async function updateDoctorProfile(doctorUserId: string, profileData: {
  specialization?: string;
  experience?: number;
  consultationFee?: number;
  videoConsultationFee?: number;
  slotDurationMinutes?: number;
  videoConsultationEnabled?: boolean;
  inPersonConsultationEnabled?: boolean;
  qualification?: string;
  licenseNumber?: string;
  education?: string;
  certifications?: string[];
  languages?: string[];
}) {
  const session = await getServerSession();
  if (!session?.user) return { success: false as const, error: 'Unauthorized' };
  try {
    // The doctor's own record: PATCH /doctors/:userId (the id is the doctor's User id).
    await authenticatedApi(API_ENDPOINTS.DOCTORS.UPDATE(doctorUserId), {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    revalidateCache('doctors');
    return { success: true as const };
  } catch (error) {
    logger.error('Failed to update doctor profile', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false as const,
      error: error instanceof Error && error.message ? error.message : 'Failed to update doctor profile',
    };
  }
}

