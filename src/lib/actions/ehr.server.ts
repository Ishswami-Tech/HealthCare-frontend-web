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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateMedicalHistory(id: string, updateDto: {
  condition?: string;
  diagnosis?: string;
  treatment?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create lab report
 */
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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateLabReport(id: string, updateDto: {
  testName?: string;
  testDate?: string;
  results?: Record<string, any>;
  normalRange?: Record<string, any>;
  status?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create radiology report
 */
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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateRadiologyReport(id: string, updateDto: {
  studyType?: string;
  studyDate?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  images?: string[];
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create surgical record
 */
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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateSurgicalRecord(id: string, updateDto: {
  procedureName?: string;
  procedureDate?: string;
  surgeon?: string;
  anesthesia?: string;
  complications?: string;
  outcome?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create vital record
 */
export async function createVital(createDto: {
  userId: string;
  type: string;
  value: number;
  unit?: string;
  recordedAt: string;
  recordedBy?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateVital(id: string, updateDto: {
  type?: string;
  value?: number;
  unit?: string;
  recordedAt?: string;
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create allergy record
 */
export async function createAllergy(createDto: {
  userId: string;
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: string;
  status?: 'active' | 'resolved';
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateAllergy(id: string, updateDto: {
  allergen?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: string;
  status?: 'active' | 'resolved';
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create medication record
 */
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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
export async function updateMedication(id: string, updateDto: {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  status?: 'active' | 'completed' | 'discontinued';
  notes?: string;
}) {
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(updateDto),
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

/**
 * Create immunization record
 */
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
  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.CREATE, {
    method: 'POST',
    body: JSON.stringify(createDto),
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
