"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import {
  usePatientDashboardSummary,
  hasDashboardSummaryLoadedForSession,
} from "@/hooks/query/usePatientDashboardSummary";
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
  Calendar,
  Plus,
  Video,
  Heart,
  Leaf,
  Stethoscope,
  BookOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { PatientQueueCard } from "@/components/dashboard/PatientQueueCard";
import { AppointmentExpiryCountdown } from "@/components/appointments/AppointmentExpiryCountdown";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import { resolveAuthoritativeProfileComplete } from "@/lib/config/profile";

export default function PatientDashboard() {
  const { session } = useAuth();
  const { push } = useRouter();
  const user = session?.user;
  const { t } = useTranslation();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const { data: userProfile } = useUserProfile();

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  const clinicId = session?.user?.clinicId || "";
  const patientId = user?.id || "";
  const authoritativeProfileComplete = resolveAuthoritativeProfileComplete(
    userProfile as Record<string, unknown> | null | undefined
  );

  // Composed single-round-trip summary. Replaces the previous fan-out of
  // 5+ separate hooks (vitals, prescriptions, comprehensive EHR, invoices,
  // payments, medical records). Each sub-field below is derived from the
  // summary payload so the rest of the page (transform, view) doesn't
  // need to change shape.
  const { data: summary, isPending: isPendingSummary } =
    usePatientDashboardSummary({ enabled: !!patientId });

  const medicalRecordsData = (summary?.comprehensive as { medicalHistory?: unknown[] } | undefined)?.medicalHistory;
  const vitalSignsData = (summary?.comprehensive as { vitals?: unknown[] } | undefined)?.vitals;
  const comprehensiveData = summary?.comprehensive;
  const prescriptionsData = Array.isArray(summary?.prescriptions) ? summary!.prescriptions : [];
  const invoicesData = Array.isArray(summary?.invoices) ? summary!.invoices : [];
  const paymentsData = Array.isArray(summary?.payments) ? summary!.payments : [];
  const summaryAppointments = Array.isArray(summary?.appointments) ? summary.appointments : [];
  const appointmentsData = useMemo(
    () => ({
      success: true,
      appointments: summaryAppointments,
      data: { appointments: summaryAppointments },
    }),
    [summaryAppointments]
  );

  // Same gate for the dashboard summary â€” if it's the first load this
  // session and the cache is empty, show a skeleton; otherwise keep the
  // previous summary visible during background refetches.
  const hasCachedSummary = !!summary && (
    (Array.isArray(summary.appointments) && summary.appointments.length > 0) ||
    (Array.isArray(summary.prescriptions) && summary.prescriptions.length > 0) ||
    (Array.isArray(summary.invoices) && summary.invoices.length > 0)
  );
  const showSummarySkeleton =
    isPendingSummary &&
    !hasCachedSummary &&
    !hasDashboardSummaryLoadedForSession();
  const showAppointmentsSkeleton = showSummarySkeleton;

  const hasInPersonAppointment = useMemo(() => {
    const appointments = summaryAppointments;

    return appointments.some((appointment: any) => {
      const status = normalizeAppointmentStatus(appointment?.status);
      const type = String(appointment?.type || appointment?.appointmentType || "").toUpperCase();
        return (
          type === "IN_PERSON" &&
          status !== "CANCELLED" &&
          status !== "COMPLETED" &&
          status !== "NO_SHOW" &&
          status !== "EXPIRED"
        );
    });
  }, [summaryAppointments]);

  const resolvePatientDisplayName = (value: {
    firstName?: string | undefined;
    lastName?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
  } | null | undefined) => {
    const fullName = [value?.firstName, value?.lastName].filter(Boolean).join(" ").trim();
    if (fullName) {
      return fullName;
    }

    const fallbackName = value?.name?.trim() || "";
    const looksLikePhoneNumber = /^[+\d][\d\s().-]{6,}$/.test(fallbackName);

    if (fallbackName && !looksLikePhoneNumber) {
      return fallbackName;
    }

    // No name set yet. Use a neutral label instead of the previous "New Patient" fallback.
    return "Patient";
  };

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

    const rawAppointments = summaryAppointments;
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
        !["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"].includes(normalizedStatus) &&
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

    // â”€â”€â”€ Recent (past) appointments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Patients want to see what happened to their scheduled sessions,
    // including CANCELLED / NO_SHOW / EXPIRED / COMPLETED rows the
    // backend scheduler has classified. Trust the backend's status
    // outright â€” we don't infer EXPIRED locally, since the scheduler
    // runs every minute and stamps the row before we need to react.
    const recentAppointments = uniqueAppointments
      .filter((apt: any) => {
        const viewState = getAppointmentViewState(apt);
        const status = viewState.normalizedStatus.toUpperCase();
        return (
          status === "CANCELLED" ||
          status === "NO_SHOW" ||
          status === "EXPIRED" ||
          status === "COMPLETED"
        );
      })
      .sort((a: any, b: any) => {
        const first = normalizePatientAppointment(a).dateTime?.getTime() || 0;
        const second = normalizePatientAppointment(b).dateTime?.getTime() || 0;
        return second - first;
      })
      .slice(0, 10)
      .map((apt: any) => {
        const normalized = normalizePatientAppointment(apt);
        const viewState = getAppointmentViewState(apt);
        const status = viewState.normalizedStatus.toUpperCase();
        const dateLabel = getReceptionistAppointmentDateLabel(apt as Record<string, unknown>);
        const timeLabel = getReceptionistAppointmentTimeLabel(apt as Record<string, unknown>);
        return {
          id: apt.id,
          doctor: normalized.doctorName,
          type: normalized.type,
          date: dateLabel,
          time: timeLabel,
          location: normalized.locationName,
          status,
          statusLabel: viewState.displayStatusLabel,
          isOnline: normalized.isOnline,
        };
      });

    const nextTimelineAppointment = currentInProgressAppointments[0] || futureAppointments[0] || null;

    const latestVitals = Array.isArray(vitalSignsData)
      ? vitalSignsData.reduce((latest: any, current: any) => {
          const latestTime = new Date(
            latest?.recordedAt || latest?.createdAt || latest?.updatedAt || 0
          ).getTime();
          const currentTime = new Date(
            current?.recordedAt || current?.createdAt || current?.updatedAt || 0
          ).getTime();
          return currentTime > latestTime ? current : latest;
        }, vitalSignsData[0] || {}) || {}
      : (vitalSignsData as any)?.[0] || {};
    const latestPrescriptions = Array.isArray(prescriptionsData)
      ? prescriptionsData.toSorted(
          (left: any, right: any) =>
            new Date(right.prescribedAt || right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.prescribedAt || left.createdAt || left.updatedAt || 0).getTime()
        )
      : [];
    const billingInvoices = Array.isArray(invoicesData)
      ? invoicesData.toSorted(
          (left: any, right: any) =>
            new Date(right.createdAt || right.updatedAt || 0).getTime() -
            new Date(left.createdAt || left.updatedAt || 0).getTime()
        )
      : [];
    const billingPayments = Array.isArray(paymentsData)
      ? paymentsData.toSorted(
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

    const mergedUser = {
      ...(user as unknown as Record<string, unknown>),
      ...(userProfile as unknown as Record<string, unknown> | undefined),
    };

    return {
      personalInfo: {
        name: resolvePatientDisplayName(mergedUser as any),
        age: calculateAge((mergedUser as any)?.dateOfBirth),
        gender: (mergedUser as any)?.gender || "Unknown",
        phone: (mergedUser as any)?.phone || (mergedUser as any)?.phoneNumber || "",
        email: (mergedUser as any)?.email || "",
      },
      healthOverview: {
        primaryDosha: (comprehensiveData as any)?.doshaBalance?.dominant || "Unknown",
        currentTreatment: (medicalRecordsData as any)?.[0]?.treatment || "None",
        treatmentProgress: 0, 
        nextAppointment: nextTimelineAppointment
          ? getReceptionistAppointmentDateLabel(nextTimelineAppointment as Record<string, unknown>)
          : null,
        lastVisit:
          uniqueAppointments.reduce((latest: any, current: any) => {
            const normalizedStatus = getAppointmentViewState(current).normalizedStatus.toUpperCase();
            if (["CANCELLED", "NO_SHOW", "EXPIRED"].includes(normalizedStatus)) {
              return latest;
            }

            if (normalizePatientAppointment(current).status !== "COMPLETED") {
              return latest;
            }

            if (!latest) return current;

            const latestTime = normalizePatientAppointment(latest).dateTime?.getTime() || 0;
            const currentTime = normalizePatientAppointment(current).dateTime?.getTime() || 0;
            return currentTime > latestTime ? current : latest;
          }, null)?.time || null,
      },
      upcomingAppointments,
      videoAppointments: upcomingAppointments.reduce<Array<typeof upcomingAppointments[number]>>((accumulator, apt: any) => {
        if (apt.isOnline) {
          accumulator.push(apt);
        }
        return accumulator;
      }, []),
      recentAppointments,
      recentActivity: [] as Array<{ type: string; message: string; time: string }>,
      currentTreatments: [] as Array<{ name: string; type: string; doctor: string; progress: number; nextSession: string }>,
      medications: latestPrescriptions.slice(0, 5).reduce(
        (accumulator: Array<{ name: string; dosage: string; nextRefill: string | null }>, presc: any) => {
          accumulator.push({
            name: presc.medicineName || presc.name || "Unknown",
            dosage: presc.dosage || "As prescribed",
            nextRefill: presc.nextRefillDate ? safeFormatDate(presc.nextRefillDate) : null,
          });
          return accumulator;
        },
        []
      ),
      billingSummary: {
        openInvoices: openInvoices.length,
        outstandingAmount,
        recentPaymentStatus: latestPayment ? String((latestPayment as { status?: string }).status || "PENDING").toUpperCase() : "NONE",
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
    summaryAppointments,
    medicalRecordsData,
    vitalSignsData,
    prescriptionsData,
    comprehensiveData,
    invoicesData,
    paymentsData,
    user,
    userProfile,
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
        return theme.badges.red;
      case "NO_SHOW":
        return theme.badges.orange;
      case "EXPIRED":
        return theme.badges.amber;
      default:
        return theme.badges.gray;
    }
  };

  return (
    <PatientPageShell className="mx-auto max-w-7xl">
          {/* Profile completion banner â€” only for patients the backend still marks incomplete */}
          {authoritativeProfileComplete !== true && (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div>
                <p className="font-semibold">Complete your profile</p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Add your name and basic details so your doctors can identify you.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 self-start rounded-lg border-amber-300 bg-white px-3 text-amber-900 hover:bg-amber-100 sm:self-auto dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                onClick={() => push("/profile-completion")}
              >
                Complete now
              </Button>
            </div>
          )}
          <PatientPageHeader
            eyebrow="Patient Dashboard"
            title={`${t("dashboard.welcomeBack")}, ${patientData.personalInfo.name}`}
            description={t("dashboard.overview")}
            actionsSlot={
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  className="h-9 gap-2 rounded-xl border-sky-200 bg-sky-50 px-3 text-sm text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-300 sm:h-10 sm:px-4"
                  onClick={() => {
                    if (hasInPersonAppointment) {
                      push("/patient/check-in");
                      return;
                    }
                    openQrGate({
                      bookLabel: "Book Video Appointment",
                      onBookAppointment: () => push("/patient/appointments"),
                    });
                  }}
                >
                  <div className="flex size-4 items-center justify-center rounded-full border-2 border-current">
                    <div className="size-1.5 rounded-[1px] bg-current" />
                  </div>
                  Scan Check-In
                </Button>
                <Button
                  className="h-9 gap-2 rounded-xl border border-red-500 bg-red-600 px-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(220,38,38,0.22)] transition-all hover:-translate-y-0.5 hover:border-red-600 hover:bg-red-700 hover:shadow-[0_12px_28px_rgba(220,38,38,0.28)] sm:h-10 sm:px-4 active:scale-95 focus-visible:ring-2 focus-visible:ring-red-300 dark:border-red-700 dark:bg-red-600 dark:shadow-[0_8px_20px_rgba(239,68,68,0.15)] dark:hover:bg-red-500"
                  onClick={() => push("/patient/appointments?openBooking=1")}
                >
                  <BookOpen className="size-4" />
                  Book Video Appointment
                </Button>
              </div>
            }
          />

          <Card className="overflow-hidden border border-emerald-200/70 bg-linear-to-br from-emerald-50 via-background to-sky-50 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-card dark:to-sky-950/20 p-2.5 sm:p-5">
            <CardContent className="p-0">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between sm:gap-2.5">
                <div className="flex min-w-0 flex-1 flex-col gap-y-2 sm:gap-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 sm:gap-2">
                    <Clock className="size-4" />
                    Healthcare Workspace
                  </div>
                  {showAppointmentsSkeleton ? (
                    <div className="rounded-2xl border border-emerald-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-card/80 sm:p-4">
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-5 w-48 rounded-lg" />
                          </div>
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Skeleton className="h-14 rounded-xl" />
                          <Skeleton className="h-14 rounded-xl" />
                        </div>
                        <Skeleton className="h-9 w-28 rounded-xl" />
                      </div>
                    </div>
                  ) : patientData.upcomingAppointments.length > 0 ? (
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Open appointments page"
                      className="group cursor-pointer rounded-2xl border border-emerald-200/80 bg-white/80 p-2 shadow-sm backdrop-blur transition-all hover:border-emerald-300 hover:bg-white hover:shadow-md dark:border-emerald-900/40 dark:bg-card/80 dark:hover:border-emerald-800/60 dark:hover:bg-card sm:p-4"
                      onClick={() => push("/patient/appointments")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          push("/patient/appointments");
                        }
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                        <div>
                          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                            Appointments
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            {patientData.upcomingAppointments.length} appointment{patientData.upcomingAppointments.length > 1 ? "s" : ""}
                          </h3>
                        </div>
                        <Badge className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                          Upcoming & in progress
                        </Badge>
                      </div>

                      <div className="mt-2.5 flex max-h-72 flex-col gap-y-2 overflow-y-auto pr-1 sm:mt-4 sm:gap-y-3">
                        {patientData.upcomingAppointments.map((appointment: any) => {
                          const videoSessionDecision = appointment.isOnline
                            ? getVideoSessionDecision(appointment)
                            : null;

                          return (
                            <div
                              key={appointment.id}
                              className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-background/80 p-1.5 shadow-sm transition-colors hover:border-emerald-200 dark:border-emerald-900/30 dark:bg-card/80 sm:gap-2.5 sm:p-3"
                            >
                              <div className="grid min-w-0 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                                <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                                  <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:h-11 sm:w-11">
                                    {appointment.isOnline ? (
                                      <Video className="size-5" />
                                    ) : (
                                      <Stethoscope className="size-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80 dark:text-emerald-300/80">
                                        {appointment.isOnline ? "Video consultation" : "In-person visit"}
                                      </p>
                                      <Badge className={`h-5 sm:h-6 rounded-full px-2 sm:px-2.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
                                        {appointment.statusLabel || getAppointmentStatusDisplayName(appointment.status)}
                                      </Badge>
                                      <AppointmentExpiryCountdown
                                        expiresAt={appointment.confirmationExpiresAt}
                                        windowMinutes={appointment.confirmationWindowMinutes}
                                        status={appointment.status}
                                        variant="compact"
                                      />
                                    </div>
                                    <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                                      {appointment.doctor}
                                    </h4>
                                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                      {appointment.type}
                                      {appointment.isOnline
                                        ? " Â· Online"
                                        : appointment.location
                                          ? ` Â· ${appointment.location}`
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
                                    className="h-8 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-xs font-semibold text-white shadow-md transition-all hover:from-orange-600 hover:to-amber-600 hover:shadow-lg"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      push(buildVideoSessionRoute(appointment.id));
                                    }}
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
                          <Clock className="size-5" />
                        </EmptyMedia>
                        <EmptyTitle>No upcoming or in-progress appointments right now</EmptyTitle>
                        <EmptyDescription>
                          Book a visit to see your next appointment here.
                        </EmptyDescription>
                      </EmptyContent>
                    </Empty>
                  )}

                  {/* <div className="rounded-2xl border border-emerald-200/70 bg-white/70 p-3 shadow-sm dark:border-emerald-900/30 dark:bg-card/70">
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
                      isAppointmentsPending={showAppointmentsSkeleton}
                    />
                  </div> */}

                  {/* Recent appointments â€” backend-driven statuses */}
                  {patientData.recentAppointments.length > 0 ? (
                    <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm dark:border-slate-800/60 dark:bg-card/70 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                            Recent appointments
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cancelled, expired, no-show, and completed sessions â€” statuses from the backend
                          </p>
                        </div>
                        <Badge className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                          {patientData.recentAppointments.length} past
                        </Badge>
                      </div>

                      <div className="mt-3 flex max-h-72 flex-col gap-y-2 overflow-y-auto py-2 pr-1 sm:gap-y-3">
                        {patientData.recentAppointments.map((appointment: any) => (
                          <div
                            key={appointment.id}
                            className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-background/80 p-1.5 shadow-sm transition-colors hover:border-slate-200 dark:border-slate-800/60 dark:bg-card/80 sm:gap-2.5 sm:p-3"
                          >
                            <div className="grid min-w-0 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                              <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                                <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 sm:h-11 sm:w-11">
                                  {appointment.isOnline ? (
                                    <Video className="size-5" />
                                  ) : (
                                    <Stethoscope className="size-5" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-600/80 dark:text-slate-400/80">
                                      {appointment.isOnline ? "Video consultation" : "In-person visit"}
                                    </p>
                                    <Badge className={`h-5 sm:h-6 rounded-full px-2 sm:px-2.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(appointment.status)}`}>
                                      {appointment.statusLabel || getAppointmentStatusDisplayName(appointment.status)}
                                    </Badge>
                                    <AppointmentExpiryCountdown
                                      expiresAt={appointment.confirmationExpiresAt}
                                      windowMinutes={appointment.confirmationWindowMinutes}
                                      status={appointment.status}
                                      variant="compact"
                                    />
                                  </div>
                                  <h4 className="mt-1 truncate text-sm font-semibold text-foreground">
                                    {appointment.doctor}
                                  </h4>
                                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                    {appointment.type}
                                    {appointment.isOnline
                                      ? " Â· Online"
                                      : appointment.location
                                        ? ` Â· ${appointment.location}`
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
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-3">
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
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-3">
            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Prescriptions
                </CardTitle>
                <div className="flex size-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Pill className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2.5 p-0 sm:gap-y-3">
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
                  onClick={() => push("/patient/health?tab=medicines")}
                >
                  <span className="truncate">Open medicines</span>
                  <FileText className="size-4 shrink-0" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Payments
                </CardTitle>
                <div className="flex size-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                  <CreditCard className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2.5 p-0 sm:gap-y-3">
                <div>
                  <div className="text-xl font-bold leading-none text-sky-700 dark:text-sky-300 sm:text-2xl">
                    {patientData.billingSummary.openInvoices}
                  </div>
                  <p className={`text-xs ${theme.textColors.secondary}`}>
                    Open invoices
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between border-sky-200 bg-white/80 text-sky-700 hover:bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200 dark:hover:bg-sky-900/30 sm:h-10"
                  onClick={() => push("/patient/payments?tab=payments")}
                >
                  <span className="truncate">Open payments</span>
                  <CreditCard className="size-4 shrink-0" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Video
                </CardTitle>
                <div className="flex size-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <Video className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2.5 p-0 sm:gap-y-3">
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
                  onClick={() => push("/patient/appointments?mode=VIDEO")}
                >
                  <span className="truncate">Join video visits</span>
                  <Video className="size-4 shrink-0" />
                </Button>
              </CardContent>
            </Card>

            <Card className="h-full overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Records
                </CardTitle>
                <div className="flex size-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <FileText className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-y-2.5 p-0 sm:gap-y-3">
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
                  onClick={() => push("/patient/health?tab=records")}
                >
                  <span className="truncate">Open records</span>
                  <FileText className="size-4 shrink-0" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* At a glance */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4 mt-6">
            <Card className="overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Next visit
                </CardTitle>
                <div className="flex size-7 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                  <Clock className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl font-bold leading-none text-teal-700 dark:text-teal-300 sm:text-2xl truncate">
                  {patientData.healthOverview.nextAppointment || "None"}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Upcoming or active appointment
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Medicines
                </CardTitle>
                <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Pill className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl font-bold leading-none text-indigo-700 dark:text-indigo-300 sm:text-2xl">
                  {patientData.medications.length}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Active medicines and refill reminders
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Vitals
                </CardTitle>
                <div className="flex size-7 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  <Activity className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl font-bold leading-none text-rose-700 dark:text-rose-300 sm:text-2xl">
                  {patientData.vitalStats.bloodPressure !== "N/A" ? patientData.vitalStats.bloodPressure : "--"}
                </div>
                <p className={`mt-1 text-xs ${theme.textColors.secondary}`}>
                  Latest blood pressure
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border bg-card shadow-sm p-4 sm:p-5">
              <CardHeader className="flex flex-row items-center justify-between gap-y-0 p-0 pb-1.5 sm:pb-2">
                <CardTitle className={`text-sm font-semibold ${theme.textColors.heading}`}>
                  Records
                </CardTitle>
                <div className="flex size-7 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
                  <FileText className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xl font-bold leading-none text-orange-700 dark:text-orange-300 sm:text-2xl">
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



