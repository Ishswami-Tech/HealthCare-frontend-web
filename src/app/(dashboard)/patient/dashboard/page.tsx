"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile } from "@/hooks/query/useUsers";
import {
  usePatientDashboardSummary,
  hasDashboardSummaryLoadedForSession,
} from "@/hooks/query/usePatientDashboardSummary";
import { usePatientQueue } from "@/hooks/query/usePatientQueue";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useHealthLibrary } from "@/hooks/query/useHealthLibrary";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useTranslation } from "@/lib/i18n/context";
import { normalizeAppointmentStatus } from "@/lib/utils/appointmentUtils";
import { buildVideoSessionRoute } from "@/lib/utils/video-session-route";
import { usePatientUiStore } from "@/stores/patient-ui.store";
import { resolveAuthoritativeProfileCompleteFromCandidates } from "@/lib/config/profile";
import { resolvePatientDisplayName } from "@/lib/utils/display-name";
import { useLanguage } from "@/lib/i18n/context";
import { PatientHomeView } from "@/components/patient/home/PatientHomeView";
import {
  LIBRARY_FILTERS,
  LIBRARY_STRIP_SIZE,
  asRow,
  findQueueAppointment,
  firstText,
  positiveNumber,
  selectUpcomingAppointments,
  text,
  toHomeVisit,
  toLibraryItem,
  type Row,
} from "@/components/patient/home/homeData";
import type {
  HomeLibraryItem,
  HomeLibraryTab,
  HomeQueue,
  HomeStat,
  HomeVisit,
} from "@/components/patient/home/types";

export default function PatientDashboard() {
  const { session } = useAuth();
  const { push } = useRouter();
  const user = session?.user;
  const { t } = useTranslation();
  const openQrGate = usePatientUiStore((state) => state.openQrGate);
  const { data: userProfile } = useUserProfile();
  const [isBookingAppointmentLoading, setIsBookingAppointmentLoading] = useState(false);
  const [libraryTab, setLibraryTab] = useState<HomeLibraryTab>("articles");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();
  const { language } = useLanguage();

  // A slow clock, so the join window and "Starts in …" stay correct while the page is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const clinicId = session?.user?.clinicId || "";
  const patientId = user?.id || "";
  const authoritativeProfileComplete = resolveAuthoritativeProfileCompleteFromCandidates(
    session?.user as Record<string, unknown> | null | undefined,
    userProfile as Record<string, unknown> | null | undefined
  );

  // The clinic's doctor for the Home banner card (single-doctor practice: the first one).
  const { data: doctorsData } = useDoctors(clinicId, { limit: 1 }, { enabled: !!clinicId });
  const homeDoctor = useMemo(() => {
    const doctor = Array.isArray(doctorsData) ? asRow(doctorsData[0]) : undefined;
    if (!doctor) return null;
    const doctorUser = asRow(doctor.user);
    const name =
      text(doctor.name) ||
      `${firstText(doctor.firstName, doctorUser?.firstName)} ${firstText(doctor.lastName, doctorUser?.lastName)}`.trim();
    const specializations = Array.isArray(doctor.specializations) ? doctor.specializations : [];
    const specialty = firstText(doctor.specialization, specializations[0], doctor.specialty);
    const years = positiveNumber(doctor.experience ?? doctor.yearsOfExperience);
    return {
      name: name || undefined,
      subtitle: [specialty, years ? `${years}+ yrs` : ""].filter(Boolean).join(" · ") || undefined,
    };
  }, [doctorsData]);

  // Composed single-round-trip summary (appointments, prescriptions, EHR, invoices, payments).
  const { data: summary, isPending: isPendingSummary } = usePatientDashboardSummary({ enabled: !!patientId });

  const summaryAppointments = useMemo<Row[]>(
    () => (Array.isArray(summary?.appointments) ? summary.appointments.map(asRow).filter((row): row is Row => !!row) : []),
    [summary?.appointments]
  );
  // If it's the first load this session and the cache is empty, show a skeleton; otherwise
  // keep the previous summary visible during background refetches.
  const hasCachedSummary =
    !!summary &&
    ((Array.isArray(summary.appointments) && summary.appointments.length > 0) ||
      (Array.isArray(summary.prescriptions) && summary.prescriptions.length > 0) ||
      (Array.isArray(summary.invoices) && summary.invoices.length > 0));
  const showSummarySkeleton = isPendingSummary && !hasCachedSummary && !hasDashboardSummaryLoadedForSession();

  // Check-in gate: the QR scan is only for patients who hold an in-person visit.
  const hasInPersonAppointment = useMemo(
    () =>
      summaryAppointments.some((appointment) => {
        const status = normalizeAppointmentStatus(appointment.status);
        const type = String(appointment.type || appointment.appointmentType || "").toUpperCase();
        return (
          type === "IN_PERSON" &&
          status !== "CANCELLED" &&
          status !== "COMPLETED" &&
          status !== "NO_SHOW" &&
          status !== "EXPIRED"
        );
      }),
    [summaryAppointments]
  );

  // Upcoming and in-progress visits, most urgent first, soonest first within a status.
  const upcomingAppointments = useMemo(() => selectUpcomingAppointments(summaryAppointments), [summaryAppointments]);

  const visits = useMemo<HomeVisit[]>(
    () => upcomingAppointments.map((appointment) => toHomeVisit(appointment, now, language)),
    [upcomingAppointments, now, language]
  );

  // Live queue place, for a checked-in in-clinic visit only. A patient reads their own entry
  // (`GET queue/me`); the staff queue list is never requested.
  const queueAppointment = useMemo(() => findQueueAppointment(upcomingAppointments), [upcomingAppointments]);
  const { data: queueEntry, isPending: isQueuePending } = usePatientQueue({ enabled: !!queueAppointment });
  const queue = useMemo<HomeQueue | null>(() => {
    if (!queueAppointment) return null;
    // Only what the API returns: no place is shown until the live entry arrives.
    return {
      position: queueEntry ? queueEntry.position : null,
      patientsAhead: queueEntry ? queueEntry.patientsAhead : null,
      estimatedWaitMinutes: queueEntry ? queueEntry.estimatedWaitTime : null,
      totalInQueue: queueEntry ? queueEntry.totalInQueue : null,
      isLoading: isQueuePending,
    };
  }, [queueAppointment, queueEntry, isQueuePending]);

  // Key figures. A card is shown only when the summary carries that list.
  const stats = useMemo<HomeStat[]>(() => {
    if (!summary) return [];
    const failed = summary.errors ?? {};
    const comprehensive = asRow(summary.comprehensive);
    const list: HomeStat[] = [];
    if (Array.isArray(summary.appointments) && !failed.appointments) {
      list.push({
        key: "appointments",
        label: "Upcoming appointments",
        value: upcomingAppointments.length,
        href: "/patient/appointments",
      });
    }
    if (Array.isArray(summary.prescriptions) && !failed.prescriptions) {
      list.push({
        key: "medicines",
        label: "Active medicines",
        value: summary.prescriptions.length,
        href: "/patient/health/medicines",
      });
    }
    if (Array.isArray(comprehensive?.medicalHistory) && !failed.comprehensive) {
      list.push({
        key: "records",
        label: "Health records",
        value: comprehensive.medicalHistory.length,
        href: "/patient/health/reports",
      });
    }
    if (Array.isArray(summary.invoices) && !failed.invoices) {
      list.push({
        key: "payments",
        label: "Payments due",
        value: summary.invoices.filter((invoice) => text(asRow(invoice)?.status).toUpperCase() === "PENDING").length,
        href: "/patient/payments",
      });
    }
    return list;
  }, [summary, upcomingAppointments.length]);

  // Health Library strip
  const libraryFilters = LIBRARY_FILTERS[libraryTab];
  const { data: libraryData, isFetching: isFetchingLibrary } = useHealthLibrary(libraryFilters, {
    enabled: !!patientId,
  });
  const libraryItems = useMemo<HomeLibraryItem[]>(() => {
    const posts = Array.isArray(libraryData?.items) ? libraryData.items : [];
    // While a new tab loads, React Query keeps the last tab's posts: only show the ones that fit.
    return posts
      .filter(
        (post) =>
          (!libraryFilters.tab || post.tab === libraryFilters.tab) &&
          (!libraryFilters.mediaType || post.mediaType === libraryFilters.mediaType)
      )
      .slice(0, LIBRARY_STRIP_SIZE)
      .map(toLibraryItem);
  }, [libraryData, libraryFilters]);

  const mergedUser = {
    ...(user as unknown as Record<string, unknown>),
    ...(userProfile as unknown as Record<string, unknown> | undefined),
  };
  const firstName =
    String(resolvePatientDisplayName(mergedUser) || "")
      .trim()
      .split(/\s+/)[0] || "there";

  const nextVisit = showSummarySkeleton ? undefined : visits[0];
  const subtitle = !nextVisit
    ? t("dashboard.howAreYouFeeling")
    : nextVisit.kind === "clinic" && nextVisit.clinicStage !== "upcoming"
      ? "Care in every step."
      : nextVisit.kind === "clinic" && nextVisit.isToday && nextVisit.timeLabel
        ? `Your clinic visit is today at ${nextVisit.timeLabel}.`
        : "Your care, your schedule.";

  const openBooking = useCallback(() => {
    setIsBookingAppointmentLoading(true);
    push("/patient/appointments?openBooking=1");
  }, [push]);

  const startCheckIn = useCallback(() => {
    if (hasInPersonAppointment) {
      push("/patient/check-in");
      return;
    }
    openQrGate({
      bookLabel: "Book video appointment",
      // Opens the booking wizard, like the other Book buttons on Home.
      onBookAppointment: () => push("/patient/appointments?openBooking=1"),
    });
  }, [hasInPersonAppointment, openQrGate, push]);

  const visitActions = useMemo(
    () => ({
      onJoin: (appointmentId: string) => push(buildVideoSessionRoute(appointmentId)),
      // The reschedule and payment steps live on the appointments page.
      onReschedule: () => push("/patient/appointments"),
      onPay: () => push("/patient/appointments"),
      onCheckIn: startCheckIn,
    }),
    [push, startCheckIn]
  );

  return (
    <PatientHomeView
      hello={t("dashboard.hello")}
      firstName={firstName}
      subtitle={subtitle}
      doctor={homeDoctor}
      showProfileBanner={authoritativeProfileComplete !== true}
      onCompleteProfile={() => push("/profile-completion")}
      onBook={openBooking}
      isBookingOpening={isBookingAppointmentLoading}
      onScanCheckIn={startCheckIn}
      stats={stats}
      isStatsLoading={showSummarySkeleton}
      visits={visits}
      isVisitsLoading={showSummarySkeleton}
      queue={queue}
      queueVisitId={queueAppointment ? text(queueAppointment.id) : null}
      visitActions={visitActions}
      library={{
        tab: libraryTab,
        onTabChange: setLibraryTab,
        items: libraryItems,
        isLoading: isFetchingLibrary && libraryItems.length === 0,
      }}
    />
  );
}
