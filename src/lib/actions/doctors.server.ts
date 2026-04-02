'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

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
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.UPDATE(doctorId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete doctor
 */
export async function deleteDoctor(doctorId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.DELETE(doctorId), {
    method: 'DELETE',
  });
  return data;
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
}[]) {
  // Backend: PUT /appointments/doctor/:doctorId/availability
  const { data } = await authenticatedApi(`/appointments/doctor/${doctorId}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
  });
  return data;
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
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.AVAILABILITY.UPDATE(doctorId), {
    method: 'PUT',
    body: JSON.stringify(availabilityData),
  });
  return data;
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
 * Get doctor patients
 */
export async function getDoctorPatients(clinicId: string, doctorId: string, filters?: {
  search?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  // Backend: GET /patients/clinic/:clinicId?doctorId=X
  params.append('doctorId', doctorId);
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
  // Backend has no /doctors/:id/stats endpoint
  return null;
}

/**
 * Get doctor reviews
 */
export async function getDoctorReviews(_doctorId: string, _limit: number = 10) {
  // Backend has no /doctors/:id/reviews endpoint
  return null;
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
  // Backend has no /doctors/:id/reviews endpoint
  return null;
}

/**
 * Get doctor specializations
 */
export async function getDoctorSpecializations() {
  const { data } = await authenticatedApi(API_ENDPOINTS.DOCTORS.SPECIALIZATIONS, {});
  return data;
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
  const params = new URLSearchParams({ q: query });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const { data } = await authenticatedApi(`${API_ENDPOINTS.DOCTORS.SEARCH}?${params.toString()}`, {});
  return data;
}

/**
 * Get doctor performance metrics
 */
export async function getDoctorPerformanceMetrics(_doctorId: string, _filters?: {
  startDate?: string;
  endDate?: string;
}) {
  // Backend has no /doctors/:id/performance endpoint
  return null;
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
  // Backend: PATCH /doctors/:id (profile fields included in main update)
  const { data } = await authenticatedApi(`/doctors/${doctorId}`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  return data;
}

/**
 * Get doctor earnings
 */
export async function getDoctorEarnings(_doctorId: string, _filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  // Backend has no /doctors/:id/earnings endpoint
  return null;
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
  // Backend has no doctors export endpoint
  return null;
}
