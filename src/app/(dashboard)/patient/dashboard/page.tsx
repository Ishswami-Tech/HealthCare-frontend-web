"use client";

import React from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { useMyAppointments } from "@/hooks/useAppointments";


import { useTranslations } from "next-intl";
import { translateSidebarLinks } from "@/utils/sidebarTranslations";
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

  // Fetch real data using your existing hooks
  useMyAppointments();

  // Mock patient data (replace with real data from your backend)
  const patientData = {
    personalInfo: {
      name:
        user?.name || `${user?.firstName} ${user?.lastName}` || "Rajesh Kumar",
      age: 45,
      gender: "Male",
      phone: "+91 9876543210",
      email: user?.email || "rajesh.kumar@email.com",
    },
    healthOverview: {
      primaryDosha: "Vata-Pitta",
      currentTreatment: "Panchakarma Therapy",
      treatmentProgress: 75,
      nextAppointment: "2024-01-22T10:00:00Z",
      lastVisit: "2024-01-15T14:30:00Z",
    },
    upcomingAppointments: [
      {
        id: "1",
        doctor: "Dr. Priya Sharma",
        type: "Panchakarma Session",
        date: "2024-01-22",
        time: "10:00 AM",
        location: "Ayurveda Center Mumbai",
        status: "Confirmed",
        isOnline: false,
      },
      {
        id: "2",
        doctor: "Dr. Amit Singh",
        type: "Follow-up Consultation",
        date: "2024-01-25",
        time: "3:00 PM",
        location: "Online",
        status: "Confirmed",
        isOnline: true,
      },
    ],
    recentActivity: [
      {
        type: "appointment",
        message: "Completed Shirodhara session with Dr. Priya",
        time: "2 days ago",
      },
      {
        type: "prescription",
        message: "New Ayurvedic prescription added",
        time: "3 days ago",
      },
      {
        type: "report",
        message: "Blood test results uploaded",
        time: "1 week ago",
      },
    ],
    currentTreatments: [
      {
        name: "Panchakarma Detox Program",
        doctor: "Dr. Priya Sharma",
        progress: 75,
        nextSession: "2024-01-22",
        type: "Therapy",
      },
      {
        name: "Stress Management Program",
        doctor: "Dr. Amit Singh",
        progress: 60,
        nextSession: "2024-01-25",
        type: "Consultation",
      },
    ],
    medications: [
      {
        name: "Triphala Churna",
        dosage: "1 tsp twice daily",
        nextRefill: "2024-02-01",
      },
      {
        name: "Ashwagandha Capsules",
        dosage: "2 capsules at bedtime",
        nextRefill: "2024-01-28",
      },
      {
        name: "Brahmi Ghrita",
        dosage: "5 drops morning",
        nextRefill: "2024-02-05",
      },
    ],
    vitalStats: {
      bloodPressure: "128/82 mmHg",
      heartRate: "72 bpm",
      weight: "70 kg",
      lastUpdated: "2024-01-15",
    },
    doshaBalance: {
      vata: 45,
      pitta: 35,
      kapha: 20,
      dominant: "Vata-Pitta",
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    icon: route.path.includes("dashboard") ? <Activity className="size-6" />
    : route.path.includes("appointments") ? <Calendar className="size-6" />
    : route.path.includes("medical-records") ? <FileText className="size-6" />
    : route.path.includes("prescriptions") ? <Pill className="size-6" />
    : route.path.includes("profile") ? <User className="size-6" />
    : <Activity className="size-6" />,
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t("dashboard.welcomeBack")},{" "}
                {patientData.personalInfo.name.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground">{t("dashboard.overview")}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Video className="w-4 h-4" />
                {t("appointments.bookNew")}
              </Button>
              <Button className="flex items-center gap-2 hover:scale-105 transition-transform bg-gradient-to-r from-blue-600 to-purple-600">
                <Plus className="w-4 h-4" />
                {t("dashboard.bookAppointment")}
              </Button>
            </div>
          </div>

          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("healthcare.diagnosis")}
                </CardTitle>
                <Leaf className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {patientData.doshaBalance.dominant}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("patients.personalInfo")}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("healthcare.treatment")}
                </CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {patientData.healthOverview.treatmentProgress}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {patientData.healthOverview.currentTreatment}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("appointments.upcoming")}
                </CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-purple-600">
                  {new Date(
                    patientData.healthOverview.nextAppointment
                  ).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
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
                <CardTitle className="text-sm font-medium">
                  Vital Stats
                </CardTitle>
                <Heart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600">
                  {patientData.vitalStats.bloodPressure}
                </div>
                <p className="text-xs text-muted-foreground">
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
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
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${patientData.doshaBalance.kapha}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {appointment.isOnline ? (
                            <Video className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold">{appointment.type}</h4>
                          <p className="text-sm text-gray-600">
                            {appointment.doctor}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
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
                        <div className="text-sm text-gray-600">
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

                    <p className="text-sm text-gray-600 mb-3">
                      with {treatment.doctor}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{treatment.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${treatment.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
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
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Pill className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{medication.name}</h4>
                          <p className="text-sm text-gray-600">
                            {medication.dosage}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Refill due:</p>
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
                          <Calendar className="w-4 h-4 text-blue-600" />
                        )}
                        {activity.type === "prescription" && (
                          <Pill className="w-4 h-4 text-green-600" />
                        )}
                        {activity.type === "report" && (
                          <FileText className="w-4 h-4 text-purple-600" />
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
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">
                      Vata Balance
                    </h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    Your elevated Vata suggests focusing on grounding
                    activities. Continue with oil massages and warm foods.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-800">
                      Pitta Management
                    </h4>
                  </div>
                  <p className="text-sm text-orange-700">
                    Moderate Pitta levels are good. Avoid excessive heat and
                    spicy foods. Include cooling herbs in your routine.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-800">
                      Treatment Progress
                    </h4>
                  </div>
                  <p className="text-sm text-green-700">
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
