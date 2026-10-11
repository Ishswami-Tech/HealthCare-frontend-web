'use server';

import { HealthcareErrorsService } from '@/lib/config/config';
import type { Prescription } from '@/types/medical-records.types';
import { clinicApiClient as api } from '@/lib/api/client';
import { getServerSession } from './auth.server';

// Prescription contract (backend `pharmacy.controller.ts` + `pharmacy.dto.ts`, verified by reading).
//
// What a DOCTOR can do:
//   - list   GET  /pharmacy/prescriptions                 PHARMACIST, CLINIC_ADMIN, DOCTOR (not ASSISTANT_DOCTOR).
//            No query parameters; answers a plain list of every prescription of the clinic.
//   - read   GET  /pharmacy/prescriptions/patient/:userId PHARMACIST, CLINIC_ADMIN, DOCTOR, PATIENT (own).
//            `:userId` is the patient's USER id. No query parameters.
//   - read   GET  /pharmacy/prescriptions/:id             + ASSISTANT_DOCTOR, RECEPTIONIST.
//   - create POST /pharmacy/prescriptions                 DOCTOR, ASSISTANT_DOCTOR.
//            Body, nothing else is accepted: `patientId` (Patient-record id), `doctorId` (Doctor-record
//            id), `items[{ medicineId, quantity, dosage?, frequency?, duration? }]`, `notes?`,
//            `diagnosis?`, `visitId?`.
// What a doctor cannot do (the backend offers no route for it):
//   - edit a saved prescription, cancel it, delete it, or get a PDF of it.
//   - PATCH /pharmacy/prescriptions/:id/status `{ status: 'FILLED' | 'CANCELLED', notes? }` is for the
//     PHARMACIST only.

type UnknownRecord = Record<string, unknown>;

type PrescriptionListFilters = {
  status?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  limit?: number;
  offset?: number;
};

/** A medicine line as the backend saves it. */
type PrescriptionItemInput = {
  medicineId: string;
  quantity: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
};

/** `Prescription` plus the fields the create route needs. */
type CreatePrescriptionInput = Prescription & {
  items?: PrescriptionItemInput[];
  diagnosis?: string;
  visitId?: string;
};

const PHARMACIST_ROLE = 'PHARMACIST';

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The list routes answer a plain list; a `{ prescriptions }` or `{ data }` wrapper is read too. */
function toPrescriptionList(payload: unknown): Prescription[] {
  if (Array.isArray(payload)) return payload as Prescription[];
  const record = asRecord(payload);
  if (Array.isArray(record.prescriptions)) return record.prescriptions as Prescription[];
  if (Array.isArray(record.data)) return record.data as Prescription[];
  return [];
}

/** `doctorId` may be the Doctor-record id (Prescription.doctorId) or the doctor's user id. */
function isByDoctor(row: UnknownRecord, doctorId: string): boolean {
  const doctor = asRecord(row.doctor);
  return [row.doctorId, doctor.id, doctor.userId, asRecord(doctor.user).id].includes(doctorId);
}

/** The backend applies no filter on these lists, so the filters are applied to the rows here. */
function applyFilters(rows: Prescription[], filters?: PrescriptionListFilters): Prescription[] {
  if (!filters) return rows;
  const status = filters.status?.trim().toUpperCase();
  const patientName = filters.patientName?.trim().toLowerCase();
  const from = filters.startDate ? new Date(filters.startDate).getTime() : Number.NaN;
  const to = filters.endDate ? new Date(filters.endDate).getTime() : Number.NaN;

  const filtered = rows.filter((entry) => {
    const row = asRecord(entry);
    if (status && asText(row.status).toUpperCase() !== status) return false;
    if (patientName) {
      const patient = asRecord(row.patient);
      const name = asText(asRecord(patient.user).name) || asText(patient.name);
      if (!name.toLowerCase().includes(patientName)) return false;
    }
    if (!Number.isNaN(from) || !Number.isNaN(to)) {
      const written = new Date(asText(row.date) || asText(row.createdAt)).getTime();
      if (Number.isNaN(written)) return false;
      if (!Number.isNaN(from) && written < from) return false;
      if (!Number.isNaN(to) && written > to) return false;
    }
    return true;
  });

  const offset = typeof filters.offset === 'number' && filters.offset > 0 ? filters.offset : 0;
  const limit = typeof filters.limit === 'number' && filters.limit > 0 ? filters.limit : undefined;
  return limit !== undefined ? filtered.slice(offset, offset + limit) : filtered.slice(offset);
}

async function requireSessionRole(): Promise<string> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized: Authentication required');
  }
  return String((session.user as { role?: unknown }).role ?? '').toUpperCase();
}

/** The two statuses PATCH /pharmacy/prescriptions/:id/status accepts. */
function toPharmacyStatus(status: unknown): 'FILLED' | 'CANCELLED' | null {
  const value = String(status ?? '').trim().toUpperCase();
  if (value === 'FILLED' || value === 'COMPLETED' || value === 'DISPENSED') return 'FILLED';
  if (value === 'CANCELLED' || value === 'CANCELED') return 'CANCELLED';
  return null;
}

/**
 * Get the prescriptions of the clinic; with `doctorId`, only the ones written by that doctor.
 * Backend: GET /pharmacy/prescriptions — PHARMACIST, CLINIC_ADMIN, DOCTOR. It takes no query
 * parameters and answers a plain list, so `doctorId` and `filters` are applied to the rows here.
 *
 * @param doctorId Doctor-record id (Prescription.doctorId) or the doctor's user id.
 */
export async function getPrescriptions(
  doctorId?: string,
  filters?: PrescriptionListFilters
): Promise<{ prescriptions: Prescription[] }> {
  try {
    await requireSessionRole();

    const response = await api.get<unknown>('/pharmacy/prescriptions');

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch prescriptions');
    }

    const all = toPrescriptionList(response.data);
    const own = doctorId ? all.filter((entry) => isByDoctor(asRecord(entry), doctorId)) : all;

    return { prescriptions: applyFilters(own, filters) };
  } catch (error) {
    HealthcareErrorsService.logError('fetch prescriptions', error);
    throw error;
  }
}

/**
 * Get the prescriptions of one patient.
 * Backend: GET /pharmacy/prescriptions/patient/:userId — PHARMACIST, CLINIC_ADMIN, DOCTOR, PATIENT
 * (own id only). It takes no query parameters, so `filters` are applied to the rows here.
 *
 * @param _doctorId kept for callers; the route returns every prescription of the patient.
 * @param patientId the patient's USER id (User.id), not the Patient-record id.
 */
export async function getPrescriptionsByPatientId(
  _doctorId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{ prescriptions: Prescription[] }> {
  try {
    await requireSessionRole();

    const response = await api.get<unknown>(
      `/pharmacy/prescriptions/patient/${encodeURIComponent(patientId)}`
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to fetch patient prescriptions');
    }

    return { prescriptions: applyFilters(toPrescriptionList(response.data), filters) };
  } catch (error) {
    HealthcareErrorsService.logError('fetch patient prescriptions', error);
    throw error;
  }
}

/**
 * Create a new prescription.
 * Backend: POST /pharmacy/prescriptions — DOCTOR, ASSISTANT_DOCTOR. The body is exactly
 * `{ patientId, doctorId, items[{ medicineId, quantity, dosage?, frequency?, duration? }], notes?,
 * diagnosis?, visitId? }`; any other field is rejected.
 *
 * `patientId` is the Patient-record id and `doctorId` the Doctor-record id. Every line needs a
 * medicine from the pharmacy stock list (`medicineId`) and a quantity: free-text medicines
 * (`medications` without ids) cannot be saved by this route.
 */
export async function createPrescription(
  prescriptionData: CreatePrescriptionInput
): Promise<{ prescription: Prescription }> {
  try {
    await requireSessionRole();

    const patientId = prescriptionData.patientId?.trim();
    const doctorId = prescriptionData.doctorId?.trim();
    if (!patientId) {
      throw new Error('Choose the patient before saving the prescription.');
    }
    if (!doctorId) {
      throw new Error('The prescribing doctor could not be identified. Please reload and try again.');
    }

    const items = (prescriptionData.items ?? [])
      .filter((item) => item.medicineId && Number.isInteger(item.quantity) && item.quantity > 0)
      .map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        ...(item.dosage ? { dosage: item.dosage } : {}),
        ...(item.frequency ? { frequency: item.frequency } : {}),
        ...(item.duration ? { duration: item.duration } : {}),
      }));
    if (items.length === 0 || items.length !== (prescriptionData.items ?? []).length) {
      throw new Error(
        'Choose every medicine from the pharmacy stock list and give a whole-number quantity. ' +
          'A prescription is saved only with a medicine and a quantity on each line.'
      );
    }

    const response = await api.post<unknown>('/pharmacy/prescriptions', {
      patientId,
      doctorId,
      items,
      ...(prescriptionData.notes ? { notes: prescriptionData.notes } : {}),
      ...(prescriptionData.diagnosis ? { diagnosis: prescriptionData.diagnosis } : {}),
      ...(prescriptionData.visitId ? { visitId: prescriptionData.visitId } : {}),
    });

    if (response.error) {
      throw new Error(response.error || 'Failed to create prescription');
    }

    const data = response.data;
    const prescription = ((data as { prescription?: Prescription })?.prescription ?? data) as Prescription;

    return { prescription };
  } catch (error) {
    HealthcareErrorsService.logError('create prescription', error);
    throw error;
  }
}

/**
 * Change the status of a prescription.
 * Backend: PATCH /pharmacy/prescriptions/:id/status — PHARMACIST only; body
 * `{ status: 'FILLED' | 'CANCELLED', notes? }`. There is no route that edits the medicines, diagnosis
 * or notes of a saved prescription, and none for a doctor to cancel it, so every other use fails here
 * with a readable message instead of a request the server rejects.
 */
export async function updatePrescription(
  prescriptionId: string,
  updates: Partial<Prescription>
): Promise<{ prescription: Prescription }> {
  try {
    const role = await requireSessionRole();

    if (role !== PHARMACIST_ROLE) {
      throw new Error(
        'A saved prescription cannot be changed. Only the pharmacist can mark it dispensed or cancelled; ' +
          'to correct one, write a new prescription for the patient.'
      );
    }

    const status = toPharmacyStatus(updates.status);
    if (!status) {
      throw new Error('A prescription can only be marked dispensed or cancelled.');
    }

    const response = await api.patch<unknown>(
      `/pharmacy/prescriptions/${encodeURIComponent(prescriptionId)}/status`,
      { status, ...(updates.notes ? { notes: updates.notes } : {}) }
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to update prescription');
    }

    const data = response.data;
    const prescription = ((data as { prescription?: Prescription })?.prescription ?? data) as Prescription;

    return { prescription };
  } catch (error) {
    HealthcareErrorsService.logError('update prescription', error);
    throw error;
  }
}

/**
 * Remove a prescription.
 * The backend has no delete route: a prescription is kept for the record. The pharmacist can cancel
 * one that has not been dispensed (PATCH /pharmacy/prescriptions/:id/status with `CANCELLED`); for
 * every other role this fails with a readable message.
 */
export async function deletePrescription(prescriptionId: string): Promise<void> {
  try {
    const role = await requireSessionRole();

    if (role !== PHARMACIST_ROLE) {
      throw new Error(
        'A prescription cannot be deleted: it stays on the patient record. ' +
          'Only the pharmacist can cancel one that has not been dispensed.'
      );
    }

    const response = await api.patch<unknown>(
      `/pharmacy/prescriptions/${encodeURIComponent(prescriptionId)}/status`,
      { status: 'CANCELLED' }
    );

    if (response.error) {
      throw new Error(response.error || 'Failed to cancel prescription');
    }
  } catch (error) {
    HealthcareErrorsService.logError('delete prescription', error);
    throw error;
  }
}
