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

/**
 * Get medical history for a user
 */
export async function getMedicalHistory(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.GET_BY_USER(userId));
  return data;
}

/**
 * Update medical history record
 */
export async function updateMedicalHistory(id: string, updates: {
  condition?: string;
  diagnosis?: string;
  treatment?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
}) {
  // Map frontend DTO to backend structure if needed
  const payload = {
    ...updates,
    date: updates.startDate, 
    // clinicId, userId - typically not modifiable or taken from context
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete medical history record
 */
export async function deleteMedicalHistory(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get lab reports for a user
 */
export async function getLabReports(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.GET_BY_USER(userId));
  return data;
}

/**
 * Update lab report
 */
export async function updateLabReport(id: string, updates: {
  testName?: string;
  testDate?: string;
  results?: Record<string, any>;
  normalRange?: Record<string, any>;
  status?: string;
  notes?: string;
}) {
  const payload: any = { ...updates };
  if (updates.testDate) payload.date = updates.testDate;
  if (updates.results) payload.result = JSON.stringify(updates.results);
  if (updates.normalRange) payload.normalRange = JSON.stringify(updates.normalRange);

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete lab report
 */
export async function deleteLabReport(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get radiology reports for a user
 */
export async function getRadiologyReports(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.GET_BY_USER(userId));
  return data;
}

/**
 * Update radiology report
 */
export async function updateRadiologyReport(id: string, updates: {
  studyType?: string;
  studyDate?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  images?: string[];
}) {
  const payload: any = { ...updates };
  if (updates.studyType) payload.imageType = updates.studyType;
  if (updates.studyDate) payload.date = updates.studyDate;
  if (updates.impression) payload.conclusion = updates.impression;

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete radiology report
 */
export async function deleteRadiologyReport(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get surgical records for a user
 */
export async function getSurgicalRecords(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.GET_BY_USER(userId));
  return data;
}

/**
 * Update surgical record
 */
export async function updateSurgicalRecord(id: string, updates: {
  procedureName?: string;
  procedureDate?: string;
  surgeon?: string;
  anesthesia?: string;
  complications?: string;
  outcome?: string;
  notes?: string;
}) {
  const payload: any = { ...updates };
  if (updates.procedureName) payload.surgeryName = updates.procedureName;
  if (updates.procedureDate) payload.date = updates.procedureDate;

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete surgical record
 */
export async function deleteSurgicalRecord(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get vitals for a user
 */
export async function getVitals(userId: string, type?: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.GET_BY_USER(userId, type));
  return data;
}

/**
 * Update vital record
 */
export async function updateVital(id: string, updates: {
  type?: string;
  value?: number;
  unit?: string;
  recordedAt?: string;
  recordedBy?: string;
  notes?: string;
}) {
  const payload: any = { ...updates };
  if (updates.value !== undefined) payload.value = String(updates.value);

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete vital record
 */
export async function deleteVital(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get allergies for a user
 */
export async function getAllergies(userId: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.GET_BY_USER(userId));
  return data;
}

/**
 * Update allergy record
 */
export async function updateAllergy(id: string, updates: {
  allergen?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: string;
  status?: 'active' | 'resolved';
  notes?: string;
}) {
  const payload: any = { ...updates };
  if (updates.onsetDate) payload.diagnosedDate = updates.onsetDate;

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete allergy record
 */
export async function deleteAllergy(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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

/**
 * Get medications for a user
 */
export async function getMedications(userId: string, activeOnly?: boolean) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.GET_BY_USER(userId, activeOnly));
  return data;
}

/**
 * Update medication record
 */
export async function updateMedication(id: string, updates: {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  prescribedBy?: string;
  instructions?: string;
  status?: 'active' | 'completed' | 'discontinued';
  notes?: string;
}) {
  const payload: any = { ...updates };
  if (updates.medicationName) payload.name = updates.medicationName;
  if (updates.notes) payload.instructions = updates.notes; // Map notes to instructions if provided

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete medication record
 */
export async function deleteMedication(id: string) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.DELETE(id), {
    method: 'DELETE',
  });
  return data;
}

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
