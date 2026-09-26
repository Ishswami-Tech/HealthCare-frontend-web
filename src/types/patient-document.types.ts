/**
 * Patient documents (case-sheet Investigations & Documents tabs).
 * Mirrors `PatientDocumentResponse` in HealthCareBackend `patient-document.dto.ts`.
 */

export type PatientDocumentCategory = "INVESTIGATION" | "DOCUMENT";

export type PatientDocumentMediaKind = "IMAGE" | "PDF" | "AUDIO" | "VIDEO" | "OTHER";

export type PatientDocumentDisposition = "inline" | "attachment";

export interface PatientDocumentSubTypeOption {
  value: string;
  label: string;
}

export const INVESTIGATION_SUB_TYPE_OPTIONS: readonly PatientDocumentSubTypeOption[] = [
  { value: "XRAY", label: "X-Ray" },
  { value: "LAB", label: "Lab report" },
  { value: "MRI", label: "MRI" },
  { value: "CT", label: "CT scan" },
  { value: "USG", label: "USG / Sonography" },
  { value: "ECG", label: "ECG" },
  { value: "OTHER", label: "Other" },
];

export const DOCUMENT_SUB_TYPE_OPTIONS: readonly PatientDocumentSubTypeOption[] = [
  { value: "ID_PROOF", label: "ID proof" },
  { value: "OLD_PRESCRIPTION", label: "Old prescription" },
  { value: "CONSENT", label: "Consent form" },
  { value: "DISCHARGE", label: "Discharge summary" },
  { value: "REFERRAL", label: "Referral letter" },
  { value: "OTHER", label: "Other" },
];

export const PATIENT_DOCUMENT_SUB_TYPE_OPTIONS: Readonly<
  Record<PatientDocumentCategory, readonly PatientDocumentSubTypeOption[]>
> = {
  INVESTIGATION: INVESTIGATION_SUB_TYPE_OPTIONS,
  DOCUMENT: DOCUMENT_SUB_TYPE_OPTIONS,
};

export interface PatientDocument {
  id: string;
  clinicId: string;
  patientId: string;
  visitId: string | null;
  /** OPD number of the linked visit, resolved server-side. */
  opdNumber: string | null;
  category: PatientDocumentCategory;
  subType: string | null;
  title: string;
  notes: string | null;
  reportDate: string | null;
  fileName: string;
  mimeType: string;
  mediaKind: PatientDocumentMediaKind;
  fileSize: number;
  checksum: string | null;
  uploadedBy: string;
  uploadedByRole: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDocumentListResult {
  documents: PatientDocument[];
  total: number;
}

export interface PatientDocumentListFilters {
  category?: PatientDocumentCategory;
  visitId?: string;
  subType?: string;
  limit?: number;
  offset?: number;
}

export interface UploadPatientDocumentInput {
  patientId: string;
  visitId?: string;
  subType?: string;
  title?: string;
  notes?: string;
  /** ISO date (YYYY-MM-DD or full timestamp). */
  reportDate?: string;
}

/** `null` clears an optional value; omitted keys are left unchanged. */
export interface UpdatePatientDocumentInput {
  title?: string;
  notes?: string | null;
  subType?: string | null;
  reportDate?: string | null;
  visitId?: string | null;
}

export interface PatientDocumentAccessUrl {
  /** Absolute presigned S3 URL, or the relative authenticated `/content` API path. */
  url: string;
  expiresAt: string | null;
  mimeType: string;
  disposition: PatientDocumentDisposition;
}
