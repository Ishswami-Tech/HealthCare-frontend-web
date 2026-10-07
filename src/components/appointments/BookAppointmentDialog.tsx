"use client";

import Link from "next/link";
import { logger } from "@/lib/utils/logger";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useReducer,
  type SetStateAction,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import type {
  AppointmentServiceDefinition,
  AppointmentType,
  TreatmentType,
} from "@/types/appointment.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentButton } from "@/components/payments/PaymentButton";
import { PaymentCountdown } from "@/components/appointments/PaymentCountdown";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import { useDoctors } from "@/hooks/query/useDoctors";
import {
  usePatients,
  useQuickRegisterPatient,
} from "@/hooks/query/usePatients";
import { useUserProfile } from "@/hooks/query/useUsers";
import { useMyFamilyMembers } from "@/hooks/query/useMyFamilyMembers";
import { Role } from "@/types/auth.types";
import {
  useAppointmentServices,
  useCreateAppointment,
  useDoctorAvailability,
} from "@/hooks/query/useAppointments";
import {
  useSubscriptions,
  useActiveSubscription,
  useCheckSubscriptionCoverage,
  useCreateInPersonAppointmentWithSubscription,
} from "@/hooks/query/useBilling";
import { useSendAppointmentReminder } from "@/hooks/query/useCommunication";
import {
  useActiveLocations,
  useClinicContext,
  useClinicLocations,
  useCurrentClinic,
  useCurrentClinicId,
  useMyClinic,
} from "@/hooks/query/useClinics";
import { useWebSocketContext } from "@/app/providers/WebSocketProvider";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import { getUserProfile, updateUserProfile } from "@/lib/actions/users.server";
import { clinicApiClient } from "@/lib/api/client";
import {
  dismissToast,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/hooks/utils/use-toast";
import { Permission } from "@/types/rbac.types";
import { APP_CONFIG } from "@/lib/config/config";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";
import { ROUTES } from "@/lib/config/routes";
import { theme } from "@/lib/utils/theme-utils";
import { cn } from "@/lib/utils";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { resolveDisplayNameAndInitials } from "@/lib/utils/display-name";
import { formatDoctorDisplayName } from "@/lib/utils/appointmentUtils";
import { format } from "date-fns";
import { AppointmentStepWrapper } from "@/components/appointments/AppointmentStepWrapper";
import {
  BookingDoctorPage,
  BookingDoctorPhoto,
  BookingEmpty,
  BookingGroupLabel,
  BookingHelpLine,
  BookingLoading,
  BookingNotice,
  BookingReviewStepView,
  BookingSkeletonRows,
  BookingSlotStepView,
  BookingStepper,
  BookingSuccessStepView,
  bookingOptionClass,
  buildSlotPeriods,
  downloadBookingCalendarFile,
  formatRupees,
  toTextList,
  formatSlotLabel,
  readBookedSlots,
  shortBookingRef,
  summarizeWorkingHours,
  type BookingDetail,
  type BookingDoctorInfo,
  type BookingHoursRow,
  type BookingLayout,
  type BookingVisitForProps,
} from "@/components/appointments/booking";
import { IconBox, Note, Pill, SectionTitle } from "@/components/tbd";
import { syncAppointmentInCache } from "@/lib/utils/appointment-cache";
import {
  Activity,
  Plus,
  Leaf,
  Waves,
  Search,
  Flame,
  Heart,
  Brain,
  Droplets,
  Wind,
  CheckCircle,
  ChevronLeft,
  User,
  Loader2,
  UserPlus,
  AlertTriangle,
  RefreshCw,
  Stethoscope,
  CalendarIcon,
  Download,
  Check,
  ArrowRight,
  Video,
  MapPin,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function isProfileCompletionError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error);

  return (
    message.includes("PROFILE_INCOMPLETE") ||
    message.includes("Profile incomplete") ||
    message.includes("Please complete your profile") ||
    message.includes("requiresProfileCompletion")
  );
}

interface ConsultationVisual {
  icon: React.ReactNode;
  color: string;
}

interface BookAppointmentDialogProps {
  trigger?: React.ReactNode;
  clinicId?: string;
  locationId?: string;
  clinicName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  onBooked?: () => void;
  initialConsultationMode?: "IN_PERSON" | "VIDEO" | undefined;
  initialServiceId?: string;
  initialDoctorId?: string;
  initialPatientId?: string;
  /** Patients only: open with this family member chosen under "Who is this visit for?". */
  initialFamilyMemberId?: string;
  /** When true, forces VIDEO mode and skips mode selection step */
  videoOnly?: boolean;
}

//  Consultation catalogue

function getConsultationVisual(
  treatmentType: TreatmentType,
): ConsultationVisual {
  const iconClass = "size-5";
  const visuals: Record<string, ConsultationVisual> = {
    GENERAL_CONSULTATION: {
      icon: <Activity className={iconClass} />,
      color: theme.badges.blue,
    },
    FOLLOW_UP: {
      icon: <CheckCircle className={iconClass} />,
      color: theme.badges.gray,
    },
    SPECIAL_CASE: {
      icon: <AlertTriangle className={iconClass} />,
      color: theme.badges.yellow,
    },
    DIAGNOSTIC_PREVENTIVE: {
      icon: <Search className={iconClass} />,
      color: theme.badges.blue,
    },
    SENIOR_CITIZEN: {
      icon: <User className={iconClass} />,
      color: theme.badges.gray,
    },
    PROCEDURAL_CARE: {
      icon: <Stethoscope className={iconClass} />,
      color: theme.badges.red,
    },
    AYURVEDIC_PROCEDURES: {
      icon: <Leaf className={iconClass} />,
      color: theme.badges.emerald,
    },
    THERAPY: {
      icon: <Leaf className={iconClass} />,
      color: theme.badges.emerald,
    },
    SURGERY: { icon: <Flame className={iconClass} />, color: theme.badges.red },
    LAB_TEST: {
      icon: <Droplets className={iconClass} />,
      color: theme.badges.blue,
    },
    IMAGING: {
      icon: <Brain className={iconClass} />,
      color: theme.badges.blue,
    },
    VACCINATION: {
      icon: <CheckCircle className={iconClass} />,
      color: theme.badges.emerald,
    },
    VIDDHAKARMA: {
      icon: <Flame className={iconClass} />,
      color: theme.badges.red,
    },
    AGNIKARMA: {
      icon: <Flame className={iconClass} />,
      color: theme.badges.red,
    },
    PANCHAKARMA: {
      icon: <Leaf className={iconClass} />,
      color: theme.badges.emerald,
    },
    NADI_PARIKSHA: {
      icon: <Heart className={iconClass} />,
      color: theme.badges.red,
    },
    DOSHA_ANALYSIS: {
      icon: <Brain className={iconClass} />,
      color: theme.badges.blue,
    },
    SHIRODHARA: {
      icon: <Droplets className={iconClass} />,
      color: theme.badges.blue,
    },
    VIRECHANA: {
      icon: <Leaf className={iconClass} />,
      color: theme.badges.emerald,
    },
    ABHYANGA: {
      icon: <Waves className={iconClass} />,
      color: theme.badges.blue,
    },
    SWEDANA: {
      icon: <Wind className={iconClass} />,
      color: theme.badges.orange,
    },
    BASTI: {
      icon: <Droplets className={iconClass} />,
      color: theme.badges.blue,
    },
    NASYA: { icon: <Wind className={iconClass} />, color: theme.badges.orange },
    RAKTAMOKSHANA: {
      icon: <Flame className={iconClass} />,
      color: theme.badges.red,
    },
  };

  return (
    visuals[treatmentType] || {
      icon: <Activity className={iconClass} />,
      color: theme.badges.blue,
    }
  );
}

// Slot grouping helper

function groupSlotsByPeriod(slots: string[]) {
  const morning: string[] = [];
  const afternoon: string[] = [];
  const evening: string[] = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.split(":")[0] ?? "0");
    if (hour < 12) morning.push(slot);
    else if (hour < 17) afternoon.push(slot);
    else evening.push(slot);
  });

  return { morning, afternoon, evening };
}

//  Step indicators

const STEP_ORDER = [
  "mode",
  "service",
  // Staff only, video flow: the patient picker (the Service step holds it in the other flows).
  "patient",
  "doctor",
  "date",
  "slot",
  "confirm",
  "success",
] as const;
type WizardStepId = (typeof STEP_ORDER)[number];

const STEP_LABELS: Record<WizardStepId, string> = {
  mode: "Consultation",
  service: "Service",
  patient: "Patient",
  doctor: "Doctor",
  date: "Date",
  slot: "Time",
  confirm: "Confirm",
  success: "Done",
};
/** Each appointment slot is 3 minutes. 20 bookable slots per hour. */
const IN_PERSON_APPOINTMENT_SLOT_DURATION_MINUTES = 3;
const VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES = 15;
const VIDEO_CONSULTATION_TREATMENT_TYPE: TreatmentType = "GENERAL_CONSULTATION";

interface BookAppointmentStepBarProps {
  activeSteps: readonly WizardStepId[];
  step: number;
  goToStep: (nextStepId: WizardStepId) => void;
  /** Patient page layout: date + time on one step (no separate calendar step). */
  mergeDateAndTimeStep?: boolean;
}

function stepBarLabel(stepId: WizardStepId, mergeDateAndTimeStep: boolean): string {
  if (mergeDateAndTimeStep && stepId === "slot") {
    return "Date & time";
  }
  return STEP_LABELS[stepId];
}

function BookAppointmentStepBar({
  activeSteps,
  step,
  goToStep,
  mergeDateAndTimeStep = false,
}: BookAppointmentStepBarProps) {
  // The "Done" screen is not drawn as a step (board DocAppointmentDialogs3).
  const visibleSteps = activeSteps
    .filter((stepId) => stepId !== "success")
    .map((stepId) => ({ id: stepId, label: stepBarLabel(stepId, mergeDateAndTimeStep) }));

  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5">
      <BookingStepper steps={visibleSteps} current={step} onStepClick={goToStep} />
      <BookingHelpLine />
    </div>
  );
}

interface BookAppointmentStep1Props {
  consultationMode: "IN_PERSON" | "VIDEO";
  isPatientClinicStillResolving: boolean;
  profileCompletionBlocked: boolean;
  handleOpenChange: (open: boolean) => void;
  replace: (url: string) => void;
  profileCompletionRedirectUrl: string;
  locationsLoading: boolean;
  allLocationsLoading: boolean;
  locations: any[];
  activeLocationsFetched: boolean;
  allLocationsFetched: boolean;
  hasOnlyInactiveLocations: boolean;
  clinicName?: string;
  selectedLocationId: string;
  setSelectedLocationId: (value: string) => void;
  selectedServiceId: string;
  setSelectedServiceId: (value: string) => void;
  setSelectedDoctorId: (value: string) => void;
  setSelectedDate: (value: Date | undefined) => void;
  setSelectedSlot: (value: string) => void;
  goNext: () => void;
  setConsultationMode: (value: "IN_PERSON" | "VIDEO") => void;
}

function BookAppointmentStep1({
  consultationMode,
  isPatientClinicStillResolving,
  profileCompletionBlocked,
  handleOpenChange,
  replace,
  profileCompletionRedirectUrl,
  locationsLoading,
  allLocationsLoading,
  locations,
  activeLocationsFetched,
  allLocationsFetched,
  hasOnlyInactiveLocations,
  clinicName,
  selectedLocationId,
  setSelectedLocationId,
  selectedServiceId,
  setSelectedServiceId,
  setSelectedDoctorId,
  setSelectedDate,
  setSelectedSlot,
  goNext,
  setConsultationMode,
}: BookAppointmentStep1Props) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
      {consultationMode === "VIDEO" ? (
        <Note tone="blue" icon={Video}>
          Video consultations do not require a physical location.
        </Note>
      ) : isPatientClinicStillResolving ? (
        <BookingLoading className="rounded-2xl border border-dashed border-line">
          Resolving your clinic
        </BookingLoading>
      ) : profileCompletionBlocked ? (
        <BookingNotice
          tone="amber"
          icon={AlertTriangle}
          title="Complete your profile first"
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                replace(profileCompletionRedirectUrl);
              }}
            >
              Complete profile
            </Button>
          }
        >
          <p className="m-0 text-xs">
            We need your profile details before loading locations or doctors.
          </p>
          <p className="m-0 text-xs opacity-90">
            You will be redirected to the profile completion page.
          </p>
        </BookingNotice>
      ) : (
        <div className="flex flex-col gap-2">
          <BookingGroupLabel>Visit Location</BookingGroupLabel>
          {((locationsLoading || allLocationsLoading) &&
            locations.length === 0) ||
          !activeLocationsFetched ||
          !allLocationsFetched ? (
            <BookingLoading className="rounded-2xl border border-dashed border-line">
              Loading locations
            </BookingLoading>
          ) : locations.length === 0 ? (
            <BookingNotice
              tone="amber"
              icon={Building}
              title="Clinic unavailable"
              actions={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Close
                </Button>
              }
            >
              <p className="m-0 text-xs">
                {clinicName
                  ? `${clinicName} has no active locations configured yet.`
                  : "No active locations are configured for this clinic yet."}
              </p>
              <p className="m-0 text-xs opacity-90">
                Please contact the clinic or try again later.
              </p>
            </BookingNotice>
          ) : (
            <div className="flex flex-col gap-y-2">
              {hasOnlyInactiveLocations && (
                <div className="rounded-xl border border-[#fcd34d] bg-[#fffbeb] px-3 py-2 text-xs text-[#92400e] dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  No active locations are configured yet. Showing all clinic
                  locations so booking can continue.
                </div>
              )}
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  aria-pressed={selectedLocationId === loc.id}
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    setSelectedDoctorId("");
                    setSelectedDate(getTodayIST());
                    setSelectedSlot("");
                    setTimeout(goNext, 150);
                  }}
                  className={bookingOptionClass(
                    selectedLocationId === loc.id,
                    "flex items-center gap-3 px-4 py-3",
                  )}
                >
                  <IconBox
                    icon={MapPin}
                    tone="mint"
                    size={38}
                    solid={selectedLocationId === loc.id}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-sm font-bold text-ink">
                      {loc.name || loc.address || "Location"}
                    </p>
                    {loc.address && loc.name && (
                      <p className="m-0 truncate text-xs text-ink-muted">
                        {loc.address}
                      </p>
                    )}
                    {loc.isActive === false && (
                      <p className="m-0 mt-1 text-[11px] font-semibold text-[#b45309] dark:text-amber-300">
                        Inactive location
                      </p>
                    )}
                  </div>
                  {selectedLocationId === loc.id && (
                    <Check className="size-4 shrink-0 text-brand" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <BookingGroupLabel>Consultation Mode</BookingGroupLabel>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {(
            [
              {
                value: "IN_PERSON",
                label: "In-Clinic",
                desc: "Visit the clinic",
                icon: (
                  <Building
                    className="size-[22px] text-[#059669] dark:text-emerald-300"
                    strokeWidth={2.2}
                  />
                ),
              },
              {
                value: "VIDEO",
                label: "Video",
                desc: "Remote consultation",
                icon: (
                  <Video className="size-[22px] fill-[#4f46e5] text-[#4f46e5] dark:fill-indigo-400 dark:text-indigo-400" />
                ),
              },
            ] as const
          ).map(({ value, label, desc, icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={consultationMode === value}
              onClick={() => {
                setConsultationMode(value);
                if (value === "VIDEO") {
                  setSelectedLocationId("");
                  setSelectedServiceId(VIDEO_CONSULTATION_TREATMENT_TYPE);
                } else if (
                  selectedServiceId === VIDEO_CONSULTATION_TREATMENT_TYPE
                ) {
                  setSelectedServiceId("");
                }
                setSelectedDoctorId("");
                setSelectedDate(getTodayIST());
                setSelectedSlot("");
                setTimeout(goNext, 150);
              }}
              className={bookingOptionClass(
                consultationMode === value,
                "flex min-h-24 flex-col items-start justify-center gap-1 px-3.5 py-3",
              )}
            >
              {icon}
              <span className="text-sm font-bold text-ink">{label}</span>
              <span className="text-xs text-ink-muted">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface QuickPatientDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
}

/**
 * True when a row of the clinic patient list is the selected patient. The picker stores the
 * patient's user id; callers that open the dialog for a known patient (`initialPatientId`)
 * pass the patient-record id. Both mean the same person.
 */
function isSelectedBookingPatient(
  patient: { userId?: unknown; id?: unknown; patientId?: unknown } | null | undefined,
  selectedPatientId: string,
): boolean {
  if (!patient || !selectedPatientId) {
    return false;
  }
  return (
    patient.userId === selectedPatientId ||
    patient.id === selectedPatientId ||
    patient.patientId === selectedPatientId
  );
}

interface BookAppointmentPatientPickerProps {
  newPatient: QuickPatientDraft;
  setNewPatient: React.Dispatch<React.SetStateAction<QuickPatientDraft>>;
  quickRegisterPatientMutation: ReturnType<typeof useQuickRegisterPatient>;
  showQuickCreatePatient: boolean;
  setShowQuickCreatePatient: React.Dispatch<React.SetStateAction<boolean>>;
  patientSearch: string;
  setPatientSearch: React.Dispatch<React.SetStateAction<string>>;
  locationsFetching: boolean;
  locations: any[];
  filteredPatientsList: any[];
  selectedPatientId: string;
  setSelectedPatientId: React.Dispatch<React.SetStateAction<string>>;
  setRecentlyCreatedPatient: React.Dispatch<
    React.SetStateAction<{
      id: string;
      displayName: string;
      phone?: string;
      email?: string;
    } | null>
  >;
  showQuickCreateAdditionalDetails: boolean;
  setShowQuickCreateAdditionalDetails: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  queryClient: ReturnType<typeof useQueryClient>;
  selectedPatient: { displayName: string; phone?: string } | null;
}

/**
 * Staff only: search, pick or quick-register the patient the visit is booked for.
 * One picker, shown on the Service step (in-clinic flow) and on the Patient step (video flow,
 * which has no Service step). Both write the same `selectedPatientId`.
 */
function BookAppointmentPatientPicker({
  newPatient,
  setNewPatient,
  quickRegisterPatientMutation,
  showQuickCreatePatient,
  setShowQuickCreatePatient,
  patientSearch,
  setPatientSearch,
  locationsFetching,
  locations,
  filteredPatientsList,
  selectedPatientId,
  setSelectedPatientId,
  setRecentlyCreatedPatient,
  showQuickCreateAdditionalDetails,
  setShowQuickCreateAdditionalDetails,
  queryClient,
  selectedPatient,
}: BookAppointmentPatientPickerProps) {
  const handleCreateQuickPatient = async () => {
    const firstName = newPatient.firstName.trim();
    const lastName = newPatient.lastName.trim();
    const phone = newPatient.phone.trim();

    if (!firstName || !lastName || !phone) {
      showErrorToast("First name, last name, and phone number are required");
      return;
    }

    try {
      const temporaryPassword = createTemporaryPatientPassword(phone);
      const normalizedGender = normalizePatientGender(newPatient.gender);
      const email = newPatient.email.trim();
      const quickRegisterResult =
        await quickRegisterPatientMutation.mutateAsync({
          ...(email ? { email } : {}),
          password: temporaryPassword,
          firstName,
          lastName,
          phone,
          ...(normalizedGender ? { gender: normalizedGender } : {}),
          ...(newPatient.dateOfBirth
            ? { dateOfBirth: newPatient.dateOfBirth }
            : {}),
          ...(newPatient.address.trim()
            ? { address: newPatient.address.trim() }
            : {}),
          ...(newPatient.emergencyContact?.trim() &&
          newPatient.emergencyPhone?.trim()
            ? {
                emergencyContact: {
                  name: newPatient.emergencyContact.trim(),
                  relationship: "Emergency Contact",
                  phone: newPatient.emergencyPhone.trim(),
                },
              }
            : {}),
          ...(newPatient.allergies?.trim()
            ? {
                allergies: newPatient.allergies.split(",").flatMap((value) => {
                  const trimmed = value.trim();
                  return trimmed ? [trimmed] : [];
                }),
              }
            : {}),
          ...(newPatient.medicalHistory?.trim()
            ? { medicalHistory: [newPatient.medicalHistory.trim()] }
            : {}),
          ...(newPatient.currentMedications?.trim()
            ? {
                medicalHistory: [
                  ...(newPatient.medicalHistory?.trim()
                    ? [newPatient.medicalHistory.trim()]
                    : []),
                  `Current medications: ${newPatient.currentMedications.trim()}`,
                ],
              }
            : {}),
        });
      const userId =
        (quickRegisterResult as any)?.user?.id ||
        (quickRegisterResult as any)?.userId ||
        (quickRegisterResult as any)?.id;
      if (!userId) {
        throw new Error(
          "Quick registration completed without a usable patient ID",
        );
      }
      const resolvedEmail =
        (quickRegisterResult as any)?.generatedEmail ||
        email ||
        `patient.${phone.replace(/\D/g, "")}@clinic.local`;

      const displayName = `${firstName} ${lastName}`.trim();
      setSelectedPatientId(userId);
      setPatientSearch(displayName);
      setRecentlyCreatedPatient({
        id: userId,
        displayName,
        phone,
        email: resolvedEmail,
      });
      setShowQuickCreatePatient(false);
      setShowQuickCreateAdditionalDetails(false);
      setNewPatient({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalHistory: "",
        allergies: "",
        currentMedications: "",
      });

      await queryClient.invalidateQueries({
        queryKey: ["patients"],
        exact: false,
      });
      showSuccessToast(
        `Patient created successfully. Temporary password: ${temporaryPassword}`,
      );
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to create patient",
      );
    }
  };

  return (
    <div className="flex flex-col gap-y-3 rounded-2xl border border-hair bg-[#f8fafc] p-4 dark:bg-well/50">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <BookingGroupLabel>Select Patient</BookingGroupLabel>
          <p className="m-0 mt-1 text-sm text-ink-muted">
            Search an existing patient or register a new one before booking.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowQuickCreatePatient((value) => !value)}
          className="gap-2 self-start"
        >
          <UserPlus className="size-4" />
          {showQuickCreatePatient ? "Close quick add" : "Register Patient"}
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={patientSearch}
          onChange={(event) => setPatientSearch(event.target.value)}
          placeholder="Search by patient name, phone, or email"
          className="h-11 pl-10"
        />
      </div>

      {locationsFetching && locations.length > 0 && (
        <p className="m-0 text-xs text-ink-muted">
          Refreshing location data in the background.
        </p>
      )}

      <div className="flex max-h-60 flex-col gap-y-2 overflow-y-auto pr-1">
        {filteredPatientsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-card px-4 py-6 text-center text-sm text-ink-muted">
            No patient matches the search.
          </div>
        ) : (
          filteredPatientsList.map((patient: any) => {
            const patientId = patient.userId || patient.id;
            const isSelected = isSelectedBookingPatient(patient, selectedPatientId);
            return (
              <button
                key={patientId}
                type="button"
                onClick={() => {
                  setSelectedPatientId(patientId);
                  setRecentlyCreatedPatient(null);
                }}
                aria-pressed={isSelected}
                className={bookingOptionClass(
                  isSelected,
                  "flex items-center gap-3 px-4 py-3",
                )}
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                    isSelected
                      ? "bg-[#047857] text-white"
                      : "bg-well text-ink-muted"
                  }`}
                >
                  {String(patient.displayName || "P")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm font-bold text-ink">
                    {patient.displayName}
                  </p>
                  <p className="m-0 truncate text-xs text-ink-muted">
                    {patient.phone || "No phone"}
                    {patient.email ? ` - ${patient.email}` : ""}
                  </p>
                </div>
                {isSelected && (
                  <Check className="size-4 shrink-0 text-brand" />
                )}
              </button>
            );
          })
        )}
      </div>

      {showQuickCreatePatient && (
        <Card className="rounded-[20px] border border-line bg-card shadow-card">
          <CardContent className="flex flex-col gap-y-4 p-4">
            <div className="flex items-start gap-3">
              <IconBox icon={User} tone="mint" size={36} />
              <div>
                <p className="m-0 text-sm font-bold text-ink">Register Patient</p>
                <p className="m-0 text-xs text-ink-muted">
                  This creates the patient identity and profile, then
                  returns you to booking.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-y-2">
                <Label className="text-[13px] font-bold text-ink">
                  First name
                </Label>
                <Input
                  value={newPatient.firstName}
                  onChange={(event) =>
                    setNewPatient((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  placeholder="John"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label className="text-[13px] font-bold text-ink">
                  Last name
                </Label>
                <Input
                  value={newPatient.lastName}
                  onChange={(event) =>
                    setNewPatient((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder="Doe"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label className="text-[13px] font-bold text-ink">
                  Phone
                </Label>
                <Input
                  value={newPatient.phone}
                  onChange={(event) =>
                    setNewPatient((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label className="text-[13px] font-bold text-ink">
                  Email
                </Label>
                <Input
                  type="email"
                  value={newPatient.email}
                  onChange={(event) =>
                    setNewPatient((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="patient@example.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div>
                <p className="m-0 text-sm font-bold text-[#065f46] dark:text-emerald-200">
                  Additional Details
                </p>
                <p className="m-0 text-[11px] text-[#047857] dark:text-emerald-300/80">
                  Optional DOB, gender, address, emergency contact, and
                  medical notes.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setShowQuickCreateAdditionalDetails((current) => !current)
                }
                className="shrink-0 gap-2 text-brand hover:bg-mint hover:text-brand-dark"
              >
                {showQuickCreateAdditionalDetails ? (
                  <>
                    Hide
                    <ChevronUp className="size-4" />
                  </>
                ) : (
                  <>
                    Show
                    <ChevronDown className="size-4" />
                  </>
                )}
              </Button>
            </div>

            {showQuickCreateAdditionalDetails && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Date of birth
                  </Label>
                  <Input
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        dateOfBirth: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Gender
                  </Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(value: string) =>
                      setNewPatient((current) => ({
                        ...current,
                        gender: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-y-2 sm:col-span-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Address
                  </Label>
                  <Textarea
                    value={newPatient.address}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    placeholder="Street, city, state"
                    className="min-h-20"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Emergency contact
                  </Label>
                  <Input
                    value={newPatient.emergencyContact}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        emergencyContact: event.target.value,
                      }))
                    }
                    placeholder="Contact name"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Emergency phone
                  </Label>
                  <Input
                    value={newPatient.emergencyPhone}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        emergencyPhone: event.target.value,
                      }))
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="flex flex-col gap-y-2 sm:col-span-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Medical history
                  </Label>
                  <Textarea
                    value={newPatient.medicalHistory}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        medicalHistory: event.target.value,
                      }))
                    }
                    placeholder="Known conditions, surgeries, or observations"
                    className="min-h-20"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Allergies
                  </Label>
                  <Input
                    value={newPatient.allergies}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        allergies: event.target.value,
                      }))
                    }
                    placeholder="Comma separated"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label className="text-[13px] font-bold text-ink">
                    Current medications
                  </Label>
                  <Textarea
                    value={newPatient.currentMedications}
                    onChange={(event) =>
                      setNewPatient((current) => ({
                        ...current,
                        currentMedications: event.target.value,
                      }))
                    }
                    placeholder="Current medications"
                    className="min-h-20"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuickCreatePatient(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="gap-2"
                onClick={handleCreateQuickPatient}
                disabled={quickRegisterPatientMutation.isPending}
              >
                {quickRegisterPatientMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Register Patient
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPatient ? (
        <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 text-sm text-[#065f46] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <span className="font-bold">
            Booking for {selectedPatient.displayName}
          </span>
          {selectedPatient.phone ? (
            <span className="ml-2 opacity-80">
              - {selectedPatient.phone}
            </span>
          ) : null}
        </div>
      ) : selectedPatientId ? (
        // Opened for a known patient who is not in the loaded list (or the list is still loading).
        <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 text-sm text-[#065f46] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <span className="font-bold">A patient is already selected for this booking.</span>
          <span className="ml-2 opacity-80">Pick another patient to change it.</span>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-card px-4 py-3 text-sm text-ink-muted">
          Select or create a patient to continue booking.
        </div>
      )}
    </div>
  );
}

/** Staff, video flow: choose the patient first (the video flow has no Service step). */
function BookAppointmentStepPatient(pickerProps: BookAppointmentPatientPickerProps) {
  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
      <p className="m-0 text-sm font-medium text-ink-muted">
        Who is this video appointment for?
      </p>
      <BookAppointmentPatientPicker {...pickerProps} />
    </div>
  );
}

interface BookAppointmentStep2ServiceProps {
  visibleServices: AppointmentServiceDefinition[];
  serviceFilter: string;
  setServiceFilter: React.Dispatch<React.SetStateAction<string>>;
  servicesLoading: boolean;
  newPatient: QuickPatientDraft;
  setNewPatient: React.Dispatch<React.SetStateAction<QuickPatientDraft>>;
  quickRegisterPatientMutation: ReturnType<typeof useQuickRegisterPatient>;
  isPrivilegedScheduler: boolean;
  showQuickCreatePatient: boolean;
  setShowQuickCreatePatient: React.Dispatch<React.SetStateAction<boolean>>;
  patientSearch: string;
  setPatientSearch: React.Dispatch<React.SetStateAction<string>>;
  locationsFetching: boolean;
  locations: any[];
  filteredPatientsList: any[];
  selectedPatientId: string;
  setSelectedPatientId: React.Dispatch<React.SetStateAction<string>>;
  selectedServiceId: string;
  setSelectedServiceId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDoctorId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setSelectedSlot: React.Dispatch<React.SetStateAction<string>>;
  setRecentlyCreatedPatient: React.Dispatch<
    React.SetStateAction<{
      id: string;
      displayName: string;
      phone?: string;
      email?: string;
    } | null>
  >;
  showQuickCreateAdditionalDetails: boolean;
  setShowQuickCreateAdditionalDetails: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  queryClient: ReturnType<typeof useQueryClient>;
  selectedPatient: { displayName: string; phone?: string } | null;
  goNext: () => void;
}

function BookAppointmentStep2Service({
  visibleServices,
  serviceFilter,
  setServiceFilter,
  servicesLoading,
  newPatient,
  setNewPatient,
  quickRegisterPatientMutation,
  isPrivilegedScheduler,
  showQuickCreatePatient,
  setShowQuickCreatePatient,
  patientSearch,
  setPatientSearch,
  locationsFetching,
  locations,
  filteredPatientsList,
  selectedPatientId,
  setSelectedPatientId,
  selectedServiceId,
  setSelectedServiceId,
  setSelectedDoctorId,
  setSelectedDate,
  setSelectedSlot,
  setRecentlyCreatedPatient,
  showQuickCreateAdditionalDetails,
  setShowQuickCreateAdditionalDetails,
  queryClient,
  selectedPatient,
  goNext,
}: BookAppointmentStep2ServiceProps) {
  const categories = [
    "All",
    ...Array.from(new Set(visibleServices.map((t) => t.category))),
  ];
  const filtered =
    serviceFilter === "All"
      ? visibleServices
      : visibleServices.filter((t) => t.category === serviceFilter);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
      <p className="m-0 text-sm font-medium text-ink-muted">
        What type of consultation do you need?
      </p>
      {isPrivilegedScheduler && (
        <BookAppointmentPatientPicker
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          quickRegisterPatientMutation={quickRegisterPatientMutation}
          showQuickCreatePatient={showQuickCreatePatient}
          setShowQuickCreatePatient={setShowQuickCreatePatient}
          patientSearch={patientSearch}
          setPatientSearch={setPatientSearch}
          locationsFetching={locationsFetching}
          locations={locations}
          filteredPatientsList={filteredPatientsList}
          selectedPatientId={selectedPatientId}
          setSelectedPatientId={setSelectedPatientId}
          setRecentlyCreatedPatient={setRecentlyCreatedPatient}
          showQuickCreateAdditionalDetails={showQuickCreateAdditionalDetails}
          setShowQuickCreateAdditionalDetails={setShowQuickCreateAdditionalDetails}
          queryClient={queryClient}
          selectedPatient={selectedPatient}
        />
      )}
      {servicesLoading ? <BookingSkeletonRows rows={4} /> : null}
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setServiceFilter(cat)}
            aria-pressed={serviceFilter === cat}
            className={`inline-flex min-h-[38px] shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-[13px] transition-colors ${
              serviceFilter === cat
                ? "bg-[#047857] font-bold text-white shadow-[0_6px_14px_rgba(4,120,87,0.22)]"
                : "border border-line bg-card font-semibold text-ink hover:bg-mint-soft"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-y-2">
        {!servicesLoading && filtered.length === 0 ? (
          <BookingEmpty
            icon={Activity}
            tone="slate"
            title="No services available for this mode"
          />
        ) : null}
        {filtered.map((t) => (
          <button
            key={t.treatmentType}
            type="button"
            onClick={() => {
              setSelectedServiceId(t.treatmentType);
              setSelectedDoctorId("");
              setSelectedDate(getTodayIST());
              setSelectedSlot("");
              setTimeout(goNext, 150);
            }}
            aria-pressed={selectedServiceId === t.treatmentType}
            className={bookingOptionClass(
              selectedServiceId === t.treatmentType,
              "p-4",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${getConsultationVisual(t.treatmentType).color}`}
              >
                {getConsultationVisual(t.treatmentType).icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="m-0 text-sm font-bold text-ink">
                    {t.label || t.treatmentType}
                  </p>
                  {selectedServiceId === t.treatmentType && (
                    <Check className="size-4 shrink-0 text-brand" />
                  )}
                </div>
                <p className="m-0 text-xs text-ink-muted line-clamp-2">
                  {t.description || ""}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const RenderStep2Service = BookAppointmentStep2Service;

interface BookAppointmentStep2Props {
  doctorsLoading: boolean;
  doctorsFetched: boolean;
  doctorsRefreshing: boolean;
  doctorsErrorMessage?: string;
  doctorsList: any[];
  consultationMode: "IN_PERSON" | "VIDEO";
  selectedLocationId: string;
  selectedDoctorId: string;
  setSelectedDoctorId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setSelectedSlot: React.Dispatch<React.SetStateAction<string>>;
  goNext: () => void;
  goBack: () => void;
  onHardRefresh: () => void;
}

function BookAppointmentStep2({
  doctorsLoading,
  doctorsFetched,
  doctorsRefreshing,
  doctorsErrorMessage,
  doctorsList,
  consultationMode,
  selectedLocationId,
  selectedDoctorId,
  setSelectedDoctorId,
  setSelectedDate,
  setSelectedSlot,
  goNext,
  goBack,
  onHardRefresh,
}: BookAppointmentStep2Props) {
  const refreshActions = (
    <>
      <Button type="button" onClick={onHardRefresh} disabled={doctorsRefreshing}>
        {doctorsRefreshing ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        {doctorsRefreshing ? "Refreshing..." : "Hard refresh"}
      </Button>
      <Button type="button" variant="outline" onClick={goBack}>
        Back
      </Button>
    </>
  );
  const refreshingLine = doctorsRefreshing ? (
    <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
      <Loader2 className="size-4 animate-spin" />
      Refreshing doctors from the server...
    </div>
  ) : null;

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <p className="m-0 text-sm font-medium text-ink-muted">
        Choose your preferred doctor
      </p>
      {doctorsLoading || !doctorsFetched ? (
        <BookingSkeletonRows rows={4} />
      ) : doctorsErrorMessage && doctorsList.length === 0 ? (
        <BookingNotice
          tone="rose"
          icon={AlertTriangle}
          title="Unable to load doctors"
          actions={refreshActions}
        >
          <p className="m-0 text-xs">
            The server did not return a usable doctor list. This is usually a temporary network, auth, or cache issue.
          </p>
          <p className="m-0 text-xs opacity-90">{doctorsErrorMessage}</p>
          <p className="m-0 text-xs opacity-90">
            Hard refresh clears the local cache and retries the clinic API.
          </p>
          {refreshingLine}
        </BookingNotice>
      ) : doctorsList.length === 0 ? (
        <BookingNotice
          tone="amber"
          icon={User}
          title="No doctors available"
          actions={refreshActions}
        >
          <p className="m-0 text-xs">
            {selectedLocationId
              ? "This location does not currently have any bookable doctors for the selected mode."
              : consultationMode === "VIDEO"
                ? "No doctors are currently available for video appointments."
                : "No doctors are currently available for this clinic."}
          </p>
          <p className="m-0 text-xs opacity-90">
            If doctors should be available, the list may be stale. Hard refresh to reload.
          </p>
          {refreshingLine}
        </BookingNotice>
      ) : (
        <div className="flex flex-col gap-y-2">
          {doctorsList.map((doctor: any) => (
            <button
              key={doctor.id}
              type="button"
              aria-pressed={selectedDoctorId === doctor.id}
              onClick={() => {
                setSelectedDoctorId(doctor.id);
                setSelectedDate(getTodayIST());
                setSelectedSlot("");
                setTimeout(goNext, 150);
              }}
              className={bookingOptionClass(
                selectedDoctorId === doctor.id,
                "flex items-center gap-3.5 px-4 py-3",
              )}
            >
              <BookingDoctorPhoto
                name={doctor.name || "D"}
                image={doctor.image || undefined}
                sizes="48px"
                className="size-12"
              />
              <div className="flex-1 min-w-0">
                <p className="m-0 truncate text-[15px] font-bold text-ink">
                  {doctor.name}
                </p>
                <p className="m-0 truncate text-[13px] text-ink-muted">
                  {doctor.specialization || "General Physician"}
                </p>
              </div>
              <Pill tone="green" dot className="shrink-0">
                Available
              </Pill>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
interface BookAppointmentStep3Props {
  selectedDate: Date | undefined;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setSelectedSlot: React.Dispatch<React.SetStateAction<string>>;
  goNext: () => void;
  isClinicClosedDate: (date: Date) => boolean;
  layout: BookingLayout;
  doctorInfo: BookingDoctorInfo | null;
  doctorHours: BookingHoursRow[];
  doctorHoursTag?: string | undefined;
}

function BookAppointmentStep3({
  selectedDate,
  setSelectedDate,
  setSelectedSlot,
  goNext,
  isClinicClosedDate,
  layout,
  doctorInfo,
  doctorHours,
  doctorHoursTag,
}: BookAppointmentStep3Props) {
  const calendar = (
    <>
      <div className="book-dialog-calendar-container flex w-full max-w-full justify-center">
        <style dangerouslySetInnerHTML={{ __html: `
          .book-dialog-calendar-container .rdp-week,
          .book-dialog-calendar-container .rdp-weekdays {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            width: 100% !important;
          }
          .book-dialog-calendar-container .rdp-day_button {
            height: var(--cell-size) !important;
            width: var(--cell-size) !important;
            aspect-ratio: auto !important;
          }
        `}} />
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            if (d && isClinicClosedDate(d)) {
              return;
            }
            setSelectedDate(d);
            setSelectedSlot("");
            if (d) {
              setTimeout(goNext, 150);
            }
          }}
          disabled={(date) => {
            const todayIST = getTodayIST();
            const isPastDate =
              date.getFullYear() < todayIST.getFullYear() ||
              (date.getFullYear() === todayIST.getFullYear() &&
                date.getMonth() < todayIST.getMonth()) ||
              (date.getFullYear() === todayIST.getFullYear() &&
                date.getMonth() === todayIST.getMonth() &&
                date.getDate() < todayIST.getDate());
            return isPastDate || isClinicClosedDate(date);
          }}
          className="mx-auto w-full max-w-[22rem] rounded-2xl border border-line bg-card p-2 text-sm shadow-none dark:bg-card sm:p-3 [--cell-size:1.875rem] sm:[--cell-size:2.25rem] [&_.rdp-caption_label]:text-sm [&_.rdp-button]:text-sm"
        />
      </div>
      {selectedDate && (
        <div className="mx-auto flex w-full max-w-[22rem] items-center justify-center gap-2 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CalendarIcon className="size-4 shrink-0 text-[#047857] dark:text-emerald-300" />
          <span className="text-sm font-bold text-[#065f46] dark:text-emerald-200">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </span>
        </div>
      )}
    </>
  );

  if (layout === "page") {
    return (
      <BookingDoctorPage
        doctor={doctorInfo}
        hours={doctorHours}
        hoursTag={doctorHoursTag}
      >
        <SectionTitle
          title="Select date"
          description="Pick your preferred appointment date"
        />
        {calendar}
      </BookingDoctorPage>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col gap-3">
      <p className="m-0 shrink-0 text-sm font-medium text-ink-muted">
        Pick your preferred appointment date
      </p>
      {calendar}
    </div>
  );
}

interface BookAppointmentStep4Props {
  consultationMode: "IN_PERSON" | "VIDEO";
  selectedSlot: string;
  slotGroups: ReturnType<typeof groupSlotsByPeriod>;
  showLiveSyncBanner: boolean;
  liveSyncClasses: string;
  liveSyncMode: "live" | "connecting" | "fallback";
  liveSyncLabel: string;
  liveSyncDescription: string;
  clinicVideoCallWindow?: { start: string; end: string } | null;
  selectedDate: Date | undefined;
  appointmentDurationMinutes: number;
  shouldLoadAvailability: boolean;
  showAvailabilityLoader: boolean;
  effectiveSlots: string[];
  consultationBlocked: boolean;
  restrictions: { reason?: string };
  availabilityError: unknown;
  setSelectedSlot: React.Dispatch<React.SetStateAction<string>>;
  selectedSlotLabel: string;
  // Presentation only
  layout: BookingLayout;
  doctorInfo: BookingDoctorInfo | null;
  doctorHours: BookingHoursRow[];
  /** Slots already taken, drawn struck through. Never selectable. */
  bookedSlots: string[];
  /** Patients only: the fee from the existing calculation ("₹600"). */
  feeLabel: string | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  isDateDisabled: (date: Date) => boolean;
}

/** Number of day buttons in the date strip above the slots. */
const DATE_STRIP_DAYS = 6;

function BookAppointmentStep4({
  consultationMode,
  selectedSlot,
  slotGroups,
  showLiveSyncBanner,
  liveSyncClasses,
  liveSyncMode,
  liveSyncLabel,
  liveSyncDescription,
  clinicVideoCallWindow,
  selectedDate,
  appointmentDurationMinutes,
  shouldLoadAvailability,
  showAvailabilityLoader,
  effectiveSlots,
  consultationBlocked,
  restrictions,
  availabilityError,
  setSelectedSlot,
  selectedSlotLabel,
  layout,
  doctorInfo,
  doctorHours,
  bookedSlots,
  feeLabel,
  setSelectedDate,
  isDateDisabled,
}: BookAppointmentStep4Props) {
  const hasAvailabilityError = Boolean(availabilityError);
  const periods = buildSlotPeriods(
    slotGroups,
    bookedSlots,
    appointmentDurationMinutes,
  );
  // Same order of checks as before: nothing chosen yet, loading, no slots, slots.
  const status = !shouldLoadAvailability
    ? "idle"
    : showAvailabilityLoader
      ? "loading"
      : effectiveSlots.length === 0
        ? "empty"
        : "ready";

  // Date strip: six days from today, or from the chosen day when it is further away.
  const todayIST = getTodayIST();
  const lastStripDay = new Date(
    todayIST.getFullYear(),
    todayIST.getMonth(),
    todayIST.getDate() + DATE_STRIP_DAYS - 1,
  );
  const stripStart =
    selectedDate && selectedDate.getTime() > lastStripDay.getTime()
      ? selectedDate
      : todayIST;
  const stripDays = Array.from({ length: DATE_STRIP_DAYS }, (_, index) => {
    const date = new Date(
      stripStart.getFullYear(),
      stripStart.getMonth(),
      stripStart.getDate() + index,
    );
    return { date, disabled: isDateDisabled(date) };
  });

  return (
    <BookingSlotStepView
      layout={layout}
      mode={consultationMode}
      doctor={doctorInfo}
      hours={doctorHours}
      dateStrip={{
        days: stripDays,
        selected: selectedDate,
        monthLabel: format(selectedDate ?? stripStart, "MMMM yyyy"),
        onSelect: (date) => {
          setSelectedDate(date);
          setSelectedSlot("");
        },
      }}
      dateShort={selectedDate ? format(selectedDate, "d MMM") : ""}
      dateLong={selectedDate ? format(selectedDate, "d MMM yyyy") : ""}
      durationMinutes={appointmentDurationMinutes}
      status={status}
      blocked={consultationBlocked}
      blockedReason={restrictions.reason}
      errorMessage={
        hasAvailabilityError
          ? (availabilityError as any).message || "Unknown error"
          : undefined
      }
      videoWindow={clinicVideoCallWindow}
      periods={periods}
      selectedSlot={selectedSlot}
      selectedSlotChip={selectedSlotLabel}
      onSelectSlot={(slot) => {
        setSelectedSlot(slot);
      }}
      onClearSlot={() => setSelectedSlot("")}
      liveSync={
        showLiveSyncBanner
          ? {
              mode: liveSyncMode,
              label: liveSyncLabel,
              description: liveSyncDescription,
              className: liveSyncClasses,
            }
          : null
      }
      feeLabel={feeLabel}
    />
  );
}

interface BookAppointmentStep5Props {
  userRole: string;
  selectedPatient: { displayName: string } | null;
  selectedService: { label?: string; category?: string } | null;
  selectedDoctor: { name?: string; specialization?: string } | null;
  selectedDate: Date | undefined;
  selectedSlot: string;
  appointmentDurationMinutes: number;
  consultationMode: "IN_PERSON" | "VIDEO";
  shouldCollectVideoPayment: boolean;
  videoPaymentAmount: number;
  acceptedVideoPaymentPolicy: boolean;
  setAcceptedVideoPaymentPolicy: React.Dispatch<React.SetStateAction<boolean>>;
  bookedAppointmentId: string;
  requiresVideoPayment: boolean;
  videoPaymentCompleted: boolean;
  activeClinicId: string;
  setRequiresVideoPayment: React.Dispatch<React.SetStateAction<boolean>>;
  setVideoPaymentCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  needsSubscriptionPlan: boolean;
  isSubscriptionGateLoading: boolean;
  chiefComplaint: string;
  setChiefComplaint: React.Dispatch<React.SetStateAction<string>>;
  urgency: string;
  setUrgency: React.Dispatch<React.SetStateAction<string>>;
  // Presentation only
  layout: BookingLayout;
  doctorInfo: BookingDoctorInfo | null;
  /** Patient layout: the signed-in person's name. */
  bookingForName: string;
  /** Patients, video: choose the patient or a family member. */
  visitFor?: BookingVisitForProps | undefined;
  /** The chosen family member ("Sunita Sharma (Mother)"); empty when the visit is for the patient. */
  visitForName: string;
  locationName: string;
  /** The amber book / pay button, also shown in the footer on small screens. */
  confirmAction: React.ReactNode;
}

function BookAppointmentStep5({
  userRole,
  selectedPatient,
  selectedService,
  selectedDoctor,
  selectedDate,
  selectedSlot,
  appointmentDurationMinutes,
  consultationMode,
  shouldCollectVideoPayment,
  videoPaymentAmount,
  acceptedVideoPaymentPolicy,
  setAcceptedVideoPaymentPolicy,
  bookedAppointmentId,
  requiresVideoPayment,
  videoPaymentCompleted,
  activeClinicId,
  setRequiresVideoPayment,
  setVideoPaymentCompleted,
  needsSubscriptionPlan,
  isSubscriptionGateLoading,
  chiefComplaint,
  setChiefComplaint,
  urgency,
  setUrgency,
  layout,
  doctorInfo,
  bookingForName,
  visitFor,
  visitForName,
  locationName,
  confirmAction,
}: BookAppointmentStep5Props) {
  const isPageLayout = layout === "page";
  // The existing gateway button: same props and callbacks, only the look changed.
  const payButton =
    bookedAppointmentId && requiresVideoPayment && !videoPaymentCompleted ? (
      <PaymentButton
        appointmentId={bookedAppointmentId}
        appointmentType="VIDEO_CALL"
        clinicId={activeClinicId}
        amount={videoPaymentAmount}
        description={selectedService?.label || "Video consultation"}
        className="h-[50px] w-full rounded-[14px] text-[15px]"
        disabled={!acceptedVideoPaymentPolicy}
        autoStart={acceptedVideoPaymentPolicy}
        onSuccess={() => {
          setRequiresVideoPayment(false);
          setVideoPaymentCompleted(true);
          setAcceptedVideoPaymentPolicy(false);
        }}
      >
        {acceptedVideoPaymentPolicy ? "Pay now" : "Accept policy to pay"}
      </PaymentButton>
    ) : null;

  const doctorName = selectedDoctor?.name
    ? formatDoctorDisplayName(selectedDoctor.name)
    : undefined;
  const reviewDoctor: BookingDoctorInfo | null = isPageLayout
    ? doctorInfo
    : doctorName
      ? {
          name: doctorName,
          subtitle: selectedDoctor?.specialization || "General Physician",
        }
      : null;
  const isPatientInPerson =
    userRole === "PATIENT" && consultationMode === "IN_PERSON";

  return (
    <BookingReviewStepView
      layout={layout}
      mode={consultationMode}
      doctor={reviewDoctor}
      serviceLabel={selectedService?.label}
      serviceCategory={selectedService?.category}
      patientName={
        userRole === "RECEPTIONIST"
          ? selectedPatient?.displayName || "Select patient"
          : selectedPatient?.displayName
      }
      forPerson={
        isPageLayout && bookingForName
          ? { name: bookingForName, relation: "You" }
          : undefined
      }
      visitFor={isPageLayout ? visitFor : undefined}
      visitForName={
        isPageLayout && visitFor ? visitForName || bookingForName || undefined : undefined
      }
      dateLabel={
        selectedDate
          ? format(selectedDate, isPageLayout ? "EEE, d MMM yyyy" : "EEEE, d MMMM yyyy")
          : ""
      }
      timeLabel={isPageLayout ? formatSlotLabel(selectedSlot, "12h") : selectedSlot}
      durationMinutes={appointmentDurationMinutes}
      locationName={locationName || undefined}
      chiefComplaint={chiefComplaint}
      onChiefComplaintChange={setChiefComplaint}
      urgency={urgency}
      onUrgencyChange={setUrgency}
      payment={
        consultationMode === "VIDEO" && shouldCollectVideoPayment
          ? {
              amountLabel: formatRupees(videoPaymentAmount),
              accepted: acceptedVideoPaymentPolicy,
              onAcceptedChange: setAcceptedVideoPaymentPolicy,
              payButton,
            }
          : undefined
      }
      plan={
        isPatientInPerson
          ? {
              loading: isSubscriptionGateLoading,
              required: needsSubscriptionPlan,
            }
          : undefined
      }
      confirmAction={isPageLayout ? confirmAction : undefined}
    />
  );
}

interface BookAppointmentStep6Props {
  consultationMode: "IN_PERSON" | "VIDEO";
  requiresVideoPayment: boolean;
  videoPaymentCompleted: boolean;
  selectedSlot: string;
  clinicVideoCallWindow?: { start: string; end: string } | null;
  selectedService: { label?: string } | null;
  selectedDoctor: { name?: string } | null;
  selectedDate: Date | undefined;
  isPatientInPersonFlow: boolean;
  handleOpenChange: (open: boolean) => void;
  pathname: string;
  push: (url: string) => void;
  patientCheckInRoute: string;
  postBookingRoute: string;
  postBookingLabel: string;
  paymentExpiresAt?: string | null;
  paymentWindowMinutes?: number | null;
  // Presentation only
  layout: BookingLayout;
  doctorInfo: BookingDoctorInfo | null;
  bookedAppointmentId: string;
  /** Who the visit is for (shown on the card). */
  patientName: string;
  appointmentDurationMinutes: number;
  /** Patients only, after an online payment ("₹600"). */
  paidAmountLabel: string | null;
  locationName: string;
  locationAddress: string;
  /** Patients get "Go to Home"; staff get "Done". */
  isPatientUser: boolean;
}

const PATIENT_HOME_ROUTE = "/patient/dashboard";
const PATIENT_PAYMENTS_ROUTE = "/patient/payments";

function BookAppointmentStep6({
  consultationMode,
  requiresVideoPayment,
  videoPaymentCompleted,
  selectedSlot,
  clinicVideoCallWindow,
  selectedService,
  selectedDoctor,
  selectedDate,
  isPatientInPersonFlow,
  handleOpenChange,
  pathname,
  push,
  patientCheckInRoute,
  postBookingRoute,
  postBookingLabel,
  paymentExpiresAt,
  paymentWindowMinutes,
  layout,
  doctorInfo,
  bookedAppointmentId,
  patientName,
  appointmentDurationMinutes,
  paidAmountLabel,
  locationName,
  locationAddress,
  isPatientUser,
}: BookAppointmentStep6Props) {
  const isVideoMode = consultationMode === "VIDEO";
  const paymentPending = isVideoMode && requiresVideoPayment && !videoPaymentCompleted;
  const paid = isVideoMode && videoPaymentCompleted && Boolean(paidAmountLabel);
  const doctorName = selectedDoctor?.name
    ? formatDoctorDisplayName(selectedDoctor.name)
    : "doctor";
  const slotLabel = selectedSlot
    ? formatSlotLabel(selectedSlot, layout === "page" ? "12h" : "24h")
    : "None";
  const bookingRef = shortBookingRef(bookedAppointmentId);
  const when = `${selectedDate ? format(selectedDate, "EEE, d MMM") : ""} · ${slotLabel}`;

  const details: BookingDetail[] = isVideoMode
    ? [
        { label: "Date & time", value: when },
        ...(patientName ? [{ label: "Patient", value: patientName }] : []),
        ...(bookingRef ? [{ label: "Booking ID", value: bookingRef }] : []),
        paid && paidAmountLabel
          ? { label: "Amount paid", value: paidAmountLabel, tone: "brand" as const }
          : {
              label: "Video hours",
              value: clinicVideoCallWindow
                ? `${clinicVideoCallWindow.start} - ${clinicVideoCallWindow.end}`
                : "Set by the clinic",
            },
      ]
    : [
        { label: "When", value: when },
        ...(locationName ? [{ label: "Where", value: locationName }] : []),
        { label: "Service", value: selectedService?.label || "Appointment" },
      ];

  const closeAndGo = (route: string) => {
    handleOpenChange(false);
    if (pathname !== route) {
      push(route);
    }
  };

  return (
    <BookingSuccessStepView
      mode={consultationMode}
      paymentPending={paymentPending}
      paid={paid}
      doctor={
        doctorInfo ??
        (selectedDoctor?.name ? { name: doctorName } : null)
      }
      subtitle={
        isVideoMode
          ? "Video Consultation"
          : `In-clinic${bookingRef ? ` · Booking ${bookingRef}` : ""}`
      }
      details={details}
      cardAction={
        paid && isPatientUser ? (
          <Button variant="soft" size="lg" asChild>
            <Link href={PATIENT_PAYMENTS_ROUTE} prefetch={false}>
              View payments
            </Link>
          </Button>
        ) : undefined
      }
      countdown={
        paymentPending && paymentExpiresAt ? (
          <PaymentCountdown
            paymentExpiresAt={paymentExpiresAt}
            paymentWindowMinutes={paymentWindowMinutes}
            className="mt-2 w-full"
            showCompletePaymentCta={false}
          />
        ) : undefined
      }
      onAddToCalendar={
        isVideoMode && selectedDate && selectedSlot
          ? () => {
              const saved = downloadBookingCalendarFile({
                day: format(selectedDate, "yyyy-MM-dd"),
                slot: selectedSlot,
                durationMinutes: appointmentDurationMinutes,
                title: `Video visit with ${doctorName}`,
                description: "TestByDoctor video appointment",
                uid: bookedAppointmentId,
              });
              if (!saved) {
                showErrorToast("Could not create the calendar file.");
              }
            }
          : undefined
      }
      directionsHref={
        !isVideoMode && locationAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress)}`
          : undefined
      }
      checkInAction={
        !isVideoMode && isPatientInPersonFlow
          ? {
              label: "Open Check-in Page",
              onClick: () => closeAndGo(patientCheckInRoute),
            }
          : undefined
      }
      primaryAction={
        isVideoMode
          ? isPatientUser
            ? { label: "Go to Home", onClick: () => closeAndGo(PATIENT_HOME_ROUTE) }
            : { label: "Done", onClick: () => handleOpenChange(false) }
          : {
              label: isPatientInPersonFlow
                ? "View Check-in Status"
                : postBookingLabel,
              onClick: () => closeAndGo(postBookingRoute),
            }
      }
    />
  );
}

// Component

/**
 * Helper to get Today in IST (India Standard Time)
 * Ensures frontend and backend agree on what 'Today' is, regardless of browser timezone.
 */
const getTodayIST = () => {
  const now = new Date();
  const [year, month, day] = formatISODateInIST(now)
    .split("-")
    .map(Number);
  return new Date(
    year ?? now.getFullYear(),
    (month ?? 1) - 1,
    day ?? now.getDate(),
  );
};

/** Next open calendar day on/after `fromDate` using schedule checker (max 21 days). */
const getNextBookableDateIST = (
  isUnavailable: (date: Date) => boolean,
  fromDate: Date = getTodayIST(),
) => {
  const next = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  for (let i = 0; i < 21; i += 1) {
    if (!isUnavailable(next)) {
      return new Date(next.getFullYear(), next.getMonth(), next.getDate());
    }
    next.setDate(next.getDate() + 1);
  }
  return new Date(next.getFullYear(), next.getMonth(), next.getDate());
};

const formatDateIST = (date: Date) => formatISODateInIST(date);

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const hasOpenSessionWindows = (dayWindows: unknown): boolean => {
  if (Array.isArray(dayWindows)) {
    return dayWindows.some((window) => {
      if (!window || typeof window !== "object" || Array.isArray(window)) {
        return false;
      }
      const record = window as Record<string, unknown>;
      const start = typeof record.start === "string" ? record.start.trim() : "";
      const end = typeof record.end === "string" ? record.end.trim() : "";
      return !!start && !!end && start < end;
    });
  }

  if (dayWindows && typeof dayWindows === "object") {
    const record = dayWindows as Record<string, unknown>;
    const start = typeof record.start === "string" ? record.start.trim() : "";
    const end = typeof record.end === "string" ? record.end.trim() : "";
    return !!start && !!end && start < end;
  }

  return false;
};

const isSubscriptionCurrent = (
  subscription?: {
    status?: string;
    endDate?: string;
    nextBillingDate?: string;
    currentPeriodEnd?: string;
  } | null,
) => {
  if (!subscription) return false;

  const normalizedStatus = subscription.status?.toUpperCase();
  if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "TRIALING") {
    return false;
  }

  // Use nextBillingDate / currentPeriodEnd as primary indicators of ongoing mathematical validity
  const effectiveEnd =
    subscription.nextBillingDate ||
    subscription.currentPeriodEnd ||
    subscription.endDate;
  if (!effectiveEnd) {
    return true;
  }

  const endDate = new Date(effectiveEnd);
  return Number.isFinite(endDate.getTime()) && endDate.getTime() >= Date.now();
};

const normalizePatientGender = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "MALE" ||
    normalized === "FEMALE" ||
    normalized === "OTHER"
  ) {
    return normalized as "MALE" | "FEMALE" | "OTHER";
  }
  return undefined;
};

const createTemporaryPatientPassword = (phone: string) => {
  const digits = phone.replace(/\D/g, "").slice(-6) || "123456";
  return `Pt@${digits}`;
};

const AVAILABILITY_TIMEOUT_MS = 15000;
const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error(timeoutMessage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

export function BookAppointmentDialog({
  trigger,
  clinicId,
  locationId,
  clinicName,
  defaultOpen = false,
  open,
  onOpenChange,
  hideTrigger = false,
  onBooked,
  initialConsultationMode,
  initialServiceId,
  initialDoctorId,
  initialPatientId,
  initialFamilyMemberId,
  videoOnly = true,
}: BookAppointmentDialogProps) {
  const { push, replace } = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isConnected, connectionStatus, subscribe } = useWebSocketContext();
  const { session } = useAuth();
  const { hasPermission } = useRBAC();
  const userRole = (session?.user?.role || "").toUpperCase();

  const profileCompletionRedirectUrl = `${ROUTES.PROFILE_COMPLETION}?redirect=${encodeURIComponent(pathname || "/patient/appointments")}`;

  const postBookingRoute =
    userRole === "RECEPTIONIST"
      ? "/receptionist/appointments"
      : "/patient/appointments";
  const postBookingLabel =
    userRole === "RECEPTIONIST"
      ? "Go to appointment manager"
      : "Go to appointments";
  const patientCheckInRoute = "/patient/check-in";
  const { clinicId: contextClinicId } = useClinicContext();
  const currentClinicId = useCurrentClinicId();
  const clinicFallbackId = APP_CONFIG.CLINIC.ID?.trim() || "";
  const sessionClinicId = session?.user?.clinicId || "";
  const safeContextClinicId = contextClinicId || "";
  const { data: myClinic } = useMyClinic();
  const { data: currentClinic } = useCurrentClinic();
  const myClinicId = myClinic?.id?.trim() || "";

  const authClinicId =
    clinicId ||
    sessionClinicId ||
    safeContextClinicId ||
    currentClinicId ||
    myClinicId ||
    clinicFallbackId;  // Always allow fallback to default clinic for all roles
  const resolvedClinicId = authClinicId;
  const hasExplicitClinicId = !!resolvedClinicId;
  const activeClinicId =
    resolvedClinicId || clinicFallbackId;  // Always allow fallback for all roles

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log('[BookAppointmentDialog] ClinicId resolution:', {
      propsClinicId: clinicId,
      sessionClinicId,
      safeContextClinicId,
      currentClinicId,
      myClinicId,
      clinicFallbackId,
      authClinicId,
      resolvedClinicId,
      activeClinicId
    });
  }

  type BookingFlowState = {
    step: number;
    serviceFilter: string;
    stepDirection: "forward" | "backward";
    selectedLocationId: string;
    consultationMode: "IN_PERSON" | "VIDEO";
    selectedServiceId: string;
    selectedDoctorId: string;
    selectedDate: Date | undefined;
    selectedSlot: string;
    chiefComplaint: string;
    urgency: string;
    bookedAppointmentId: string;
    requiresVideoPayment: boolean;
    videoPaymentCompleted: boolean;
    acceptedVideoPaymentPolicy: boolean;
    selectedPatientId: string;
    patientSearch: string;
    showQuickCreatePatient: boolean;
    showQuickCreateAdditionalDetails: boolean;
    recentlyCreatedPatient: {
      id: string;
      displayName: string;
      phone?: string;
      email?: string;
    } | null;
  };

  type BookingFlowAction =
    | { type: "setStep"; value: SetStateAction<number> }
    | { type: "setServiceFilter"; value: SetStateAction<string> }
    | {
        type: "setStepDirection";
        value: SetStateAction<"forward" | "backward">;
      }
    | { type: "setSelectedLocationId"; value: SetStateAction<string> }
    | {
        type: "setConsultationMode";
        value: SetStateAction<"IN_PERSON" | "VIDEO">;
      }
    | { type: "setSelectedServiceId"; value: SetStateAction<string> }
    | { type: "setSelectedDoctorId"; value: SetStateAction<string> }
    | { type: "setSelectedDate"; value: SetStateAction<Date | undefined> }
    | { type: "setSelectedSlot"; value: SetStateAction<string> }
    | { type: "setChiefComplaint"; value: SetStateAction<string> }
    | { type: "setUrgency"; value: SetStateAction<string> }
    | { type: "setBookedAppointmentId"; value: SetStateAction<string> }
    | { type: "setRequiresVideoPayment"; value: SetStateAction<boolean> }
    | { type: "setVideoPaymentCompleted"; value: SetStateAction<boolean> }
    | { type: "setAcceptedVideoPaymentPolicy"; value: SetStateAction<boolean> }
    | { type: "setSelectedPatientId"; value: SetStateAction<string> }
    | { type: "setPatientSearch"; value: SetStateAction<string> }
    | { type: "setShowQuickCreatePatient"; value: SetStateAction<boolean> }
    | {
        type: "setShowQuickCreateAdditionalDetails";
        value: SetStateAction<boolean>;
      }
    | {
        type: "setRecentlyCreatedPatient";
        value: SetStateAction<BookingFlowState["recentlyCreatedPatient"]>;
      }
    | { type: "resetBookingFlow"; payload: BookingFlowState };

  const createBookingFlowState = useCallback(
    (): BookingFlowState => ({
      step: 1,
      serviceFilter: "All",
      stepDirection: "forward",
      selectedLocationId: locationId || "",
      consultationMode: "VIDEO", // Always VIDEO - in-person appointments disabled
      selectedServiceId: initialServiceId || (videoOnly ? VIDEO_CONSULTATION_TREATMENT_TYPE : ""),
      selectedDoctorId: initialDoctorId || "",
      selectedDate: getTodayIST(),
      selectedSlot: "",
      chiefComplaint: "",
      urgency: "Normal",
      bookedAppointmentId: "",
      requiresVideoPayment: false,
      videoPaymentCompleted: false,
      acceptedVideoPaymentPolicy: false,
      selectedPatientId: initialPatientId || "",
      patientSearch: "",
      showQuickCreatePatient: false,
      showQuickCreateAdditionalDetails: false,
      recentlyCreatedPatient: null,
    }),
    [
      initialConsultationMode,
      initialDoctorId,
      initialPatientId,
      initialServiceId,
      locationId,
      videoOnly,
    ],
  );
  const bookingFlowReducer = useCallback(
    (state: BookingFlowState, action: BookingFlowAction): BookingFlowState => {
      const resolve = <T,>(value: SetStateAction<T>, current: T) =>
        typeof value === "function"
          ? (value as (previous: T) => T)(current)
          : value;

      switch (action.type) {
        case "setStep":
          return { ...state, step: resolve(action.value, state.step) };
        case "setServiceFilter":
          return {
            ...state,
            serviceFilter: resolve(action.value, state.serviceFilter),
          };
        case "setStepDirection":
          return {
            ...state,
            stepDirection: resolve(action.value, state.stepDirection),
          };
        case "setSelectedLocationId":
          return {
            ...state,
            selectedLocationId: resolve(action.value, state.selectedLocationId),
          };
        case "setConsultationMode":
          return {
            ...state,
            consultationMode: resolve(action.value, state.consultationMode),
          };
        case "setSelectedServiceId":
          return {
            ...state,
            selectedServiceId: resolve(action.value, state.selectedServiceId),
          };
        case "setSelectedDoctorId":
          return {
            ...state,
            selectedDoctorId: resolve(action.value, state.selectedDoctorId),
          };
        case "setSelectedDate":
          return {
            ...state,
            selectedDate: resolve(action.value, state.selectedDate),
          };
        case "setSelectedSlot":
          return {
            ...state,
            selectedSlot: resolve(action.value, state.selectedSlot),
          };
        case "setChiefComplaint":
          return {
            ...state,
            chiefComplaint: resolve(action.value, state.chiefComplaint),
          };
        case "setUrgency":
          return { ...state, urgency: resolve(action.value, state.urgency) };
        case "setBookedAppointmentId":
          return {
            ...state,
            bookedAppointmentId: resolve(
              action.value,
              state.bookedAppointmentId,
            ),
          };
        case "setRequiresVideoPayment":
          return {
            ...state,
            requiresVideoPayment: resolve(
              action.value,
              state.requiresVideoPayment,
            ),
          };
        case "setVideoPaymentCompleted":
          return {
            ...state,
            videoPaymentCompleted: resolve(
              action.value,
              state.videoPaymentCompleted,
            ),
          };
        case "setAcceptedVideoPaymentPolicy":
          return {
            ...state,
            acceptedVideoPaymentPolicy: resolve(
              action.value,
              state.acceptedVideoPaymentPolicy,
            ),
          };
        case "setSelectedPatientId":
          return {
            ...state,
            selectedPatientId: resolve(action.value, state.selectedPatientId),
          };
        case "setPatientSearch":
          return {
            ...state,
            patientSearch: resolve(action.value, state.patientSearch),
          };
        case "setShowQuickCreatePatient":
          return {
            ...state,
            showQuickCreatePatient: resolve(
              action.value,
              state.showQuickCreatePatient,
            ),
          };
        case "setShowQuickCreateAdditionalDetails":
          return {
            ...state,
            showQuickCreateAdditionalDetails: resolve(
              action.value,
              state.showQuickCreateAdditionalDetails,
            ),
          };
        case "setRecentlyCreatedPatient":
          return {
            ...state,
            recentlyCreatedPatient: resolve(
              action.value,
              state.recentlyCreatedPatient,
            ),
          };
        case "resetBookingFlow":
          return action.payload;
        default:
          return state;
      }
    },
    [],
  );
  const [internalOpen, setInternalOpen] = useState(() => defaultOpen);
  const [bookedPaymentExpiresAt, setBookedPaymentExpiresAt] = useState<string | null>(null);
  const [bookedPaymentWindowMinutes, setBookedPaymentWindowMinutes] = useState<number | null>(null);
  const isControlledOpen = typeof open === "boolean";
  const dialogOpen = isControlledOpen ? open : internalOpen;
  const [bookingFlow, dispatchBookingFlow] = useReducer(
    bookingFlowReducer,
    undefined,
    createBookingFlowState,
  );
  const {
    step,
    serviceFilter,
    stepDirection,
    selectedLocationId,
    consultationMode,
    selectedServiceId,
    selectedDoctorId,
    selectedDate,
    selectedSlot,
    chiefComplaint,
    urgency,
    bookedAppointmentId,
    requiresVideoPayment,
    videoPaymentCompleted,
    acceptedVideoPaymentPolicy,
    selectedPatientId,
    patientSearch,
    showQuickCreatePatient,
    showQuickCreateAdditionalDetails,
    recentlyCreatedPatient,
  } = bookingFlow;
  const setStep = useCallback((value: SetStateAction<number>) => {
    dispatchBookingFlow({ type: "setStep", value });
  }, []);
  const setServiceFilter = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setServiceFilter", value });
  }, []);
  const setStepDirection = useCallback(
    (value: SetStateAction<"forward" | "backward">) => {
      dispatchBookingFlow({ type: "setStepDirection", value });
    },
    [],
  );
  const setSelectedLocationId = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setSelectedLocationId", value });
  }, []);
  const setConsultationMode = useCallback(
    (value: SetStateAction<"IN_PERSON" | "VIDEO">) => {
      dispatchBookingFlow({ type: "setConsultationMode", value });
    },
    [],
  );
  const setSelectedServiceId = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setSelectedServiceId", value });
  }, []);
  const setSelectedDoctorId = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setSelectedDoctorId", value });
  }, []);
  const setSelectedDate = useCallback(
    (value: SetStateAction<Date | undefined>) => {
      dispatchBookingFlow({ type: "setSelectedDate", value });
    },
    [],
  );
  const setSelectedSlot = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setSelectedSlot", value });
  }, []);
  const setChiefComplaint = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setChiefComplaint", value });
  }, []);
  const setUrgency = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setUrgency", value });
  }, []);
  const setBookedAppointmentId = useCallback(
    (value: SetStateAction<string>) => {
      dispatchBookingFlow({ type: "setBookedAppointmentId", value });
    },
    [],
  );
  const setRequiresVideoPayment = useCallback(
    (value: SetStateAction<boolean>) => {
      dispatchBookingFlow({ type: "setRequiresVideoPayment", value });
    },
    [],
  );
  const setVideoPaymentCompleted = useCallback(
    (value: SetStateAction<boolean>) => {
      dispatchBookingFlow({ type: "setVideoPaymentCompleted", value });
    },
    [],
  );
  const setAcceptedVideoPaymentPolicy = useCallback(
    (value: SetStateAction<boolean>) => {
      dispatchBookingFlow({ type: "setAcceptedVideoPaymentPolicy", value });
    },
    [],
  );
  const setSelectedPatientId = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setSelectedPatientId", value });
  }, []);
  const setPatientSearch = useCallback((value: SetStateAction<string>) => {
    dispatchBookingFlow({ type: "setPatientSearch", value });
  }, []);
  const setShowQuickCreatePatient = useCallback(
    (value: SetStateAction<boolean>) => {
      dispatchBookingFlow({ type: "setShowQuickCreatePatient", value });
    },
    [],
  );
  const setShowQuickCreateAdditionalDetails = useCallback(
    (value: SetStateAction<boolean>) => {
      dispatchBookingFlow({
        type: "setShowQuickCreateAdditionalDetails",
        value,
      });
    },
    [],
  );
  const setRecentlyCreatedPatient = useCallback(
    (value: SetStateAction<BookingFlowState["recentlyCreatedPatient"]>) => {
      dispatchBookingFlow({ type: "setRecentlyCreatedPatient", value });
    },
    [],
  );
  // Selections
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
  });
  // "Who is this visit for?" (patients only): "" = the patient, otherwise a family member's id.
  const [visitForMemberId, setVisitForMemberId] = useState(
    initialFamilyMemberId || "",
  );
  // Follow the prop when the page opens the dialog for another family member.
  const [seenInitialFamilyMemberId, setSeenInitialFamilyMemberId] = useState(
    initialFamilyMemberId,
  );
  if (seenInitialFamilyMemberId !== initialFamilyMemberId) {
    setSeenInitialFamilyMemberId(initialFamilyMemberId);
    setVisitForMemberId(initialFamilyMemberId || "");
  }
  const resetBookingFlowState = useCallback(() => {
    dispatchBookingFlow({
      type: "resetBookingFlow",
      payload: createBookingFlowState(),
    });
    setVisitForMemberId(initialFamilyMemberId || "");
    setNewPatient({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalHistory: "",
      allergies: "",
      currentMedications: "",
    });
    setBookedPaymentExpiresAt(null);
    setBookedPaymentWindowMinutes(null);
  }, [createBookingFlowState, initialFamilyMemberId]);
  const isPrivilegedScheduler = [
    "RECEPTIONIST",
    "DOCTOR",
    "CLINIC_ADMIN",
    "SUPER_ADMIN",
  ].includes(userRole);
  const targetPatientId = isPrivilegedScheduler
    ? selectedPatientId
    : session?.user?.id || "";
  const isPatientClinicStillResolving =
    userRole === "PATIENT" && !resolvedClinicId;
  const shouldLoadLocations =
    dialogOpen &&
    consultationMode !== "VIDEO" &&
    !isPatientClinicStillResolving;
  const shouldLoadServices = dialogOpen;
  const shouldLoadPatients =
    dialogOpen && isPrivilegedScheduler && !!activeClinicId;
  // Family members of the signed-in patient. Optional: when the list is empty or cannot be read
  // the visit is for the patient, and booking carries on as before.
  // `familyMemberId` is part of the appointment create DTO used by the video flow only; the
  // patient in-clinic flow books through the subscription endpoint, which has no such field.
  const isPatientBooker = userRole === "PATIENT";
  const canChooseFamilyMember = isPatientBooker && consultationMode === "VIDEO";
  const familyClinicId = sessionClinicId || currentClinicId || "";
  const {
    data: myFamilyMembers,
    isFetching: familyMembersFetching,
    error: familyMembersError,
  } = useMyFamilyMembers(familyClinicId, {
    enabled: dialogOpen && canChooseFamilyMember,
  });
  const familyMemberOptions = useMemo(
    () =>
      canChooseFamilyMember && Array.isArray(myFamilyMembers)
        ? myFamilyMembers.filter((member) => member.isActive !== false)
        : [],
    [canChooseFamilyMember, myFamilyMembers],
  );
  const familyMembersLoading =
    canChooseFamilyMember && familyMembersFetching && myFamilyMembers === undefined;
  const visitForMember =
    familyMemberOptions.find((member) => member.id === visitForMemberId) ?? null;
  const visitForFamilyMemberId = visitForMember?.id || "";
  const quickRegisterPatientMutation = useQuickRegisterPatient();
  const resolveAppointmentId = useCallback((appointment: unknown) => {
    if (!appointment || typeof appointment !== "object") {
      return "";
    }

    const record = appointment as Record<string, unknown>;
    return String(record.appointmentId || record.id || "");
  }, []);

  // Queries
  const {
    data: activeLocations = [],
    isPending: locationsLoading,
    isFetching: locationsFetching,
    isFetched: activeLocationsFetched,
    error: activeLocationsError,
  } = useActiveLocations(activeClinicId, {
    // Explicitly gate on dialog-open. Passing `undefined` when closed
    // would default to `enabled: true`, which is what triggered the
    // revalidation storm on the appointments page.
    enabled: shouldLoadLocations,
  });
  const {
    data: allLocations = [],
    isPending: allLocationsLoading,
    isFetched: allLocationsFetched,
    error: allLocationsError,
  } = useClinicLocations(activeClinicId, {
    includeInactive: true,
    // Gate the "all locations" fetch behind the same dialog-open + non-video
    // condition as `useActiveLocations` above. Without this, the dialog
    // (which is mounted in the appointments page header even when closed)
    // refires a server-action POST on every parent re-render, producing a
    // revalidation storm of `/patient/appointments` POSTs.
    enabled: shouldLoadLocations,
  });
  const { data: appointmentServices = [], isPending: servicesLoading } =
    useAppointmentServices(shouldLoadServices);
  const locations = activeLocations.length > 0 ? activeLocations : allLocations;
  const hasOnlyInactiveLocations =
    activeLocations.length === 0 && allLocations.length > 0;
  const autoSelectedLocationId = useMemo(() => {
    if (
      !dialogOpen ||
      consultationMode === "VIDEO" ||
      selectedLocationId ||
      locations.length !== 1
    ) {
      return "";
    }

    return locations[0]?.id || "";
  }, [dialogOpen, consultationMode, locations, selectedLocationId]);
  const resolvedLocationId = selectedLocationId || autoSelectedLocationId;
  const shouldLoadDoctors = dialogOpen && !!activeClinicId;
  const doctorsFilters = useMemo(
    () =>
      consultationMode === "VIDEO" || !resolvedLocationId
        ? undefined
        : { locationId: resolvedLocationId },
    [consultationMode, resolvedLocationId],
  );
  const {
    data: doctorsData,
    isPending: doctorsLoading,
    isFetching: doctorsFetching,
    isFetched: doctorsFetched,
    error: doctorsError,
    refetch: refetchDoctors,
  } = useDoctors(
    activeClinicId,
    doctorsFilters,
    { enabled: shouldLoadDoctors },
  );
  const [isHardRefreshingDoctors, setIsHardRefreshingDoctors] =
    useState(false);
  const [pendingStepNavigation, setPendingStepNavigation] = useState<
    "forward" | "backward" | null
  >(null);
  const doctorAutoRefreshRef = useRef(false);
  const doctorsRefreshing =
    doctorsLoading || doctorsFetching || isHardRefreshingDoctors;

  useEffect(() => {
    if (!dialogOpen) {
      doctorAutoRefreshRef.current = false;
      return;
    }

    if (doctorsLoading || doctorsFetching || isHardRefreshingDoctors) {
      return;
    }

    if (doctorAutoRefreshRef.current) {
      return;
    }

    if (doctorsFetched && Array.isArray(doctorsData) && doctorsData.length === 0) {
      doctorAutoRefreshRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["doctors", activeClinicId] });
      void refetchDoctors({ cancelRefetch: true });
    }
  }, [activeClinicId, dialogOpen, doctorsData, doctorsFetched, doctorsFetching, doctorsLoading, isHardRefreshingDoctors, queryClient, refetchDoctors]);
  const handleHardRefreshDoctors = useCallback(async () => {
    if (isHardRefreshingDoctors) {
      return;
    }

    setIsHardRefreshingDoctors(true);
    // Hard refresh: clear all relevant React Query caches (doctors,
    // clinicDoctors, doctorAvailability, etc.) so the booking dialog
    // refetches fresh from the backend. Avoids a full page reload that
    // would discard in-flight selections and unsaved input.
    try {
      clinicApiClient.clearRequestCache();
      queryClient.removeQueries({ queryKey: ['doctors'] });
      queryClient.removeQueries({ queryKey: ['clinicDoctors'] });
      queryClient.removeQueries({ queryKey: ['doctorAvailability'] });
      queryClient.removeQueries({ queryKey: ['doctorSchedule'] });
      queryClient.invalidateQueries({ queryKey: ['doctors', activeClinicId] });
      queryClient.invalidateQueries({ queryKey: ['clinicDoctors', activeClinicId] });
      await refetchDoctors({ cancelRefetch: true });
    } catch (err) {
      logger.warn('Hard refresh: cache clear failed', { error: err });
    } finally {
      setIsHardRefreshingDoctors(false);
    }
  }, [activeClinicId, isHardRefreshingDoctors, queryClient, refetchDoctors]);
  // Only RECEPTIONIST needs the full patient list to select a patient.
  // Patients book for themselves calling this admin endpoint as a PATIENT
  // returns 403 Forbidden. Pass an empty clinicId to disable the query.
  const { data: patientsData = [] } = usePatients(
    isPrivilegedScheduler ? activeClinicId : "",
    { limit: 200, isActive: true },
    { enabled: shouldLoadPatients },
  );
  // Only fetch the user profile when the dialog is open. The dialog
  // component is mounted by the appointments page header even when
  // closed, so unconditionally calling `useUserProfile()` here would
  // re-fire a server-action POST every time the parent re-renders.
  // Reading from the cache is fine because the dialog uses the profile
  // only for an authoritative `profileComplete` check on the patient
  // record - the same key is already warmed by `DashboardLayout`.
  const { data: currentPatientProfile } = useUserProfile(
    dialogOpen ? undefined : { enabled: false }
  );
  const authoritativeProfileComplete = useMemo(
    () =>
      resolveAuthoritativeProfileCompleteFromCandidates(
        session?.user as Record<string, unknown> | null | undefined,
        currentPatientProfile as Record<string, unknown> | null | undefined,
      ),
    [currentPatientProfile, session?.user],
  );
  const profileCompletionBlocked = useMemo(
    () =>
      (String(session?.user?.role || '').toUpperCase() === String(Role.PATIENT) &&
        authoritativeProfileComplete !== true) ||
      isProfileCompletionError(activeLocationsError) ||
      isProfileCompletionError(allLocationsError) ||
      isProfileCompletionError(doctorsError),
    [
      activeLocationsError,
      allLocationsError,
      doctorsError,
      authoritativeProfileComplete,
    ],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && profileCompletionBlocked) {
        replace(profileCompletionRedirectUrl);
        return;
      }

      if (onOpenChange) {
        onOpenChange(nextOpen);
      } else {
        setInternalOpen(nextOpen);
      }

      if (!nextOpen) {
        resetBookingFlowState();
      }
    },
    [
      onOpenChange,
      profileCompletionBlocked,
      profileCompletionRedirectUrl,
      replace,
      resetBookingFlowState,
    ],
  );

  const resolvedAppointmentSettings = useMemo(() => {
    const candidates: Array<unknown> = [
      (myClinic?.settings as Record<string, unknown> | undefined)?.appointmentSettings,
      (currentClinic as { settings?: Record<string, unknown> } | null | undefined)
        ?.settings?.appointmentSettings,
      (currentClinic as { appointmentSettings?: unknown } | null | undefined)
        ?.appointmentSettings,
    ];

    for (const candidate of candidates) {
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }

    return null;
  }, [currentClinic, myClinic]);

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log("[BookAppointmentDialog] Schedule settings source:", {
      hasMyClinicSettings: !!myClinic?.settings,
      hasCurrentClinicSettings: !!(currentClinic as { settings?: unknown } | null)
        ?.settings,
      hasOperatingWindows: !!resolvedAppointmentSettings?.operatingWindowsByDay,
      operatingDayKeys: resolvedAppointmentSettings?.operatingWindowsByDay
        ? Object.keys(
            resolvedAppointmentSettings.operatingWindowsByDay as object,
          )
        : [],
    });
  }

  const clinicVideoCallWindow = useMemo(() => {
    const normalizeWindowTime = (value: unknown): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : null;
    };

    if (!resolvedAppointmentSettings) {
      return null;
    }

    const windowValue = resolvedAppointmentSettings.videoCallWindow;
    if (
      !windowValue ||
      typeof windowValue !== "object" ||
      Array.isArray(windowValue)
    ) {
      return null;
    }

    const start = normalizeWindowTime(
      (windowValue as Record<string, unknown>).start,
    );
    const end = normalizeWindowTime(
      (windowValue as Record<string, unknown>).end,
    );
    if (!start || !end) {
      return null;
    }

    return { start, end };
  }, [resolvedAppointmentSettings]);
  const clinicHolidayClosures = useMemo(() => {
    if (!resolvedAppointmentSettings) {
      return new Set<string>();
    }

    const closures = new Set<string>();
    const addDate = (value: unknown) => {
      if (typeof value !== "string") return;
      const trimmed = value.trim();
      if (!trimmed) return;
      // Prefer bare YYYY-MM-DD to avoid Safari/Chrome parse drift.
      const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (isoMatch?.[1]) {
        closures.add(isoMatch[1]);
        return;
      }
      const normalized = formatISODateInIST(new Date(trimmed));
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        closures.add(normalized);
      }
    };

    const rawClosures = resolvedAppointmentSettings.holidayClosures;
    if (Array.isArray(rawClosures)) {
      rawClosures.forEach((entry) => {
        if (typeof entry === "string") {
          addDate(entry);
        } else if (
          entry &&
          typeof entry === "object" &&
          !Array.isArray(entry)
        ) {
          addDate((entry as Record<string, unknown>).date);
        }
      });
    }

    const legacyHolidayDates = resolvedAppointmentSettings.holidayDates;
    if (Array.isArray(legacyHolidayDates)) {
      legacyHolidayDates.forEach(addDate);
    }

    return closures;
  }, [resolvedAppointmentSettings]);
  const clinicOperatingDays = useMemo(() => {
    if (!resolvedAppointmentSettings) {
      return null;
    }

    const operatingWindows = resolvedAppointmentSettings.operatingWindowsByDay;
    if (
      !operatingWindows ||
      typeof operatingWindows !== "object" ||
      Array.isArray(operatingWindows)
    ) {
      return null;
    }

    return operatingWindows as Record<string, unknown>;
  }, [resolvedAppointmentSettings]);
  const isClinicClosedDate = useCallback(
    (date: Date) => {
      const dayKey = WEEKDAY_KEYS[date.getDay()];
      if (!dayKey) {
        return false;
      }

      // Match backend availability: clinic operatingWindowsByDay empty = closed.
      if (clinicOperatingDays) {
        if (!hasOpenSessionWindows(clinicOperatingDays[dayKey])) {
          return true;
        }
      }

      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return (
        clinicHolidayClosures.has(dateKey) ||
        clinicHolidayClosures.has(formatISODateInIST(date))
      );
    },
    [clinicHolidayClosures, clinicOperatingDays],
  );

  const isSlotWithinClinicVideoWindow = useCallback(
    (slot: string) => {
      if (consultationMode !== "VIDEO" || !clinicVideoCallWindow) {
        return true;
      }

      const parseMinutes = (value: string) => {
        const [hoursRaw, minutesRaw] = value.split(":");
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
        return hours * 60 + minutes;
      };

      const slotStart = parseMinutes(slot);
      const windowStart = parseMinutes(clinicVideoCallWindow.start);
      const windowEnd = parseMinutes(clinicVideoCallWindow.end);
      if (slotStart === null || windowStart === null || windowEnd === null) {
        return true;
      }

      return (
        slotStart >= windowStart &&
        slotStart + VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES <= windowEnd
      );
    },
    [clinicVideoCallWindow, consultationMode],
  );

  const { mutateAsync: createAppointment, isPending: isBooking } =
    useCreateAppointment(activeClinicId);
  const {
    mutateAsync: checkSubscriptionCoverage,
    isPending: isCheckingSubscriptionCoverage,
  } = useCheckSubscriptionCoverage();
  const {
    mutateAsync: createSubscriptionAppointment,
    isPending: isCreatingSubscriptionAppointment,
  } = useCreateInPersonAppointmentWithSubscription();
  const isCreatingInPersonAppointment =
    isBooking ||
    isCheckingSubscriptionCoverage ||
    isCreatingSubscriptionAppointment;
  const { mutate: sendReminder } = useSendAppointmentReminder();
  const shouldLoadSubscriptions =
    dialogOpen && !!targetPatientId && consultationMode === "IN_PERSON";
  const { data: subscriptionsData = [] } = useSubscriptions(
    targetPatientId,
    activeClinicId,
    shouldLoadSubscriptions,
  );
  const {
    data: backendActiveSubscription,
    isPending: backendActiveSubscriptionLoading,
  } = useActiveSubscription(
    targetPatientId,
    activeClinicId,
    shouldLoadSubscriptions,
  );

  // Derived
  const modeAppointmentType: AppointmentType =
    consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";
  const visibleServices = useMemo(() => {
    const filteredServices = (
      appointmentServices as AppointmentServiceDefinition[]
    ).filter(
      (service) =>
        service.active &&
        service.appointmentModes.includes(modeAppointmentType),
    );

    if (consultationMode === "VIDEO") {
      return filteredServices.filter(
        (service) =>
          service.treatmentType === VIDEO_CONSULTATION_TREATMENT_TYPE,
      );
    }

    return filteredServices;
  }, [appointmentServices, consultationMode, modeAppointmentType]);

  const selectedService = useMemo(
    () =>
      visibleServices.find(
        (service) => service.treatmentType === selectedServiceId,
      ),
    [selectedServiceId, visibleServices],
  );

  const appointmentDurationMinutes =
    consultationMode === "VIDEO"
      ? VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES
      : selectedService?.defaultDurationMinutes &&
          selectedService.defaultDurationMinutes > 0
        ? selectedService.defaultDurationMinutes
        : IN_PERSON_APPOINTMENT_SLOT_DURATION_MINUTES;
  const isPatientInPersonFlow =
    userRole === "PATIENT" && consultationMode === "IN_PERSON";
  const videoPaymentAmount = Number(selectedService?.videoConsultationFee || 0);
  const shouldCollectVideoPayment =
    consultationMode === "VIDEO" &&
    userRole === "PATIENT" &&
    videoPaymentAmount > 0;

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log('[BookAppointmentDialog] Video payment state:', {
      consultationMode,
      userRole,
      selectedServiceId,
      selectedService: selectedService?.label || 'none',
      videoPaymentAmount,
      shouldCollectVideoPayment,
      visibleServicesCount: visibleServices.length,
      visibleServicesTreatmentTypes: visibleServices.map(s => s.treatmentType),
      allServicesCount: appointmentServices.length,
      allServicesTreatmentTypes: (appointmentServices as AppointmentServiceDefinition[]).map(s => s.treatmentType),
    });
    console.log('[BookAppointmentDialog] Appointment services:', {
      servicesLoading,
      servicesCount: appointmentServices.length,
      services: (appointmentServices as AppointmentServiceDefinition[]).map(s => ({
        treatmentType: s.treatmentType,
        label: s.label,
        active: s.active,
        appointmentModes: s.appointmentModes,
        videoConsultationFee: s.videoConsultationFee,
      }))
    });
  }

  const doctorsList: any[] = useMemo(() => {
    // Backend returns [{ doctor: { id, user: { id, name, email } } }]
    const normalize = (raw: any[]) =>
      raw.map((u: any) => {
        const doctor = u.doctor || u;
        const user = doctor.user || u;
        const resolvedDoctorName = resolveDisplayNameAndInitials({
          firstName: doctor.firstName || user.firstName,
          lastName: doctor.lastName || user.lastName,
          name: user.name || doctor.name,
          email: user.email || doctor.email,
          role: "DOCTOR",
        }).displayName;
        return {
          ...doctor,
          id: doctor.id || u.id,
          userId: user.id || u.userId,
          name: resolvedDoctorName === "User" ? `Doctor` : resolvedDoctorName,
          specialization: doctor.specialization || "",
          image: user.profilePicture || doctor.profilePicture || u.profilePicture || "",
        };
      });

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors))
      return normalize((doctorsData as any).data.doctors);
    if (Array.isArray((doctorsData as any)?.data))
      return normalize((doctorsData as any).data);
    const raw = (doctorsData as any)?.doctors || [];
    return normalize(raw);
  }, [doctorsData]);

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log('[BookAppointmentDialog] doctorsData raw:', {
      type: typeof doctorsData,
      isArray: Array.isArray(doctorsData),
      hasData: !!(doctorsData as any)?.data,
      doctorsCount: Array.isArray(doctorsData) ? doctorsData.length : ((doctorsData as any)?.data ? ((doctorsData as any).data.doctors?.length || (doctorsData as any).data.length || 'unknown') : 'no data'),
      firstFew: Array.isArray(doctorsData) ? doctorsData.slice(0, 2) : ((doctorsData as any)?.data?.doctors?.slice(0, 2) || (doctorsData as any)?.data?.slice(0, 2))
    });
  }

  const doctorsErrorMessage = useMemo(() => {
    if (!doctorsError || doctorsLoading || !doctorsFetched) {
      return "";
    }

    if (isProfileCompletionError(doctorsError)) {
      return "";
    }

    return doctorsError instanceof Error ? doctorsError.message : String(doctorsError);
  }, [doctorsError, doctorsFetched, doctorsLoading]);
  const autoSelectedDoctorId = useMemo(() => {
    if (
      !dialogOpen ||
      selectedDoctorId ||
      doctorsLoading ||
      doctorsList.length !== 1
    ) {
      return "";
    }

    return doctorsList[0]?.id || "";
  }, [dialogOpen, doctorsLoading, doctorsList, selectedDoctorId]);
  const resolvedDoctorId = selectedDoctorId || autoSelectedDoctorId;
  const selectedDoctor = useMemo(
    () => doctorsList.find((d: any) => d.id === resolvedDoctorId),
    [doctorsList, resolvedDoctorId],
  );

  // Mirror backend availability day resolution: doctor workingHours → clinic windows → holidays.
  const isBookingDateDisabled = useCallback(
    (date: Date) => {
      const dayKey = WEEKDAY_KEYS[date.getDay()];
      const workingHours = (selectedDoctor as { workingHours?: unknown } | undefined)
        ?.workingHours;

      if (
        dayKey &&
        workingHours &&
        typeof workingHours === "object" &&
        !Array.isArray(workingHours) &&
        Object.prototype.hasOwnProperty.call(workingHours, dayKey)
      ) {
        if (!hasOpenSessionWindows((workingHours as Record<string, unknown>)[dayKey])) {
          return true;
        }
      }

      return isClinicClosedDate(date);
    },
    [isClinicClosedDate, selectedDoctor],
  );

  useEffect(() => {
    if (!selectedDate) return;
    if (!isBookingDateDisabled(selectedDate)) return;
    setSelectedDate(getNextBookableDateIST(isBookingDateDisabled, selectedDate));
    setSelectedSlot("");
  }, [
    isBookingDateDisabled,
    selectedDate,
    setSelectedDate,
    setSelectedSlot,
  ]);

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log('[BookAppointmentDialog] doctors state:', {
      doctorsListLength: doctorsList.length,
      doctorsLoading,
      doctorsFetched,
      doctorsError: doctorsError instanceof Error ? doctorsError.message : String(doctorsError),
      doctorsErrorMessage,
      shouldLoadDoctors,
      dialogOpen,
      activeClinicId,
      consultationMode,
      resolvedLocationId,
      resolvedDoctorId,
      selectedDoctor: selectedDoctor?.name || 'none'
    });
  }

  const dateString = useMemo(
    () => (selectedDate ? formatDateIST(selectedDate) : ""),
    [selectedDate],
  );
  const appointmentQueryScope =
    session?.session_id?.trim() || session?.user?.id?.trim() || "guest";

  const availabilityQueryKey = useMemo(
    () => [
      "doctorAvailability",
      activeClinicId,
      resolvedDoctorId,
      dateString,
      consultationMode === "VIDEO" ? undefined : resolvedLocationId,
      consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON",
      appointmentQueryScope,
    ],
    [
      activeClinicId,
      resolvedDoctorId,
      dateString,
      resolvedLocationId,
      consultationMode,
      appointmentQueryScope,
    ],
  );

  const shouldLoadAvailability =
    dialogOpen && !!activeClinicId && !!resolvedDoctorId && !!dateString;
  const {
    data: availability,
    isPending: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useDoctorAvailability(
    activeClinicId,
    resolvedDoctorId,
    dateString,
    consultationMode === "VIDEO" ? undefined : resolvedLocationId,
    consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON",
    {
      enabled: shouldLoadAvailability,
    },
  );

  const showAvailabilityLoader =
    shouldLoadAvailability &&
    availabilityLoading &&
    !availability &&
    !availabilityError;

  useEffect(() => {
    if (!dialogOpen || !resolvedDoctorId || !dateString) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: availabilityQueryKey, exact: true });
    void refetchAvailability({ cancelRefetch: true });
  }, [availabilityQueryKey, dateString, dialogOpen, queryClient, refetchAvailability, resolvedDoctorId]);
  const patientsList: any[] = useMemo(() => {
    const rawPatients = Array.isArray(patientsData)
      ? patientsData
      : (patientsData as any)?.patients || [];

    return rawPatients.map((patient: any) => ({
      ...patient,
      displayName:
        patient.name ||
        patient.user?.name ||
        `${patient.firstName || patient.user?.firstName || ""} ${patient.lastName || patient.user?.lastName || ""}`.trim() ||
        patient.email ||
        "Unknown Patient",
      phone: patient.phone || patient.user?.phone || "",
      email: patient.email || patient.user?.email || "",
    }));
  }, [patientsData]);

  const filteredPatientsList = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) {
      return patientsList;
    }

    return patientsList.filter((patient: any) => {
      const name = String(patient.displayName || "").toLowerCase();
      const phone = String(patient.phone || "").toLowerCase();
      const email = String(patient.email || "").toLowerCase();
      return (
        name.includes(query) || phone.includes(query) || email.includes(query)
      );
    });
  }, [patientsList, patientSearch]);

  const selectedPatient = useMemo(
    () =>
      patientsList.find((patient: any) =>
        isSelectedBookingPatient(patient, selectedPatientId),
      ) ||
      (recentlyCreatedPatient?.id === selectedPatientId
        ? recentlyCreatedPatient
        : null),
    [patientsList, selectedPatientId, recentlyCreatedPatient],
  );
  const resolvedBookingPatientId = useMemo(() => {
    if (isPrivilegedScheduler) {
      return selectedPatientId;
    }

    // currentPatientProfile can be:
    // 1. Direct user object with patientId (backend returns flat structure)
    // 2. User object with nested patient.id
    // 3. Wrapped response { data: { patientId, ... } }
    // Try all possible locations for the patient record ID
    const rawProfile = currentPatientProfile as Record<string, unknown> | undefined;
    const patientRecordId =
      // Direct patientId on user (backend returns flat structure)
      (rawProfile as any)?.patientId ||
      // Nested patient.id (some APIs return this way)
      ((rawProfile as any)?.patient as Record<string, unknown>)?.id ||
      // Wrapped in data field
      ((rawProfile as any)?.data as Record<string, unknown>)?.patientId ||
      // User inside data wrapper
      (((rawProfile as any)?.data as Record<string, unknown>)?.patient as Record<string, unknown>)?.id ||
      // Nested inside user field
      ((rawProfile as any)?.user as Record<string, unknown>)?.patientId ||
      (((rawProfile as any)?.user as Record<string, unknown>)?.patient as Record<string, unknown>)?.id;

    if (!patientRecordId) {
      logger.warn(
        "[BookAppointmentDialog] Patient profile not found or missing patient.id",
        {
          hasProfile: !!currentPatientProfile,
          userId: session?.user?.id || 'unknown',
          profileKeys: currentPatientProfile && typeof currentPatientProfile === 'object'
            ? Object.keys(currentPatientProfile as Record<string, unknown>)
            : [],
        },
      );
    }

    return (patientRecordId as string) || "";
  }, [
    currentPatientProfile,
    isPrivilegedScheduler,
    selectedPatientId,
    session?.user?.id,
  ]);

  const activeSubscription = useMemo(() => {
    const candidates = (subscriptionsData as any[])
      .filter(
        (subscription: any) =>
          isSubscriptionCurrent(subscription) &&
          (!subscription.clinicId || subscription.clinicId === activeClinicId),
      )
      .sort((left: any, right: any) => {
        const leftDate = new Date(
          left.updatedAt || left.createdAt || left.startDate || 0,
        ).getTime();
        const rightDate = new Date(
          right.updatedAt || right.createdAt || right.startDate || 0,
        ).getTime();
        return rightDate - leftDate;
      });

    if (isSubscriptionCurrent(backendActiveSubscription)) {
      return backendActiveSubscription;
    }

    return candidates[0];
  }, [subscriptionsData, activeClinicId, backendActiveSubscription]);

  const isPatientInPersonBooking =
    consultationMode === "IN_PERSON" && userRole === "PATIENT";
  const isSubscriptionGateLoading =
    isPatientInPersonBooking && backendActiveSubscriptionLoading;
  const needsSubscriptionPlan =
    isPatientInPersonBooking &&
    !isSubscriptionGateLoading &&
    !activeSubscription;

  const activeSteps = useMemo(() => {
    const hasMultipleDoctors = doctorsLoading || doctorsList.length !== 1;

    return STEP_ORDER.filter((stepId) => {
      // Skip mode selection step when videoOnly mode
      if (stepId === "mode") {
        return !videoOnly;
      }

      if (stepId === "service") {
        return consultationMode !== "VIDEO";
      }

      // Staff choose the patient on the Service step. The video flow skips that step, so it
      // gets its own Patient step. Patients book for themselves and never see it.
      if (stepId === "patient") {
        return isPrivilegedScheduler && consultationMode === "VIDEO";
      }

      if (stepId === "doctor") {
        return hasMultipleDoctors;
      }

      // Patients pick date on the same screen as time (date strip + slots).
      if (stepId === "date") {
        return isPrivilegedScheduler;
      }

      return true;
    });
  }, [
    consultationMode,
    doctorsList.length,
    doctorsLoading,
    isPrivilegedScheduler,
    videoOnly,
  ]);

  const currentStep = Math.max(1, Math.min(step, activeSteps.length || 1));
  const currentStepIndex = currentStep - 1;
  const currentStepId = activeSteps[currentStepIndex] ?? "success";
  const isSuccessStep = currentStepId === "success";
  const goToStep = useCallback(
    (nextStepId: WizardStepId) => {
      const nextIndex = activeSteps.indexOf(nextStepId);
      if (nextIndex === -1) return;
      setStepDirection((previous) =>
        nextIndex >= currentStepIndex ? "forward" : "backward",
      );
      setStep(nextIndex + 1);
    },
    [activeSteps, currentStepIndex, setStep, setStepDirection],
  );

  const stepTitle = useMemo(() => {
    if (currentStepId === "success") {
      return consultationMode === "VIDEO" &&
        requiresVideoPayment &&
        !videoPaymentCompleted
        ? "Complete Payment"
        : "Booking Complete!";
    }

    if (currentStepId === "mode") {
      return consultationMode === "VIDEO"
        ? "Book Video Appointment"
        : "Location & Mode";
    }

    return STEP_LABELS[currentStepId];
  }, [
    consultationMode,
    currentStepId,
    requiresVideoPayment,
    videoPaymentCompleted,
  ]);

  const extractAvailabilitySlots = useCallback((source: unknown) => {
    const normalizeSlotKey = (slot: string): string => {
      const trimmed = slot.trim();
      const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(trimmed);
      if (!match) {
        return trimmed;
      }
      return `${(match[1] || "").padStart(2, "0")}:${match[2] || ""}`;
    };

    const normalizeSlotValue = (slot: unknown): string | null => {
      if (typeof slot === "string") {
        const trimmed = slot.trim();
        return trimmed ? normalizeSlotKey(trimmed) : null;
      }

      if (!slot || typeof slot !== "object") {
        return null;
      }

      const record = slot as Record<string, unknown>;
      const availabilityFlag =
        record.isAvailable ?? record.available ?? record.is_available ?? true;
      if (availabilityFlag === false) {
        return null;
      }

      const candidateValues = [
        record.time,
        record.startTime,
        record.slotTime,
        record.start,
      ];

      for (const candidate of candidateValues) {
        if (typeof candidate !== "string") {
          continue;
        }

        const trimmed = candidate.trim();
        if (trimmed) {
          return normalizeSlotKey(trimmed);
        }
      }

      return null;
    };

    const collectSlots = (value: unknown): string[] => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value
          .map(normalizeSlotValue)
          .filter((slot): slot is string => !!slot);
      }

      if (typeof value !== "object") {
        return [];
      }

      const record = value as {
        availableSlots?: unknown;
        bookedSlots?: unknown;
        slots?: unknown;
        data?: unknown;
      };

      const collected = [
        ...collectSlots(record.availableSlots),
        ...collectSlots(record.slots),
      ];
      const booked = collectSlots(record.bookedSlots);

      if (record.data && typeof record.data === "object") {
        const nested = record.data as {
          availableSlots?: unknown;
          bookedSlots?: unknown;
          slots?: unknown;
          data?: unknown;
        };
        collected.push(...collectSlots(nested.availableSlots));
        collected.push(...collectSlots(nested.slots));
        booked.push(...collectSlots(nested.bookedSlots));
        if (nested.data && typeof nested.data === "object") {
          const nestedDeep = nested.data as {
            availableSlots?: unknown;
            bookedSlots?: unknown;
            slots?: unknown;
          };
          collected.push(...collectSlots(nestedDeep.availableSlots));
          collected.push(...collectSlots(nestedDeep.slots));
          booked.push(...collectSlots(nestedDeep.bookedSlots));
        }
      }

      const bookedSet = new Set(booked);
      return Array.from(
        new Set(collected.filter((slot) => !bookedSet.has(slot))),
      );
    };

    if (Array.isArray(source)) {
      return collectSlots(source);
    }
    if (!source || typeof source !== "object") {
      return [];
    }

    return collectSlots(source);
  }, []);

  const slots = useMemo(
    () => extractAvailabilitySlots(availability),
    [availability, extractAvailabilitySlots],
  );

  const restrictions = useMemo(() => {
    const r =
      (availability as any)?.restrictions ||
      (availability as any)?.data?.restrictions ||
      (availability as any)?.data?.data?.restrictions ||
      {};
    return {
      clinicPaused: !!r.clinicPaused,
      doctorPaused: !!r.doctorPaused,
      emergencyOnly: !!r.emergencyOnly,
      generalConsultationEnabled: r.generalConsultationEnabled !== false,
      videoConsultationEnabled: r.videoConsultationEnabled !== false,
      reason: typeof r.reason === "string" ? r.reason : "",
    };
  }, [availability]);

  const consultationBlocked = useMemo(() => {
    if (restrictions.clinicPaused || restrictions.doctorPaused) return true;
    if (
      consultationMode === "IN_PERSON" &&
      !restrictions.generalConsultationEnabled
    )
      return true;
    if (consultationMode === "VIDEO" && !restrictions.videoConsultationEnabled)
      return true;
    return false;
  }, [consultationMode, restrictions]);

  // Extract videoCallWindow from availability response (authoritative source from backend)
  // The backend already filters slots by videoCallWindow for VIDEO_CALL appointments,
  // so we trust the backend's availableSlots directly.
  const backendVideoCallWindow = useMemo(() => {
    const availabilityData = availability as Record<string, unknown> | undefined;
    if (!availabilityData) return null;

    // Check at root level (backend returns videoCallWindow in response)
    const windowValue = availabilityData.videoCallWindow as
      | { start?: unknown; end?: unknown }
      | undefined;
    if (windowValue && typeof windowValue === "object" && windowValue !== null) {
      const start =
        typeof windowValue.start === "string" ? windowValue.start.trim() : null;
      const end =
        typeof windowValue.end === "string" ? windowValue.end.trim() : null;
      if (start && end && /^([01]\d|2[0-3]):([0-5]\d)$/.test(start) && /^([01]\d|2[0-3]):([0-5]\d)$/.test(end)) {
        return { start, end };
      }
    }

    // Check in nested data.data structure
    const nestedData = availabilityData.data as Record<string, unknown> | undefined;
    if (nestedData) {
      const nestedWindow = nestedData.videoCallWindow as
        | { start?: unknown; end?: unknown }
        | undefined;
      if (nestedWindow && typeof nestedWindow === "object" && nestedWindow !== null) {
        const start =
          typeof nestedWindow.start === "string" ? nestedWindow.start.trim() : null;
        const end =
          typeof nestedWindow.end === "string" ? nestedWindow.end.trim() : null;
        if (
          start &&
          end &&
          /^([01]\d|2[0-3]):([0-5]\d)$/.test(start) &&
          /^([01]\d|2[0-3]):([0-5]\d)$/.test(end)
        ) {
          return { start, end };
        }
      }
    }

    return null;
  }, [availability]);

  // For VIDEO_CALL appointments, trust the backend's filtered availableSlots directly.
  // The backend already filters by videoCallWindow when appointmentType is VIDEO_CALL.
  // Only apply additional filtering if we don't have backend-filtered slots.
  const effectiveSlots = useMemo(() => {
    if (consultationBlocked) {
      return [];
    }

    const baseSlots = slots as string[];

    // For VIDEO_CALL: backend already filtered by videoCallWindow, use slots directly
    // For IN_PERSON or no window: use all slots
    if (consultationMode !== "VIDEO" || !backendVideoCallWindow) {
      return baseSlots;
    }

    // Only apply frontend filtering as a safety measure using the backend's window
    // This handles edge cases where backend might not have filtered
    const parseMinutes = (value: string) => {
      const [hoursRaw, minutesRaw] = value.split(":");
      const hours = Number(hoursRaw);
      const minutes = Number(minutesRaw);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      return hours * 60 + minutes;
    };

    const windowStart = parseMinutes(backendVideoCallWindow.start);
    const windowEnd = parseMinutes(backendVideoCallWindow.end);

    if (windowStart === null || windowEnd === null) {
      return baseSlots;
    }

    return baseSlots.filter((slot) => {
      const slotStart = parseMinutes(slot);
      if (slotStart === null) return true;

      // Slot must start at or after window start
      // Slot end (start + 15 min) must be at or before window end
      const slotEnd = slotStart + VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES;
      return slotStart >= windowStart && slotEnd <= windowEnd;
    });
  }, [
    backendVideoCallWindow,
    consultationBlocked,
    consultationMode,
    slots,
  ]);
  const validateLatestAvailability = useCallback(async (selectedSlot?: string) => {
    const cachedAvailability = queryClient.getQueryData(availabilityQueryKey);
    const cachedSlots = extractAvailabilitySlots(cachedAvailability);
    try {
      const refreshed = await refetchAvailability({ cancelRefetch: true });
      const freshSlots = extractAvailabilitySlots(
        refreshed?.data ?? queryClient.getQueryData(availabilityQueryKey),
      );
      return freshSlots.length > 0 ? freshSlots : cachedSlots;
    } catch (_error) {
      return cachedSlots;
    }
  }, [
    availabilityQueryKey,
    extractAvailabilitySlots,
    queryClient,
    refetchAvailability,
  ]);

  if (APP_CONFIG.ENVIRONMENT === "development") {
    console.log('[BookAppointmentDialog] Availability state:', {
      resolvedDoctorId,
      dateString,
      shouldLoadAvailability,
      consultationMode,
      rawSlots: slots.length,
      effectiveSlots: effectiveSlots.length,
      backendVideoWindow: backendVideoCallWindow,
      clinicVideoWindow: clinicVideoCallWindow,
      availabilityKeys: availability ? Object.keys(availability) : null,
      availabilityAvailableSlots: (availability as any)?.availableSlots,
      availabilityBookedSlots: (availability as any)?.bookedSlots,
      availabilityVideoWindow: (availability as any)?.videoCallWindow,
      availabilityRestrictions: (availability as any)?.restrictions,
      availabilityLoading,
      availabilityError: availabilityError instanceof Error ? availabilityError.message : String(availabilityError)
    });
  }

  useEffect(() => {
    if (!dialogOpen || !isConnected || !resolvedDoctorId || !dateString) {
      return;
    }

    const shouldRefreshAvailability = (rawData: unknown) => {
      const data = rawData as {
        clinicId?: string;
        doctorId?: string;
        appointment?: {
          doctorId?: string;
          locationId?: string;
          date?: string;
          appointmentDate?: string;
        };
        appointmentId?: string;
      };

      if (data.clinicId && data.clinicId !== activeClinicId) {
        return;
      }

      const eventDoctorId = data.doctorId || data.appointment?.doctorId;
      if (eventDoctorId && eventDoctorId !== resolvedDoctorId) {
        return;
      }

      const eventDate =
        data.appointment?.date || data.appointment?.appointmentDate;
      if (eventDate && formatISODateInIST(eventDate) !== dateString) {
        return;
      }

      const eventLocationId = data.appointment?.locationId;
      if (
        consultationMode !== "VIDEO" &&
        resolvedLocationId &&
        eventLocationId &&
        eventLocationId !== resolvedLocationId
      ) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: availabilityQueryKey,
        exact: true,
      });
    };

    const unsubscribeCreated = subscribe(
      "appointment.created",
      shouldRefreshAvailability,
    );
    const unsubscribeUpdated = subscribe(
      "appointment.updated",
      shouldRefreshAvailability,
    );
    const unsubscribeDeleted = subscribe(
      "appointment.deleted",
      shouldRefreshAvailability,
    );
    const unsubscribeConfirmed = subscribe(
      "appointment.confirmed",
      shouldRefreshAvailability,
    );
    const unsubscribeSlotConfirmed = subscribe(
      "appointment.slot.confirmed",
      shouldRefreshAvailability,
    );
    const unsubscribeRescheduled = subscribe(
      "appointment.rescheduled",
      shouldRefreshAvailability,
    );
    const unsubscribeCancelled = subscribe(
      "appointment.cancelled",
      shouldRefreshAvailability,
    );
    const unsubscribeCheckedIn = subscribe(
      "appointment.checked_in",
      shouldRefreshAvailability,
    );
    const unsubscribeCompleted = subscribe(
      "appointment.completed",
      shouldRefreshAvailability,
    );
    const unsubscribeAvailabilityChanged = subscribe(
      "doctor.availability.changed",
      shouldRefreshAvailability,
    );

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeConfirmed();
      unsubscribeSlotConfirmed();
      unsubscribeRescheduled();
      unsubscribeCancelled();
      unsubscribeCheckedIn();
      unsubscribeCompleted();
      unsubscribeAvailabilityChanged();
    };
  }, [
    activeClinicId,
    availabilityQueryKey,
    consultationMode,
    dateString,
    isConnected,
    dialogOpen,
    queryClient,
    resolvedDoctorId,
    resolvedLocationId,
    step,
    subscribe,
  ]);

  const activeSelectedSlot =
    selectedSlot && effectiveSlots.includes(selectedSlot) ? selectedSlot : "";
  const slotGroups = useMemo(
    () => groupSlotsByPeriod(effectiveSlots as string[]),
    [effectiveSlots],
  );
  const selectedSlotLabel = useMemo(() => {
    if (!activeSelectedSlot) return "";
    return `${activeSelectedSlot} - ${appointmentDurationMinutes} min`;
  }, [activeSelectedSlot, appointmentDurationMinutes]);
  const liveSyncMode =
    connectionStatus === "connected"
      ? "live"
      : connectionStatus === "connecting" || connectionStatus === "reconnecting"
        ? "connecting"
        : "fallback";
  const liveSyncLabel =
    liveSyncMode === "live"
      ? "Live synced"
      : liveSyncMode === "connecting"
        ? "Connecting to realtime updates"
        : "Polling fallback";
  const liveSyncDescription =
    liveSyncMode === "live"
      ? "Availability updates are coming from websocket events."
      : liveSyncMode === "connecting"
        ? "Realtime connection is starting; availability will refresh automatically until it is ready."
        : "Websocket is unavailable, so availability refreshes automatically.";
  const liveSyncClasses =
    liveSyncMode === "live"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      : liveSyncMode === "connecting"
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
        : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";
  const showLiveSyncBanner = APP_CONFIG.ENVIRONMENT === "development";

  // Book appointment
  const handleBook = useCallback(async () => {
    const selectedSlot = activeSelectedSlot;
    const appointmentDoctorId = resolvedDoctorId;
    const appointmentLocationId = resolvedLocationId;

    logger.info("[BookAppointmentDialog] Confirm click", {
      consultationMode,
      hasService: Boolean(selectedService),
      doctorId: appointmentDoctorId,
      locationId: appointmentLocationId || "",
      selectedDate: selectedDate ? formatDateIST(selectedDate) : "",
      selectedSlot,
      shouldCollectVideoPayment,
      acceptedVideoPaymentPolicy,
    });

    if (!selectedService || !appointmentDoctorId || !selectedDate) {
      showErrorToast(
        "Please select a service, doctor, and date before confirming.",
      );
      return;
    }

    // Staff book for someone else: a patient must be chosen first.
    if (isPrivilegedScheduler && !resolvedBookingPatientId) {
      showErrorToast("Please select a patient before confirming.");
      goToStep(consultationMode === "VIDEO" ? "patient" : "service");
      return;
    }

    const patientBillingRoute = "/patient/payments";
    const redirectToBillingTab = (
      tab: "plans" | "subscriptions" | "payments",
      message: string,
    ) => {
      dismissToast("subscription-coverage-check");
      showErrorToast(message);
      push(`${patientBillingRoute}?tab=${tab}`);
    };

    const redirectToSubscriptionPlans = (message?: string) => {
      redirectToBillingTab(
        "plans",
        message ||
          "You don't have an active subscription for this in-person appointment. Please subscribe to continue.",
      );
    };

    const redirectToSubscriptionResolution = (
      message?: string,
      tab: "subscriptions" | "payments" = "subscriptions",
    ) => {
      redirectToBillingTab(
        tab,
        message ||
          "Your subscription cannot cover this appointment right now. Review your billing options before confirming.",
      );
    };

    try {
      let bookingPatientId = resolvedBookingPatientId;
      if (userRole === "PATIENT" && !bookingPatientId) {
        const profileUpdatePayload = {
          ...(session?.user?.firstName
            ? { firstName: session.user.firstName }
            : {}),
          ...(session?.user?.lastName
            ? { lastName: session.user.lastName }
            : {}),
          ...(session?.user?.phone ? { phone: session.user.phone } : {}),
          ...(session?.user?.address ? { address: session.user.address } : {}),
        };

        if (Object.keys(profileUpdatePayload).length > 0) {
          const profileUpdateResult =
            await updateUserProfile(profileUpdatePayload);
          if (!profileUpdateResult.success) {
            throw new Error(
              'error' in profileUpdateResult && typeof profileUpdateResult.error === 'string'
                ? profileUpdateResult.error
                : "Patient profile is incomplete. Please complete your profile first.",
            );
          }
        }

        // updateUserProfile above may have just created the patient record, so
        // the cached ["userProfile"] entry (populated by useUserProfile while
        // this dialog is open) predates it and carries no patient.id. Always
        // re-read; staleTime 0 stops fetchQuery from serving that stale entry.
        const refreshedProfile = (await queryClient.fetchQuery({
          queryKey: ["userProfile"],
          queryFn: async () => await getUserProfile(),
          staleTime: 0,
        })) as Record<string, unknown> | undefined;

        bookingPatientId =
          (refreshedProfile as any)?.patient?.id ||
          (refreshedProfile as any)?.patientId ||
          "";
      }

      if (!bookingPatientId) {
        throw new Error(
          "Patient record not found for your account. Please complete your patient profile first.",
        );
      }

      const finalAppointmentType: AppointmentType =
        consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";
      const selectedDateString = formatDateIST(selectedDate);

      // Client-side validation: past dates (supplements server-side guard)
      if (!selectedDate) {
        showErrorToast("Please select an appointment date.");
        return;
      }

      const todayIST = getTodayIST();
      if (selectedDate < todayIST) {
        showErrorToast(
          "Cannot book an appointment in the past. Please select today or a future date.",
        );
        return;
      }

      const dayOfWeek = selectedDate.getDay();
      if (isBookingDateDisabled(selectedDate)) {
        showErrorToast(
          dayOfWeek === 0 || dayOfWeek === 6
            ? "Appointments cannot be booked on this day. Please select an available date."
            : "The clinic or doctor is unavailable on this date. Please select another day.",
        );
        return;
      }

      // If today, verify the selected slot time hasn't passed yet
      if (
        selectedDate.getTime() === todayIST.getTime() &&
        selectedSlot
      ) {
        const nowInIST = new Date(
          new Date().getTime() + 5.5 * 60 * 60 * 1000,
        );
        const [slotH, slotM] = selectedSlot.split(":").map(Number);
        const slotMinutes = (slotH ?? 0) * 60 + (slotM ?? 0);
        const nowMinutes =
          nowInIST.getUTCHours() * 60 + nowInIST.getUTCMinutes();
        if (slotMinutes < nowMinutes) {
          showErrorToast(
            "This time slot has already passed. Please select a later time.",
          );
          return;
        }
      }

      if (!selectedSlot) {
        showErrorToast(
          finalAppointmentType === "VIDEO_CALL"
            ? "Please select a video time slot."
            : "Please select a time slot.",
        );
        return;
      }

      const freshSlots = await withTimeout(
        validateLatestAvailability(selectedSlot),
        AVAILABILITY_TIMEOUT_MS,
        "Checking availability is taking longer than expected. Please try again.",
      );

      if (finalAppointmentType === "VIDEO_CALL") {
        if (!selectedSlot) {
          showErrorToast("Please select a video time slot.");
          return;
        }

        if (!freshSlots.includes(selectedSlot)) {
          setSelectedSlot("");
          showErrorToast(
            "That video slot is no longer available. Please select a fresh slot.",
          );
          return;
        }

        if (!isSlotWithinClinicVideoWindow(selectedSlot)) {
          showErrorToast(
            clinicVideoCallWindow
              ? `Selected slot is outside the clinic video hours (${clinicVideoCallWindow.start} - ${clinicVideoCallWindow.end}). Please choose another time.`
              : "Selected slot is outside the clinic video hours. Please choose another time.",
          );
          return;
        }

        logger.info("[BookAppointmentDialog] Creating video appointment", {
          clinicId: activeClinicId,
          doctorId: appointmentDoctorId,
          date: selectedDateString,
          slot: selectedSlot,
          patientId: bookingPatientId,
        });

        const createdAppointment = await createAppointment({
          patientId: bookingPatientId,
          doctorId: appointmentDoctorId,
          ...(appointmentLocationId
            ? { locationId: appointmentLocationId }
            : {}),
          date: selectedDateString,
          time: selectedSlot,
          duration: appointmentDurationMinutes,
          type: finalAppointmentType,
          ...(chiefComplaint ? { notes: chiefComplaint } : {}),
          priority: "NORMAL",
          ...(visitForFamilyMemberId
            ? { familyMemberId: visitForFamilyMemberId }
            : {}),
        });

        logger.info(
          "[BookAppointmentDialog] Video appointment create response received",
          {
            hasResult: Boolean(createdAppointment),
            appointmentId: resolveAppointmentId(createdAppointment),
          },
        );

        const createdAppointmentId = resolveAppointmentId(createdAppointment);
        if (!createdAppointmentId) {
          throw new Error(
            "Failed to create video appointment; no appointment ID was returned.",
          );
        }

        setBookedAppointmentId(createdAppointmentId);
        syncAppointmentInCache(
          queryClient,
          createdAppointment as unknown as Record<string, unknown>,
          {
            queryKeys: [
              ["myAppointments"],
              ["appointments"],
              ["userUpcomingAppointments"],
              ["appointment", createdAppointmentId],
              ["video-appointments"],
              ["video-appointment", createdAppointmentId],
            ],
          },
        );
        if (shouldCollectVideoPayment) {
          setRequiresVideoPayment(true);
          setVideoPaymentCompleted(false);
          setAcceptedVideoPaymentPolicy(true);
          
          const record = createdAppointment as Record<string, any>;
          const meta = (record?.metadata && typeof record.metadata === 'object')
            ? record.metadata as Record<string, any>
            : {};
          const windowMinutes = typeof meta['paymentWindowMinutes'] === 'number'
            ? (meta['paymentWindowMinutes'] as number)
            : null;
          const startedAt = meta['paymentWindowStartedAt'];
          if (startedAt && windowMinutes) {
            const startedMs = Date.parse(startedAt as string);
            if (Number.isFinite(startedMs)) {
              setBookedPaymentExpiresAt(new Date(startedMs + windowMinutes * 60_000).toISOString());
              setBookedPaymentWindowMinutes(windowMinutes);
            }
          }
          
          showInfoToast(
            "Appointment created. Complete payment in in the confirm screen to finish booking.",
          );
          return;
        }

        onBooked?.();
        showSuccessToast(
          `Video appointment booked with ${selectedDoctor?.name ? formatDoctorDisplayName(selectedDoctor.name) : "doctor"}` +
            (selectedDate ? ` for ${format(selectedDate, "d MMM yyyy")}` : "") +
            (shouldCollectVideoPayment
              ? " and awaiting payment completion."
              : " and is booked."),
          { id: "booking-success" },
        );
        setStep(activeSteps.length || 1);
        return;
      }

      if (!freshSlots.includes(selectedSlot)) {
        setSelectedSlot("");
        showErrorToast(
          "That time slot is no longer available. Please select a fresh slot.",
        );
        return;
      }

      if (
        finalAppointmentType === "IN_PERSON" &&
        userRole === "PATIENT" &&
        !activeSubscription
      ) {
        redirectToSubscriptionPlans(
          "You don't have an active subscription for in-person appointments. Please subscribe to continue.",
        );
        return;
      }

      if (finalAppointmentType === "IN_PERSON" && activeSubscription?.id) {
        const coverageResult = await checkSubscriptionCoverage({
          subscriptionId: activeSubscription.id,
          appointmentType: "IN_PERSON",
        });
        const coverage = coverageResult.coverage;
        const covered =
          coverage?.covered === true || coverage?.allowed === true;
        if (!covered) {
          const requiresPayment = coverage?.requiresPayment === true;
          const reason =
            coverage?.message ||
            coverage?.reason ||
            (requiresPayment
              ? `Subscription coverage unavailable. Additional payment required: Rs. ${coverage?.paymentAmount || 0}`
              : "Subscription quota exhausted or inactive.");
          redirectToSubscriptionResolution(
            reason,
            requiresPayment ? "payments" : "subscriptions",
          );
          return;
        }
      }

      let apptId = "";
      if (
        finalAppointmentType === "IN_PERSON" &&
        userRole === "PATIENT" &&
        activeSubscription?.id
      ) {
        const selectedDateKey = formatDateIST(selectedDate);
        const selectedTimeValue = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot;
        const appointmentDateIso = new Date(
          `${selectedDateKey}T${selectedTimeValue}+05:30`,
        ).toISOString();
        const atomicResult = await createSubscriptionAppointment({
          subscriptionId: activeSubscription.id,
          patientId: bookingPatientId,
          doctorId: appointmentDoctorId,
          clinicId: activeClinicId,
          locationId: appointmentLocationId,
          appointmentDate: appointmentDateIso,
          duration: appointmentDurationMinutes,
          treatmentType: selectedService.treatmentType,
          priority: urgency.toUpperCase(),
          notes: chiefComplaint || selectedService.label,
        });
        apptId =
          (atomicResult as any)?.appointment?.id ||
          (atomicResult as any)?.appointment?.data?.id ||
          "APPT-" + Date.now();
        const createdSubscriptionAppointment =
          (atomicResult as any)?.appointment ||
          (atomicResult as any)?.appointment?.data ||
          (atomicResult as any)?.data?.appointment ||
          (atomicResult as any)?.data ||
          null;
        if (createdSubscriptionAppointment) {
          syncAppointmentInCache(
            queryClient,
            createdSubscriptionAppointment as unknown as Record<
              string,
              unknown
            >,
            {
              appointmentStatus: "SCHEDULED",
              queryKeys: [
                ["myAppointments"],
                ["appointments"],
                ["userUpcomingAppointments"],
                ["appointment", apptId],
                ["doctorAppointments"],
                ["doctorSchedule"],
              ],
            },
          );
        }
      } else {
        const payload = {
          doctorId: appointmentDoctorId,
          locationId: appointmentLocationId,
          date: formatDateIST(selectedDate),
          time: selectedSlot,
          type: finalAppointmentType,
          treatmentType: selectedService.treatmentType,
          duration: appointmentDurationMinutes,
          notes: chiefComplaint || selectedService.label,
          priority: urgency.toUpperCase() as any,
          patientId: bookingPatientId,
        };

        logger.info("[BookAppointmentDialog] Creating appointment", {
          clinicId: activeClinicId,
          doctorId: resolvedDoctorId,
          date: formatDateIST(selectedDate),
          slot: selectedSlot,
          patientId: bookingPatientId,
        });

        const appointment = await createAppointment(payload);
        logger.info(
          "[BookAppointmentDialog] Appointment create response received",
          {
            hasResult: Boolean(appointment),
            appointmentId: resolveAppointmentId(appointment),
          },
        );
        const appointmentId = resolveAppointmentId(appointment);

        if (!appointmentId) {
          throw new Error(
            "Failed to create appointment; check console for details.",
          );
        }
        apptId = appointmentId;
        syncAppointmentInCache(
          queryClient,
          appointment as unknown as Record<string, unknown>,
          {
            appointmentStatus: "SCHEDULED",
            queryKeys: [
              ["myAppointments"],
              ["appointments"],
              ["userUpcomingAppointments"],
              ["appointment", appointmentId],
              ["video-appointments"],
              ["video-appointment", appointmentId],
              ["doctorAppointments"],
              ["doctorSchedule"],
            ],
          },
        );
      }

      setBookedAppointmentId(apptId);
      // Send appointment reminder via push + email + WhatsApp
      if (hasPermission(Permission.SEND_NOTIFICATIONS)) {
        sendReminder({ appointmentId: apptId, reminderType: "all" });
      }
      onBooked?.();
      showSuccessToast(
        `Appointment booked${selectedDoctor?.name ? ` with ${formatDoctorDisplayName(selectedDoctor.name)}` : ""}` +
          (selectedDate ? ` on ${format(selectedDate, "d MMM yyyy")}` : "") +
          ".",
        { id: "booking-success" },
      );
      setStep(activeSteps.length || 1); // success/QR screen
    } catch (err: any) {
      const errorMessage =
        typeof err?.message === "string"
          ? err.message
          : "Failed to book appointment. Please try again.";
      const lowerErrorMessage = errorMessage.toLowerCase();
      const isPaymentValidationFailure =
        shouldCollectVideoPayment &&
        (lowerErrorMessage.includes("invalid payment payload") ||
          lowerErrorMessage.includes("payment payload could not be validated") ||
          (lowerErrorMessage.includes("payment") && lowerErrorMessage.includes("validation failed")) ||
          lowerErrorMessage.includes("payment link"));
      const shouldRedirectToSubscription =
        userRole === "PATIENT" &&
        consultationMode === "IN_PERSON" &&
        (lowerErrorMessage.includes(
          "active in-person subscription coverage is required",
        ) ||
          lowerErrorMessage.includes("active subscription required") ||
          lowerErrorMessage.includes("subscription quota exhausted") ||
          lowerErrorMessage.includes("subscription expired") ||
          lowerErrorMessage.includes("subscription ended") ||
          lowerErrorMessage.includes("subscription period") ||
          lowerErrorMessage.includes("subscription coverage unavailable") ||
          (lowerErrorMessage.includes("subscription") &&
            lowerErrorMessage.includes("required")));

      if (shouldRedirectToSubscription) {
        const noActiveSubscription =
          !activeSubscription &&
          (lowerErrorMessage.includes("active subscription required") ||
            lowerErrorMessage.includes("subscription required"));

        if (noActiveSubscription) {
          redirectToSubscriptionPlans(
            "You don't have an active subscription for this appointment. Please subscribe to continue.",
          );
          return;
        }

        const requiresPayment =
          lowerErrorMessage.includes("payment") ||
          lowerErrorMessage.includes("past due") ||
          lowerErrorMessage.includes("billing");

        redirectToSubscriptionResolution(
          errorMessage,
          requiresPayment ? "payments" : "subscriptions",
        );
        return;
      }

      dismissToast("subscription-coverage-check");

      if (isPaymentValidationFailure) {
        showErrorToast(
          "Payment link could not be validated. Please reopen the payment link.",
        );
        return;
      }

      if (lowerErrorMessage.includes("time slot is no longer available")) {
        queryClient.invalidateQueries({
          queryKey: availabilityQueryKey,
          exact: true,
        });
        setSelectedSlot("");
      }

      showErrorToast(errorMessage);
    }
  }, [
    selectedService,
    resolvedDoctorId,
    selectedDate,
    isBookingDateDisabled,
    activeSelectedSlot,
    resolvedBookingPatientId,
    chiefComplaint,
    urgency,
    activeClinicId,
    consultationMode,
    acceptedVideoPaymentPolicy,
    appointmentDurationMinutes,
    resolvedLocationId,
    createAppointment,
    checkSubscriptionCoverage,
    createSubscriptionAppointment,
    hasPermission,
    sendReminder,
    onBooked,
    userRole,
    activeSubscription,
    push,
    queryClient,
    availabilityQueryKey,
    validateLatestAvailability,
    resolveAppointmentId,
    clinicVideoCallWindow,
    isSlotWithinClinicVideoWindow,
    session?.user?.firstName,
    session?.user?.lastName,
    session?.user?.phone,
    session?.user?.address,
    shouldCollectVideoPayment,
    setSelectedSlot,
    setBookedAppointmentId,
    setRequiresVideoPayment,
    setVideoPaymentCompleted,
    setAcceptedVideoPaymentPolicy,
    selectedDoctor?.name,
    setStep,
    activeSteps.length,
    isPrivilegedScheduler,
    goToStep,
    visitForFamilyMemberId,
  ]);

  // Navigation
  const canNext = useMemo(() => {
    if (currentStepId === "mode") {
      return (
        !!consultationMode &&
        (consultationMode === "VIDEO" ||
          !!resolvedLocationId ||
          locations.length === 1)
      );
    }
    if (currentStepId === "service") {
      return (
        !!selectedServiceId && (!isPrivilegedScheduler || !!selectedPatientId)
      );
    }
    if (currentStepId === "patient") {
      return !!selectedPatientId;
    }
    if (currentStepId === "doctor") {
      return !!resolvedDoctorId || doctorsList.length === 1;
    }
    if (currentStepId === "date") {
      return !!selectedDate && !isBookingDateDisabled(selectedDate);
    }
    if (currentStepId === "slot") {
      const hasDate = !!selectedDate && !isBookingDateDisabled(selectedDate);
      return hasDate && !!activeSelectedSlot;
    }
    return true;
  }, [
    consultationMode,
    currentStepId,
    doctorsList.length,
    isPrivilegedScheduler,
    locations.length,
    selectedDate,
    isBookingDateDisabled,
    resolvedDoctorId,
    resolvedLocationId,
    selectedServiceId,
    activeSelectedSlot,
    selectedPatientId,
  ]);

  const goNext = useCallback(() => {
    const nextStepId = activeSteps[currentStepIndex + 1];
    if (nextStepId) {
      setPendingStepNavigation("forward");
      goToStep(nextStepId);
    }
  }, [activeSteps, currentStepIndex, goToStep]);

  const goBack = useCallback(() => {
    const previousStepId = activeSteps[currentStepIndex - 1];
    if (previousStepId) {
      setPendingStepNavigation("backward");
      goToStep(previousStepId);
      return;
    }

    setPendingStepNavigation(null);
    handleOpenChange(false);
  }, [activeSteps, currentStepIndex, goToStep, handleOpenChange]);

  useEffect(() => {
    setPendingStepNavigation(null);
  }, [currentStepId]);

  // QR data
  // const qrData = useMemo(() => {
  // return JSON.stringify({
  // appointmentId: bookedAppointmentId,
  // patient: session?.user?.name,
  // doctor: selectedDoctor?.name,
  // date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
  // slot: selectedSlot,
  // });
  // }, [bookedAppointmentId, session, selectedDoctor, selectedDate, selectedSlot]);

  // const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  // ── Presentation only ────────────────────────────────────────────────────
  // Values for the restyled steps. No booking rule, payload or payment reads them.
  // Each step starts at the top of the scroll area (matters on phones, where steps are long).
  const stepScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    stepScrollRef.current?.scrollTo({ top: 0 });
  }, [currentStepId]);
  const bookingLayout: BookingLayout = isPrivilegedScheduler ? "compact" : "page";
  const isPageLayout = bookingLayout === "page";
  const selectedLocation = (locations as any[]).find(
    (loc) => loc.id === resolvedLocationId,
  );
  const bookingLocationName =
    consultationMode === "VIDEO"
      ? ""
      : String(selectedLocation?.name || selectedLocation?.address || "");
  const bookingLocationAddress =
    consultationMode === "VIDEO"
      ? ""
      : [selectedLocation?.name, selectedLocation?.address, selectedLocation?.city]
          .filter(Boolean)
          .join(", ");
  const doctorExperienceYears = Number(selectedDoctor?.experience);
  const doctorRating = Number(selectedDoctor?.rating);
  const doctorInfo: BookingDoctorInfo | null = selectedDoctor
    ? {
        name: formatDoctorDisplayName(selectedDoctor.name) || "Doctor",
        subtitle: [
          selectedDoctor.specialization || "General Physician",
          selectedDoctor.qualification,
        ]
          .filter(Boolean)
          .join(" · "),
        image: selectedDoctor.image || undefined,
        locationName: bookingLocationName || undefined,
        clinicName: clinicName || myClinic?.name || undefined,
        highlights: toTextList(selectedDoctor.certifications),
        education: toTextList(selectedDoctor.education).join(", ") || undefined,
        languages: toTextList(selectedDoctor.languages),
        stats: [
          ...(Number.isFinite(doctorExperienceYears) && doctorExperienceYears > 0
            ? [{ value: `${doctorExperienceYears}+`, label: "Years" }]
            : []),
          ...(Number.isFinite(doctorRating) && doctorRating > 0
            ? [{ value: doctorRating.toFixed(1), label: "Rating" }]
            : []),
        ],
      }
    : null;
  const doctorHours: BookingHoursRow[] = [
    ...summarizeWorkingHours(selectedDoctor?.workingHours),
    ...(consultationMode === "VIDEO" && clinicVideoCallWindow
      ? [
          {
            label: "Video consults",
            value: `${clinicVideoCallWindow.start} – ${clinicVideoCallWindow.end}`,
          },
        ]
      : []),
  ];
  const doctorHoursTag =
    consultationMode === "VIDEO" && clinicVideoCallWindow ? "Video" : undefined;
  const bookedSlotsForDisplay = readBookedSlots(availability);
  const sessionDisplayName = resolveDisplayNameAndInitials({
    firstName: session?.user?.firstName,
    lastName: session?.user?.lastName,
    name: session?.user?.name,
    email: session?.user?.email,
  }).displayName;
  const bookingForName = sessionDisplayName === "User" ? "" : sessionDisplayName;
  // "Who is this visit for?" on the Confirm step, and the chosen person's name.
  const visitForMemberName = visitForMember
    ? String(
        visitForMember.name ||
          `${visitForMember.firstName || ""} ${visitForMember.lastName || ""}`,
      ).trim()
    : "";
  const visitForMemberLabel = visitForMember
    ? [visitForMemberName, visitForMember.relation ? `(${visitForMember.relation})` : ""]
        .filter(Boolean)
        .join(" ")
    : "";
  const visitFor: BookingVisitForProps | undefined = canChooseFamilyMember
    ? {
        options: [
          {
            id: "",
            name: session?.user?.firstName?.trim() || bookingForName || "Me",
            fullName: bookingForName || undefined,
            relation: "Myself",
          },
          ...familyMemberOptions.map((member) => ({
            id: member.id,
            name:
              member.firstName?.trim() ||
              String(member.name || "").trim() ||
              "Family member",
            fullName:
              String(
                member.name || `${member.firstName || ""} ${member.lastName || ""}`,
              ).trim() || undefined,
            relation: member.relation || "Family",
          })),
        ],
        selectedId: visitForFamilyMemberId,
        onSelect: setVisitForMemberId,
        // Once the appointment exists (waiting for payment) the person cannot change.
        locked: !!bookedAppointmentId,
        loading: familyMembersLoading,
        note:
          visitForMemberId && !visitForMember && !familyMembersLoading
            ? familyMembersError
              ? "We could not load your family list, so this visit is for you."
              : "That family member is not on your list, so this visit is for you."
            : undefined,
        addHref: "/patient/family",
      }
    : undefined;
  const bookedPatientName = isPrivilegedScheduler
    ? String(selectedPatient?.displayName || "")
    : visitForMemberLabel || bookingForName;
  // Fee shown to patients only, straight from the existing calculation.
  const feeLabel = shouldCollectVideoPayment
    ? formatRupees(videoPaymentAmount)
    : null;
  const displayTitle = !isPageLayout
    ? stepTitle
    : currentStepId === "date" || currentStepId === "slot"
      ? "Your Doctor"
      : currentStepId === "confirm"
        ? "Review & Confirm"
        : stepTitle;

  // The book / pay button (amber). Same conditions and handler as before; it is drawn in the
  // footer and, on wide patient screens, inside the payment summary card.
  const renderConfirmButton = (size: "md" | "xl", className?: string) => {
    const isVideoPaymentPending =
      consultationMode === "VIDEO" &&
      shouldCollectVideoPayment &&
      !!bookedAppointmentId &&
      requiresVideoPayment &&
      !videoPaymentCompleted;
    const isVideoConfirmDisabled =
      consultationMode === "VIDEO"
        ? shouldCollectVideoPayment
          ? !acceptedVideoPaymentPolicy || isBooking || isVideoPaymentPending
          : isBooking
        : isCreatingInPersonAppointment || isSubscriptionGateLoading;
    const confirmLabel = isVideoPaymentPending
      ? "Payment in progress"
      : consultationMode === "VIDEO"
        ? shouldCollectVideoPayment
          ? `Confirm & Pay ${formatRupees(videoPaymentAmount)}`
          : "Book Video Appointment"
        : needsSubscriptionPlan
          ? "Choose plan to continue"
          : "Confirm & Book";
    const paysOnline = consultationMode === "VIDEO" && shouldCollectVideoPayment;

    return (
      <Button
        variant="action"
        size={size}
        onClick={handleBook}
        disabled={isVideoConfirmDisabled}
        className={cn(
          "h-auto whitespace-normal py-2 leading-tight",
          size === "xl" ? "min-h-[54px]" : "min-h-11",
          className,
        )}
      >
        {(
          consultationMode === "VIDEO"
            ? isBooking
            : isCreatingInPersonAppointment || isSubscriptionGateLoading
        ) ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {consultationMode === "VIDEO"
              ? "Preparing appointment..."
              : "Checking plan..."}
          </>
        ) : paysOnline ? (
          <>
            {confirmLabel} <ArrowRight className="size-4" />
          </>
        ) : (
          <>
            <Check className="size-4" /> {confirmLabel}
          </>
        )}
      </Button>
    );
  };

  const RenderStep2 = BookAppointmentStep2;

  const RenderStep3 = BookAppointmentStep3;
  const RenderStep4 = BookAppointmentStep4;
  const RenderStep5 = BookAppointmentStep5;
  const RenderStep6 = BookAppointmentStep6;

  // Step 4: Slot

  // Main render

  const stepContent = (() => {
    switch (currentStepId) {
      case "mode":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <BookAppointmentStep1
              consultationMode={consultationMode}
              isPatientClinicStillResolving={isPatientClinicStillResolving}
              profileCompletionBlocked={profileCompletionBlocked}
              handleOpenChange={handleOpenChange}
              replace={replace}
              profileCompletionRedirectUrl={profileCompletionRedirectUrl}
              locationsLoading={locationsLoading}
              allLocationsLoading={allLocationsLoading}
              locations={locations as any[]}
              activeLocationsFetched={activeLocationsFetched}
              allLocationsFetched={allLocationsFetched}
              hasOnlyInactiveLocations={hasOnlyInactiveLocations}
              clinicName={clinicName || ""}
              selectedLocationId={resolvedLocationId}
              setSelectedLocationId={setSelectedLocationId}
              selectedServiceId={selectedServiceId}
              setSelectedServiceId={setSelectedServiceId}
              setSelectedDoctorId={setSelectedDoctorId}
              setSelectedDate={setSelectedDate}
              setSelectedSlot={setSelectedSlot}
              goNext={goNext}
              setConsultationMode={setConsultationMode}
            />
          </AppointmentStepWrapper>
        );
      case "service":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <BookAppointmentStep2Service
              visibleServices={visibleServices}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              servicesLoading={servicesLoading}
              newPatient={newPatient}
              setNewPatient={setNewPatient}
              quickRegisterPatientMutation={quickRegisterPatientMutation}
              isPrivilegedScheduler={isPrivilegedScheduler}
              showQuickCreatePatient={showQuickCreatePatient}
              setShowQuickCreatePatient={setShowQuickCreatePatient}
              patientSearch={patientSearch}
              setPatientSearch={setPatientSearch}
              locationsFetching={locationsFetching}
              locations={locations as any[]}
              filteredPatientsList={filteredPatientsList}
              selectedPatientId={selectedPatientId}
              setSelectedPatientId={setSelectedPatientId}
              selectedServiceId={selectedServiceId}
              setSelectedServiceId={setSelectedServiceId}
              setSelectedDoctorId={setSelectedDoctorId}
              setSelectedDate={setSelectedDate}
              setSelectedSlot={setSelectedSlot}
              setRecentlyCreatedPatient={setRecentlyCreatedPatient}
              showQuickCreateAdditionalDetails={
                showQuickCreateAdditionalDetails
              }
              setShowQuickCreateAdditionalDetails={
                setShowQuickCreateAdditionalDetails
              }
              queryClient={queryClient}
              selectedPatient={selectedPatient}
              goNext={goNext}
            />
          </AppointmentStepWrapper>
        );
      case "patient":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <BookAppointmentStepPatient
              newPatient={newPatient}
              setNewPatient={setNewPatient}
              quickRegisterPatientMutation={quickRegisterPatientMutation}
              showQuickCreatePatient={showQuickCreatePatient}
              setShowQuickCreatePatient={setShowQuickCreatePatient}
              patientSearch={patientSearch}
              setPatientSearch={setPatientSearch}
              locationsFetching={locationsFetching}
              locations={locations as any[]}
              filteredPatientsList={filteredPatientsList}
              selectedPatientId={selectedPatientId}
              setSelectedPatientId={setSelectedPatientId}
              setRecentlyCreatedPatient={setRecentlyCreatedPatient}
              showQuickCreateAdditionalDetails={
                showQuickCreateAdditionalDetails
              }
              setShowQuickCreateAdditionalDetails={
                setShowQuickCreateAdditionalDetails
              }
              queryClient={queryClient}
              selectedPatient={selectedPatient}
            />
          </AppointmentStepWrapper>
        );
      case "doctor":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep2
              doctorsLoading={doctorsLoading}
              doctorsFetched={doctorsFetched}
              doctorsRefreshing={doctorsFetching || isHardRefreshingDoctors}
              doctorsErrorMessage={doctorsErrorMessage}
              doctorsList={doctorsList}
              consultationMode={consultationMode}
              selectedLocationId={resolvedLocationId}
              selectedDoctorId={resolvedDoctorId}
              setSelectedDoctorId={setSelectedDoctorId}
              setSelectedDate={setSelectedDate}
              setSelectedSlot={setSelectedSlot}
              goNext={goNext}
              goBack={goBack}
              onHardRefresh={handleHardRefreshDoctors}
            />
          </AppointmentStepWrapper>
        );
      case "date":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep3
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              setSelectedSlot={setSelectedSlot}
              goNext={goNext}
              isClinicClosedDate={isBookingDateDisabled}
              layout={bookingLayout}
              doctorInfo={doctorInfo}
              doctorHours={doctorHours}
              doctorHoursTag={doctorHoursTag}
            />
          </AppointmentStepWrapper>
        );
      case "slot":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep4
              consultationMode={consultationMode}
              selectedSlot={activeSelectedSlot}
              slotGroups={slotGroups}
              showLiveSyncBanner={showLiveSyncBanner}
              liveSyncClasses={liveSyncClasses}
              liveSyncMode={liveSyncMode}
              liveSyncLabel={liveSyncLabel}
              liveSyncDescription={liveSyncDescription}
              clinicVideoCallWindow={clinicVideoCallWindow}
              selectedDate={selectedDate}
              appointmentDurationMinutes={appointmentDurationMinutes}
              shouldLoadAvailability={shouldLoadAvailability}
              showAvailabilityLoader={showAvailabilityLoader}
              effectiveSlots={effectiveSlots}
              consultationBlocked={consultationBlocked}
              restrictions={restrictions}
              availabilityError={availabilityError}
              setSelectedSlot={setSelectedSlot}
              selectedSlotLabel={selectedSlotLabel}
              layout={bookingLayout}
              doctorInfo={doctorInfo}
              doctorHours={doctorHours}
              bookedSlots={bookedSlotsForDisplay}
              feeLabel={feeLabel}
              setSelectedDate={setSelectedDate}
              isDateDisabled={isBookingDateDisabled}
            />
          </AppointmentStepWrapper>
        );
      case "confirm":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep5
              userRole={userRole}
              selectedPatient={selectedPatient ?? null}
              selectedService={selectedService ?? null}
              selectedDoctor={selectedDoctor ?? null}
              selectedDate={selectedDate}
              selectedSlot={activeSelectedSlot}
              appointmentDurationMinutes={appointmentDurationMinutes}
              consultationMode={consultationMode}
              shouldCollectVideoPayment={shouldCollectVideoPayment}
              videoPaymentAmount={videoPaymentAmount}
              acceptedVideoPaymentPolicy={acceptedVideoPaymentPolicy}
              setAcceptedVideoPaymentPolicy={setAcceptedVideoPaymentPolicy}
              bookedAppointmentId={bookedAppointmentId}
              requiresVideoPayment={requiresVideoPayment}
              videoPaymentCompleted={videoPaymentCompleted}
              activeClinicId={activeClinicId}
              setRequiresVideoPayment={setRequiresVideoPayment}
              setVideoPaymentCompleted={setVideoPaymentCompleted}
              needsSubscriptionPlan={needsSubscriptionPlan}
              isSubscriptionGateLoading={isSubscriptionGateLoading}
              chiefComplaint={chiefComplaint}
              setChiefComplaint={setChiefComplaint}
              urgency={urgency}
              setUrgency={setUrgency}
              layout={bookingLayout}
              doctorInfo={doctorInfo}
              bookingForName={bookingForName}
              visitFor={visitFor}
              visitForName={visitForMemberLabel}
              locationName={bookingLocationName}
              confirmAction={renderConfirmButton("xl", "w-full")}
            />
          </AppointmentStepWrapper>
        );
      case "success":
      default:
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep6
              consultationMode={consultationMode}
              requiresVideoPayment={requiresVideoPayment}
              videoPaymentCompleted={videoPaymentCompleted}
              selectedSlot={activeSelectedSlot}
              clinicVideoCallWindow={clinicVideoCallWindow}
              selectedService={selectedService ?? null}
              selectedDoctor={selectedDoctor ?? null}
              selectedDate={selectedDate}
              isPatientInPersonFlow={isPatientInPersonFlow}
              handleOpenChange={handleOpenChange}
              pathname={pathname}
              push={push}
              patientCheckInRoute={patientCheckInRoute}
              postBookingRoute={postBookingRoute}
              postBookingLabel={postBookingLabel}
              paymentExpiresAt={bookedPaymentExpiresAt}
              paymentWindowMinutes={bookedPaymentWindowMinutes}
              layout={bookingLayout}
              doctorInfo={doctorInfo}
              bookedAppointmentId={bookedAppointmentId}
              patientName={bookedPatientName}
              appointmentDurationMinutes={appointmentDurationMinutes}
              paidAmountLabel={feeLabel}
              locationName={bookingLocationName}
              locationAddress={bookingLocationAddress}
              isPatientUser={userRole === "PATIENT"}
            />
          </AppointmentStepWrapper>
        );
    }
  })();

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="action" size="md">
              <Plus className="size-5" />
              Book Video Appointment
            </Button>
          )}
        </DialogTrigger>
      )}

      {/* Full-height sheet on phones; a centred dialog from 640 px up. Patients get the wide
          page-like layout of the boards, staff the narrow dialog. */}
      <DialogContent
        className={cn(
          "top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0",
          "sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[20px]",
          isPageLayout
            ? "sm:h-[min(88dvh,720px)] sm:w-[min(94vw,640px)] sm:max-w-none lg:w-[min(94vw,980px)]"
            : "sm:h-auto sm:max-h-[92dvh] sm:min-h-[min(92dvh,560px)] sm:w-[min(94vw,560px)] sm:max-w-none",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "shrink-0 px-3.5 pt-3.5 sm:px-5 sm:pt-4",
            isSuccessStep ? "pb-2.5" : "border-b border-hair pb-2.5",
          )}
        >
          <DialogHeader className="w-full min-w-0 text-left">
            <div className="flex min-h-8 flex-wrap items-center gap-2">
              <DialogTitle
                className={cn(
                  "min-w-0 truncate",
                  isPageLayout && "sm:text-lg sm:tracking-[-0.2px]",
                )}
              >
                {displayTitle}
              </DialogTitle>
              {consultationMode === "VIDEO" && (
                <Pill tone="amber">Video booking flow</Pill>
              )}
            </div>

            <DialogDescription className="sr-only">
              Book an in-person or video appointment by selecting location,
              service, doctor, date, and time.
            </DialogDescription>
          </DialogHeader>

          {/* Step bar hide on success screen */}
          {!isSuccessStep && (
            <div className="mt-2.5 w-full min-w-0">
              <BookAppointmentStepBar
                activeSteps={activeSteps}
                step={step}
                goToStep={goToStep}
                mergeDateAndTimeStep={isPageLayout}
              />
            </div>
          )}
        </div>

        {/* Content — keep scrollable on all steps/devices (incl. iOS) */}
        <div
          ref={stepScrollRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3.5 py-3 sm:px-5 sm:py-3.5",
            "[-webkit-overflow-scrolling:touch] touch-pan-y",
            "pb-4",
            isPageLayout && "tbd-wash",
          )}
          {...(isPageLayout ? { "data-tone": "sky" } : {})}
        >
          <LazyMotion features={domAnimation}>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={currentStepId}
                initial={{
                  opacity: 0,
                  x: stepDirection === "forward" ? 20 : -20,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: stepDirection === "forward" ? -20 : 20 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="min-h-0"
              >
                {stepContent}
              </m.div>
            </AnimatePresence>
          </LazyMotion>
        </div>

        {/* Footer hide on success screen */}
        {!isSuccessStep && (
          <div className="flex shrink-0 flex-row items-center gap-2 border-t border-hair bg-[#f8fafc] px-3.5 py-2.5 dark:bg-well/40 sm:px-5">
            <Button
              variant="outline"
              size="md"
              onClick={step > 1 ? goBack : () => handleOpenChange(false)}
              className="max-sm:flex-auto"
              disabled={pendingStepNavigation === "backward"}
            >
              {pendingStepNavigation === "backward" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
              {step > 1 ? "Back" : "Cancel"}
            </Button>
            <div className="hidden flex-1 sm:block" />

            {currentStepId !== "confirm" ? (
              <Button
                size="md"
                onClick={goNext}
                disabled={!canNext}
                className="max-sm:flex-auto"
              >
                {pendingStepNavigation === "forward" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            ) : (
              // On wide patient screens the same button sits in the payment summary card.
              renderConfirmButton(
                "md",
                cn("max-sm:flex-auto", isPageLayout && "lg:hidden"),
              )
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
