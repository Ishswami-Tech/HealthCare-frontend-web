"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import AppointmentManager from "@/components/appointments/AppointmentManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  FileText,
  Pill,
  User,
  LogOut,
  Plus,
  Video,
  MapPin,
  Clock,
  CreditCard,
  Leaf,
  Sun,
  Waves,
  Flame,
  Heart,
  Brain,
  Droplets,
  Wind,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function PatientAppointments() {
  const { session } = useAuth();
  const user = session?.user;
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedConsultationType, setSelectedConsultationType] = useState("");
  const [isVideoConsultation, setIsVideoConsultation] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    doctorId: "",
    consultationType: "",
    date: "",
    time: "",
    isOnline: false,
    duration: 30,
    chiefComplaint: "",
    symptoms: "",
    urgency: "Normal",
    preferredLanguage: "English"
  });

  // Ayurveda-specific consultation types with descriptions and durations
  const ayurvedaConsultationTypes = [
    {
      id: "general_consultation",
      name: "General Consultation",
      description: "Comprehensive health assessment and treatment planning",
      duration: 30,
      price: 500,
      icon: <Activity className="w-5 h-5" />,
      color: "bg-blue-50 text-blue-700",
      videoAvailable: true,
      category: "Consultation"
    },
    {
      id: "nadi_pariksha",
      name: "Nadi Pariksha",
      description: "Traditional pulse diagnosis to assess dosha imbalances",
      duration: 45,
      price: 800,
      icon: <Heart className="w-5 h-5" />,
      color: "bg-red-50 text-red-700",
      videoAvailable: false,
      category: "Diagnosis"
    },
    {
      id: "dosha_analysis",
      name: "Dosha Analysis",
      description: "Comprehensive constitutional analysis and lifestyle recommendations",
      duration: 60,
      price: 1000,
      icon: <Leaf className="w-5 h-5" />,
      color: "bg-green-50 text-green-700",
      videoAvailable: true,
      category: "Analysis"
    },
    {
      id: "panchakarma",
      name: "Panchakarma Therapy",
      description: "Detoxification and rejuvenation treatment sessions",
      duration: 90,
      price: 2000,
      icon: <Droplets className="w-5 h-5" />,
      color: "bg-cyan-50 text-cyan-700",
      videoAvailable: false,
      category: "Therapy"
    },
    {
      id: "shirodhara",
      name: "Shirodhara",
      description: "Medicated oil pouring therapy for stress and nervous disorders",
      duration: 60,
      price: 1500,
      icon: <Waves className="w-5 h-5" />,
      color: "bg-indigo-50 text-indigo-700",
      videoAvailable: false,
      category: "Therapy"
    },
    {
      id: "abhyanga",
      name: "Abhyanga Massage",
      description: "Full body therapeutic oil massage for rejuvenation",
      duration: 75,
      price: 1200,
      icon: <Wind className="w-5 h-5" />,
      color: "bg-purple-50 text-purple-700",
      videoAvailable: false,
      category: "Therapy"
    },
    {
      id: "viddhakarma",
      name: "Viddhakarma",
      description: "Minor surgical procedures using traditional Ayurvedic methods",
      duration: 45,
      price: 1800,
      icon: <Activity className="w-5 h-5" />,
      color: "bg-orange-50 text-orange-700",
      videoAvailable: false,
      category: "Surgery"
    },
    {
      id: "agnikarma",
      name: "Agnikarma",
      description: "Therapeutic cauterization for chronic pain and joint disorders",
      duration: 30,
      price: 1500,
      icon: <Flame className="w-5 h-5" />,
      color: "bg-red-50 text-red-700",
      videoAvailable: false,
      category: "Surgery"
    },
    {
      id: "lifestyle_counseling",
      name: "Lifestyle Counseling",
      description: "Personalized diet, exercise and daily routine recommendations",
      duration: 45,
      price: 600,
      icon: <Brain className="w-5 h-5" />,
      color: "bg-emerald-50 text-emerald-700",
      videoAvailable: true,
      category: "Counseling"
    },
    {
      id: "follow_up",
      name: "Follow-up Consultation",
      description: "Progress review and treatment adjustments",
      duration: 20,
      price: 300,
      icon: <CheckCircle className="w-5 h-5" />,
      color: "bg-gray-50 text-gray-700",
      videoAvailable: true,
      category: "Consultation"
    }
  ];

  const selectedType = ayurvedaConsultationTypes.find(type => type.id === selectedConsultationType);

  const handleConsultationTypeSelect = (typeId: string) => {
    const type = ayurvedaConsultationTypes.find(t => t.id === typeId);
    setSelectedConsultationType(typeId);
    setBookingForm(prev => ({
      ...prev,
      consultationType: typeId,
      duration: type?.duration || 30
    }));
    
    // If video is not available for this type, disable video consultation
    if (type && !type.videoAvailable) {
      setIsVideoConsultation(false);
      setBookingForm(prev => ({ ...prev, isOnline: false }));
    }
  };

  const handleVideoToggle = (checked: boolean) => {
    setIsVideoConsultation(checked);
    setBookingForm(prev => ({ ...prev, isOnline: checked }));
  };

  const handleBookAppointment = () => {
    console.log("Booking appointment:", bookingForm);
    // Here you would call the booking API
    setShowBookingDialog(false);
  };

  // Mock existing appointments
  const existingAppointments = [
    {
      id: "1",
      type: "Panchakarma Therapy",
      doctor: "Dr. Priya Sharma",
      date: "2024-01-22",
      time: "10:00 AM",
      status: "Confirmed",
      isOnline: false,
      duration: "90 min",
      price: 2000
    },
    {
      id: "2",
      type: "Follow-up Consultation", 
      doctor: "Dr. Amit Singh",
      date: "2024-01-25",
      time: "3:00 PM",
      status: "Confirmed",
      isOnline: true,
      duration: "20 min",
      price: 300
    }
  ];

  const sidebarLinks = getRoutesByRole(Role.PATIENT).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('medical-records') ? <FileText className="w-5 h-5" /> :
          route.path.includes('prescriptions') ? <Pill className="w-5 h-5" /> :
          route.path.includes('profile') ? <User className="w-5 h-5" /> :
          <Activity className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Patient Appointments" allowedRole={Role.PATIENT}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Patient",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Book New Appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Book Ayurvedic Consultation</DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="consultation-types" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="consultation-types">Select Treatment</TabsTrigger>
                    <TabsTrigger value="appointment-details">Appointment Details</TabsTrigger>
                    <TabsTrigger value="payment-summary">Payment Summary</TabsTrigger>
                  </TabsList>

                  <TabsContent value="consultation-types">
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 mb-4">
                        Choose the type of Ayurvedic consultation or treatment you need:
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ayurvedaConsultationTypes.map((type) => (
                          <div
                            key={type.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedConsultationType === type.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleConsultationTypeSelect(type.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${type.color}`}>
                                {type.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold">{type.name}</h3>
                                  <Badge variant="outline">{type.category}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {type.duration} min
                                    </span>
                                    {type.videoAvailable && (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <Video className="w-3 h-3" />
                                        Video available
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-blue-600">₹{type.price}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="appointment-details">
                    <div className="space-y-6">
                      {selectedType && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${selectedType.color}`}>
                              {selectedType.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold">{selectedType.name}</h3>
                              <p className="text-sm text-gray-600">
                                {selectedType.duration} minutes • ₹{selectedType.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="date">Preferred Date</Label>
                          <Input
                            id="date"
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingForm.date}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">Preferred Time</Label>
                          <Select onValueChange={(value) => setBookingForm(prev => ({ ...prev, time: value }))}>
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
                              <p className="text-sm text-gray-600">
                                Consult from the comfort of your home
                              </p>
                            </div>
                            <Switch
                              checked={isVideoConsultation}
                              onCheckedChange={handleVideoToggle}
                            />
                          </div>
                          
                          {isVideoConsultation && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-green-600 mt-0.5" />
                                <div className="text-sm text-green-800">
                                  <p className="font-medium mb-1">Video Consultation Benefits:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>No travel required</li>
                                    <li>Same quality consultation</li>
                                    <li>Secure & private</li>
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
                          <Select onValueChange={(value) => setBookingForm(prev => ({ ...prev, urgency: value }))}>
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
                          <Select onValueChange={(value) => setBookingForm(prev => ({ ...prev, preferredLanguage: value }))}>
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
                          onChange={(e) => setBookingForm(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                          placeholder="Brief description of your main concern"
                        />
                      </div>

                      <div>
                        <Label htmlFor="symptoms">Detailed Symptoms & Medical History</Label>
                        <Textarea
                          id="symptoms"
                          value={bookingForm.symptoms}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, symptoms: e.target.value }))}
                          placeholder="Describe your symptoms, duration, any previous treatments, current medications, etc."
                          rows={4}
                        />
                      </div>
                    </div>
                  </TabsContent>

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
                              <span>Date & Time:</span>
                              <span>{bookingForm.date} at {bookingForm.time}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Urgency:</span>
                              <Badge variant="outline">{bookingForm.urgency}</Badge>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
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
                              <span>₹{selectedType.price + 50 + Math.round((selectedType.price + 50) * 0.18)}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium">Payment Method</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  <span>Credit/Debit Card</span>
                                </div>
                              </div>
                              <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <Droplets className="w-4 h-4" />
                                  <span>UPI</span>
                                </div>
                              </div>
                              <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-2">
                                  <Activity className="w-4 h-4" />
                                  <span>Net Banking</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowBookingDialog(false)}>
                              Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleBookAppointment}>
                              Confirm & Pay
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Existing AppointmentManager Component */}
          <Card>
            <CardHeader>
              <CardTitle>Current Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <AppointmentManager />
            </CardContent>
          </Card>

          {/* Ayurveda Treatment Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5" />
                Ayurvedic Treatment Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Activity className="w-8 h-8 text-blue-600 mb-3" />
                  <h3 className="font-semibold mb-2">Consultations</h3>
                  <p className="text-sm text-gray-600 mb-3">General health assessment and follow-ups</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Book Now
                  </Button>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <Droplets className="w-8 h-8 text-green-600 mb-3" />
                  <h3 className="font-semibold mb-2">Panchakarma</h3>
                  <p className="text-sm text-gray-600 mb-3">Detox and rejuvenation therapies</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Book Now
                  </Button>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Heart className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold mb-2">Diagnosis</h3>
                  <p className="text-sm text-gray-600 mb-3">Nadi Pariksha and dosha analysis</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Book Now
                  </Button>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <Flame className="w-8 h-8 text-orange-600 mb-3" />
                  <h3 className="font-semibold mb-2">Specialized</h3>
                  <p className="text-sm text-gray-600 mb-3">Agnikarma, Viddhakarma procedures</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Understanding Ayurvedic Treatments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Traditional Therapies</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Droplets className="w-5 h-5 text-cyan-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Panchakarma</h5>
                        <p className="text-sm text-gray-600">Five-action detoxification process including Vamana, Virechana, Basti, Nasya, and Raktamokshana</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Waves className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Shirodhara</h5>
                        <p className="text-sm text-gray-600">Continuous pouring of medicated oils on forehead for stress relief and mental clarity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Wind className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Abhyanga</h5>
                        <p className="text-sm text-gray-600">Full-body therapeutic massage with warm herbal oils to improve circulation and flexibility</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Diagnostic Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Nadi Pariksha</h5>
                        <p className="text-sm text-gray-600">Pulse diagnosis to assess dosha imbalances and overall health status</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Leaf className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Prakriti Analysis</h5>
                        <p className="text-sm text-gray-600">Constitutional assessment to determine individual body type and treatment approach</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Sun className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium">Vikriti Assessment</h5>
                        <p className="text-sm text-gray-600">Current health imbalances and deviation from natural constitution</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

