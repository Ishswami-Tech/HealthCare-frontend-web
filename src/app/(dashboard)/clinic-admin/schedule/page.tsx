"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useReducer, useState } from "react";
import type { Reducer } from "react";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext, useMyClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import {
  useDoctors,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
} from "@/hooks/query/useDoctors";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

const ClinicAdminScheduleContent = dynamic(
  () => import("./_components/ClinicAdminScheduleContent").then((module) => module.ClinicAdminScheduleContent),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

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

  return (
    <ClinicAdminScheduleContent
      scheduleWritesSupported={scheduleWritesSupported}
      updateSchedulePending={updateScheduleMutation.isPending}
      handleSaveSchedule={handleSaveSchedule}
      selectedDoctor={selectedDoctor}
      selectedDoctorStatus={selectedDoctorStatus}
      localSchedules={localSchedules}
      holidayList={holidayList}
      newHoliday={newHoliday}
      holidayDate={holidayDate}
      setHolidayDate={setHolidayDate}
      addHoliday={addHoliday}
      removeHoliday={removeHoliday}
      updateSchedule={updateSchedule}
      totalAvailableDays={totalAvailableDays}
      totalWeeklySlots={totalWeeklySlots}
      selectedDoctorWeeklySlots={selectedDoctorWeeklySlots}
      scheduleConflicts={scheduleConflicts}
    />
  );
}



