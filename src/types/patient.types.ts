// ===== PATIENT TYPES =====

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

// ===== MEDICAL RECORD TYPES =====

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS' | 'NADI_PARIKSHA' | 'DOSHA_ANALYSIS' | 'PANCHAKARMA_RECORD';
  title: string;
  description: string;
  findings?: string;
  recommendations?: string;
  attachments?: string[];
  isConfidential: boolean;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: Patient;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

// ===== PRESCRIPTION TYPES =====

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'PENDING' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';
  medications: PrescriptionMedication[];
  diagnosis?: string;
  notes?: string;
  validUntil?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: Patient;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface PrescriptionMedication {
  medicineId: string;
  medicine?: {
    id: string;
    name: string;
    genericName?: string;
    strength: string;
    dosageForm: string;
  };
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

// ===== APPOINTMENT REFERENCE =====

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== EXPORT ALL TYPES =====

export type {
  Patient,
  MedicalHistoryEntry,
  VitalSigns,
  LabResult,
  PatientFilters,
  PatientSearchResult,
  CreatePatientData,
  UpdatePatientData,
  PatientStats,
  MedicalRecord,
  Prescription,
  PrescriptionMedication,
  Appointment
};
