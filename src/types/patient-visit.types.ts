import type { ClassicalExamType } from "@/lib/constants/ayurveda-classical-exam-categories";

export type SpecialCaseFlag = "MINOR" | "PHYSICAL_HANDICAP" | "PREGNANT_OR_SENIOR_CITIZEN";

export interface PatientVisit {
  id: string;
  opdNumber: string;
  registrationDate: string;
  patientId: string;
  clinicId: string;
  doctorId: string | null;
  specialCaseFlags: SpecialCaseFlag[];
  internationalId: string | null;
  presentIllness: string | null;
  presentComplaints: string | null;
  knownCaseOf: string | null;
  pastHistoryNotes: string | null;
  habits: Record<string, string> | null;
  nidra: string | null;
  nidraNotes: string | null;
  foodAllergyNotes: string | null;
  drugAllergyNotes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  /** Consultation invoice created at registration, when one could be created. */
  consultationInvoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    paidAmount: number;
  } | null;
}

export type CollectFeeMethod = "CASH" | "UPI" | "CARD" | "NET_BANKING";

export interface CreatePatientVisitInput {
  /** Patient.id — or pass patientUserId right after quick registration. */
  patientId?: string;
  patientUserId?: string;
  doctorId?: string;
  registrationDate?: string;
  specialCaseFlags?: SpecialCaseFlag[];
  internationalId?: string;
  presentIllness?: string;
  presentComplaints?: string;
  knownCaseOf?: string;
  /** Explicit consultation fee; falls back to Doctor.consultationFee, then clinic default. */
  consultationFee?: number;
  /** Discount off the resolved consultation fee. */
  feeDiscount?: number;
  /** Waive the consultation fee entirely (invoice created PAID at ₹0). */
  waiveFee?: boolean;
  /** Collect the consultation fee immediately at registration. */
  collectFee?: {
    method: CollectFeeMethod;
    transactionId?: string;
    note?: string;
  };
  /** Skip creating a consultation invoice for this visit entirely. */
  skipConsultationInvoice?: boolean;
}

export type UpdatePatientVisitInput = Partial<
  Pick<
    PatientVisit,
    | "doctorId"
    | "specialCaseFlags"
    | "internationalId"
    | "presentIllness"
    | "presentComplaints"
    | "knownCaseOf"
    | "pastHistoryNotes"
    | "habits"
    | "nidra"
    | "nidraNotes"
    | "foodAllergyNotes"
    | "drugAllergyNotes"
  >
>;

export interface VisitVitalsExamination {
  id: string;
  visitId: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  temperatureC: number | null;
  pulse: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  rr: number | null;
  painScore: number | null;
  fbs: number | null;
  ppbs: number | null;
  pbs: number | null;
  spo2: number | null;
  sleep: string | null;
  bowel: string | null;
  appetite: string | null;
  neck: number | null;
  chest: number | null;
  upperAbs: number | null;
  waist: number | null;
  lowerAbs: number | null;
  hips: number | null;
  thighLeft: number | null;
  thighRight: number | null;
  calfLeft: number | null;
  calfRight: number | null;
  upperArmLeft: number | null;
  upperArmRight: number | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UpsertVisitVitalsExaminationInput = Partial<
  Omit<VisitVitalsExamination, "id" | "visitId" | "bmi" | "recordedBy" | "createdAt" | "updatedAt">
>;

export interface ClassicalExamFinding {
  id: string;
  visitId: string;
  examType: ClassicalExamType;
  categoryKey: string;
  selectedOptions: string[];
  remark: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertClassicalExamFindingInput {
  examType: ClassicalExamType;
  categoryKey: string;
  selectedOptions: string[];
  remark?: string;
}

export interface VisitPatientSummary {
  id: string;
  userId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  age: number | null;
  address: string | null;
  area: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  organization: string | null;
}

export interface FamilyHistoryEntry {
  id: string;
  userId: string;
  clinicId: string;
  relation: string;
  condition: string;
  duration?: string;
  doctorId: string;
  diagnosedAge?: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitCaseSheet {
  visit: PatientVisit;
  patient: VisitPatientSummary | null;
  vitalsExamination: VisitVitalsExamination | null;
  classicalExams: ClassicalExamFinding[];
  familyHistory: Record<string, unknown>[];
  medications: Record<string, unknown>[];
  medicalHistory: Record<string, unknown>[];
  labReports: Record<string, unknown>[];
}

export interface CreateFamilyHistoryInput {
  userId: string;
  relation: string;
  condition: string;
  duration?: string;
  diagnosedAge?: number;
  notes?: string;
}

export type UpdateFamilyHistoryInput = Partial<Omit<CreateFamilyHistoryInput, "userId">>;

/**
 * A dependent registered under a head-of-family patient. Dependents are real
 * patients (own Patient/User record, no login) so every visit/EHR flow works
 * for them unchanged; this row is the family link.
 */
export interface FamilyMember {
  id: string;
  primaryPatientId: string;
  dependentPatientId: string | null;
  dependentUserId: string | null;
  firstName: string;
  lastName: string;
  name: string;
  relation: string;
  gender: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFamilyMemberInput {
  primaryPatientId: string;
  firstName: string;
  lastName: string;
  relation: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  notes?: string;
}

export type UpdateFamilyMemberInput = Partial<Omit<CreateFamilyMemberInput, "primaryPatientId">>;

export interface PrakritiAssessment {
  id: string;
  patientId: string;
  primaryDosha: string;
  secondaryDosha?: string | null;
  vataScore: number;
  pittaScore: number;
  kaphaScore: number;
  isConfirmed?: boolean;
  patientNotes?: string | null;
  practitionerNotes?: string | null;
  recommendations?: string | null;
  assessedAt: string;
}

export interface CreatePrakritiAssessmentInput {
  patientId: string;
  questionnaireAnswers: Record<string, number>;
  patientNotes?: string;
}
