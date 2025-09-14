"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { 
  Activity,
  Calendar, 
  Users,
  UserCheck,
  LogOut,
  Play,
  CheckCircle,
  Clock,
  Stethoscope,
  FileText,
  Video,
  Phone,
  MessageSquare,
  Search,
  Eye
} from "lucide-react";

export default function DoctorAppointments() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("checked_in");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  // Mock appointment data - filtered to show only checked-in patients by default
  const appointments = [
    {
      id: "1",
      patientName: "Rajesh Kumar",
      patientAge: 45,
      patientGender: "Male",
      time: "10:00 AM",
      status: "In Progress",
      type: "Panchakarma Consultation",
      duration: "45 min",
      appointmentDate: "2024-01-15",
      patientPhone: "+91 9876543210",
      patientEmail: "rajesh.kumar@email.com",
      chiefComplaint: "Chronic lower back pain and joint stiffness",
      medicalHistory: "Diabetes, Hypertension",
      allergies: "None known",
      currentMedications: "Metformin 500mg, Amlodipine 5mg",
      vitalSigns: {
        bp: "130/80 mmHg",
        pulse: "76 bpm",
        temperature: "98.6°F",
        weight: "70 kg"
      },
      checkedInAt: "09:45 AM",
      queuePosition: 1
    },
    {
      id: "2", 
      patientName: "Priya Sharma",
      patientAge: 32,
      patientGender: "Female",
      time: "10:30 AM",
      status: "Checked In",
      type: "Nadi Pariksha",
      duration: "60 min",
      appointmentDate: "2024-01-15",
      patientPhone: "+91 9876543211",
      patientEmail: "priya.sharma@email.com",
      chiefComplaint: "Digestive issues, irregular menstrual cycle",
      medicalHistory: "PCOS, Iron deficiency anemia",
      allergies: "Nuts",
      currentMedications: "Iron supplements",
      vitalSigns: {
        bp: "110/70 mmHg",
        pulse: "82 bpm", 
        temperature: "98.4°F",
        weight: "58 kg"
      },
      checkedInAt: "10:15 AM",
      queuePosition: 2
    },
    {
      id: "3",
      patientName: "Amit Singh", 
      patientAge: 28,
      patientGender: "Male",
      time: "11:15 AM",
      status: "Checked In",
      type: "Follow-up Consultation",
      duration: "30 min",
      appointmentDate: "2024-01-15",
      patientPhone: "+91 9876543212",
      patientEmail: "amit.singh@email.com",
      chiefComplaint: "Follow-up for stress and anxiety management",
      medicalHistory: "Anxiety disorder",
      allergies: "Shellfish",
      currentMedications: "Ashwagandha capsules",
      vitalSigns: {
        bp: "125/75 mmHg",
        pulse: "88 bpm",
        temperature: "98.8°F", 
        weight: "72 kg"
      },
      checkedInAt: "11:00 AM",
      queuePosition: 3
    },
    {
      id: "4",
      patientName: "Sunita Devi",
      patientAge: 52,
      patientGender: "Female", 
      time: "12:00 PM",
      status: "Scheduled",
      type: "Shirodhara Session",
      duration: "90 min",
      appointmentDate: "2024-01-15",
      patientPhone: "+91 9876543213",
      patientEmail: "sunita.devi@email.com",
      chiefComplaint: "Chronic insomnia and stress",
      medicalHistory: "Menopause, Osteoporosis",
      allergies: "None known",
      currentMedications: "Calcium supplements, HRT",
      vitalSigns: null,
      checkedInAt: null,
      queuePosition: null
    }
  ];

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         appointment.status.toLowerCase().replace(" ", "_") === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Checked In': return 'bg-green-100 text-green-800'; 
      case 'Scheduled': return 'bg-gray-100 text-gray-800';
      case 'Completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const startConsultation = (appointmentId: string) => {
    // Update appointment status to "In Progress"
    // TODO: Implement consultation start logic
    console.log('Starting consultation for appointment:', appointmentId);
  };

  const completeConsultation = (appointmentId: string) => {
    // Update appointment status to "Completed"
    console.log('Completing consultation for appointment:', appointmentId); 
    // TODO: Implement consultation completion logic
  };

  const sidebarLinks = getRoutesByRole(Role.DOCTOR).map(route => ({
    ...route,
    href: route.path,
    icon: route.path.includes('dashboard') ? <Activity className="w-5 h-5" /> :
          route.path.includes('appointments') ? <Calendar className="w-5 h-5" /> :
          route.path.includes('patients') ? <Users className="w-5 h-5" /> :
          route.path.includes('profile') ? <UserCheck className="w-5 h-5" /> :
          <Stethoscope className="w-5 h-5" />
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />
  });

  return (
    <DashboardLayout title="Doctor Appointments" allowedRole={Role.DOCTOR}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{ 
          name: user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Appointments</h1>
            <div className="text-sm text-gray-600">
              Today • {new Date().toLocaleDateString()}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'Checked In').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Play className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {appointments.filter(a => a.status === 'In Progress').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {appointments.filter(a => a.status === 'Scheduled').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Today</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {appointments.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search by patient name or appointment type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="checked_in">Checked In</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-800 font-semibold text-lg">
                          {appointment.patientName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{appointment.patientName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{appointment.patientAge} years • {appointment.patientGender}</span>
                          <span>{appointment.type}</span>
                          <span>{appointment.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">{appointment.time}</span>
                          {appointment.checkedInAt && (
                            <span className="text-xs text-green-600">
                              (Checked in at {appointment.checkedInAt})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                        {appointment.queuePosition && (
                          <div className="text-xs text-gray-500 mt-1">
                            Queue Position: {appointment.queuePosition}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {appointment.status === 'Checked In' && (
                          <Button 
                            size="sm" 
                            onClick={() => startConsultation(appointment.id)}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Start
                          </Button>
                        )}
                        
                        {appointment.status === 'In Progress' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Video className="w-3 h-3" />
                              Video
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => completeConsultation(appointment.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAppointments.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No appointments found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </CardContent>
            </Card>
          )}

          {/* Patient Details Modal/Sidebar */}
          {selectedAppointment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patient Details: {selectedAppointment.patientName}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="patient-info" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="patient-info">Patient Info</TabsTrigger>
                    <TabsTrigger value="consultation">Consultation</TabsTrigger>
                    <TabsTrigger value="prescription">Prescription</TabsTrigger>
                  </TabsList>

                  <TabsContent value="patient-info">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Contact Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{selectedAppointment.patientPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span>{selectedAppointment.patientEmail}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Chief Complaint</h4>
                          <p className="text-sm text-gray-700">{selectedAppointment.chiefComplaint}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Medical History</h4>
                          <p className="text-sm text-gray-700">{selectedAppointment.medicalHistory}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedAppointment.vitalSigns && (
                          <div>
                            <h4 className="font-semibold mb-2">Vital Signs</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>BP: {selectedAppointment.vitalSigns.bp}</div>
                              <div>Pulse: {selectedAppointment.vitalSigns.pulse}</div>
                              <div>Temp: {selectedAppointment.vitalSigns.temperature}</div>
                              <div>Weight: {selectedAppointment.vitalSigns.weight}</div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2">Allergies</h4>
                          <p className="text-sm text-gray-700">{selectedAppointment.allergies}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Current Medications</h4>
                          <p className="text-sm text-gray-700">{selectedAppointment.currentMedications}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="consultation">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="diagnosis" className="block text-sm font-medium mb-2">
                          Diagnosis
                        </label>
                        <Input
                          id="diagnosis"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Enter diagnosis..."
                        />
                      </div>

                      <div>
                        <label htmlFor="consultationNotes" className="block text-sm font-medium mb-2">
                          Consultation Notes
                        </label>
                        <Textarea
                          id="consultationNotes"
                          value={consultationNotes}
                          onChange={(e) => setConsultationNotes(e.target.value)}
                          placeholder="Enter detailed consultation notes..."
                          rows={6}
                        />
                      </div>

                      <Button className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        Save Consultation Notes
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="prescription">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="prescription" className="block text-sm font-medium mb-2">
                          Prescription & Treatment Plan
                        </label>
                        <Textarea
                          id="prescription"
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="Enter medications, dosage, and treatment instructions..."
                          rows={8}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="w-full">
                          Save as Draft
                        </Button>
                        <Button className="w-full">
                          Generate Prescription
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}

