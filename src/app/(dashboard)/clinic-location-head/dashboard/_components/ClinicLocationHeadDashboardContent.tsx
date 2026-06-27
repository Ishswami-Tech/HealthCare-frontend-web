"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointments } from "@/hooks/query/useAppointments";
import { useQueue, useQueueStats } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatISODateInIST, getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import type { RecordOfUnknown } from "./clinic-location-head-dashboard.types";
import { ClinicLocationHeadDashboardHeader } from "./ClinicLocationHeadDashboardHeader";
import { ClinicLocationHeadDashboardMetrics } from "./ClinicLocationHeadDashboardMetrics";
import { ClinicLocationHeadDashboardRecentAppointmentsCard } from "./ClinicLocationHeadDashboardRecentAppointmentsCard";
import { ClinicLocationHeadDashboardQuickActionsCard } from "./ClinicLocationHeadDashboardQuickActionsCard";
import { ClinicLocationHeadDashboardDaySummaryCard } from "./ClinicLocationHeadDashboardDaySummaryCard";
import { ClinicLocationHeadDashboardLocationsCard } from "./ClinicLocationHeadDashboardLocationsCard";

export default function ClinicLocationHeadDashboardContent() {
  const { push } = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const clinicId = user?.clinicId;

  useWebSocketQuerySync();

  const today = useMemo(() => formatISODateInIST(new Date()), []);
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return formatISODateInIST(date);
  }, []);
  const futureEndDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 365);
    return formatISODateInIST(date);
  }, []);

  const { data: appointmentsResult, isPending: appointmentsPending } = useAppointments(
    clinicId ? { clinicId, startDate: historyStartDate, ...(futureEndDate ? { endDate: futureEndDate } : {}) } : undefined
  );

  const { data: queueData, isPending: queuePending } = useQueue(clinicId ?? undefined, {
    ...(today ? { date: today } : {}),
    enabled: !!clinicId,
  });

  const { data: queueStatsRaw } = useQueueStats(clinicId ?? "");

  const appointments = useMemo(() => {
    const raw = appointmentsResult?.appointments ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [appointmentsResult]);

  const todayAppointments = useMemo(
    () =>
      appointments.filter((appointment: RecordOfUnknown) => {
        const dateTime = getAppointmentDateTimeValue(appointment);
        const aptDate =
          (dateTime ? formatISODateInIST(dateTime) : "") ||
          formatISODateInIST(String(appointment.date || appointment.appointmentDate || ""));
        return aptDate === today;
      }),
    [appointments, today]
  );

  const queueEntries = useMemo(() => {
    const raw = Array.isArray(queueData)
      ? queueData
      : (queueData as { entries?: unknown[] })?.entries ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [queueData]);

  const queueStats = queueStatsRaw as Record<string, unknown> | undefined;

  const stats = useMemo(() => {
    const totalToday = todayAppointments.length;
    const completed = todayAppointments.filter(
      (a: RecordOfUnknown) => String(a.status ?? "").toUpperCase() === "COMPLETED"
    ).length;
    const waiting = queueEntries.filter(
      (e: RecordOfUnknown) => String(e.status ?? "").toUpperCase() === "WAITING"
    ).length;
    const inProgress = todayAppointments.filter(
      (a: RecordOfUnknown) => String(a.status ?? "").toUpperCase() === "IN_PROGRESS"
    ).length;

    return { totalToday, completed, waiting, inProgress };
  }, [todayAppointments, queueEntries]);

  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((a: RecordOfUnknown) => {
          const s = String(a.status ?? "").toUpperCase();
          return ["SCHEDULED", "CONFIRMED", "WAITING", "IN_PROGRESS"].includes(s);
        })
        .sort((left: RecordOfUnknown, right: RecordOfUnknown) => {
          const leftTime = new Date(
            String(left.date || left.appointmentDate || left.createdAt || left.updatedAt || 0)
          ).getTime();
          const rightTime = new Date(
            String(right.date || right.appointmentDate || right.createdAt || right.updatedAt || 0)
          ).getTime();
          return rightTime - leftTime;
        })
        .slice(0, 5),
    [appointments]
  );

  const isLoading = appointmentsPending && queuePending && appointments.length === 0;

  return (
    <div className="gap-y-4 p-4 sm:gap-y-5 sm:p-6">
      <ClinicLocationHeadDashboardHeader
        clinicName={user?.name}
        today={today}
        onCheckIn={() => push("/clinic-location-head/check-in")}
        onLiveQueue={() => push("/queue")}
      />

      <ClinicLocationHeadDashboardMetrics
        stats={stats}
        queueWaiting={queueStats ? Number(queueStats.waiting ?? stats.waiting) : stats.waiting}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ClinicLocationHeadDashboardRecentAppointmentsCard
          appointments={upcomingAppointments}
          onSeeAll={() => push("/clinic-location-head/appointments")}
        />

        <div className="gap-y-6">
          <ClinicLocationHeadDashboardQuickActionsCard
            onLocations={() => push("/clinic-location-head/locations")}
            onQueue={() => push("/queue")}
            onAppointments={() => push("/clinic-location-head/appointments")}
            onCheckIn={() => push("/clinic-location-head/check-in")}
            onBilling={() => push("/billing")}
          />
          <ClinicLocationHeadDashboardDaySummaryCard stats={stats} />
          <ClinicLocationHeadDashboardLocationsCard onManageLocations={() => push("/clinic-location-head/locations")} />
        </div>
      </div>
    </div>
  );
}
