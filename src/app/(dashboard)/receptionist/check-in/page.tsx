"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Stethoscope,
  X,
  History as HistoryIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useAppointments,
  useCheckInLocations,
  useCheckInHistory,
  useForceCheckInAppointment,
} from "@/hooks/query/useAppointments";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  getAppointmentStatusDisplayName,
  getReceptionistAppointmentDateLabel,
  getReceptionistAppointmentTimeLabel,
  parseReceptionistAppointmentDateTime,
} from "@/lib/utils/appointmentUtils";
import { getAppointmentViewState } from "@/lib/utils/appointmentUtils";
import { formatDateInIST, formatISODateInIST, formatTimeInIST } from "@/lib/utils/date-time";


interface AppointmentListItem {
  id: string;
  locationId?: string;
  status?: string;
  type?: string;
  date?: string;
  appointmentDate?: string;
  startTime?: string;
  time?: string;
  payment?: { status?: string };
  checkedInAt?: string | null;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  patient?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  };
  doctor?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

interface CheckInRow {
  id: string;
  locationId?: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  dateLabel: string;
  timeLabel: string;
  status: string;
  paymentStatus: string;
  canCheckIn: boolean;
  isConfirmedArrival: boolean;
}

interface CheckInHistoryRow {
  id: string;
  patientName: string;
  doctorName: string;
  locationName: string;
  appointmentDateLabel: string;
  appointmentTimeLabel: string;
  checkedInAtLabel: string;
  checkInMethod: string;
  status: string;
  paymentStatus: string;
}

interface CheckInHistoryItem {
  id: string;
  patientId?: string;
  doctorId?: string;
  locationId?: string;
  type?: string;
  status?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  checkedInAt?: string;
  locationName?: string;
  patientName?: string;
  doctorName?: string;
  checkInMethod?: "MANUAL" | "QR" | string;
  paymentStatus?: string;
  notes?: string | null;
}

const getTodayDateInIst = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const addIstDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const createIstDate = (dateKey: string) => new Date(`${dateKey}T00:00:00+05:30`);

const CHECK_IN_LOADING_VIEW = (
  <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-border bg-card p-6">
    <Loader2 className="size-10 animate-spin text-emerald-600 dark:text-emerald-300" />
  </div>
);

const getPersonName = (
  entity?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    user?: {
      name?: string;
      firstName?: string;
      lastName?: string;
    };
  },
  fallbackName?: string
) =>
  fallbackName ||
  entity?.name ||
  entity?.user?.name ||
  `${entity?.firstName || entity?.user?.firstName || ""} ${entity?.lastName || entity?.user?.lastName || ""}`.trim() ||
  "";

const getPatientPhone = (appointment: AppointmentListItem) =>
  appointment.patientPhone || appointment.patient?.phone || appointment.patient?.user?.phone || "";

const getCheckInHistoryAppointments = (data: unknown): CheckInHistoryItem[] => {
  if (Array.isArray(data)) {
    return data as CheckInHistoryItem[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const record = data as { appointments?: unknown; data?: unknown };
  if (Array.isArray(record.appointments)) {
    return record.appointments as CheckInHistoryItem[];
  }

  if (Array.isArray(record.data)) {
    return record.data as CheckInHistoryItem[];
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as { appointments?: unknown };
    if (Array.isArray(nested.appointments)) {
      return nested.appointments as CheckInHistoryItem[];
    }
  }

  return [];
};

type ReceptionistCheckInState = {
  searchTerm: string;
  activeTab: "upcoming" | "history";
  selectedDates: Date[];
  checkingInId: string | null;
  confirmedAppointmentIds: string[];
};

type ReceptionistCheckInAction =
  | { type: "setSearchTerm"; value: string }
  | { type: "setActiveTab"; value: "upcoming" | "history" }
  | { type: "setSelectedDates"; value: Date[] }
  | { type: "setCheckingInId"; value: string | null }
  | { type: "addConfirmedAppointmentId"; value: string };

const initialReceptionistCheckInState: ReceptionistCheckInState = {
  searchTerm: "",
  activeTab: "upcoming",
  selectedDates: [],
  checkingInId: null,
  confirmedAppointmentIds: [],
};

function receptionistCheckInReducer(
  state: ReceptionistCheckInState,
  action: ReceptionistCheckInAction
): ReceptionistCheckInState {
  switch (action.type) {
    case "setSearchTerm":
      return { ...state, searchTerm: action.value };
    case "setActiveTab":
      return { ...state, activeTab: action.value };
    case "setSelectedDates":
      return { ...state, selectedDates: action.value };
    case "setCheckingInId":
      return { ...state, checkingInId: action.value };
    case "addConfirmedAppointmentId":
      return state.confirmedAppointmentIds.includes(action.value)
        ? state
        : {
            ...state,
            confirmedAppointmentIds: [...state.confirmedAppointmentIds, action.value],
          };
    default:
      return state;
  }
}


export default function ReceptionistCheckInPage() {
  const { session } = useAuth();
  useWebSocketQuerySync();
  const { clinicId } = useClinicContext();
  const [
    {
      searchTerm,
      activeTab,
      selectedDates,
      checkingInId,
      confirmedAppointmentIds,
    },
    dispatch,
  ] = useReducer(receptionistCheckInReducer, initialReceptionistCheckInState);

  const setSearchTerm = useCallback((value: string) => {
    dispatch({ type: "setSearchTerm", value });
  }, []);

  const setActiveTab = useCallback((value: "upcoming" | "history") => {
    dispatch({ type: "setActiveTab", value });
  }, []);

  const setSelectedDates = useCallback((value: Date[]) => {
    dispatch({ type: "setSelectedDates", value });
  }, []);

  const setCheckingInId = useCallback((value: string | null) => {
    dispatch({ type: "setCheckingInId", value });
  }, []);
  const todayDate = getTodayDateInIst();
  const todayDisplayDate = useMemo(
    () =>
      formatDateInIST(createIstDate(todayDate), {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [todayDate]
  );
  const { data: checkInLocationsData, isPending: isCheckInLocationsLoading } = useCheckInLocations();
  const { data: checkInHistoryData, isPending: isCheckInHistoryLoading } = useCheckInHistory();
  const selectedDatesSorted = useMemo(
    () => selectedDates.toSorted((left, right) => left.getTime() - right.getTime()),
    [selectedDates]
  );
  const selectedDateKeys = useMemo(
    () => new Set(selectedDatesSorted.map((date) => formatISODateInIST(date))),
    [selectedDatesSorted]
  );
  const earliestSelectedDate = selectedDatesSorted[0];
  const queryStartDate = earliestSelectedDate ? formatISODateInIST(earliestSelectedDate) : todayDate;
  const checkInMutation = useForceCheckInAppointment();
  const updateSelectedDates = useCallback((dates: Date[]) => {
    const unique = Array.from(
      new Map(dates.map((date) => [formatISODateInIST(date), date])).values()
    );
    setSelectedDates(unique.toSorted((left, right) => left.getTime() - right.getTime()));
  }, [setSelectedDates]);

  const applyPreset = useCallback((preset: "today" | "tomorrow" | "week" | "clear") => {
    const today = createIstDate(todayDate);
    if (preset === "clear") {
      setSelectedDates([]);
      return;
    }
    if (preset === "today") {
      setSelectedDates([today]);
      return;
    }
    if (preset === "tomorrow") {
      setSelectedDates([addIstDays(today, 1)]);
      return;
    }
    if (preset === "week") {
      setSelectedDates(Array.from({ length: 7 }, (_, index) => addIstDays(today, index)));
    }
  }, [setSelectedDates, todayDate]);
  const assignedLocationId = useMemo(() => {
    const user = session?.user as Record<string, unknown> | undefined;
    const candidate =
      (typeof user?.locationId === "string" ? user.locationId : "") ||
      (typeof user?.clinicLocationId === "string" ? user.clinicLocationId : "") ||
      (typeof user?.assignedLocationId === "string" ? user.assignedLocationId : "");
    return candidate || null;
  }, [session?.user]);

  const hasCheckInLocationForAssignedLocation = useMemo(() => {
    if (isCheckInLocationsLoading) {
      return true;
    }

    if (!assignedLocationId) {
      return true;
    }

    const checkInLocations = Array.isArray(checkInLocationsData) ? checkInLocationsData : [];

    return checkInLocations.some((location) => {
      if (!location || typeof location !== "object") {
        return false;
      }

      const record = location as Record<string, unknown>;
      const linkedLocationId = String(record.locationId || record.clinicLocationId || record.location || "");
      const checkInLocationId = String(record.id || "");
      const isActive = record.isActive === undefined ? true : Boolean(record.isActive);

      return isActive && (linkedLocationId === assignedLocationId || checkInLocationId === assignedLocationId);
    });
  }, [assignedLocationId, checkInLocationsData, isCheckInLocationsLoading]);
  const { data: appointmentsData, isPending: isLoading, refetch } = useAppointments({
    ...(clinicId ? { clinicId } : {}),
    startDate: queryStartDate,
    ...(assignedLocationId ? { locationId: assignedLocationId } : {}),
    limit: 400,
  });

  const appointments: AppointmentListItem[] = useMemo(
    () =>
      Array.isArray(appointmentsData)
        ? appointmentsData
        : appointmentsData?.appointments || [],
    [appointmentsData]
  );

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((apt) => {
          const patientName = getPersonName(apt.patient, apt.patientName);
          const doctorName = getPersonName(apt.doctor, apt.doctorName);
          const patientPhone = getPatientPhone(apt);
          const normalizedSearch = searchTerm.toLowerCase();
          const rowLocationId = apt.locationId || assignedLocationId || undefined;
          const viewState = getAppointmentViewState(apt);
          const parsedDate = parseReceptionistAppointmentDateTime(apt as unknown as Record<string, unknown>);
          const appointmentDateKey = parsedDate ? formatISODateInIST(parsedDate) : "";

          const matchesLocation =
            (!assignedLocationId || rowLocationId === assignedLocationId) &&
            hasCheckInLocationForAssignedLocation;
          const matchesSelectedDates =
            selectedDateKeys.size === 0 ||
            (appointmentDateKey ? selectedDateKeys.has(appointmentDateKey) : false);

          return (
            !viewState.isVideo &&
            matchesLocation &&
            matchesSelectedDates &&
            (
              !searchTerm ||
              patientName.toLowerCase().includes(normalizedSearch) ||
              doctorName.toLowerCase().includes(normalizedSearch) ||
              patientPhone.includes(searchTerm)
            )
          );
        })
        .sort((left, right) => {
          const leftSort = parseReceptionistAppointmentDateTime(left as unknown as Record<string, unknown>)?.getTime() ?? 0;
          const rightSort = parseReceptionistAppointmentDateTime(right as unknown as Record<string, unknown>)?.getTime() ?? 0;
          return rightSort - leftSort;
        }),
    [appointments, assignedLocationId, hasCheckInLocationForAssignedLocation, searchTerm, selectedDateKeys]
  );

  const checkInRows = useMemo<CheckInRow[]>(
    () =>
      filteredAppointments.map((apt) => {
        const viewState = getAppointmentViewState(apt);
        const status = apt.status || "Scheduled";
        const normalizedStatus = String(status).toUpperCase();
        const rowLocationId = apt.locationId || assignedLocationId || undefined;
        const isRecentlyCheckedIn = confirmedAppointmentIds.includes(apt.id);
        const isConfirmedArrival = isRecentlyCheckedIn || Boolean(apt.checkedInAt);
        const canUseCheckIn = !isCheckInLocationsLoading && hasCheckInLocationForAssignedLocation;

        return {
          id: apt.id,
          ...(rowLocationId ? { locationId: rowLocationId } : {}),
          patientName: getPersonName(apt.patient, apt.patientName) || "Unknown",
          patientPhone: getPatientPhone(apt),
          doctorName: getPersonName(apt.doctor, apt.doctorName) || "Unknown",
          dateLabel: getReceptionistAppointmentDateLabel(apt as unknown as Record<string, unknown>),
          timeLabel: getReceptionistAppointmentTimeLabel(apt as unknown as Record<string, unknown>),
          status,
          paymentStatus: viewState.paymentStatus,
          canCheckIn:
            canUseCheckIn &&
            !isConfirmedArrival &&
            ["SCHEDULED", "CONFIRMED"].includes(normalizedStatus),
          isConfirmedArrival,
        };
      }),
    [assignedLocationId, confirmedAppointmentIds, filteredAppointments, hasCheckInLocationForAssignedLocation, isCheckInLocationsLoading]
  );

  const historyAppointments = useMemo(
    () => getCheckInHistoryAppointments(checkInHistoryData),
    [checkInHistoryData]
  );

  const historyRows = useMemo<CheckInHistoryRow[]>(
    () =>
      historyAppointments.toSorted((left, right) => {
          const leftCheckedInAt = left.checkedInAt ? new Date(left.checkedInAt).getTime() : 0;
          const rightCheckedInAt = right.checkedInAt ? new Date(right.checkedInAt).getTime() : 0;
          return rightCheckedInAt - leftCheckedInAt;
        })
        .map((item) => {
          const appointmentDateTime = parseReceptionistAppointmentDateTime(
            item as unknown as Record<string, unknown>
          );
          const checkedInAt = item.checkedInAt ? new Date(item.checkedInAt) : null;
          const validCheckedInAt = checkedInAt && !Number.isNaN(checkedInAt.getTime()) ? checkedInAt : null;

          return {
            id: item.id,
            patientName: item.patientName || "Unknown",
            doctorName: item.doctorName || "Unknown",
            locationName: item.locationName || "Unknown location",
            appointmentDateLabel: appointmentDateTime
              ? formatDateInIST(appointmentDateTime, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Unknown",
            appointmentTimeLabel: appointmentDateTime ? formatTimeInIST(appointmentDateTime) : "--",
            checkedInAtLabel: validCheckedInAt
              ? `${formatDateInIST(validCheckedInAt, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}, ${formatTimeInIST(validCheckedInAt)}`
              : "--",
            checkInMethod: item.checkInMethod || "MANUAL",
            status: item.status || "CONFIRMED",
            paymentStatus: item.paymentStatus || "N_A",
          };
        }),
    [historyAppointments]
  );

  const filteredHistoryRows = useMemo(
    () =>
      historyRows.filter((row) => {
        const normalizedSearch = searchTerm.toLowerCase();
        if (!normalizedSearch) {
          return true;
        }

        return (
          row.patientName.toLowerCase().includes(normalizedSearch) ||
          row.doctorName.toLowerCase().includes(normalizedSearch) ||
          row.locationName.toLowerCase().includes(normalizedSearch) ||
          row.checkInMethod.toLowerCase().includes(normalizedSearch) ||
          row.status.toLowerCase().includes(normalizedSearch) ||
          row.paymentStatus.toLowerCase().includes(normalizedSearch)
        );
      }),
    [historyRows, searchTerm]
  );

  const historyColumns = useMemo<ColumnDef<CheckInHistoryRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.patientName}</div>
            <div className="text-xs text-muted-foreground">{row.original.locationName}</div>
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-muted-foreground" />
            <span>{row.original.doctorName}</span>
          </div>
        ),
      },
      {
        id: "appointment",
        header: "Appointment",
        cell: ({ row }) => (
          <div className="gap-y-0.5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span>{row.original.appointmentDateLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>{row.original.appointmentTimeLabel}</span>
            </div>
          </div>
        ),
      },
      {
        id: "checkedInAt",
        header: "Checked In",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <HistoryIcon className="size-4 text-muted-foreground" />
            <span>{row.original.checkedInAtLabel}</span>
          </div>
        ),
      },
      {
        accessorKey: "checkInMethod",
        header: "Source",
        cell: ({ row }) => (
          <Badge
            variant={row.original.checkInMethod === "QR" ? "default" : "secondary"}
            className={
              row.original.checkInMethod === "QR"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none shadow-none"
            }
          >
            {row.original.checkInMethod === "QR" ? "QR" : "Manual"}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{row.original.paymentStatus}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="default"
            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none"
          >
            Arrived
          </Badge>
        ),
      },
    ],
    []
  );

  const handleCheckIn = useCallback(async (appointmentId: string, locationId?: string) => {
    const locationToSend = assignedLocationId || locationId;
    if (!locationToSend) {
      showErrorToast("Reception location is required for manual check-in.", {
        id: TOAST_IDS.APPOINTMENT.CHECK_IN,
      });
      return;
    }
    setCheckingInId(appointmentId);
    try {
      await checkInMutation.mutateAsync({
        appointmentId,
        reason: "Reception desk manual check-in for this location",
        ...(locationToSend ? { locationId: locationToSend } : {}),
      });
      dispatch({ type: "addConfirmedAppointmentId", value: appointmentId });
      await refetch?.();
    } catch (error) {
      // The mutation hook already emits the canonical error toast.
      // Keep the catch for control flow only, so the UI does not double-toast.
    } finally {
      setCheckingInId(null);
    }
  }, [assignedLocationId, checkInMutation, refetch, setCheckingInId]);

  const columns = useMemo<ColumnDef<CheckInRow>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.patientName}</div>
            {row.original.patientPhone ? (
              <div className="text-xs text-muted-foreground">{row.original.patientPhone}</div>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-muted-foreground" />
            <span>{row.original.doctorName}</span>
          </div>
        ),
      },
      {
        accessorKey: "dateLabel",
        header: "Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span>{row.original.dateLabel}</span>
          </div>
        ),
      },
      {
        accessorKey: "timeLabel",
        header: "Time",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span>{row.original.timeLabel}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isConfirmedArrival ? "default" : "secondary"}
            className={
              row.original.isConfirmedArrival
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none shadow-none"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-none shadow-none"
            }
          >
            {row.original.isConfirmedArrival
              ? "Arrived"
              : getAppointmentStatusDisplayName(row.original.status || "")}
          </Badge>
        ),
      },
      {
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{row.original.paymentStatus}</Badge>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.canCheckIn ? (
              <Button
                size="sm"
                onClick={() => handleCheckIn(row.original.id, row.original.locationId)}
                disabled={checkingInId === row.original.id}
              >
                {checkingInId === row.original.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 size-4" />
                    Confirm Arrival
                  </>
                )}
              </Button>
            ) : row.original.isConfirmedArrival ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
                Arrived
              </span>
            ) : !hasCheckInLocationForAssignedLocation ? (
              <span className="text-sm text-amber-600 dark:text-amber-300">Setup required</span>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
    ],
    [checkingInId, handleCheckIn, hasCheckInLocationForAssignedLocation]
  );

  const headerMeta = useMemo(
    () => (
      <span
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
        suppressHydrationWarning
      >
        <CalendarIcon className="size-4 text-emerald-500" />
        {todayDisplayDate}
      </span>
    ),
    [todayDisplayDate]
  );

  return isLoading ? (
    CHECK_IN_LOADING_VIEW
  ) : (
    <DashboardPageShell className="p-6">
      <DashboardPageHeader
        eyebrow="Reception Check-In"
        title="Patient Arrival Confirmation"
        description="Confirm today&apos;s and upcoming in-person arrivals. Use the calendar to select one date or multiple dates before moving patients into the consultation flow."
        meta={headerMeta}
      />

      <Card>
        <CardContent className="gap-y-3 pt-4 sm:gap-y-4 sm:pt-5">
          {isCheckInLocationsLoading ? (
            <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Checking manual check-in setup…
            </div>
          ) : !hasCheckInLocationForAssignedLocation ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              Manual check-in is not configured for this location yet. Ask the clinic admin to create or link a check-in location for this branch.
            </div>
          ) : null}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, doctor, or phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "upcoming" | "history")}
            className="gap-y-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="upcoming" className="min-w-0 flex-1 sm:flex-none">
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="history" className="min-w-0 flex-1 sm:flex-none">
                  <HistoryIcon className="mr-1.5 size-4" />
                  History
                </TabsTrigger>
              </TabsList>
              <p className="text-xs text-muted-foreground">
                {activeTab === "history"
                  ? `${filteredHistoryRows.length} historical arrivals`
                  : `${checkInRows.length} upcoming arrivals`}
              </p>
            </div>

            <TabsContent value="upcoming" className="gap-y-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 sm:p-3.5">
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="gap-y-1">
                      <p className="text-sm font-semibold">Filter by date</p>
                      <p className="text-xs text-muted-foreground">
                        Pick one or more dates to narrow the manual check-in list.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("today")} className="h-8 px-3 text-xs">
                        Today
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("tomorrow")} className="h-8 px-3 text-xs">
                        Tomorrow
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => applyPreset("week")} className="h-8 px-3 text-xs">
                        This week
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset("clear")} className="h-8 px-3 text-xs">
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between gap-2 sm:w-[240px] sm:justify-start"
                        >
                          <span className="inline-flex items-center gap-2">
                            <CalendarIcon className="size-4" />
                            <span>{selectedDatesSorted.length > 0 ? "Selected dates" : "Select dates"}</span>
                            {selectedDatesSorted.length > 0 ? (
                              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                {selectedDatesSorted.length}
                              </span>
                            ) : null}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={8}
                        className="w-[calc(100vw-1rem)] max-w-[19rem] overflow-hidden p-0 sm:w-auto sm:max-w-none"
                      >
                        <CalendarPicker
                          mode="multiple"
                          selected={selectedDatesSorted}
                          onSelect={(dates) => updateSelectedDates(dates || [])}
                          initialFocus
                          numberOfMonths={1}
                          showOutsideDays={false}
                          captionLayout="label"
                          className="rounded-none border-0 bg-transparent p-1.5 sm:p-2 [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)]"
                          classNames={{
                            root: "w-full max-w-full",
                            months: "flex flex-col gap-2",
                            month: "flex w-full flex-col gap-3",
                            nav: "flex items-center justify-between gap-1 px-1",
                            month_caption: "flex items-center justify-center h-8",
                            caption_label: "select-none font-semibold text-sm",
                            weekdays: "flex",
                            weekday: "text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 flex-1 rounded-md",
                            week: "flex w-full mt-2",
                            day: "relative w-full h-full p-0 text-center aspect-square select-none",
                            table: "w-full border-collapse border-spacing-0",
                          }}
                        />
                      </PopoverContent>
                    </Popover>

                    {selectedDatesSorted.length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDates([])}
                        className="w-full sm:w-auto"
                      >
                        Clear selected dates
                      </Button>
                    ) : null}
                  </div>

                  {selectedDatesSorted.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDatesSorted.map((date) => {
                        const key = formatISODateInIST(date);
                        return (
                          <Badge
                            key={key}
                            variant="secondary"
                            className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs"
                          >
                            <span>{formatDateInIST(date, { day: "2-digit", month: "short", year: "numeric" })}</span>
                            <button
                              type="button"
                              aria-label={`Remove ${formatDateInIST(date, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}`}
                              className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                              onClick={() =>
                                setSelectedDates(
                                  selectedDates.filter((item) => formatISODateInIST(item) !== key)
                                )
                              }
                            >
                              <X className="size-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <DataTable
                columns={columns}
                data={checkInRows}
                emptyMessage="No appointments found"
                pageSize={10}
                compact
              />
            </TabsContent>

            <TabsContent value="history" className="gap-y-3">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                Historical arrivals are sorted by check-in time. Source shows whether the arrival came from manual check-in or QR scan.
              </div>

              <DataTable
                columns={historyColumns}
                data={filteredHistoryRows}
                emptyMessage={isCheckInHistoryLoading ? "Loading check-in history…" : "No check-in history found"}
                pageSize={10}
                compact
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}





