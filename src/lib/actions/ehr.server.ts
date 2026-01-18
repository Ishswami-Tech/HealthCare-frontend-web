'use server';

import { authenticatedApi } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== COMPREHENSIVE HEALTH RECORD =====

/**
 * Get comprehensive health record for a user
 */
export async function getComprehensiveHealthRecord(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.COMPREHENSIVE(userId));
  return data;
}

// ===== MEDICAL HISTORY =====

/**
 * Create medical history record
 */
// ... imports

// ===== MEDICAL HISTORY =====

export async function createMedicalHistory(createDto: {
  userId: string;
  condition: string;
  diagnosis?: string;
  treatment?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
}) {
  const payload = {
    userId: createDto.userId,
    condition: createDto.condition,
    notes: createDto.notes,
    date: createDto.startDate || new Date().toISOString().split('T')[0], // Map startDate to date
    clinicId: undefined // Let backend handle or extract from context if needed
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Medical History methods ...

// ===== LAB REPORTS =====

export async function createLabReport(createDto: {
  userId: string;
  testName: string;
  testDate: string;
  results: Record<string, any>;
  normalRange?: Record<string, any>;
  status?: string;
  notes?: string;
  doctorId?: string;
  appointmentId?: string;
}) {
  const payload = {
    userId: createDto.userId,
    testName: createDto.testName,
    date: createDto.testDate, // MAP to date
    result: JSON.stringify(createDto.results), // MAP to string
    normalRange: createDto.normalRange ? JSON.stringify(createDto.normalRange) : undefined, // MAP to string
    status: createDto.status,
    notes: createDto.notes,
    doctorId: createDto.doctorId,
    appointmentId: createDto.appointmentId
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Lab Reports ...

// ===== RADIOLOGY REPORTS =====

export async function createRadiologyReport(createDto: {
  userId: string;
  studyType: string;
  studyDate: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  images?: string[];
  doctorId?: string;
  appointmentId?: string;
}) {
  const payload = {
    userId: createDto.userId,
    imageType: createDto.studyType, // MAP
    date: createDto.studyDate, // MAP
    findings: createDto.findings || '',
    conclusion: createDto.impression || '', // MAP
    recommendations: createDto.recommendations,
    images: createDto.images,
    doctorId: createDto.doctorId,
    appointmentId: createDto.appointmentId
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Radiology ...

// ===== SURGICAL RECORDS =====

export async function createSurgicalRecord(createDto: {
  userId: string;
  procedureName: string;
  procedureDate: string;
  surgeon?: string;
  anesthesia?: string;
  complications?: string;
  outcome?: string;
  notes?: string;
  doctorId?: string;
}) {
  const payload = {
    userId: createDto.userId,
    surgeryName: createDto.procedureName, // MAP
    date: createDto.procedureDate, // MAP
    surgeon: createDto.surgeon || 'Unknown',
    anesthesia: createDto.anesthesia,
    complications: createDto.complications,
    outcome: createDto.outcome,
    notes: createDto.notes,
    doctorId: createDto.doctorId
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Surgical ...

// ===== VITALS =====

export async function createVital(createDto: {
  userId: string;
  type: string;
  value: number;
  unit?: string;
  recordedAt: string;
  recordedBy?: string;
  notes?: string;
}) {
  const payload = {
    userId: createDto.userId,
    type: createDto.type,
    value: String(createDto.value), // MAP to string
    recordedAt: createDto.recordedAt,
    unit: createDto.unit,
    recordedBy: createDto.recordedBy,
    notes: createDto.notes
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Vitals ...

// ===== ALLERGIES =====

export async function createAllergy(createDto: {
  userId: string;
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: string;
  status?: 'active' | 'resolved';
  notes?: string;
}) {
  const payload = {
    userId: createDto.userId,
    allergen: createDto.allergen,
    severity: createDto.severity || 'mild',
    reaction: createDto.reaction || 'None',
    diagnosedDate: createDto.onsetDate || new Date().toISOString().split('T')[0], // MAP
    status: createDto.status,
    notes: createDto.notes
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Allergies ...

// ===== MEDICATIONS =====

export async function createMedication(createDto: {
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy?: string;
  instructions?: string;
  status?: 'active' | 'completed' | 'discontinued';
  notes?: string;
}) {
  const payload = {
    userId: createDto.userId,
    name: createDto.medicationName, // MAP
    dosage: createDto.dosage,
    frequency: createDto.frequency,
    startDate: createDto.startDate,
    endDate: createDto.endDate,
    prescribedBy: createDto.prescribedBy || 'Unknown', // Required in DTO
    instructions: createDto.instructions || createDto.notes, // Map notes to instructions if avail
    status: createDto.status
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ... get/update/delete Medications ...

// ===== IMMUNIZATIONS =====

export async function createImmunization(createDto: {
  userId: string;
  vaccineName: string;
  vaccineDate: string;
  administeredBy?: string;
  lotNumber?: string;
  manufacturer?: string;
  nextDueDate?: string;
  notes?: string;
}) {
  const payload = {
    userId: createDto.userId,
    vaccineName: createDto.vaccineName,
    dateAdministered: createDto.vaccineDate, // MAP
    nextDueDate: createDto.nextDueDate,
    batchNumber: createDto.lotNumber, // MAP
    administrator: createDto.administeredBy, // MAP
    manufacturer: createDto.manufacturer,
    notes: createDto.notes
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Get immunizations for a user
 */
export async function getImmunizations(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.GET_BY_USER(userId));
  return data;
}

/**
 * Update immunization record
 */
export async function updateImmunization(id: string, updateDto: {
  vaccineName?: string;
  vaccineDate?: string;
  administeredBy?: string;
  lotNumber?: string;
  manufacturer?: string;
  nextDueDate?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
  });
  return data;
}

/**
 * Delete immunization record
 */
export async function deleteImmunization(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

// ===== ANALYTICS =====

/**
 * Get health trends for a user
 */
export async function getHealthTrends(
  userId: string,
  vitalType: string,
  startDate?: string,
  endDate?: string
) {
  const { data } = await authenticatedApi(
    API_ENDPOINTS.EHR.ANALYTICS.HEALTH_TRENDS(userId, vitalType, startDate, endDate)
  );
  return data;
}

/**
 * Get medication adherence for a user
 */
export async function getMedicationAdherence(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ANALYTICS.MEDICATION_ADHERENCE(userId));
  return data;
}
