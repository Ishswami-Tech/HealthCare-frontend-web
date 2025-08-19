// ===== MEDICAL RECORD TYPES =====

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS' | 'NADI_PARIKSHA' | 'DOSHA_ANALYSIS' | 'PANCHAKARMA_RECORD';
  title: string;
  description: string;
  findings?: string;
  recommendations?: string;
  attachments?: MedicalRecordAttachment[];
  isConfidential: boolean;
  recordDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  clinic?: {
    id: string;
    name: string;
  };
  template?: MedicalRecordTemplate;
}

export interface MedicalRecordAttachment {
  id: string;
  medicalRecordId: string;
  fileName: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: string;
  
  // Relations
  medicalRecord?: MedicalRecord;
  uploadedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MedicalRecordTemplate {
  id: string;
  clinicId: string;
  name: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS' | 'NADI_PARIKSHA' | 'DOSHA_ANALYSIS' | 'PANCHAKARMA_RECORD';
  fields: MedicalRecordTemplateField[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  clinic?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MedicalRecordTemplateField {
  id: string;
  name: string;
  label: string;
  type: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'CHECKBOX' | 'RADIO' | 'FILE';
  required: boolean;
  options?: string[]; // for SELECT, RADIO
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
}

// ===== VITAL SIGNS =====

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
  pulseRate?: number;
  bloodSugar?: number;
  notes?: string;
  recordedAt: string;
  createdAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  recordedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// ===== LAB RESULTS =====

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  testType: 'BLOOD' | 'URINE' | 'STOOL' | 'IMAGING' | 'BIOPSY' | 'CULTURE' | 'OTHER';
  testCategory: string;
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING';
  orderedBy: string;
  performedAt: string;
  reportedAt: string;
  labName?: string;
  labTechnician?: string;
  notes?: string;
  attachments?: string[];
  isCritical: boolean;
  createdAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orderedByDoctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

// ===== IMAGING RESULTS =====

export interface ImagingResult {
  id: string;
  patientId: string;
  studyType: 'XRAY' | 'CT' | 'MRI' | 'ULTRASOUND' | 'MAMMOGRAPHY' | 'PET' | 'OTHER';
  bodyPart: string;
  findings: string;
  impression: string;
  recommendations?: string;
  orderedBy: string;
  performedAt: string;
  reportedAt: string;
  radiologist?: string;
  facility?: string;
  images?: ImagingAttachment[];
  isCritical: boolean;
  createdAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  orderedByDoctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface ImagingAttachment {
  id: string;
  imagingResultId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  uploadedAt: string;
}

// ===== AYURVEDIC SPECIFIC RECORDS =====

export interface PulseDiagnosis {
  id: string;
  patientId: string;
  doctorId: string;
  vataCharacteristics: string[];
  pittaCharacteristics: string[];
  kaphaCharacteristics: string[];
  dominantDosha: 'VATA' | 'PITTA' | 'KAPHA' | 'VATA_PITTA' | 'PITTA_KAPHA' | 'VATA_KAPHA' | 'TRIDOSHA';
  pulseQuality: string;
  pulseStrength: 'WEAK' | 'MODERATE' | 'STRONG';
  findings: string;
  recommendations: string;
  recordedAt: string;
  createdAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface DoshaAnalysis {
  id: string;
  patientId: string;
  doctorId: string;
  constitution: {
    vata: number; // percentage
    pitta: number; // percentage
    kapha: number; // percentage
  };
  currentImbalance: {
    vata: number; // percentage
    pitta: number; // percentage
    kapha: number; // percentage
  };
  symptoms: string[];
  lifestyle: {
    diet: string;
    exercise: string;
    sleep: string;
    stress: string;
  };
  recommendations: {
    diet: string[];
    lifestyle: string[];
    herbs: string[];
    treatments: string[];
  };
  recordedAt: string;
  createdAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface PanchakarmaTreatment {
  id: string;
  patientId: string;
  doctorId: string;
  treatmentType: 'PANCHAKARMA' | 'ABHYANGA' | 'SHIRODHARA' | 'BASTI' | 'NASYA' | 'VIRECHANA' | 'VAMANA';
  duration: number; // in days
  startDate: string;
  endDate?: string;
  sessions: PanchakarmaTreatmentSession[];
  pretreatmentPreparation: string;
  posttreatmentCare: string;
  expectedOutcomes: string[];
  actualOutcomes?: string[];
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISCONTINUED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

export interface PanchakarmaTreatmentSession {
  id: string;
  treatmentId: string;
  sessionNumber: number;
  date: string;
  duration: number; // in minutes
  therapist?: string;
  oilsUsed?: string[];
  herbsUsed?: string[];
  observations: string;
  patientResponse: string;
  nextSessionNotes?: string;
  completedAt: string;
  
  // Relations
  treatment?: PanchakarmaTreatment;
  therapistUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ===== FILTERS AND SEARCH =====

export interface MedicalRecordFilters {
  search?: string;
  patientId?: string;
  doctorId?: string;
  type?: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS' | 'NADI_PARIKSHA' | 'DOSHA_ANALYSIS' | 'PANCHAKARMA_RECORD';
  startDate?: string;
  endDate?: string;
  isConfidential?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'recordDate' | 'createdAt' | 'type' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ===== FORMS =====

export interface CreateMedicalRecordData {
  patientId: string;
  doctorId: string;
  type: 'LAB_TEST' | 'XRAY' | 'MRI' | 'PRESCRIPTION' | 'DIAGNOSIS_REPORT' | 'PULSE_DIAGNOSIS' | 'NADI_PARIKSHA' | 'DOSHA_ANALYSIS' | 'PANCHAKARMA_RECORD';
  title: string;
  description: string;
  findings?: string;
  recommendations?: string;
  isConfidential?: boolean;
  recordDate: string;
  templateId?: string;
  templateData?: {
    [fieldName: string]: string | number | boolean | string[] | Date;
  };
}

export interface UpdateMedicalRecordData extends Partial<CreateMedicalRecordData> {
  id: string;
}

export interface CreateVitalSignsData {
  patientId: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  pulseRate?: number;
  bloodSugar?: number;
  notes?: string;
  recordedAt: string;
}

export interface CreateLabResultData {
  patientId: string;
  testName: string;
  testType: 'BLOOD' | 'URINE' | 'STOOL' | 'IMAGING' | 'BIOPSY' | 'CULTURE' | 'OTHER';
  testCategory: string;
  result: string;
  normalRange?: string;
  unit?: string;
  status: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | 'PENDING';
  orderedBy: string;
  performedAt: string;
  reportedAt: string;
  labName?: string;
  labTechnician?: string;
  notes?: string;
  isCritical?: boolean;
}

