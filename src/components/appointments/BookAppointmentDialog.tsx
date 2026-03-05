"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppointmentType, TreatmentType } from "@/types/appointment.types";
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
import { useDoctors } from "@/hooks/query/useDoctors";
import { useCreateAppointment, useDoctorAvailability } from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
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

interface ConsultationTypeItem {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  icon: React.ReactNode;
  color: string;
  videoAvailable: boolean;
  category: string;
  backendType: AppointmentType;
  treatmentType: TreatmentType;
}

interface BookAppointmentDialogProps {
  trigger?: React.ReactNode;
  clinicId?: string;
  locationId?: string;
  clinicName?: string;
  defaultOpen?: boolean;
  onBooked?: () => void;
}

// ─── Consultation catalogue ──────────────────────────────────────────────────

const CONSULTATION_TYPES: ConsultationTypeItem[] = [
  { id: "general_consultation", name: "General Consultation", description: "Comprehensive health assessment and treatment planning", duration: 30, price: 500, icon: <Activity className="w-5 h-5" />, color: theme.badges.blue, videoAvailable: true, category: "Consultation", backendType: "IN_PERSON", treatmentType: "GENERAL_CONSULTATION" },
  { id: "nadi_pariksha", name: "Nadi Pariksha", description: "Traditional pulse diagnosis to assess dosha imbalances", duration: 45, price: 800, icon: <Heart className="w-5 h-5" />, color: theme.badges.red, videoAvailable: false, category: "Diagnosis", backendType: "IN_PERSON", treatmentType: "NADI_PARIKSHA" },
  { id: "dosha_analysis", name: "Dosha Analysis", description: "Comprehensive constitutional analysis and lifestyle recommendations", duration: 60, price: 1000, icon: <Brain className="w-5 h-5" />, color: theme.badges.purple, videoAvailable: true, category: "Diagnosis", backendType: "IN_PERSON", treatmentType: "DOSHA_ANALYSIS" },
  { id: "panchakarma", name: "Panchakarma Therapy", description: "Traditional detoxification and rejuvenation treatment", duration: 90, price: 2000, icon: <Leaf className="w-5 h-5" />, color: theme.badges.emerald, videoAvailable: false, category: "Treatment", backendType: "IN_PERSON", treatmentType: "PANCHAKARMA" },
  { id: "abhyanga", name: "Abhyanga Massage", description: "Full body Ayurvedic therapeutic oil massage", duration: 60, price: 1200, icon: <Waves className="w-5 h-5" />, color: theme.badges.blue, videoAvailable: false, category: "Treatment", backendType: "IN_PERSON", treatmentType: "ABHYANGA" },
  { id: "shirodhara", name: "Shirodhara", description: "Continuous oil flow on forehead for stress and anxiety", duration: 45, price: 1500, icon: <Droplets className="w-5 h-5" />, color: theme.badges.blue, videoAvailable: false, category: "Treatment", backendType: "IN_PERSON", treatmentType: "SHIRODHARA" },
  { id: "swedana", name: "Swedana (Steam)", description: "Herbal steam therapy for detoxification and relaxation", duration: 30, price: 800, icon: <Wind className="w-5 h-5" />, color: theme.badges.orange, videoAvailable: false, category: "Treatment", backendType: "IN_PERSON", treatmentType: "SWEDANA" },
  { id: "agnikarma", name: "Agnikarma", description: "Therapeutic heat procedure for musculoskeletal pain relief", duration: 45, price: 1000, icon: <Flame className="w-5 h-5" />, color: theme.badges.red, videoAvailable: false, category: "Surgery", backendType: "IN_PERSON", treatmentType: "AGNIKARMA" },
  { id: "lifestyle_counseling", name: "Lifestyle Counseling", description: "Personalized diet, exercise and daily routine recommendations", duration: 45, price: 600, icon: <Brain className="w-5 h-5" />, color: theme.badges.emerald, videoAvailable: true, category: "Counseling", backendType: "IN_PERSON", treatmentType: "GENERAL_CONSULTATION" },
  { id: "follow_up", name: "Follow-up Consultation", description: "Progress review and treatment adjustments", duration: 20, price: 300, icon: <CheckCircle className="w-5 h-5" />, color: theme.badges.gray, videoAvailable: true, category: "Consultation", backendType: "IN_PERSON", treatmentType: "FOLLOW_UP" },
];

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
}: BookAppointmentDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();
  const activeClinicId = clinicId || contextClinicId || APP_CONFIG.CLINIC.ID;

  // ─── Dialog / Step state ──────────────────────────────────────────────────
  const [open, setOpen] = useState(defaultOpen);
  // If locationId provided as prop, skip step 1
  const [step, setStep] = useState(locationId ? 2 : 1);
  const [serviceFilter, setServiceFilter] = useState("All");

  // ─── Selections ───────────────────────────────────────────────────────────
  const [selectedLocationId, setSelectedLocationId] = useState(locationId || "");
  const [consultationMode, setConsultationMode] = useState<"IN_PERSON" | "VIDEO">("IN_PERSON");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getTodayIST());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [bookedAppointmentId, setBookedAppointmentId] = useState("");

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: locations = [] } = useActiveLocations(activeClinicId);
  const { data: doctorsData, isPending: doctorsLoading } = useDoctors(activeClinicId, {
    locationId: selectedLocationId,
  });

  const dateString = useMemo(() => (selectedDate ? formatDateIST(selectedDate) : ""), [selectedDate]);

  const { data: availability, isPending: availabilityLoading, error: availabilityError } = useDoctorAvailability(
    activeClinicId,
    selectedDoctorId,
    dateString,
    selectedLocationId
  );

  const { mutateAsync: createAppointment, isPending: isBooking } = useCreateAppointment();

  // ─── Derived ─────────────────────────────────────────────────────────────
  const selectedService = useMemo(
    () => CONSULTATION_TYPES.find((t) => t.id === selectedServiceId),
    [selectedServiceId]
  );

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

  const slots = useMemo(() => {
    if (Array.isArray((availability as any)?.availableSlots)) return (availability as any).availableSlots;
    if (Array.isArray((availability as any)?.data?.availableSlots)) return (availability as any).data.availableSlots;
    if (Array.isArray((availability as any)?.data?.data?.availableSlots)) return (availability as any).data.data.availableSlots;
    return [];
  }, [availability]);

  const slotGroups = useMemo(() => groupSlotsByPeriod(slots as string[]), [slots]);

  // ─── Reset on close ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setStep(locationId ? 2 : 1);
      setSelectedLocationId(locationId || "");
      setConsultationMode("IN_PERSON");
      setSelectedServiceId("");
      setSelectedDoctorId("");
      setSelectedDate(getTodayIST());
      setSelectedSlot("");
      setChiefComplaint("");
      setUrgency("Normal");
      setBookedAppointmentId("");
    }
  }, [open, locationId]);

  // Auto-pick first location
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      setSelectedLocationId((locations[0] as any)?.id || "");
    }
  }, [locations, selectedLocationId]);

  // ─── Book appointment ─────────────────────────────────────────────────────
  const handleBook = useCallback(async () => {
    if (!selectedService || !selectedDoctorId || !selectedDate || !selectedSlot) return;

    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      appointmentDate.setHours(hours ?? 0, minutes ?? 0, 0, 0);

      const result = await createAppointment({
        clinicId: activeClinicId,
        doctorId: selectedDoctorId,
        locationId: selectedLocationId,
        date: formatDateIST(appointmentDate),
        time: selectedSlot,
        type: (consultationMode || selectedService.backendType) as AppointmentType,
        treatmentType: selectedService.treatmentType,
        duration: selectedService.duration,
        notes: chiefComplaint || selectedService.name,
        priority: urgency.toUpperCase() as any,
        patientId: session?.user?.id ?? "",
      });

      const apptId = (result as any)?.id || (result as any)?.data?.id || "APPT-" + Date.now();
      setBookedAppointmentId(apptId);
      setStep(7); // step 7 = success/QR screen
      onBooked?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to book appointment. Please try again.");
    }
  }, [selectedService, selectedDoctorId, selectedDate, selectedSlot, chiefComplaint, urgency, activeClinicId, selectedLocationId, createAppointment, session, onBooked]);

  // ─── Navigation ──────────────────────────────────────────────────────────
  const canNext = useMemo(() => {
    if (step === 1) return !!selectedLocationId && !!consultationMode;
    if (step === 2) return !!selectedServiceId;
    if (step === 3) return !!selectedDoctorId;
    if (step === 4) return !!selectedDate;
    if (step === 5) return !!selectedSlot;
    return true;
  }, [step, selectedLocationId, selectedServiceId, selectedDoctorId, selectedDate, selectedSlot]);

  const TOTAL_STEPS = 6;
  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // ─── QR data ─────────────────────────────────────────────────────────────
  const qrData = useMemo(() => {
    return JSON.stringify({
      appointmentId: bookedAppointmentId,
      patient: session?.user?.name,
      doctor: selectedDoctor?.name,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
      slot: selectedSlot,
    });
  }, [bookedAppointmentId, session, selectedDoctor, selectedDate, selectedSlot]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;

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
    const categories = ["All", ...Array.from(new Set(CONSULTATION_TYPES.map((t) => t.category)))];
    const filtered = serviceFilter === "All" ? CONSULTATION_TYPES : CONSULTATION_TYPES.filter((t) => t.category === serviceFilter);

    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">What type of consultation do you need?</p>
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
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedServiceId(t.id);
                setTimeout(goNext, 100);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                selectedServiceId === t.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                selectedServiceId === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <p className={`font-semibold text-sm ${selectedServiceId === t.id ? "text-primary" : ""}`}>{t.name}</p>
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
      <div className="flex justify-center p-2 rounded-2xl bg-muted/20 border border-border shadow-sm">
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
            return date < todayIST;
          }}
          className="mx-auto"
        />
      </div>
      {selectedDate && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
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
        <p className="text-sm text-muted-foreground">
          Available slots for <span className="font-semibold text-foreground">{selectedDoctor?.name}</span> on{" "}
          <span className="font-semibold text-foreground">{selectedDate ? format(selectedDate, "d MMM") : ""}</span>
        </p>

        {availabilityLoading ? (
          <div className="flex items-center gap-2 py-6 text-muted-foreground text-sm justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Checking availability...
          </div>
        ) : slots.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground text-center border border-dashed rounded-xl">
            <Clock className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm font-medium">No slots available</p>
            <p className="text-xs mt-1 opacity-60">Try a different date or doctor</p>
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
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          selectedSlot === slot
                            ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20"
                            : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {slot}
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
          { label: "Service", value: selectedService?.name, sub: selectedService?.category },
          { label: "Doctor", value: selectedDoctor?.name, sub: selectedDoctor?.specialization || "General Physician" },
          { label: "Date", value: selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : "" },
          { label: "Time", value: selectedSlot },
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
        <h3 className="text-lg font-bold">Appointment Confirmed!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your appointment has been booked successfully.
        </p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card w-full max-w-xs">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <QrCode className="w-4 h-4" /> Clinic Check-in QR
        </div>
        <img
          src={qrUrl}
          alt="Appointment QR Code"
          className="w-40 h-40 rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground text-center">
          Show this QR code at the clinic reception for instant check-in
        </p>
        <a
          href={qrUrl}
          download={`appointment-${bookedAppointmentId}.png`}
          className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <Download className="w-3 h-3" /> Download QR Code
        </a>
      </div>

      {/* Summary pill row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          selectedService?.name,
          selectedDoctor?.name,
          selectedDate ? format(selectedDate, "d MMM") : "",
          selectedSlot,
        ].map((v, i) => v ? (
          <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            {v}
          </span>
        ) : null)}
      </div>

      <Button
        className="w-full"
        onClick={() => {
          setOpen(false);
          // Ensure users land on appointment list after successful booking.
          if (pathname !== "/patient/appointments") {
            router.push("/patient/appointments");
          }
        }}
      >
        View My Appointments
      </Button>
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
          <Button className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all">
            <Plus className="w-4 h-4" />
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
          <div className="px-4 sm:px-5 py-3 border-t bg-background flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              onClick={step > 1 ? goBack : () => setOpen(false)}
              className="gap-1.5 shrink-0"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" /> {step > 1 ? "Back" : "Cancel"}
            </Button>
            
            <div className="flex-1" />

            {step < 6 ? (
              <Button
                onClick={goNext}
                disabled={!canNext}
                className="gap-1.5 min-w-[100px]"
                size="sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleBook}
                disabled={isBooking}
                className="gap-1.5 min-w-[140px] bg-green-600 hover:bg-green-700"
                size="sm"
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
