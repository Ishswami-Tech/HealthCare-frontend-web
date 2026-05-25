"use client";

import Link from "next/link";
import Image from "next/image";
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
import { load } from "@cashfreepayments/cashfree-js";
import type {
  AppointmentServiceDefinition,
  AppointmentType,
  TreatmentType,
} from "@/types/appointment.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentButton } from "@/components/payments/PaymentButton";
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
  useCurrentClinicId,
  useMyClinic,
} from "@/hooks/query/useClinics";
import { useWebSocketContext } from "@/app/providers/WebSocketProvider";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import {
  createPaymentIntent,
  verifyPaymentCallback,
} from "@/lib/actions/billing.server";
import { getUserProfile, updateUserProfile } from "@/lib/actions/users.server";
import {
  dismissToast,
  showErrorToast,
  showInfoToast,
  showSuccessToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";
import { Permission } from "@/types/rbac.types";
import { APP_CONFIG } from "@/lib/config/config";
import { ROUTES } from "@/lib/config/routes";
import {
  DEFAULT_PAYMENT_PROVIDER,
  isPaymentProviderEnabled,
} from "@/lib/payments/providers";
import { theme } from "@/lib/utils/theme-utils";
import { cn } from "@/lib/utils";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { format } from "date-fns";
import { getClinicId } from "@/lib/utils/token-manager";
import { AppointmentStepWrapper } from "@/components/appointments/AppointmentStepWrapper";
import { syncAppointmentInCache } from "@/lib/utils/appointment-cache";
import {
  Activity,
  Plus,
  Leaf,
  Waves,
  Clock,
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
  Stethoscope,
  CalendarIcon,
  Sun,
  CloudSun,
  Moon,
  QrCode,
  Download,
  Check,
  ArrowRight,
  Video,
  MapPin,
  Building,
  Wifi,
  WifiOff,
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

//  Slot grouping helper â‚

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
  doctor: "Doctor",
  date: "Date",
  slot: "Time",
  confirm: "Confirm",
  success: "Done",
};
/** Each appointment slot is 3 minutes â‚ 20 bookable slots per hour. */
const IN_PERSON_APPOINTMENT_SLOT_DURATION_MINUTES = 3;
const VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES = 15;
const VIDEO_CONSULTATION_TREATMENT_TYPE: TreatmentType = "GENERAL_CONSULTATION";
const IST_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface BookAppointmentStepBarProps {
  activeSteps: readonly WizardStepId[];
  step: number;
  goToStep: (nextStepId: WizardStepId) => void;
  progressValue: number;
}

function BookAppointmentStepBar({
  activeSteps,
  step,
  goToStep,
  progressValue,
}: BookAppointmentStepBarProps) {
  return (
    <div className="px-1">
      <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progressValue}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        {activeSteps.map((stepId, i) => {
          const s = i + 1;
          const done = step > s;
          const active = step === s;
          return (
            <button
              key={stepId}
              type="button"
              onClick={() => goToStep(stepId)}
              className="flex items-center gap-1"
            >
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : s}
                </div>
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block ${
                    active
                      ? "text-primary"
                      : done
                        ? "text-primary/60"
                        : "text-muted-foreground"
                  }`}
                >
                  {STEP_LABELS[stepId]}
                </span>
              </div>
              {i < activeSteps.length - 1 && (
                <div
                  className={`h-0.5 w-4 sm:w-8 rounded-full mx-1 ${done ? "bg-primary" : "bg-muted"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Support banner for video appointments */}
      <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-xs text-amber-800 dark:from-amber-950/30 dark:to-orange-950/30 dark:text-amber-200 sm:text-sm">
        <span>Need help?</span>
        <a
          href="tel:+917218378311"
          className="font-semibold text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
        >
          Call +91 7218378311
        </a>
        <span>for booking assistance</span>
      </div>
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
    <div className="flex flex-col gap-5">
      {consultationMode === "VIDEO" ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Video consultations do not require a physical location.
        </div>
      ) : isPatientClinicStillResolving ? (
        <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
          <Loader2 className="size-7 mx-auto mb-2 opacity-60 animate-spin" />
          Resolving your clinicâ€¦
        </div>
      ) : profileCompletionBlocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div className="gap-y-1">
              <p className="font-semibold">Complete your profile first</p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                We need your profile details before loading locations or
                doctors.
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                You will be redirected to the profile completion page.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-9 rounded-lg"
                onClick={() => {
                  handleOpenChange(false);
                  replace(profileCompletionRedirectUrl);
                }}
              >
                Complete profile
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Visit Location
          </p>
          {((locationsLoading || allLocationsLoading) &&
            locations.length === 0) ||
          !activeLocationsFetched ||
          !allLocationsFetched ? (
            <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
              <Building className="size-7 mx-auto mb-2 opacity-30" />
              Loading locationsâ€¦
            </div>
          ) : locations.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-start gap-3">
                <Building className="mt-0.5 size-5 shrink-0" />
                <div className="gap-y-1">
                  <p className="font-semibold">Clinic unavailable</p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                    {clinicName
                      ? `${clinicName} has no active locations configured yet.`
                      : "No active locations are configured for this clinic yet."}
                  </p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                    Please contact the clinic or try again later.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-9 rounded-lg"
                    onClick={() => handleOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="gap-y-2">
              {hasOnlyInactiveLocations && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  No active locations are configured yet. Showing all clinic
                  locations so booking can continue.
                </div>
              )}
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    setSelectedDoctorId("");
                    setSelectedDate(getTodayIST());
                    setSelectedSlot("");
                    setTimeout(goNext, 150);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedLocationId === loc.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedLocationId === loc.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <MapPin className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-sm ${selectedLocationId === loc.id ? "text-primary" : ""}`}
                    >
                      {loc.name || loc.address || "Location"}
                    </p>
                    {loc.address && loc.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {loc.address}
                      </p>
                    )}
                    {loc.isActive === false && (
                      <p className="mt-1 text-[11px] font-medium text-amber-700">
                        Inactive location
                      </p>
                    )}
                  </div>
                  {selectedLocationId === loc.id && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Consultation Mode
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              {
                value: "IN_PERSON",
                label: "In-Person",
                desc: "Visit the clinic",
                icon: <Building className="size-5" />,
              },
              {
                value: "VIDEO",
                label: "Video Call",
                desc: "Remote consultation",
                icon: <Video className="size-5" />,
              },
            ] as const
          ).map(({ value, label, desc, icon }) => (
            <button
              key={value}
              type="button"
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
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all ${
                consultationMode === value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div
                className={`size-10 rounded-xl flex items-center justify-center ${
                  consultationMode === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {icon}
              </div>
              <div className="text-center">
                <p
                  className={`text-sm font-semibold ${consultationMode === value ? "text-primary" : ""}`}
                >
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        What type of consultation do you need?
      </p>
      {isPrivilegedScheduler && (
        <div className="gap-y-3 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Patient
              </p>
              <p className="text-sm text-muted-foreground">
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
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
              placeholder="Search by patient name, phone, or email"
              className="h-11 pl-10"
            />
          </div>

          {locationsFetching && locations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Refreshing location data in the background.
            </p>
          )}

          <div className="max-h-60 gap-y-2 overflow-y-auto pr-1">
            {filteredPatientsList.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                No patient matches the search.
              </div>
            ) : (
              filteredPatientsList.map((patient: any) => {
                const patientId = patient.userId || patient.id;
                const isSelected = selectedPatientId === patientId;
                return (
                  <button
                    key={patientId}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(patientId);
                      setRecentlyCreatedPatient(null);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "border-border bg-card hover:border-emerald-300 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String(patient.displayName || "P")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-semibold ${isSelected ? "text-emerald-700 dark:text-emerald-300" : ""}`}
                      >
                        {patient.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {patient.phone || "No phone"}
                        {patient.email ? ` - ${patient.email}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="size-4 text-emerald-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {showQuickCreatePatient && (
            <Card className="border-emerald-200/70 bg-background/80 shadow-sm dark:border-emerald-900/50">
              <CardContent className="gap-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="font-semibold">Register Patient</p>
                    <p className="text-xs text-muted-foreground">
                      This creates the patient identity and profile, then
                      returns you to booking.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="gap-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <div className="gap-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <div className="gap-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <div className="gap-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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

                <div className="flex items-center justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                      Additional Details
                    </p>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
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
                    className="h-8 gap-2 rounded-lg px-3 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-100"
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="gap-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    <div className="gap-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleCreateQuickPatient}
                    disabled={quickRegisterPatientMutation.isPending}
                  >
                    {quickRegisterPatientMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Creatingâ€¦
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
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <span className="font-semibold">
                Booking for {selectedPatient.displayName}
              </span>
              {selectedPatient.phone ? (
                <span className="ml-2 opacity-80">
                  - {selectedPatient.phone}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              Select or create a patient to continue booking.
            </div>
          )}
        </div>
      )}
      {servicesLoading ? (
        <div className="gap-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setServiceFilter(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              serviceFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="gap-y-2">
        {!servicesLoading && filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
            <Activity className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No services available for this mode</p>
          </div>
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
            className={`w-full text-left p-4 rounded-2xl border transition-all group ${
              selectedServiceId === t.treatmentType
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${getConsultationVisual(t.treatmentType).color}`}
              >
                {getConsultationVisual(t.treatmentType).icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm">
                    {t.label || t.treatmentType}
                  </p>
                  {selectedServiceId === t.treatmentType && (
                    <Check className="size-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
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
  doctorsList: any[];
  selectedLocationId: string;
  selectedDoctorId: string;
  setSelectedDoctorId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  setSelectedSlot: React.Dispatch<React.SetStateAction<string>>;
  goNext: () => void;
  goBack: () => void;
}

function BookAppointmentStep2({
  doctorsLoading,
  doctorsFetched,
  doctorsList,
  selectedLocationId,
  selectedDoctorId,
  setSelectedDoctorId,
  setSelectedDate,
  setSelectedSlot,
  goNext,
  goBack,
}: BookAppointmentStep2Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Choose your preferred doctor
      </p>
      {doctorsLoading || !doctorsFetched ? (
        <div className="gap-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : doctorsList.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-start gap-3">
            <User className="mt-0.5 size-5 shrink-0" />
            <div className="gap-y-1">
              <p className="font-semibold">No doctors available</p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                {selectedLocationId
                  ? "This location does not currently have any bookable doctors for the selected mode."
                  : "Please select a location to see available doctors."}
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                Try another location or contact the clinic for help.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-9 rounded-lg"
                onClick={goBack}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="gap-y-2">
          {doctorsList.map((doctor: any) => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => {
                setSelectedDoctorId(doctor.id);
                setSelectedDate(getTodayIST());
                setSelectedSlot("");
                setTimeout(goNext, 150);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedDoctorId === doctor.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div
                className={`relative size-11 overflow-hidden rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                  selectedDoctorId === doctor.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {doctor.image ? (
                  <Image
                    src={doctor.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                ) : (
                  (doctor.name || "D").charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold text-sm ${selectedDoctorId === doctor.id ? "text-primary" : ""}`}
                >
                  {doctor.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doctor.specialization || "General Physician"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  Available
                </span>
              </div>
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
}

function BookAppointmentStep3({
  selectedDate,
  setSelectedDate,
  setSelectedSlot,
  goNext,
  isClinicClosedDate,
}: BookAppointmentStep3Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Pick your preferred appointment date
      </p>
      <div className="flex justify-center w-full max-w-sm mx-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            setSelectedDate(d);
            setSelectedSlot("");
            if (d) {
              setTimeout(goNext, 150);
            }
          }}
          disabled={(date) => {
            const todayIST = getTodayIST();
            return date < todayIST || isClinicClosedDate(date);
          }}
          className="border border-border/50 shadow-sm p-2 sm:p-3 mx-auto max-w-[280px] sm:max-w-xs [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)] text-sm [&_.rdp-caption_label]:text-sm [&_.rdp-button]:text-sm"
        />
      </div>
      {selectedDate && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 max-w-sm mx-auto w-full justify-center mt-2">
          <CalendarIcon className="size-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">
            {format(selectedDate, "EEEE, d MMMM yyyy")}
          </span>
        </div>
      )}
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
  selectedDoctor?: { name?: string } | null;
  selectedSlotLabel: string;
}

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
  selectedDoctor,
  selectedSlotLabel,
}: BookAppointmentStep4Props) {
  const periods = [
    {
      key: "morning" as const,
      label: "Morning",
      icon: <Sun className="size-4" />,
      range: "Before 12pm",
      slots: slotGroups.morning,
    },
    {
      key: "afternoon" as const,
      label: "Afternoon",
      icon: <CloudSun className="size-4" />,
      range: "12pm â‚¬Å“ 5pm",
      slots: slotGroups.afternoon,
    },
    {
      key: "evening" as const,
      label: "Evening",
      icon: <Moon className="size-4" />,
      range: "After 5pm",
      slots: slotGroups.evening,
    },
  ];
  const visiblePeriods = periods.filter((period) => period.slots.length > 0);
  const hasAvailabilityError = Boolean(availabilityError);

  if (consultationMode === "VIDEO") {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 p-3 gap-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Select 1 slot
              </p>
              <p className="text-[11px] text-muted-foreground">
                15 min call within clinic video hours.
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-primary/12 text-primary px-2.5 py-1 text-[11px] font-bold border border-primary/15">
              {selectedSlot ? "1/1" : "0/1"}
            </div>
          </div>

          {showLiveSyncBanner ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  liveSyncClasses,
                )}
              >
                {liveSyncMode === "live" ? (
                  <Wifi className="size-3.5" />
                ) : (
                  <WifiOff className="size-3.5" />
                )}
                {liveSyncLabel}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {liveSyncDescription}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-1 rounded-full border border-blue-200/70 dark:border-blue-900">
              <Video className="size-3" /> Video
            </span>
            <span className="inline-flex items-center gap-1 font-medium bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300 px-2 py-1 rounded-full border border-slate-200/70 dark:border-slate-800">
              <Clock className="size-3" />
              {clinicVideoCallWindow
                ? `${clinicVideoCallWindow.start}-${clinicVideoCallWindow.end}`
                : "Hours loading"}
            </span>
            <span className="inline-flex items-center gap-1 font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 px-2 py-1 rounded-full border border-violet-200/70 dark:border-violet-900">
              <CalendarIcon className="size-3" />{" "}
              {selectedDate ? format(selectedDate, "d MMM") : ""}
            </span>
            <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-1 rounded-full border border-amber-200/70 dark:border-amber-900">
              <Clock className="size-3" /> {appointmentDurationMinutes} min
            </span>
            {selectedSlot ? (
              <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-1 rounded-full border border-emerald-200/70 dark:border-emerald-900">
                <CheckCircle className="size-3" /> Selected {selectedSlot}
              </span>
            ) : null}
          </div>

          {clinicVideoCallWindow ? (
            <p className="text-[11px] text-muted-foreground">
              Video slots are available only within{" "}
              {clinicVideoCallWindow.start} - {clinicVideoCallWindow.end}.
            </p>
          ) : null}

          {selectedSlot ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30 px-3 py-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <CheckCircle className="size-4" />
                <span className="text-sm font-semibold">
                  Selected slot: {selectedSlot}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                {selectedDate ? format(selectedDate, "d MMM yyyy") : ""} Ã‚Â·{" "}
                {appointmentDurationMinutes} min video call
              </p>
            </div>
          ) : null}

          {selectedSlot && (
            <button
              type="button"
              onClick={() => setSelectedSlot("")}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Clear selected slot
            </button>
          )}
        </div>

        {!shouldLoadAvailability ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
            <Video className="size-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">
              Select a doctor and date to load availability
            </p>
            <p className="text-xs mt-1 opacity-60">
              Availability will appear automatically once the doctor, clinic,
              and date are selected.
            </p>
          </div>
        ) : showAvailabilityLoader ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
            <Loader2 className="size-5 animate-spin" /> Checking video
            availabilityâ€¦
          </div>
        ) : effectiveSlots.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
            <Video className="size-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">
              {consultationBlocked
                ? "Video consultation currently unavailable"
                : "No video slots available"}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {consultationBlocked
                ? restrictions.reason ||
                  "Clinic/doctor settings currently block this consultation type"
                : "Try a different date or doctor"}
            </p>
            {hasAvailabilityError && (
              <p className="text-xs mt-4 p-2 bg-red-500/10 rounded-md text-red-500 border border-red-500/20 max-w-[90%] text-center">
                Error: {(availabilityError as any).message || "Unknown error"}
              </p>
            )}
          </div>
        ) : (
          <div className="gap-y-4">
            {visiblePeriods.map((period) => (
              <div
                key={period.key}
                className="transition-all duration-200 ease-out"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-muted-foreground">{period.icon}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {period.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    ({period.range})
                  </span>
                  <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {period.slots.length} slots
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {period.slots.map((slot) => {
                    const isSelected = selectedSlot === slot;

                    return (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSelectedSlot(slot);
                        }}
                        className={`py-2 px-2 rounded-lg border transition-all text-center flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/30 scale-[1.01]"
                            : "bg-card border-border hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        <span className="text-xs font-semibold">{slot}</span>
                        <span
                          className={`text-[9px] font-medium ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                        >
                          {isSelected
                            ? `Selected  ${appointmentDurationMinutes} min`
                            : `${appointmentDurationMinutes} min`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Available slots for{" "}
          <span className="font-semibold text-foreground">
            {selectedDoctor?.name}
          </span>{" "}
          on{" "}
          <span className="font-semibold text-foreground">
            {selectedDate ? format(selectedDate, "d MMM") : ""}
          </span>
        </p>
        {showLiveSyncBanner ? (
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                liveSyncClasses,
              )}
            >
              {liveSyncMode === "live" ? (
                <Wifi className="size-3.5" />
              ) : (
                <WifiOff className="size-3.5" />
              )}
              {liveSyncLabel}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {liveSyncDescription}
            </span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            <Clock className="size-3" /> {appointmentDurationMinutes} min per
            slot
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
            20 slots / hour
          </span>
          {selectedSlot ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <CheckCircle className="size-3" /> {selectedSlotLabel}
            </span>
          ) : null}
        </div>
      </div>

      {!shouldLoadAvailability ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
          <Clock className="size-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">
            Select a doctor and date to load availability
          </p>
          <p className="text-xs mt-1 opacity-60">
            Availability will appear automatically once the doctor, clinic, and
            date are selected.
          </p>
        </div>
      ) : showAvailabilityLoader ? (
        <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
          <Loader2 className="size-5 animate-spin" /> Checking availabilityâ€¦
        </div>
      ) : effectiveSlots.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
          <Clock className="size-8 mb-2 opacity-20" />
          <p className="text-sm font-medium">
            {consultationBlocked
              ? "Consultation currently unavailable"
              : "No slots available"}
          </p>
          <p className="text-xs mt-1 opacity-60">
            {consultationBlocked
              ? restrictions.reason ||
                "Clinic/doctor settings currently block this consultation type"
              : "Try a different date or doctor"}
          </p>
          {hasAvailabilityError && (
            <p className="text-xs mt-4 p-2 bg-red-500/10 rounded-md text-red-500 border border-red-500/20 max-w-[90%] text-center">
              Error: {(availabilityError as any).message || "Unknown error"}
            </p>
          )}
        </div>
      ) : (
        <div className="gap-y-4">
          {visiblePeriods.map((period) => (
            <div
              key={period.key}
              className="transition-all duration-200 ease-out"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-muted-foreground">{period.icon}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {period.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({period.range})
                </span>
                <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {period.slots.length} slots
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {period.slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      setSelectedSlot(slot);
                    }}
                    className={`py-2 px-2 rounded-xl border transition-all text-center flex flex-col items-center gap-0.5 ${
                      selectedSlot === slot
                        ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                        : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <span className="text-xs font-semibold">{slot}</span>
                    <span
                      className={`text-[9px] font-medium ${selectedSlot === slot ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {appointmentDurationMinutes} min
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
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
}: BookAppointmentStep5Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Review your appointment before confirming
      </p>

      <div className="rounded-2xl border bg-muted/30 divide-y">
        {[
          ...(userRole === "RECEPTIONIST"
            ? [
                {
                  label: "Patient",
                  value: selectedPatient?.displayName || "Select patient",
                },
              ]
            : []),
          {
            label: "Service",
            value: selectedService?.label,
            sub: selectedService?.category,
          },
          {
            label: "Doctor",
            value: selectedDoctor?.name,
            sub: selectedDoctor?.specialization || "General Physician",
          },
          {
            label: "Date",
            value: selectedDate
              ? format(selectedDate, "EEEE, d MMMM yyyy")
              : "",
          },
          { label: "Time", value: selectedSlot },
          { label: "Duration", value: `${appointmentDurationMinutes} min` },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 gap-4"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 shrink-0">
              {label}
            </span>
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {consultationMode === "VIDEO" && shouldCollectVideoPayment && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 gap-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
              Video visit fee
            </p>
            <p className="text-lg font-bold text-foreground">
              INR {videoPaymentAmount.toFixed(0)}
            </p>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Accept the booking terms below, then confirm to create the
            appointment and open payment.
          </p>
          <div className="rounded-xl border border-amber-200 bg-white/80 dark:border-amber-900 dark:bg-amber-950/20 p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="video-payment-policy"
                checked={acceptedVideoPaymentPolicy}
                onCheckedChange={(checked) =>
                  setAcceptedVideoPaymentPolicy(checked === true)
                }
                className="mt-0.5"
              />
              <div className="gap-y-1">
                <Label
                  htmlFor="video-payment-policy"
                  className="text-sm font-semibold leading-snug text-foreground"
                >
                  I accept the video appointment terms and privacy policy
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Video appointment payments are non-refundable. If you miss the
                  appointment, you must rebook a new slot.
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Read our{" "}
                  <Link
                    href="/terms"
                    prefetch={false}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    prefetch={false}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
          {bookedAppointmentId &&
          requiresVideoPayment &&
          !videoPaymentCompleted ? (
            <PaymentButton
              appointmentId={bookedAppointmentId}
              appointmentType="VIDEO_CALL"
              clinicId={activeClinicId}
              amount={videoPaymentAmount}
              description={selectedService?.label || "Video consultation"}
              className="w-full"
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
          ) : null}
        </div>
      )}

      {needsSubscriptionPlan && (
        <div
          className={`rounded-2xl border p-4 gap-y-2 ${
            needsSubscriptionPlan
              ? "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30"
              : "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30"
          }`}
        >
          <p
            className={`text-sm font-semibold ${
              needsSubscriptionPlan
                ? "text-amber-800 dark:text-amber-200"
                : "text-blue-800 dark:text-blue-200"
            }`}
          >
            {isSubscriptionGateLoading
              ? "Checking your plan"
              : needsSubscriptionPlan
                ? "Plan required"
                : "Plan check"}
          </p>
          <p
            className={`text-xs ${
              needsSubscriptionPlan
                ? "text-amber-700 dark:text-amber-300"
                : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {isSubscriptionGateLoading
              ? "Weâ€žÂ¢re checking your plan before booking this in-person appointment."
              : needsSubscriptionPlan
                ? "You need an active plan for this clinic to continue."
                : "Weâ€žÂ¢ll verify your plan before confirming this appointment."}
          </p>
        </div>
      )}

      <div className="gap-y-3">
        <div>
          <label
            htmlFor="book-appointment-chief-complaint"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
          >
            Chief Complaint
          </label>
          <Textarea
            id="book-appointment-chief-complaint"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for visit..."
            className="text-sm resize-none h-20"
          />
        </div>
        <div>
          <label
            htmlFor="book-appointment-urgency"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block"
          >
            Urgency
          </label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger id="book-appointment-urgency" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low"> Low - Routine checkup</SelectItem>
              <SelectItem value="Normal"> Normal - Regular visit</SelectItem>
              <SelectItem value="High"> High - Urgent care needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
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
}

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
}: BookAppointmentStep6Props) {
  const isVideoMode = consultationMode === "VIDEO";

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="size-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <Check className="size-7 text-green-600 dark:text-green-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">
          {isVideoMode && requiresVideoPayment && !videoPaymentCompleted
            ? "Complete Payment"
            : isVideoMode
              ? "Congratulations! Appointment confirmed"
              : "Appointment Booked!"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isVideoMode && requiresVideoPayment && !videoPaymentCompleted
            ? "Your selected time is saved. Pay below to book the video appointment."
            : isVideoMode
              ? "Your payment is complete and the appointment is confirmed."
              : "Your appointment has been booked successfully."}
        </p>
      </div>

      {isVideoMode ? (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card w-full max-w-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Video className="size-4" />
            {requiresVideoPayment && !videoPaymentCompleted
              ? "Payment required"
              : "Video Appointment Ready"}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {requiresVideoPayment && !videoPaymentCompleted
              ? "Your appointment is created. Complete payment from the confirm screen to finish booking."
              : "Your video appointment is booked. You can track the status from your appointments page."}
          </p>
          <div className="w-full rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-center text-sm text-blue-700 dark:text-blue-300">
            Selected slot: {selectedSlot || "None"}
          </div>
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/30 p-3 text-center text-xs text-slate-700 dark:text-slate-300">
            {clinicVideoCallWindow
              ? `Video hours: ${clinicVideoCallWindow.start} - ${clinicVideoCallWindow.end}`
              : "Video hours are configured at the clinic level."}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border bg-card w-full max-w-sm">
          <div className="flex justify-center size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center mx-auto mb-1">
            <QrCode className="size-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <h4 className="text-base font-semibold text-foreground">
              Check-in QR
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedService?.label || "Appointment"} with{" "}
              {selectedDoctor?.name || "doctor"} on{" "}
              {selectedDate ? format(selectedDate, "d MMM") : ""}
            </p>
          </div>
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center">
            <div className="text-sm font-medium text-muted-foreground">
              QR code will appear here
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isPatientInPersonFlow && (
              <Button
                className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-glow-subtle transition-all active:scale-95"
                onClick={() => {
                  handleOpenChange(false);
                  if (pathname !== patientCheckInRoute) {
                    push(patientCheckInRoute);
                  }
                }}
              >
                Open Check-in Page
              </Button>
            )}

            {!isVideoMode && (
              <Button
                variant={isPatientInPersonFlow ? "outline" : "default"}
                className={`w-full h-12 rounded-xl font-semibold transition-all active:scale-95 ${
                  isPatientInPersonFlow
                    ? "border-border/50 hover:bg-accent/50"
                    : "bg-primary hover:bg-primary/90 text-white shadow-glow-subtle hover:shadow-glow-medium"
                }`}
                onClick={() => {
                  handleOpenChange(false);
                  if (pathname !== postBookingRoute) {
                    push(postBookingRoute);
                  }
                }}
              >
                {isPatientInPersonFlow
                  ? "View Check-in Status"
                  : postBookingLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

//  Component â‚â‚

/**
 * Helper to get Today in IST (India Standard Time)
 * Ensures frontend and backend agree on what 'Today' is, regardless of browser timezone.
 */
const getTodayIST = () => {
  const now = new Date();
  const [year, month, day] = IST_DATE_FORMATTER.format(now)
    .split("-")
    .map(Number);
  return new Date(
    year ?? now.getFullYear(),
    (month ?? 1) - 1,
    day ?? now.getDate(),
  );
};

const formatDateIST = (date: Date) => IST_DATE_FORMATTER.format(date);

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
  const { data: myClinic } = useMyClinic();
  const clinicFallbackId = APP_CONFIG.CLINIC.ID?.trim() || "";
  const sessionClinicId = session?.user?.clinicId || "";
  const safeContextClinicId = contextClinicId || "";

  const authClinicId =
    clinicId ||
    sessionClinicId ||
    safeContextClinicId ||
    currentClinicId ||
    clinicFallbackId;  // Always allow fallback to default clinic for all roles
  const resolvedClinicId = authClinicId;
  const hasExplicitClinicId = !!resolvedClinicId;
  const activeClinicId =
    resolvedClinicId || clinicFallbackId;  // Always allow fallback for all roles

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
      selectedServiceId: initialServiceId || "",
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
  // â‚â‚ Selections â‚â‚
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
  const resetBookingFlowState = useCallback(() => {
    dispatchBookingFlow({
      type: "resetBookingFlow",
      payload: createBookingFlowState(),
    });
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
  }, [createBookingFlowState]);
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
  const quickRegisterPatientMutation = useQuickRegisterPatient();
  const resolveAppointmentId = useCallback((appointment: unknown) => {
    if (!appointment || typeof appointment !== "object") {
      return "";
    }

    const record = appointment as Record<string, unknown>;
    return String(record.appointmentId || record.id || "");
  }, []);
  const launchVideoPayment = useCallback(
    async (appointmentId: string) => {
      const paymentResponse = await createPaymentIntent({
        appointmentId,
        appointmentType: "VIDEO_CALL",
      });

      if (!paymentResponse.success || !paymentResponse.paymentIntent) {
        throw new Error(
          paymentResponse.error ||
            paymentResponse.message ||
            "Failed to create payment intent",
        );
      }

      const paymentIntent = paymentResponse.paymentIntent as Record<
        string,
        unknown
      >;
      const metadata =
        (paymentIntent?.metadata as Record<string, unknown>) || {};
      const providerResponse =
        (paymentIntent?.providerResponse as Record<string, unknown>) || {};
      const providerResponseMeta =
        (providerResponse?.order_meta as Record<string, unknown>) ||
        (providerResponse?.orderMeta as Record<string, unknown>) ||
        {};
      const providerFromIntent =
        typeof paymentIntent?.provider === "string"
          ? paymentIntent.provider.toLowerCase()
          : undefined;
      const usedProvider =
        providerFromIntent && isPaymentProviderEnabled(providerFromIntent)
          ? providerFromIntent
          : DEFAULT_PAYMENT_PROVIDER;

      if (!isPaymentProviderEnabled(usedProvider)) {
        throw new Error(`Payment provider '${usedProvider}' is not enabled`);
      }

      if (usedProvider !== "cashfree") {
        throw new Error(
          `Provider '${usedProvider}' is enabled but SDK handler is not implemented yet`,
        );
      }

      const cashfreeMode =
        process.env.NEXT_PUBLIC_CASHFREE_MODE === "production"
          ? "production"
          : process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox"
            ? "sandbox"
            : process.env.NODE_ENV === "production"
              ? "production"
              : "sandbox";

      const orderId =
        (paymentIntent?.orderId as string) ||
        (paymentIntent?.paymentId as string) ||
        (paymentIntent?.id as string) ||
        (providerResponse?.order_id as string) ||
        (providerResponse?.orderId as string) ||
        (metadata?.orderId as string) ||
        (providerResponseMeta?.order_id as string);
      const paymentSessionId =
        (paymentIntent?.paymentSessionId as string) ||
        (metadata?.paymentSessionId as string) ||
        (providerResponse?.payment_session_id as string) ||
        (providerResponse?.paymentSessionId as string);
      const redirectUrl =
        (paymentIntent?.redirectUrl as string) ||
        (metadata?.redirectUrl as string) ||
        (providerResponseMeta?.payment_link as string) ||
        (providerResponse?.payment_link as string);
      if (!orderId) {
        throw new Error("Order ID not received from server");
      }

      const resolvedClinicId =
        activeClinicId ||
        (paymentIntent?.clinicId as string) ||
        (metadata?.clinicId as string) ||
        (await getClinicId()) ||
        APP_CONFIG.CLINIC.ID;

      if (!resolvedClinicId) {
        throw new Error("Clinic context is required for payment verification");
      }

      const cashfree = await load({ mode: cashfreeMode });
      if (!cashfree) {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        throw new Error("Cashfree SDK is not available");
      }

      if (!paymentSessionId) {
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return;
        }
        throw new Error("Cashfree payment session is missing");
      }

      const result = await cashfree.checkout({
        paymentSessionId,
        orderId,
        redirectTarget: "_self",
      });

      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      const verifyResponse = await verifyPaymentCallback({
        clinicId: resolvedClinicId,
        paymentId: orderId,
        orderId,
        provider: usedProvider as typeof DEFAULT_PAYMENT_PROVIDER,
      });

      if (!verifyResponse.success) {
        throw new Error(
          verifyResponse.error ||
            verifyResponse.message ||
            "Payment verification failed",
        );
      }

      const billingQueryKeys = [
        ["invoices"],
        ["clinic-invoices"],
        ["payments"],
        ["clinic-payments"],
        ["subscriptions"],
        ["clinic-subscriptions"],
        ["active-subscription"],
        ["clinic-ledger"],
        ["billing-analytics"],
      ] as const;

      billingQueryKeys.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });
      syncAppointmentInCache(
        queryClient,
        { id: appointmentId, status: "CONFIRMED" },
        {
          appointmentStatus: "CONFIRMED",
          queryKeys: [
            ["myAppointments"],
            ["appointments"],
            ["userUpcomingAppointments"],
            ["appointment", appointmentId],
            ["video-appointments"],
            ["video-appointment", appointmentId],
          ],
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["myAppointments"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["video-appointments"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["video-appointment", appointmentId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["userUpcomingAppointments"],
        exact: false,
      });

      setRequiresVideoPayment(false);
      setVideoPaymentCompleted(true);
      setStep(STEP_ORDER.length);
      onBooked?.();
      showSuccessToast("Payment verified.", { id: TOAST_IDS.PAYMENT.SUCCESS });
    },
    [
      activeClinicId,
      onBooked,
      queryClient,
      setRequiresVideoPayment,
      setVideoPaymentCompleted,
      setStep,
    ],
  );

  //  Queries â‚
  const {
    data: activeLocations = [],
    isPending: locationsLoading,
    isFetching: locationsFetching,
    isFetched: activeLocationsFetched,
    error: activeLocationsError,
  } = useActiveLocations(
    activeClinicId,
    shouldLoadLocations ? { enabled: true } : undefined,
  );
  const {
    data: allLocations = [],
    isPending: allLocationsLoading,
    isFetched: allLocationsFetched,
    error: allLocationsError,
  } = useClinicLocations(activeClinicId, {
    includeInactive: true,
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
  const shouldLoadDoctors =
    dialogOpen &&
    !!activeClinicId &&
    (consultationMode === "VIDEO" || !!resolvedLocationId);
  const {
    data: doctorsData,
    isPending: doctorsLoading,
    isFetched: doctorsFetched,
    error: doctorsError,
  } = useDoctors(
    activeClinicId,
    consultationMode === "VIDEO"
      ? undefined
      : {
          locationId: resolvedLocationId,
        },
    shouldLoadDoctors ? { enabled: true } : undefined,
  );
  // Only RECEPTIONIST needs the full patient list to select a patient.
  // Patients book for themselves â‚ calling this admin endpoint as a PATIENT
  // returns 403 Forbidden. Pass an empty clinicId to disable the query.
  const { data: patientsData = [] } = usePatients(
    isPrivilegedScheduler ? activeClinicId : "",
    { limit: 200, isActive: true },
    shouldLoadPatients ? { enabled: true } : undefined,
  );
  const { data: currentPatientProfile } = useUserProfile();
  const profileCompletionBlocked = useMemo(
    () =>
      session?.user?.profileComplete === false ||
      isProfileCompletionError(activeLocationsError) ||
      isProfileCompletionError(allLocationsError) ||
      isProfileCompletionError(doctorsError),
    [
      activeLocationsError,
      allLocationsError,
      doctorsError,
      session?.user?.profileComplete,
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

  const clinicVideoCallWindow = useMemo(() => {
    const normalizeWindowTime = (value: unknown): string | null => {
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(trimmed) ? trimmed : null;
    };

    const clinicSettings = myClinic?.settings as unknown as
      | Record<string, unknown>
      | undefined;
    const appointmentSettings = clinicSettings?.appointmentSettings;
    if (
      !appointmentSettings ||
      typeof appointmentSettings !== "object" ||
      Array.isArray(appointmentSettings)
    ) {
      return null;
    }

    const windowValue = (appointmentSettings as Record<string, unknown>)
      .videoCallWindow;
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
  }, [myClinic]);
  const clinicHolidayClosures = useMemo(() => {
    const clinicSettings =
      (myClinic?.settings as Record<string, unknown> | undefined) || {};
    const appointmentSettings = clinicSettings.appointmentSettings;
    if (
      !appointmentSettings ||
      typeof appointmentSettings !== "object" ||
      Array.isArray(appointmentSettings)
    ) {
      return new Set<string>();
    }

    const closures = new Set<string>();
    const addDate = (value: unknown) => {
      if (typeof value !== "string") return;
      const trimmed = value.trim();
      if (!trimmed) return;
      const normalized = formatISODateInIST(new Date(trimmed));
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        closures.add(normalized);
      }
    };

    const appointmentSettingsRecord = appointmentSettings as Record<
      string,
      unknown
    >;
    const rawClosures = appointmentSettingsRecord.holidayClosures;
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

    const legacyHolidayDates = appointmentSettingsRecord.holidayDates;
    if (Array.isArray(legacyHolidayDates)) {
      legacyHolidayDates.forEach(addDate);
    }

    return closures;
  }, [myClinic]);
  const clinicOperatingDays = useMemo(() => {
    const clinicSettings =
      (myClinic?.settings as Record<string, unknown> | undefined) || {};
    const appointmentSettings = clinicSettings.appointmentSettings;
    if (
      !appointmentSettings ||
      typeof appointmentSettings !== "object" ||
      Array.isArray(appointmentSettings)
    ) {
      return null;
    }

    const appointmentSettingsRecord = appointmentSettings as Record<
      string,
      unknown
    >;
    const operatingWindows = appointmentSettingsRecord.operatingWindowsByDay;
    if (
      !operatingWindows ||
      typeof operatingWindows !== "object" ||
      Array.isArray(operatingWindows)
    ) {
      return null;
    }

    return operatingWindows as Record<string, unknown>;
  }, [myClinic]);
  const isClinicClosedDate = useCallback(
    (date: Date) => {
      const dayKey = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][date.getDay()];
      if (!dayKey) {
        return false;
      }

      if (clinicOperatingDays) {
        const dayWindows = clinicOperatingDays[dayKey];
        const hasOpenWindow = Array.isArray(dayWindows)
          ? dayWindows.some((window) => {
              if (
                !window ||
                typeof window !== "object" ||
                Array.isArray(window)
              ) {
                return false;
              }

              const record = window as Record<string, unknown>;
              const start =
                typeof record.start === "string" ? record.start.trim() : "";
              const end =
                typeof record.end === "string" ? record.end.trim() : "";
              return !!start && !!end && start < end;
            })
          : false;

        if (!hasOpenWindow) {
          return true;
        }
      }

      return clinicHolidayClosures.has(formatISODateInIST(date));
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

  //  Derived â‚
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

  const doctorsList: any[] = useMemo(() => {
    // The GET /doctors API returns User records with a nested `doctor` relation:
    // { id: userId, name, doctor: { id: doctorId, specialization, ... } }
    // We need to normalize this so `d.id` = the Doctor entity ID (not User ID)
    const normalize = (users: any[]) =>
      users.map((u) => ({
        ...u,
        // Expose the Doctor entity's id as the primary id for availability/booking
        id: u.doctor?.id || u.id,
        userId: u.id, // Keep user id separately
        name: u.name || u.doctor?.user?.name || `Dr. ${u.id?.slice(0, 6)}`,
        specialization: u.doctor?.specialization || u.specialization || "",
        image:
          u.profilePicture || u.doctor?.user?.profilePicture || u.image || "",
      }));

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors))
      return normalize((doctorsData as any).data.doctors);
    if (Array.isArray((doctorsData as any)?.data))
      return normalize((doctorsData as any).data);
    const raw = (doctorsData as any)?.doctors || [];
    return normalize(raw);
  }, [doctorsData]);

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

  const dateString = useMemo(
    () => (selectedDate ? formatDateIST(selectedDate) : ""),
    [selectedDate],
  );

  const availabilityRefetchIntervalMs =
    consultationMode === "VIDEO"
      ? 5000
      : step >= 3 && !isConnected
        ? 10000
        : undefined;
  const availabilityQueryKey = useMemo(
    () => [
      "doctorAvailability",
      activeClinicId,
      resolvedDoctorId,
      dateString,
      consultationMode === "VIDEO" ? undefined : resolvedLocationId,
      consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON",
    ],
    [
      activeClinicId,
      resolvedDoctorId,
      dateString,
      resolvedLocationId,
      consultationMode,
    ],
  );

  const shouldLoadAvailability =
    dialogOpen &&
    !!activeClinicId &&
    !!resolvedDoctorId &&
    !!dateString &&
    (consultationMode === "VIDEO" || !!resolvedLocationId);
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
      ...(shouldLoadAvailability ? { enabled: true } : {}),
      ...(availabilityRefetchIntervalMs
        ? { refetchIntervalMs: availabilityRefetchIntervalMs }
        : {}),
    },
  );
  const showAvailabilityLoader =
    shouldLoadAvailability &&
    availabilityLoading &&
    !availability &&
    !availabilityError;
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
      patientsList.find(
        (patient: any) => (patient.userId || patient.id) === selectedPatientId,
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

    // currentPatientProfile is a User object with nested patient object
    // We need the Patient entity ID (patient.id), not the User ID
    const patientRecordId =
      (currentPatientProfile as any)?.patient?.id ||
      (currentPatientProfile as any)?.patientId;

    if (!patientRecordId) {
      console.warn(
        "[BookAppointmentDialog] Patient profile not found or missing patient.id",
        {
          hasProfile: !!currentPatientProfile,
          userId: session?.user?.id,
          profileKeys: currentPatientProfile
            ? Object.keys(currentPatientProfile)
            : [],
        },
      );
    }

    return patientRecordId || "";
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

      if (stepId === "doctor") {
        return hasMultipleDoctors;
      }

      return true;
    });
  }, [consultationMode, doctorsList.length, doctorsLoading, videoOnly]);

  const currentStep = Math.max(1, Math.min(step, activeSteps.length || 1));
  const currentStepIndex = currentStep - 1;
  const currentStepId = activeSteps[currentStepIndex] ?? "success";
  const isSuccessStep = currentStepId === "success";
  const visibleStepCount = activeSteps.length || 1;
  const progressValue =
    visibleStepCount <= 1
      ? 100
      : (currentStepIndex / (visibleStepCount - 1)) * 100;
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
        ? "Consultation Mode"
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

  const effectiveSlots = useMemo(() => {
    if (consultationBlocked) {
      return [];
    }

    const baseSlots = slots as string[];
    if (consultationMode !== "VIDEO" || !clinicVideoCallWindow) {
      return baseSlots;
    }

    return baseSlots.filter(isSlotWithinClinicVideoWindow);
  }, [
    clinicVideoCallWindow,
    consultationBlocked,
    consultationMode,
    isSlotWithinClinicVideoWindow,
    slots,
  ]);
  const validateLatestAvailability = useCallback(async () => {
    const refreshed = await refetchAvailability({ cancelRefetch: true });
    const refreshedSlots = extractAvailabilitySlots(
      refreshed?.data ?? queryClient.getQueryData(availabilityQueryKey),
    );

    return refreshedSlots;
  }, [
    availabilityQueryKey,
    extractAvailabilitySlots,
    queryClient,
    refetchAvailability,
  ]);

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
    return `${activeSelectedSlot} · ${appointmentDurationMinutes} min`;
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

  //  Book appointment â‚â‚
  const handleBook = useCallback(async () => {
    const selectedSlot = activeSelectedSlot;
    const appointmentDoctorId = resolvedDoctorId;
    const appointmentLocationId = resolvedLocationId;

    console.info("[BookAppointmentDialog] Confirm click", {
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
              profileUpdateResult.error ||
                "Patient profile is incomplete. Please complete your profile first.",
            );
          }
        }

        const refreshedProfile = (await queryClient.fetchQuery({
          queryKey: ["userProfile"],
          queryFn: async () => await getUserProfile(),
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
      const freshSlots = await withTimeout(
        validateLatestAvailability(),
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

        console.info("[BookAppointmentDialog] Creating video appointment", {
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
        });

        console.info(
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
        queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.invalidateQueries({
          queryKey: ["userUpcomingAppointments"],
        });
        queryClient.invalidateQueries({
          queryKey: getAppointmentStatsQueryKey(activeClinicId),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: ["appointment", createdAppointmentId],
        });
        if (shouldCollectVideoPayment) {
          setRequiresVideoPayment(true);
          setVideoPaymentCompleted(false);
          setAcceptedVideoPaymentPolicy(true);
          showInfoToast(
            "Appointment created. Complete payment in the confirm screen to finish booking.",
          );
          await launchVideoPayment(createdAppointmentId);
          return;
        }

        onBooked?.();
        showSuccessToast(
          `Video appointment booked with ${selectedDoctor?.name || "doctor"}` +
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
              ? `Subscription coverage unavailable. Additional payment required: INR ${coverage?.paymentAmount || 0}`
              : "Subscription quota exhausted or inactive.");
          redirectToSubscriptionResolution(
            reason,
            requiresPayment ? "payments" : "subscriptions",
          );
          return;
        }
      }

      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      let apptId = "";
      if (
        finalAppointmentType === "IN_PERSON" &&
        userRole === "PATIENT" &&
        activeSubscription?.id
      ) {
        const atomicResult = await createSubscriptionAppointment({
          subscriptionId: activeSubscription.id,
          patientId: bookingPatientId,
          doctorId: appointmentDoctorId,
          clinicId: activeClinicId,
          locationId: appointmentLocationId,
          appointmentDate: appointmentDate.toISOString(),
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
          date: formatDateIST(appointmentDate),
          time: selectedSlot,
          type: finalAppointmentType,
          treatmentType: selectedService.treatmentType,
          duration: appointmentDurationMinutes,
          notes: chiefComplaint || selectedService.label,
          priority: urgency.toUpperCase() as any,
          patientId: bookingPatientId,
        };

        console.info("[BookAppointmentDialog] Creating appointment", {
          clinicId: activeClinicId,
          doctorId: resolvedDoctorId,
          date: formatDateIST(appointmentDate),
          slot: selectedSlot,
          patientId: bookingPatientId,
        });

        const appointment = await createAppointment(payload);
        console.info(
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
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"] });
      queryClient.invalidateQueries({
        queryKey: getAppointmentStatsQueryKey(activeClinicId),
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["appointment", apptId] });
      // Send appointment reminder via push + email + WhatsApp
      if (hasPermission(Permission.SEND_NOTIFICATIONS)) {
        sendReminder({ appointmentId: apptId, reminderType: "all" });
      }
      onBooked?.();
      showSuccessToast(
        `Appointment booked${selectedDoctor?.name ? ` with ${selectedDoctor.name}` : ""}` +
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
    launchVideoPayment,
    selectedDoctor?.name,
    setStep,
    activeSteps.length,
  ]);

  //  Navigation â‚
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
    if (currentStepId === "doctor") {
      return !!resolvedDoctorId || doctorsList.length === 1;
    }
    if (currentStepId === "date") return !!selectedDate;
    if (currentStepId === "slot") return !!activeSelectedSlot;
    return true;
  }, [
    consultationMode,
    currentStepId,
    doctorsList.length,
    isPrivilegedScheduler,
    locations.length,
    selectedDate,
    resolvedDoctorId,
    resolvedLocationId,
    selectedServiceId,
    activeSelectedSlot,
    selectedPatientId,
  ]);

  const goNext = useCallback(() => {
    setStepDirection("forward");
    setStep((s) => Math.min(s + 1, activeSteps.length || 1));
  }, [activeSteps.length, setStep, setStepDirection]);

  const goBack = useCallback(() => {
    setStepDirection("backward");
    setStep((s) => Math.max(s - 1, 1));
  }, [setStep, setStepDirection]);

  //  QR data â‚
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
  const RenderStep2 = BookAppointmentStep2;

  const RenderStep3 = BookAppointmentStep3;
  const RenderStep4 = BookAppointmentStep4;
  const RenderStep5 = BookAppointmentStep5;
  const RenderStep6 = BookAppointmentStep6;

  // Step 4: Slot

  //  Main render â‚

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
      case "doctor":
        return (
          <AppointmentStepWrapper className="min-h-full">
            <RenderStep2
              doctorsLoading={doctorsLoading}
              doctorsFetched={doctorsFetched}
              doctorsList={doctorsList}
              selectedLocationId={resolvedLocationId}
              selectedDoctorId={resolvedDoctorId}
              setSelectedDoctorId={setSelectedDoctorId}
              setSelectedDate={setSelectedDate}
              setSelectedSlot={setSelectedSlot}
              goNext={goNext}
              goBack={goBack}
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
              isClinicClosedDate={isClinicClosedDate}
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
              selectedDoctor={selectedDoctor}
              selectedSlotLabel={selectedSlotLabel}
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
            <Button className="flex items-center gap-2 rounded-xl border-0 bg-emerald-600 p-6 font-semibold text-white shadow-glow-subtle transition-all hover:bg-emerald-700 hover:shadow-glow-medium transform hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500/30">
              <Plus className="size-5" />
              Book Appointment
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent
        className="
        top-0 left-0 h-[100dvh] w-[100vw] max-w-none translate-x-0 translate-y-0
        flex flex-col gap-0 overflow-hidden rounded-none border-0 p-0
        md:top-1/2 md:left-1/2 md:h-[90dvh] md:w-[min(78vw,48rem)] md:max-w-2xl
        lg:top-1/2 lg:left-1/2 lg:h-[90dvh] lg:w-[min(66vw,42rem)] lg:max-w-xl
        sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border
      "
      >
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b shrink-0">
          <DialogHeader className="text-left w-full min-w-0">
            <DialogTitle className="text-base sm:text-lg font-bold truncate">
              {stepTitle}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Book an in-person or video appointment by selecting location,
              service, doctor, date, and time.
            </DialogDescription>
          </DialogHeader>

          {/* Step bar â‚ hide on success screen */}
          {!isSuccessStep && (
            <div className="mt-3 overflow-x-auto">
              <BookAppointmentStepBar
                activeSteps={activeSteps}
                step={step}
                goToStep={goToStep}
                progressValue={progressValue}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
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
                className="h-full"
              >
                {stepContent}
              </m.div>
            </AnimatePresence>
          </LazyMotion>
        </div>

        {/* Footer â‚ hide on success screen */}
        {!isSuccessStep && (
          <div className="px-4 sm:px-6 py-4 border-t bg-background flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={step > 1 ? goBack : () => handleOpenChange(false)}
              className="h-11 w-full px-6 rounded-xl border-border/50 transition-all active:scale-95 gap-2 sm:w-auto"
            >
              <ChevronLeft className="size-4" /> {step > 1 ? "Back" : "Cancel"}
            </Button>
            <div className="hidden flex-1 sm:block" />

            {currentStepId !== "confirm" ? (
              <Button
                onClick={goNext}
                disabled={!canNext}
                className="h-11 w-full px-8 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2 sm:w-auto"
              >
                Continue <ArrowRight className="size-4" />
              </Button>
            ) : (
              (() => {
                const isVideoPaymentPending =
                  consultationMode === "VIDEO" &&
                  shouldCollectVideoPayment &&
                  !!bookedAppointmentId &&
                  requiresVideoPayment &&
                  !videoPaymentCompleted;
                const isVideoConfirmDisabled =
                  consultationMode === "VIDEO"
                    ? shouldCollectVideoPayment
                      ? !acceptedVideoPaymentPolicy ||
                        isBooking ||
                        isVideoPaymentPending
                      : isBooking
                    : isCreatingInPersonAppointment ||
                      isSubscriptionGateLoading;
                const confirmLabel = isVideoPaymentPending
                  ? "Payment in progress"
                  : consultationMode === "VIDEO"
                    ? shouldCollectVideoPayment
                      ? `Create appointment and pay INR ${videoPaymentAmount.toFixed(0)}`
                      : "Book video appointment"
                    : needsSubscriptionPlan
                      ? "Choose plan to continue"
                      : "Confirm & Book";

                return (
                  <Button
                    onClick={handleBook}
                    disabled={isVideoConfirmDisabled}
                    className="h-11 w-full px-8 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2 sm:w-auto"
                  >
                    {(
                      consultationMode === "VIDEO"
                        ? isBooking
                        : isCreatingInPersonAppointment ||
                          isSubscriptionGateLoading
                    ) ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {consultationMode === "VIDEO"
                          ? "Preparing appointment..."
                          : "Checking plan..."}
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> {confirmLabel}
                      </>
                    )}
                  </Button>
                );
              })()
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
