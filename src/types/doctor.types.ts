// ===== DOCTOR TYPES =====

export interface Doctor {
  id: string;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  qualifications: string[];
  languages: string[];
  consultationFee: number;
  bio?: string;
  profileImage?: string;
  isActive: boolean;
  isAvailable: boolean;
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
    address: string;
  };
  appointments?: Appointment[];
  availability?: DoctorAvailability[];
  reviews?: DoctorReview[];
  patients?: Patient[];
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments?: number;
  slotDuration?: number; // in minutes
  breakStartTime?: string;
  breakEndTime?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  doctor?: Doctor;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE' | 'ON_LEAVE' | 'HOLIDAY';
  appointmentSlots: AppointmentSlot[];
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  
  // Relations
  doctor?: Doctor;
}

export interface AppointmentSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  appointmentId?: string;
  patientId?: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  
  // Relations
  appointment?: Appointment;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface DoctorReview {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  rating: number; // 1-5
  comment?: string;
  isAnonymous: boolean;
  createdAt: string;
  
  // Relations
  doctor?: Doctor;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  appointment?: Appointment;
}

// ===== DOCTOR FILTERS AND SEARCH =====

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  minExperience?: number;
  maxConsultationFee?: number;
  languages?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'firstName' | 'lastName' | 'specialization' | 'experience' | 'consultationFee' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorSearchResult {
  doctors: Doctor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== DOCTOR FORMS =====

export interface CreateDoctorData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  qualifications: string[];
  languages: string[];
  consultationFee: number;
  bio?: string;
  profileImage?: string;
}

export interface UpdateDoctorData extends Partial<CreateDoctorData> {
  id: string;
}

export interface DoctorAvailabilityData {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxAppointments?: number;
  slotDuration?: number;
  breakStartTime?: string;
  breakEndTime?: string;
}

// ===== DOCTOR STATISTICS =====

export interface DoctorStats {
  totalDoctors: number;
  activeDoctors: number;
  availableDoctors: number;
  totalAppointmentsToday: number;
  completedAppointmentsToday: number;
  averageRating: number;
  totalReviews: number;
  specializationDistribution: Record<string, number>;
  experienceDistribution: {
    junior: number; // 0-5 years
    mid: number; // 6-15 years
    senior: number; // 16+ years
  };
}

export interface DoctorPerformance {
  doctorId: string;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageRating: number;
  totalReviews: number;
  totalRevenue: number;
  patientSatisfactionScore: number;
  onTimePercentage: number;
  
  // Time-based metrics
  appointmentsThisMonth: number;
  appointmentsLastMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
}

// ===== SPECIALIZATIONS =====

export const MEDICAL_SPECIALIZATIONS = [
  'GENERAL_MEDICINE',
  'CARDIOLOGY',
  'DERMATOLOGY',
  'ENDOCRINOLOGY',
  'GASTROENTEROLOGY',
  'NEUROLOGY',
  'ONCOLOGY',
  'ORTHOPEDICS',
  'PEDIATRICS',
  'PSYCHIATRY',
  'PULMONOLOGY',
  'RADIOLOGY',
  'SURGERY',
  'UROLOGY',
  'GYNECOLOGY',
  'OPHTHALMOLOGY',
  'ENT',
  'ANESTHESIOLOGY',
  'PATHOLOGY',
  'EMERGENCY_MEDICINE',
  'FAMILY_MEDICINE',
  'INTERNAL_MEDICINE',
  'AYURVEDA',
  'HOMEOPATHY',
  'UNANI',
  'SIDDHA'
] as const;

export type MedicalSpecialization = typeof MEDICAL_SPECIALIZATIONS[number];

// ===== LANGUAGES =====

export const SUPPORTED_LANGUAGES = [
  'ENGLISH',
  'HINDI',
  'MARATHI',
  'TAMIL',
  'TELUGU',
  'KANNADA',
  'SANSKRIT',
  'GUJARATI',
  'BENGALI',
  'PUNJABI',
  'MALAYALAM',
  'ODIA',
  'ASSAMESE'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

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

// ===== PATIENT REFERENCE =====

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

