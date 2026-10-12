'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';

// ===== PATIENTS MANAGEMENT ACTIONS =====
//
// Ids used by the backend (verified against patients / ehr / appointments controllers):
//   - Patient USER id (User.id): GET/PUT/DELETE /patients/:id and every /ehr/<section>/:userId route.
//   - Patient-record id (Patient.id): Appointment.patientId, patient visits, prescriptions.
// A patient list row carries both: `id` (Patient.id) and `userId` / `user.id` (User.id).

/**
 * Get all patients for a clinic.
 * Backend: GET /patients/clinic/:clinicId — DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST, CLINIC_ADMIN,
 * SUPER_ADMIN. Query: `search`, `page`, `limit` (other filters are not applied by the server).
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'doctorId' || key === 'offset' || key === 'limit') {
          return;
        }
        params.append(key, value.toString());
      }
    });
  }

  const limitValue = typeof filters?.limit === 'number' ? filters.limit : undefined;
  const pageValue =
    typeof filters?.offset === 'number'
      ? Math.floor(filters.offset / (limitValue || 50)) + 1
      : 1;
  if (typeof limitValue === 'number') {
    params.append('limit', limitValue.toString());
    params.append('page', String(Math.max(pageValue, 1)));
  }

  // Backend: GET /patients/clinic/:clinicId
  // Doctor scoping is resolved from the authenticated request user in the backend controller.
  const endpoint = `/patients/clinic/${clinicId}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Get one patient.
 * Backend: GET /patients/:id — `:id` is the patient's USER id (User.id), not the Patient-record id.
 * Roles: DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own id only).
 * Returns the User row with the Patient record nested under `patient`.
 */
export async function getPatientById(_clinicId: string, patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Backend: GET /patients/:id
  const { data } = await authenticatedApi(`/patients/${patientId}`);
  return data;
}

/**
 * Create or update the patient profile of an existing user.
 * Backend: POST /patients — DOCTOR, ASSISTANT_DOCTOR, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN.
 * `userId` is the patient's USER id. When `insurance` is sent the server also requires
 * `primaryHolder`, `coverageStartDate` and `coverageType` on it.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PATIENTS.CREATE, {
    method: 'POST',
    body: JSON.stringify(patientData),
  });
  return data;
}

/**
 * Update a patient profile.
 * Backend: PUT /patients/:id — `:id` is the patient's USER id. DOCTOR, ASSISTANT_DOCTOR,
 * RECEPTIONIST (demographics, emergency contact and insurance only), CLINIC_ADMIN, SUPER_ADMIN.
 * The server rejects unknown fields; `isActive` is not part of its update contract and is not sent.
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
  address?: string;
  area?: string;
  district?: string;
  occupation?: string;
  organization?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { isActive: _isActive, ...payload } = updates;
  void _isActive;

  const { data } = await authenticatedApi(API_ENDPOINTS.PATIENTS.UPDATE(patientId), {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data;
}

/**
 * Deactivate a patient (soft delete).
 * Backend: DELETE /patients/:id — `:id` is the patient's USER id. CLINIC_ADMIN, SUPER_ADMIN only.
 */
export async function deletePatient(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PATIENTS.DELETE(patientId), {
    method: 'DELETE',
    // The API client always sends `Content-Type: application/json`, and the backend (Fastify)
    // answers 400 "Body cannot be empty" to a JSON request without a body. The route reads no body.
    body: JSON.stringify({}),
  });
  return data;
}

/**
 * Get patient medical history
 */
export async function getPatientMedicalHistory(_clinicId: string, patientId: string, filters?: {
  type?: string;
  startDate?: string;
  endDate?: string;
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

  const endpoint = `${API_ENDPOINTS.EHR.MEDICAL_HISTORY.GET_BY_USER(patientId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Add a medical history entry.
 * Backend: POST /ehr/medical-history — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 * Body (nothing else is accepted): `userId` (patient's USER id), `condition`, `date`, `notes?`.
 * `title` is saved as the condition; type, severity and description go into the notes.
 *
 * @param patientId the patient's USER id.
 */
export async function addPatientMedicalHistory(_clinicId: string, patientId: string, historyData: {
  type: 'DIAGNOSIS' | 'TREATMENT' | 'SURGERY' | 'ALLERGY' | 'MEDICATION' | 'FAMILY_HISTORY';
  title: string;
  description: string;
  date: string;
  doctorId?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const notes = [
    historyData.type ? `Type: ${historyData.type}` : '',
    historyData.severity ? `Severity: ${historyData.severity}` : '',
    historyData.description?.trim() || '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.MEDICAL_HISTORY.CREATE, {
    method: 'POST',
    body: JSON.stringify({
      userId: patientId,
      condition: historyData.title,
      date: historyData.date,
      ...(notes ? { notes } : {}),
    }),
  });
  return data;
}

/**
 * Get patient vital signs.
 * Backend: GET /ehr/vitals/:userId?type= — keyed on the patient's USER id. DOCTOR, ASSISTANT_DOCTOR,
 * NURSE, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own). Only `type` is read by the server.
 */
export async function getPatientVitalSigns(patientId: string, filters?: {
  startDate?: string;
  endDate?: string;
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
  
  const endpoint = `${API_ENDPOINTS.EHR.VITALS.GET_BY_USER(patientId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Record vital signs.
 * Backend: POST /ehr/vitals — DOCTOR, ASSISTANT_DOCTOR, NURSE, RECEPTIONIST, CLINIC_ADMIN, SUPER_ADMIN.
 * The server stores one row per reading: `userId` (patient's USER id), `type`, `value` (text),
 * `recordedAt`, `unit?`, `recordedBy?`, `notes?`. Each measurement given here is posted as its own row.
 *
 * @param patientId the patient's USER id.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const readings: Array<{ type: string; value: string; unit?: string }> = [];
  const add = (type: string, value: number | undefined, unit?: string) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      readings.push({ type, value: String(value), ...(unit ? { unit } : {}) });
    }
  };

  if (
    typeof vitalsData.bloodPressureSystolic === 'number' &&
    typeof vitalsData.bloodPressureDiastolic === 'number'
  ) {
    readings.push({
      type: 'blood_pressure',
      value: `${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}`,
      unit: 'mmHg',
    });
  }
  add('heart_rate', vitalsData.heartRate, 'bpm');
  add('temperature', vitalsData.temperature);
  add('respiratory_rate', vitalsData.respiratoryRate, 'breaths/min');
  add('oxygen_saturation', vitalsData.oxygenSaturation, '%');
  add('weight', vitalsData.weight, 'kg');
  add('height', vitalsData.height, 'cm');
  add('bmi', vitalsData.bmi);

  if (readings.length === 0) {
    throw new Error('Enter at least one vital sign before saving.');
  }

  const saved: unknown[] = [];
  for (const reading of readings) {
    const { data } = await authenticatedApi(API_ENDPOINTS.EHR.VITALS.CREATE, {
      method: 'POST',
      body: JSON.stringify({
        userId: patientId,
        ...reading,
        recordedAt: vitalsData.recordedAt,
        ...(vitalsData.recordedBy ? { recordedBy: vitalsData.recordedBy } : {}),
        ...(vitalsData.notes ? { notes: vitalsData.notes } : {}),
      }),
    });
    saved.push(data);
  }
  return saved;
}

/**
 * Get patient lab reports.
 * Backend: GET /ehr/lab-reports/:userId — keyed on the patient's USER id. DOCTOR, ASSISTANT_DOCTOR,
 * NURSE, LAB_TECHNICIAN, CLINIC_ADMIN, SUPER_ADMIN, PATIENT (own). The route takes no filters.
 */
export async function getPatientLabResults(patientId: string, filters?: {
  testType?: string;
  startDate?: string;
  endDate?: string;
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
  
  const endpoint = `${API_ENDPOINTS.EHR.LAB_REPORTS.GET_BY_USER(patientId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  return data;
}

/**
 * Add a lab report.
 * Backend: POST /ehr/lab-reports — DOCTOR, ASSISTANT_DOCTOR, LAB_TECHNICIAN, CLINIC_ADMIN, SUPER_ADMIN.
 * Body (nothing else is accepted): `userId` (patient's USER id), `testName`, `result`, `date`,
 * `unit?`, `normalRange?`, `status?`, `notes?`, `doctorId?`, `appointmentId?`, `fileUrl?`, `fileKey?`.
 * `testDate` is sent as `date`; test type, lab name and reported date go into the notes.
 *
 * @param patientId the patient's USER id.
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const notes = [
    labData.notes?.trim() || '',
    labData.testType ? `Test type: ${labData.testType}` : '',
    labData.labName ? `Lab: ${labData.labName}` : '',
    labData.reportedDate ? `Reported: ${labData.reportedDate}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR.LAB_REPORTS.CREATE, {
    method: 'POST',
    body: JSON.stringify({
      userId: patientId,
      testName: labData.testName,
      result: labData.result,
      date: labData.testDate,
      status: labData.status,
      ...(labData.unit ? { unit: labData.unit } : {}),
      ...(labData.normalRange ? { normalRange: labData.normalRange } : {}),
      ...(labData.doctorId ? { doctorId: labData.doctorId } : {}),
      ...(notes ? { notes } : {}),
    }),
  });
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
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const params = new URLSearchParams({ search: query, page: '1' });
  if (typeof filters?.limit === 'number' && filters.limit > 0) {
    params.set('limit', String(filters.limit));
  }

  const { data } = await authenticatedApi(`${API_ENDPOINTS.PATIENTS.GET_ALL}?${params.toString()}`, {
    ...(filters?.clinicId ? { clinicId: filters.clinicId } : {}),
  });
  return data;
}

/**
 * Export patient data
 */
export async function exportPatientData(_filters: {
  format: 'csv' | 'excel' | 'pdf';
  patientIds?: string[];
  includeHistory?: boolean;
  includeVitals?: boolean;
  includeLabs?: boolean;
  startDate?: string;
  endDate?: string;
}): Promise<never> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  throw new Error('Patient data export is not available yet: the server has no export service.');
}

/**
 * Update the patient's care plan (PUT /ehr/clinic/patients/:patientId/care-plan, clinical staff only).
 */
export async function updatePatientCarePlan(patientId: string, carePlanData: {
  title?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  summary?: string;
  goals?: { text: string; done?: boolean }[];
  interventions?: { text: string; done?: boolean }[];
  dietNotes?: string;
  lifestyleNotes?: string;
  /** ISO date. */
  nextReviewDate?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.EHR_CLINIC.PATIENT_CARE_PLAN(patientId), {
    method: 'PUT',
    body: JSON.stringify(carePlanData),
  });
  return data;
}
