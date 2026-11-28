/**
 * Wire types of the prescription-draft workflow (API_CONTRACT section 5, `/rx-drafts`) used by
 * the assistant doctor and the doctor. Dispensing from clinic stock has its own module
 * (`lib/dispense/direct-dispense.ts`). Prices never appear for either role.
 */

/** DRAFT = waiting for the doctor; RETURNED = the doctor asked for changes. Approved drafts become PENDING prescriptions. */
export type RxDraftStatus = "DRAFT" | "RETURNED" | "PENDING" | "DISCARDED" | (string & {});

export interface RxDraftItem {
  id: string;
  medicineId: string | null;
  medicineName: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: number | null;
  instructions: string | null;
}

export interface RxDraft {
  id: string;
  prescriptionNumber: string | null;
  status: RxDraftStatus;
  patientId: string;
  patientName: string;
  diagnosis: string | null;
  notes: string | null;
  draftedByUserId: string | null;
  draftedByName: string | null;
  submittedAt: string | null;
  returnedAt: string | null;
  returnNote: string | null;
  /** The assistant's note when resubmitting a returned draft (contract 18.10). */
  resubmitNote?: string | null;
  approvedAt: string | null;
  items: RxDraftItem[];
  /** The items as the doctor saw them when returning the draft (for the "what you sent" view). */
  returnedSnapshot: unknown;
}

/** One line of a draft as the editors hold it (strings, so inputs stay controlled). */
export interface RxDraftLine {
  key: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

/** Body of `PATCH /pharmacy/prescriptions/:id` (`UpdatePharmacyPrescriptionDto`). */
export interface UpdateRxDraftInput {
  items?: Array<{
    medicineId: string;
    quantity: number;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  notes?: string;
  diagnosis?: string;
}
