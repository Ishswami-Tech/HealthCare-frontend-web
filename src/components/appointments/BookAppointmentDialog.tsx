"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  AppointmentServiceDefinition,
  AppointmentType,
  TreatmentType,
} from "@/types/appointment.types";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";

import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import { useDoctors } from "@/hooks/query/useDoctors";
import { usePatients } from "@/hooks/query/usePatients";
import {
  useAppointmentServices,
  useCreateAppointment,
  useDoctorAvailability,
} from "@/hooks/query/useAppointments";
import { useSubscriptions } from "@/hooks/query/useBilling";
import { useSendAppointmentReminder } from "@/hooks/query/useCommunication";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { checkSubscriptionCoverage, createInPersonAppointmentWithSubscription } from "@/lib/actions/billing.server";
import { PaymentButton } from "@/components/payments";
import { APP_CONFIG } from "@/lib/config/config";
import { toast } from "sonner";
import { theme } from "@/lib/utils/theme-utils";
import { format } from "date-fns";
import {
  Activity, Plus, Leaf, Waves, Clock,
  Flame, Heart, Brain, Droplets, Wind, CheckCircle,
  ChevronLeft, User, Loader2,
  CalendarIcon, Sun, CloudSun, Moon, QrCode, Download,
  Check, ArrowRight, Video, MapPin, Building,
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
  const visuals: Record<TreatmentType, ConsultationVisual> = {
    GENERAL_CONSULTATION: { icon: <Activity className={iconClass} />, color: theme.badges.blue },
    FOLLOW_UP: { icon: <CheckCircle className={iconClass} />, color: theme.badges.gray },
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

  return visuals[treatmentType];
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
const APPOINTMENT_SLOT_DURATION_MINUTES = 3;

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Helper to get Today in IST (India Standard Time)
 * Ensures frontend and backend agree on what 'Today' is, regardless of browser timezone.
 */
const getTodayIST = () => {
  const now = new Date();
  // Get date parts in IST
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const istDateString = formatter.format(now); // "YYYY-MM-DD"
  // Create a local date object set to that day (start of day)
  return new Date(istDateString);
};

const formatDateIST = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

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
  const { session } = useAuth();
  const { hasPermission } = useRBAC();
  const userRole = (session?.user?.role || "").toUpperCase();
  const postBookingRoute = userRole === "RECEPTIONIST" ? "/receptionist/appointments" : "/patient/appointments";
  const postBookingLabel = userRole === "RECEPTIONIST" ? "View Reception Desk" : "View My Appointments";
  const patientCheckInRoute = "/patient/check-in";
  const { clinicId: contextClinicId } = useClinicContext();
  const activeClinicId = clinicId || contextClinicId || APP_CONFIG.CLINIC.ID;

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
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [bookedAppointmentId, setBookedAppointmentId] = useState("");
  const [videoPaymentCompleted, setVideoPaymentCompleted] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId || "");

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: locations = [] } = useActiveLocations(activeClinicId);
  const { data: appointmentServices = [], isPending: servicesLoading } = useAppointmentServices();
  const { data: doctorsData, isPending: doctorsLoading } = useDoctors(activeClinicId, {
    locationId: selectedLocationId,
  });
  // Only RECEPTIONIST needs the full patient list to select a patient.
  // Patients book for themselves — calling this admin endpoint as a PATIENT
  // returns 403 Forbidden. Pass an empty clinicId to disable the query.
  const { data: patientsData = [] } = usePatients(
    ["RECEPTIONIST", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(userRole) ? activeClinicId : "",
    { limit: 1000, isActive: true }
  );

  const dateString = useMemo(() => (selectedDate ? formatDateIST(selectedDate) : ""), [selectedDate]);

  const { data: availability, isPending: availabilityLoading, error: availabilityError } = useDoctorAvailability(
    activeClinicId,
    selectedDoctorId,
    dateString,
    selectedLocationId
  );

  const { mutateAsync: createAppointment, isPending: isBooking } = useCreateAppointment(activeClinicId);
  const { mutate: sendReminder } = useSendAppointmentReminder();
  const targetPatientId =
    ["RECEPTIONIST", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(userRole)
      ? selectedPatientId
      : session?.user?.id || "";
  const { data: subscriptionsData = [] } = useSubscriptions(targetPatientId);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const modeAppointmentType: AppointmentType =
    consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";
  const isPatientInPersonFlow = userRole === "PATIENT" && consultationMode === "IN_PERSON";

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

  const selectedVideoConsultationFee = useMemo(() => {
    if (!selectedService) return 0;

    const candidateValues = [
      selectedService.videoConsultationFee,
      (selectedService as any).consultationFee,
      (selectedService as any).amount,
      (selectedService as any).price,
      (selectedService as any).fee,
    ];

    for (const value of candidateValues) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue) && numericValue > 0) {
        return numericValue;
      }
    }

    return 0;
  }, [selectedService]);

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

  const selectedPatient = useMemo(
    () => patientsList.find((patient: any) => (patient.userId || patient.id) === selectedPatientId),
    [patientsList, selectedPatientId]
  );

  const activeSubscription = useMemo(
    () =>
      (subscriptionsData as any[]).find(
        (s: any) =>
          (s.status === "ACTIVE" || s.status === "TRIALING") &&
          (!s.clinicId || s.clinicId === activeClinicId)
      ),
    [subscriptionsData, activeClinicId]
  );

  const slots = useMemo(() => {
    if (Array.isArray((availability as any)?.availableSlots)) return (availability as any).availableSlots;
    if (Array.isArray((availability as any)?.data?.availableSlots)) return (availability as any).data.availableSlots;
    if (Array.isArray((availability as any)?.data?.data?.availableSlots)) return (availability as any).data.data.availableSlots;
    return [];
  }, [availability]);

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

  const slotGroups = useMemo(() => groupSlotsByPeriod(effectiveSlots as string[]), [effectiveSlots]);

  useEffect(() => {
    if (open) {
      setStep(( (locationId && initialConsultationMode) || initialConsultationMode === "VIDEO" ) ? 2 : (locationId ? 2 : 1));
      setSelectedLocationId(locationId || "");
      setConsultationMode(initialConsultationMode || "IN_PERSON");
      setSelectedServiceId(initialServiceId || "");
      setSelectedDoctorId(initialDoctorId || "");
      setSelectedPatientId(initialPatientId || "");
      setSelectedDate(getTodayIST());
      setSelectedSlot("");
      setChiefComplaint("");
      setUrgency("Normal");
      setBookedAppointmentId("");
      setVideoPaymentCompleted(false);
    }
  }, [open, locationId, initialConsultationMode, initialServiceId, initialDoctorId, initialPatientId]);

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
    if (!selectedService || !selectedDoctorId || !selectedDate || !selectedSlot || !targetPatientId) return;

    const redirectToSubscriptionCheckout = (message?: string) => {
      toast.error(
        message || "You don't have an active subscription for this in-person appointment. Please subscribe to continue."
      );
      router.push("/billing?tab=plans&intent=subscribe");
    };

    try {
      const finalAppointmentType: AppointmentType =
        consultationMode === "VIDEO" ? "VIDEO_CALL" : "IN_PERSON";

      if (finalAppointmentType === "IN_PERSON" && userRole === "PATIENT" && !activeSubscription) {
        redirectToSubscriptionCheckout(
          "You don't have an active subscription for in-person appointments. Please subscribe to continue."
        );
        return;
      }

      if (finalAppointmentType === "IN_PERSON" && activeSubscription?.id) {
        const coverageResult = await checkSubscriptionCoverage(activeSubscription.id, "IN_PERSON");
        if (!coverageResult.success) {
          toast.error(coverageResult.error || "Unable to validate subscription coverage.");
          return;
        }
        const coverage = coverageResult.coverage;
        const covered =
          coverage?.covered === true ||
          coverage?.allowed === true;
        if (!covered) {
          const reason =
            coverage?.message ||
            coverage?.reason ||
            (coverage?.requiresPayment
              ? `Subscription coverage unavailable. Additional payment required: INR ${coverage?.paymentAmount || 0}`
              : "Subscription quota exhausted or inactive.");
          redirectToSubscriptionCheckout(reason);
          return;
        }
      }

      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      let apptId = "";
      if (finalAppointmentType === "IN_PERSON" && userRole === "PATIENT" && activeSubscription?.id) {
        const atomicResult = await createInPersonAppointmentWithSubscription({
          subscriptionId: activeSubscription.id,
          patientId: targetPatientId,
          doctorId: selectedDoctorId,
          clinicId: activeClinicId,
          locationId: selectedLocationId,
          appointmentDate: appointmentDate.toISOString(),
          // Testing mode: keep bookings short so repeated appointment flows are easy to validate.
          duration: APPOINTMENT_SLOT_DURATION_MINUTES,
          treatmentType: selectedService.treatmentType,
          priority: urgency.toUpperCase(),
          notes: chiefComplaint || selectedService.label,
        });
        if (!atomicResult.success) {
          throw new Error(atomicResult.error || "Failed to create subscription-based appointment");
        }
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
          duration: APPOINTMENT_SLOT_DURATION_MINUTES,
          notes: chiefComplaint || selectedService.label,
          priority: urgency.toUpperCase() as any,
          patientId: targetPatientId,
        };

        console.log("[BookAppointmentDialog] handleBook Payload:", payload);

        const appointment = await createAppointment(payload);

        console.log("[BookAppointmentDialog] handleBook Response:", appointment);

        if (!appointment?.id) {
          throw new Error("Failed to create appointment; check console for details.");
        }
        apptId = appointment.id;
      }

      setBookedAppointmentId(apptId);
      queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      // Send appointment reminder via push + email + WhatsApp
      if (hasPermission(Permission.SEND_NOTIFICATIONS)) {
        sendReminder({ appointmentId: apptId, reminderType: 'all' });
      }
      onBooked?.();
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
          lowerErrorMessage.includes("subscription coverage unavailable") ||
          (lowerErrorMessage.includes("subscription") && lowerErrorMessage.includes("required")));

      if (shouldRedirectToSubscription) {
        redirectToSubscriptionCheckout(
          "You don't have an active subscription for this appointment. Please subscribe and continue to payment."
        );
        return;
      }

      toast.error(errorMessage);
    }
  }, [
    selectedService,
    selectedDoctorId,
    selectedDate,
    selectedSlot,
    targetPatientId,
    chiefComplaint,
    urgency,
    activeClinicId,
    selectedLocationId,
    createAppointment,
    onBooked,
    consultationMode,
    userRole,
    activeSubscription,
    router,
    queryClient,
  ]);

  // ─── Navigation ──────────────────────────────────────────────────────────
  const canNext = useMemo(() => {
    if (step === 1) return !!selectedLocationId && !!consultationMode;
    if (step === 2) {
      const isOfficeStaff = ["RECEPTIONIST", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(userRole);
      return !!selectedServiceId && (!isOfficeStaff || !!selectedPatientId);
    }
    if (step === 3) return !!selectedDoctorId;
    if (step === 4) return !!selectedDate;
    if (step === 5) return !!selectedSlot;
    return true;
  }, [step, selectedLocationId, consultationMode, selectedServiceId, selectedDoctorId, selectedDate, selectedSlot, userRole, selectedPatientId]);

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
      {/* Location */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visit Location</p>
        {(locations as any[]).length === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-xl text-muted-foreground text-sm">
            <Building className="w-7 h-7 mx-auto mb-2 opacity-30" />
            Loading locations...
          </div>
        ) : (
          <div className="space-y-2">
            {(locations as any[]).map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  setSelectedLocationId(loc.id);
                  // Auto-proceed if consultation mode is also selected (it has a default)
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
                // Auto-proceed if location is also selected
                if (selectedLocationId) setTimeout(goNext, 150);
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

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">What type of consultation do you need?</p>
        {["RECEPTIONIST", "CLINIC_ADMIN", "SUPER_ADMIN"].includes(userRole) ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Patient
            </label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose a patient for this booking" />
              </SelectTrigger>
              <SelectContent>
                {patientsList.map((patient: any) => (
                  <SelectItem key={patient.userId || patient.id} value={patient.userId || patient.id}>
                    {patient.displayName}
                    {patient.phone ? ` • ${patient.phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPatient ? (
              <p className="text-xs text-muted-foreground">
                Booking for {selectedPatient.displayName}
                {selectedPatient.phone ? ` • ${selectedPatient.phone}` : ""}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Receptionist bookings must be linked to an existing patient.
              </p>
            )}
          </div>
        ) : null}
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
          className="border border-border/50 shadow-sm"
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

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Available slots for <span className="font-semibold text-foreground">{selectedDoctor?.name}</span> on{" "}
            <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, "d MMM") : ""}</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> {APPOINTMENT_SLOT_DURATION_MINUTES} min per slot
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
            {periods.map((period) =>
              period.slots.length === 0 ? null : (
                <div key={period.key}>
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
                          {APPOINTMENT_SLOT_DURATION_MINUTES} min
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
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
          { label: "Time", value: selectedSlot },
          { label: "Duration", value: `${APPOINTMENT_SLOT_DURATION_MINUTES} min` },
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
          {consultationMode === "VIDEO" && !videoPaymentCompleted
            ? "Payment Required To Confirm"
            : "Appointment Confirmed!"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {consultationMode === "VIDEO" && !videoPaymentCompleted
            ? "Your video appointment has been created. Complete payment to confirm it."
            : "Your appointment has been booked successfully."}
        </p>
      </div>

      {consultationMode === "VIDEO" ? (
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card w-full max-w-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Video className="w-4 h-4" />
            {videoPaymentCompleted ? "Payment Received" : "Video Payment Required"}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {videoPaymentCompleted
              ? "Payment is complete. Your video appointment should now move to confirmed status."
              : "Video appointments are billed per appointment. Complete payment first, then the appointment will be confirmed."}
          </p>
          {!videoPaymentCompleted && selectedVideoConsultationFee > 0 ? (
            <PaymentButton
              appointmentId={bookedAppointmentId}
              amount={selectedVideoConsultationFee}
              description={selectedService?.label || "Video Consultation"}
              className="w-full"
              onSuccess={() => {
                setVideoPaymentCompleted(true);
                queryClient.invalidateQueries({ queryKey: ["myAppointments"] });
                queryClient.invalidateQueries({ queryKey: ["appointments"] });
              }}
            >
              Pay INR {selectedVideoConsultationFee.toLocaleString("en-IN")}
            </PaymentButton>
          ) : !videoPaymentCompleted ? (
            <div className="w-full rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-center text-sm text-amber-700 dark:text-amber-300">
              Video consultation fee is not available for this service yet.
            </div>
          ) : (
            <div className="w-full rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 text-center text-sm text-green-700 dark:text-green-300">
              Payment completed. You can check the appointment status from your appointments page.
            </div>
          )}
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
        </div>
      )}

      {/* Summary pill row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          selectedService?.label,
          selectedDoctor?.name,
          selectedDate ? format(selectedDate, "d MMM") : "",
          selectedSlot,
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
          {postBookingLabel}
        </Button>
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
    "Booking Confirmed! 🎉",
  ][step - 1];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-6 py-6 font-semibold shadow-glow-subtle hover:shadow-glow-medium transition-all transform hover:-translate-y-0.5 active:scale-95">
            <Plus className="w-5 h-5" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="
        w-full max-w-none sm:max-w-md
        h-dvh sm:h-[650px]
        flex flex-col p-0 gap-0 overflow-hidden
        rounded-none sm:rounded-2xl
        top-0 sm:top-1/2 left-0 sm:left-1/2
        translate-y-0 sm:-translate-y-1/2 sm:-translate-x-1/2
      ">
        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b shrink-0">
          <DialogHeader className="text-left w-full min-w-0">
            <DialogTitle className="text-base sm:text-lg font-bold truncate">{stepTitle}</DialogTitle>
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
          <div className="px-4 sm:px-6 py-4 border-t bg-background flex items-center gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={step > 1 ? goBack : () => setOpen(false)}
              className="h-11 px-6 rounded-xl border-border/50 transition-all active:scale-95 gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Cancel"}
            </Button>
            
            <div className="flex-1" />

            {step < 6 ? (
              <Button
                onClick={goNext}
                disabled={!canNext}
                className="h-11 px-8 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleBook}
                disabled={isBooking}
                className="h-11 px-8 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-glow-subtle hover:shadow-glow-medium transition-all active:scale-95 gap-2"
              >
                {isBooking ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                ) : (
                  <><Check className="w-4 h-4" /> Confirm & Book</>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>

    </Dialog>
  );
}
