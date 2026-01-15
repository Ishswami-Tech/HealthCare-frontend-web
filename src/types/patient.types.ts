// ===== PATIENT TYPES =====

// ✅ Consolidated: Import types from their respective type files (single source of truth)
import type { Appointment } from './appointment.types';
import type { MedicalRecord } from './medical-records.types';
import type { Prescription } from './pharmacy.types';

export interface Patient {
  id: string;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory?: MedicalHistoryEntry[];
  allergies?: string[];
  currentMedications?: string[];
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  prescriptions?: Prescription[];
}

export interface MedicalHistoryEntry {
  id: string;
  patientId: string;
  type: 'DIAGNOSIS' | 'TREATMENT' | 'SURGERY' | 'ALLERGY' | 'MEDICATION' | 'FAMILY_HISTORY';
  title: string;
  description: string;
  date: string;
  doctorId?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface VitalSigns {
  id: string;
  patientId: string;
  recordedBy: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  notes?: string;
  recordedAt: string;
  createdAt: string;
  
  // Relations
  patient?: Patient;
  recordedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  testType: 'BLOOD' | 'URINE' | 'STOOL' | 'IMAGING' | 'OTHER';
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
  orderedBy: string;
  performedAt: string;
  reportedAt: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  
  // Relations
  patient?: Patient;
  orderedByDoctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

// ===== PATIENT FILTERS AND SEARCH =====

export interface PatientFilters {
  search?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  ageRange?: string;
  bloodGroup?: string;
  doctorId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'firstName' | 'lastName' | 'dateOfBirth' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PatientSearchResult {
  patients: Patient[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== PATIENT FORMS =====

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  currentMedications?: string[];
  insuranceInfo?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
  };
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
  id: string;
}

// ===== PATIENT STATISTICS =====

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  bloodGroupDistribution: Record<string, number>;
  appointmentsThisMonth: number;
  upcomingAppointments: number;
}

// ✅ Consolidated: Import types from their respective type files (single source of truth)
// MedicalRecord and Prescription are defined in their dedicated type files
// Re-export for convenience
export type { MedicalRecord } from './medical-records.types';
export type { Prescription, PrescriptionMedication } from './pharmacy.types';
export type { Appointment } from './appointment.types';

