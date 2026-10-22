'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import {
  createPrescription as createPharmacyPrescriptionAction,
  updatePrescription as updatePrescriptionAction,
} from './prescriptions.server';
import { API_ENDPOINTS } from '../config/config';

/**
 * The API client always sends `Content-Type: application/json`, and the backend (Fastify) answers
 * 400 "Body cannot be empty" to a JSON request without a body. The delete route reads no body.
 */
const EMPTY_JSON_BODY = JSON.stringify({});

// ===== MEDICAL RECORDS MANAGEMENT =====
//
// Backend: `ehr.controller.ts`, /ehr/medical-records (file-based health records).
// Ids: these records are keyed on the Patient-RECORD id (HealthRecord.patientId → Patient.id), unlike
// the other /ehr/<section>/:userId routes, which take the patient's USER id. `doctorId` is the
// Doctor-record id.

/**
 * Get patient medical records.
 * Backend: GET /ehr/medical-records/patient/:patientId — DOCTOR, ASSISTANT_DOCTOR, NURSE, PATIENT,
 * CLINIC_ADMIN, SUPER_ADMIN. Query (nothing else is accepted): `type`, `startDate`, `endDate`,
 * `search`, `uploadedBy`, `doctorId`. `limit` is not a server filter and is applied to the list here.
 *
 * @param patientId the Patient-record id (Patient.id).
 */
export async function getPatientMedicalRecords(patientId: string, filters?: {
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
  if (filters?.type) params.append('type', filters.type);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const endpoint = `${API_ENDPOINTS.MEDICAL_RECORDS.GET_BY_PATIENT(patientId)}${params.toString() ? `?${params.toString()}` : ''}`;
  const { data } = await authenticatedApi(endpoint);
  const limit = typeof filters?.limit === 'number' && filters.limit > 0 ? filters.limit : undefined;
  return limit !== undefined && Array.isArray(data) ? data.slice(0, limit) : data;
}

/**
 * Create medical record.
 * Backend: POST /ehr/medical-records — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 * Body (nothing else is accepted): `userId`, `type`, `title`, `content?`, `doctorId?`, `notes?`,
 * `uploadedBy?`. The server stores `userId` as the record's patient, which is the Patient-RECORD id,
 * so `patientId` is sent under that name. `doctorId` must be a Doctor-record id: the record cannot
 * be saved without one. `fileUrl` and `appointmentId` have no column on the server and are not sent;
 * attach a file with `uploadMedicalRecordFile` after the record exists.
 */
export async function createMedicalRecord(recordData: {
  patientId: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS';
  title: string;
  content: string;
  fileUrl?: string;
  doctorId?: string;
  appointmentId?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.MEDICAL_RECORDS.CREATE, {
    method: 'POST',
    body: JSON.stringify({
      userId: recordData.patientId,
      type: recordData.type,
      title: recordData.title,
      ...(recordData.content ? { content: recordData.content } : {}),
      ...(recordData.doctorId ? { doctorId: recordData.doctorId } : {}),
    }),
  });
  return data;
}

/**
 * Update medical record.
 * Backend: PUT /ehr/medical-records/:id — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 * Body (nothing else is accepted): `title?`, `content?`, `notes?`. `fileUrl` is not accepted; replace
 * the file with `uploadMedicalRecordFile`.
 */
export async function updateMedicalRecord(recordId: string, updates: {
  title?: string;
  content?: string;
  fileUrl?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.MEDICAL_RECORDS.UPDATE(recordId), {
    method: 'PUT',
    body: JSON.stringify({
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.content !== undefined ? { content: updates.content } : {}),
    }),
  });
  return data;
}

/**
 * Delete medical record.
 * Backend: DELETE /ehr/medical-records/:id — DOCTOR, ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function deleteMedicalRecord(recordId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.MEDICAL_RECORDS.DELETE(recordId), {
    method: 'DELETE',
    body: EMPTY_JSON_BODY,
  });
  return data;
}

/**
 * Get medical record by ID.
 * Backend: GET /ehr/medical-records/:id — DOCTOR, ASSISTANT_DOCTOR, NURSE, PATIENT, CLINIC_ADMIN,
 * SUPER_ADMIN.
 */
export async function getMedicalRecordById(recordId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.MEDICAL_RECORDS.GET_BY_ID(recordId));
  return data;
}

/**
 * Upload medical record file.
 * Backend: POST /ehr/medical-records/:id/upload (multipart, field `file`) — DOCTOR,
 * ASSISTANT_DOCTOR, NURSE, CLINIC_ADMIN, SUPER_ADMIN.
 */
export async function uploadMedicalRecordFile(recordId: string, file: File) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  if (!recordId) {
    throw new Error('A medical record id is required before a file can be attached');
  }
  if (!file || file.size === 0) {
    throw new Error('The selected file is empty');
  }

  const formData = new FormData();
  // Field name must stay `file` — the backend reads it via @FastifyFile().
  formData.append('file', file, file.name);

  // No Content-Type here on purpose: the API client strips it for FormData so
  // fetch can write the multipart boundary itself.
  const { data } = await authenticatedApi(API_ENDPOINTS.MEDICAL_RECORDS.UPLOAD(recordId), {
    method: 'POST',
    body: formData,
  });
  return data;
}

/**
 * Medical record templates.
 * The backend has no template routes, so no request is sent: the result says so.
 */
export async function getMedicalRecordTemplates(_type?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  return {
    available: false as const,
    items: [] as unknown[],
    message: 'Medical record templates are not available yet: the server has no service for them.',
  };
}

/**
 * Create medical record template.
 * The backend has no template routes, so this fails with a readable message.
 */
export async function createMedicalRecordTemplate(_templateData: {
  name: string;
  type: string;
  content: string;
  fields: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
  }>;
}): Promise<never> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  throw new Error('Medical record templates cannot be saved yet: the server has no service for them.');
}

// ===== PRESCRIPTIONS MANAGEMENT =====
//
// The full contract is written out in `prescriptions.server.ts`. A doctor can list, read and create;
// no route edits or deletes a saved prescription; only the pharmacist can change its status; there
// is no prescription PDF.

/**
 * Get the prescriptions of one patient (a plain list, newest first).
 * Backend: GET /pharmacy/prescriptions/patient/:userId — PHARMACIST, CLINIC_ADMIN, DOCTOR, PATIENT
 * (own id only; ASSISTANT_DOCTOR is not allowed). The route takes no query parameters.
 *
 * @param patientId the patient's USER id (User.id), not the Patient-record id.
 * @param _status kept for callers; the server does not filter by status.
 */
export async function getPatientPrescriptions(patientId: string, _status?: 'active' | 'completed' | 'cancelled') {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PRESCRIPTIONS.GET_BY_PATIENT(patientId));
  return data;
}

/**
 * Create prescription.
 * Backend: POST /pharmacy/prescriptions — DOCTOR, ASSISTANT_DOCTOR. Body, nothing else is accepted:
 * `patientId` (Patient-record id), `doctorId` (Doctor-record id),
 * `items[{ medicineId, quantity, dosage?, frequency?, duration? }]`, `notes?`, `diagnosis?`, `visitId?`.
 * Each medicine needs a whole-number `quantity`; `appointmentId` and per-medicine `instructions` have
 * no column on the server and are not sent.
 */
export async function createPrescription(prescriptionData: {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicines: Array<{
    medicineId: string;
    quantity?: number;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { prescription } = await createPharmacyPrescriptionAction({
    patientId: prescriptionData.patientId,
    doctorId: prescriptionData.doctorId,
    items: prescriptionData.medicines.map((medicine) => ({
      medicineId: medicine.medicineId,
      quantity: medicine.quantity ?? Number.NaN,
      dosage: medicine.dosage,
      frequency: medicine.frequency,
      duration: medicine.duration,
    })),
    ...(prescriptionData.notes ? { notes: prescriptionData.notes } : {}),
  });
  return prescription;
}

/**
 * Update prescription.
 * Backend: PATCH /pharmacy/prescriptions/:id/status `{ status: 'FILLED' | 'CANCELLED', notes? }` —
 * PHARMACIST only. Nothing else about a saved prescription can be changed, so `medicines` is never
 * sent and every other role gets a readable error.
 */
export async function updatePrescription(prescriptionId: string, updates: {
  medicines?: Array<{
    medicineId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'PENDING' | 'FILLED' | 'CANCELLED';
}) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  return updatePrescriptionAction(prescriptionId, {
    ...(updates.status ? { status: updates.status } : {}),
    ...(updates.notes ? { notes: updates.notes } : {}),
  });
}

/**
 * Get prescription by ID.
 * Backend: GET /pharmacy/prescriptions/:id — PATIENT (own), PHARMACIST, CLINIC_ADMIN, DOCTOR,
 * ASSISTANT_DOCTOR, RECEPTIONIST.
 */
export async function getPrescriptionById(prescriptionId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  const { data } = await authenticatedApi(API_ENDPOINTS.PRESCRIPTIONS.GET_BY_ID(prescriptionId));
  return data;
}

/**
 * Generate prescription PDF.
 * The backend has no prescription PDF route and a prescription carries no `pdfUrl`, so this fails
 * with a readable message without sending a request.
 */
export async function generatePrescriptionPDF(_prescriptionId: string): Promise<{ pdfUrl: string }> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }

  throw new Error('A prescription PDF is not available yet: the server has no prescription PDF service.');
}

// No medicine actions here: the backend has no /medicines routes. The medicine catalogue is the
// pharmacy stock list (`pharmacy.server.ts`, GET/POST /pharmacy/inventory).
