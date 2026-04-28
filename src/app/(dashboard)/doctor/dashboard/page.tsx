"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useAppointments, useConfirmVideoSlot, useStartAppointment, useCompleteAppointment } from "@/hooks/query/useAppointments";
import { useQueue } from "@/hooks/query/useQueue";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment.types";
import type { CanonicalQueueEntry } from "@/types/queue.types";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  getAppointmentViewState,
  isPaidVideoAppointmentAwaitingDoctorConfirmation,
  shouldShowAppointmentOnDoctorDashboard,
} from "@/lib/utils/appointmentUtils";
import {
  getAppointmentDateTimeValue,
  getAppointmentPaymentDisplayState,
  getAppointmentPatientName,
  getDisplayAppointmentDuration,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
} from "@/lib/utils/appointmentUtils";
import {
  extractQueueEntries,
  getQueuePatientDisplayName,
  getQueueStatusLabel,
  hasQueuePatientIdentity,
  resolveQueueDisplayLabel,
} from "@/lib/queue/queue-adapter";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { theme } from "@/lib/utils/theme-utils";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

import {
  Activity,
  Calendar,
  Users,
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  FileText,
  Video,
  Loader2,
  Pill,
} from "lucide-react";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";

// Interface for the transformed appointment object
interface TransformedAppointment {
  id: string;
  patientName: string;
  dateLabel: string;
  timeLabel: string;
  time: string;
  scheduleState: "PAST" | "TODAY" | "UPCOMING";
  status: string;
  statusEnum: AppointmentStatus;
  type: string;
  duration: string;
  notes: string;
  isVideo: boolean;
  priority: string;
  patientId: string;
  paymentStatus: string;
  paymentCompleted: boolean;
  paymentPending: boolean;
  checkedInAt: string | null;
  proposedSlots?: { date: string; time: string }[];
  confirmedSlotIndex?: number | null;
}

const getPaymentBadgeClasses = (paymentStatus: string) => {
  switch (paymentStatus) {
    case "PAID":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
    case "PENDING":
    case "OVERDUE":
      return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
    case "FAILED":
    case "VOID":
    case "UNCOLLECTIBLE":
      return "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300";
    default:
      return "bg-muted border-border text-muted-foreground";
  }
};

const getDisplayDoctorName = (name?: string | null) => {
  const cleaned = String(name || "")
    .replace(/^dr\.?\s+/i, "")
    .trim();

  return cleaned || "Doctor";
};

function normalizeQueueToken(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function hasQueueTaxonomy(entry: Pick<
  CanonicalQueueEntry,
  "queueCategory" | "queueType" | "serviceBucket" | "treatmentType" | "displayLabel" | "serviceType"
>): boolean {
  return Boolean(
    entry.queueCategory ||
      entry.queueType ||
      entry.serviceBucket ||
      entry.treatmentType ||
      entry.displayLabel ||
      entry.serviceType
  );
}

function isAnalyticsQueueEntry(entry: CanonicalQueueEntry): boolean {
  const tokens = [
    entry.queueCategory,
    entry.queueType,
    entry.serviceBucket,
    entry.treatmentType,
    entry.displayLabel,
    entry.serviceType,
    resolveQueueDisplayLabel(entry),
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));

  return tokens.some((token) => token.includes("ANALYTICS"));
}

function getDoctorQueueLaneLabel(entry: CanonicalQueueEntry): string {
  return !hasQueueTaxonomy(entry) || isAnalyticsQueueEntry(entry)
    ? "Uncategorized"
    : resolveQueueDisplayLabel(entry);
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const displayDoctorName = useMemo(
    () => getDisplayDoctorName(user?.name || user?.firstName || null),
    [user?.firstName, user?.name]
  );
  const clinicId = useCurrentClinicId();
  const doctorId = user?.id;
  const today = useMemo(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }), []);
  const historyStartDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [activePatient, setActivePatient] = useState<{ id: string; name: string } | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [pendingVideoSlotSelections, setPendingVideoSlotSelections] = useState<Record<string, number>>({});

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Fetch real data using existing hooks and server actions
  const { data: appointments, isPending: isAppointmentsPending, error: appointmentsError, refetch: refetchAppointments } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(doctorId ? { doctorId } : {}),
    startDate: historyStartDate,
    endDate: today,
    limit: 200,
  });
  const { data: queueData } = useQueue(
    clinicId || undefined,
    {
      enabled: !!clinicId,
    }
  );
  const startAppointmentMutation = useStartAppointment();
  const completeAppointmentMutation = useCompleteAppointment();
  const confirmVideoSlotMutation = useConfirmVideoSlot();
  const [resolvedVideoSlotConfirmations, setResolvedVideoSlotConfirmations] = useState<Record<string, boolean>>({});

  // Calculate real stats from fetched data
  const appointmentsArray = useMemo(() => {
    if (Array.isArray(appointments)) return appointments;
    return (appointments as any)?.appointments || [];
  }, [appointments]);

  const visibleAppointmentsArray = useMemo(
    () => appointmentsArray.filter((appointment: AppointmentWithRelations) => shouldShowAppointmentOnDoctorDashboard(appointment)),
    [appointmentsArray]
  );

  const liveQueueEntries = useMemo(
    () =>
      extractQueueEntries(queueData)
        .filter((entry) => hasQueuePatientIdentity(entry))
        .filter((entry) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(String(entry.status || "").toUpperCase()))
        .sort((a, b) => a.position - b.position),
    [queueData]
  );

  const doctorQueueSections = useMemo(() => {
    const sectionMap = new Map<
      string,
      {
        key: string;
        title: string;
        items: CanonicalQueueEntry[];
      }
    >();

    liveQueueEntries.forEach((entry) => {
      const title = getDoctorQueueLaneLabel(entry);
      const key = normalizeQueueToken(title);
      const section = sectionMap.get(key);

      if (section) {
        section.items.push(entry);
        return;
      }

      sectionMap.set(key, {
        key,
        title,
        items: [entry],
      });
    });

    return Array.from(sectionMap.values()).sort(
      (a, b) => (a.items[0]?.position ?? 0) - (b.items[0]?.position ?? 0) || a.title.localeCompare(b.title)
    );
  }, [liveQueueEntries]);

  const [activeDoctorQueueLane, setActiveDoctorQueueLane] = useState("");

  useEffect(() => {
    if (doctorQueueSections.length === 0) {
      if (activeDoctorQueueLane) {
        setActiveDoctorQueueLane("");
      }
      return;
    }

    if (!doctorQueueSections.some((section) => section.key === activeDoctorQueueLane)) {
      setActiveDoctorQueueLane(doctorQueueSections[0]?.key || "");
    }
  }, [activeDoctorQueueLane, doctorQueueSections]);

  const activeDoctorQueueSection = useMemo(() => {
    return (
      doctorQueueSections.find((section) => section.key === activeDoctorQueueLane) ??
      doctorQueueSections[0]
    );
  }, [activeDoctorQueueLane, doctorQueueSections]);

  const selectedDoctorQueueItems = activeDoctorQueueSection?.items ?? [];
  const highlightedQueuePatient = selectedDoctorQueueItems[0] ?? liveQueueEntries[0] ?? null;

  const awaitingSlotReviewAppointments = useMemo(
    () =>
      visibleAppointmentsArray.filter((appointment: AppointmentWithRelations) =>
        isPaidVideoAppointmentAwaitingDoctorConfirmation(appointment as any)
      ),
    [visibleAppointmentsArray]
  );

  // Full appointment timeline from real data (sorted by time)
  const appointmentTimeline = useMemo(() => {
    return [...visibleAppointmentsArray]
      .sort(
        (a: AppointmentWithRelations, b: AppointmentWithRelations) =>
          (getAppointmentDateTimeValue(a)?.getTime() ?? 0) - (getAppointmentDateTimeValue(b)?.getTime() ?? 0)
      )
      .map((apt: AppointmentWithRelations): TransformedAppointment => {
        const patientName = getAppointmentPatientName(apt);
        const displayDuration = getDisplayAppointmentDuration(apt);
        const paymentDisplay = getAppointmentPaymentDisplayState(apt);
        const viewState = getAppointmentViewState(apt);
        const dateLabel = getReceptionistAppointmentDateLabel(apt as unknown as Record<string, unknown>);
        const timeLabel = getReceptionistAppointmentTimeLabel(apt as unknown as Record<string, unknown>);
        const appointmentMoment = getAppointmentDateTimeValue(apt);
        const appointmentDay = appointmentMoment
          ? appointmentMoment.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : "";
        const scheduleState =
          appointmentDay && appointmentDay < today
            ? "PAST"
            : appointmentDay && appointmentDay === today
              ? "TODAY"
              : "UPCOMING";
        
        let displayStatus = apt.status as string;
        if (viewState.awaitingDoctorSlotConfirmation) {
          displayStatus = "SCHEDULED (AWAITING SLOT CONFIRMATION)";
        }
        else if (apt.status === "IN_PROGRESS") displayStatus = "IN PROGRESS";

        return {
          id: apt.id,
          patientName,
          dateLabel,
          timeLabel,
          patientId: apt.patientId,
          time: `${dateLabel} - ${timeLabel}`,
          scheduleState,
          status: displayStatus.replace(/_/g, " "),
          statusEnum: apt.status,
          type: apt.type || "Consultation",
          duration: `${displayDuration || 30} min`,
          notes: apt.notes || "",
          isVideo: apt.type === "VIDEO_CALL",
          priority: (apt as any).priority || "NORMAL",
          paymentStatus: paymentDisplay.paymentStatus,
          paymentCompleted: paymentDisplay.paymentCompleted,
          paymentPending: paymentDisplay.paymentPending,
          checkedInAt: apt.checkedInAt ? new Date(apt.checkedInAt).toISOString() : null,
          proposedSlots: (apt as any).proposedSlots,
          confirmedSlotIndex: (apt as any).confirmedSlotIndex,
        };
      });
  }, [visibleAppointmentsArray]);

  const filteredAppointments = useMemo(() => {
    return appointmentTimeline.filter((apt: TransformedAppointment) =>
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [appointmentTimeline, searchTerm]);

  const activeTreatmentQueue = liveQueueEntries;

  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const todayApts = visibleAppointmentsArray.filter((apt: AppointmentWithRelations) => {
      const dateTime = getAppointmentDateTimeValue(apt);
      const aptDate =
        (dateTime
          ? dateTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : "") ||
        apt.date ||
        (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] ||
        "";
      return aptDate === todayStr;
    });

    return {
      todayAppointments: todayApts.length,
      checkedInPatients: todayApts.filter((apt: AppointmentWithRelations) => Boolean((apt as any).checkedInAt)).length,
      completedToday: todayApts.filter((apt: AppointmentWithRelations) => apt.status === "COMPLETED").length,
      totalPatients: new Set(appointmentsArray.map((apt: AppointmentWithRelations) => apt.patientId)).size,
      awaitingPayments: appointmentsArray.filter((apt: AppointmentWithRelations) => {
        const dateTime = getAppointmentDateTimeValue(apt);
        const aptDate =
          (dateTime
            ? dateTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
            : "") ||
          apt.date ||
          (apt as unknown as Record<string, unknown>).appointmentDate?.toString().split("T")?.[0] ||
          "";
        const viewState = getAppointmentViewState(apt);
        return (
          aptDate === todayStr &&
          viewState.isVideo &&
          !viewState.paymentCompleted
        );
      }).length,
      nextAppointment: appointmentTimeline.find(
        (a: TransformedAppointment) =>
          a.statusEnum === "SCHEDULED" ||
          a.statusEnum === "CONFIRMED" ||
          a.statusEnum === "IN_PROGRESS" ||
          isPaidVideoAppointmentAwaitingDoctorConfirmation(a)
      ),
    };
  }, [appointmentTimeline, visibleAppointmentsArray]);

  const openPrescription = (apt: TransformedAppointment) => {
    setActivePatient({ id: apt.patientId, name: apt.patientName });
    setActiveAppointmentId(apt.id);
    setIsPrescriptionModalOpen(true);
  };

  const formatProposedSlot = (slot?: { date: string; time: string }) => {
    if (!slot) return "Slot";
    const dateLabel = slot.date
      ? new Date(`${slot.date}T00:00:00`).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
        })
      : "";
    return `${dateLabel ? `${dateLabel} · ` : ""}${slot.time}`;
  };

  const columns: ColumnDef<TransformedAppointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => {
        const awaitingConfirmation = isPaidVideoAppointmentAwaitingDoctorConfirmation(row.original);
        const proposedSlots = Array.isArray(row.original.proposedSlots) ? row.original.proposedSlots : [];

        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${row.original.isVideo ? 'bg-indigo-100/80 text-indigo-600' : 'bg-blue-100/80 text-blue-600'} rounded-full flex items-center justify-center shrink-0`}>
              {row.original.isVideo ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div>
              <div className={`font-semibold leading-none mb-1 flex items-center gap-2 ${theme.textColors.heading}`}>
                {row.original.patientName}
                {row.original.priority === "URGENT" && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[8px] animate-pulse ring-2 ring-destructive/20 font-black">
                    URGENT
                  </Badge>
                )}
              </div>
              <div className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${theme.textColors.tertiary}`}>
                <span>{row.original.type}</span>
                <span className="text-muted-foreground">•</span>
                <span>{row.original.duration}</span>
                {awaitingConfirmation && proposedSlots[0] && (
                  <span className="text-amber-600 font-medium ml-1">
                    (Prop: {proposedSlots[0].time})
                  </span>
                )}
              </div>
              {row.original.isVideo && (
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase tracking-wider ${getPaymentBadgeClasses(
                      row.original.paymentCompleted ? "PAID" : row.original.paymentStatus
                    )}`}
                  >
                    {row.original.paymentCompleted
                      ? "Payment verified"
                      : "Payment pending"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "time",
      header: "Time",
      cell: ({ row }) => {
        const stateLabel =
          row.original.scheduleState === "PAST"
            ? "Past"
            : row.original.scheduleState === "TODAY"
              ? "Today"
              : "Upcoming";

        const stateClasses =
          row.original.scheduleState === "PAST"
            ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
            : row.original.scheduleState === "TODAY"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
              : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300";

        return (
          <div className="flex flex-col gap-1">
            <div className={`text-sm font-semibold tracking-tight ${theme.textColors.primary}`}>
              {row.original.dateLabel}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-medium ${theme.textColors.tertiary}`}>{row.original.timeLabel}</span>
              <Badge variant="outline" className={`h-5 rounded-full px-2 text-[10px] font-semibold uppercase tracking-wider ${stateClasses}`}>
                {stateLabel}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const stat = row.original.statusEnum;
        const awaitingConfirmation = isPaidVideoAppointmentAwaitingDoctorConfirmation(row.original);
        let colorClasses = "bg-muted border-border text-muted-foreground";
        if (stat === "IN_PROGRESS") colorClasses = "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
        else if (stat === "CONFIRMED") colorClasses = "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300";
        else if (stat === "COMPLETED") colorClasses = "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300";
        else if (awaitingConfirmation) colorClasses = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300";
        
        return (
          <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wider ${colorClasses}`}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        const appointmentId = String(appointment.id || "");
        const awaitingConfirmation = isPaidVideoAppointmentAwaitingDoctorConfirmation(appointment) && !resolvedVideoSlotConfirmations[appointmentId];
        const proposedSlots = Array.isArray(appointment.proposedSlots) ? appointment.proposedSlots : [];
        const paymentReady = !appointment.isVideo || appointment.paymentCompleted;
        return (
          <div className="flex gap-2">
            {appointment.statusEnum === "CONFIRMED" && appointment.checkedInAt && (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                disabled={startAppointmentMutation.isPending || !paymentReady}
                onClick={async () => {
                  await startAppointmentMutation.mutateAsync(appointment.id);
                  if (appointment.isVideo) {
                    router.push("/doctor/video");
                  }
                }}
                title={!paymentReady ? "Video request is waiting for payment" : undefined}
              >
                {startAppointmentMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 fill-current" />
                )}
                Start
              </Button>
            )}
            {appointment.statusEnum === "CONFIRMED" && !appointment.checkedInAt && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border bg-card text-muted-foreground shadow-sm"
                disabled
                title="Patient must be checked in before consultation can start"
              >
                <Play className="w-3 h-3 fill-current" />
                Waiting check-in
              </Button>
            )}
            {appointment.statusEnum === "CONFIRMED" && appointment.isVideo && !appointment.paymentCompleted && (
              <Badge
                variant="outline"
                className="h-8 rounded-md border-amber-200 bg-amber-50 px-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
              >
                Payment pending
              </Badge>
            )}
            {awaitingConfirmation && proposedSlots.length > 0 && (
              <div className="flex items-center gap-2">
                <Select
                  value={String(pendingVideoSlotSelections[appointment.id] ?? 0)}
                  onValueChange={(value: string) =>
                    setPendingVideoSlotSelections((current) => ({
                      ...current,
                      [appointment.id]: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-[190px] rounded-md text-xs">
                    <SelectValue placeholder="Choose slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {proposedSlots.map((slot, index) => (
                      <SelectItem key={`${appointment.id}-${index}`} value={String(index)}>
                        {formatProposedSlot(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  disabled={confirmVideoSlotMutation.isPending}
                  onClick={async () => {
                    try {
                      const refreshedResult = await refetchAppointments();
                      const refreshedAppointments = Array.isArray((refreshedResult as any)?.data)
                        ? (refreshedResult as any).data
                        : Array.isArray((refreshedResult as any)?.appointments)
                          ? (refreshedResult as any).appointments
                          : [];
                      const refreshedAppointment = refreshedAppointments.find((item: any) => String(item?.id || item?.appointmentId || "") === appointmentId);

                      if (
                        refreshedAppointment &&
                        !getAppointmentViewState(refreshedAppointment).awaitingDoctorSlotConfirmation
                      ) {
                        setResolvedVideoSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
                        showSuccessToast("Slot is already confirmed. Refreshing the list.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
                        await refetchAppointments();
                        setPendingVideoSlotSelections((current) => {
                          const next = { ...current };
                          delete next[appointmentId];
                          return next;
                        });
                        return;
                      }

                      await confirmVideoSlotMutation.mutateAsync({
                        appointmentId,
                        confirmedSlotIndex: pendingVideoSlotSelections[appointmentId] ?? 0,
                      });
                      setResolvedVideoSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
                      await refetchAppointments();
                      setPendingVideoSlotSelections((current) => {
                        const next = { ...current };
                        delete next[appointmentId];
                        return next;
                      });
                    } catch (error) {
                      const message = error instanceof Error ? error.message : String(error);
                      if (message.includes("not awaiting doctor slot confirmation")) {
                        setResolvedVideoSlotConfirmations((current) => ({ ...current, [appointmentId]: true }));
                        showSuccessToast("Slot is already confirmed. Refreshing the list.", { id: TOAST_IDS.APPOINTMENT.UPDATE });
                        await refetchAppointments();
                        setPendingVideoSlotSelections((current) => {
                          const next = { ...current };
                          delete next[appointmentId];
                          return next;
                        });
                        return;
                      }
                      showErrorToast(error, { id: TOAST_IDS.APPOINTMENT.UPDATE });
                    }
                  }}
                >
                  {confirmVideoSlotMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Confirm slot
                </Button>
              </div>
            )}
            {appointment.statusEnum === "IN_PROGRESS" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-sm"
                  onClick={() => openPrescription(appointment)}
                >
                  <Pill className="w-3 h-3" />
                  Prescribe
                </Button>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border-none"
                  disabled={completeAppointmentMutation.isPending}
                  onClick={() =>
                    completeAppointmentMutation.mutateAsync({
                      id: appointment.id,
                      data: {},
                    })
                  }
                >
                  {completeAppointmentMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3 h-3" />
                  )}
                  Complete
                </Button>
              </div>
            )}
            {appointment.statusEnum !== "IN_PROGRESS" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
                onClick={() => router.push(`/doctor/patients/${appointment.patientId}`)}
              >
                EHR
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const liveQueueColumns = useMemo<ColumnDef<CanonicalQueueEntry>[]>(() => [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => {
        const queueItem = row.original;
        const queueLabel = getDoctorQueueLaneLabel(queueItem);

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {getQueuePatientDisplayName(queueItem)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {queueLabel}
                </Badge>
                <span className="text-muted-foreground/80">#{queueItem.position || 0}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.doctorName || "Assigned doctor pending"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={`${getStatusColor(
            row.original.status
          )} flex w-max items-center justify-center gap-1 whitespace-nowrap border px-2 py-0.5 text-[10px] font-semibold`}
        >
          {getStatusIcon(row.original.status)}
          {getQueueStatusLabel(row.original)}
        </Badge>
      ),
    },
    {
      id: "waitTime",
      header: "Wait Time",
      cell: ({ row }) => {
        const waitValue = row.original.estimatedWaitTime || row.original.waitTime;
        if (!waitValue) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            {waitValue}m
          </span>
        );
      },
    },
  ], []);

  function getStatusColor(status: string) {
    switch (status) {
      case "WAITING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "WAITING":
        return <Clock className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "CONFIRMED":
        return <Users className="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  }

  if (isAppointmentsPending && appointmentsArray.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-emerald-700 font-medium">Loading your clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (appointmentsError && appointmentsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Workspace Connection Issue</h3>
        <p className="text-muted-foreground max-w-sm mb-6">We could not load your appointments. Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Refresh Workspace</Button>
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Dashboard"
        title={`Welcome, Dr. ${displayDoctorName}`}
        description={`Today is ${new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}. Manage checked-in patients, video visits, and prescriptions from one workspace.`}
        meta={
          <Badge
            variant="outline"
            className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
          >
            <Activity className="mr-1 inline-block h-3 w-3" />
            Active Shift
          </Badge>
        }
        actions={[
          {
            label: "Video Visits",
            href: "/doctor/video",
            icon: <Video className="h-4 w-4" />,
          },
          {
            label: "Patient Directory",
            href: "/doctor/patients",
            icon: <Users className="h-4 w-4" />,
          },
        ]}
      />

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600">
                <Clock className="h-4 w-4" />
                Live Workspace
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">Next appointment</span>
                {stats.nextAppointment ? (
                  <span className="truncate text-sm font-semibold text-foreground">
                    {stats.nextAppointment.patientName} · {stats.nextAppointment.time || "Time TBD"} · {stats.nextAppointment.type}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-muted-foreground">
                    No checked-in patient ready for consultation
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2.5 py-1">Status-first workspace</span>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">Today</div>
              <div className="mt-1 text-lg font-bold leading-none text-blue-900 dark:text-blue-100">{stats.todayAppointments}</div>
              <div className="mt-1 text-[11px] text-blue-700/80 dark:text-blue-200/80">Appointments</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Waiting</div>
              <div className="mt-1 text-lg font-bold leading-none text-emerald-900 dark:text-emerald-100">{stats.checkedInPatients}</div>
              <div className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-200/80">Checked-in</div>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 shadow-sm dark:border-green-500/20 dark:bg-green-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">Done</div>
              <div className="mt-1 text-lg font-bold leading-none text-green-900 dark:text-green-100">{stats.completedToday}</div>
              <div className="mt-1 text-[11px] text-green-700/80 dark:text-green-200/80">Consulted</div>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Patients</div>
              <div className="mt-1 text-lg font-bold leading-none text-indigo-900 dark:text-indigo-100">{stats.totalPatients}</div>
              <div className="mt-1 text-[11px] text-indigo-700/80 dark:text-indigo-200/80">Lifetime</div>
            </div>
            <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 shadow-sm sm:col-span-4 xl:col-span-1 dark:border-amber-500/20 dark:bg-amber-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Video</div>
              <div className="mt-1 text-lg font-bold leading-none text-amber-900 dark:text-amber-100">{stats.awaitingPayments}</div>
              <div className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-200/80">Payments pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Active Treatment Queue Table - Dominant Column */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="overflow-hidden border-l-4 border-l-emerald-400 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 pb-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Activity className="w-4 h-4" />
                </div>
                Live Queue
              </CardTitle>
              <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted-foreground">
                  <span className="rounded-full border border-border bg-background px-2.5 py-1">Direct treatment lanes</span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1">Live queue snapshot</span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    Read only
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  onClick={() => router.push("/queue")}
                >
                  View Queue Workspace
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3 sm:p-4">
              {highlightedQueuePatient ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-3 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                        Next patient
                      </div>
                      <div className="mt-1 truncate text-lg font-semibold text-foreground">
                        {getQueuePatientDisplayName(highlightedQueuePatient)}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-700">
                          {getDoctorQueueLaneLabel(highlightedQueuePatient)}
                        </Badge>
                        <span>{highlightedQueuePatient.doctorName || "Assigned doctor pending"}</span>
                        <span className="text-muted-foreground/60">·</span>
                        <span>Queue #{highlightedQueuePatient.position || 0}</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-200 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      {getQueueStatusLabel(highlightedQueuePatient)}
                    </Badge>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {doctorQueueSections.map((section) => (
                  <Badge
                    key={section.key}
                    asChild
                    variant="outline"
                    className={`cursor-pointer gap-2 px-3 py-2 text-sm font-semibold shadow-sm transition ${
                      activeDoctorQueueLane === section.key
                        ? "border-emerald-500 bg-emerald-600 text-white shadow-md ring-1 ring-emerald-300 dark:border-emerald-400 dark:bg-emerald-500 dark:text-white"
                        : "border-border bg-background text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <button type="button" onClick={() => setActiveDoctorQueueLane(section.key)}>
                      <span className="truncate font-semibold">{section.title}</span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-current">
                        {section.items.length}
                      </span>
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                    Selected lane
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-foreground">
                    {activeDoctorQueueSection?.title || "Live queue"}
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  {selectedDoctorQueueItems.length}
                </Badge>
              </div>

              <DataTable
                columns={liveQueueColumns}
                data={selectedDoctorQueueItems}
                pageSize={5}
                emptyMessage="No active queue entries right now."
                compact
              />
            </CardContent>
          </Card>

          {awaitingSlotReviewAppointments.length > 0 && (
            <Card className="overflow-hidden border-l-4 border-l-amber-400 shadow-sm">
              <div className="border-b border-border bg-amber-50/80 p-3 dark:bg-amber-950/20">
                <h3 className="flex items-center gap-2 font-bold text-foreground">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Awaiting Slot Review
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Video bookings are paid and waiting for your confirmation of one proposed slot.
                </p>
              </div>
              <CardContent className="space-y-3 p-3">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {awaitingSlotReviewAppointments.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {awaitingSlotReviewAppointments.length === 1
                    ? "Request awaiting your review"
                    : "Requests awaiting your review"}
                </p>
                <div className="space-y-2">
                  {awaitingSlotReviewAppointments.slice(0, 3).map((appointment: AppointmentWithRelations) => (
                    <div
                      key={appointment.id}
                      className="rounded-xl border border-amber-200 bg-white/90 px-3 py-2 text-sm shadow-sm dark:border-amber-900/40 dark:bg-card/80"
                    >
                      <div className="font-semibold text-foreground">
                        {getAppointmentPatientName(appointment)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {getAppointmentDateTimeValue(appointment)
                          ? getAppointmentDateTimeValue(appointment)?.toLocaleDateString("en-IN", {
                              timeZone: "Asia/Kolkata",
                              day: "numeric",
                              month: "short",
                            })
                          : "Date TBD"}
                        {" · "}
                        {Array.isArray((appointment as any).proposedSlots)
                          ? `${(appointment as any).proposedSlots.length} proposed slots`
                          : "3 proposed slots"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scheduled Today Table */}
          <Card className="overflow-hidden border-l-4 border-l-blue-400 shadow-sm">
            <CardHeader className="border-b border-border bg-muted/40 px-4 pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                Full Schedule List
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 opacity-90 transition-opacity hover:opacity-100 sm:p-3">
              <DataTable
                columns={columns}
                data={filteredAppointments}
                pageSize={10}
                emptyMessage="Your schedule is clear for today."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
            <Card className="overflow-hidden border-l-4 border-l-slate-400 shadow-sm">
              <div className="bg-muted/40 border-b border-border p-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Workspace Tools
                </h3>
              </div>
              <CardContent className="space-y-2.5 p-3">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
                  onClick={() => router.push("/doctor/appointments")}
                >
                  <div className="w-8 h-8 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200 flex items-center justify-center mr-3 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Master Calendar
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-100 dark:hover:bg-indigo-500/20"
                  onClick={() => router.push("/doctor/patients")}
                >
                  <div className="w-8 h-8 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200 flex items-center justify-center mr-3 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  Patient Directory
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20"
                  onClick={() => router.push("/doctor/video")}
                >
                  <div className="w-8 h-8 rounded bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200 flex items-center justify-center mr-3 transition-colors">
                    <Video className="w-4 h-4" />
                  </div>
                  Video Visits
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
                  onClick={() => router.push("/doctor/appointments")}
                >
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200 flex items-center justify-center mr-3 transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  Appointment Manager
                </Button>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-l-4 border-l-amber-400 bg-amber-50 shadow-sm dark:bg-amber-950/30">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-[100px] -z-0 dark:bg-amber-900/40" />
              <div className="relative z-10 p-3.5">
              <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-2 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                Clinical Notice
              </h3>
              <p className="text-sm text-amber-800/80 leading-relaxed dark:text-amber-100/80">
                Consultation starts only after the patient is checked in. Video visits stay locked until payment is confirmed, and medicine packing/dispatch are handled by the medicine desk after the prescription is saved.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <QuickPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        appointmentId={activeAppointmentId || ""}
        patientId={activePatient?.id || ""}
        patientName={activePatient?.name || ""}
        doctorId={user?.id || ""}
      />
    </DashboardPageShell>
  );
}



