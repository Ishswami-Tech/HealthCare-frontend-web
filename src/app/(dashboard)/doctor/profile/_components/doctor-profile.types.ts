export interface DoctorProfilePersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface DoctorProfileProfessionalInfo {
  medicalLicense: string;
  specializations: string[];
  experience: string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications: string[];
  languagesSpoken: string[];
  clinicAffiliations: string[];
}

export interface DoctorProfileConsultationSettings {
  consultationFee: string;
  followUpFee: string;
  onlineConsultation: boolean;
  videoConsultation: boolean;
  homeVisits: boolean;
  emergencyConsultation: boolean;
  consultationDuration: string;
  maxPatientsPerDay: string;
  bookingAdvanceDays: string;
}

export interface DoctorProfileAvailabilityDay {
  available: boolean;
  startTime: string;
  endTime: string;
}

export interface DoctorProfileFormState {
  personalInfo: DoctorProfilePersonalInfo;
  professionalInfo: DoctorProfileProfessionalInfo;
  consultationSettings: DoctorProfileConsultationSettings;
  availability: Record<string, DoctorProfileAvailabilityDay>;
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    appointmentReminders: boolean;
    patientMessages: boolean;
    emergencyAlerts: boolean;
    marketingEmails: boolean;
  };
}

export interface DoctorProfileStats {
  specializations: number;
  certifications: number;
  languagesSpoken: number;
}

export interface DoctorReview {
  patientName: string;
  rating: number;
  review: string;
  date: string;
}

export interface SaveProfileMutation {
  isPending: boolean;
  mutateAsync: (input: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  }) => Promise<{ success: boolean; error?: string | null }>;
}

export interface DoctorProfileUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}
