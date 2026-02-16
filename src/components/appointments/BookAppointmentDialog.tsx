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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useCreateAppointment, useDoctorAvailability } from "@/hooks/query/useAppointments";
import { useActiveLocations } from "@/hooks/query/useClinics";
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
  User
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
  defaultOpen = false,
  onBooked,
}: BookAppointmentDialogProps) {
  const { session } = useAuth();
  const user = session?.user;
  const activeClinicId = clinicId || APP_CONFIG.CLINIC.ID;

  // ─── State ────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(defaultOpen);
  const [currentStep, setCurrentStep] = useState(1);
  
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
  const { data: locations = [], isPending: locationsLoading } = useActiveLocations(activeClinicId);
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
      setCurrentStep(1);
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

  // Skip Step 1 if location is pre-selected and there's only one or it's forced
  useEffect(() => {
    if (open && currentStep === 1 && locationId) {
      // If location is provided via props, we pre-select it
      setSelectedLocationId(locationId);
      // We don't auto-advance because user might want to check the location details
      // But we could auto-advance if needed. For now let's keep it explicit.
    }
  }, [open, currentStep, locationId]);

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
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">Select Clinic Location</h3>
        <p className={`text-sm ${theme.textColors.secondary}`}>
          Where would you like to visit?
        </p>
      </div>

      {locationsLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              onClick={() => setSelectedLocationId(loc.id)}
              className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                selectedLocationId === loc.id
                  ? `${theme.borders.primary} ${theme.containers.featureBlue} ring-1 ring-blue-500`
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{loc.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{loc.address}, {loc.city}</p>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {loc.workingHours ? "Open Now" : "9:00 AM - 6:00 PM"}
                  </p>
                </div>
                {selectedLocationId === loc.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {locations.length === 0 && !locationsLoading && (
        <div className="text-center p-8 bg-gray-50 rounded-lg dark:bg-gray-800/50">
          <p>No active locations found for this clinic.</p>
        </div>
      )}
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
          onClick={() => { setConsultationMode("IN_PERSON"); handleNext(); }}
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
          onClick={() => { setConsultationMode("VIDEO"); handleNext(); }}
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
      return true; // In-Person usually allows everything
    });

    // Group by category
    const categories = Array.from(new Set(filteredTypes.map(t => t.category)));
    const filteredByCategory = selectedCategory === "All" 
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
            className="cursor-pointer px-4 py-2"
            onClick={() => setSelectedCategory("All")}
          >
            All
          </Badge>
          {categories.map(cat => (
             <Badge 
             key={cat}
             variant={selectedCategory === cat ? "default" : "outline"}
             className="cursor-pointer px-4 py-2"
             onClick={() => setSelectedCategory(cat)}
           >
             {cat}
           </Badge>
          ))}
        </div>

        {/* Grid */}
        <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredByCategory.map((type) => (
                <div
                key={type.id}
                onClick={() => { setSelectedServiceId(type.id); }}
                className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedServiceId === type.id
                    ? `${theme.borders.primary} ${theme.containers.featureBlue} ring-1 ring-blue-500`
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                }`}
                >
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${type.color} shadow-sm`}>{type.icon}</div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{type.name}</h4>
                            <span className="font-bold text-sm">₹{type.price}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {type.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" /> {type.duration} min
                            </span>
                            {type.videoAvailable && (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                                <Video className="w-3 h-3" /> Video
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </ScrollArea>
      </div>
    );
  };

  const renderStep4_DoctorTime = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        {/* Left: Doctors List */}
        <div className="lg:col-span-4 flex flex-col h-full border-r pr-4">
            <h3 className="font-semibold mb-4">Select Doctor</h3>
            <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                    {doctorsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading doctors...</p>
                    ) : (doctorsData as any)?.doctors?.map((doctor: any) => (
                        <div
                            key={doctor.id}
                            onClick={() => {
                                setSelectedDoctorId(doctor.id);
                                setSelectedSlot(""); // Reset slot when doctor changes
                            }}
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                selectedDoctorId === doctor.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{doctor.name}</p>
                                    <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Right: Date & Time */}
        <div className="lg:col-span-8 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                     <h3 className="font-semibold mb-4">Select Date</h3>
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < startOfDay(new Date())}
                        className="border rounded-md shadow-sm w-full"
                    />
                </div>
                <div>
                    <h3 className="font-semibold mb-4">Available Slots</h3>
                    {selectedDoctorId ? (
                        <ScrollArea className="h-[300px]">
                            {availabilityLoading ? (
                                <div className="flex items-center justify-center h-40">
                                    <p className="text-muted-foreground text-sm">Loading slots...</p>
                                </div>
                            ) : availability?.availableSlots?.length ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {availability.availableSlots.map((slot: string) => (
                                        <Button
                                            key={slot}
                                            variant={selectedSlot === slot ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setSelectedSlot(slot)}
                                            className="w-full"
                                        >
                                            {slot}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm">No slots available for this date.</p>
                                </div>
                            )}
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
                             <p className="text-sm">Select a doctor to view availability</p>
                        </div>
                    )}
                </div>
             </div>
        
            {/* Additional Inputs */}
            <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label>Urgency</Label>
                        <Select value={urgency} onValueChange={setUrgency}>
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Normal">Normal</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div>
                         <Label>Chief Complaint</Label>
                         <Input 
                            value={chiefComplaint} 
                            onChange={(e) => setChiefComplaint(e.target.value)}
                            placeholder="Brief reason for visit" 
                            className="h-9"
                        />
                     </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

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
