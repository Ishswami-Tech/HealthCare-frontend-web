"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Video,
  Stethoscope,
  BookOpen,
  Loader2,
  QrCode,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { AppointmentExpiryCountdown } from "@/components/appointments/AppointmentExpiryCountdown";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import {
  DASHBOARD_SPACING,
  DashboardEmpty,
  DashboardQuickAction,
  DashboardSection,
  DashboardStatCard,
  DashboardStatStrip,
} from "@/components/dashboard/DashboardPrimitives";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";
import { resolvePatientDisplayName } from "@/lib/utils/display-name";

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getStatusColor(status: string) {
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
}

interface AppointmentRowProps {
  appointment: any;
  /** Only upcoming rows can offer a join button. */
  showJoinAction?: boolean;
  onJoin?: (appointmentId: string) => void;
}

/**
 * One appointment line. Upcoming and past lists render the exact same shape —
 * previously these were two near-identical 100-line JSX blocks that drifted
 * apart in padding and icon size.
 */
function AppointmentRow({ appointment, showJoinAction = false, onJoin }: AppointmentRowProps) {
  const videoSessionDecision =
    showJoinAction && appointment.isOnline ? getVideoSessionDecision(appointment) : null;

  const canJoin =
    showJoinAction &&
    appointment.isOnline &&
    String(appointment.status || "").toUpperCase() === "CONFIRMED" &&
    getAppointmentViewState(appointment).paymentCompleted &&
    videoSessionDecision?.canJoin;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:p-3.5">
      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {appointment.isOnline ? <Video className="size-4" /> : <Stethoscope className="size-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {appointment.isOnline ? "Video consultation" : "In-person visit"}
              </span>
              <Badge
                className={`h-5 rounded-md px-2 text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(appointment.status)}`}
              >
                {appointment.statusLabel || getAppointmentStatusDisplayName(appointment.status)}
              </Badge>
              <AppointmentExpiryCountdown
                expiresAt={appointment.confirmationExpiresAt}
                windowMinutes={appointment.confirmationWindowMinutes}
                status={appointment.status}
                variant="compact"
              />
            </div>
            <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
              {appointment.doctor}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {appointment.type}
              {appointment.isOnline
                ? " · Online"
                : appointment.location
                  ? ` · ${appointment.location}`
                  : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 md:min-w-[11rem]">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {appointment.date || "Date TBD"}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
              {appointment.time || "Time TBD"}
            </div>
          </div>
        </div>
      </div>

      {canJoin ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-8 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
            onClick={(event) => {
              event.stopPropagation();
              onJoin?.(appointment.id);
            }}
          >
            Join session
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AppointmentRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:p-3.5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="h-4 w-44 rounded-md" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { session } = useAuth();
  const { push } = useRouter();
  const user = session?.user;
  const { t } = useTranslation();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const { data: userProfile } = useUserProfile();
  const [isBookingAppointmentLoading, setIsBookingAppointmentLoading] = useState(false);

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  const clinicId = session?.user?.clinicId || "";
  const patientId = user?.id || "";
  const authoritativeProfileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
    session?.user as Record<string, unknown> | null | undefined,
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
  // Same gate for the dashboard summary — if it's the first load this
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
    // outright — we don't infer EXPIRED locally, since the scheduler
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

  const vitalsValue =
    patientData.vitalStats.bloodPressure !== "N/A" ? patientData.vitalStats.bloodPressure : "--";
  const vitalsHint =
    patientData.vitalStats.lastUpdated !== "N/A"
      ? `Updated ${patientData.vitalStats.lastUpdated}`
      : "No vitals recorded yet";
  const outstandingHint =
    patientData.billingSummary.outstandingAmount > 0
      ? `${currencyFormatter.format(patientData.billingSummary.outstandingAmount)} outstanding`
      : "Nothing outstanding";

  return (
    <PatientPageShell>
      {/* Profile completion banner — only for patients the backend still marks incomplete */}
      {authoritativeProfileComplete !== true && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex flex-col gap-y-0.5">
            <p className="font-semibold">Complete your profile</p>
            <p className="text-xs leading-snug text-amber-800/80 dark:text-amber-300/80">
              Add your name and basic details so your doctors can identify you.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 self-start rounded-lg border-amber-300 bg-white px-3 text-amber-900 hover:bg-amber-100 sm:self-auto dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
            onClick={() => push("/profile-completion")}
          >
            Complete now
          </Button>
        </div>
      )}

      <PatientPageHeader
        variant="welcome"
        showArt
        eyebrow="Patient dashboard"
        title={`${t("dashboard.welcomeBack")}, ${patientData.personalInfo.name}`}
        description={t("dashboard.overview")}
        actionsSlot={
          <>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-lg px-4 text-sm font-medium"
              onClick={() => {
                if (hasInPersonAppointment) {
                  push("/patient/check-in");
                  return;
                }
                openQrGate({
                  bookLabel: "Book video appointment",
                  onBookAppointment: () => push("/patient/appointments"),
                });
              }}
            >
              <QrCode className="size-4" />
              Scan check-in
            </Button>
            <Button
              className="h-10 gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:ring-emerald-500/40"
              disabled={isBookingAppointmentLoading}
              onClick={() => {
                setIsBookingAppointmentLoading(true);
                push("/patient/appointments?openBooking=1");
              }}
            >
              {isBookingAppointmentLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BookOpen className="size-4" />
              )}
              {isBookingAppointmentLoading ? "Opening…" : "Book video appointment"}
            </Button>
          </>
        }
      />

      {/* ─── Key figures ─────────────────────────────────────────────────────
          Each number appears exactly once on this page. The cards below are
          navigation only, so nothing is repeated three times any more. */}
      <DashboardStatStrip
        items={[
          {
            label: "Upcoming appointments",
            value: patientData.upcomingAppointments.length,
            icon: <Calendar className="size-[22px]" />,
            tone: "brand",
            isPending: showSummarySkeleton,
            href: "/patient/appointments",
          },
          {
            label: "Active medicines",
            value: patientData.medications.length,
            icon: <Pill className="size-[22px]" />,
            tone: "crit",
            isPending: showSummarySkeleton,
            href: "/patient/health?tab=medicines",
          },
          {
            label: "Health records",
            value: patientData.recordsCount,
            icon: <FileText className="size-[22px]" />,
            tone: "info",
            isPending: showSummarySkeleton,
            href: "/patient/health?tab=records",
          },
          {
            label: "Payments due",
            value: patientData.billingSummary.openInvoices,
            icon: <CreditCard className="size-[22px]" />,
            tone: "warn",
            isPending: showSummarySkeleton,
            href: "/patient/payments?tab=payments",
          },
        ]}
      />

      {/* Main column + right rail, as in the reference layout. Same sections as
          before, just arranged two-up on large screens. */}
      <div className={`grid grid-cols-1 ${DASHBOARD_SPACING.grid} lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start`}>
        <div className={`flex min-w-0 flex-col ${DASHBOARD_SPACING.page}`}>
        {/* ─── Upcoming appointments ─────────────────────────────────────────── */}
        <DashboardSection
          title="Upcoming appointments"
          icon={<Clock className="size-[15px]" />}
          description="Scheduled, confirmed and in-progress visits."
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg px-3 text-xs font-medium"
              onClick={() => push("/patient/appointments")}
            >
              View all
            </Button>
          }
        >
          {showAppointmentsSkeleton ? (
            <>
              <AppointmentRowSkeleton />
              <AppointmentRowSkeleton />
            </>
          ) : patientData.upcomingAppointments.length > 0 ? (
            <div className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
              {patientData.upcomingAppointments.map((appointment: any) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  showJoinAction
                  onJoin={(appointmentId) => push(buildVideoSessionRoute(appointmentId))}
                />
              ))}
            </div>
          ) : (
            <DashboardEmpty
              icon={<Clock className="size-5" />}
              title="No upcoming or in-progress appointments"
              description="Book a visit to see your next appointment here."
              action={
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  onClick={() => push("/patient/appointments?openBooking=1")}
                >
                  Book a visit
                </Button>
              }
            />
          )}
        </DashboardSection>

        {/* ─── Recent appointments (backend-driven statuses) ─────────────────── */}
        {patientData.recentAppointments.length > 0 ? (
          <DashboardSection
            title="Recent appointments"
            icon={<FileText className="size-[15px]" />}
            description="Completed, cancelled, expired and no-show visits."
            action={
              <Badge
                variant="secondary"
                className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                {patientData.recentAppointments.length} past
              </Badge>
            }
          >
            <div className="flex max-h-[26rem] flex-col gap-3 overflow-y-auto pr-1">
              {patientData.recentAppointments.map((appointment: any) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          </DashboardSection>
        ) : null}
        </div>

        <aside className={`flex flex-col ${DASHBOARD_SPACING.stack}`}>
          <DashboardStatCard
            label="Blood pressure"
            value={vitalsValue}
            hint={vitalsHint}
            icon={<Activity className="size-[22px]" />}
            tone="violet"
            isPending={showSummarySkeleton}
          />
          <DashboardStatCard
            label="Next visit"
            value={patientData.healthOverview.nextAppointment || "None"}
            hint={outstandingHint}
            icon={<Clock className="size-[22px]" />}
            tone="plain"
            isPending={showSummarySkeleton}
          />
          <DashboardQuickAction
            href="/patient/health?tab=medicines"
            title="Medicines"
            description="Prescriptions and refill reminders"
            icon={<Pill className="size-4" />}
          />
          <DashboardQuickAction
            href="/patient/health?tab=records"
            title="Health records"
            description="Visit notes, vitals and history"
            icon={<FileText className="size-4" />}
          />
          <DashboardQuickAction
            href="/patient/appointments?mode=VIDEO"
            title="Video visits"
            description="Join an online consultation"
            icon={<Video className="size-4" />}
          />
          <DashboardQuickAction
            href="/patient/payments?tab=payments"
            title="Payments"
            description="Invoices, receipts and plans"
            icon={<CreditCard className="size-4" />}
          />
        </aside>
      </div>

    </PatientPageShell>
  );
}
