'use server';

import { authenticatedApi } from './auth.server';

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
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
  }

  const endpoint = `/clinics/${clinicId}/doctors${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId: string) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}`);
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
  qualifications?: string[];
  consultationFee?: number;
  clinicId?: string;
  schedule?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }[];
}) {
  const { data } = await authenticatedApi('/doctors', {
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
  qualifications?: string[];
  consultationFee?: number;
  isActive?: boolean;
  clinicId?: string;
}) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete doctor
 */
export async function deleteDoctor(doctorId: string) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get doctor schedule
 */
export async function getDoctorSchedule(clinicId: string, doctorId: string, date?: string) {
  const params = date ? `?date=${date}` : '';
  const { data } = await authenticatedApi(`/clinics/${clinicId}/doctors/${doctorId}/schedule${params}`);
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
  const { data } = await authenticatedApi(`/doctors/${doctorId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ schedule }),
  });
  return data;
}

/**
 * Get doctor availability
 */
export async function getDoctorAvailability(doctorId: string, date: string) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}/availability?date=${date}`);
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
  const { data } = await authenticatedApi(`/doctors/${doctorId}/availability`, {
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
  
  const endpoint = `/doctors/${doctorId}/appointments${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
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

  const endpoint = `/clinics/${clinicId}/doctors/${doctorId}/patients${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get doctor statistics
 */
export async function getDoctorStats(doctorId: string, period?: 'day' | 'week' | 'month' | 'year') {
  const params = period ? `?period=${period}` : '';
  const { data } = await authenticatedApi(`/doctors/${doctorId}/stats${params}`);
  return data;
}

/**
 * Get doctor reviews
 */
export async function getDoctorReviews(doctorId: string, limit: number = 10) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}/reviews?limit=${limit}`);
  return data;
}

/**
 * Add doctor review
 */
export async function addDoctorReview(doctorId: string, reviewData: {
  patientId: string;
  rating: number;
  comment?: string;
  appointmentId?: string;
}) {
  const { data } = await authenticatedApi(`/doctors/${doctorId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
  return data;
}

/**
 * Get doctor specializations
 */
export async function getDoctorSpecializations() {
  const { data } = await authenticatedApi('/doctors/specializations');
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
  
  const { data } = await authenticatedApi(`/doctors/search?${params.toString()}`);
  return data;
}

/**
 * Get doctor performance metrics
 */
export async function getDoctorPerformanceMetrics(doctorId: string, filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const endpoint = `/doctors/${doctorId}/performance${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
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
  const { data } = await authenticatedApi(`/doctors/${doctorId}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
  return data;
}

/**
 * Get doctor earnings
 */
export async function getDoctorEarnings(doctorId: string, filters?: {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year';
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const endpoint = `/doctors/${doctorId}/earnings${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Export doctor data
 */
export async function exportDoctorData(filters: {
  format: 'csv' | 'excel' | 'pdf';
  doctorIds?: string[];
  includeStats?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await authenticatedApi('/doctors/export', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}
