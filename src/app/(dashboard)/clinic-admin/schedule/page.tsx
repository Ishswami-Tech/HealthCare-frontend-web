"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import type { Reducer } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext, useMyClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import {
  useDoctors,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
} from "@/hooks/query/useDoctors";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  CheckCircle,
  Loader2,
  Plus,
  Save,
  Stethoscope,
  Trash2,
} from "lucide-react";
import {
  showSuccessToast,
  showErrorToast,
  TOAST_IDS,
} from "@/hooks/utils/use-toast";

type DoctorScheduleDay = {
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
  slotDuration: number;
};

type DoctorScheduleRecord = {
  id: string;
  doctorName: string;
  specialization: string;
  schedules: DoctorScheduleDay[];
};

type HolidayRecord = {
  id: string;
  date: string;
  title: string;
  type: string;
};

function normalizeHolidayDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeHolidayRecords(value: unknown): HolidayRecord[] {
  const source = Array.isArray(value) ? value : [];
  return source.flatMap((entry, index) => {
    if (typeof entry === "string") {
      const date = normalizeHolidayDate(entry);
      return date
        ? [{ id: `${date}-${index}`, date, title: "Clinic Closure", type: "Clinic Closure" }]
        : [];
    }

    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const record = entry as Record<string, unknown>;
      const date = normalizeHolidayDate(record.date);
      if (!date) {
        return [];
      }

      return [
        {
          id: String(record.id ?? `${date}-${index}`),
          date,
          title: String(record.title ?? "Clinic Closure"),
          type: String(record.type ?? "Clinic Closure"),
        },
      ];
    }

    return [];
  });
}

const WEEKDAY_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const DEFAULT_SCHEDULE: DoctorScheduleDay[] = [
  {
    day: "Monday",
    startTime: "09:00",
    endTime: "17:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Tuesday",
    startTime: "09:00",
    endTime: "17:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Wednesday",
    startTime: "09:00",
    endTime: "17:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Thursday",
    startTime: "09:00",
    endTime: "17:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Friday",
    startTime: "09:00",
    endTime: "17:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Saturday",
    startTime: "09:00",
    endTime: "13:00",
    available: true,
    slotDuration: 15,
  },
  {
    day: "Sunday",
    startTime: "",
    endTime: "",
    available: false,
    slotDuration: 15,
  },
];

const COMPACT_CARD_PADDING = "gap-4 py-4";
const COMPACT_CARD_HEADER = "px-4 sm:px-5";
const COMPACT_CARD_CONTENT = "px-4 sm:px-5";
const DOCTOR_CARD_CLASS = `${COMPACT_CARD_PADDING} border-indigo-200 bg-indigo-50/70 shadow-sm dark:border-indigo-900/70 dark:bg-indigo-950/20`;
const SCHEDULER_CARD_CLASS = `${COMPACT_CARD_PADDING} border-indigo-200 bg-indigo-50/70 shadow-sm dark:border-indigo-900/70 dark:bg-indigo-950/20`;
const INFO_CARD_CLASS = `${COMPACT_CARD_PADDING} border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20`;
const HOLIDAY_CARD_CLASS = `${COMPACT_CARD_PADDING} border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20`;
const CONFLICT_CARD_CLASS = `${COMPACT_CARD_PADDING} border-rose-200 bg-rose-50/70 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/20`;
const ALERT_CARD_CLASS = `${COMPACT_CARD_PADDING} border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20`;
const SELECT_DOCTOR_TRIGGER_CLASS =
  "h-10 border-emerald-200 bg-emerald-50/80 text-foreground shadow-sm ring-emerald-200 transition hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30";
const TIME_INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-md border border-indigo-200 bg-white px-3 text-sm font-medium leading-none tabular-nums shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200/70 dark:border-indigo-900/70 dark:bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-hour-field]:px-0.5 [&::-webkit-datetime-edit-minute-field]:px-0.5 [&::-webkit-datetime-edit-ampm-field]:px-1";

const SCHEDULE_LOADING_VIEW = (
  <DashboardPageShell className="mx-auto max-w-7xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-border bg-card shadow-sm">
      <Loader2 className="size-8 animate-spin text-emerald-600" />
    </div>
  </DashboardPageShell>
);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// --- Holiday Reducer ---
type NewHolidayState = { date: string; title: string; type: string };
type HolidayAction =
  | { type: "SET_HOLIDAYS"; holidays: HolidayRecord[] }
  | { type: "ADD_HOLIDAY"; holiday: HolidayRecord }
  | { type: "REMOVE_HOLIDAY"; id: string }
  | { type: "UPDATE_NEW_HOLIDAY"; field: keyof NewHolidayState; value: string }
  | { type: "RESET_NEW_HOLIDAY" };

function holidayReducer(state: { holidays: HolidayRecord[]; newHoliday: NewHolidayState }, action: HolidayAction) {
  switch (action.type) {
    case "SET_HOLIDAYS":
      return { ...state, holidays: action.holidays };
    case "ADD_HOLIDAY":
      return { ...state, holidays: [...state.holidays, action.holiday] };
    case "REMOVE_HOLIDAY":
      return { ...state, holidays: state.holidays.filter((h) => h.id !== action.id) };
    case "UPDATE_NEW_HOLIDAY":
      return { ...state, newHoliday: { ...state.newHoliday, [action.field]: action.value } };
    case "RESET_NEW_HOLIDAY":
      return { ...state, newHoliday: { date: "", title: "", type: "Public Holiday" } };
    default:
      return state;
  }
}

const initialHolidayState = {
  holidays: [] as HolidayRecord[],
  newHoliday: { date: "", title: "", type: "Public Holiday" } as NewHolidayState,
};

const toTime = (value: unknown, fallback: string) =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim())
    ? value.trim()
    : fallback;

const toSlotDuration = (value: unknown, fallback: number) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
};

function buildDefaultSchedule(): DoctorScheduleDay[] {
  return DEFAULT_SCHEDULE.map((slot) => ({ ...slot }));
}

const normalizeTime = (value: unknown, fallback: string) =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim())
    ? value.trim()
    : fallback;

function calculateSlots(schedule: DoctorScheduleDay) {
  if (!schedule.available || !schedule.startTime || !schedule.endTime) {
    return 0;
  }

  const start = new Date(`2024-01-01T${schedule.startTime}:00`);
  const end = new Date(`2024-01-01T${schedule.endTime}:00`);
  const diff = end.getTime() - start.getTime();
  if (!Number.isFinite(diff) || diff <= 0) {
    return 0;
  }

  return Math.max(0, Math.floor(diff / (1000 * 60) / schedule.slotDuration));
}

function normalizeDoctors(value: unknown): DoctorScheduleRecord[] {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.doctors)
    ? value.doctors
    : [];

  return source.map((doctor: any) => {
    const doctorSchedule = isRecord(doctor.schedule)
      ? doctor.schedule
      : isRecord(doctor.data)
      ? doctor.data
      : null;
    const schedules = Array.isArray(doctorSchedule?.schedules)
      ? doctorSchedule.schedules
      : Array.isArray(doctorSchedule?.weeklySchedule)
      ? doctorSchedule.weeklySchedule
      : [];

    return {
      id: String(doctor.id ?? ""),
      doctorName:
        doctor.name ||
        `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() ||
        "Doctor",
      specialization:
        doctor.specialization || doctor.specializations?.[0] || "General",
      schedules:
        schedules.length > 0
          ? schedules.map((schedule: any) => ({
              day: String(schedule.day ?? ""),
              startTime: toTime(schedule.startTime, "09:00"),
              endTime: toTime(schedule.endTime, "17:00"),
              available: Boolean(schedule.available ?? schedule.isAvailable),
              slotDuration: toSlotDuration(schedule.slotDuration, 15),
            }))
          : buildDefaultSchedule(),
    };
  });
}

function sanitizeSchedulePayload(schedules: DoctorScheduleDay[]) {
  return schedules.map((schedule) => ({
    dayOfWeek: WEEKDAY_ORDER.indexOf(schedule.day as (typeof WEEKDAY_ORDER)[number]),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    isAvailable: schedule.available,
  }));
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card className="border-border bg-card/90 shadow-sm">
      <CardContent className="gap-y-1 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function ClinicAdminSchedule() {
  useAuth();
  const { clinicId } = useClinicContext();
  const scheduleWritesSupported = !!clinicId;
  const { data: clinic } = useMyClinic();

  const { data: doctorsData, isPending: isPendingDoctors } = useDoctors(
    clinicId || "",
    {}
  );

  useWebSocketQuerySync();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const { data: scheduleData } = useDoctorSchedule(
    clinicId || "",
    selectedDoctorId || "",
    undefined
  );

  const updateScheduleMutation = useUpdateDoctorSchedule();
  const updateClinicMutation = useUpdateClinic();

  const doctors = useMemo(
    () => normalizeDoctors(doctorsData),
    [doctorsData]
  );

  const doctorSchedules = useMemo<DoctorScheduleRecord[]>(() => {
    if (!doctors.length) {
      return [];
    }

    return doctors.map((doctor) => {
      const doctorSchedule =
        scheduleData && selectedDoctorId === doctor.id ? scheduleData : null;
      const schedules = Array.isArray((doctorSchedule as any)?.schedules)
        ? (doctorSchedule as any).schedules
        : Array.isArray((doctorSchedule as any)?.weeklySchedule)
        ? (doctorSchedule as any).weeklySchedule
        : [];

      return {
        ...doctor,
        schedules:
          schedules.length > 0
            ? schedules.map((schedule: any) => ({
                day: String(schedule.day ?? ""),
                startTime: toTime(schedule.startTime, "09:00"),
                endTime: toTime(schedule.endTime, "17:00"),
                available: Boolean(schedule.available ?? schedule.isAvailable),
                slotDuration: toSlotDuration(schedule.slotDuration, 15),
              }))
            : buildDefaultSchedule(),
      };
    });
  }, [doctors, scheduleData, selectedDoctorId]);

  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, DoctorScheduleDay[]>>({});
  const localSchedules = useMemo<DoctorScheduleRecord[]>(
    () =>
      doctorSchedules.map((doctor) => ({
        ...doctor,
        schedules: scheduleDrafts[doctor.id] ?? doctor.schedules,
      })),
    [doctorSchedules, scheduleDrafts]
  );

  const selectedDoctor = useMemo(
    () =>
      localSchedules.find((doctor) => doctor.id === selectedDoctorId) ??
      localSchedules[0] ??
      null,
    [localSchedules, selectedDoctorId]
  );

  const [{ holidays: holidayList, newHoliday }, dispatchHolidays] = useReducer(holidayReducer, initialHolidayState);
  const [holidayDate, setHolidayDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const settings = isRecord(clinic?.settings) ? clinic.settings : null;
    const appointmentSettings = isRecord(settings?.appointmentSettings)
      ? settings?.appointmentSettings
      : null;
    if (!appointmentSettings) return;

    const parsed = normalizeHolidayRecords((appointmentSettings as Record<string, unknown>).holidayClosures);
    dispatchHolidays({ type: "SET_HOLIDAYS", holidays: parsed });
  }, [clinic]);

  const scheduleConflicts = useMemo(() => {
    return localSchedules.flatMap((doctor) =>
      doctor.schedules.flatMap((schedule) => {
        if (!schedule.available) {
          return [];
        }

        if (!schedule.startTime || !schedule.endTime) {
          return [
            {
              id: `${doctor.id}-${schedule.day}-missing-hours`,
              severity: "high" as const,
              title: "Missing Schedule Hours",
              message: `${doctor.doctorName} is marked available on ${schedule.day} but start or end time is missing.`,
            },
          ];
        }

        if (schedule.startTime >= schedule.endTime) {
          return [
            {
              id: `${doctor.id}-${schedule.day}-invalid-range`,
              severity: "high" as const,
              title: "Invalid Time Range",
              message: `${doctor.doctorName} has an invalid time range on ${schedule.day}. End time must be after start time.`,
            },
          ];
        }

        return [];
      })
    );
  }, [localSchedules]);

  const updateSchedule = (
    dayIndex: number,
    field: keyof DoctorScheduleDay,
    value: string | boolean | number
  ) => {
    if (!selectedDoctor) return;
    setScheduleDrafts((previousDrafts) => {
      const currentSchedules = previousDrafts[selectedDoctor.id] ?? selectedDoctor.schedules;
      const nextSchedules = currentSchedules.map((schedule, index) =>
        index === dayIndex ? ({ ...schedule, [field]: value } as DoctorScheduleDay) : schedule
      );

      return {
        ...previousDrafts,
        [selectedDoctor.id]: nextSchedules,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!scheduleWritesSupported) {
      showErrorToast("Schedule updates are not supported by the backend yet", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    if (!selectedDoctor) {
      showErrorToast("Please select a doctor", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    try {
      await updateScheduleMutation.mutateAsync({
        doctorId: selectedDoctor.id,
        schedule: sanitizeSchedulePayload(selectedDoctor.schedules),
        ...(clinicId ? { clinicId } : {}),
      });

      if (clinicId) {
        const baseSettings = isRecord(clinic?.settings) ? (clinic.settings as Record<string, unknown>) : {};
        const appointmentSettings = isRecord(baseSettings.appointmentSettings)
          ? (baseSettings.appointmentSettings as Record<string, unknown>)
          : {};
        const holidayClosures = holidayList.map((holiday) => ({
          date: holiday.date,
          title: holiday.title,
          type: holiday.type,
        }));

        await updateClinicMutation.mutateAsync({
          id: clinicId,
          data: {
            settings: {
              ...baseSettings,
              appointmentSettings: {
                ...appointmentSettings,
                holidayClosures,
                holidayDates: holidayClosures.map((holiday) => holiday.date),
              },
            },
          },
        });
      }

    } catch (error) {
      showErrorToast("Failed to update schedule", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      console.error(error);
    }
  };

  const addHoliday = () => {
    if (!newHoliday.date || !newHoliday.title) return;
    dispatchHolidays({
      type: "ADD_HOLIDAY",
      holiday: { id: Date.now().toString(), ...newHoliday },
    });
    dispatchHolidays({ type: "RESET_NEW_HOLIDAY" });
    setHolidayDate(undefined);
  };

  const removeHoliday = (id: string) => {
    dispatchHolidays({ type: "REMOVE_HOLIDAY", id });
  };

  const totalAvailableDays = selectedDoctor
    ? selectedDoctor.schedules.filter((schedule) => schedule.available).length
    : 0;
  const totalWeeklySlots = localSchedules.reduce(
    (doctorSum, doctor) =>
      doctorSum +
      doctor.schedules.reduce(
        (sum, schedule) => sum + calculateSlots(schedule),
        0
      ),
    0
  );
  const selectedDoctorWeeklySlots = selectedDoctor
    ? selectedDoctor.schedules.reduce(
        (sum, schedule) => sum + calculateSlots(schedule),
        0
      )
    : 0;
  const selectedDoctorStatus = selectedDoctor ? "Selected" : "No doctor selected";
  const headerMeta = useMemo(
    () => (
      <>
        <Badge variant="secondary" className="rounded-full">
          {selectedDoctorStatus}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {localSchedules.length} doctors
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {holidayList.length} holidays
        </Badge>
      </>
    ),
    [holidayList.length, localSchedules.length, selectedDoctorStatus]
  );

  return isPendingDoctors ? (
    SCHEDULE_LOADING_VIEW
  ) : (
    <DashboardPageShell className="mx-auto max-w-7xl px-4 pb-6 pt-0 sm:px-6 lg:px-8">
      <DashboardPageHeader
        eyebrow="Clinic Admin"
        title="Schedule Management"
        description="Manage doctor availability, holiday closures, and scheduling conflicts from one place."
        meta={headerMeta}
        actionsSlot={
          <div className="flex flex-wrap items-center gap-2">
            <WebSocketStatusIndicator />
            <Button
              className="h-9 rounded-lg px-4 text-sm font-semibold"
              onClick={handleSaveSchedule}
              disabled={
                !scheduleWritesSupported ||
                updateScheduleMutation.isPending ||
                !selectedDoctor
              }
            >
              {updateScheduleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        }
      />

      {!scheduleWritesSupported ? (
        <Card className={ALERT_CARD_CLASS}>
          <CardContent className="flex items-start gap-3 p-4 text-amber-900 dark:text-amber-100">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div className="text-sm">
              Clinic context is required to save doctor schedules.
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Doctors"
          value={String(localSchedules.length)}
          description="Available doctor profiles loaded for this clinic."
        />
        <SummaryCard
          label="Available Days"
          value={String(totalAvailableDays)}
          description="Days currently marked open for the selected doctor."
        />
        <SummaryCard
          label="Weekly Slots"
          value={String(totalWeeklySlots)}
          description="Approximate appointments possible across all doctors."
        />
        <SummaryCard
          label="Conflicts"
          value={String(scheduleConflicts.length)}
          description="Schedule issues that should be corrected before publishing."
        />
      </div>

      <Tabs defaultValue="doctor-schedules" className="gap-y-3">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl border border-border bg-card p-1 sm:grid-cols-3">
          <TabsTrigger
            value="doctor-schedules"
            className="flex h-10 items-center gap-2 rounded-lg"
          >
            <Stethoscope className="size-4" />
            Doctor Schedules
          </TabsTrigger>
          <TabsTrigger
            value="holidays"
            className="flex h-10 items-center gap-2 rounded-lg"
          >
            <CalendarDays className="size-4" />
            Holidays
          </TabsTrigger>
          <TabsTrigger
            value="conflicts"
            className="flex h-10 items-center gap-2 rounded-lg"
          >
            <AlertCircle className="size-4" />
            Conflicts
          </TabsTrigger>
      </TabsList>

      <TabsContent value="doctor-schedules" className="gap-y-3">
        <Card className={SCHEDULER_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5" />
                Doctor Schedule Planner
              </CardTitle>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-5`}>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <div className="gap-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="gap-y-2 sm:col-span-2">
                      <Label>Select Doctor</Label>
                      <Select
                        value={selectedDoctor?.id || ""}
                        onValueChange={(value) => setSelectedDoctorId(value)}
                      >
                        <SelectTrigger className={SELECT_DOCTOR_TRIGGER_CLASS}>
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {localSchedules.map((doctor) => (
                            <SelectItem
                              key={doctor.id}
                              value={doctor.id}
                              description={doctor.specialization}
                            >
                              {doctor.doctorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="gap-y-2">
                      <Label>Current State</Label>
                      <div className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-100">
                        <div className="min-w-0">
                          <div className="truncate">
                            {selectedDoctor ? selectedDoctor.doctorName : "No doctor selected"}
                          </div>
                          <div className="truncate text-xs font-medium text-emerald-700 dark:text-emerald-200">
                            {selectedDoctor?.specialization || "Specialization not set"}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full border-emerald-200 bg-white/80 text-emerald-700 dark:border-emerald-900/70 dark:bg-background/40 dark:text-emerald-200"
                        >
                          Selected
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-200 bg-white/80 p-3 shadow-sm dark:border-indigo-900/70 dark:bg-background/40">
                    <div className="grid grid-cols-1 gap-3">
                      {selectedDoctor?.schedules?.map((schedule, index) => {
                        const slots = calculateSlots(schedule);
                        return (
                          <div
                            key={`${schedule.day}-${index}`}
                            className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-indigo-900/60 dark:bg-background/70"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                                  {schedule.day.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-foreground">
                                    {schedule.day}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {schedule.available
                                      ? "Open for appointments"
                                      : "Marked as closed"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={schedule.available}
                                  onCheckedChange={(checked) =>
                                    updateSchedule(index, "available", checked)
                                  }
                                />
                                <Label className="text-sm">Available</Label>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
                              <div className="gap-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Start Time
                                </Label>
                                <Input
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(event) =>
                                    updateSchedule(index, "startTime", event.target.value)
                                  }
                                  className={TIME_INPUT_CLASS}
                                  disabled={!schedule.available}
                                />
                              </div>
                              <div className="gap-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  End Time
                                </Label>
                                <Input
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(event) =>
                                    updateSchedule(index, "endTime", event.target.value)
                                  }
                                  className={TIME_INPUT_CLASS}
                                  disabled={!schedule.available}
                                />
                              </div>
                              <div className="gap-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Slot Duration
                                </Label>
                                <Select
                                  value={String(schedule.slotDuration)}
                                  onValueChange={(value) =>
                                    updateSchedule(index, "slotDuration", Number(value))
                                  }
                                  disabled={!schedule.available}
                                >
                                  <SelectTrigger className="h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="3">3 min</SelectItem>
                                    <SelectItem value="5">5 min</SelectItem>
                                    <SelectItem value="10">10 min</SelectItem>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex lg:justify-end">
                                {schedule.available ? (
                                  <Badge
                                    variant="outline"
                                    className="h-10 rounded-full border-emerald-200 bg-emerald-50 px-3 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-emerald-200"
                                  >
                                    {slots} slots
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="h-10 rounded-full border-slate-200 bg-slate-50 px-3 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300"
                                  >
                                    Closed
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {schedule.available &&
                            schedule.startTime &&
                            schedule.endTime &&
                            schedule.startTime >= schedule.endTime ? (
                              <p className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                                End time must be after start time.
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              <div className="gap-y-3">
                <Card className={INFO_CARD_CLASS}>
                  <CardHeader className={COMPACT_CARD_HEADER}>
                    <CardTitle>Doctor Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-3`}>
                    <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 dark:border-emerald-900/60 dark:bg-background/40">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Selected Doctor
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {selectedDoctor?.doctorName || "No doctor selected"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedDoctor?.specialization || "General"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
                          Days Open
                        </p>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          {totalAvailableDays}
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-200">
                          Slots
                        </p>
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          {selectedDoctorWeeklySlots}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={INFO_CARD_CLASS}>
                  <CardHeader className={COMPACT_CARD_HEADER}>
                    <CardTitle>Consultation Durations</CardTitle>
                  </CardHeader>
                  <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-2`}>
                    {[
                      ["General Consultation", "15 min"],
                      ["Nadi Pariksha", "45 min"],
                      ["Diagnostic / Preventive Care", "60 min"],
                      ["Procedural Session", "90 min"],
                      ["Procedural Care", "60 min"],
                      ["Follow-up", "15 min"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 dark:border-emerald-900/60 dark:bg-background/40"
                      >
                        <span className="text-sm font-medium">{label}</span>
                        <Badge variant="secondary" className="rounded-full">
                          {value}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className={INFO_CARD_CLASS}>
                  <CardHeader className={COMPACT_CARD_HEADER}>
                    <CardTitle>Quick Notes</CardTitle>
                  </CardHeader>
                  <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-2`}>
                    <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-sm dark:border-emerald-900/60 dark:bg-background/40">
                      Use the select field to switch doctors and update weekly hours before saving.
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-sm dark:border-emerald-900/60 dark:bg-background/40">
                      Closed days keep the schedule clean and prevent accidental bookings.
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
          </CardContent>
        </Card>
      </TabsContent>

        <TabsContent value="holidays" className="gap-y-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <Card className={HOLIDAY_CARD_CLASS}>
              <CardHeader className={COMPACT_CARD_HEADER}>
                <CardTitle>Add New Holiday</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick the date, choose the holiday type, and add a clear title before saving.
                </p>
              </CardHeader>
              <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-4`}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="gap-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full justify-start border-emerald-200 bg-white/80 text-left font-normal text-foreground shadow-sm hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-background/40 dark:hover:bg-emerald-950/20"
                        >
                          <Calendar className="mr-2 size-4 text-emerald-600" />
                          {holidayDate
                            ? formatDateInIST(holidayDate, {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              }, "en-US")
                            : "mm/dd/yyyy"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-auto border-emerald-200 p-1 shadow-xl dark:border-emerald-900/60"
                      >
                        <CalendarPicker
                          mode="single"
                          selected={holidayDate}
                          onSelect={(date) => {
                            setHolidayDate(date);
                            dispatchHolidays({
                              type: "UPDATE_NEW_HOLIDAY",
                              field: "date",
                              value: date ? formatDateKeyInIST(date) : "",
                            });
                          }}
                          initialFocus
                          className="border-0 p-2 [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(9)]"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      {holidayDate
                        ? `Selected: ${formatDateInIST(
                            holidayDate,
                            {
                              weekday: "short",
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            },
                            "en-US"
                          )}`
                        : "Use the calendar to select one holiday date."}
                    </p>
                  </div>
                  <div className="gap-y-2">
                    <Label>Holiday Type</Label>
                    <Select
                      value={newHoliday.type}
                      onValueChange={(value) =>
                        dispatchHolidays({ type: "UPDATE_NEW_HOLIDAY", field: "type", value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public Holiday">
                          Public Holiday
                        </SelectItem>
                        <SelectItem value="Festival">Festival</SelectItem>
                        <SelectItem value="Clinic Closure">
                          Clinic Closure
                        </SelectItem>
                        <SelectItem value="Staff Training">
                          Staff Training
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This helps separate public holidays from clinic closures and staff events.
                    </p>
                  </div>
                </div>

                <div className="gap-y-2">
                  <Label>Holiday Title</Label>
                  <Input
                    value={newHoliday.title}
                    onChange={(event) =>
                      dispatchHolidays({
                        type: "UPDATE_NEW_HOLIDAY",
                        field: "title",
                        value: event.target.value,
                      })
                    }
                    placeholder="e.g., Diwali, Independence Day, Clinic Shutdown"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a short name that front-desk staff can recognize quickly.
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-white/80 p-3 shadow-sm dark:border-emerald-900/60 dark:bg-background/40">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Holiday Preview
                  </p>
                  <div className="mt-2 gap-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {newHoliday.title || "Holiday title"}
                      </span>
                      <Badge variant="outline" className="rounded-full">
                        {newHoliday.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {newHoliday.date
                        ? formatDateInIST(
                            newHoliday.date,
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                            "en-US"
                          )
                        : "No date selected yet"}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={addHoliday}
                  disabled={!newHoliday.date || !newHoliday.title}
                  className="h-10 w-full rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="mr-2 size-4" />
                  Save Holiday
                </Button>
              </CardContent>
            </Card>

            <Card className={HOLIDAY_CARD_CLASS}>
              <CardHeader className={COMPACT_CARD_HEADER}>
                <CardTitle>Scheduled Holidays</CardTitle>
              </CardHeader>
              <CardContent className={COMPACT_CARD_CONTENT}>
                <div className="gap-y-3">
                  {holidayList.length > 0 ? (
                    holidayList.map((holiday) => (
                      <div
                        key={holiday.id}
                        className="flex flex-col gap-3 rounded-xl border border-amber-100 bg-white/80 p-4 shadow-sm dark:border-amber-900/60 dark:bg-background/40 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">
                            {holiday.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDateInIST(holiday.date, {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full">
                            {holiday.type}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeHoliday(holiday.id)}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-white/70 px-4 py-8 text-center dark:border-amber-900/60 dark:bg-background/30">
                      <CalendarDays className="mx-auto mb-3 size-10 text-amber-400" />
                      <p className="font-medium text-foreground">
                        No holidays scheduled
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add clinic closures or festival days here.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conflicts" className="gap-y-3">
          <Card className={CONFLICT_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="size-5 text-rose-600 dark:text-rose-300" />
                Schedule Conflicts
              </CardTitle>
            </CardHeader>
            <CardContent className={COMPACT_CARD_CONTENT}>
              <div className="gap-y-4">
                {scheduleConflicts.length > 0 ? (
                  scheduleConflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-white/80 p-4 shadow-sm dark:border-rose-900/60 dark:bg-background/40"
                    >
                      <AlertCircle className="mt-0.5 size-5 text-rose-600 dark:text-rose-300" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-rose-900 dark:text-rose-100">
                          {conflict.title}
                        </h3>
                        <p className="text-sm text-rose-700 dark:text-rose-300">
                          {conflict.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Update the doctor schedule and save to resolve.
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-8 text-center dark:border-emerald-900/60 dark:bg-background/40">
                    <CheckCircle className="mx-auto mb-3 size-10 text-emerald-600 dark:text-emerald-300" />
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      All Clear
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      No schedule configuration conflicts detected.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  );
}



