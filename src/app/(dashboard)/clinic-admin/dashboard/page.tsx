"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentClinic, useClinicLocations, useClinicStats } from "@/hooks/query/useClinics";
import { useUsersByClinic } from "@/hooks/query/useUsers";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useAssistantDoctorCoverage } from "@/hooks/query/useAppointments";
import { useMedicineDeskQueue } from "@/hooks/query/usePharmacy";
import { useQueue } from "@/hooks/query/useQueue";
import { useRealTimeAppointments, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { cn } from "@/lib/utils";
import {
  getAppointmentDateTimeValue,
  getAppointmentPaymentDisplayState,
  getAppointmentPatientName,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import {
  extractQueueEntries,
  getQueuePositionLabel,
  getQueueStatusLabel,
  normalizeQueueEntry,
  resolveQueueDisplayLabel,
} from "@/lib/queue/queue-adapter";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DashboardMetricCard } from "@/components/dashboard/DashboardMetricCard";
import { formatDateTimeInIST } from "@/lib/utils/date-time";
import {
  Settings,
  Clock,
  AlertCircle,
  CalendarDays,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  IndianRupee,
  RefreshCcw,
  MapPin,
  Users,
} from "lucide-react";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export default function ClinicAdminDashboard() {
  const { push } = useRouter();
  const { data: currentClinic, isPending: isLoadingClinic } = useCurrentClinic();
  const clinicId = currentClinic?.id;

  // Real data fetching
  const { data: clinicStats, isPending: isLoadingStats, refetch: refetchStats } = useClinicStats(clinicId || "");
  const { data: clinicLocationsData, isPending: isLoadingLocations } = useClinicLocations(clinicId || "");
  const { data: clinicStaffData } = useUsersByClinic(clinicId || "");
  const { data: doctorsData } = useDoctors(clinicId || "", undefined, { enabled: !!clinicId });
  const { data: assistantCoverageData = [] } = useAssistantDoctorCoverage();
  const { data: appointmentsData } = useRealTimeAppointments({
    limit: 100,
  });
  useWebSocketQuerySync();
  const { data: liveQueueData, isPending: isLoadingQueue } = useQueue(clinicId || undefined, {
    enabled: !!clinicId,
  });
  const { data: medicineDeskQueue = [] } = useMedicineDeskQueue(clinicId || "", !!clinicId);

  const appointments = useMemo(() => (appointmentsData as any)?.data || [], [appointmentsData]);
  const clinicLocations = useMemo(() => {
    const data = clinicLocationsData as any;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.locations)) return data.locations;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [clinicLocationsData]);

  const staffMembers = useMemo(() => {
    const data = clinicStaffData as any;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [clinicStaffData]);

  const doctorRosters = useMemo(() => {
    const data = doctorsData as any;
    const source = Array.isArray(data) ? data : Array.isArray(data?.doctors) ? data.doctors : Array.isArray(data?.data) ? data.data : [];

    return source.reduce(
      (accumulator: Array<{
        id: string;
        name: string;
        specialization: string;
        isActive: boolean;
        hasSchedule: boolean;
      }>, doctor: any) => {
        const id = String(doctor?.id || "");
        if (!id) {
          return accumulator;
        }

        accumulator.push({
          id,
          name: String(doctor?.name || `${doctor?.firstName || ""} ${doctor?.lastName || ""}`.trim() || "Doctor"),
          specialization: String(doctor?.specialization || doctor?.specializations?.[0] || "General"),
          isActive: doctor?.isActive !== false,
          hasSchedule:
            Boolean(doctor?.schedule) ||
            Boolean(doctor?.weeklySchedule) ||
            Boolean(doctor?.schedule?.schedules) ||
            Boolean(doctor?.schedule?.weeklySchedule),
        });

        return accumulator;
      },
      []
    );
  }, [doctorsData]);

  const queueItems = useMemo(
    () =>
      extractQueueEntries(liveQueueData)
        .filter((item: any) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(String(item.status || "").toUpperCase()))
        .toSorted((a: any, b: any) => a.position - b.position),
    [liveQueueData]
  );

  const queueSections = useMemo(() => {
    const sectionMap = new Map<
      string,
      {
        key: string;
        title: string;
        items: any[];
      }
    >();

    queueItems.forEach((item: any) => {
      const title = String(item.locationName || item.locationId || "Unassigned location").trim();
      const key = title.toLowerCase().replace(/\s+/g, "_");
      const section = sectionMap.get(key);

      if (section) {
        section.items.push(item);
        return;
      }

      sectionMap.set(key, {
        key,
        title,
        items: [item],
      });
    });

    return Array.from(sectionMap.values()).toSorted((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
  }, [queueItems]);

  const [activeQueueLane, setActiveQueueLane] = useState("");
  const resolvedActiveQueueLane = useMemo(() => {
    if (!queueSections.length) {
      return "";
    }

    return queueSections.some((section) => section.key === activeQueueLane)
      ? activeQueueLane
      : queueSections[0]?.key || "";
  }, [activeQueueLane, queueSections]);

  const activeQueueSection = useMemo(() => {
    if (!queueSections.length) {
      return null;
    }

    return queueSections.find((section) => section.key === resolvedActiveQueueLane) || queueSections[0];
  }, [queueSections, resolvedActiveQueueLane]);

  const selectedQueueItems = activeQueueSection?.items || [];
  const highlightedQueueItem = selectedQueueItems[0] || queueItems[0] || null;

  const todayKey = useMemo(
    () => formatDateTimeInIST(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA"),
    []
  );

  const inPersonAppointments = useMemo(
    () =>
      appointments
        .reduce(
          (
            accumulator: Array<{
          raw: any;
          dateTime: Date | null;
          appointmentDate: string;
          patientName: string;
          checkedInAt: Date | null;
          status: string;
          locationId: string;
          locationName: string;
          doctorName: string;
          paymentStatus: string;
          dateLabel: string;
          timeLabel: string;
        }>,
            appointment: any
          ) => {
          if (String(appointment?.type || appointment?.appointmentType || "").toUpperCase() === "VIDEO_CALL") {
            return accumulator;
          }

          const dateTime = getAppointmentDateTimeValue(appointment);
          const appointmentDate = dateTime
            ? formatDateTimeInIST(dateTime, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")
            : String(appointment?.date || appointment?.appointmentDate || "").split("T")[0] || "";

          accumulator.push({
            raw: appointment,
            dateTime,
            appointmentDate,
            patientName: getAppointmentPatientName(appointment),
            checkedInAt: appointment?.checkedInAt ? new Date(appointment.checkedInAt) : null,
            status: String(appointment?.status || "").toUpperCase(),
            locationId: String(appointment?.locationId || appointment?.location?.id || ""),
            locationName: String(appointment?.location?.name || appointment?.locationName || ""),
            doctorName: String(
              appointment?.doctor?.name ||
                appointment?.doctor?.user?.name ||
                appointment?.doctorName ||
                appointment?.assignedDoctor?.name ||
                appointment?.assignedDoctor?.user?.name ||
                appointment?.assignedDoctorName ||
                `${appointment?.doctor?.firstName || appointment?.doctor?.user?.firstName || appointment?.assignedDoctor?.firstName || appointment?.assignedDoctor?.user?.firstName || ""} ${appointment?.doctor?.lastName || appointment?.doctor?.user?.lastName || appointment?.assignedDoctor?.lastName || appointment?.assignedDoctor?.user?.lastName || ""}`.trim() ||
                ""
            ),
            paymentStatus: getAppointmentPaymentDisplayState(appointment).paymentStatus,
            dateLabel: getReceptionistAppointmentDateLabel(appointment),
            timeLabel: getReceptionistAppointmentTimeLabel(appointment),
          });

          return accumulator;
        },
          [] as Array<{
            raw: any;
            dateTime: Date | null;
            appointmentDate: string;
            patientName: string;
            checkedInAt: Date | null;
            status: string;
            locationId: string;
            locationName: string;
            doctorName: string;
            paymentStatus: string;
            dateLabel: string;
            timeLabel: string;
          }>
        )
        .sort((a: any, b: any) => (a.dateTime?.getTime() || 0) - (b.dateTime?.getTime() || 0)),
    [appointments]
  );

  const todayAppointments = useMemo(
    () => inPersonAppointments.filter((appointment: any) => appointment.appointmentDate === todayKey),
    [inPersonAppointments, todayKey]
  );

  const pendingCheckIns = useMemo(
    () =>
      todayAppointments.filter(
        (appointment: any) =>
          !appointment.checkedInAt &&
          !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status)
      ),
    [todayAppointments]
  );

  const checkedInToday = useMemo(
    () => todayAppointments.filter((appointment: any) => Boolean(appointment.checkedInAt)).length,
    [todayAppointments]
  );

  const locationSummaries = useMemo(() => {
    const queueByLocation = queueItems.reduce<Record<string, number>>((accumulator, item) => {
      const locationKey = String(item.locationId || "unassigned");
      accumulator[locationKey] = (accumulator[locationKey] || 0) + 1;
      return accumulator;
    }, {});

    return clinicLocations
      .map((location: any) => {
        const locationId = String(location?.id || "");
        const locationAppointments = todayAppointments.filter((appointment: any) => appointment.locationId === locationId);
        return {
          id: locationId,
          name: String(location?.name || "Location"),
          isActive: location?.isActive !== false,
          checkedIn: locationAppointments.filter((appointment: any) => Boolean(appointment.checkedInAt)).length,
          pending: locationAppointments.filter(
            (appointment: any) =>
              !appointment.checkedInAt &&
              !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appointment.status)
          ).length,
          queueCount: queueByLocation[locationId] || 0,
        };
      })
      .sort((a: any, b: any) => b.queueCount - a.queueCount || Number(a.isActive) - Number(b.isActive));
  }, [clinicLocations, queueItems, todayAppointments]);

  const activeLocationCount = locationSummaries.filter((location: any) => location.isActive).length;
  const inactiveLocationCount = locationSummaries.filter((location: any) => !location.isActive).length;

  const clinicSettingsSnapshot = useMemo(() => {
    const base = isRecord(currentClinic) && isRecord(currentClinic.settings) ? currentClinic.settings : {};
    const appointmentSettings = isRecord(base.appointmentSettings) ? base.appointmentSettings : {};
    const notificationSettings = isRecord(base.notificationSettings) ? base.notificationSettings : {};
    const notifications = isRecord(base.notifications) ? base.notifications : {};
    const paymentSettings = isRecord(base.paymentSettings) ? base.paymentSettings : {};
    const opdControls = isRecord(appointmentSettings.opdControls)
      ? appointmentSettings.opdControls
      : isRecord(base.opdControls)
      ? base.opdControls
      : {};

    const paymentMethods = Array.isArray((paymentSettings as any).paymentMethods)
      ? (paymentSettings as any).paymentMethods.join(", ")
      : "Cash, Card, UPI";

    return {
      appointmentDuration: Number(appointmentSettings.appointmentDuration || 0) || 30,
      maxAdvanceBooking: Number(appointmentSettings.maxAdvanceBooking || 0) || 30,
      minAdvanceBooking: Number(appointmentSettings.minAdvanceBooking || 0) || 2,
      cancellationWindow: Number(appointmentSettings.cancellationWindow || 0) || 24,
      noShowWindowMinutes: Number(appointmentSettings.noShowWindowMinutes || 0) || 15,
      walkInAllowed: appointmentSettings.walkInAllowed !== false,
      generalConsultationEnabled: opdControls.generalConsultationEnabled !== false,
      videoConsultationEnabled: opdControls.videoConsultationEnabled !== false,
      clinicPaused: Boolean(opdControls.isOpdPaused || opdControls.clinicPaused),
      emergencyOnly: Boolean(opdControls.emergencyOnly),
      notificationsEnabled:
        Boolean(notifications.email ?? notificationSettings.emailNotifications) ||
        Boolean(notifications.sms ?? notificationSettings.smsNotifications) ||
        Boolean(notifications.push ?? notificationSettings.pushNotifications),
      paymentMethods,
      autoBilling: Boolean(paymentSettings.autoBilling),
      timezone: String(currentClinic?.timezone || "Asia/Kolkata"),
    };
  }, [currentClinic]);

  const doctorRosterSummary = useMemo(() => {
    const total = doctorRosters.length;
    const active = doctorRosters.filter((doctor: any) => doctor.isActive).length;
    const scheduled = doctorRosters.filter((doctor: any) => doctor.hasSchedule).length;
    const specialties = new Set<string>();
    for (const doctor of doctorRosters) {
      const specialization = doctor?.specialization;
      if (specialization) {
        specialties.add(specialization);
      }
    }
    return { total, active, scheduled, specialties };
  }, [doctorRosters]);

  const assistantCoverageSummary = useMemo(() => {
    const data = Array.isArray(assistantCoverageData) ? assistantCoverageData : [];
    const active = data.filter((entry: any) => entry?.isActive !== false).length;
    const assigned = data.filter((entry: any) => Array.isArray(entry?.primaryDoctorIds) && entry.primaryDoctorIds.length > 0).length;
    return { total: data.length, active, assigned };
  }, [assistantCoverageData]);

  const nextCheckIns = useMemo(
    () =>
      pendingCheckIns
        .slice(0, 5)
        .map((appointment: any) => ({
          id: appointment.raw.id,
          patientName: appointment.patientName,
          doctorName: appointment.doctorName || "Assigned doctor",
          locationName: appointment.locationName || "Main clinic",
          timeLabel: appointment.timeLabel,
          dateLabel: appointment.dateLabel,
          paymentStatus: appointment.paymentStatus,
        })),
    [pendingCheckIns]
  );

  const staffSummary = useMemo(() => {
    const total = staffMembers.length;
    const active = staffMembers.filter((member: any) => member?.isActive !== false).length;
    const doctors = staffMembers.filter((member: any) => String(member?.role || "").toUpperCase() === "DOCTOR").length;
    const reception = staffMembers.filter((member: any) => String(member?.role || "").toUpperCase() === "RECEPTIONIST").length;
    const support = Math.max(total - doctors - reception, 0);
    return { total, active, doctors, reception, support };
  }, [staffMembers]);

  const stats = useMemo(() => {
    if (!clinicStats) return null;
    return {
      totalAppointments: clinicStats.totalAppointments || 0,
      todayAppointments: clinicStats.todayAppointments || 0,
      totalStaff: clinicStats.totalUsers || 0,
      activePatients: clinicStats.totalPatients || 0,
      revenue: clinicStats.revenue || 0,
      waitTime: clinicStats.avgWaitTime || 0,
      completionRate: clinicStats.completionRate || 0,
    };
  }, [clinicStats]);

  const recentEvents = useMemo(() => {
    return inPersonAppointments
      .toSorted((a: any, b: any) => (b.checkedInAt?.getTime() || b.dateTime?.getTime() || 0) - (a.checkedInAt?.getTime() || a.dateTime?.getTime() || 0))
      .slice(0, 3)
      .map((apt: any) => ({
      id: apt.id,
      type: apt.checkedInAt ? "check-in" : "appointment",
      message: apt.checkedInAt
        ? `${apt.patientName} checked in${apt.locationName ? ` at ${apt.locationName}` : ""}`
        : `${apt.patientName} scheduled${apt.locationName ? ` for ${apt.locationName}` : ""}`,
      time: formatDateTimeInIST(apt.checkedInAt || apt.dateTime || new Date(), { hour: "2-digit", minute: "2-digit" }, "en-IN"),
      date: formatDateTimeInIST(apt.checkedInAt || apt.dateTime || new Date(), { day: "2-digit", month: "short", year: "numeric" }, "en-IN"),
    }));
  }, [inPersonAppointments]);

  const medicineDeskItems = useMemo(
    () =>
      (Array.isArray(medicineDeskQueue) ? medicineDeskQueue : []).reduce<any[]>((acc, item: any) => {
        if (!item?.id || acc.length >= 8) {
          return acc;
        }

        const entry = normalizeQueueEntry(item);
        acc.push({
          id: entry.entryId,
          patientName: entry.patientName || "Unknown Patient",
          paymentStatus: String(entry.paymentStatus || "PENDING").toUpperCase(),
          queuePosition: entry.position > 0 ? entry.position : null,
          pendingAmount: Number(item.pendingAmount || 0),
          readyForHandover: Boolean(entry.readyForHandover),
        });
        return acc;
      }, []),
    [medicineDeskQueue]
  );

  const liveAlerts = useMemo(() => {
    const alerts: Array<{ title: string; description: string; tone: "amber" | "blue" }> = [];

    if ((stats?.waitTime || 0) > 30) {
      alerts.push({
        title: "Wait Time Threshold Exceeded",
        description: `Average clinic wait time is ${stats?.waitTime || 0} minutes`,
        tone: "amber",
      });
    }

    const unpaidMedicineCount = medicineDeskItems.filter(
      (item: any) => !item.readyForHandover && item.paymentStatus !== "PAID"
    ).length;
    if (unpaidMedicineCount > 0) {
      alerts.push({
        title: "Medicine Desk Payments Pending",
        description: `${unpaidMedicineCount} prescription handover${unpaidMedicineCount === 1 ? "" : "s"} awaiting payment`,
        tone: "blue",
      });
    }

    return alerts;
  }, [medicineDeskItems, stats?.waitTime]);

  const adminQuickLinks = [
    { href: "/clinic-admin/staff", label: "Staff", icon: UserPlus },
    { href: "/clinic-admin/locations", label: "Locations", icon: MapPin },
    { href: "/clinic-admin/schedule", label: "Schedule", icon: CalendarDays },
    { href: "/clinic-admin/settings", label: "Settings", icon: Settings },
    { href: "/queue", label: "Queue", icon: Activity },
  ];

  if (isLoadingClinic || isLoadingStats || isLoadingLocations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="size-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse text-lg">Waking up the clinic dashboard…</p>
      </div>
    );
  }

  return (
    <DashboardPageShell className="mx-auto flex max-w-7xl flex-col gap-y-4 px-4 pb-6 pt-0 sm:gap-y-5 sm:px-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Clinic Admin"
        title="Operations Dashboard"
        description="Track clinic workload, staff access, live queue movement, and medicine-desk readiness from one practical console."
        meta={`${currentClinic?.name || "Clinic"}€¢ Live operational status`}
        actionsSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchStats()}
              className="h-9 items-center gap-2 border border-border bg-card px-4 font-semibold text-foreground shadow-sm hover:bg-muted"
            >
              <RefreshCcw className="size-4" />
              Sync
            </Button>
            <Button asChild variant="outline" className="h-9 items-center gap-2 border-border bg-card px-4 font-semibold text-foreground shadow-sm hover:bg-muted">
              <Link href="/clinic-admin/staff" prefetch={false}>
                <UserPlus className="size-4" />
                Staff
              </Link>
            </Button>
            <Button asChild className="h-9 items-center gap-2 bg-emerald-600 px-4 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95">
              <Link href="/clinic-admin/schedule" prefetch={false}>
                <CalendarDays className="size-4" />
                Schedule
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-9 items-center gap-2 border-border bg-card px-4 font-semibold text-foreground shadow-sm hover:bg-muted">
              <Link href="/queue" prefetch={false}>
                <Activity className="size-4" />
                Queue
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="size-5 text-primary" />
              Workflow Shortcuts
            </CardTitle>
            <CardDescription className="text-sm">
              Quick access to common clinic-admin tasks.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {adminQuickLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-2 border-border bg-muted/30 px-3 text-xs font-semibold text-foreground hover:bg-muted"
              >
                <Link href={link.href} prefetch={false}>
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Today"
            value={stats?.todayAppointments || 0}
            subtext="Appointments scheduled today"
            accentClassName="border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10"
            valueClassName="mt-1 text-2xl font-semibold text-blue-900 dark:text-blue-100"
            labelClassName="text-blue-700 dark:text-blue-300"
            compact
          />
          <DashboardMetricCard
            label="Live queue"
            value={queueItems.length}
            subtext="Patients currently moving through the clinic"
            accentClassName="border-slate-200 bg-slate-50 dark:border-slate-500/20 dark:bg-slate-500/10"
            valueClassName="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100"
            labelClassName="text-slate-700 dark:text-slate-300"
            compact
          />
          <DashboardMetricCard
            label="Staff"
            value={stats?.totalStaff || 0}
            subtext="Active users linked to this clinic"
            accentClassName="border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
            valueClassName="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-100"
            labelClassName="text-emerald-700 dark:text-emerald-300"
            compact
          />
          <DashboardMetricCard
            label="Checked in"
            value={checkedInToday}
            subtext="Patients already moved into the flow"
            accentClassName="border-indigo-200 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10"
            valueClassName="mt-1 text-2xl font-semibold text-indigo-900 dark:text-indigo-100"
            labelClassName="text-indigo-700 dark:text-indigo-300"
            compact
          />
        </CardContent>
      </Card>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { 
            label: "Appointments Today", 
            value: stats?.todayAppointments || 0, 
            sub: `${stats?.totalAppointments || 0} this month`, 
            icon: CalendarDays, 
            color: "text-blue-600", 
            bg: "bg-blue-500/10",
            trend: `${stats?.totalAppointments || 0} month`,
            isUp: true
          },
          { 
            label: "Clinic Revenue", 
            value: `INR ${(stats?.revenue || 0).toLocaleString()}`, 
            sub: "Gross billing", 
            icon: IndianRupee, 
            color: "text-purple-600", 
            bg: "bg-purple-500/10",
            trend: "Live billing",
            isUp: true
          },
          { 
            label: "Active Patients", 
            value: stats?.activePatients || 0, 
            sub: "Verified records", 
            icon: UserPlus, 
            color: "text-emerald-600", 
            bg: "bg-emerald-500/10",
            trend: "Verified",
            isUp: true
          },
          { 
            label: "Queue Efficiency", 
            value: `${stats?.waitTime || 0}m`, 
            sub: "Average wait time", 
            icon: Clock, 
            color: "text-orange-600", 
            bg: "bg-orange-500/10",
            trend: `${queueItems.length} live`,
            isUp: (stats?.waitTime || 0) <= 30
          },
          {
            label: "Medicine Desk",
            value: medicineDeskItems.length,
            sub: "Active handovers",
            icon: Activity,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
            trend: `${medicineDeskItems.filter((item: any) => item.paymentStatus !== "PAID").length} unpaid`,
            isUp: medicineDeskItems.filter((item: any) => item.paymentStatus === "PAID").length > 0
          }
        ].map((item) => (
          <Card key={item.label} className="overflow-hidden border border-border bg-card shadow-sm">
            <div className={cn("h-1 w-full opacity-70", item.color.replace('text', 'bg'))} />
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="shrink-0 rounded-xl border border-border bg-background p-2.5">
                  <item.icon className={cn("size-5", item.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-semibold uppercase",
                  item.isUp ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                )}>
                  {item.isUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {item.trend}
                </div>
              </div>
              <div className="gap-y-1">
                <p className="text-2xl font-semibold tracking-tight">{item.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <span className="text-[10px] font-medium text-neutral-400">{item.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="gap-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Activity className="size-5 text-primary" />
              Clinic Admin Snapshot
            </CardTitle>
            <CardDescription className="text-sm">
              High-value summaries from staff, locations, schedule, and settings.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">One glance overview</span>
            <span className="rounded-full border border-border bg-background px-2.5 py-1">Direct page links</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm dark:border-indigo-900/70 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">Staff Directory</p>
                <p className="mt-1 text-2xl font-semibold">{staffSummary.active}/{staffSummary.total}</p>
              </div>
              <Users className="size-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">Doctors {staffSummary.doctors}</Badge>
              <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">Reception {staffSummary.reception}</Badge>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs font-semibold text-indigo-700 hover:no-underline">
              <Link href="/clinic-admin/staff" prefetch={false}>Open staff page</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Locations</p>
                <p className="mt-1 text-2xl font-semibold">{activeLocationCount}/{locationSummaries.length || clinicLocations.length || 0}</p>
              </div>
              <MapPin className="size-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">Queued {queueItems.length}</Badge>
              <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">Paused {inactiveLocationCount}</Badge>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs font-semibold text-emerald-700 hover:no-underline">
              <Link href="/clinic-admin/locations" prefetch={false}>Open locations page</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Schedule</p>
                <p className="mt-1 text-2xl font-semibold">{doctorRosterSummary.scheduled}/{doctorRosterSummary.total}</p>
              </div>
              <CalendarDays className="size-5 text-sky-600 dark:text-sky-300" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-sky-200 bg-white text-sky-700">Doctors {doctorRosterSummary.total}</Badge>
              <Badge variant="outline" className="border-sky-200 bg-white text-sky-700">Specialties {doctorRosterSummary.specialties}</Badge>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs font-semibold text-sky-700 hover:no-underline">
              <Link href="/clinic-admin/schedule" prefetch={false}>Open schedule page</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Settings</p>
                <p className="mt-1 text-2xl font-semibold">{clinicSettingsSnapshot.appointmentDuration}m</p>
              </div>
              <Settings className="size-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
                {clinicSettingsSnapshot.walkInAllowed ? "Walk-ins on" : "Walk-ins off"}
              </Badge>
              <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
                {clinicSettingsSnapshot.clinicPaused ? "Paused" : "Open"}
              </Badge>
            </div>
            <Button asChild variant="link" className="mt-2 h-auto p-0 text-xs font-semibold text-violet-700 hover:no-underline">
              <Link href="/clinic-admin/settings" prefetch={false}>Open settings page</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-base font-semibold">Booking Policy</CardTitle>
            <CardDescription className="text-xs">Clinic booking and visit timing rules.</CardDescription>
          </CardHeader>
          <CardContent className="gap-y-3 p-4">
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Duration</div>
                <div className="mt-1 text-lg font-semibold">{clinicSettingsSnapshot.appointmentDuration}m</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Advance</div>
                <div className="mt-1 text-lg font-semibold">{clinicSettingsSnapshot.minAdvanceBooking}h / {clinicSettingsSnapshot.maxAdvanceBooking}d</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cancel</div>
                <div className="mt-1 text-lg font-semibold">{clinicSettingsSnapshot.cancellationWindow}h</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">No-show</div>
                <div className="mt-1 text-lg font-semibold">{clinicSettingsSnapshot.noShowWindowMinutes}m</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-border bg-background">{clinicSettingsSnapshot.walkInAllowed ? "Walk-ins allowed" : "Walk-ins blocked"}</Badge>
              <Badge variant="outline" className="border-border bg-background">{clinicSettingsSnapshot.timezone}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-base font-semibold">Consultation Modes</CardTitle>
            <CardDescription className="text-xs">Current OPD and consultation switches.</CardDescription>
          </CardHeader>
          <CardContent className="gap-y-3 p-4">
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className={cn("border", clinicSettingsSnapshot.generalConsultationEnabled ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                General {clinicSettingsSnapshot.generalConsultationEnabled ? "On" : "Off"}
              </Badge>
              <Badge variant="outline" className={cn("border", clinicSettingsSnapshot.videoConsultationEnabled ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                Video {clinicSettingsSnapshot.videoConsultationEnabled ? "On" : "Off"}
              </Badge>
              <Badge variant="outline" className={cn("border", clinicSettingsSnapshot.emergencyOnly ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border bg-background text-muted-foreground")}>
                {clinicSettingsSnapshot.emergencyOnly ? "Emergency only" : "Standard mode"}
              </Badge>
              <Badge variant="outline" className={cn("border", clinicSettingsSnapshot.clinicPaused ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                {clinicSettingsSnapshot.clinicPaused ? "Paused" : "Open"}
              </Badge>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Notifications {clinicSettingsSnapshot.notificationsEnabled ? "enabled" : "disabled"}· Auto billing {clinicSettingsSnapshot.autoBilling ? "on" : "off"}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-border bg-card shadow-sm">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-base font-semibold">Doctor Coverage</CardTitle>
            <CardDescription className="text-xs">Schedule coverage and assistant mappings.</CardDescription>
          </CardHeader>
          <CardContent className="gap-y-3 p-4">
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Doctors</div>
                <div className="mt-1 text-lg font-semibold">{doctorRosterSummary.active}/{doctorRosterSummary.total}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Scheduled</div>
                <div className="mt-1 text-lg font-semibold">{doctorRosterSummary.scheduled}</div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Assistants</div>
                <div className="mt-1 text-lg font-semibold">{assistantCoverageSummary.active}/{assistantCoverageSummary.total}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <Badge variant="outline" className="border-border bg-background">Specialties {doctorRosterSummary.specialties}</Badge>
              <Badge variant="outline" className="border-border bg-background">Mapped {assistantCoverageSummary.assigned}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 text-foreground lg:grid-cols-12">
        <div className="gap-y-6 lg:col-span-8">
        <Card className="overflow-hidden border-l-2 border-l-emerald-400 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 pb-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="gap-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Clock className="size-4" />
                </div>
                Queue
              </CardTitle>
              <CardDescription className="text-sm">Real-time patient flow across all departments</CardDescription>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="rounded-full border border-border bg-background px-2.5 py-1">Live queue snapshot</span>
                <span className="rounded-full border border-border bg-background px-2.5 py-1">Location lanes</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                  Live Monitoring
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                onClick={() => push("/queue")}
              >
                View Queue Workspace
              </Button>
            </div>
          </CardHeader>
          <CardContent className="gap-y-3 p-3 sm:p-4">
            {isLoadingQueue ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : queueItems.length > 0 ? (
        <div className="flex flex-col gap-y-3">
                {highlightedQueueItem ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                          Next patient
                        </div>
                        <div className="mt-1 truncate text-lg font-semibold text-foreground">
                          {highlightedQueueItem.patientName || "Walk-in Patient"}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                            {highlightedQueueItem.locationName || highlightedQueueItem.locationId || "Main clinic"}
                          </Badge>
                          <span>{highlightedQueueItem.doctorName || "Assigned doctor pending"}</span>
                          <span className="text-muted-foreground/60">Â·</span>
                          <span>Queue #{highlightedQueueItem.position || 0}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 px-2.5 py-1 text-xs font-semibold",
                          String(highlightedQueueItem.status || "").toUpperCase() === "IN_PROGRESS"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : String(highlightedQueueItem.status || "").toUpperCase() === "CONFIRMED"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-border bg-background text-muted-foreground"
                        )}
                      >
                        {getQueueStatusLabel(highlightedQueueItem)}
                      </Badge>
                    </div>
                  </div>
                ) : null}

                {queueSections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {queueSections.map((section) => (
                      <Badge
                        key={section.key}
                        asChild
                        variant="outline"
                        className={`cursor-pointer gap-2 px-3 py-2 text-sm font-semibold shadow-sm transition ${
                          activeQueueSection?.key === section.key
                            ? "border-emerald-500 bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300"
                            : "border-border bg-background text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <button type="button" onClick={() => setActiveQueueLane(section.key)}>
                          <span className="truncate font-semibold">{section.title}</span>
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-current">
                            {section.items.length}
                          </span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                      Selected lane
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-foreground">
                      {activeQueueSection?.title || "Live queue"}
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {selectedQueueItems.length}
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[68px] text-xs">Token</TableHead>
                        <TableHead className="text-xs">Patient</TableHead>
                        <TableHead className="text-xs">Doctor</TableHead>
                        <TableHead className="text-xs">Location</TableHead>
                        <TableHead className="text-xs">Wait</TableHead>
                        <TableHead className="text-right text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedQueueItems.slice(0, 5).map((item: any, idx: number) => (
                        <TableRow key={item.entryId || item.appointmentId || idx} className="border-border/60 transition-colors hover:bg-muted/20">
                          <TableCell className="py-2 font-semibold text-primary">
                            <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                              {item.tokenNumber || item.position || idx + 1}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold">{item.patientName || "Walk-in Patient"}</div>
                              <div className="mt-1 text-[11px] text-muted-foreground">{resolveQueueDisplayLabel(item)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">
                            <div className="truncate">{item.doctorName || (item.assignedDoctorId ? "Assigned Doctor" : "Unassigned Doctor")}</div>
                            {item.primaryDoctorId &&
                            String(item.primaryDoctorId) !== String(item.assignedDoctorId || "") ? (
                              <Badge variant="outline" className="mt-1 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-semibold uppercase text-amber-700">
                                Delegated
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">
                            <div className="truncate">{item.locationName || item.locationId || "Main clinic"}</div>
                          </TableCell>
                          <TableCell className="py-2 text-sm text-muted-foreground">
                            <div>{item.appointmentTime || item.checkedInAt || item.startedAt || "Now"}</div>
                            <div className="text-[11px]">{typeof item.waitTime === "number" ? `${item.waitTime}m wait` : item.waitTime || "Live queue"}</div>
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <Badge
                              className={cn(
                                "rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
                                String(item.status || "").toUpperCase() === "IN_PROGRESS"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : String(item.status || "").toUpperCase() === "CONFIRMED"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-border bg-muted text-muted-foreground"
                              )}
                            >
                              {getQueueStatusLabel(item)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
                <div className="gap-y-4">
                    <Empty>
                      <EmptyContent>
                        <EmptyMedia>
                          <Users className="size-5" />
                        </EmptyMedia>
                        <EmptyTitle>No active queue right now</EmptyTitle>
                        <EmptyDescription>
                          Use the runway below to see the next patients who should be checked in.
                        </EmptyDescription>
                    </EmptyContent>
                  </Empty>

                  <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs">Patient</TableHead>
                        <TableHead className="text-xs">Doctor</TableHead>
                        <TableHead className="text-xs">Location</TableHead>
                        <TableHead className="text-xs">Check-in</TableHead>
                        <TableHead className="text-right text-xs">State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nextCheckIns.length > 0 ? (
                        nextCheckIns.map((item: any) => (
                          <TableRow key={item.id} className="border-border/60 transition-colors hover:bg-muted/20">
                            <TableCell className="py-2 font-semibold">{item.patientName}</TableCell>
                            <TableCell className="py-2 text-sm text-muted-foreground">{item.doctorName}</TableCell>
                            <TableCell className="py-2 text-sm text-muted-foreground">{item.locationName}</TableCell>
                            <TableCell className="py-2 text-sm text-muted-foreground">
                              <div>{item.dateLabel}</div>
                              <div className="text-xs">{item.timeLabel}</div>
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-semibold uppercase text-amber-700">
                                {item.paymentStatus === "PAID" ? "Ready" : "Awaiting payment"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                            No upcoming check-ins queued.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div className="mt-3 flex justify-center border-t pt-3">
              <Button asChild variant="link" className="text-xs font-semibold uppercase text-primary hover:no-underline">
                <Link href="/clinic-admin/schedule" prefetch={false}>View Staff Schedule</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

          <Card className="overflow-hidden border-l-2 border-l-amber-400 shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border bg-muted/40 px-4 pb-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-y-1">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Activity className="size-4" />
                  </div>
                  Medicine Desk Queue
                </CardTitle>
                <CardDescription className="text-sm">
                  Payment-gated prescription handovers across the clinic
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-700">
                Live medication flow
              </Badge>
            </CardHeader>
          <CardContent className="flex flex-col gap-y-3 p-3 sm:p-4">
              {medicineDeskItems.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>Patient</TableHead>
                        <TableHead>Queue</TableHead>
                        <TableHead className="text-right">Payment</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicineDeskItems.map((item: any) => (
                        <TableRow key={item.id} className="border-border/60 transition-colors hover:bg-muted/20">
                          <TableCell className="font-semibold">{item.patientName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.queuePosition ? getQueuePositionLabel({ position: item.queuePosition }) : "Awaiting medicine handover"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              className={
                                item.paymentStatus === "PAID"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-amber-500 text-white"
                              }
                            >
                              {item.paymentStatus === "PAID" ? "Payment verified" : "Payment pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium text-muted-foreground">
                            {item.pendingAmount > 0 ? `INR ${item.pendingAmount.toFixed(2)}` : "â€”"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Empty>
                  <EmptyContent>
                    <EmptyMedia>
                      <Activity className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>No active medicine desk queue right now.</EmptyTitle>
                    <EmptyDescription>
                      Prescription handovers will appear here once billing is complete and pharmacy work is ready.
                    </EmptyDescription>
                  </EmptyContent>
                </Empty>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="gap-y-4 text-foreground lg:col-span-4">
          <Card className="overflow-hidden border border-border bg-card shadow-sm">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="size-4 text-primary" />
                Location Health
              </CardTitle>
              <CardDescription className="text-xs">
                Active branches and check-in pressure.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-y-3 p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active</p>
                  <p className="mt-1 text-xl font-semibold">{activeLocationCount}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Paused</p>
                  <p className="mt-1 text-xl font-semibold">{inactiveLocationCount}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="whitespace-nowrap text-xs">Location</TableHead>
                      <TableHead className="whitespace-nowrap text-right text-xs">Queue</TableHead>
                      <TableHead className="whitespace-nowrap text-right text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locationSummaries.length > 0 ? (
                      locationSummaries.slice(0, 4).map((location: any) => (
                        <TableRow key={location.id}>
                          <TableCell className="truncate pr-2 text-sm font-medium">{location.name}</TableCell>
                          <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">{location.queueCount}</TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <Badge
                              variant="outline"
                              className={cn(
                                "border text-[10px] font-semibold uppercase",
                                location.isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                              )}
                            >
                              {location.isActive ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-5 text-center text-sm text-muted-foreground">
                          No clinic locations configured yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border bg-card shadow-sm">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-4 text-primary" />
                Staff Snapshot
              </CardTitle>
              <CardDescription className="text-xs">
                Workforce ready to receive patients today.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-y-3 p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
                  <p className="mt-1 text-xl font-semibold">{staffSummary.total}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Active</p>
                  <p className="mt-1 text-xl font-semibold">{staffSummary.active}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs">Role</TableHead>
                      <TableHead className="text-right text-xs">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="py-2 text-sm">Doctors</TableCell>
                      <TableCell className="py-2 text-right text-sm font-semibold">{staffSummary.doctors}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-2 text-sm">Reception</TableCell>
                      <TableCell className="py-2 text-right text-sm font-semibold">{staffSummary.reception}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="py-2 text-sm">Support</TableCell>
                      <TableCell className="py-2 text-right text-sm font-semibold">{staffSummary.support}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card shadow-sm">
            <CardHeader className="border-b px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="size-4 text-primary" />
                Recent Movement
              </CardTitle>
              <CardDescription className="text-xs">
                Latest appointment and check-in activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="gap-y-2">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event: any) => (
                    <div key={`${event.date}-${event.time}-${event.message}`} className="rounded-lg border border-border bg-muted/10 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{event.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{event.date}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 border-border bg-background text-[10px] font-semibold uppercase">
                          {event.time}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
                    No recent activity detected.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPageShell>
  );
}



