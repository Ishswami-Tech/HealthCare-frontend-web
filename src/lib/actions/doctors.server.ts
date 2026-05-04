'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

function unsupportedDoctorRoute(feature: string): never {
  throw new Error(`Unsupported doctor backend route: ${feature}`);
}

// ===== DOCTORS MANAGEMENT ACTIONS =====

/**
 * Get all doctors for a clinic
 */
export async function getDoctors(clinicId: string, filters?: {
  search?: string;
  specialization?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  locationId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  if (clinicId) {
    params.append('clinicId', clinicId);
  }

  const endpoint = `${API_ENDPOINTS.DOCTORS.GET_ALL}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {
    ...(clinicId ? { headers: { 'X-Clinic-ID': clinicId } } : {}),
  });
  return data;
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId), {});
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
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.CREATE, {
    method: 'POST',
    body: JSON.stringify(doctorData),
  });
  return data;
}

/**
 * Update doctor
 */
export async function updateDoctor(doctorId: string, updates: {
  specialization?: string;
  licenseNumber?: string;
  experience?: number;
  qualification?: string;
  consultationFee?: number;
  isActive?: boolean;
  clinicId?: string;
}) {
  void doctorId;
  void updates;
  return unsupportedDoctorRoute('PATCH /doctors/:id');
}

/**
 * Delete doctor
 */
export async function deleteDoctor(doctorId: string) {
  void doctorId;
  return unsupportedDoctorRoute('DELETE /doctors/:id');
}

/**
 * Get doctor schedule
 */
export async function getDoctorSchedule(clinicId: string, doctorId: string, date?: string) {
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
 * Update doctor availability
 */
export async function updateDoctorAvailability(doctorId: string, availabilityData: {
  date: string;
  timeSlots: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}) {
  void doctorId;
  void availabilityData;
  return unsupportedDoctorRoute('PUT /appointments/doctor/:doctorId/availability');
}

/**
 * Get doctor appointments
 */
export async function getDoctorAppointments(doctorId: string, filters?: {
  date?: string;
  status?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  // Backend: GET /appointments?doctorId=X (no /doctors/:id/appointments route)
  params.append('doctorId', doctorId);
  const endpoint = `/appointments${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint, {});
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
 * Get doctor statistics
 */
export async function getDoctorStats(_doctorId: string, _period?: 'day' | 'week' | 'month' | 'year') {
  void _doctorId;
  void _period;
  return unsupportedDoctorRoute('GET /doctors/:id/stats');
}

/**
 * Get doctor reviews
 */
export async function getDoctorReviews(_doctorId: string, _limit: number = 10) {
  void _doctorId;
  void _limit;
  return unsupportedDoctorRoute('GET /doctors/:id/reviews');
}

/**
 * Add doctor review
 */
export async function addDoctorReview(_doctorId: string, _reviewData: {
  patientId: string;
  rating: number;
  comment?: string;
  appointmentId?: string;
}) {
  void _doctorId;
  void _reviewData;
  return unsupportedDoctorRoute('POST /doctors/:id/reviews');
}

/**
 * Get doctor specializations
 */
export async function getDoctorSpecializations() {
  return unsupportedDoctorRoute('GET /doctors/specializations');
}

/**
 * Search doctors
 */
export async function searchDoctors(query: string, filters?: {
  specialization?: string;
  clinicId?: string;
  location?: string;
  availability?: string;
  limit?: number;
}) {
  void query;
  void filters;
  return unsupportedDoctorRoute('GET /doctors/search');
}

/**
 * Get doctor performance metrics
 */
export async function getDoctorPerformanceMetrics(_doctorId: string, _filters?: {
  startDate?: string;
  endDate?: string;
}) {
  void _doctorId;
  void _filters;
  return unsupportedDoctorRoute('GET /doctors/:id/performance');
}

/**
 * Update doctor profile
 */
export async function updateDoctorProfile(doctorId: string, profileData: {
  bio?: string;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  profilePicture?: string;
}) {
  void doctorId;
  void profileData;
  return unsupportedDoctorRoute('PATCH /doctors/:id/profile');
}

/**
 * Get doctor earnings
 */
export async function getDoctorEarnings(_doctorId: string, _filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  void _doctorId;
  void _filters;
  return unsupportedDoctorRoute('GET /doctors/:id/earnings');
}

/**
 * Export doctor data
 */
export async function exportDoctorData(_filters: {
  format: 'csv' | 'excel' | 'pdf';
  doctorIds?: string[];
  includeStats?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  void _filters;
  return unsupportedDoctorRoute('POST /doctors/export');
}
