'use server';

import { authenticatedApi } from './auth.server';

// ===== PATIENTS MANAGEMENT ACTIONS =====

/**
 * Get all patients for a clinic
 */
export async function getPatients(clinicId: string, filters?: {
  search?: string;
  gender?: string;
  ageRange?: string;
  bloodGroup?: string;
  doctorId?: string;
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

  const endpoint = `/clinics/${clinicId}/patients${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get patient by ID
 */
export async function getPatientById(clinicId: string, patientId: string) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/patients/${patientId}`);
  return data;
}

/**
 * Create patient
 */
export async function createPatient(patientData: {
  userId: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
}) {
  const { data } = await authenticatedApi('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  return data;
}

/**
 * Update patient
 */
export async function updatePatient(patientId: string, updates: {
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  isActive?: boolean;
}) {
  const { data } = await authenticatedApi(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data;
}

/**
 * Delete patient
 */
export async function deletePatient(patientId: string) {
  const { data } = await authenticatedApi(`/patients/${patientId}`, {
    method: 'DELETE',
  });
  return data;
}

/**
 * Get patient appointments
 */
export async function getPatientAppointments(patientId: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  doctorId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const endpoint = `/patients/${patientId}/appointments${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get patient medical history
 */
export async function getPatientMedicalHistory(clinicId: string, patientId: string, filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }

  const endpoint = `/clinics/${clinicId}/patients/${patientId}/medical-history${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Add patient medical history entry
 */
export async function addPatientMedicalHistory(clinicId: string, patientId: string, historyData: {
  type: 'DIAGNOSIS' | 'TREATMENT' | 'SURGERY' | 'ALLERGY' | 'MEDICATION' | 'FAMILY_HISTORY';
  title: string;
  description: string;
  date: string;
  doctorId?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}) {
  const { data } = await authenticatedApi(`/clinics/${clinicId}/patients/${patientId}/medical-history`, {
    method: 'POST',
    body: JSON.stringify(historyData),
  });
  return data;
}

/**
 * Get patient vital signs
 */
export async function getPatientVitalSigns(patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const endpoint = `/patients/${patientId}/vitals${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Add patient vital signs
 */
export async function addPatientVitalSigns(patientId: string, vitalsData: {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  recordedAt: string;
  recordedBy: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(`/patients/${patientId}/vitals`, {
    method: 'POST',
    body: JSON.stringify(vitalsData),
  });
  return data;
}

/**
 * Get patient lab results
 */
export async function getPatientLabResults(patientId: string, filters?: {
  testType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const endpoint = `/patients/${patientId}/lab-results${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Add patient lab result
 */
export async function addPatientLabResult(patientId: string, labData: {
  testType: string;
  testName: string;
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  testDate: string;
  reportedDate: string;
  labName?: string;
  doctorId?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(`/patients/${patientId}/lab-results`, {
    method: 'POST',
    body: JSON.stringify(labData),
  });
  return data;
}

/**
 * Get patient statistics
 */
export async function getPatientStats(patientId: string) {
  const { data } = await authenticatedApi(`/patients/${patientId}/stats`);
  return data;
}

/**
 * Search patients
 */
export async function searchPatients(query: string, filters?: {
  gender?: string;
  ageRange?: string;
  bloodGroup?: string;
  clinicId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({ q: query });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, String(value));
    });
  }
  
  const { data } = await authenticatedApi(`/patients/search?${params.toString()}`);
  return data;
}

/**
 * Get patient timeline
 */
export async function getPatientTimeline(patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.eventTypes) {
      filters.eventTypes.forEach(type => params.append('eventTypes', type));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (key !== 'eventTypes' && value) {
        params.append(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
  }
  
  const endpoint = `/patients/${patientId}/timeline${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Export patient data
 */
export async function exportPatientData(filters: {
  format: 'csv' | 'excel' | 'pdf';
  patientIds?: string[];
  includeHistory?: boolean;
  includeVitals?: boolean;
  includeLabs?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await authenticatedApi('/patients/export', {
    method: 'POST',
    body: JSON.stringify(filters),
  });
  return data;
}

/**
 * Get patient care plan
 */
export async function getPatientCarePlan(patientId: string) {
  const { data } = await authenticatedApi(`/patients/${patientId}/care-plan`);
  return data;
}

/**
 * Update patient care plan
 */
export async function updatePatientCarePlan(patientId: string, carePlanData: {
  goals?: string[];
  interventions?: string[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }[];
  followUpInstructions?: string;
  nextAppointment?: string;
  doctorId: string;
}) {
  const { data } = await authenticatedApi(`/patients/${patientId}/care-plan`, {
    method: 'PUT',
    body: JSON.stringify(carePlanData),
  });
  return data;
}
