"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import {
  usePatientMedicalRecords,
  usePatientVitalSigns,
} from "@/hooks/query/usePatients";
import {
  usePatientPrescriptions,
  useComprehensiveHealthRecord,
} from "@/hooks/query/useMedicalRecords";
import { useInvoices, usePayments } from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useTranslation } from "@/lib/i18n/context";
import { theme } from "@/lib/utils/theme-utils";
import {
  getAppointmentViewState,
  isTerminalAppointment,
  shouldShowAppointmentOnPatientDashboard,
  getAppointmentDateTimeValue,
  formatDateInIST,
  formatTimeInIST,
  getVideoSessionDecision,
} from "@/lib/utils/appointmentUtils";
import {
  normalizeAppointmentStatus,
  getAppointmentStatusBadgeLabel,
  getAppointmentStatusDisplayName,
  normalizePatientAppointment,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import {
  Activity,
  CreditCard,
  FileText,
  Pill,
  Clock,
  Plus,
  Video,
  Heart,
  Leaf,
  Stethoscope,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { PatientQueueCard } from "@/components/dashboard/PatientQueueCard";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { usePatientUiStore } from "@/stores/patient-ui.store";

export default function PatientDashboard() {
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;
  const { t } = useTranslation();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  const clinicId = session?.user?.clinicId || "";
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
  const { data: invoicesData = [] } = useInvoices(patientId);
  const { data: paymentsData = [] } = usePayments(patientId);
  const hasInPersonAppointment = useMemo(() => {
    const appointments = Array.isArray(appointmentsData?.appointments) ? appointmentsData.appointments : [];

    return appointments.some((appointment: any) => {
      const status = normalizeAppointmentStatus(appointment?.status);
      const type = String(appointment?.type || appointment?.appointmentType || "").toUpperCase();
      return (
        type === "IN_PERSON" &&
        status !== "CANCELLED" &&
        status !== "COMPLETED" &&
        status !== "NO_SHOW"
      );
    });
  }, [appointmentsData]);

  // Transform real data
  const patientData = useMemo(() => {
    // Helper for safe date formatting
    const safeFormatDate = (dateString: any, options?: Intl.DateTimeFormatOptions) => {
      try {
        if (!dateString) return "";
        return formatDateInIST(dateString, options, "en-IN");
      } catch (e) {
        return "";
      }
    };

    const safeFormatTime = (dateString: any, options?: Intl.DateTimeFormatOptions) => {
      try {
        if (!dateString) return "";
        return formatTimeInIST(dateString, options, "en-IN");
      } catch (e) {
        return "";
      }
    };

    const rawAppointments = Array.isArray(appointmentsData?.appointments)
      ? appointmentsData.appointments
      : [];
    const appointments = Array.isArray(rawAppointments) ? rawAppointments : [];
    const uniqueAppointments = Array.from(
      new Map(
        appointments.map((apt: any) => {
          const normalized = normalizePatientAppointment(apt);
          const dedupeKey =
            apt?.id ||
            `${normalized.doctorName || "doctor"}-${normalized.normalizedDate || "date"}-${normalized.normalizedTime || "time"}-${normalized.locationName || "location"}`;

          return [String(dedupeKey), apt];
        })
      ).values()
    );
    const patientWorkspaceAppointments = uniqueAppointments.filter((apt: any) => {
      const viewState = getAppointmentViewState(apt);
      const normalizedStatus = viewState.normalizedStatus.toUpperCase();
      return (
        !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(normalizedStatus) &&
        shouldShowAppointmentOnPatientDashboard(apt)
      );
    });
    const activeUpcomingStatuses = new Set([
      "SCHEDULED",
      "CONFIRMED",
      "PENDING",
      "QUEUED",
    ]);

    const currentInProgressAppointments = Array.isArray(patientWorkspaceAppointments)
      ? patientWorkspaceAppointments
          .filter((apt: any) => getAppointmentViewState(apt).normalizedStatus.toUpperCase() === "IN_PROGRESS")
          .sort((a: any, b: any) => {
            const first = normalizePatientAppointment(a).dateTime;
            const second = normalizePatientAppointment(b).dateTime;
            if (!first && !second) return 0;
            if (!first) return 1;
            if (!second) return -1;
            return second.getTime() - first.getTime();
          })
      : [];

    const futureAppointments = Array.isArray(patientWorkspaceAppointments)
      ? patientWorkspaceAppointments
          .filter((apt: any) => {
            const normalized = normalizePatientAppointment(apt);
            const viewState = getAppointmentViewState(apt);
            const appointmentStart = normalized.dateTime;
            const status = isTerminalAppointment(apt)
              ? viewState.normalizedStatus
              : viewState.isVideo && !viewState.paymentCompleted
                ? "SCHEDULED"
                : viewState.normalizedStatus;
            return activeUpcomingStatuses.has(status) || appointmentStart === null;
          })
          .sort((a: any, b: any) => {
            const first = normalizePatientAppointment(a).dateTime;
            const second = normalizePatientAppointment(b).dateTime;
            if (!first && !second) return 0;
            if (!first) return 1;
            if (!second) return -1;
            return second.getTime() - first.getTime();
          })
      : [];

    const upcomingAppointments = [...currentInProgressAppointments, ...futureAppointments]
      .sort((a: any, b: any) => {
        const aStatus = getAppointmentViewState(a).normalizedStatus.toUpperCase();
        const bStatus = getAppointmentViewState(b).normalizedStatus.toUpperCase();
        const statusPriority = (status: string) => {
          if (status === "IN_PROGRESS") return 0;
          if (status === "QUEUED") return 1;
          if (status === "CONFIRMED") return 2;
          if (status === "SCHEDULED") return 3;
          if (status === "PENDING") return 4;
          return 5;
        };

        if (statusPriority(aStatus) !== statusPriority(bStatus)) {
          return statusPriority(aStatus) - statusPriority(bStatus);
        }

        const first = normalizePatientAppointment(a).dateTime;
        const second = normalizePatientAppointment(b).dateTime;
        if (!first && !second) return 0;
        if (!first) return 1;
        if (!second) return -1;
        return second.getTime() - first.getTime();
      })
      .map((apt: any) => {
        const normalized = normalizePatientAppointment(apt);
        const viewState = getAppointmentViewState(apt);
        const appointmentDateTime = getAppointmentDateTimeValue(apt);
        const dateLabel = appointmentDateTime
          ? formatDateInIST(appointmentDateTime, { weekday: "short", day: "2-digit", month: "short" })
          : getReceptionistAppointmentDateLabel(apt as Record<string, unknown>);
        const timeLabel = appointmentDateTime
          ? formatTimeInIST(appointmentDateTime, { hour: "2-digit", minute: "2-digit", hour12: true })
          : getReceptionistAppointmentTimeLabel(apt as Record<string, unknown>);
        return {
          id: apt.id,
          doctor: normalized.doctorName,
          type: normalized.type,
          date: dateLabel,
          time: timeLabel,
          location: normalized.locationName,
          status: isTerminalAppointment(apt)
            ? viewState.normalizedStatus
            : viewState.isVideo && !viewState.paymentCompleted
              ? "SCHEDULED"
              : normalized.status || "SCHEDULED",
          statusLabel: viewState.displayStatusLabel,
          isOnline: normalized.isOnline,
        };
      });
    const nextTimelineAppointment = currentInProgressAppointments[0] || futureAppointments[0] || null;

    const latestVitals = Array.isArray(vitalSignsData)
      ? [...vitalSignsData].sort(
          (left: any, right: any) =>
            new Date(right.recordedAt || right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.recordedAt || left.createdAt || left.updatedAt || 0).getTime()
        )[0] || {}
      : (vitalSignsData as any)?.[0] || {};
    const latestPrescriptions = Array.isArray(prescriptionsData)
      ? [...prescriptionsData].sort(
          (left: any, right: any) =>
            new Date(right.prescribedAt || right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.prescribedAt || left.createdAt || left.updatedAt || 0).getTime()
        )
      : [];
    const billingInvoices = Array.isArray(invoicesData)
      ? [...invoicesData].sort(
          (left: any, right: any) =>
            new Date(right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.createdAt || left.updatedAt || 0).getTime()
        )
      : [];
    const billingPayments = Array.isArray(paymentsData)
      ? [...paymentsData].sort(
          (left: any, right: any) =>
            new Date(right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.createdAt || left.updatedAt || 0).getTime()
        )
      : [];
    const openInvoices = billingInvoices.filter((invoice: any) => {
      const status = String(invoice?.status || "").toUpperCase();
      return status === "OPEN" || status === "OVERDUE";
    });
    const outstandingAmount = openInvoices.reduce(
      (total: number, invoice: any) => total + Number(invoice?.amount || 0),
      0
    );
    const latestPayment = billingPayments[0] || null;

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
        nextAppointment: nextTimelineAppointment
          ? getReceptionistAppointmentDateLabel(nextTimelineAppointment as Record<string, unknown>)
          : null,
        lastVisit:
        uniqueAppointments
            .filter((apt: any) => {
              const normalizedStatus = getAppointmentViewState(apt).normalizedStatus.toUpperCase();
              return !["CANCELLED", "NO_SHOW"].includes(normalizedStatus);
            })
            .filter((apt: any) => normalizePatientAppointment(apt).status === "COMPLETED")
            .sort(
              (a: any, b: any) =>
                (normalizePatientAppointment(b).dateTime?.getTime() || 0) -
                (normalizePatientAppointment(a).dateTime?.getTime() || 0)
            )[0]?.time || null,
      },
      upcomingAppointments,
      videoAppointments: upcomingAppointments.filter((apt: any) => apt.isOnline),
      recentActivity: [] as Array<{ type: string; message: string; time: string }>,
      currentTreatments: [] as Array<{ name: string; type: string; doctor: string; progress: number; nextSession: string }>,
      medications: latestPrescriptions.slice(0, 5).map((presc: any) => ({
        name: presc.medicineName || presc.name || "Unknown",
        dosage: presc.dosage || "As prescribed",
        nextRefill: presc.nextRefillDate ? safeFormatDate(presc.nextRefillDate) : null,
      })),
      billingSummary: {
        openInvoices: openInvoices.length,
        outstandingAmount,
        recentPaymentStatus: latestPayment ? String(latestPayment.status || "PENDING").toUpperCase() : "NONE",
      },
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
      hasBillingData: billingInvoices.length > 0 || billingPayments.length > 0,
      hasTreatmentData: Boolean((medicalRecordsData as any)?.[0]?.treatment),
      hasVitalData: Boolean(latestVitals && Object.keys(latestVitals).length > 0),
      recordsCount: Array.isArray(medicalRecordsData) ? medicalRecordsData.length : 0,
    };
  }, [
    appointmentsData,
    medicalRecordsData,
    vitalSignsData,
    prescriptionsData,
    comprehensiveData,
    invoicesData,
    paymentsData,
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

  return (
        <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <PatientPageHeader
            eyebrow="Patient Dashboard"
            title={`${t("dashboard.welcomeBack")}, ${patientData.personalInfo.name.split(" ")[0]}`}
            description={t("dashboard.overview")}
            actionsSlot={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-xl border-sky-200 bg-sky-50 px-3 text-sm text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-300 sm:h-10 sm:px-4"
                  onClick={() => {
                    if (hasInPersonAppointment) {
                      router.push("/patient/check-in");
                      return;
                    }
                    openQrGate({
                      bookLabel: "Open appointments",
                      onBookAppointment: () => router.push("/patient/appointments"),
                    });
                  }}
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-current">
                    <div className="h-1.5 w-1.5 rounded-[1px] bg-current" />
                  </div>
                  Scan Check-In
                </Button>
                <Button
                  className="h-9 gap-2 rounded-xl border-0 bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 sm:h-10 sm:px-4"
                  onClick={() => router.push("/patient/appointments?openBooking=1")}
                >
                  <Plus className="h-4 w-4" />
                  Book Appointment
                </Button>
              </div>
            }
          />

          <Card className="overflow-hidden border border-emerald-200/70 bg-linear-to-br from-emerald-50 via-background to-sky-50 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-card dark:to-sky-950/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <Clock className="h-4 w-4" />
                    Healthcare Workspace
                  </div>
                  {patientData.upcomingAppointments.length > 0 ? (
                    <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-card/80 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                            Appointments
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            {patientData.upcomingAppointments.length} appointment{patientData.upcomingAppointments.length > 1 ? "s" : ""}
                          </h3>
                        </div>
                        <Badge className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Upcoming & in progress
                        </Badge>
                      </div>

                      <div className="mt-3 max-h-72 space-y-2.5 overflow-y-auto pr-1 sm:mt-4 sm:space-y-3">
                        {patientData.upcomingAppointments.map((appointment: any) => {
                          const videoSessionDecision = appointment.isOnline
                            ? getVideoSessionDecision(appointment)
                            : null;

                          return (
                            <div
                              key={appointment.id}
                              className="flex flex-col gap-2.5 rounded-2xl border border-emerald-100 bg-background/80 p-2.5 shadow-sm transition-colors hover:border-emerald-200 dark:border-emerald-900/30 dark:bg-card/80 sm:p-3"
                            >
                              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                                <div className="flex min-w-0 items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:h-11 sm:w-11">
                                    {appointment.isOnline ? (
                                      <Video className="h-5 w-5" />
                                    ) : (
                                      <Stethoscope className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                                        {appointment.isOnline ? "Video consultation" : "In-person visit"}
                                      </p>
                                      <Badge className={`h-6 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
                                        {appointment.statusLabel || getAppointmentStatusDisplayName(appointment.status)}
                                      </Badge>
                                    </div>
                                    <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                                      {appointment.doctor}
                                    </h4>
                                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                      {appointment.type}
                                      {appointment.isOnline
                                        ? " · Online"
                                        : appointment.location
                                          ? ` · ${appointment.location}`
                                          : ""}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/30 md:min-w-[10.5rem]">
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      Date
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {appointment.date || "Date TBD"}
                                    </div>
                                  </div>
                                  <div className="min-w-0 text-right">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      Time
                                    </div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                      {appointment.time || "Time TBD"}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {appointment.isOnline && videoSessionDecision?.canJoin ? (
                                <div className="flex justify-end">
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                                    onClick={() => router.push(buildVideoSessionRoute(appointment.id))}
                                  >
                                    Join Session
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Empty>
                      <EmptyContent>
                        <EmptyMedia>
                          <Clock className="h-5 w-5" />
                        </EmptyMedia>
                        <EmptyTitle>No upcoming or in-progress appointments right now</EmptyTitle>
                        <EmptyDescription>
                          Book a visit to see your next appointment here.
                        </EmptyDescription>
                      </EmptyContent>
                    </Empty>
                  )}

                  <div className="rounded-2xl border border-emerald-200/70 bg-white/70 p-3 shadow-sm dark:border-emerald-900/30 dark:bg-card/70">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                          Check-in
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your live queue and check-in status
                        </p>
                      </div>
                    </div>
                    <PatientQueueCard
                      appointmentsData={appointmentsData}
                      isAppointmentsPending={isPendingAppointments}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-3">
                <div className="rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Medicines</div>
                  <div className="mt-1 text-lg font-bold leading-none text-foreground">
                    {patientData.medications.length}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Active</div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Vitals</div>
                  <div className="mt-1 text-lg font-bold leading-none text-foreground">
                    {patientData.vitalStats.lastUpdated}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Latest update</div>
                </div>
                <div className="rounded-2xl border border-border bg-card px-3 py-2 shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Treatment plan</div>
                  <div className="mt-1 line-clamp-1 text-lg font-bold leading-none text-foreground">
                    {patientData.healthOverview.currentTreatment || "None"}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">Current plan</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Services */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3">
            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Prescriptions
                </CardTitle>
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Pill className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3">
                <div>
                  <div className="text-xl font-bold leading-none text-emerald-700 dark:text-emerald-300 sm:text-2xl">
                    {patientData.medications.length}
                  </div>
                  <p className={`text-xs ${theme.textColors.secondary}`}>
                    Active medicines and refill reminders
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-emerald-200 bg-white/80 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200 dark:hover:bg-emerald-900/30 sm:h-10"
                  onClick={() => router.push("/patient/health?tab=medicines")}
                >
                  Open medicines
                  <FileText className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Payments
                </CardTitle>
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <CreditCard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3">
                <div>
                  <div className="text-xl font-bold leading-none text-sky-700 dark:text-sky-300 sm:text-2xl">
                    {patientData.billingSummary.openInvoices}
                  </div>
                  <p className={`text-xs ${theme.textColors.secondary}`}>
                    Open invoices · {patientData.billingSummary.outstandingAmount > 0 ? `₹${patientData.billingSummary.outstandingAmount.toLocaleString("en-IN")}` : "No dues"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-sky-200 bg-white/80 text-sky-700 hover:bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200 dark:hover:bg-sky-900/30 sm:h-10"
                  onClick={() => router.push("/patient/payments?tab=payments")}
                >
                  Open payments
                  <CreditCard className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Video
                </CardTitle>
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <Video className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3">
                <div>
                  <div className="text-xl font-bold leading-none text-violet-700 dark:text-violet-300 sm:text-2xl">
                    {patientData.videoAppointments.length}
                  </div>
                  <p className={`text-xs ${theme.textColors.secondary}`}>
                    Upcoming online consultations
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-violet-200 bg-white/80 text-violet-700 hover:bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/20 dark:text-violet-200 dark:hover:bg-violet-900/30 sm:h-10"
                  onClick={() => router.push("/patient/appointments?mode=VIDEO")}
                >
                  Join video visits
                  <Video className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Records
                </CardTitle>
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3">
                <div>
                  <div className="text-xl font-bold leading-none text-amber-700 dark:text-amber-300 sm:text-2xl">
                    {patientData.recordsCount}
                  </div>
                  <p className={`text-xs ${theme.textColors.secondary}`}>
                    Visit notes, vitals, and history
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-amber-200 bg-white/80 text-amber-700 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-900/30 sm:h-10"
                  onClick={() => router.push("/patient/health?tab=records")}
                >
                  Open records
                  <FileText className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* At a glance */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
            <Card className="overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Next visit
                </CardTitle>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Clock className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl font-bold leading-none text-emerald-700 dark:text-emerald-300 sm:text-2xl">
                  {patientData.healthOverview.nextAppointment || "None"}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Upcoming or active appointment
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Medicines
                </CardTitle>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <Pill className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl font-bold leading-none text-violet-700 dark:text-violet-300 sm:text-2xl">
                  {patientData.medications.length}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Active medicines and refill reminders
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Payments
                </CardTitle>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <CreditCard className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl font-bold leading-none text-sky-700 dark:text-sky-300 sm:text-2xl">
                  {patientData.billingSummary.openInvoices}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  {patientData.billingSummary.outstandingAmount > 0
                    ? `₹${patientData.billingSummary.outstandingAmount.toLocaleString("en-IN")} due`
                    : "No dues"}
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Records
                </CardTitle>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xl font-bold leading-none text-amber-700 dark:text-amber-300 sm:text-2xl">
                  {patientData.recordsCount}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Records, notes, and reports
                </p>
              </CardContent>
            </Card>
          </div>

        </PatientPageShell>
  );
}

