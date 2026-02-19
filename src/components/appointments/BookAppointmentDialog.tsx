"use client";

import { useState, useEffect, useMemo } from "react";
import type { AppointmentType, TreatmentType } from "@/types/appointment.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useCreateAppointment, useDoctorAvailability } from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinic, useClinicContext, useMyClinic } from "@/hooks/query/useClinics";
import { APP_CONFIG } from "@/lib/config/config";
import { toast } from "sonner";
import { theme } from "@/lib/utils/theme-utils";
import { format, startOfDay } from "date-fns";
import {
  Activity,
  Plus,
  Video,
  MapPin,
  Clock,
  Leaf,
  Waves,
  Flame,
  Heart,
  Brain,
  Droplets,
  Wind,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  User,
  Building,
  Loader2
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
  /** Custom trigger element — if omitted a default "Book Appointment" button is shown */
  trigger?: React.ReactNode;
  /** Pre-selected clinic ID (e.g. from ClinicSelectDialog) */
  clinicId?: string;
  /** Pre-selected location ID */
  locationId?: string;
  /** Pre-selected clinic Name */
  clinicName?: string;
  /** Auto-open the dialog on mount */
  defaultOpen?: boolean;
  /** Callback fired after a successful booking */
  onBooked?: () => void;
}

// ─── Consultation catalogue (single source of truth) ────────────────────────

const CONSULTATION_TYPES: ConsultationTypeItem[] = [
  {
    id: "general_consultation",
    name: "General Consultation",
    description: "Comprehensive health assessment and treatment planning",
    duration: 30,
    price: 500,
    icon: <Activity className="w-5 h-5" />,
    color: theme.badges.blue,
    videoAvailable: true,
    category: "Consultation",
    backendType: "IN_PERSON",
    treatmentType: "GENERAL_CONSULTATION",
  },
  {
    id: "nadi_pariksha",
    name: "Nadi Pariksha",
    description: "Traditional pulse diagnosis to assess dosha imbalances",
    duration: 45,
    price: 800,
    icon: <Heart className="w-5 h-5" />,
    color: theme.badges.red,
    videoAvailable: false,
    category: "Diagnosis",
    backendType: "IN_PERSON",
    treatmentType: "NADI_PARIKSHA",
  },
  {
    id: "dosha_analysis",
    name: "Dosha Analysis",
    description: "Comprehensive constitutional analysis and lifestyle recommendations",
    duration: 60,
    price: 1000,
    icon: <Leaf className="w-5 h-5" />,
    color: theme.badges.green,
    videoAvailable: true,
    category: "Analysis",
    backendType: "IN_PERSON",
    treatmentType: "DOSHA_ANALYSIS",
  },
  {
    id: "ayurveda_consultation",
    name: "Ayurveda Consultation",
    description: "Holistic health assessment based on Doshas",
    duration: 45,
    price: 800,
    icon: <Leaf className="w-5 h-5" />,
    color: theme.badges.orange,
    videoAvailable: true,
    category: "Ayurveda",
    backendType: "IN_PERSON",
    treatmentType: "GENERAL_CONSULTATION", // Or specific Ayurveda type if available
  },
  {
    id: "panchakarma",
    name: "Panchakarma Therapy",
    description: "Detoxification and rejuvenation treatment sessions",
    duration: 90,
    price: 2000,
    icon: <Droplets className="w-5 h-5" />,
    color: theme.badges.cyan,
    videoAvailable: false,
    category: "Therapy",
    backendType: "IN_PERSON",
    treatmentType: "PANCHAKARMA",
  },
  {
    id: "shirodhara",
    name: "Shirodhara",
    description: "Medicated oil pouring therapy for stress and nervous disorders",
    duration: 60,
    price: 1500,
    icon: <Waves className="w-5 h-5" />,
    color: theme.badges.indigo,
    videoAvailable: false,
    category: "Therapy",
    backendType: "IN_PERSON",
    treatmentType: "SHIRODHARA",
  },
  {
    id: "abhyanga",
    name: "Abhyanga Massage",
    description: "Full body therapeutic oil massage for rejuvenation",
    duration: 75,
    price: 1200,
    icon: <Wind className="w-5 h-5" />,
    color: theme.badges.purple,
    videoAvailable: false,
    category: "Therapy",
    backendType: "IN_PERSON",
    treatmentType: "ABHYANGA",
  },
  {
    id: "viddhakarma",
    name: "Viddhakarma",
    description: "Minor surgical procedures using traditional Ayurvedic methods",
    duration: 45,
    price: 1800,
    icon: <Activity className="w-5 h-5" />,
    color: theme.badges.orange,
    videoAvailable: false,
    category: "Surgery",
    backendType: "IN_PERSON",
    treatmentType: "VIDDHAKARMA",
  },
  {
    id: "agnikarma",
    name: "Agnikarma",
    description: "Therapeutic cauterization for chronic pain and joint disorders",
    duration: 30,
    price: 1500,
    icon: <Flame className="w-5 h-5" />,
    color: theme.badges.red,
    videoAvailable: false,
    category: "Surgery",
    backendType: "IN_PERSON",
    treatmentType: "AGNIKARMA",
  },
  {
    id: "lifestyle_counseling",
    name: "Lifestyle Counseling",
    description: "Personalized diet, exercise and daily routine recommendations",
    duration: 45,
    price: 600,
    icon: <Brain className="w-5 h-5" />,
    color: theme.badges.emerald,
    videoAvailable: true,
    category: "Counseling",
    backendType: "IN_PERSON",
    treatmentType: "GENERAL_CONSULTATION",
  },
  {
    id: "follow_up",
    name: "Follow-up Consultation",
    description: "Progress review and treatment adjustments",
    duration: 20,
    price: 300,
    icon: <CheckCircle className="w-5 h-5" />,
    color: theme.badges.gray,
    videoAvailable: true,
    category: "Consultation",
    backendType: "IN_PERSON",
    treatmentType: "FOLLOW_UP",
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function BookAppointmentDialog({
  trigger,
  clinicId,
  locationId,
  clinicName,
  defaultOpen = false,
  onBooked,
}: BookAppointmentDialogProps) {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId: contextClinicId } = useClinicContext();
  const activeClinicId = clinicId || contextClinicId || APP_CONFIG.CLINIC.ID;

  // ─── State ────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(defaultOpen);
  // If location is pre-selected, start at Step 2
  const [currentStep, setCurrentStep] = useState(locationId ? 2 : 1);
  
  // Form Data
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locationId || "");
  const [consultationMode, setConsultationMode] = useState<"VIDEO" | "IN_PERSON" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  
  // Additional Details
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [urgency, setUrgency] = useState("Normal");

  // ─── Queries ──────────────────────────────────────────────────────────────
  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: locations = [], isPending: locationsLoading } = useActiveLocations(activeClinicId);
  const { data: clinic, isPending: clinicLoading } = useClinic(activeClinicId);
  const { data: myClinic } = useMyClinic();

  // Use myClinic data if available and matches the active ID (often more reliable for patients)
  const displayClinic = clinic || (myClinic?.id === activeClinicId ? myClinic : null);

  const { data: doctorsData, isPending: doctorsLoading } = useDoctors(activeClinicId, {
    locationId: selectedLocationId
  });
  
  // Construct date string YYYY-MM-DD for availability check
  const dateString = useMemo(() => {
     return selectedDate ? format(selectedDate, 'yyyy-MM-dd') : "";
  }, [selectedDate]);

  const { data: availability, isPending: availabilityLoading } = useDoctorAvailability(
    selectedDoctorId, 
    dateString,
    selectedLocationId
  );
  
  const { mutateAsync: createAppointment, isPending: isBooking } = useCreateAppointment();

  const selectedService = useMemo(() => 
    CONSULTATION_TYPES.find((t) => t.id === selectedServiceId), 
  [selectedServiceId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(locationId ? 2 : 1);
      setSelectedLocationId(locationId || "");
      setConsultationMode(null);
      setSelectedServiceId("");
      setSelectedDoctorId("");
      setSelectedDate(new Date());
      setSelectedSlot("");
      setChiefComplaint("");
      setSymptoms("");
      setUrgency("Normal");
    }
  }, [open, locationId]);

  const handleNext = () => {
    if (currentStep === 1 && !selectedLocationId) {
      toast.error("Please select a location");
      return;
    }
    if (currentStep === 2 && !consultationMode) {
      toast.error("Please select a consultation mode");
      return;
    }
    if (currentStep === 3 && !selectedServiceId) {
      toast.error("Please select a service");
      return;
    }
    
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleBookAppointment = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to book an appointment");
      return;
    }
    
    if (!selectedDoctorId || !selectedDate || !selectedSlot) {
      toast.error("Please select doctor, date and time");
      return;
    }

    if (!selectedService) {
        toast.error("Invalid service selection");
        return;
    }

    try {
      // Logic:
      // If Video Mode -> Type is VIDEO_CALL, Location is Omitted (backend logic)
      // If In-Person -> Type is SERVICE_backendType, Location is Required
      
      const payloadType = consultationMode === "VIDEO" ? "VIDEO_CALL" : selectedService.backendType;
      // Note: Even for VIDEO_CALL, we might want to send locationId if the backend allows it for record keeping,
      // but per requirements, In-Person definitely needs it.
      // If mode is VIDEO, we send the locationId only if the backend doesn't reject it, 
      // otherwise undefined. Let's send it if available, as the controller might use it for 'clinic' context.
      // Actually, plan said "Video Mode: locationId is omitted". Let's stick to that to be safe.
      const payloadLocationId = consultationMode === "IN_PERSON" ? selectedLocationId : undefined;

      await createAppointment({
        patientId: user.id as string,
        doctorId: selectedDoctorId,
        type: payloadType,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedSlot,
        duration: selectedService.duration,
        notes: chiefComplaint,
        symptoms: symptoms ? [symptoms] : [],
        priority: urgency.toUpperCase() as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        clinicId: activeClinicId,
        locationId: payloadLocationId,
      });

      toast.success("Appointment booked successfully!");
      setOpen(false);
      onBooked?.();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to book appointment";
      toast.error(msg);
    }
  };

  // ─── Step Renderers ───────────────────────────────────────────────────────

  const renderStep1_Location = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Clinic Context Header */}
      <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Booking Appointment For</p>
        
        {clinicLoading && !clinicName && !displayClinic ? (
           <div className="space-y-2">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
           </div>
        ) : (displayClinic || clinicName) ? (
           <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 shrink-0`}>
                 <Building className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-foreground">{displayClinic?.name || clinicName}</h3>
                 <p className="text-sm text-muted-foreground">
                    {displayClinic?.address ? `${displayClinic.address}, ${displayClinic.city || ""}` : "Ayurvedic Treatment Center"}
                 </p>
                 <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                       Verified Clinic
                    </span>
                 </div>
              </div>
           </div>
        ) : (
           <div className="text-center p-4 text-muted-foreground border border-dashed rounded-lg">
              Clinic information unavailable
           </div>
        )}
      </div>

      {/* Select Location Section */}
      <div>
         <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select Location</h3>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
               {locationsLoading ? "..." : `${locations.length} Locations Available`}
            </span>
         </div>

        {locationsLoading ? (
          <div className="space-y-3">
             <div className="h-20 rounded-xl bg-muted animate-pulse" />
             <div className="h-20 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
              {locations.map((loc) => (
                  <div
                  key={loc.id}
                  onClick={() => setSelectedLocationId(loc.id)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md relative overflow-hidden group ${
                      selectedLocationId === loc.id
                      ? `${theme.borders.primary} ${theme.containers.featureBlue} ring-2 ring-blue-500 bg-white dark:bg-gray-900`
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white dark:bg-gray-900"
                  }`}
                  >
                  <div className="flex items-start gap-4 relative z-10">
                      <div className={`mt-1 shrink-0`}>
                         {selectedLocationId === loc.id ? (
                             <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                             </div>
                         ) : (
                             <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-blue-500/50 transition-colors" />
                         )}
                      </div>
                      <div className="flex-1">
                          <div className="flex items-start justify-between">
                             <h4 className={`font-bold text-base ${selectedLocationId === loc.id ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                                {loc.name}
                             </h4>
                             {selectedLocationId === loc.id && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                   Selected
                                </span>
                             )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="line-clamp-1">{loc.address}, {loc.city}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md flex items-center gap-1.5 border border-green-100 dark:border-green-900/30">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Accepting Appointments
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md">
                                 <Clock className="w-3 h-3" />
                                 {loc.workingHours ? "Open Now" : "09:00 AM - 06:00 PM"}
                              </span>
                          </div>
                      </div>
                  </div>
                  {selectedLocationId === loc.id && (
                      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                         <MapPin className="w-24 h-24 text-blue-600" />
                      </div>
                  )}
                  </div>
              ))}

              {locations.length === 0 && !locationsLoading && (
                  <div className="text-center p-8 bg-muted/30 rounded-xl border border-dashed">
                      <p className="text-muted-foreground font-medium">No active locations found for this clinic.</p>
                      <p className="text-xs text-muted-foreground mt-1">Please try again later or contact support.</p>
                  </div>
              )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2_Mode = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Consultation Mode</h3>
        <p className={`text-sm ${theme.textColors.secondary}`}>
          How would you like to consult with the doctor?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => setConsultationMode("IN_PERSON")}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${
            consultationMode === "IN_PERSON"
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
          }`}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">In-Person Visit</h4>
              <p className="text-sm text-muted-foreground">
                Visit the clinic for a physical examination and direct consultation.
              </p>
            </div>
            <div className="mt-2 text-xs font-medium text-blue-600">
                RECOMMENDED FOR THERAPIES
            </div>
          </div>
        </div>

        <div
          onClick={() => setConsultationMode("VIDEO")}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg group ${
            consultationMode === "VIDEO"
              ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
              : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
          }`}
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-lg mb-1">Video Consultation</h4>
              <p className="text-sm text-muted-foreground">
                Connect with doctors remotely from the comfort of your home.
              </p>
            </div>
            <div className="mt-2 text-xs font-medium text-purple-600">
                IDEAL FOR FOLLOW-UPS
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3_Service = () => {
    // Filter types based on mode
    const filteredTypes = CONSULTATION_TYPES.filter(t => {
      if (consultationMode === "VIDEO") return t.videoAvailable;
      // In-Person -> Show all treatments (since all current types are fundamentally In-Person compatible or hybrid)
      // If there were video-only types, we'd filter them out here.
      return true; 
    });

    // Group by category
    const categories = Array.from(new Set(filteredTypes.map(t => t.category)));
    
    // Filter by selected category, but handle "All"
    const displayServices = selectedCategory === "All"
        ? filteredTypes
        : filteredTypes.filter(t => t.category === selectedCategory);

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-1">Select Service</h3>
          <p className={`text-sm ${theme.textColors.secondary}`}>
            Choose the specific treatment or consultation type.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
          <Badge 
            variant={selectedCategory === "All" ? "default" : "outline"}
            className="cursor-pointer px-4 py-2 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
            onClick={() => setSelectedCategory("All")}
          >
            All
          </Badge>
          {categories.map(cat => (
             <Badge 
             key={cat}
             variant={selectedCategory === cat ? "default" : "outline"}
             className="cursor-pointer px-4 py-2 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
             onClick={() => setSelectedCategory(cat)}
           >
             {cat}
           </Badge>
          ))}
        </div>

        {/* Grid */}
        <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayServices.map((type) => (
                <div
                key={type.id}
                onClick={() => { setSelectedServiceId(type.id); }}
                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md group ${
                    selectedServiceId === type.id
                    ? `${theme.borders.primary} ${theme.containers.featureBlue} ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20`
                    : "border-border hover:border-primary/50 bg-card"
                }`}
                >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shadow-sm ${selectedServiceId === type.id ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground group-hover:bg-blue-50 group-hover:text-blue-500'} transition-colors`}>{type.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-foreground">{type.name}</h4>
                            {/* Price hidden as requested - Subscription based */}
                            {/* <span className="font-bold text-sm">₹{type.price}</span> */}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                            {type.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <span className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-md text-secondary-foreground">
                                <Clock className="w-3.5 h-3.5" /> {type.duration} min
                            </span>
                            
                            {/* Only show Video badge if Mode is NOT In-Person (or if it's explicitly Video mode) */}
                            {type.videoAvailable && consultationMode !== "IN_PERSON" && (
                                <span className="flex items-center gap-1.5 text-green-700 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800">
                                <Video className="w-3.5 h-3.5" /> Video
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
            {displayServices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>No services found in this category.</p>
                </div>
            )}
        </ScrollArea>
      </div>
    );
  };

  const renderStep4_DoctorTime = () => {
    // Safely extract doctors list
    const doctorsList = Array.isArray(doctorsData) 
      ? doctorsData 
      : (doctorsData as any)?.doctors || [];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
        
        {/* Top: Doctor Selection */}
        <div>
           <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-lg">Select Doctor</h3>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {doctorsLoading ? "Loading..." : `${doctorsList.length} Available`}
              </span>
           </div>
           
           {doctorsLoading ? (
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-64 h-24 bg-muted animate-pulse rounded-xl shrink-0" />
                ))}
              </div>
           ) : doctorsList.length > 0 ? (
              <ScrollArea className="w-full pb-4">
                 <div className="flex gap-4 pb-2">
                    {doctorsList.map((doctor: any) => (
                      <div
                        key={doctor.id}
                        onClick={() => {
                            setSelectedDoctorId(doctor.id);
                            setSelectedSlot(""); 
                        }}
                        className={`min-w-[240px] p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md relative overflow-hidden group ${
                            selectedDoctorId === doctor.id
                            ? `${theme.borders.primary} ${theme.containers.featureBlue} ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20`
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedDoctorId === doctor.id ? 'bg-blue-100 text-blue-600' : 'bg-secondary text-muted-foreground'}`}>
                              {doctor.image ? (
                                <img src={doctor.image} alt={doctor.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <Stethoscope className="w-6 h-6" />
                              )}
                           </div>
                           <div>
                              <p className="font-bold text-base line-clamp-1">{doctor.name}</p>
                              <p className="text-xs text-muted-foreground mb-1">{doctor.specialization}</p>
                              <div className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Available
                              </div>
                           </div>
                        </div>
                        {selectedDoctorId === doctor.id && (
                           <div className="absolute top-2 right-2 text-blue-600">
                              <CheckCircle className="w-4 h-4" />
                           </div>
                        )}
                      </div>
                    ))}
                 </div>
                 <ScrollBar orientation="horizontal" />
              </ScrollArea>
           ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl bg-muted/30">
                 <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                 <p className="text-sm font-medium text-muted-foreground">No doctors found for this location.</p>
                 <p className="text-xs text-muted-foreground mt-1">Try changing the location or checking back later.</p>
              </div>
           )}
        </div>

        {/* Middle: Date & Time Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
            {/* Calendar */}
            <div className="flex flex-col">
                 <h3 className="font-semibold mb-3">Select Date</h3>
                 <div className="border rounded-xl p-4 bg-card shadow-sm flex-1 flex justify-center">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < startOfDay(new Date())}
                        className="p-0"
                        classNames={{
                           day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                           day_today: "bg-accent text-accent-foreground",
                        }} 
                    />
                 </div>
            </div>

            {/* Slots */}
            <div className="flex flex-col h-full min-h-[300px]">
                <h3 className="font-semibold mb-3 flex items-center justify-between">
                   <span>Available Slots</span>
                   {selectedDate && <span className="text-xs font-normal text-muted-foreground">{format(selectedDate, "EEEE, MMMM d")}</span>}
                </h3>
                
                <div className={`flex-1 border rounded-xl overflow-hidden bg-card shadow-sm relative ${!selectedDoctorId ? 'bg-muted/30' : ''}`}>
                    {!selectedDoctorId ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                            <Stethoscope className="w-10 h-10 mb-3 opacity-20" />
                            <p className="font-medium">Please select a doctor first</p>
                            <p className="text-xs mt-1">We need to know who you're visiting to show their schedule.</p>
                        </div>
                    ) : availabilityLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full max-h-[300px] w-full p-4">
                           {availability?.availableSlots?.length ? (
                               <div className="grid grid-cols-3 gap-3">
                                   {availability.availableSlots.map((slot: string) => (
                                       <Button
                                           key={slot}
                                           variant={selectedSlot === slot ? "default" : "outline"}
                                           size="sm"
                                           onClick={() => setSelectedSlot(slot)}
                                           className={`w-full transition-all ${selectedSlot === slot ? "ring-2 ring-primary ring-offset-1" : "hover:border-primary/50"}`}
                                       >
                                           {slot}
                                       </Button>
                                   ))}
                               </div>
                           ) : (
                               <div className="flex flex-col items-center justify-center h-full py-10 text-muted-foreground">
                                   <Clock className="w-10 h-10 mb-3 text-muted-foreground/30" />
                                   <p className="font-medium">No slots available</p>
                                   <p className="text-xs mt-1">Please try a different date or doctor.</p>
                               </div>
                           )}
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
        
        {/* Bottom: Complaint & Urgency */}
        <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Label className="mb-2 block">Urgency Level</Label>
                    <Select value={urgency} onValueChange={setUrgency}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low Priority</SelectItem>
                            <SelectItem value="Normal">Normal Priority</SelectItem>
                            <SelectItem value="High">High Priority</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                      <Label className="mb-2 block">Chief Complaint / Reason for Visit</Label>
                      <Input 
                        value={chiefComplaint} 
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="E.g., High fever since yesterday, Persistent back pain..." 
                      />
                  </div>
            </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <DialogHeader>
             <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">New Appointment</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={currentStep >= 1 ? "text-primary font-medium" : ""}>Location</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentStep >= 2 ? "text-primary font-medium" : ""}>Mode</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentStep >= 3 ? "text-primary font-medium" : ""}>Service</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={currentStep >= 4 ? "text-primary font-medium" : ""}>Details</span>
                </div>
             </div>
          </DialogHeader>
          
          {/* Progress Bar */}
          <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
             <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 4) * 100}%` }}
             />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50 dark:bg-black/20">
            {currentStep === 1 && renderStep1_Location()}
            {currentStep === 2 && renderStep2_Mode()}
            {currentStep === 3 && renderStep3_Service()}
            {currentStep === 4 && renderStep4_DoctorTime()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-background flex justify-between items-center">
            <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <div className="flex gap-4 items-center">
                 {currentStep === 4 && (
                     <div className="text-right mr-4 hidden md:block">
                        <p className="text-sm font-medium">{selectedService?.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {selectedDate ? format(selectedDate, "MMM d") : ""} • {selectedSlot || "No time selected"}
                        </p>
                     </div>
                 )}
                 
                 {currentStep < 4 ? (
                    <Button onClick={handleNext} className="gap-2 w-32">
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                 ) : (
                    <Button 
                        onClick={handleBookAppointment} 
                        disabled={isBooking || !selectedSlot}
                        className="gap-2 w-40 bg-green-600 hover:bg-green-700"
                    >
                        {isBooking ? "Booking..." : "Confirm Booking"}
                    </Button>
                 )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
