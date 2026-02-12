"use client";

import { useState, useEffect } from "react";
import type { AppointmentType } from "@/types/appointment.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useCreateAppointment } from "@/hooks/query/useAppointments";
import { APP_CONFIG } from "@/lib/config/config";
import { toast } from "sonner";
import { theme } from "@/lib/utils/theme-utils";
import {
  Activity,
  Plus,
  Video,
  MapPin,
  Clock,
  CreditCard,
  Leaf,
  Waves,
  Flame,
  Heart,
  Brain,
  Droplets,
  Wind,
  CheckCircle,
  Info,
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
    backendType: "NADI_PARIKSHA",
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
    backendType: "DOSHA_ANALYSIS",
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
    backendType: "PANCHAKARMA",
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
    backendType: "SHIRODHARA",
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
    backendType: "ABHYANGA",
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
    backendType: "VIDDHAKARMA",
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
    backendType: "AGNIKARMA",
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

  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState("consultation-types");
  const [selectedConsultationType, setSelectedConsultationType] = useState("");
  const [isVideoConsultation, setIsVideoConsultation] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    doctorId: "",
    date: "",
    time: "",
    duration: 30,
    chiefComplaint: "",
    symptoms: "",
    urgency: "Normal",
    preferredLanguage: "English",
    clinicId: clinicId || APP_CONFIG.CLINIC.ID,
    locationId: locationId || "",
  });

  // Keep clinicId / locationId in sync with props
  useEffect(() => {
    if (clinicId) setBookingForm((f) => ({ ...f, clinicId }));
    if (locationId) setBookingForm((f) => ({ ...f, locationId }));
  }, [clinicId, locationId]);

  const { data: doctorsData, isPending: doctorsLoading } = useDoctors(bookingForm.clinicId);
  const { mutateAsync: createAppointment, isPending: isBooking } = useCreateAppointment();

  const selectedType = CONSULTATION_TYPES.find((t) => t.id === selectedConsultationType);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleConsultationTypeSelect = (typeId: string) => {
    const type = CONSULTATION_TYPES.find((t) => t.id === typeId);
    setSelectedConsultationType(typeId);
    setBookingForm((prev) => ({
      ...prev,
      duration: type?.duration || 30,
    }));
    if (type && !type.videoAvailable) {
      setIsVideoConsultation(false);
    }
  };

  const handleVideoToggle = (checked: boolean) => {
    setIsVideoConsultation(checked);
  };

  const handleBookAppointment = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to book an appointment");
      return;
    }
    if (!selectedConsultationType) {
      toast.error("Please select a treatment type");
      setActiveTab("consultation-types");
      return;
    }
    if (!bookingForm.doctorId) {
      toast.error("Please select a doctor");
      setActiveTab("appointment-details");
      return;
    }
    if (!bookingForm.date || !bookingForm.time) {
      toast.error("Please select date and time");
      setActiveTab("appointment-details");
      return;
    }

    try {
      // Resolve the correct backend AppointmentType
      const resolvedType: AppointmentType = (() => {
        if (!selectedType) return isVideoConsultation ? "VIDEO_CALL" : "IN_PERSON";
        if (isVideoConsultation && selectedType.videoAvailable) return "VIDEO_CALL";
        return selectedType.backendType;
      })();

      await createAppointment({
        patientId: user.id as string,
        doctorId: bookingForm.doctorId,
        type: resolvedType,
        date: bookingForm.date,
        time: bookingForm.time,
        duration: bookingForm.duration,
        notes: bookingForm.chiefComplaint,
        symptoms: bookingForm.symptoms ? [bookingForm.symptoms] : [],
        priority: bookingForm.urgency.toUpperCase() as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        clinicId: bookingForm.clinicId,
        locationId: bookingForm.locationId,
      });

      toast.success("Appointment booked successfully!");
      setOpen(false);
      resetForm();
      onBooked?.();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to book appointment";
      toast.error(msg);
    }
  };

  const resetForm = () => {
    setSelectedConsultationType("");
    setIsVideoConsultation(false);
    setActiveTab("consultation-types");
    setBookingForm({
      doctorId: "",
      date: "",
      time: "",
      duration: 30,
      chiefComplaint: "",
      symptoms: "",
      urgency: "Normal",
      preferredLanguage: "English",
      clinicId: clinicId || APP_CONFIG.CLINIC.ID,
      locationId: locationId || "",
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" />
            Book Appointment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Ayurvedic Consultation</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultation-types">Select Treatment</TabsTrigger>
            <TabsTrigger value="appointment-details">Appointment Details</TabsTrigger>
            <TabsTrigger value="payment-summary">Payment Summary</TabsTrigger>
          </TabsList>

          {/* ── Tab 1 — Select Treatment ─────────────────────────────── */}
          <TabsContent value="consultation-types">
            <div className="space-y-4">
              <div className={`text-sm ${theme.textColors.secondary} mb-4`}>
                Choose the type of Ayurvedic consultation or treatment you need:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONSULTATION_TYPES.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedConsultationType === type.id
                        ? `${theme.borders.blue} ${theme.containers.featureBlue}`
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleConsultationTypeSelect(type.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleConsultationTypeSelect(type.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${type.color}`}>{type.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{type.name}</h3>
                          <Badge variant="outline">{type.category}</Badge>
                        </div>
                        <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                          {type.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {type.duration} min
                            </span>
                            {type.videoAvailable && (
                              <span className={`flex items-center gap-1 ${theme.iconColors.green}`}>
                                <Video className="w-3 h-3" />
                                Video available
                              </span>
                            )}
                          </div>
                          <span className={`font-semibold ${theme.iconColors.blue}`}>
                            ₹{type.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Next button */}
              <div className="flex justify-end pt-2">
                <Button
                  disabled={!selectedConsultationType}
                  onClick={() => setActiveTab("appointment-details")}
                >
                  Next: Appointment Details
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 2 — Appointment Details ────────────────────────── */}
          <TabsContent value="appointment-details">
            <div className="space-y-6">
              {selectedType && (
                <div className={`p-4 ${theme.containers.featureBlue} rounded-lg`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${selectedType.color}`}>
                      {selectedType.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedType.name}</h3>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        {selectedType.duration} minutes • ₹{selectedType.price}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="doctor">Select Doctor</Label>
                  <Select
                    value={bookingForm.doctorId}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, doctorId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={doctorsLoading ? "Loading doctors..." : "Select doctor"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(doctorsData as any)?.doctors?.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} ({doctor.specialization})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input
                    id="date"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="time">Preferred Time</Label>
                  <Select
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, time: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">09:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00">02:00 PM</SelectItem>
                      <SelectItem value="15:00">03:00 PM</SelectItem>
                      <SelectItem value="16:00">04:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedType?.videoAvailable && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4" />
                        <Label>Video Consultation</Label>
                      </div>
                      <p className={`text-sm ${theme.textColors.secondary}`}>
                        Consult from the comfort of your home
                      </p>
                    </div>
                    <Switch
                      checked={isVideoConsultation}
                      onCheckedChange={handleVideoToggle}
                    />
                  </div>

                  {isVideoConsultation && (
                    <div
                      className={`p-4 ${theme.containers.featureGreen} border ${theme.borders.green} rounded-lg`}
                    >
                      <div className="flex items-start gap-2">
                        <Info className={`w-4 h-4 ${theme.iconColors.green} mt-0.5`} />
                        <div className={`text-sm ${theme.textColors.success}`}>
                          <p className="font-medium mb-1">Video Consultation Benefits:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>No travel required</li>
                            <li>Same quality consultation</li>
                            <li>Secure &amp; private</li>
                            <li>Digital prescription provided</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low - Routine consultation</SelectItem>
                      <SelectItem value="Normal">Normal - Standard appointment</SelectItem>
                      <SelectItem value="High">High - Need consultation soon</SelectItem>
                      <SelectItem value="Urgent">Urgent - Within 24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, preferredLanguage: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Input
                  id="chiefComplaint"
                  value={bookingForm.chiefComplaint}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, chiefComplaint: e.target.value }))
                  }
                  placeholder="Brief description of your main concern"
                />
              </div>

              <div>
                <Label htmlFor="symptoms">Detailed Symptoms &amp; Medical History</Label>
                <Textarea
                  id="symptoms"
                  value={bookingForm.symptoms}
                  onChange={(e) =>
                    setBookingForm((prev) => ({ ...prev, symptoms: e.target.value }))
                  }
                  placeholder="Describe your symptoms, duration, any previous treatments, current medications, etc."
                  rows={4}
                />
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setActiveTab("consultation-types")}>
                  Back
                </Button>
                <Button
                  onClick={() => setActiveTab("payment-summary")}
                  disabled={!bookingForm.doctorId || !bookingForm.date || !bookingForm.time}
                >
                  Next: Review &amp; Pay
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ── Tab 3 — Payment Summary ──────────────────────────── */}
          <TabsContent value="payment-summary">
            <div className="space-y-6">
              {selectedType && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Booking Summary</h3>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Treatment:</span>
                      <span className="font-medium">{selectedType.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Duration:</span>
                      <span>{selectedType.duration} minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Consultation Type:</span>
                      <div className="flex items-center gap-2">
                        {isVideoConsultation ? (
                          <>
                            <Video className="w-4 h-4" />
                            <span>Video Consultation</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>In-Person Visit</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Date &amp; Time:</span>
                      <span>
                        {bookingForm.date} at {bookingForm.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Urgency:</span>
                      <Badge variant="outline">{bookingForm.urgency}</Badge>
                    </div>
                  </div>

                  <div className={`p-4 ${theme.backgrounds.secondary} rounded-lg space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span>Consultation Fee:</span>
                      <span>₹{selectedType.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Platform Fee:</span>
                      <span>₹50</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GST (18%):</span>
                      <span>₹{Math.round((selectedType.price + 50) * 0.18)}</span>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span>
                        ₹{selectedType.price + 50 + Math.round((selectedType.price + 50) * 0.18)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Payment Method</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div
                        className={`p-3 border rounded-lg cursor-pointer ${theme.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Credit/Debit Card</span>
                        </div>
                      </div>
                      <div
                        className={`p-3 border rounded-lg cursor-pointer ${theme.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      >
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          <span>UPI</span>
                        </div>
                      </div>
                      <div
                        className={`p-3 border rounded-lg cursor-pointer ${theme.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>Net Banking</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActiveTab("appointment-details")}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleBookAppointment}
                      disabled={isBooking}
                    >
                      {isBooking ? "Booking..." : "Confirm & Pay"}
                    </Button>
                  </div>
                </div>
              )}

              {!selectedType && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select a treatment type first.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("consultation-types")}>
                    Select Treatment
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
