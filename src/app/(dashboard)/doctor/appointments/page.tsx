"use client";

import React, { useState, useMemo } from "react";
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
import { getRoutesByRole } from "@/lib/config/config";
import { useAuth } from "@/hooks/useAuth";
import { useClinicContext } from "@/hooks/useClinic";
import { useAppointments, useStartAppointment, useCompleteAppointment } from "@/hooks/useAppointments";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import { toast } from "sonner";
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
  Eye,
  Loader2
} from "lucide-react";

export default function DoctorAppointments() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("checked_in");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [consultationNotes, setConsultationNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  // Fetch real appointment data
  const appointmentsQuery = useAppointments({
    clinicId: clinicId || undefined,
    doctorId: user?.id || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 100,
  });

  const appointmentsData = appointmentsQuery.data;
  const isLoadingAppointments = appointmentsQuery.isPending;

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync(["appointments", clinicId, user?.id]);

  // Transform appointments data
  const appointments = useMemo(() => {
    if (!appointmentsData) return [];
    const apps = Array.isArray(appointmentsData) ? appointmentsData : appointmentsData.appointments || [];
    
    return apps.map((app: any) => ({
      id: app.id,
      patientName: app.patient?.name || `${app.patient?.firstName || ""} ${app.patient?.lastName || ""}`.trim() || "Unknown Patient",
      patientAge: app.patient?.age || app.patient?.dateOfBirth ? Math.floor((new Date().getTime() - new Date(app.patient.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null,
      patientGender: app.patient?.gender || "Unknown",
      time: app.startTime ? new Date(app.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "TBD",
      status: app.status || "Scheduled",
      type: app.type || app.appointmentType || "Consultation",
      duration: app.duration || "30 min",
      appointmentDate: app.startTime ? new Date(app.startTime).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      patientPhone: app.patient?.phone || "",
      patientEmail: app.patient?.email || "",
      chiefComplaint: app.chiefComplaint || app.reason || "Not specified",
      medicalHistory: app.patient?.medicalHistory || [],
      allergies: app.patient?.allergies || [],
      currentMedications: app.patient?.currentMedications || [],
      vitalSigns: app.vitalSigns || null,
      checkedInAt: app.checkedInAt ? new Date(app.checkedInAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
      queuePosition: app.queuePosition || null,
    }));
  }, [appointmentsData]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app: any) => {
      const matchesSearch =
        !searchTerm ||
        app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusKey = app.status?.toLowerCase().replace(" ", "_") || "";
      const matchesStatus = statusFilter === "all" || statusKey === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

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

  if (isLoadingAppointments) {
    return (
      <DashboardLayout title="Doctor Appointments" allowedRole={Role.DOCTOR}>
        <GlobalSidebar
          links={sidebarLinks}
          user={{ 
            name: user?.name || `${user?.firstName} ${user?.lastName}` || "Doctor",
            avatarUrl: (user as any)?.profilePicture || "/avatar.png" 
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </GlobalSidebar>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'checked in': return 'bg-green-100 text-green-800'; 
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mutations for appointment actions
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();

  const startConsultation = async (appointmentId: string) => {
    try {
      await startAppointmentMutation.mutateAsync(appointmentId);
      toast.success("Consultation started successfully");
      // Refetch appointments to update UI
      appointmentsQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to start consultation");
    }
  };

  const completeConsultation = async (appointmentId: string, data?: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  }) => {
    try {
      await completeAppointmentMutation.mutateAsync({
        id: appointmentId,
        data: data || {},
      });
      toast.success("Consultation completed successfully");
      // Clear form fields
      setDiagnosis("");
      setPrescription("");
      setConsultationNotes("");
      setSelectedAppointment(null);
      // Refetch appointments to update UI
      appointmentsQuery.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to complete consultation");
    }
  };

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
            <WebSocketStatusIndicator />
          </div>
          <div className="text-sm text-gray-600">
            Today • {new Date().toLocaleDateString()}
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
                            disabled={startAppointmentMutation.isPending}
                            className="flex items-center gap-1"
                          >
                            {startAppointmentMutation.isPending ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Start
                              </>
                            )}
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
                              onClick={() => completeConsultation(appointment.id, {
                              diagnosis: diagnosis,
                              prescription: prescription,
                              notes: consultationNotes,
                            })}
                              disabled={completeAppointmentMutation.isPending}
                              className="flex items-center gap-1"
                            >
                              {completeAppointmentMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Completing...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Complete
                                </>
                              )}
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

                      <Button 
                        className="w-full"
                        onClick={() => {
                          if (selectedAppointment) {
                            completeConsultation(selectedAppointment.id, {
                              diagnosis: diagnosis,
                              prescription: prescription,
                              notes: consultationNotes,
                            });
                          }
                        }}
                        disabled={completeAppointmentMutation.isPending}
                      >
                        {completeAppointmentMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Save Consultation Notes
                          </>
                        )}
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
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // Save prescription as draft (could be a separate mutation)
                            toast.info("Prescription saved as draft");
                          }}
                        >
                          Save as Draft
                        </Button>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            if (selectedAppointment) {
                              completeConsultation(selectedAppointment.id, {
                                diagnosis: diagnosis,
                                prescription: prescription,
                                notes: consultationNotes,
                              });
                            }
                          }}
                          disabled={completeAppointmentMutation.isPending}
                        >
                          {completeAppointmentMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Generate Prescription
                            </>
                          )}
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

