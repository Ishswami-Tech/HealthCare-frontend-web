"use client";

import Link from "next/link";
import { useMemo, useReducer, useState, useCallback } from "react";
import { Bell, Calendar, Loader2, QrCode, Search, Stethoscope, UserCheck, Eye, MoreHorizontal, UserMinus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  parseReceptionistAppointmentDateTime,
} from "@/lib/utils/appointmentUtils";

import AppointmentManager from "@/components/appointments/AppointmentManager";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hasAppointmentsLoadedForSession } from "@/hooks/query/useAppointments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDoctors } from "@/hooks/query/useDoctors";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  useAppointmentServices,
  useAppointments,
  useForceCheckInAppointment,
  useMarkAppointmentNoShow,
  useReassignAppointmentDoctor,
} from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
import { useCallNextPatient as useQueueCallNextPatient } from "@/hooks/query/useQueue";
import { useQueueFilters } from "@/hooks/query/useQueue";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { getQueuePositionLabel, resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import {
  getAppointmentViewState,
  shouldShowAppointmentOnReceptionDashboard,
} from "@/lib/utils/appointmentUtils";

type ViewAppointment = {
  id: string;
  locationId?: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  primaryDoctorId?: string;
  assignedDoctorId?: string;
  doctorName: string;
  doctorRole?: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  paymentStatus: string;
  paymentCompleted: boolean;
  queuePosition: number | null;
  queueType: string;
  notes: string;
  cancellationReason?: string;
  waitLabel: string;
  isWalkIn: boolean;
  isDelegated: boolean;
  doctor?: any;
  sortAt: number;
};

type ReceptionistAppointmentsState = {
  searchTerm: string;
  statusFilter: string;
  queueFilter: string;
  sortOrder: string;
  selectedDate: string;
  selectedLocationId: string | null;
  activeActionId: string | null;
  activeDoctorId: string | null;
  selectedAppointment: ViewAppointment | null;
};

type ReceptionistAppointmentsAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setStatusFilter"; value: string }
  | { type: "setQueueFilter"; value: string }
  | { type: "setSortOrder"; value: string }
  | { type: "setSelectedDate"; value: string }
  | { type: "setSelectedLocationId"; value: string | null }
  | { type: "setActiveActionId"; value: string | null }
  | { type: "setActiveDoctorId"; value: string | null }
  | { type: "setSelectedAppointment"; value: ViewAppointment | null };

const initialReceptionistAppointmentsState: ReceptionistAppointmentsState = {
  searchTerm: "",
  statusFilter: "all",
  queueFilter: "all",
  sortOrder: "date-desc",
  selectedDate: "",
  selectedLocationId: null,
  activeActionId: null,
  activeDoctorId: null,
  selectedAppointment: null,
};

function receptionistAppointmentsReducer(
  state: ReceptionistAppointmentsState,
  action: ReceptionistAppointmentsAction
): ReceptionistAppointmentsState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setStatusFilter":
      return { ...state, statusFilter: action.value };
    case "setQueueFilter":
      return { ...state, queueFilter: action.value };
    case "setSortOrder":
      return { ...state, sortOrder: action.value };
    case "setSelectedDate":
      return { ...state, selectedDate: action.value };
    case "setSelectedLocationId":
      return { ...state, selectedLocationId: action.value };
    case "setActiveActionId":
      return { ...state, activeActionId: action.value };
    case "setActiveDoctorId":
      return { ...state, activeDoctorId: action.value };
    case "setSelectedAppointment":
      return { ...state, selectedAppointment: action.value };
    default:
      return state;
  }
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  NO_SHOW: "bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-300",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  EXPIRED: "bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
};

function normalizeAppointment(
  app: any,
  serviceCatalogMap: Map<string, { label: string; serviceBucket: string; queueCategory: string }>
): ViewAppointment {
  const parsed = parseReceptionistAppointmentDateTime(app as unknown as Record<string, unknown>);
  const viewState = getAppointmentViewState(app);
  const patientName =
    app.patientName ||
    app.patient?.name ||
    app.patient?.user?.name ||
    `${app.patient?.firstName || app.patient?.user?.firstName || ""} ${app.patient?.lastName || app.patient?.user?.lastName || ""}`.trim() ||
    "Unknown Patient";
  const patientPhone =
    app.patientPhone ||
    app.patient?.phone ||
    app.patient?.user?.phone ||
    "";
  const doctorName =
    app.doctorName ||
    app.doctor?.name ||
    app.doctor?.user?.name ||
    `${app.doctor?.firstName || app.doctor?.user?.firstName || ""} ${app.doctor?.lastName || app.doctor?.user?.lastName || ""}`.trim() ||
    "Unassigned Doctor";

  return {
    id: app.id,
    locationId: app.locationId || app.location?.id || undefined,
    patientName,
    patientPhone,
    doctorId: app.doctor?.id || app.doctorId || "",
    primaryDoctorId: app.primaryDoctorId || app.metadata?.primaryDoctorId || app.doctorId || "",
    assignedDoctorId: app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || "",
    doctorName,
    doctorRole: String(app.doctor?.role || app.doctor?.user?.role || "").toUpperCase(),
    dateLabel: getReceptionistAppointmentDateLabel(app as unknown as Record<string, unknown>),
    timeLabel: getReceptionistAppointmentTimeLabel(app as unknown as Record<string, unknown>),
    status: viewState.isVideo && !viewState.paymentCompleted ? "SCHEDULED" : viewState.normalizedStatus,
    paymentStatus: viewState.paymentStatus,
    paymentCompleted: viewState.paymentCompleted,
    queuePosition: typeof app.queuePosition === "number" ? app.queuePosition : null,
    queueType: resolveQueueDisplayLabel(app, serviceCatalogMap),
    notes: app.notes || app.cancellationReason || app.reason || "",
    cancellationReason: app.cancellationReason || undefined,
    waitLabel:
      typeof app.estimatedWaitTime === "number"
        ? `${app.estimatedWaitTime} min`
        : typeof app.waitTime === "number"
          ? `${app.waitTime} min`
          : typeof app.waitTime === "string"
            ? app.waitTime
            : "Pending",
    isWalkIn: Boolean(app.isWalkIn),
    isDelegated:
      Boolean(app.primaryDoctorId || app.metadata?.primaryDoctorId) &&
      String(app.primaryDoctorId || app.metadata?.primaryDoctorId || "") !==
        String(app.assignedDoctorId || app.metadata?.assignedDoctorId || app.doctorId || ""),
    doctor: app.doctor || app.metadata?.doctor,
    sortAt: parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0,
  };
}

export default function ReceptionistAppointmentsPage() {
  const { session } = useAuth();
  const { clinicId } = useClinicContext();
  useWebSocketQuerySync();
  const { data: serviceCatalog = [] } = useAppointmentServices();
  const { data: queueFilterCatalog = [] } = useQueueFilters({ enabled: !!clinicId });
  const typedQueueFilterCatalog = queueFilterCatalog as Array<{
    key?: string;
    filters?: Array<{ label?: string; value?: string }>;
  }>;
  const assignedLocationId = useMemo(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const candidate =
      (typeof user?.locationId === "string" ? user.locationId : "") ||
      (typeof user?.clinicLocationId === "string" ? user.clinicLocationId : "") ||
      (typeof user?.assignedLocationId === "string" ? user.assignedLocationId : "");
    return candidate || null;
  }, [session?.user]);

  const [
    {
      searchTerm,
      statusFilter,
      queueFilter,
      sortOrder,
      selectedDate,
      selectedLocationId,
      activeActionId,
      activeDoctorId,
      selectedAppointment,
    },
    dispatch,
  ] = useReducer(receptionistAppointmentsReducer, initialReceptionistAppointmentsState);
  const checkInMutation = useForceCheckInAppointment();
  const markNoShowMutation = useMarkAppointmentNoShow();
  const reassignAppointmentMutation = useReassignAppointmentDoctor();
  const callNextPatientMutation = useQueueCallNextPatient();

  const effectiveLocationId = assignedLocationId || selectedLocationId;

  const {
    data: appointmentsData,
    isPending,
    isFetching,
    refetch,
  } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    ...(selectedDate ? { date: selectedDate } : {}),
    ...(effectiveLocationId ? { locationId: effectiveLocationId } : {}),
    limit: 200,
  });
  const { data: locations = [] } = useActiveLocations(clinicId || "");
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });

  // First-load-only skeleton gate: only show the skeleton when this is the
  // first fetch of the session AND we have no cached data. Background
  // refetches (focus, reconnect, WebSocket-driven merge) keep the list
  // visible thanks to `placeholderData: keepPreviousData` in useAppointments.
  const hasCachedAppointments =
    !!appointmentsData &&
    ((Array.isArray((appointmentsData as any).appointments) &&
      (appointmentsData as any).appointments.length > 0) ||
      (Array.isArray((appointmentsData as any).data) &&
        (appointmentsData as any).data.length > 0) ||
      (Array.isArray(appointmentsData as any) &&
        (appointmentsData as any).length > 0));
  const showAppointmentsSkeleton =
    isPending && !hasCachedAppointments && !hasAppointmentsLoadedForSession();

  const assignableDoctors = useMemo(() => {
    const normalize = (users: any[]) =>
      users.reduce<
        Array<{
          id: string;
          name: string;
          role: string;
        }>
      >((acc, user) => {
        const role = String(user.role || user.doctor?.user?.role || "").toUpperCase();
        const id = String(user.doctor?.id || user.id || "");

        if (!id || (role !== "DOCTOR" && role !== "ASSISTANT_DOCTOR")) {
          return acc;
        }

        acc.push({
          id,
          name:
            user.name ||
            user.doctor?.user?.name ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            "Unknown Doctor",
          role,
        });

        return acc;
      }, []);

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors)) return normalize((doctorsData as any).data.doctors);
    return normalize((doctorsData as any)?.doctors || []);
  }, [doctorsData]);

  const appointments = useMemo(() => {
    const raw: any[] = Array.isArray(appointmentsData)
      ? appointmentsData
      : (appointmentsData as any)?.appointments || [];
    const serviceMap = new Map(
      serviceCatalog.map((service) => [
        String(service.treatmentType).toUpperCase(),
        {
          label: service.label,
          serviceBucket: service.serviceBucket,
          queueCategory: service.queueCategory,
        },
      ])
    );

    return raw.reduce<ViewAppointment[]>((acc, appointment: any) => {
      if (!shouldShowAppointmentOnReceptionDashboard(appointment)) {
        return acc;
      }

      acc.push(normalizeAppointment(appointment, serviceMap));
      return acc;
    }, []);
  }, [appointmentsData, serviceCatalog]);

  const filteredAppointments = useMemo(() => {
    const base = appointments.filter((appointment: ViewAppointment) => {
      const matchesSearch =
        !searchTerm ||
        appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.patientPhone.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesQueue = queueFilter === "all" || appointment.queueType === queueFilter;
      const matchesAssignedLocation =
        !assignedLocationId || !appointment.locationId || appointment.locationId === assignedLocationId;
      return matchesSearch && matchesStatus && matchesQueue && matchesAssignedLocation;
    });
    return base.toSorted((left: ViewAppointment, right: ViewAppointment) => {
      if (sortOrder === "date-asc") return left.sortAt - right.sortAt;
      if (sortOrder === "patient-asc") return left.patientName.localeCompare(right.patientName);
      if (sortOrder === "patient-desc") return right.patientName.localeCompare(left.patientName);
      return right.sortAt - left.sortAt;
    });
  }, [appointments, assignedLocationId, queueFilter, searchTerm, sortOrder, statusFilter]);

  const availableQueueTypes = useMemo<string[]>(
    () => {
      const treatmentGroup = typedQueueFilterCatalog.find(
        (group) => String(group.key || "").toLowerCase() === "treatments"
      );
      const backendLabels =
        treatmentGroup?.filters?.reduce<string[]>((acc, option: { label?: string; value?: string }) => {
          const label = option.label || option.value;
          if (label) {
            acc.push(label);
          }
          return acc;
        }, []) || [];

      if (backendLabels.length > 0) {
        return Array.from(new Set(backendLabels)).toSorted();
      }

      const queueTypes = new Set<string>();
      for (const appointment of appointments) {
        if (appointment.queueType) {
          queueTypes.add(appointment.queueType);
        }
      }
      return Array.from(queueTypes).toSorted();
    },
    [appointments, typedQueueFilterCatalog]
  );

  const selectedCalendarDate = useMemo(
    () => (selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined),
    [selectedDate]
  );

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((item: ViewAppointment) => item.status === "SCHEDULED").length;
    const confirmed = appointments.filter((item: ViewAppointment) => item.status === "CONFIRMED").length;
    const inProgress = appointments.filter((item: ViewAppointment) => item.status === "IN_PROGRESS").length;
    const completed = appointments.filter((item: ViewAppointment) => item.status === "COMPLETED").length;
    return { total, scheduled, confirmed, inProgress, completed };
  }, [appointments]);

  const doctorBacklog = useMemo(() => {
    const grouped = new Map<
      string,
      {
        doctorId: string;
        doctorName: string;
        scheduled: number;
        confirmed: number;
        inProgress: number;
        nextPatient: string | null;
        nextAppointmentId: string | null;
      }
    >();

    for (const appointment of filteredAppointments) {
      const doctorKey = appointment.doctorId || appointment.doctorName;
      const current = grouped.get(doctorKey) || {
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        nextPatient: null,
        nextAppointmentId: null,
      };

      if (appointment.status === "SCHEDULED") current.scheduled += 1;
      if (appointment.status === "CONFIRMED") {
        current.confirmed += 1;
        if (!current.nextPatient || appointment.queuePosition === 1) {
          current.nextPatient = appointment.patientName;
          current.nextAppointmentId = appointment.id;
        }
      }
      if (appointment.status === "IN_PROGRESS") current.inProgress += 1;
      grouped.set(doctorKey, current);
    }

    return Array.from(grouped.values()).sort((a, b) => b.confirmed - a.confirmed || b.scheduled - a.scheduled);
  }, [filteredAppointments]);

  const handleNotifyNext = useCallback(async (doctorId: string, appointmentId: string | null) => {
    if (!doctorId || !appointmentId) {
      showErrorToast("No queued patient is available for this doctor", { id: TOAST_IDS.QUEUE.CALL_NEXT });
      return;
    }
    dispatch({ type: "setActiveDoctorId", value: doctorId });
    try {
      await callNextPatientMutation.mutateAsync({ doctorId, appointmentId });
      await refetch?.();
    } finally {
      dispatch({ type: "setActiveDoctorId", value: null });
    }
  }, [callNextPatientMutation, refetch]);

  const doctorQueueColumns = useMemo<ColumnDef<(typeof doctorBacklog)[number]>[]>(
    () => [
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{row.original.doctorName}</span>
            <span className="text-xs text-muted-foreground">Doctor</span>
          </div>
        ),
      },
      {
        accessorKey: "scheduled",
        header: "Scheduled",
        cell: ({ row }) => (
          <Badge variant="outline" className="bg-muted/40 text-foreground border-border">
            {row.original.scheduled}
          </Badge>
        ),
      },
      {
        accessorKey: "confirmed",
        header: "Confirmed",
        cell: ({ row }) => (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
            {row.original.confirmed}
          </Badge>
        ),
      },
      {
        accessorKey: "inProgress",
        header: "In Progress",
        cell: ({ row }) => (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            {row.original.inProgress}
          </Badge>
        ),
      },
      {
        accessorKey: "nextPatient",
        header: "Next Patient",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.nextPatient || "No waiting patients"}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            size="sm"
            className="h-8 px-3 text-xs font-bold gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
            onClick={() => void handleNotifyNext(row.original.doctorId, row.original.nextAppointmentId)}
            disabled={activeDoctorId === row.original.doctorId || row.original.confirmed === 0}
          >
            {activeDoctorId === row.original.doctorId ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Bell className="size-3.5" />
            )}
            Call Next
          </Button>
        ),
      },
    ],
    [activeDoctorId, handleNotifyNext]
  );

  async function handleConfirmArrival(appointmentId: string, locationId?: string) {
    const locationToSend = assignedLocationId || locationId;
    if (assignedLocationId && locationId && assignedLocationId !== locationId) {
      showErrorToast("This appointment does not belong to your assigned location", {
        id: TOAST_IDS.APPOINTMENT.UPDATE,
      });
      return;
    }
    dispatch({ type: "setActiveActionId", value: appointmentId });
    try {
      await checkInMutation.mutateAsync({
        appointmentId,
        reason: "Reception desk manual check-in for this location",
        ...(locationToSend ? { locationId: locationToSend } : {}),
      });
      await refetch?.();
    } finally {
      dispatch({ type: "setActiveActionId", value: null });
    }
  }

  async function handleMarkNoShow(appointmentId: string) {
    dispatch({ type: "setActiveActionId", value: appointmentId });
    try {
      await markNoShowMutation.mutateAsync(appointmentId);
      await refetch?.();
    } finally {
      dispatch({ type: "setActiveActionId", value: null });
    }
  }

  async function handleReassignDoctor(appointmentId: string, doctorId: string) {
    dispatch({ type: "setActiveActionId", value: appointmentId });
    try {
      await reassignAppointmentMutation.mutateAsync({
        appointmentId,
        doctorId,
        reason: "Reception desk reassignment",
      });
      await refetch?.();
    } finally {
      dispatch({ type: "setActiveActionId", value: null });
    }
  }

  const columns: ColumnDef<ViewAppointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.patientName}</span>
          <span className="text-xs text-muted-foreground">{row.original.patientPhone}</span>
          {row.original.isWalkIn && <Badge variant="outline" className="w-fit mt-1 text-[10px]">Walk-in</Badge>}
        </div>
      ),
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.doctorName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.doctorRole === "ASSISTANT_DOCTOR" ? "Assistant" : "Doctor"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "dateTime",
      header: "Schedule",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{row.original.dateLabel}</span>
          <span className="text-xs text-muted-foreground">{row.original.timeLabel}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={STATUS_STYLES[row.original.status] || STATUS_STYLES.SCHEDULED}>
          {row.original.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "queue",
      header: "Queue",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{row.original.queueType || "—"}</span>
          {row.original.queuePosition != null && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 leading-none">
              #{row.original.queuePosition}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const appointment = row.original;
        const canConfirmArrival = appointment.status === "SCHEDULED";
        const canReassign = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
        const canMarkNoShow =
          appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";

        return (
          <div className="flex items-center gap-2">
            {canConfirmArrival && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={() => handleConfirmArrival(appointment.id, appointment.locationId)}
                disabled={activeActionId === appointment.id}
              >
                {activeActionId === appointment.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <UserCheck className="size-3 mr-1" />
                )}
                Confirm
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => dispatch({ type: "setSelectedAppointment", value: appointment })}>
                  <Eye className="mr-2 size-4" /> View Details
                </DropdownMenuItem>
                
                {canReassign && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">Reassign Doctor</DropdownMenuLabel>
                    {assignableDoctors.slice(0, 5).map((doc) => (
                      <DropdownMenuItem 
                        key={doc.id} 
                        disabled={doc.id === appointment.doctorId}
                        onClick={() => handleReassignDoctor(appointment.id, doc.id)}
                      >
                        <UserMinus className="mr-2 size-4" /> {doc.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                
                {canMarkNoShow && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleMarkNoShow(appointment.id)}
                      disabled={activeActionId === appointment.id}
                    >
                      Mark No Show
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardPageShell className="p-4 md:p-6">
      <DashboardPageHeader
        eyebrow="Reception Appointments"
        title="Reception Queue Workspace"
        description="Unified workspace for appointment management, queue flow, and doctor reassignment."
        meta={`Showing ${filteredAppointments.length} of ${appointments.length} appointments`}
        actionsSlot={
          <Button asChild variant="outline">
            <Link href="/receptionist/check-in" prefetch={false}>
              <QrCode className="size-4 mr-2" />
              QR Check-In
            </Link>
          </Button>
        }
      />

      <div id="appointment-manager">
        <AppointmentManager
          isAdminView={true}
          appointmentsData={appointmentsData}
          isAppointmentsPending={showAppointmentsSkeleton}
          isAppointmentsFetching={isFetching}
          {...(clinicId ? { clinicId } : {})}
        />
      </div>


      <div className="flex flex-col gap-y-6">
        <div>
          <Card>
            <CardHeader className="flex flex-col gap-y-3 border-b bg-muted/40 dark:bg-muted/20 px-4 py-3">
              {/* Row 1: Title + Live badge */}
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base font-bold inline-flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Calendar className="size-4 text-emerald-600" />
                  </div>
                  Appointment Queue Workspace
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-3 py-1.5 rounded-full border border-border shadow-sm shrink-0">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </div>
              </div>

              {/* Row 2: Search + filters in one scrollable row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {/* Search */}
                <div className="relative w-full sm:w-52 sm:shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search patient, doctor..."
                    className="pl-8 h-9 text-sm border-border bg-background focus:ring-emerald-500/20"
                    value={searchTerm}
                    onChange={(e) => dispatch({ type: "setSearchTerm", value: e.target.value })}
                  />
                </div>

                {/* Status */}
                <Select value={statusFilter} onValueChange={(value) => dispatch({ type: "setStatusFilter", value })}>
                  <SelectTrigger className="h-9 w-full border-border bg-background text-sm sm:w-[130px] sm:shrink-0">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortOrder} onValueChange={(value) => dispatch({ type: "setSortOrder", value })}>
                  <SelectTrigger className="h-9 w-full border-border bg-background text-sm sm:w-[130px] sm:shrink-0">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Latest first</SelectItem>
                    <SelectItem value="date-asc">Earliest first</SelectItem>
                    <SelectItem value="patient-asc">Patient A–Z</SelectItem>
                    <SelectItem value="patient-desc">Patient Z–A</SelectItem>
                  </SelectContent>
                </Select>

                {/* Queue */}
                <Select value={queueFilter} onValueChange={(value) => dispatch({ type: "setQueueFilter", value })}>
                  <SelectTrigger className="h-9 w-full border-border bg-background text-sm sm:w-[120px] sm:shrink-0">
                    <SelectValue placeholder="All Queues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queues</SelectItem>
                    {availableQueueTypes.map((queueType) => (
                      <SelectItem key={queueType} value={queueType}>{queueType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Location (only if not assigned) */}
                {!assignedLocationId && locations.length > 1 && (
                  <Select
                    value={selectedLocationId || "all"}
                    onValueChange={(val) => dispatch({ type: "setSelectedLocationId", value: val === "all" ? null : val })}
                  >
                    <SelectTrigger className="h-9 w-full border-border bg-background text-sm sm:w-[130px] sm:shrink-0">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {(locations as any[]).map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name || loc.address || "Location"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-between text-sm px-3 border-border bg-background gap-1.5 font-normal sm:w-auto sm:shrink-0">
                      <Calendar className="size-3.5 text-emerald-500" />
                      {selectedCalendarDate ? format(selectedCalendarDate, "dd MMM yyyy") : "All dates"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <DateCalendar
                      mode="single"
                      selected={selectedCalendarDate}
                      onSelect={(date) => {
                        if (!date) {
                          dispatch({ type: "setSelectedDate", value: "" });
                          return;
                        }
                        dispatch({ type: "setSelectedDate", value: format(date, "yyyy-MM-dd") });
                      }}
                    />
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => dispatch({ type: "setSelectedDate", value: "" })}
                      >
                        Clear date filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <DataTable 
                columns={columns} 
                data={filteredAppointments} 
                pageSize={10}
                compact
                scrollable
              />
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60 shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-blue-600/10 flex items-center justify-center">
                  <Stethoscope className="size-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Active Doctor Queues
                    {doctorBacklog.length > 0 && (
                      <span className="ml-3 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
                        {doctorBacklog.length} Active
                      </span>
                    )}
                  </CardTitle>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">Real-time clinical workload and patient flow</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {doctorBacklog.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 py-10 text-muted-foreground">
                <Stethoscope className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No active doctor queues at the moment</p>
              </div>
            ) : (
              <DataTable
                columns={doctorQueueColumns}
                data={doctorBacklog}
                pageSize={9}
                emptyMessage="No active doctor queues at the moment"
                compact
                scrollable
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedAppointment}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "setSelectedAppointment", value: null });
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment ? (
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Patient</p>
                <p className="font-medium">{selectedAppointment.patientName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedAppointment.patientPhone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Doctor</p>
                <p className="font-medium">{selectedAppointment.doctorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Schedule</p>
                <p className="font-medium">{selectedAppointment.dateLabel} at {selectedAppointment.timeLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge className={STATUS_STYLES[selectedAppointment.status] || STATUS_STYLES.SCHEDULED}>
                  {selectedAppointment.status.replace("_", " ")}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <Badge className={selectedAppointment.paymentCompleted
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}>
                  {selectedAppointment.paymentCompleted ? "Payment verified" : "Payment pending"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Queue</p>
                <p className="font-medium">
                  {selectedAppointment.queueType}
                  {selectedAppointment.queuePosition ? `, position ${selectedAppointment.queuePosition}` : ""}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estimated Wait</p>
                <p className="font-medium">{selectedAppointment.waitLabel}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium">{selectedAppointment.notes || "No notes provided"}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}


