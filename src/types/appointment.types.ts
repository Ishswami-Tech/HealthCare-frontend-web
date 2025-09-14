// ✅ Enhanced Appointment Types to Match Backend API

export type AppointmentStatus = 
  | 'SCHEDULED'
  | 'CONFIRMED' 
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type AppointmentPriority = 
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

export interface CreateAppointmentData {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  notes?: string;
  clinicId?: string;
  locationId?: string;
  symptoms?: string[];
  priority?: AppointmentPriority;
}

export interface UpdateAppointmentData {
  date?: string;
  time?: string;
  duration?: number;
  type?: string;
  notes?: string;
  status?: AppointmentStatus;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
}

export interface CompleteAppointmentData {
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  followUpDate?: string;
  followUpNotes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: AppointmentStatus;
  priority: AppointmentPriority;
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
  clinicId?: string;
  locationId?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  patient?: Patient;
  doctor?: Doctor;
  clinic?: Clinic;
  location?: ClinicLocation;
}

export interface AppointmentWithRelations extends Appointment {
  patient: Patient;
  doctor: Doctor;
  clinic?: Clinic;
  location?: ClinicLocation;
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

// ✅ Add missing types for server actions
export type Appointment = AppointmentWithRelations;

export interface AppointmentFilters {
  status?: string;
  date?: string;
  doctorId?: string;
  patientId?: string;
  locationId?: string;
  clinicId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface QueueEntry {
  id: string;
  patientId: string;
  appointmentId?: string;
  queueType: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: string;
  position: number;
  estimatedWaitTime?: number;
  createdAt: string;
  updatedAt: string;
  patient?: PatientWithUser;
}

export interface QueueStats {
  totalInQueue: number;
  averageWaitTime: number;
  estimatedWaitTime: number;
  queueType: string;
  lastUpdated: string;
  byPriority?: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    URGENT: number;
  };
}

export interface DoctorAvailability {
  doctorId: string;
  date: string;
  slots: Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    appointmentId?: string;
  }>;
  workingHours: {
    start: string;
    end: string;
  };
  breaks: Array<{
    start: string;
    end: string;
    reason?: string;
  }>;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  averageDuration: number;
  completionRate: number;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  scheduledFor: string;
  sentAt?: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  recipient: string;
  message: string;
}

export interface AppointmentNotification {
  id: string;
  userId: string;
  type: 'APPOINTMENT_CREATED' | 'APPOINTMENT_UPDATED' | 'APPOINTMENT_CANCELLED' | 'REMINDER' | 'QUEUE_UPDATE';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface AppointmentQR {
  appointmentId: string;
  qrCode: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  locationId: string;
}

export interface AppointmentReport {
  clinicId: string;
  startDate: string;
  endDate: string;
  stats: AppointmentStats;
  appointments: AppointmentWithRelations[];
  doctors: DoctorWithUser[];
  locations: AppointmentLocation[];
  generatedAt: string;
  generatedBy: string;
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