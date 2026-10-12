'use server';

import { authenticatedApi } from './auth.server';
import { getServerSession } from './auth.server';
import { isApiError } from '@/lib/utils/error-handler';
import { formatISODateInIST } from '@/lib/utils';
import { API_ENDPOINTS } from '../config/config';

// EHR contract (backend `ehr.controller.ts`, verified by reading):
//   - Every read is GET /ehr/<section>/:userId and every create takes `userId` in the body. That id
//     is the patient's USER id (User.id) — never the Patient-record id. A PATIENT may only read their
//     own user id (PatientSelfAccessGuard).
//   - Updates are PUT /ehr/<section>/:id and deletes are DELETE /ehr/<section>/:id, where `:id` is the
//     id of the record itself.
//   - The server rejects any body field its DTO does not declare, so every write below sends an
//     explicit list of fields.

/**
 * The API client always sends `Content-Type: application/json`, and the backend (Fastify) answers
 * 400 "Body cannot be empty" to a JSON request without a body. The delete routes read no body.
 */
const EMPTY_JSON_BODY = JSON.stringify({});

/** Drops the keys whose value is undefined (JSON would drop them too; this keeps the intent visible). */
function definedOnly<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}

// ===== COMPREHENSIVE HEALTH RECORD =====

/**
 * Get comprehensive health record for a user.
 * Backend: GET /ehr/comprehensive/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 * Requires authentication - throws error if not authenticated
 */
export async function getComprehensiveHealthRecord(userId: string) {
  // Auth check - required for all EHR operations
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.EHR.COMPREHENSIVE(userId));
    return data;
  } catch (error: unknown) {
    // If it's the profile incomplete error, return null or an empty default state
    const normalizedCode =
      isApiError(error) && typeof error.code === 'string'
        ? error.code.replace(/[\s_-]+/g, '_').toUpperCase()
        : '';

    if (
      isApiError(error) &&
      error.statusCode === 403 &&
      (normalizedCode === 'PROFILE_INCOMPLETE' || normalizedCode === 'USER_PROFILE_INCOMPLETE')
    ) {
      return null;
    }
    // Re-throw other unexpected errors
    throw error;
  }
}

// ===== MEDICAL HISTORY =====

/**
 * Create medical history record.
 * Backend: POST /ehr/medical-history — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `condition`, `date`, `notes?`. The other fields of
 * `createDto` have no column on the server and are not sent.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = {
    userId: createDto.userId,
    condition: createDto.condition,
    notes: createDto.notes,
    date: createDto.startDate || formatISODateInIST(new Date()), // Map startDate to date
    clinicId: undefined // Let backend handle or extract from context if needed
  };

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.CREATE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Get medical history for a user.
 * Backend: GET /ehr/medical-history/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getMedicalHistory(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.GET_BY_USER(userId));
  return data;
}

/**
 * Update medical history record.
 * Backend: PUT /ehr/medical-history/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN,
 * SUPER_ADMIN. Accepted body: `condition?`, `notes?`, `date?` (`startDate` is sent as `date`).
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    condition: updates.condition,
    notes: updates.notes,
    date: updates.startDate,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete medical history record.
 * Backend: DELETE /ehr/medical-history/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteMedicalHistory(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== LAB REPORTS =====

/**
 * Create lab report.
 * Backend: POST /ehr/lab-reports — DOCTOR, ASSISTANT_DOCTOR, LAB_TECHNICIAN, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `testName`, `result` (text), `date`, `unit?`,
 * `normalRange?` (text), `status?`, `notes?`, `doctorId?`, `appointmentId?`, `fileUrl?`, `fileKey?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get lab reports for a user.
 * Backend: GET /ehr/lab-reports/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * LAB_TECHNICIAN, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getLabReports(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.GET_BY_USER(userId));
  return data;
}

/**
 * Update lab report.
 * Backend: PUT /ehr/lab-reports/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, LAB_TECHNICIAN,
 * CLINIC_ADMIN, SUPER_ADMIN. Accepted body: `testName?`, `result?`, `unit?`, `normalRange?`, `date?`,
 * `status?`, `notes?`.
 */
export async function updateLabReport(id: string, updates: {
  testName?: string;
  testDate?: string;
  results?: Record<string, any>;
  normalRange?: Record<string, any>;
  status?: string;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    testName: updates.testName,
    date: updates.testDate,
    result: updates.results ? JSON.stringify(updates.results) : undefined,
    normalRange: updates.normalRange ? JSON.stringify(updates.normalRange) : undefined,
    status: updates.status,
    notes: updates.notes,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete lab report.
 * Backend: DELETE /ehr/lab-reports/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, LAB_TECHNICIAN,
 * CLINIC_ADMIN, SUPER_ADMIN.
 */
export async function deleteLabReport(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== RADIOLOGY REPORTS =====

/**
 * Create radiology report.
 * Backend: POST /ehr/radiology-reports — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `imageType`, `findings`, `conclusion`, `date`,
 * `recommendations?`, `images?`, `doctorId?`, `appointmentId?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get radiology reports for a user.
 * Backend: GET /ehr/radiology-reports/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only). NURSE is not allowed.
 */
export async function getRadiologyReports(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.GET_BY_USER(userId));
  return data;
}

/**
 * Update radiology report.
 * Backend: PUT /ehr/radiology-reports/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN. Accepted body: `imageType?`, `findings?`, `conclusion?`, `date?`, `recommendations?`,
 * `images?`.
 */
export async function updateRadiologyReport(id: string, updates: {
  studyType?: string;
  studyDate?: string;
  findings?: string;
  impression?: string;
  recommendations?: string;
  images?: string[];
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    imageType: updates.studyType,
    date: updates.studyDate,
    findings: updates.findings,
    conclusion: updates.impression,
    recommendations: updates.recommendations,
    images: updates.images,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete radiology report.
 * Backend: DELETE /ehr/radiology-reports/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteRadiologyReport(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.RADIOLOGY_REPORTS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== SURGICAL RECORDS =====

/**
 * Create surgical record.
 * Backend: POST /ehr/surgical-records — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `surgeryName`, `surgeon`, `date`, `notes?`,
 * `anesthesia?`, `complications?`, `outcome?`, `doctorId?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get surgical records for a user.
 * Backend: GET /ehr/surgical-records/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getSurgicalRecords(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.GET_BY_USER(userId));
  return data;
}

/**
 * Update surgical record.
 * Backend: PUT /ehr/surgical-records/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN. Accepted body: `surgeryName?`, `surgeon?`, `notes?`, `date?`, `anesthesia?`,
 * `complications?`, `outcome?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    surgeryName: updates.procedureName,
    date: updates.procedureDate,
    surgeon: updates.surgeon,
    anesthesia: updates.anesthesia,
    complications: updates.complications,
    outcome: updates.outcome,
    notes: updates.notes,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete surgical record.
 * Backend: DELETE /ehr/surgical-records/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteSurgicalRecord(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.SURGICAL_RECORDS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== VITALS =====

/**
 * Create a vital reading (one row per reading).
 * Backend: POST /ehr/vitals — DOCTOR, ASSISTANT_DOCTOR, NURSE, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `type`, `value` (text), `recordedAt`, `unit?`,
 * `recordedBy?`, `notes?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get vitals for a user.
 * Backend: GET /ehr/vitals/:userId?type= (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getVitals(userId: string, type?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.GET_BY_USER(userId, type));
  return data;
}

/**
 * Update vital record.
 * Backend: PUT /ehr/vitals/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, NURSE, RECEPTIONIST,
 * CLINIC_ADMIN, SUPER_ADMIN. Accepted body: `type?`, `value?` (text), `recordedAt?`, `unit?`, `notes?`
 * (`recordedBy` cannot be changed and is not sent).
 */
export async function updateVital(id: string, updates: {
  type?: string;
  value?: number;
  unit?: string;
  recordedAt?: string;
  recordedBy?: string;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    type: updates.type,
    value: updates.value !== undefined ? String(updates.value) : undefined,
    unit: updates.unit,
    recordedAt: updates.recordedAt,
    notes: updates.notes,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete vital record.
 * Backend: DELETE /ehr/vitals/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 */
export async function deleteVital(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== ALLERGIES =====

/**
 * Create allergy.
 * Backend: POST /ehr/allergies — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `allergen`, `severity`, `reaction`, `diagnosedDate`,
 * `notes?`, `status?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = {
    userId: createDto.userId,
    allergen: createDto.allergen,
    severity: createDto.severity || 'mild',
    reaction: createDto.reaction || 'None',
    diagnosedDate: createDto.onsetDate || formatISODateInIST(new Date()), // MAP
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
 * Get allergies for a user.
 * Backend: GET /ehr/allergies/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR, NURSE,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getAllergies(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.GET_BY_USER(userId));
  return data;
}

/**
 * Update allergy record.
 * Backend: PUT /ehr/allergies/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN,
 * SUPER_ADMIN. Accepted body: `allergen?`, `severity?`, `reaction?`, `diagnosedDate?`, `notes?`,
 * `status?` (`onsetDate` is sent as `diagnosedDate`).
 */
export async function updateAllergy(id: string, updates: {
  allergen?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: string;
  status?: 'active' | 'resolved';
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    allergen: updates.allergen,
    severity: updates.severity,
    reaction: updates.reaction,
    diagnosedDate: updates.onsetDate,
    status: updates.status,
    notes: updates.notes,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete allergy record.
 * Backend: DELETE /ehr/allergies/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 */
export async function deleteAllergy(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ALLERGIES.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== MEDICATIONS =====

/**
 * Create medication.
 * Backend: POST /ehr/medications — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `name`, `dosage`, `frequency`, `startDate`,
 * `prescribedBy`, `endDate?`, `purpose?`, `sideEffects?`, `instructions?`, `status?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get medications for a user.
 * Backend: GET /ehr/medications/:userId?activeOnly= (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR,
 * NURSE, THERAPIST, COUNSELOR, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getMedications(userId: string, activeOnly?: boolean) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.GET_BY_USER(userId, activeOnly));
  return data;
}

/**
 * Update medication record.
 * Backend: PUT /ehr/medications/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `name?`, `dosage?`, `frequency?`, `startDate?`, `endDate?`, `prescribedBy?`,
 * `purpose?`, `sideEffects?`, `instructions?`, `status?` (`medicationName` is sent as `name`; `notes`
 * is sent as `instructions` when no instructions are given).
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    name: updates.medicationName,
    dosage: updates.dosage,
    frequency: updates.frequency,
    startDate: updates.startDate,
    endDate: updates.endDate,
    prescribedBy: updates.prescribedBy,
    instructions: updates.instructions ?? updates.notes,
    status: updates.status,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete medication record.
 * Backend: DELETE /ehr/medications/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteMedication(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICATIONS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== IMMUNIZATIONS =====

/**
 * Create immunization.
 * Backend: POST /ehr/immunizations — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN.
 * Accepted body: `userId` (patient's USER id), `vaccineName`, `dateAdministered`, `nextDueDate?`,
 * `batchNumber?`, `administrator?`, `location?`, `notes?`, `manufacturer?`.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

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
 * Get immunizations for a user.
 * Backend: GET /ehr/immunizations/:userId (patient's USER id) — DOCTOR, ASSISTANT_DOCTOR,
 * CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getImmunizations(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.GET_BY_USER(userId));
  return data;
}

/**
 * Update immunization record.
 * Backend: PUT /ehr/immunizations/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN. Accepted body: `vaccineName?`, `dateAdministered?`, `nextDueDate?`, `batchNumber?`,
 * `administrator?`, `location?`, `notes?` (the manufacturer cannot be changed and is not sent).
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const payload = definedOnly({
    vaccineName: updateDto.vaccineName,
    dateAdministered: updateDto.vaccineDate,
    nextDueDate: updateDto.nextDueDate,
    batchNumber: updateDto.lotNumber,
    administrator: updateDto.administeredBy,
    notes: updateDto.notes,
  });

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.UPDATE(id), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Delete immunization record.
 * Backend: DELETE /ehr/immunizations/:id (record id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteImmunization(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.IMMUNIZATIONS.DELETE(id), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

// ===== ANALYTICS =====

/**
 * Get health trends for a user.
 * Backend: GET /ehr/analytics/health-trends/:userId?vitalType=&startDate=&endDate= (patient's USER
 * id) — DOCTOR, ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getHealthTrends(
  userId: string,
  vitalType: string,
  startDate?: string,
  endDate?: string
) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(
    API_ENDPOINTS.EHR.ANALYTICS.HEALTH_TRENDS(userId, vitalType, startDate, endDate)
  );
  return data;
}

/**
 * Get medication adherence for a user.
 * Backend: GET /ehr/analytics/medication-adherence/:userId (patient's USER id) — DOCTOR,
 * ASSISTANT_DOCTOR, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 */
export async function getMedicationAdherence(userId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.ANALYTICS.MEDICATION_ADHERENCE(userId));
  return data;
}
