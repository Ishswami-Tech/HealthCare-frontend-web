export interface CreateAppointmentData {
  doctorId: string;
  locationId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  date?: string;
  time?: string;
  duration?: number;
  status?: string;
  notes?: string;
}

export interface ProcessCheckInData {
  appointmentId: string;
}

export interface ReorderQueueData {
  appointmentOrder: string[];
}

export interface VerifyAppointmentQRData {
  qrData: string;
  locationId: string;
}

export interface CompleteAppointmentData {
  doctorId: string;
}

export interface StartConsultationData {
  doctorId: string;
}

export interface DoctorWithUser {
  id: string;
  userId: string;
  specialization?: string;
  licenseNumber?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

export interface PatientWithUser {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
}

export interface AppointmentLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  email?: string;
}

export interface AppointmentWithRelations {
  id: string;
  doctorId: string;
  patientId: string;
  locationId: string;
  clinicId: string;
  userId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  doctor: DoctorWithUser;
  patient: PatientWithUser;
  location: AppointmentLocation;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  availableSlots: string[];
  bookedSlots: string[];
}

export interface QueuePosition {
  appointmentId: string;
  position: number;
  estimatedWaitTime: number;
  totalInQueue: number;
}

export interface AppointmentQueue {
  doctorId: string;
  date: string;
  appointments: AppointmentWithRelations[];
  currentPosition?: number;
}

export interface QRCodeResponse {
  qrCode: string;
}

export interface AppointmentConfirmation {
  appointmentId: string;
  status: string;
  message: string;
}

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  locationId?: string;
  status?: string;
  type?: string;
  patientId?: string;
  clinicId?: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  checkedIn: number;
}

export type AppointmentStatus = 
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentType = 
  | 'CONSULTATION'
  | 'FOLLOW_UP'
  | 'EMERGENCY'
  | 'ROUTINE_CHECKUP'
  | 'SPECIALIST_VISIT'
  | 'LAB_TEST'
  | 'VACCINATION'; 