"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments, useStartAppointment, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment.types";
import { useClinicContext } from "@/hooks/query/useClinics";
// import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Activity,
  Calendar,
  Users,
  Clock,
  Stethoscope,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
} from "lucide-react";

// Interface for the transformed appointment object
interface TransformedAppointment {
  id: string;
  patientName: string;
  time: string;
  status: string;
  statusEnum: AppointmentStatus;
  type: string;
  duration: string;
  notes: string;
  isVideo: boolean;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Clinic context
  useClinicContext();

  // Fetch real data using existing hooks and server actions
  const { data: appointments } = useMyAppointments();
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();

  // Calculate real stats from fetched data
  const appointmentsArray = appointments?.appointments || [];

  // Today's appointments from real data (sorted by time)
  const todaysAppointments = useMemo(() => {
    const today = new Date().toDateString();
    return appointmentsArray
      .filter((apt: AppointmentWithRelations) => new Date(apt.date).toDateString() === today)
      .sort(
        (a: AppointmentWithRelations, b: AppointmentWithRelations) =>
          (a.time || "").localeCompare(b.time || "", undefined, { numeric: true })
      )
      .map((apt: AppointmentWithRelations): TransformedAppointment => {
        const patientName =
          `${apt.patient?.firstName || ""} ${apt.patient?.lastName || ""}`.trim() ||
          "Unknown Patient";
        const statusLabels: Partial<Record<AppointmentStatus, string>> = {
          IN_PROGRESS: "In Progress",
          CHECKED_IN: "Checked In",
          SCHEDULED: "Scheduled",
          CONFIRMED: "Scheduled",
          AWAITING_SLOT_CONFIRMATION: "Awaiting Confirmation",
          COMPLETED: "Completed",
          CANCELLED: "Cancelled",
          NO_SHOW: "No Show",
        };
        return {
          id: apt.id,
          patientName,
          time: apt.time || "",
          status: statusLabels[apt.status] || apt.status,
          statusEnum: apt.status,
          type: apt.type || "Consultation",
          duration: `${apt.duration || 30} min`,
          notes: apt.notes || "",
          isVideo: apt.type === "VIDEO_CALL",
        };
      });
  }, [appointmentsArray]);

  const activeTreatmentQueue = useMemo(
    () =>
      todaysAppointments.filter(
        (apt: TransformedAppointment) => apt.statusEnum === "CHECKED_IN" || apt.statusEnum === "IN_PROGRESS"
      ),
    [todaysAppointments]
  );

  const viewOnlyQueue = useMemo(
    () =>
      todaysAppointments.filter(
        (apt: TransformedAppointment) =>
          apt.statusEnum === "SCHEDULED" ||
          apt.statusEnum === "CONFIRMED" ||
          apt.statusEnum === "AWAITING_SLOT_CONFIRMATION"
      ),
    [todaysAppointments]
  );

  const stats = {
    todayAppointments:
      appointmentsArray.filter((apt: AppointmentWithRelations) => {
        const today = new Date().toDateString();
        return new Date(apt.date).toDateString() === today;
      }).length || 0,
    checkedInPatients:
      appointmentsArray.filter((apt: AppointmentWithRelations) => apt.status === "CHECKED_IN").length || 0,
    completedToday:
      appointmentsArray.filter((apt: AppointmentWithRelations) => {
        const today = new Date().toDateString();
        return (
          new Date(apt.date).toDateString() === today &&
          apt.status === "COMPLETED"
        );
      }).length || 0,
    totalPatients: new Set(appointmentsArray.map((apt: AppointmentWithRelations) => apt.patientId)).size,
    avgConsultationTime: 25,
    patientSatisfaction: 4.8,
    nextAppointment:
      todaysAppointments.find(
        (a: TransformedAppointment) =>
          a.statusEnum === "SCHEDULED" ||
          a.statusEnum === "CONFIRMED" ||
          a.statusEnum === "CHECKED_IN"
      )?.time || "-",
  };

  const recentActivities = [
    {
      type: "consultation",
      message: "Completed consultation with Ramesh Patel",
      time: "30 minutes ago",
    },
    {
      type: "prescription",
      message: "Updated prescription for chronic pain management",
      time: "1 hour ago",
    },
    {
      type: "notes",
      message: "Added treatment notes for Aysha Khan",
      time: "2 hours ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Checked In":
        return "bg-green-100 text-green-800";
      case "Scheduled":
        return "bg-gray-100 text-gray-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "In Progress":
        return <Play className="w-4 h-4" />;
      case "Checked In":
        return <CheckCircle className="w-4 h-4" />;
      case "Scheduled":
        return <Clock className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };


  return (
    
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, Dr. {user?.firstName || "Doctor"}
              </h1>
              <p className="text-gray-600">
                Today is{" "}
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Next Appointment</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.nextAppointment}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.todayAppointments}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.checkedInPatients} checked in
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  Consultations finished
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <p className="text-xs text-muted-foreground">Under your care</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Consultation
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgConsultationTime} min
                </div>
                <p className="text-xs text-muted-foreground">Per patient</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.patientSatisfaction}/5.0
                </div>
                <p className="text-sm text-gray-600">
                  Average rating this month
                </p>
                <div className="mt-2 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full mr-1 ${
                        i < Math.floor(stats.patientSatisfaction)
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/doctor/video")}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Start Video Consultation
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/doctor/appointments")}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Write Prescription
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push("/doctor/patients")}
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Patient History
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Treatment Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Active Treatment Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTreatmentQueue.map((appointment: TransformedAppointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">
                          {appointment.patientName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {appointment.type} - {appointment.duration}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {appointment.notes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{appointment.time}</div>
                        <Badge
                          className={`${getStatusColor(
                            appointment.status
                          )} flex items-center gap-1`}
                        >
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </Badge>
                      </div>
                      {appointment.status === "Checked In" && (
                        <Button
                          size="sm"
                          className="flex items-center gap-1"
                          disabled={startAppointmentMutation.isPending}
                          onClick={async () => {
                            await startAppointmentMutation.mutateAsync(appointment.id);
                            if (appointment.isVideo) {
                              router.push("/doctor/video");
                            }
                          }}
                        >
                          {startAppointmentMutation.isPending ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          Start
                        </Button>
                      )}
                      {appointment.status === "In Progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                          disabled={completeAppointmentMutation.isPending}
                          onClick={() =>
                            completeAppointmentMutation.mutateAsync({
                              id: appointment.id,
                              data: {},
                            })
                          }
                        >
                          {completeAppointmentMutation.isPending ? (
                            <Clock className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Queue (View Only)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {viewOnlyQueue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No scheduled patients pending check-in.
                  </p>
                ) : (
                  viewOnlyQueue.map((appointment: TransformedAppointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-muted/20"
                    >
                      <div>
                        <h4 className="font-semibold">{appointment.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          {appointment.type} - {appointment.duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{appointment.time}</div>
                        <Badge className={`${getStatusColor(appointment.status)} flex items-center gap-1`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="shrink-0">
                        {activity.type === "consultation" && (
                          <Stethoscope className="w-4 h-4 text-blue-600" />
                        )}
                        {activity.type === "prescription" && (
                          <FileText className="w-4 h-4 text-green-600" />
                        )}
                        {activity.type === "notes" && (
                          <Activity className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-600">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Treatment Specialties */}
            <Card>
              <CardHeader>
                <CardTitle>Your Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Panchakarma Therapy</span>
                    <Badge variant="outline">Primary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Nadi Pariksha</span>
                    <Badge variant="outline">Specialty</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Ayurvedic Medicine</span>
                    <Badge variant="outline">General</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Lifestyle Counseling</span>
                    <Badge variant="outline">Advisory</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Important Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Schedule Update
                    </p>
                    <p className="text-xs text-blue-700">
                      Your afternoon schedule has been updated with 2 additional
                      slots
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Patient Feedback
                    </p>
                    <p className="text-xs text-green-700">
                      You received 3 new positive reviews from recent patients
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    
  );
}
