import type { useUpdateUserProfile } from "@/hooks/query/useUsers";
import type { ReviewStats } from "./doctor-profile.logic";
import type { LocalizedProfileDraft } from "./doctor-profile-localized";

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
  /** Public name, headline and highlights per language (en / hi / mr). */
  localizedProfile: LocalizedProfileDraft;
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
  id?: string;
  patientName: string;
  /** 1 to 5. */
  rating: number;
  review: string;
  /** ISO date; "" when unknown. */
  date: string;
}

/** What the Reviews tab needs from `useDoctorReviews`. */
export interface DoctorProfileReviewsState {
  reviews: DoctorReview[];
  isLoading: boolean;
  /** The request failed and there is nothing to show. */
  loadFailed: boolean;
  /** The server has no reviews service yet (the request answered "not found"). */
  notAvailable?: boolean;
  onRetry?: () => void;
  /** The server's average, count and page numbers over all reviews. */
  stats?: ReviewStats | null;
  /** When set, the list shows page controls. */
  onPageChange?: (page: number) => void;
}

export interface SaveProfileMutation {
  isPending: boolean;
  mutateAsync: (input: Record<string, unknown>) => Promise<{
    success: boolean;
    error?: string | null;
    message?: string;
    user?: Record<string, unknown>;
    profileComplete?: boolean;
  }>;
}

export interface DoctorProfileUser {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  role?: string | null;
}
