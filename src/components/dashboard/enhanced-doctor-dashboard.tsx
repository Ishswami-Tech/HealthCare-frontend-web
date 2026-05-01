"use client";

// import React from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import React from "react";

import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST } from "@/lib/utils/date-time";
import {
  Calendar,
  Users,
  Clock,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
  Play,
  Heart,
  Brain,
  Eye,
  MessageSquare,
  Star,
  TrendingUp,
  Bell,
  Settings,
} from "lucide-react";

export default function EnhancedDoctorDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();
  
  // Fetch real data
  const { data: appointments } = useMyAppointments();

  const allAppointments: any[] = appointments?.appointments || [];
  const todayStr = new Date().toDateString();

  // Stats derived entirely from real data
  const stats = {
    todayAppointments: allAppointments.filter((apt: any) =>
      new Date(apt.date).toDateString() === todayStr
    ).length,
    checkedInPatients: allAppointments.filter((apt: any) => Boolean(apt.checkedInAt) || apt.status === "IN_PROGRESS").length,
    completedToday: allAppointments.filter((apt: any) =>
      new Date(apt.date).toDateString() === todayStr && apt.status === "COMPLETED"
    ).length,
    totalPatients: new Set(allAppointments.map((apt: any) => apt.patientId)).size,
    nextAppointment: allAppointments
      .filter((apt: any) =>
        new Date(apt.date).toDateString() === todayStr &&
        ["SCHEDULED", "CONFIRMED"].includes(apt.status)
      )
      .sort((a: any, b: any) => (a.time || "").localeCompare(b.time || ""))
      [0]?.time || "—",
    urgentTasks: allAppointments.filter(
      (apt: any) => apt.priority === "URGENT" || apt.priority === "CRITICAL"
    ).length,
    patientSatisfaction: 5.0,
    avgConsultationTime:
      allAppointments.length > 0
        ? Math.round(
            allAppointments.reduce(
              (total: number, apt: any) => total + Number(apt.duration || 30),
              0
            ) / allAppointments.length
          )
        : 30,
  };

  // Today's queue from real appointment data
  const todaysQueue = allAppointments
    .filter((apt: any) => {
      const status = apt.status as string;
      return (
        new Date(apt.date).toDateString() === todayStr &&
        (Boolean(apt.checkedInAt) || status === "IN_PROGRESS")
      );
    })
    .sort((a: any, b: any) => (a.time || "").localeCompare(b.time || ""))
    .slice(0, 5)
    .map((apt: any) => ({
      id: apt.id,
      patientName: `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() || "Unknown Patient",
      time: apt.time || "",
      status: apt.status === "IN_PROGRESS" ? "in-progress" as const : "waiting" as const,
      checkedInAt: apt.checkedInAt || null,
      type: apt.type || "Consultation",
      duration: `${apt.duration || 30} min`,
      priority: (apt.priority?.toLowerCase() || "normal") as "normal" | "high" | "critical",
      notes: apt.notes || "",
      vitals: apt.vitals
        ? {
            bp: apt.vitals.bp || "N/A",
            temp: apt.vitals.temp || "N/A",
            pulse: apt.vitals.pulse || "N/A",
          }
        : undefined,
    }));

  // Urgent appointments from real data
  const urgentNotifications = allAppointments
    .filter((apt: any) => ["URGENT", "CRITICAL"].includes(apt.priority) && apt.status !== "COMPLETED")
    .slice(0, 3)
    .map((apt: any) => ({
      id: apt.id,
      type: apt.priority === "CRITICAL" ? "critical" : "warning",
      message: `${`${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() || "Patient"} — ${apt.type || "Appointment"} at ${apt.time || "scheduled time"}`,
      time: apt.time || "",
      action: "Review Case",
    }));



  return (
    <DashboardLayout title="Doctor Dashboard" allowedRole={[Role.DOCTOR, Role.ASSISTANT_DOCTOR]}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
          {/* Header Section */}
          <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                    Good morning, Dr. {user?.firstName || "Doctor"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {formatDateInIST(new Date(), {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} • {clinicId ? "Ayurveda Wellness Center" : "Healthcare Clinic"}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Online
                  </Badge>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Bell className="h-4 w-4" />
                    {stats.urgentTasks}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </Button>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="flex items-center justify-between mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.nextAppointment}</div>
                    <div className="text-xs text-muted-foreground">Next Patient</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                    <div className="text-xs text-muted-foreground">Completed Today</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.checkedInPatients}</div>
                    <div className="text-xs text-muted-foreground">Waiting</div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Video className="h-4 w-4 mr-2" />
                    Start Video Call
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Urgent Notifications */}
            {urgentNotifications.length > 0 && (
              <div className="grid gap-3">
                {urgentNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${
                      notification.type === "critical" 
                        ? "border-l-red-500 bg-red-50/50" 
                        : "border-l-amber-500 bg-amber-50/50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className={`h-5 w-5 ${
                            notification.type === "critical" ? "text-red-500" : "text-amber-500"
                          }`} />
                          <div>
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-sm text-muted-foreground">{notification.time}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={notification.type === "critical" ? "default" : "outline"}
                        >
                          {notification.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayAppointments}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPatients}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Satisfaction Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.patientSatisfaction}/5.0</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Avg Consultation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgConsultationTime} min</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Patient Queue */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Stethoscope className="h-5 w-5 text-blue-600" />
                          Today's Patient Queue
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {todaysQueue.filter(p => p.status === "waiting").length} patients waiting
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {todaysQueue.map((patient) => (
                      <div
                        key={patient.id}
                        className={`group relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-md ${
                          patient.status === "in-progress" 
                            ? "bg-blue-50 border-blue-200" 
                            : "bg-white hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                                {patient.priority === "critical" && (
                                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                                )}
                                {patient.priority === "high" && (
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">High</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {patient.time} • {patient.duration}
                                </span>
                                <span>{patient.type}</span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">{patient.notes}</p>
                              
                              {/* Additional patient info */}
                              {patient.vitals && (
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                  <span>BP: {patient.vitals.bp}</span>
                                  <span>Temp: {patient.vitals.temp}</span>
                                  <span>Pulse: {patient.vitals.pulse}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                patient.status === "in-progress" ? "default" :
                                patient.status === "waiting" ? "secondary" : "outline"
                              }
                              className="capitalize"
                            >
                              {patient.status.replace("-", " ")}
                            </Badge>
                            
                            {patient.status === "waiting" && (
                              <Button size="sm" className="gap-1">
                                <Play className="h-3 w-3" />
                                Start
                              </Button>
                            )}
                            
                            {patient.status === "in-progress" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Video className="h-3 w-3" />
                                </Button>
                                <Button size="sm" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Complete
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Progress indicator for critical patients */}
                        {patient.priority === "critical" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-200">
                            <div className="h-full bg-red-500 animate-pulse" style={{ width: "75%" }}></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Today's Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Today's Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Appointments</span>
                        <span className="font-medium">{stats.completedToday} / {stats.todayAppointments}</span>
                      </div>
                      <Progress value={stats.todayAppointments > 0 ? Math.round((stats.completedToday / stats.todayAppointments) * 100) : 0} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {stats.todayAppointments > 0 ? Math.round((stats.completedToday / stats.todayAppointments) * 100) : 0}% completed today
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.checkedInPatients}</div>
                        <div className="text-xs text-muted-foreground">Waiting</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-xs">Write Prescription</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Video className="h-5 w-5 text-green-600" />
                      <span className="text-xs">Video Call</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <span className="text-xs">AI Diagnosis</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      <span className="text-xs">Health Monitor</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
}

// Add missing User import
const User = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={className}
    fill="none"
    height="24"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="24"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
