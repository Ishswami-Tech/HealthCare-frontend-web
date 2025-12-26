"use client";

import React, { useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";
import { useClinicContext } from "@/hooks/useClinic";
import {
  usePatientMedicalRecords,
  usePatientVitalSigns,
} from "@/hooks/usePatients";
import {
  usePatientPrescriptions,
  useComprehensiveHealthRecord,
} from "@/hooks/useMedicalRecords";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";

import { useTranslations } from "next-intl";
import { translateSidebarLinks } from "@/utils/sidebarTranslations";
import { theme } from "@/lib/theme-utils";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  User,
  LogOut,
  Clock,
  CheckCircle,
  Plus,
  Video,
  MapPin,
  Heart,
  Leaf,
  Sun,
  Moon,
  Waves,
  Stethoscope,
} from "lucide-react";

export default function PatientDashboard() {
  const { session } = useAuth();
  const user = session?.user;
  const t = useTranslations();

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  const { clinicId } = useClinicContext();
  const patientId = user?.id || "";

  // Fetch real data using hooks
  const { data: appointmentsData } = useMyAppointments();
  const { data: medicalRecordsData } = usePatientMedicalRecords(
    clinicId || "",
    patientId
  );
  const { data: vitalSignsData } = usePatientVitalSigns(patientId);
  const { data: prescriptionsData } = usePatientPrescriptions(
    patientId,
    "active"
  );
  const { data: comprehensiveData } = useComprehensiveHealthRecord(patientId);

  // Transform real data
  const patientData = useMemo(() => {
    const appointments = appointmentsData?.appointments || [];
    const upcomingAppointments = appointments
      .filter((apt: any) => new Date(apt.startTime || apt.date) >= new Date())
      .slice(0, 5)
      .map((apt: any) => ({
        id: apt.id,
        doctor:
          apt.doctor?.name ||
          `${apt.doctor?.firstName || ""} ${
            apt.doctor?.lastName || ""
          }`.trim() ||
          "Unknown Doctor",
        type: apt.type || apt.appointmentType || "Consultation",
        date: apt.startTime
          ? new Date(apt.startTime).toISOString().split("T")[0]
          : "",
        time: apt.startTime
          ? new Date(apt.startTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        location: apt.location || apt.clinic?.name || "Clinic",
        status: apt.status || "Scheduled",
        isOnline: apt.isOnline || false,
      }));

    const latestVitals = vitalSignsData?.[0] || {};
    const latestPrescriptions = prescriptionsData || [];

    return {
      personalInfo: {
        name:
          user?.name ||
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
          "Patient",
        age: user?.dateOfBirth
          ? Math.floor(
              (new Date().getTime() - new Date(user.dateOfBirth).getTime()) /
                (1000 * 60 * 60 * 24 * 365)
            )
          : null,
        gender: user?.gender || "Unknown",
        phone: user?.phone || "",
        email: user?.email || "",
      },
      healthOverview: {
        primaryDosha: comprehensiveData?.doshaBalance?.dominant || "Unknown",
        currentTreatment: medicalRecordsData?.[0]?.treatment || "None",
        treatmentProgress: 0, // TODO: Calculate from treatment history
        nextAppointment: upcomingAppointments[0]?.date || null,
        lastVisit:
          appointments
            .filter(
              (apt: any) =>
                apt.status === "COMPLETED" || apt.status === "completed"
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.startTime || b.date).getTime() -
                new Date(a.startTime || a.date).getTime()
            )[0]?.startTime || null,
      },
      upcomingAppointments,
      recentActivity: [], // TODO: Implement activity feed from medical records
      currentTreatments: [], // TODO: Extract from medical records
      medications: latestPrescriptions.slice(0, 5).map((presc: any) => ({
        name: presc.medicineName || presc.name || "Unknown",
        dosage: presc.dosage || "As prescribed",
        nextRefill: presc.nextRefillDate || null,
      })),
      vitalStats: {
        bloodPressure: latestVitals.bloodPressure || "N/A",
        heartRate: latestVitals.heartRate || "N/A",
        weight: latestVitals.weight || "N/A",
        lastUpdated: latestVitals.recordedAt
          ? new Date(latestVitals.recordedAt).toLocaleDateString()
          : "N/A",
      },
      doshaBalance: comprehensiveData?.doshaBalance || {
        vata: 0,
        pitta: 0,
        kapha: 0,
        dominant: "Unknown",
      },
    };
  }, [
    appointmentsData,
    medicalRecordsData,
    vitalSignsData,
    prescriptionsData,
    comprehensiveData,
    user,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return theme.badges.green;
      case "Pending":
        return theme.badges.yellow;
      case "Cancelled":
        return theme.badges.red;
      default:
        return theme.badges.gray;
    }
  };

  const getDoshaIcon = (dosha: string) => {
    switch (dosha.toLowerCase()) {
      case "vata":
        return <Waves className="w-4 h-4" />;
      case "pitta":
        return <Sun className="w-4 h-4" />;
      case "kapha":
        return <Moon className="w-4 h-4" />;
      default:
        return <Leaf className="w-4 h-4" />;
    }
  };

  const sidebarLinks = getRoutesByRole(Role.PATIENT).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="size-6" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="size-6" />
    ) : route.path.includes("medical-records") ? (
      <FileText className="size-6" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="size-6" />
    ) : route.path.includes("profile") ? (
      <User className="size-6" />
    ) : (
      <Activity className="size-6" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="size-6" />,
  });

  // Translate sidebar links
  const translatedSidebarLinks = translateSidebarLinks(sidebarLinks, t);

  return (
    <DashboardLayout title={t("sidebar.dashboard")} allowedRole={Role.PATIENT}>
      <GlobalSidebar
        links={translatedSidebarLinks}
        user={{
          name: patientData.personalInfo.name,
          avatarUrl: user?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent`}
              >
                {t("dashboard.welcomeBack")},{" "}
                {patientData.personalInfo.name.split(" ")[0]}
              </h1>
              <p className={theme.textColors.muted}>
                {t("dashboard.overview")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Video className="w-4 h-4" />
                {t("appointments.bookNew")}
              </Button>
              <Button className="flex items-center gap-2 hover:scale-105 transition-transform bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500">
                <Plus className="w-4 h-4" />
                {t("dashboard.bookAppointment")}
              </Button>
            </div>
          </div>

          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              className={`hover:shadow-lg transition-shadow duration-300 border-l-4 ${theme.borders.green}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${theme.textColors.heading}`}
                >
                  {t("healthcare.diagnosis")}
                </CardTitle>
                <Leaf className={`h-4 w-4 ${theme.iconColors.green}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${theme.iconColors.green}`}>
                  {patientData.doshaBalance.dominant}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {t("patients.personalInfo")}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`hover:shadow-lg transition-shadow duration-300 border-l-4 ${theme.borders.blue}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${theme.textColors.heading}`}
                >
                  {t("healthcare.treatment")}
                </CardTitle>
                <Activity className={`h-4 w-4 ${theme.iconColors.blue}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${theme.iconColors.blue}`}>
                  {patientData.healthOverview.treatmentProgress}%
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {patientData.healthOverview.currentTreatment}
                </p>
              </CardContent>
            </Card>

            <Card
              className={`hover:shadow-lg transition-shadow duration-300 border-l-4 ${theme.borders.purple}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${theme.textColors.heading}`}
                >
                  {t("appointments.upcoming")}
                </CardTitle>
                <Calendar className={`h-4 w-4 ${theme.iconColors.purple}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${theme.iconColors.purple}`}>
                  {new Date(
                    patientData.healthOverview.nextAppointment
                  ).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {new Date(
                    patientData.healthOverview.nextAppointment
                  ).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${theme.textColors.heading}`}
                >
                  Vital Stats
                </CardTitle>
                <Heart className={`h-4 w-4 ${theme.iconColors.red}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${theme.iconColors.red}`}>
                  {patientData.vitalStats.bloodPressure}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  HR: {patientData.vitalStats.heartRate}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dosha Balance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Dosha Balance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDoshaIcon("vata")}
                        <span className="font-medium">Vata (Air & Space)</span>
                      </div>
                      <span className="text-sm font-medium">
                        {patientData.doshaBalance.vata}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${theme.backgrounds.tertiary} rounded-full h-2`}
                    >
                      <div
                        className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${patientData.doshaBalance.vata}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDoshaIcon("pitta")}
                        <span className="font-medium">
                          Pitta (Fire & Water)
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {patientData.doshaBalance.pitta}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${theme.backgrounds.tertiary} rounded-full h-2`}
                    >
                      <div
                        className="bg-orange-500 dark:bg-orange-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${patientData.doshaBalance.pitta}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getDoshaIcon("kapha")}
                        <span className="font-medium">
                          Kapha (Earth & Water)
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {patientData.doshaBalance.kapha}%
                      </span>
                    </div>
                    <div
                      className={`w-full ${theme.backgrounds.tertiary} rounded-full h-2`}
                    >
                      <div
                        className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${patientData.doshaBalance.kapha}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`mt-4 p-3 ${theme.containers.featureGreen} rounded-lg`}
                  >
                    <p className={`text-sm ${theme.textColors.success}`}>
                      <strong>Dominant Type:</strong>{" "}
                      {patientData.doshaBalance.dominant} constitution indicates
                      a balanced combination of air/space and fire/water
                      elements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientData.upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${theme.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${theme.containers.featureBlue} rounded-full flex items-center justify-center`}
                        >
                          {appointment.isOnline ? (
                            <Video
                              className={`w-5 h-5 ${theme.iconColors.blue}`}
                            />
                          ) : (
                            <Stethoscope
                              className={`w-5 h-5 ${theme.iconColors.blue}`}
                            />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`font-semibold ${theme.textColors.heading}`}
                          >
                            {appointment.type}
                          </h4>
                          <p
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            {appointment.doctor}
                          </p>
                          <div
                            className={`flex items-center gap-2 text-xs ${theme.textColors.tertiary}`}
                          >
                            {appointment.isOnline ? (
                              <div className="flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                <span>Online Consultation</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{appointment.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {new Date(appointment.date).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div
                          className={`text-sm ${theme.textColors.secondary}`}
                        >
                          {appointment.time}
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule New Appointment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Treatments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current Treatment Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patientData.currentTreatments.map((treatment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{treatment.name}</h4>
                      <Badge variant="outline">{treatment.type}</Badge>
                    </div>

                    <p className={`text-sm ${theme.textColors.secondary} mb-3`}>
                      with {treatment.doctor}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{treatment.progress}%</span>
                      </div>
                      <div
                        className={`w-full ${theme.backgrounds.tertiary} rounded-full h-2`}
                      >
                        <div
                          className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${treatment.progress}%` }}
                        />
                      </div>
                      <p className={`text-xs ${theme.textColors.tertiary}`}>
                        Next session:{" "}
                        {new Date(treatment.nextSession).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Current Ayurvedic Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientData.medications.map((medication, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 ${theme.containers.featureGreen} rounded-full flex items-center justify-center`}
                        >
                          <Pill
                            className={`w-4 h-4 ${theme.iconColors.green}`}
                          />
                        </div>
                        <div>
                          <h4
                            className={`font-medium ${theme.textColors.heading}`}
                          >
                            {medication.name}
                          </h4>
                          <p
                            className={`text-sm ${theme.textColors.secondary}`}
                          >
                            {medication.dosage}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${theme.textColors.tertiary}`}>
                          Refill due:
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(medication.nextRefill).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Prescription Refill
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {activity.type === "appointment" && (
                          <Calendar
                            className={`w-4 h-4 ${theme.iconColors.blue}`}
                          />
                        )}
                        {activity.type === "prescription" && (
                          <Pill
                            className={`w-4 h-4 ${theme.iconColors.green}`}
                          />
                        )}
                        {activity.type === "report" && (
                          <FileText
                            className={`w-4 h-4 ${theme.iconColors.purple}`}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${theme.textColors.heading}`}
                        >
                          {activity.message}
                        </p>
                        <p className={`text-xs ${theme.textColors.secondary}`}>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Health Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Health Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 ${theme.containers.featureBlue} rounded-lg`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className={`w-5 h-5 ${theme.iconColors.blue}`} />
                    <h4 className={`font-semibold ${theme.textColors.info}`}>
                      Vata Balance
                    </h4>
                  </div>
                  <p className={`text-sm ${theme.textColors.info}`}>
                    Your elevated Vata suggests focusing on grounding
                    activities. Continue with oil massages and warm foods.
                  </p>
                </div>

                <div
                  className={`p-4 ${theme.containers.featureOrange} rounded-lg`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className={`w-5 h-5 ${theme.iconColors.orange}`} />
                    <h4 className={`font-semibold ${theme.textColors.warning}`}>
                      Pitta Management
                    </h4>
                  </div>
                  <p className={`text-sm ${theme.textColors.warning}`}>
                    Moderate Pitta levels are good. Avoid excessive heat and
                    spicy foods. Include cooling herbs in your routine.
                  </p>
                </div>

                <div
                  className={`p-4 ${theme.containers.featureGreen} rounded-lg`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle
                      className={`w-5 h-5 ${theme.iconColors.green}`}
                    />
                    <h4 className={`font-semibold ${theme.textColors.success}`}>
                      Treatment Progress
                    </h4>
                  </div>
                  <p className={`text-sm ${theme.textColors.success}`}>
                    Excellent progress in your Panchakarma program. Continue
                    following your doctor&apos;s recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Book Appointment</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  <span className="text-sm">Video Consult</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">View Reports</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                >
                  <Pill className="w-5 h-5" />
                  <span className="text-sm">Refill Prescription</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
