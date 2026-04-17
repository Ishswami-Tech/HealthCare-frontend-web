"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  usePatientMedicalRecords,
  usePatientVitalSigns,
} from "@/hooks/query/usePatients";
import {
  usePatientPrescriptions,
  useComprehensiveHealthRecord,
} from "@/hooks/query/useMedicalRecords";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useTranslation } from "@/lib/i18n/context";
import { theme } from "@/lib/utils/theme-utils";
import {
  normalizeAppointmentStatus,
  normalizePatientAppointment,
} from "@/lib/utils/appointmentUtils";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
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
import { Skeleton } from "@/components/ui/skeleton";

import { PatientQueueCard } from "@/components/dashboard/PatientQueueCard";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";

export default function PatientDashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;
  const { t } = useTranslation();

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  const { clinicId } = useClinicContext();
  const patientId = user?.id || "";

  // Fetch real data using hooks with loading and error states
  const { data: appointmentsData, isPending: isPendingAppointments } = useMyAppointments();
  const { data: medicalRecordsData } = usePatientMedicalRecords(
    clinicId || "",
    patientId
  );
  const { data: vitalSignsData, isPending: isPendingVitals } = usePatientVitalSigns(patientId);
  const { data: prescriptionsData, isPending: isPendingPrescriptions } = usePatientPrescriptions(
    patientId,
    "active"
  );
  const { data: comprehensiveData, isPending: isPendingComprehensive } = useComprehensiveHealthRecord(patientId);

  // Transform real data
  const patientData = useMemo(() => {
    // Helper for safe date formatting
    const safeFormatDate = (dateString: any, options?: Intl.DateTimeFormatOptions) => {
      try {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", ...options });
      } catch (e) {
        return "";
      }
    };

    const safeFormatTime = (dateString: any, options?: Intl.DateTimeFormatOptions) => {
      try {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", ...options });
      } catch (e) {
        return "";
      }
    };

    const rawAppointments = Array.isArray(appointmentsData?.appointments)
      ? appointmentsData.appointments
      : [];
    const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
    const activeUpcomingStatuses = new Set([
      "SCHEDULED",
      "CONFIRMED",
      "IN_PROGRESS",
    ]);
    
    // Safety check for appointments array
    const upcomingAppointments = Array.isArray(appointments) 
      ? appointments
          .filter((apt: any) => {
            const normalized = normalizePatientAppointment(apt);
            const appointmentStart = normalized.dateTime;
            const status = normalized.status;
            // Show today + future appointments that are active (not just strictly future time)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return (
              appointmentStart !== null &&
              appointmentStart >= today &&
              activeUpcomingStatuses.has(status)
            );
          })
          .sort((a: any, b: any) => {
            const first = normalizePatientAppointment(a).dateTime;
            const second = normalizePatientAppointment(b).dateTime;
            if (!first && !second) return 0;
            if (!first) return 1;
            if (!second) return -1;
            return first.getTime() - second.getTime();
          })
          .slice(0, 5)
          .map((apt: any) => {
            const normalized = normalizePatientAppointment(apt);
            const appointmentStart = normalized.dateTime;
            return {
              id: apt.id,
              doctor: normalized.doctorName,
              type: normalized.type,
              date: normalized.normalizedDate,
              time: appointmentStart
                ? safeFormatTime(appointmentStart.toISOString(), {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              location: normalized.locationName,
              status: normalized.status || "SCHEDULED",
              isOnline: normalized.isOnline,
            };
          })
      : [];

    const latestVitals = (vitalSignsData as any)?.[0] || {};
    const latestPrescriptions = Array.isArray(prescriptionsData) ? prescriptionsData : [];

    const calculateAge = (dob: any) => {
      if (!dob) return null;
      try {
        const date = new Date(dob);
        if (isNaN(date.getTime())) return null;
        return Math.floor(
          (new Date().getTime() - date.getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        );
      } catch { return null; }
    };

    return {
      personalInfo: {
        name:
          user?.name ||
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
          "Patient",
        age: calculateAge((user as any)?.dateOfBirth),
        gender: (user as any)?.gender || "Unknown",
        phone: (user as any)?.phone || (user as any)?.phoneNumber || "",
        email: user?.email || "",
      },
      healthOverview: {
        primaryDosha: (comprehensiveData as any)?.doshaBalance?.dominant || "Unknown",
        currentTreatment: (medicalRecordsData as any)?.[0]?.treatment || "None",
        treatmentProgress: 0, 
        nextAppointment: upcomingAppointments[0]?.date || null,
        lastVisit:
          appointments
            .filter((apt: any) => normalizePatientAppointment(apt).status === "COMPLETED")
            .sort(
              (a: any, b: any) =>
                (normalizePatientAppointment(b).dateTime?.getTime() || 0) -
                (normalizePatientAppointment(a).dateTime?.getTime() || 0)
            )[0]?.time || null,
      },
      upcomingAppointments,
      recentActivity: [] as Array<{ type: string; message: string; time: string }>,
      currentTreatments: [] as Array<{ name: string; type: string; doctor: string; progress: number; nextSession: string }>,
      medications: latestPrescriptions.slice(0, 5).map((presc: any) => ({
        name: presc.medicineName || presc.name || "Unknown",
        dosage: presc.dosage || "As prescribed",
        nextRefill: presc.nextRefillDate ? safeFormatDate(presc.nextRefillDate) : null,
      })),
      vitalStats: {
        bloodPressure: latestVitals.bloodPressure || "N/A",
        heartRate: latestVitals.heartRate || "N/A",
        weight: latestVitals.weight || "N/A",
        lastUpdated: latestVitals.recordedAt
          ? safeFormatDate(latestVitals.recordedAt)
          : "N/A",
      },
      doshaBalance: (comprehensiveData as any)?.doshaBalance || {
        vata: 0,
        pitta: 0,
        kapha: 0,
        dominant: "Unknown",
      },
      hasDoshaData: Boolean(
        (comprehensiveData as any)?.doshaBalance &&
          (((comprehensiveData as any)?.doshaBalance?.vata || 0) > 0 ||
            ((comprehensiveData as any)?.doshaBalance?.pitta || 0) > 0 ||
            ((comprehensiveData as any)?.doshaBalance?.kapha || 0) > 0)
      ),
      hasMedications: latestPrescriptions.length > 0,
      hasTreatmentData: Boolean((medicalRecordsData as any)?.[0]?.treatment),
      hasVitalData: Boolean((vitalSignsData as any)?.[0]),
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
    switch (normalizeAppointmentStatus(status)) {
      case "CONFIRMED":
        return theme.badges.green;
      case "SCHEDULED":
        return theme.badges.yellow;
      case "IN_PROGRESS":
        return theme.badges.blue;
      case "COMPLETED":
        return theme.badges.gray;
      case "CANCELLED":
      case "NO_SHOW":
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

  return (
        <PatientPageShell>
          <PatientPageHeader
            eyebrow="Patient Dashboard"
            title={`${t("dashboard.welcomeBack")}, ${patientData.personalInfo.name.split(" ")[0]}`}
            description={t("dashboard.overview")}
          />

          <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-xl border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all"
                onClick={() => router.push('/patient/check-in')}
              >
                <div className="w-4 h-4 flex items-center justify-center border-2 border-current rounded-sm">
                   <div className="w-2 h-2 bg-current rounded-[1px]" />
                </div>
                Scan Check-In
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-semibold transition-all"
                onClick={() => router.push("/patient/appointments?openBooking=1")}
              >
                <Plus className="w-4 h-4" />
                Book Appointment
              </Button>
          </div>

          {/* Real-time Queue Status */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <PatientQueueCard />
          </div>

          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {/* Diagnosis Card */}
            {isPendingComprehensive ? (
               <div className="border rounded-lg p-4 space-y-3">
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-3 w-1/2" />
               </div>
            ) : patientData.hasDoshaData ? (
            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-emerald-400 border-t-emerald-100/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${theme.textColors.heading}`}>
                  {t("healthcare.diagnosis")}
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {patientData.doshaBalance.dominant}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {t("patients.personalInfo")}
                </p>
              </CardContent>
            </Card>
            ) : null}

            {/* Treatment Card */}
            {patientData.hasTreatmentData ? (
            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${theme.textColors.heading}`}>
                  {t("healthcare.treatment")}
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {patientData.healthOverview.treatmentProgress}%
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {patientData.healthOverview.currentTreatment?.slice(0, 30) || "None"}
                </p>
              </CardContent>
            </Card>
            ) : null}

            {/* Next Appointment Card */}
            {isPendingAppointments ? (
               <div className="border rounded-lg p-4 space-y-3">
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-3 w-1/2" />
               </div>
            ) : (
            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-amber-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${theme.textColors.heading}`}>
                  {t("appointments.upcoming")}
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold text-primary`}>
                  {patientData.healthOverview.nextAppointment ? new Date(
                    patientData.healthOverview.nextAppointment
                  ).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  }) : "No appointments"}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  {patientData.healthOverview.nextAppointment ? new Date(
                    patientData.healthOverview.nextAppointment
                  ).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }) : "Schedule one now"}
                </p>
              </CardContent>
            </Card>
            )}

            {/* Vitals Card */}
            {isPendingVitals ? (
               <div className="border rounded-lg p-4 space-y-3">
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-8 w-3/4" />
                 <Skeleton className="h-3 w-1/2" />
               </div>
            ) : patientData.hasVitalData ? (
            <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${theme.textColors.heading}`}>
                  Vital Stats
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-500">
                  {patientData.vitalStats.bloodPressure}
                </div>
                <p className={`text-xs ${theme.textColors.muted}`}>
                  HR: {patientData.vitalStats.heartRate}
                </p>
              </CardContent>
            </Card>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.95fr] gap-4 sm:gap-6">
            {/* Dosha Balance Chart */}
            {patientData.hasDoshaData && (
            <Card className="lg:order-2 border-l-4 border-l-violet-400 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-violet-600" />
                  </div>
                  Dosha Balance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
               {isPendingComprehensive ? (
                 <div className="space-y-4">
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                   <Skeleton className="h-8 w-full" />
                 </div>
               ) : (
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
               )}
              </CardContent>
            </Card>
            )}

            {/* Upcoming Appointments */}
            <Card className="lg:order-1 border-l-4 border-l-emerald-400 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
               {isPendingAppointments ? (
                  <div className="space-y-4">
                     <Skeleton className="h-16 w-full" />
                     <Skeleton className="h-16 w-full" />
                  </div>
               ) : (
                <div className="space-y-4">
                  {patientData.upcomingAppointments.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                        No upcoming appointments
                     </div>
                  ) : (
                  patientData.upcomingAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className={`flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 border rounded-lg border-emerald-100 hover:bg-emerald-50/40 hover:border-emerald-200 transition-colors`}
                    >
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 ${theme.containers.featureBlue} rounded-full flex items-center justify-center shrink-0`}
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
                        <div className="min-w-0">
                          <h4
                            className={`font-semibold truncate ${theme.textColors.heading}`}
                          >
                            {appointment.type}
                          </h4>
                          <p
                            className={`text-sm truncate ${theme.textColors.secondary}`}
                          >
                            {appointment.doctor}
                          </p>
                          <div
                            className={`flex items-center gap-2 text-xs ${theme.textColors.tertiary}`}
                          >
                            {appointment.isOnline ? (
                              <div className="flex items-center gap-1">
                                <Video className="w-3 h-3 shrink-0" />
                                <span className="truncate">Online Consultation</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{appointment.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          {new Date(appointment.date).toLocaleDateString(
                            "en-IN",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div
                          className={`text-xs ${theme.textColors.secondary}`}
                        >
                          {appointment.time}
                        </div>
                        <Badge className={`mt-1 text-[10px] ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/patient/appointments?openBooking=1")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule New Appointment
                  </Button>
                </div>
               )}
              </CardContent>
            </Card>
          </div>

          {/* Current Treatments */}
          {patientData.currentTreatments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Current Treatment Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patientData.currentTreatments.length === 0 ? (
                 <div className="text-center py-4 text-muted-foreground">
                    No active treatment programs
                 </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {patientData.currentTreatments.map((treatment: any, index: number) => (
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
              )}
            </CardContent>
          </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Medications */}
            {patientData.hasMedications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Current Ayurvedic Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
               {isPendingPrescriptions ? (
                  <div className="space-y-4">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                  </div>
               ) : (
                <div className="space-y-4">
                  {patientData.medications.length === 0 ? (
                     <div className="text-center py-4 text-muted-foreground">No active medications</div>
                  ) : (
                  patientData.medications.map((medication: any, index: number) => (
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
                          {medication.nextRefill}
                        </p>
                      </div>
                    </div>
                  ))
                  )}

                  <Button variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Request Prescription Refill
                  </Button>
                </div>
               )}
              </CardContent>
            </Card>
            )}

            {/* Recent Activity */}
            {patientData.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                {patientData.recentActivity.length > 0 ? (
                  patientData.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="shrink-0">
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
                            className={`w-4 h-4 ${theme.iconColors.blue}`}
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
                  ))) : (
                     <div className="text-center py-4 text-gray-500">No recent activity</div>
                  )}

                  <Button variant="outline" className="w-full">
                    View All Activity
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Health Insights */}
          {patientData.hasDoshaData && (
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
          )}

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
                  onClick={() => router.push("/patient/appointments?openBooking=1")}
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Book Appointment</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = "/video-appointments"}
                >
                  <Video className="w-5 h-5" />
                  <span className="text-sm">Video Consult</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = "/patient/medical-records"}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-sm">View Reports</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                  onClick={() => window.location.href = "/patient/prescriptions"}
                  disabled={!patientData.hasMedications}
                >
                  <Pill className="w-5 h-5" />
                  <span className="text-sm">Refill Prescription</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </PatientPageShell>
    
  );
}
