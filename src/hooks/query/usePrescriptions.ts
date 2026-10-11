import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import {
  createPrescription,
  deletePrescription,
  getPrescriptions,
  getPrescriptionsByPatientId,
  updatePrescription,
} from '@/lib/actions/prescriptions.server';
import { useAuthStore } from '@/stores/auth.store';
import type { Prescription } from '@/types/medical-records.types';

// What the backend offers for prescriptions is written out in `prescriptions.server.ts`.
// In short, a doctor can list, read and create; nobody can edit or delete a saved prescription; the
// pharmacist alone can mark one dispensed or cancelled; there is no prescription PDF.
//
// Messages meant for the user are raised here, in the browser: Next.js hides the message of an
// error thrown inside a server action in production builds.

/** A medicine line as the backend saves it. */
export interface PrescriptionItemInput {
  medicineId: string;
  quantity: number;
  dosage?: string;
  frequency?: string;
  duration?: string;
}

/** `Prescription` plus the fields POST /pharmacy/prescriptions needs. */
export type CreatePrescriptionInput = Prescription & {
  items?: PrescriptionItemInput[];
  diagnosis?: string;
  visitId?: string;
};

const PRESCRIPTION_QUERY_KEYS = [
  ['prescriptions'],
  ['patientPrescriptions'],
  ['patient-prescriptions'],
  ['medical-records'],
  ['medicalRecords'],
  ['ehr'],
  ['ehrClinic'],
];

const currentRole = (): string =>
  String(useAuthStore.getState().session?.user?.role ?? '').toUpperCase();

/**
 * Hook to get the prescriptions of the clinic; with `doctorId`, only that doctor's own.
 * Backend: GET /pharmacy/prescriptions — PHARMACIST, CLINIC_ADMIN, DOCTOR. It answers a plain list
 * of every prescription of the clinic and takes no query parameters; `doctorId` (Doctor-record id or
 * the doctor's user id) and `filters` are applied to the rows.
 */
export const usePrescriptions = (doctorId?: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  limit?: number;
  offset?: number;
}, options?: {
  enabled?: boolean;
}) => {
  return useQueryData(
    ['prescriptions', doctorId, filters],
    async () => getPrescriptions(doctorId, filters),
    {
      enabled: (options?.enabled ?? true) && !!doctorId,
    }
  );
};

/**
 * Hook to get the prescriptions of one patient.
 * Backend: GET /pharmacy/prescriptions/patient/:userId — PHARMACIST, CLINIC_ADMIN, DOCTOR, PATIENT
 * (own id only).
 *
 * @param doctorId kept for callers and the cache key; the route returns every prescription of the patient.
 * @param patientId the patient's USER id (User.id), not the Patient-record id.
 */
export const usePatientPrescriptions = (
  doctorId: string,
  patientId: string,
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }
) => {
  return useQueryData(
    ['patientPrescriptions', doctorId, patientId, filters],
    async () => getPrescriptionsByPatientId(doctorId, patientId, filters),
    {
      enabled: !!doctorId && !!patientId,
    }
  );
};

/**
 * Hook to create a new prescription.
 * Backend: POST /pharmacy/prescriptions — DOCTOR, ASSISTANT_DOCTOR. Body, nothing else is accepted:
 * `patientId` (Patient-record id), `doctorId` (Doctor-record id),
 * `items[{ medicineId, quantity, dosage?, frequency?, duration? }]`, `notes?`, `diagnosis?`, `visitId?`.
 * Free-text medicines (`medications` without a medicine id) cannot be saved by this route.
 */
export const useCreatePrescription = () => {
  return useMutationOperation(
    async (prescriptionData: CreatePrescriptionInput) => {
      if (!prescriptionData.patientId?.trim()) {
        throw new Error('Choose the patient before saving the prescription.');
      }
      if (!prescriptionData.doctorId?.trim()) {
        throw new Error('The prescribing doctor could not be identified. Please reload and try again.');
      }
      const items = prescriptionData.items ?? [];
      const everyLineValid =
        items.length > 0 &&
        items.every((item) => item.medicineId && Number.isInteger(item.quantity) && item.quantity > 0);
      if (!everyLineValid) {
        throw new Error(
          'Choose every medicine from the pharmacy stock list and give a whole-number quantity. ' +
            'A prescription is saved only with a medicine and a quantity on each line.'
        );
      }
      return await createPrescription(prescriptionData);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.CREATE,
      loadingMessage: 'Creating prescription...',
      successMessage: 'Prescription created successfully',
      invalidateQueries: PRESCRIPTION_QUERY_KEYS,
    }
  );
};

/**
 * Hook to change the status of a prescription.
 * Backend: PATCH /pharmacy/prescriptions/:id/status `{ status: 'FILLED' | 'CANCELLED', notes? }` —
 * PHARMACIST only. No route edits a saved prescription and a doctor cannot cancel one, so for every
 * other role this fails with a readable message and sends nothing.
 */
export const useUpdatePrescription = () => {
  return useMutationOperation(
    async ({ prescriptionId, updates }: { prescriptionId: string; updates: Partial<Prescription> }) => {
      if (currentRole() !== 'PHARMACIST') {
        throw new Error(
          'A saved prescription cannot be changed. Only the pharmacist can mark it dispensed or cancelled; ' +
            'to correct one, write a new prescription for the patient.'
        );
      }
      const status = String(updates.status ?? '').trim().toUpperCase();
      if (!['FILLED', 'COMPLETED', 'DISPENSED', 'CANCELLED', 'CANCELED'].includes(status)) {
        throw new Error('A prescription can only be marked dispensed or cancelled.');
      }
      return await updatePrescription(prescriptionId, updates);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.UPDATE,
      loadingMessage: 'Updating prescription...',
      successMessage: 'Prescription updated successfully',
      invalidateQueries: PRESCRIPTION_QUERY_KEYS,
    }
  );
};

/**
 * Hook to remove a prescription.
 * The backend has no delete route. For the pharmacist this cancels a prescription that has not been
 * dispensed (PATCH /pharmacy/prescriptions/:id/status with `CANCELLED`); for every other role it fails
 * with a readable message and sends nothing.
 */
export const useDeletePrescription = () => {
  return useMutationOperation(
    async (prescriptionId: string) => {
      if (currentRole() !== 'PHARMACIST') {
        throw new Error(
          'A prescription cannot be deleted: it stays on the patient record. ' +
            'Only the pharmacist can cancel one that has not been dispensed.'
        );
      }
      return await deletePrescription(prescriptionId);
    },
    {
      toastId: TOAST_IDS.PRESCRIPTION.DELETE,
      loadingMessage: 'Cancelling prescription...',
      successMessage: 'Prescription cancelled',
      invalidateQueries: PRESCRIPTION_QUERY_KEYS,
    }
  );
};
