/**
 * Healthcare Frontend - Critical Type Fixes
 * This script addresses the most critical type safety issues for healthcare compliance
 */

// Common healthcare types that should replace 'any'
export interface HealthcareApiResponse<T = unknown> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PatientData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  clinicId: string;
  medicalRecordNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentData {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  date: string;
  time: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  type: string;
  duration: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  clinicId: string;
  experience: number;
  qualifications: string[];
  availability: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecordData {
  id: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prescription?: string[];
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  followUpDate?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicData {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website?: string;
  licenseNumber: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FormData {
  [key: string]: string | number | boolean | Date | unknown;
}

export interface EventData {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  clinicId?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Replace any usage of 'any' with these specific types
export type SafeAny = unknown;
export type ComponentProps = Record<string, unknown>;
export type EventHandler = (event: Event) => void;
export type AsyncFunction<T = void> = () => Promise<T>;

