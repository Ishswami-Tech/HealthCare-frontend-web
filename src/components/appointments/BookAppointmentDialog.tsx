"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import { usePatients, useQuickRegisterPatient } from "@/hooks/query/usePatients";
import {
  useAppointmentServices,
  useCreateAppointment,
  useDoctorAvailability,
  useProposeVideoAppointment,
} from "@/hooks/query/useAppointments";
import {
  useSubscriptions,
  useActiveSubscription,
  useCheckSubscriptionCoverage,
  useCreateInPersonAppointmentWithSubscription,
} from "@/hooks/query/useBilling";
import { useSendAppointmentReminder } from "@/hooks/query/useCommunication";
import { useActiveLocations, useClinicContext, useMyClinic } from "@/hooks/query/useClinics";
import { useWebSocketContext } from "@/app/providers/WebSocketProvider";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { getAppointmentStatsQueryKey } from "@/lib/query/appointment-query-keys";
import {
  dismissToast,
  showErrorToast,
  showSuccessToast,
} from "@/hooks/utils/use-toast";
import { Permission } from "@/types/rbac.types";
import { APP_CONFIG } from "@/lib/config/config";
import { theme } from "@/lib/utils/theme-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Activity, Plus, Leaf, Waves, Clock, Search,
  Flame, Heart, Brain, Droplets, Wind, CheckCircle,
  ChevronLeft, User, Loader2, UserPlus, AlertTriangle, Stethoscope,
  CalendarIcon, Sun, CloudSun, Moon, QrCode, Download,
  Check, ArrowRight, Video, MapPin, Building, Wifi, WifiOff,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  onBooked?: () => void;
  initialConsultationMode?: "IN_PERSON" | "VIDEO" | undefined;
  initialServiceId?: string;
  initialDoctorId?: string;
  initialPatientId?: string;
}

// ─── Consultation catalogue ──────────────────────────────────────────────────

function getConsultationVisual(treatmentType: TreatmentType): ConsultationVisual {
  const iconClass = "w-5 h-5";
  const visuals: Record<string, ConsultationVisual> = {
    GENERAL_CONSULTATION: { icon: <Activity className={iconClass} />, color: theme.badges.blue },
    FOLLOW_UP: { icon: <CheckCircle className={iconClass} />, color: theme.badges.gray },
    SPECIAL_CASE: { icon: <AlertTriangle className={iconClass} />, color: theme.badges.yellow },
    DIAGNOSTIC_PREVENTIVE: { icon: <Search className={iconClass} />, color: theme.badges.blue },
    SENIOR_CITIZEN: { icon: <User className={iconClass} />, color: theme.badges.gray },
    PROCEDURAL_CARE: { icon: <Stethoscope className={iconClass} />, color: theme.badges.red },
    AYURVEDIC_PROCEDURES: { icon: <Leaf className={iconClass} />, color: theme.badges.emerald },
    THERAPY: { icon: <Leaf className={iconClass} />, color: theme.badges.emerald },
    SURGERY: { icon: <Flame className={iconClass} />, color: theme.badges.red },
    LAB_TEST: { icon: <Droplets className={iconClass} />, color: theme.badges.blue },
    IMAGING: { icon: <Brain className={iconClass} />, color: theme.badges.blue },
    VACCINATION: { icon: <CheckCircle className={iconClass} />, color: theme.badges.emerald },
    VIDDHAKARMA: { icon: <Flame className={iconClass} />, color: theme.badges.red },
    AGNIKARMA: { icon: <Flame className={iconClass} />, color: theme.badges.red },
    PANCHAKARMA: { icon: <Leaf className={iconClass} />, color: theme.badges.emerald },
    NADI_PARIKSHA: { icon: <Heart className={iconClass} />, color: theme.badges.red },
    DOSHA_ANALYSIS: { icon: <Brain className={iconClass} />, color: theme.badges.blue },
    SHIRODHARA: { icon: <Droplets className={iconClass} />, color: theme.badges.blue },
    VIRECHANA: { icon: <Leaf className={iconClass} />, color: theme.badges.emerald },
    ABHYANGA: { icon: <Waves className={iconClass} />, color: theme.badges.blue },
    SWEDANA: { icon: <Wind className={iconClass} />, color: theme.badges.orange },
    BASTI: { icon: <Droplets className={iconClass} />, color: theme.badges.blue },
    NASYA: { icon: <Wind className={iconClass} />, color: theme.badges.orange },
    RAKTAMOKSHANA: { icon: <Flame className={iconClass} />, color: theme.badges.red },
  };

  return visuals[treatmentType] || { icon: <Activity className={iconClass} />, color: theme.badges.blue };
}

// ─── Slot grouping helper ────────────────────────────────────────────────────

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

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = ["Location", "Service", "Doctor", "Date", "Slot", "Confirm"] as const;
/** Each appointment slot is 3 minutes — 20 bookable slots per hour. */
const IN_PERSON_APPOINTMENT_SLOT_DURATION_MINUTES = 3;
const VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES = 15;

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Helper to get Today in IST (India Standard Time)
 * Ensures frontend and backend agree on what 'Today' is, regardless of browser timezone.
 */
const getTodayIST = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [year, month, day] = formatter.format(now).split('-').map(Number);
  return new Date(year ?? now.getFullYear(), (month ?? 1) - 1, day ?? now.getDate());
};

const formatDateIST = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const isSubscriptionCurrent = (subscription?: { status?: string; endDate?: string, nextBillingDate?: string, currentPeriodEnd?: string } | null) => {
  if (!subscription) return false;

  const normalizedStatus = subscription.status?.toUpperCase();
  if (normalizedStatus !== "ACTIVE" && normalizedStatus !== "TRIALING") {
    return false;
  }

  // Use nextBillingDate / currentPeriodEnd as primary indicators of ongoing mathematical validity
  const effectiveEnd = subscription.nextBillingDate || subscription.currentPeriodEnd || subscription.endDate;
  if (!effectiveEnd) {
    return true;
  }

  const endDate = new Date(effectiveEnd);
  return Number.isFinite(endDate.getTime()) && endDate.getTime() >= Date.now();
};

const normalizePatientGender = (value: string) => {
  const normalized = value.trim().toUpperCase();
  if (normalized === "MALE" || normalized === "FEMALE" || normalized === "OTHER") {
    return normalized as "MALE" | "FEMALE" | "OTHER";
  }
  return undefined;
};

const createTemporaryPatientPassword = (phone: string) => {
  const digits = phone.replace(/\D/g, "").slice(-6) || "123456";
  return `Pt@${digits}`;
};

export function BookAppointmentDialog({
  trigger,
  clinicId,
  locationId,
  defaultOpen = false,
  onBooked,
  initialConsultationMode,
  initialServiceId,
  initialDoctorId,
  initialPatientId,
}: BookAppointmentDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { isConnected, subscribe } = useWebSocketContext();
  const { session } = useAuth();
  const { hasPermission } = useRBAC();
  const userRole = (session?.user?.role || "").toUpperCase();
  const postBookingRoute = userRole === "RECEPTIONIST" ? "/receptionist/appointments" : "/patient/appointments";
  const postBookingLabel = userRole === "RECEPTIONIST" ? "View Reception Desk" : "View My Appointments";
  const patientCheckInRoute = "/patient/check-in";
  const { clinicId: contextClinicId } = useClinicContext();
  const { data: myClinic, isPending: myClinicLoading } = useMyClinic();
  const hasExplicitClinicId = !!clinicId || !!contextClinicId || !!session?.user?.clinicId;
  const shouldResolvePatientClinic = userRole === "PATIENT" && !hasExplicitClinicId;
  const activeClinicId = clinicId || contextClinicId || session?.user?.clinicId || myClinic?.id || APP_CONFIG.CLINIC.ID;

  // ─── Dialog / Step state ──────────────────────────────────────────────────
  const [open, setOpen] = useState(defaultOpen);
  // If locationId AND initialConsultationMode provided as props OR it is a VIDEO context, skip step 1
  const [step, setStep] = useState(( (locationId && initialConsultationMode) || initialConsultationMode === "VIDEO" ) ? 2 : (locationId ? 2 : 1));
  const [serviceFilter, setServiceFilter] = useState("All");

  // ─── Selections ───────────────────────────────────────────────────────────
  const [selectedLocationId, setSelectedLocationId] = useState(locationId || "");
  const [consultationMode, setConsultationMode] = useState<"IN_PERSON" | "VIDEO" | "">(initialConsultationMode || "IN_PERSON");
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getTodayIST());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedVideoSlots, setSelectedVideoSlots] = useState<string[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [bookedAppointmentId, setBookedAppointmentId] = useState("");
  const [requiresVideoPayment, setRequiresVideoPayment] = useState(false);
  const [videoPaymentCompleted, setVideoPaymentCompleted] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || "");
  const [patientSearch, setPatientSearch] = useState("");
  const [showQuickCreatePatient, setShowQuickCreatePatient] = useState(false);
  const [recentlyCreatedPatient, setRecentlyCreatedPatient] = useState<{
    id: string;
    displayName: string;
    phone?: string;
    email?: string;
  } | null>(null);
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });
  const isPrivilegedScheduler = ["RECEPTIONIST", "DOCTOR", "ASSISTANT_DOCTOR", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(userRole);
  const targetPatientId = isPrivilegedScheduler ? selectedPatientId : session?.user?.id || "";
  const shouldLoadLocations = open && consultationMode !== "VIDEO" && (!shouldResolvePatientClinic || !myClinicLoading);
  const shouldLoadServices = open;
  const shouldLoadDoctors = open && step >= 3 && !!activeClinicId && (consultationMode === "VIDEO" || !!selectedLocationId);
  const shouldLoadPatients = open && isPrivilegedScheduler && !!activeClinicId;
  const quickRegisterPatientMutation = useQuickRegisterPatient();

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: locations = [], isPending: locationsLoading, isFetching: locationsFetching } = useActiveLocations(activeClinicId, {
    enabled: shouldLoadLocations,
  });
  const { data: appointmentServices = [], isPending: servicesLoading } = useAppointmentServices(shouldLoadServices);
  const { data: doctorsData, isPending: doctorsLoading } = useDoctors(
    activeClinicId,
    consultationMode === "VIDEO"
      ? undefined
      : {
          locationId: selectedLocationId,
        },
    {
      enabled: shouldLoadDoctors,
    }
  );
  // Only RECEPTIONIST needs the full patient list to select a patient.
  // Patients book for themselves — calling this admin endpoint as a PATIENT
  // returns 403 Forbidden. Pass an empty clinicId to disable the query.
  const { data: patientsData = [] } = usePatients(
    isPrivilegedScheduler ? activeClinicId : "",
    { limit: 200, isActive: true },
    { enabled: shouldLoadPatients }
  );

  const dateString = useMemo(() => (selectedDate ? formatDateIST(selectedDate) : ""), [selectedDate]);
  const shouldLoadAvailability =
    open &&
    step >= 4 &&
    !!activeClinicId &&
    !!selectedDoctorId &&
    !!dateString &&
    (consultationMode === "VIDEO" || !!selectedLocationId);
  const availabilityQueryKey = useMemo(
    () => [
      "doctorAvailability",
      activeClinicId,
      selectedDoctorId,
      dateString,
      consultationMode === "VIDEO" ? undefined : selectedLocationId,
      consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON",
    ],
    [activeClinicId, selectedDoctorId, dateString, selectedLocationId, consultationMode]
  );

  const {
    data: availability,
    isPending: availabilityLoading,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useDoctorAvailability(
    activeClinicId,
    selectedDoctorId,
    dateString,
    consultationMode === "VIDEO" ? undefined : selectedLocationId,
    consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON",
    {
      enabled: shouldLoadAvailability,
      ...(step >= 4 && !isConnected ? { refetchIntervalMs: 10000 } : {}),
    }
  );

  const { mutateAsync: createAppointment, isPending: isBooking } = useCreateAppointment(activeClinicId);
  const { mutateAsync: proposeVideoAppointment, isPending: isProposingVideoAppointment } = useProposeVideoAppointment();
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
  const shouldLoadSubscriptions = open && step >= 6 && !!targetPatientId;
  const { data: subscriptionsData = [] } = useSubscriptions(targetPatientId, shouldLoadSubscriptions);
  const {
    data: backendActiveSubscription,
    isPending: backendActiveSubscriptionLoading,
  } = useActiveSubscription(targetPatientId, activeClinicId, shouldLoadSubscriptions);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const modeAppointmentType: AppointmentType =
    consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";
  const visibleServices = useMemo(() => {
    return (appointmentServices as AppointmentServiceDefinition[]).filter(
      (service) =>
        service.active &&
        service.appointmentModes.includes(modeAppointmentType)
    );
  }, [appointmentServices, modeAppointmentType]);

  const selectedService = useMemo(
    () => visibleServices.find((service) => service.treatmentType === selectedServiceId),
    [selectedServiceId, visibleServices]
  );

  const appointmentDurationMinutes =
    consultationMode === "VIDEO"
      ? VIDEO_APPOINTMENT_SLOT_DURATION_MINUTES
      : selectedService?.defaultDurationMinutes && selectedService.defaultDurationMinutes > 0
        ? selectedService.defaultDurationMinutes
        : IN_PERSON_APPOINTMENT_SLOT_DURATION_MINUTES;
  const isPatientInPersonFlow = userRole === "PATIENT" && consultationMode === "IN_PERSON";
  const videoPaymentAmount = Number(selectedService?.videoConsultationFee || 0);
  const shouldCollectVideoPayment =
    consultationMode === "VIDEO" && userRole === "PATIENT" && videoPaymentAmount > 0;

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
        specialization: u.doctor?.specialization || u.specialization || '',
        image: u.profilePicture || u.doctor?.user?.profilePicture || u.image || '',
      }));

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors)) return normalize((doctorsData as any).data.doctors);
    if (Array.isArray((doctorsData as any)?.data)) return normalize((doctorsData as any).data);
    const raw = (doctorsData as any)?.doctors || [];
    return normalize(raw);
  }, [doctorsData]);

  const selectedDoctor = useMemo(
    () => doctorsList.find((d: any) => d.id === selectedDoctorId),
    [doctorsList, selectedDoctorId]
  );
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
      return name.includes(query) || phone.includes(query) || email.includes(query);
    });
  }, [patientsList, patientSearch]);

  const selectedPatient = useMemo(
    () =>
      patientsList.find((patient: any) => (patient.userId || patient.id) === selectedPatientId) ||
      (recentlyCreatedPatient?.id === selectedPatientId ? recentlyCreatedPatient : null),
    [patientsList, selectedPatientId, recentlyCreatedPatient]
  );

  const activeSubscription = useMemo(() => {
    const candidates = (subscriptionsData as any[])
      .filter(
        (subscription: any) =>
          isSubscriptionCurrent(subscription) &&
          (!subscription.clinicId || subscription.clinicId === activeClinicId)
      )
      .sort((left: any, right: any) => {
        const leftDate = new Date(left.updatedAt || left.createdAt || left.startDate || 0).getTime();
        const rightDate = new Date(right.updatedAt || right.createdAt || right.startDate || 0).getTime();
        return rightDate - leftDate;
      });

    if (isSubscriptionCurrent(backendActiveSubscription)) {
      return backendActiveSubscription;
    }

    return candidates[0];
  }, [subscriptionsData, activeClinicId, backendActiveSubscription]);

  const isPatientInPersonBooking = consultationMode === "IN_PERSON" && userRole === "PATIENT";
  const isSubscriptionGateLoading = isPatientInPersonBooking && backendActiveSubscriptionLoading;
  const needsSubscriptionPlan = isPatientInPersonBooking && !isSubscriptionGateLoading && !activeSubscription;

  const slots = useMemo(() => {
    if (Array.isArray((availability as any)?.availableSlots)) return (availability as any).availableSlots;
    if (Array.isArray((availability as any)?.data?.availableSlots)) return (availability as any).data.availableSlots;
    if (Array.isArray((availability as any)?.data?.data?.availableSlots)) return (availability as any).data.data.availableSlots;
    return [];
  }, [availability]);
  const extractAvailabilitySlots = useCallback((source: unknown) => {
    if (Array.isArray(source)) {
      return source.filter((slot): slot is string => typeof slot === "string");
    }
    if (!source || typeof source !== "object") {
      return [];
    }

    const record = source as {
      availableSlots?: unknown;
      data?: unknown;
    };
    if (Array.isArray(record.availableSlots)) {
      return record.availableSlots.filter((slot): slot is string => typeof slot === "string");
    }
    if (record.data && typeof record.data === "object") {
      const nested = record.data as { availableSlots?: unknown; data?: unknown };
      if (Array.isArray(nested.availableSlots)) {
        return nested.availableSlots.filter((slot): slot is string => typeof slot === "string");
      }
      if (nested.data && typeof nested.data === "object") {
        const nestedDeep = nested.data as { availableSlots?: unknown };
        if (Array.isArray(nestedDeep.availableSlots)) {
          return nestedDeep.availableSlots.filter((slot): slot is string => typeof slot === "string");
        }
      }
    }
    return [];
  }, []);

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
    if (consultationMode === "IN_PERSON" && !restrictions.generalConsultationEnabled) return true;
    if (consultationMode === "VIDEO" && !restrictions.videoConsultationEnabled) return true;
    return false;
  }, [consultationMode, restrictions]);

  const effectiveSlots = useMemo(
    () => (consultationBlocked ? [] : (slots as string[])),
    [consultationBlocked, slots]
  );
  const validateLatestAvailability = useCallback(async () => {
    const refreshed = await refetchAvailability({ cancelRefetch: true });
    const refreshedSlots = extractAvailabilitySlots(
      refreshed?.data ?? queryClient.getQueryData(availabilityQueryKey)
    );
    return refreshedSlots;
  }, [availabilityQueryKey, extractAvailabilitySlots, queryClient, refetchAvailability]);

  useEffect(() => {
    if (!open || step < 4 || !isConnected || !selectedDoctorId || !dateString) {
      return;
    }

    const shouldRefreshAvailability = (rawData: unknown) => {
      const data = rawData as {
        clinicId?: string;
        doctorId?: string;
        appointment?: { doctorId?: string; locationId?: string; date?: string; appointmentDate?: string };
        appointmentId?: string;
      };

      if (data.clinicId && data.clinicId !== activeClinicId) {
        return;
      }

      const eventDoctorId = data.doctorId || data.appointment?.doctorId;
      if (eventDoctorId && eventDoctorId !== selectedDoctorId) {
        return;
      }

      const eventDate = data.appointment?.date || data.appointment?.appointmentDate;
      if (eventDate && String(eventDate).slice(0, 10) !== dateString) {
        return;
      }

      const eventLocationId = data.appointment?.locationId;
      if (consultationMode !== "VIDEO" && selectedLocationId && eventLocationId && eventLocationId !== selectedLocationId) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: availabilityQueryKey, exact: true });
      void queryClient.refetchQueries({ queryKey: availabilityQueryKey, exact: true, type: "active" });
    };

    const unsubscribeCreated = subscribe("appointment.created", shouldRefreshAvailability);
    const unsubscribeUpdated = subscribe("appointment.updated", shouldRefreshAvailability);
    const unsubscribeDeleted = subscribe("appointment.deleted", shouldRefreshAvailability);
    const unsubscribeConfirmed = subscribe("appointment.confirmed", shouldRefreshAvailability);
    const unsubscribeSlotConfirmed = subscribe("appointment.slot.confirmed", shouldRefreshAvailability);
    const unsubscribeRescheduled = subscribe("appointment.rescheduled", shouldRefreshAvailability);
    const unsubscribeCancelled = subscribe("appointment.cancelled", shouldRefreshAvailability);
    const unsubscribeCheckedIn = subscribe("appointment.checked_in", shouldRefreshAvailability);
    const unsubscribeCompleted = subscribe("appointment.completed", shouldRefreshAvailability);
    const unsubscribeAvailabilityChanged = subscribe("doctor.availability.changed", shouldRefreshAvailability);

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
    open,
    queryClient,
    selectedDoctorId,
    selectedLocationId,
    step,
    subscribe,
  ]);

  useEffect(() => {
    if (consultationMode === "VIDEO" && selectedVideoSlots.length > 0) {
      const filteredSlots = selectedVideoSlots.filter((slot) => effectiveSlots.includes(slot));
      if (filteredSlots.length !== selectedVideoSlots.length) {
        setSelectedVideoSlots(filteredSlots);
      }
    }
    if (consultationMode !== "VIDEO" && selectedSlot && !effectiveSlots.includes(selectedSlot)) {
      setSelectedSlot("");
    }
  }, [consultationMode, effectiveSlots, selectedSlot, selectedVideoSlots]);

  const slotGroups = useMemo(() => groupSlotsByPeriod(effectiveSlots as string[]), [effectiveSlots]);
  const liveSyncEnabled = isConnected;
  const liveSyncLabel = liveSyncEnabled ? "Live synced" : "Polling fallback";
  const liveSyncDescription = liveSyncEnabled
    ? "Availability updates are coming from websocket events."
    : "Websocket is unavailable, so availability refreshes automatically.";
  const liveSyncClasses = liveSyncEnabled
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";

  useEffect(() => {
    if (open) {
      // Only reset if we're coming back after a completed booking (step 7 = success)
      // or if it's the very first open (step hasn't been set yet beyond initial)
      if (step === 7) {
        // After a completed booking, reset for a fresh booking
        setStep(( (locationId && initialConsultationMode) || initialConsultationMode === "VIDEO" ) ? 2 : (locationId ? 2 : 1));
        setSelectedLocationId(locationId || "");
        setConsultationMode(initialConsultationMode || "IN_PERSON");
        setSelectedServiceId(initialServiceId || "");
        setSelectedDoctorId(initialDoctorId || "");
        setSelectedPatientId(initialPatientId || "");
        setSelectedDate(getTodayIST());
        setSelectedSlot("");
        setSelectedVideoSlots([]);
        setChiefComplaint("");
        setUrgency("Normal");
        setBookedAppointmentId("");
        setRequiresVideoPayment(false);
        setVideoPaymentCompleted(false);
        setSelectedPatientId(initialPatientId || "");
        setPatientSearch("");
        setShowQuickCreatePatient(false);
        setRecentlyCreatedPatient(null);
        setNewPatient({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          dateOfBirth: "",
          gender: "",
          address: "",
        });
      }
      // Otherwise, keep all existing state (user resumes from where they left off)
    }
  }, [open]);

  // Auto-pick first location
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId((locations[0] as any)?.id || "");
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (
      selectedServiceId &&
      !visibleServices.some(service => service.treatmentType === selectedServiceId)
    ) {
      setSelectedServiceId("");
    }
  }, [selectedServiceId, visibleServices]);

  // ─── Book appointment ─────────────────────────────────────────────────────
  const handleBook = useCallback(async () => {
    if (!selectedService || !selectedDoctorId || !selectedDate || !targetPatientId) return;

    const patientBillingRoute = "/patient/billing";
    const redirectToBillingTab = (
      tab: "plans" | "subscriptions" | "payments",
      message: string
    ) => {
      dismissToast("subscription-coverage-check");
      showErrorToast(message);
      router.push(`${patientBillingRoute}?tab=${tab}`);
    };

    const redirectToSubscriptionPlans = (message?: string) => {
      redirectToBillingTab(
        "plans",
        message || "You don't have an active subscription for this in-person appointment. Please subscribe to continue."
      );
    };

    const redirectToSubscriptionResolution = (
      message?: string,
      tab: "subscriptions" | "payments" = "subscriptions"
    ) => {
      redirectToBillingTab(
        tab,
        message ||
          "Your subscription cannot cover this appointment right now. Review your billing options before confirming."
      );
    };

    try {
      const finalAppointmentType: AppointmentType =
        consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";
      const selectedDateString = formatDateIST(selectedDate);
      const freshSlots = await validateLatestAvailability();

      if (finalAppointmentType === "VIDEO_CALL") {
        if (selectedVideoSlots.length !== 3) {
          showErrorToast("Please select exactly 3 preferred video slots.");
          return;
        }

        const stillAvailableSlots = selectedVideoSlots.filter((slot) => freshSlots.includes(slot));
        if (stillAvailableSlots.length !== selectedVideoSlots.length) {
          setSelectedVideoSlots(stillAvailableSlots);
        }
        if (stillAvailableSlots.length !== 3) {
          showErrorToast("One or more preferred video slots are no longer available. Please select fresh slots.");
          return;
        }

        const proposedAppointment = await proposeVideoAppointment({
          patientId: targetPatientId,
          doctorId: selectedDoctorId,
          clinicId: activeClinicId,
          ...(selectedLocationId ? { locationId: selectedLocationId } : {}),
          duration: appointmentDurationMinutes,
          proposedSlots: stillAvailableSlots.map((time) => ({
            date: selectedDateString,
            time,
          })),
          ...(chiefComplaint ? { notes: chiefComplaint } : {}),
        });

        setBookedAppointmentId(proposedAppointment.id);
        queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
        queryClient.refetchQueries({ queryKey: ["appointments"], exact: false, type: "active" });
        queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"] });
        queryClient.invalidateQueries({ queryKey: getAppointmentStatsQueryKey(activeClinicId), exact: false });
        queryClient.invalidateQueries({ queryKey: ["appointment", proposedAppointment.id] });
        if (shouldCollectVideoPayment) {
          setRequiresVideoPayment(true);
          setVideoPaymentCompleted(false);
          setStep(7);
          return;
        }

        onBooked?.();
        showSuccessToast(
          `Video appointment requested with ${selectedDoctor?.name || 'doctor'}` +
          (selectedDate ? ` for ${format(selectedDate, 'd MMM yyyy')}` : '') +
          ' — awaiting doctor confirmation.',
          { id: 'booking-success' }
        );
        setStep(7);
        return;
      }

      if (!freshSlots.includes(selectedSlot)) {
        setSelectedSlot("");
        showErrorToast("That time slot is no longer available. Please select a fresh slot.");
        return;
      }

      if (finalAppointmentType === "IN_PERSON" && userRole === "PATIENT" && !activeSubscription) {
        redirectToSubscriptionPlans(
          "You don't have an active subscription for in-person appointments. Please subscribe to continue."
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
          coverage?.covered === true ||
          coverage?.allowed === true;
        if (!covered) {
          const requiresPayment = coverage?.requiresPayment === true;
          const reason =
            coverage?.message ||
            coverage?.reason ||
            (requiresPayment
              ? `Subscription coverage unavailable. Additional payment required: INR ${coverage?.paymentAmount || 0}`
              : "Subscription quota exhausted or inactive.");
          redirectToSubscriptionResolution(reason, requiresPayment ? "payments" : "subscriptions");
          return;
        }
      }

      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      let apptId = "";
      if (finalAppointmentType === "IN_PERSON" && userRole === "PATIENT" && activeSubscription?.id) {
        const atomicResult = await createSubscriptionAppointment({
          subscriptionId: activeSubscription.id,
          patientId: targetPatientId,
          doctorId: selectedDoctorId,
          clinicId: activeClinicId,
          locationId: selectedLocationId,
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
      } else {
        const payload = {
          clinicId: activeClinicId,
          doctorId: selectedDoctorId,
          locationId: selectedLocationId,
          date: formatDateIST(appointmentDate),
          time: selectedSlot,
          type: finalAppointmentType,
          treatmentType: selectedService.treatmentType,
          duration: appointmentDurationMinutes,
          notes: chiefComplaint || selectedService.label,
          priority: urgency.toUpperCase() as any,
          patientId: targetPatientId,
        };

        const appointment = await createAppointment(payload);

        if (!appointment?.id) {
          throw new Error("Failed to create appointment; check console for details.");
        }
        apptId = appointment.id;
      }

      setBookedAppointmentId(apptId);
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.refetchQueries({ queryKey: ["appointments"], exact: false, type: "active" });
      queryClient.invalidateQueries({ queryKey: ["userUpcomingAppointments"] });
      queryClient.invalidateQueries({ queryKey: getAppointmentStatsQueryKey(activeClinicId), exact: false });
      queryClient.invalidateQueries({ queryKey: ["appointment", apptId] });
      // Send appointment reminder via push + email + WhatsApp
      if (hasPermission(Permission.SEND_NOTIFICATIONS)) {
        sendReminder({ appointmentId: apptId, reminderType: 'all' });
      }
      onBooked?.();
      showSuccessToast(
        `Appointment booked${selectedDoctor?.name ? ` with ${selectedDoctor.name}` : ''}` +
        (selectedDate ? ` on ${format(selectedDate, 'd MMM yyyy')}` : '') +
        '.',
        { id: 'booking-success' }
      );
      setStep(7); // step 7 = success/QR screen
    } catch (err: any) {
      const errorMessage =
        typeof err?.message === "string" ? err.message : "Failed to book appointment. Please try again.";
      const lowerErrorMessage = errorMessage.toLowerCase();
      const shouldRedirectToSubscription =
        userRole === "PATIENT" &&
        consultationMode === "IN_PERSON" &&
        (lowerErrorMessage.includes("active in-person subscription coverage is required") ||
          lowerErrorMessage.includes("active subscription required") ||
          lowerErrorMessage.includes("subscription quota exhausted") ||
          lowerErrorMessage.includes("subscription expired") ||
          lowerErrorMessage.includes("subscription ended") ||
          lowerErrorMessage.includes("subscription period") ||
          lowerErrorMessage.includes("subscription coverage unavailable") ||
          (lowerErrorMessage.includes("subscription") && lowerErrorMessage.includes("required")));

      if (shouldRedirectToSubscription) {
        const noActiveSubscription =
          !activeSubscription &&
          (lowerErrorMessage.includes("active subscription required") ||
            lowerErrorMessage.includes("subscription required"));

        if (noActiveSubscription) {
          redirectToSubscriptionPlans(
            "You don't have an active subscription for this appointment. Please subscribe to continue."
          );
          return;
        }

        const requiresPayment =
          lowerErrorMessage.includes("payment") ||
          lowerErrorMessage.includes("past due") ||
          lowerErrorMessage.includes("billing");

        redirectToSubscriptionResolution(errorMessage, requiresPayment ? "payments" : "subscriptions");
        return;
      }

      dismissToast("subscription-coverage-check");

      if (lowerErrorMessage.includes("time slot is no longer available")) {
        queryClient.invalidateQueries({ queryKey: availabilityQueryKey, exact: true });
        queryClient.refetchQueries({ queryKey: availabilityQueryKey, exact: true, type: "active" });
        if (consultationMode === "VIDEO") {
          setSelectedVideoSlots([]);
        } else {
          setSelectedSlot("");
        }
      }

      showErrorToast(errorMessage);
    }
  }, [
    selectedService,
    selectedDoctorId,
    selectedDate,
    selectedSlot,
    selectedVideoSlots,
    targetPatientId,
    chiefComplaint,
    urgency,
    activeClinicId,
    selectedLocationId,
    appointmentDurationMinutes,
    createAppointment,
    proposeVideoAppointment,
    checkSubscriptionCoverage,
    createSubscriptionAppointment,
    hasPermission,
    sendReminder,
    onBooked,
    consultationMode,
    userRole,
    activeSubscription,
    router,
    queryClient,
    availabilityQueryKey,
    validateLatestAvailability,
  ]);

  // ─── Navigation ──────────────────────────────────────────────────────────
  const canNext = useMemo(() => {
    if (step === 1) return !!consultationMode && (consultationMode === "VIDEO" || !!selectedLocationId);
    if (step === 2) {
      return !!selectedServiceId && (!isPrivilegedScheduler || !!selectedPatientId);
    }
    if (step === 3) return !!selectedDoctorId;
    if (step === 4) return !!selectedDate;
    if (step === 5) return consultationMode === "VIDEO" ? selectedVideoSlots.length === 3 : !!selectedSlot;
    return true;
  }, [step, selectedLocationId, consultationMode, selectedServiceId, selectedDoctorId, selectedDate, selectedSlot, selectedVideoSlots, isPrivilegedScheduler, selectedPatientId]);

  const TOTAL_STEPS = 6;
  const goNext = () => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ─── QR data ─────────────────────────────────────────────────────────────
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

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderStepBar = () => (
    <div className="flex items-center justify-between px-1">
      {STEPS.map((label, i) => {
        const s = i + 1;
        const done = step > s;
        const active = step === s;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider hidden sm:block ${
                  active ? "text-primary" : done ? "text-primary/60" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-4 sm:w-8 rounded-full mx-1 ${done ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Location + Mode ─────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="flex flex-col gap-5">
      {consultationMode === "VIDEO" ? (
        <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Video consultations do not require a physical location.
        </div>
      ) : shouldResolvePatientClinic && myClinicLoading ? (
        <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
          <Loader2 className="w-7 h-7 mx-auto mb-2 opacity-60 animate-spin" />
          Resolving your clinic...
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visit Location</p>
          {locationsLoading && (locations as any[]).length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
              <Building className="w-7 h-7 mx-auto mb-2 opacity-30" />
              Loading locations...
            </div>
          ) : (locations as any[]).length === 0 ? (
            <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
              <Building className="w-7 h-7 mx-auto mb-2 opacity-30" />
              No active locations found for this clinic.
            </div>
          ) : (
            <div className="space-y-2">
              {(locations as any[]).map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocationId(loc.id);
                    if (consultationMode) setTimeout(goNext, 150);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selectedLocationId === loc.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedLocationId === loc.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${ selectedLocationId === loc.id ? "text-primary" : ""}`}>
                      {loc.name || loc.address || "Location"}
                    </p>
                    {loc.address && loc.name && (
                      <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                    )}
                  </div>
                  {selectedLocationId === loc.id && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Consultation Mode</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: "IN_PERSON", label: "In-Person", desc: "Visit the clinic", icon: <Building className="w-5 h-5" /> },
            { value: "VIDEO", label: "Video Call", desc: "Remote consultation", icon: <Video className="w-5 h-5" /> },
          ] as const).map(({ value, label, desc, icon }) => (
            <button
              key={value}
              onClick={() => {
                setConsultationMode(value);
                if (value === "VIDEO" || selectedLocationId) setTimeout(goNext, 150);
              }}
              className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border transition-all ${
                consultationMode === value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                consultationMode === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {icon}
              </div>
              <div className="text-center">
                <p className={`text-sm font-semibold ${ consultationMode === value ? "text-primary" : ""}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Step 2: Service (was Step 1)
  const renderStep2_Service = () => {
    const categories = ["All", ...Array.from(new Set(visibleServices.map((t) => t.category)))];
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
        const quickRegisterResult = await quickRegisterPatientMutation.mutateAsync({
          ...(email ? { email } : {}),
          password: temporaryPassword,
          firstName,
          lastName,
          phone,
          ...(normalizedGender ? { gender: normalizedGender } : {}),
          ...(newPatient.dateOfBirth ? { dateOfBirth: newPatient.dateOfBirth } : {}),
          ...(newPatient.address.trim() ? { address: newPatient.address.trim() } : {}),
        });
        const userId =
          (quickRegisterResult as any)?.user?.id ||
          (quickRegisterResult as any)?.userId ||
          (quickRegisterResult as any)?.id;
        if (!userId) {
          throw new Error("Quick registration completed without a usable patient ID");
        }
        const resolvedEmail =
          (quickRegisterResult as any)?.generatedEmail || email || `patient.${phone.replace(/\D/g, "")}@clinic.local`;

        const displayName = `${firstName} ${lastName}`.trim();
        setSelectedPatientId(userId);
        setPatientSearch(displayName);
        setRecentlyCreatedPatient({ id: userId, displayName, phone, email: resolvedEmail });
        setShowQuickCreatePatient(false);
        setNewPatient({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          dateOfBirth: "",
          gender: "",
          address: "",
        });

        await queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
        showSuccessToast(`Patient created successfully. Temporary password: ${temporaryPassword}`);
      } catch (error) {
        showErrorToast(error instanceof Error ? error.message : "Failed to create patient");
      }
    };

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">What type of consultation do you need?</p>
        {isPrivilegedScheduler && (
          <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Patient</p>
                <p className="text-sm text-muted-foreground">Search an existing patient or register a new one before booking.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuickCreatePatient((value) => !value)}
                className="gap-2 self-start"
              >
                <UserPlus className="h-4 w-4" />
                {showQuickCreatePatient ? "Close quick add" : "Register New Patient"}
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                placeholder="Search by patient name, phone, or email"
                className="h-11 pl-10"
              />
            </div>

            {locationsFetching && (locations as any[]).length > 0 && (
              <p className="text-xs text-muted-foreground">
                Refreshing location data in the background.
              </p>
            )}

            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
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
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSelected ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {String(patient.displayName || "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate font-semibold ${isSelected ? "text-emerald-700 dark:text-emerald-300" : ""}`}>
                          {patient.displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {patient.phone || "No phone"}{patient.email ? ` - ${patient.email}` : ""}
                        </p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })
              )}
            </div>

            {showQuickCreatePatient && (
              <Card className="border-emerald-200/70 bg-background/80 shadow-sm dark:border-emerald-900/50">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">Quick register patient</p>
                      <p className="text-xs text-muted-foreground">
                        This creates the patient identity and profile, then returns you to booking.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</Label>
                      <Input
                        value={newPatient.firstName}
                        onChange={(event) => setNewPatient((current) => ({ ...current, firstName: event.target.value }))}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</Label>
                      <Input
                        value={newPatient.lastName}
                        onChange={(event) => setNewPatient((current) => ({ ...current, lastName: event.target.value }))}
                        placeholder="Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
                      <Input
                        value={newPatient.phone}
                        onChange={(event) => setNewPatient((current) => ({ ...current, phone: event.target.value }))}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input
                        type="email"
                        value={newPatient.email}
                        onChange={(event) => setNewPatient((current) => ({ ...current, email: event.target.value }))}
                        placeholder="patient@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date of birth</Label>
                      <Input
                        type="date"
                        value={newPatient.dateOfBirth}
                        onChange={(event) => setNewPatient((current) => ({ ...current, dateOfBirth: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gender</Label>
                      <Select value={newPatient.gender} onValueChange={(value) => setNewPatient((current) => ({ ...current, gender: value }))}>
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
                      <Textarea
                        value={newPatient.address}
                        onChange={(event) => setNewPatient((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Street, city, state"
                        className="min-h-20"
                      />
                    </div>
                  </div>

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
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Create Patient
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedPatient ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                <span className="font-semibold">Booking for {selectedPatient.displayName}</span>
                {selectedPatient.phone ? <span className="ml-2 opacity-80">- {selectedPatient.phone}</span> : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                Select or create a patient to continue booking.
              </div>
            )}
          </div>
        )}
        {servicesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : null}
        <div className="flex gap-2 overflow-x-auto pb-1 scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat}
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
        <div className="space-y-2">
          {!servicesLoading && filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No services available for this mode</p>
            </div>
          ) : null}
          {filtered.map((t) => (
            <button
              key={t.treatmentType}
              onClick={() => {
                setSelectedServiceId(t.treatmentType);
                setTimeout(goNext, 100);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedServiceId === t.treatmentType
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              {(() => {
                const visual = getConsultationVisual(t.treatmentType);
                return (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedServiceId === t.treatmentType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                    {visual.icon}
              </div>
                );
              })()}
              <div className="flex-1 min-w-0 pr-4">
                <p className={`font-semibold text-sm ${selectedServiceId === t.treatmentType ? "text-primary" : ""}`}>{t.label}</p>
                <p className="text-xs text-muted-foreground truncate">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Step 2: Doctor
  const renderStep2 = () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Choose your preferred doctor</p>
      {doctorsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : doctorsList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
          <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No doctors available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {doctorsList.map((doctor: any) => (
            <button
              key={doctor.id}
              onClick={() => {
                setSelectedDoctorId(doctor.id);
                setSelectedSlot("");
                setTimeout(goNext, 100);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedDoctorId === doctor.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                selectedDoctorId === doctor.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {doctor.image
                  ? <img src={doctor.image} alt="" className="w-full h-full rounded-full object-cover" />
                  : (doctor.name || "D").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${selectedDoctorId === doctor.id ? "text-primary" : ""}`}>
                  {doctor.name}
                </p>
                <p className="text-xs text-muted-foreground">{doctor.specialization || "General Physician"}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-green-600 font-medium">Available</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Step 3: Date
  const renderStep3 = () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Pick your preferred appointment date</p>
      <div className="flex justify-center w-full max-w-sm mx-auto">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => {
            setSelectedDate(d);
            setSelectedSlot("");
            if (d) setTimeout(goNext, 150);
          }}
          disabled={(date) => {
            // Enforce Indian Standard Time (IST) exactly for calculating disabled "past" days
            const todayIST = getTodayIST();
            // Testing mode: allow any non-past booking date.
            return date < todayIST;
          }}
          className="border border-border/50 shadow-sm p-2 sm:p-3 mx-auto max-w-[280px] sm:max-w-xs [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)] text-sm [&_.rdp-caption_label]:text-sm [&_.rdp-button]:text-sm"
        />
      </div>
      {selectedDate && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20 max-w-sm mx-auto w-full justify-center mt-2">
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold">{format(selectedDate, "EEEE, d MMMM yyyy")}</span>
        </div>
      )}
    </div>
  );

  // Step 4: Slot
  const renderStep4 = () => {
    const periods = [
      { key: "morning" as const, label: "Morning", icon: <Sun className="w-4 h-4" />, range: "Before 12pm", slots: slotGroups.morning },
      { key: "afternoon" as const, label: "Afternoon", icon: <CloudSun className="w-4 h-4" />, range: "12pm – 5pm", slots: slotGroups.afternoon },
      { key: "evening" as const, label: "Evening", icon: <Moon className="w-4 h-4" />, range: "After 5pm", slots: slotGroups.evening },
    ];
    const visiblePeriods = periods.filter((period) => period.slots.length > 0);

    if (consultationMode === "VIDEO") {
      return (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 px-3 py-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Select 3 slots
                </p>
                <p className="text-[11px] text-muted-foreground">
                  15 min each. Doctor confirms one.
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-primary/12 text-primary px-2.5 py-1 text-[11px] font-bold border border-primary/15">
                {selectedVideoSlots.length}/3
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  liveSyncClasses
                )}
              >
                {liveSyncEnabled ? (
                  <Wifi className="h-3.5 w-3.5" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" />
                )}
                {liveSyncLabel}
              </span>
              <span className="text-[11px] text-muted-foreground">{liveSyncDescription}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="inline-flex items-center gap-1 font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-1 rounded-full border border-blue-200/70 dark:border-blue-900">
                <Video className="w-3 h-3" /> Video
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 px-2 py-1 rounded-full border border-violet-200/70 dark:border-violet-900">
                <CalendarIcon className="w-3 h-3" /> {selectedDate ? format(selectedDate, "d MMM") : ""}
              </span>
              <span className="inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-1 rounded-full border border-amber-200/70 dark:border-amber-900">
                <Clock className="w-3 h-3" /> {appointmentDurationMinutes} min
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {[0, 1, 2].map((index) => {
                const slot = selectedVideoSlots[index];
                return (
                  <div
                    key={index}
                    className={`rounded-lg border px-2 py-2 text-center sm:text-center flex items-center justify-between sm:block ${
                      slot
                        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30"
                        : "border-dashed border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/30"
                    }`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      Slot {index + 1}
                    </p>
                    <p className={`mt-0 sm:mt-1 text-xs font-semibold ${slot ? "text-foreground" : "text-muted-foreground"}`}>
                      {slot || "Not selected"}
                    </p>
                  </div>
                );
              })}
            </div>

            {selectedVideoSlots.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedVideoSlots([])}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Clear selected slots
              </button>
            )}
          </div>

          {availabilityLoading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Checking video availability...
            </div>
          ) : effectiveSlots.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
              <Video className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">
                {consultationBlocked ? "Video consultation currently unavailable" : "No video slots available"}
              </p>
              <p className="text-xs mt-1 opacity-60">
                {consultationBlocked
                  ? (restrictions.reason || "Clinic/doctor settings currently block this consultation type")
                  : "Try a different date or doctor"}
              </p>
              {availabilityError && <p className="text-xs mt-4 p-2 bg-red-500/10 rounded-md text-red-500 border border-red-500/20 max-w-[90%] text-center">Error: {(availabilityError as any).message || "Unknown error"}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {visiblePeriods.map((period) => (
                <div key={period.key} className="transition-all duration-200 ease-out">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-muted-foreground">{period.icon}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{period.label}</span>
                    <span className="text-[10px] text-muted-foreground">({period.range})</span>
                    <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {period.slots.length} slots
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {period.slots.map((slot) => {
                      const isSelected = selectedVideoSlots.includes(slot);
                      const selectionLimitReached = !isSelected && selectedVideoSlots.length >= 3;

                      return (
                        <button
                          key={slot}
                          onClick={() => {
                            setSelectedVideoSlots((current) => {
                              if (current.includes(slot)) {
                                return current.filter((currentSlot) => currentSlot !== slot);
                              }

                              if (current.length >= 3) {
                                return current;
                              }

                              return [...current, slot];
                            });
                          }}
                          disabled={selectionLimitReached}
                          className={`py-2 px-2 rounded-lg border transition-all text-center flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                              : selectionLimitReached
                                ? "bg-slate-100/80 border-slate-200 text-slate-400 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-500 opacity-70 cursor-not-allowed"
                                : "bg-card border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <span className="text-xs font-semibold">{slot}</span>
                          <span className={`text-[9px] font-medium ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                            {isSelected ? `Choice ${selectedVideoSlots.indexOf(slot) + 1}` : `${appointmentDurationMinutes} min`}
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
            Available slots for <span className="font-semibold text-foreground">{selectedDoctor?.name}</span> on{" "}
            <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, "d MMM") : ""}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                liveSyncClasses
              )}
            >
              {liveSyncEnabled ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              {liveSyncLabel}
            </span>
            <span className="text-[11px] text-muted-foreground">{liveSyncDescription}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> {appointmentDurationMinutes} min per slot
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              20 slots / hour
            </span>
          </div>
        </div>

        {availabilityLoading ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Checking availability...
          </div>
        ) : effectiveSlots.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">
              {consultationBlocked ? "Consultation currently unavailable" : "No slots available"}
            </p>
            <p className="text-xs mt-1 opacity-60">
              {consultationBlocked
                ? (restrictions.reason || "Clinic/doctor settings currently block this consultation type")
                : "Try a different date or doctor"}
            </p>
            {availabilityError && <p className="text-xs mt-4 p-2 bg-red-500/10 rounded-md text-red-500 border border-red-500/20 max-w-[90%] text-center">Error: {(availabilityError as any).message || "Unknown error"}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePeriods.map((period) => (
              <div key={period.key} className="transition-all duration-200 ease-out">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-muted-foreground">{period.icon}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{period.label}</span>
                  <span className="text-[10px] text-muted-foreground">({period.range})</span>
                  <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                    {period.slots.length} slots
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {period.slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setTimeout(goNext, 150);
                      }}
                      className={`py-2 px-2 rounded-xl border transition-all text-center flex flex-col items-center gap-0.5 ${
                        selectedSlot === slot
                          ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                          : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span className="text-xs font-semibold">{slot}</span>
                      <span className={`text-[9px] font-medium ${selectedSlot === slot ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
  };

  // Step 5: Confirm
  const renderStep5 = () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Review your appointment before confirming</p>

      {/* Summary card */}
      <div className="rounded-2xl border bg-muted/30 divide-y">
        {[
          ...(userRole === "RECEPTIONIST"
            ? [{ label: "Patient", value: selectedPatient?.displayName || "Select patient" }]
            : []),
          { label: "Service", value: selectedService?.label, sub: selectedService?.category },
          { label: "Doctor", value: selectedDoctor?.name, sub: selectedDoctor?.specialization || "General Physician" },
          { label: "Date", value: selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : "" },
          consultationMode === "VIDEO"
            ? { label: "Slots", value: `${selectedVideoSlots.length} selected`, sub: selectedVideoSlots.join(", ") }
            : { label: "Time", value: selectedSlot },
          { label: "Duration", value: `${appointmentDurationMinutes} min${consultationMode === "VIDEO" ? " each" : ""}` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 gap-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 shrink-0">{label}</span>
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {consultationMode === "VIDEO" && shouldCollectVideoPayment && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Video visit fee</p>
            <p className="text-lg font-bold text-foreground">INR {videoPaymentAmount.toFixed(0)}</p>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Submit the request first, then pay to unlock doctor confirmation.
          </p>
        </div>
      )}

      {isPatientInPersonBooking && (
        <div
          className={`rounded-2xl border p-4 space-y-2 ${
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
              ? "We’re checking your plan before booking this in-person appointment."
              : needsSubscriptionPlan
              ? "You need an active plan for this clinic to continue."
              : "We’ll verify your plan before confirming this appointment."}
          </p>
        </div>
      )}

      {/* Additional fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Chief Complaint
          </label>
          <Textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Briefly describe your symptoms or reason for visit..."
            className="text-sm resize-none h-20"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Urgency
          </label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">🟢 Low — Routine checkup</SelectItem>
              <SelectItem value="Normal">🟡 Normal — Regular visit</SelectItem>
              <SelectItem value="High">🔴 High — Urgent care needed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Step 6: Success + QR Code
  const renderStep6 = () => (
    <div className="flex flex-col items-center gap-5 py-2">
      <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <Check className="w-7 h-7 text-green-600 dark:text-green-400" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold">
          {consultationMode === "VIDEO" && requiresVideoPayment && !videoPaymentCompleted
            ? "Pay to Continue"
            : consultationMode === "VIDEO"
            ? "Video Appointment Request Sent"
            : "Appointment Booked!"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {consultationMode === "VIDEO" && requiresVideoPayment && !videoPaymentCompleted
            ? "Your preferred slots are saved. Pay below so the doctor can review and confirm one of them."
            : consultationMode === "VIDEO"
            ? "Your 3 preferred slots were sent to the doctor. One of them will be confirmed."
            : "Your appointment has been booked successfully."}
        </p>
      </div>

      {consultationMode === "VIDEO" ? (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card w-full max-w-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Video className="w-4 h-4" />
            {requiresVideoPayment && !videoPaymentCompleted
              ? "Payment required"
              : "Video Slot Proposal Submitted"}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {requiresVideoPayment && !videoPaymentCompleted
              ? "The doctor can review your selected slots after payment is completed."
              : "The doctor will review your selected slots and confirm one. You can track the status from your appointments page."}
          </p>
          <div className="w-full rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-center text-sm text-blue-700 dark:text-blue-300">
            Preferred slots: {selectedVideoSlots.join(", ")}
          </div>
          {requiresVideoPayment && !videoPaymentCompleted && bookedAppointmentId ? (
            <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 space-y-3">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                  Video Consultation Fee
                </p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  INR {videoPaymentAmount.toFixed(0)}
                </p>
              </div>
              <PaymentButton
                appointmentId={bookedAppointmentId}
                appointmentType="VIDEO_CALL"
                amount={videoPaymentAmount}
                description={selectedService?.label || "Video consultation"}
                className="w-full"
                onSuccess={() => {
                  setRequiresVideoPayment(false);
                  setVideoPaymentCompleted(true);
                  onBooked?.();
                }}
              >
                Pay now
              </PaymentButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border bg-card w-full max-w-sm">
          <div className="flex justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center mx-auto mb-1">
            <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-sm">
              {isPatientInPersonFlow ? "Your Next Steps" : "Fast Self Check-in Available"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isPatientInPersonFlow
                ? "Please reach the clinic a little before your appointment time. Once you arrive, open the check-in page and scan the reception QR to join the live queue."
                : "When you arrive at the clinic, simply scan the Reception QR code using your phone to instantly check-in to this appointment."}
            </p>
          </div>

          {isPatientInPersonFlow && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-xs text-blue-900 dark:text-blue-100 space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">1.</span>
                <span>Arrive at the clinic before your slot to avoid delays.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">2.</span>
                <span>Use the QR scanner at the clinic to check in for this appointment.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">3.</span>
                <span>You can open the check-in page anytime from the button below.</span>
              </div>
            </div>
          )}
          {shouldCollectVideoPayment && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-900 dark:text-emerald-100 space-y-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">1.</span>
                <span>Submit the request with your preferred slots.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">2.</span>
                <span>Complete payment for this video appointment.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 font-bold">3.</span>
                <span>The doctor can then confirm one of your proposed slots.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary pill row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          selectedService?.label,
          selectedDoctor?.name,
          selectedDate ? format(selectedDate, "d MMM") : "",
          consultationMode === "VIDEO" ? `${selectedVideoSlots.length} video slots` : selectedSlot,
        ].map((v, i) => v ? (
          <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            {v}
          </span>
        ) : null)}
      </div>

      <div className="w-full space-y-3 pt-4">
        {isPatientInPersonFlow && (
          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-glow-subtle transition-all active:scale-95"
            onClick={() => {
              setOpen(false);
              if (pathname !== patientCheckInRoute) {
                router.push(patientCheckInRoute);
              }
            }}
          >
            Open Check-in Page
          </Button>
        )}

        {!(consultationMode === "VIDEO" && requiresVideoPayment && !videoPaymentCompleted) && (
          <Button
            variant={isPatientInPersonFlow ? "outline" : "default"}
            className={`w-full h-12 rounded-xl font-semibold transition-all active:scale-95 ${
              isPatientInPersonFlow 
                ? "border-border/50 hover:bg-accent/50" 
                : "bg-primary hover:bg-primary/90 text-white shadow-glow-subtle hover:shadow-glow-medium"
            }`}
            onClick={() => {
              setOpen(false);
              if (pathname !== postBookingRoute) {
                router.push(postBookingRoute);
              }
            }}
          >
            {isPatientInPersonFlow ? "View Check-in Status" : postBookingLabel}
          </Button>
        )}
      </div>
    </div>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  const stepContent = [
    renderStep1,        // 1: Location + Mode
    renderStep2_Service, // 2: Service
    renderStep2,        // 3: Doctor
    renderStep3,        // 4: Date
    renderStep4,        // 5: Slot
    renderStep5,        // 6: Confirm
    renderStep6,        // 7: Success + QR
  ][step - 1];

  const stepTitle = [
    "Location & Mode",
    "Select Service",
    "Select Doctor",
    "Select Date",
    "Select Time Slot",
    "Confirm Appointment",
    consultationMode === "VIDEO" && requiresVideoPayment && !videoPaymentCompleted
      ? "Complete Payment"
      : "Booking Complete! 🎉",
  ][step - 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 rounded-xl border-0 bg-emerald-600 px-6 py-6 font-semibold text-white shadow-glow-subtle transition-all hover:bg-emerald-700 hover:shadow-glow-medium transform hover:-translate-y-0.5 active:scale-95 focus-visible:ring-2 focus-visible:ring-emerald-500/30">
            <Plus className="w-5 h-5" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="
        top-0 left-0 h-[100dvh] w-[100vw] max-w-none translate-x-0 translate-y-0
        flex flex-col gap-0 overflow-hidden rounded-none border-0 p-0
        md:top-1/2 md:left-1/2 md:h-[90dvh] md:w-[min(78vw,48rem)] md:max-w-2xl
        lg:top-1/2 lg:left-1/2 lg:h-[90dvh] lg:w-[min(66vw,42rem)] lg:max-w-xl
        sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border
      ">
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b shrink-0">
          <DialogHeader className="text-left w-full min-w-0">
            <DialogTitle className="text-base sm:text-lg font-bold truncate">{stepTitle}</DialogTitle>
            <DialogDescription className="sr-only">
              Book an in-person or video appointment by selecting location, service, doctor, date, and slot.
            </DialogDescription>
          </DialogHeader>

          {/* Step bar — hide on success screen */}
          {step < 7 && (
            <div className="mt-3 overflow-x-auto">
              {renderStepBar()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
          {stepContent?.()}
        </div>

        {/* Footer — hide on success screen */}
        {step < 7 && (
          <div className="px-4 sm:px-6 py-4 border-t bg-background flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={step > 1 ? goBack : () => setOpen(false)}
              className="h-11 w-full px-6 rounded-xl border-border/50 transition-all active:scale-95 gap-2 sm:w-auto"
            >
              <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Cancel"}
            </Button>
            <div className="hidden flex-1 sm:block" />

            {step < 6 ? (
              <Button
                onClick={goNext}
                disabled={!canNext}
                className="h-11 w-full px-8 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2 sm:w-auto"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleBook}
                disabled={
                  consultationMode === "VIDEO"
                    ? isProposingVideoAppointment
                    : isCreatingInPersonAppointment || isSubscriptionGateLoading
                }
                className="h-11 w-full px-8 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2 sm:w-auto"
              >
                {(consultationMode === "VIDEO" ? isProposingVideoAppointment : isCreatingInPersonAppointment || isSubscriptionGateLoading) ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {consultationMode === "VIDEO" ? "Preparing request..." : "Checking plan..."}</>
                ) : (
                  <><Check className="w-4 h-4" /> {consultationMode === "VIDEO" ? (shouldCollectVideoPayment ? `Send request • Pay INR ${videoPaymentAmount.toFixed(0)}` : "Send video request") : needsSubscriptionPlan ? "Choose plan to continue" : "Confirm & Book"}</>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
}
