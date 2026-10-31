"use client";

import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { LoadError, SectionTitle, SkeletonRows, Surface } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useMyLeaveRequests } from "@/hooks/query/useLeaveRequests";
import { useRealTimeAppointments } from "@/hooks/realtime/useRealTimeQueries";
import { useUserProfile } from "@/hooks/query/useUsers";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { getAppointmentDateTimeValue } from "@/lib/utils/appointmentUtils";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";
import { loadOpdWeek } from "./DoctorWeeklyOPDSchedule";
import {
  closedWeekdaysOf,
  leaveMarksForMonth,
  monthDayKeys,
  monthKeyOf,
  opdBlocksForDay,
  weekdayKeyOf,
  type DayKey,
  type DayMark,
} from "./schedule-calendar.logic";
import { CalendarDayCell, CalendarDayDetail, CalendarLegend } from "./DoctorScheduleCalendarParts";
import { DayOverrideTodayRow } from "./DayOverridePanel";
import { useDayAvailability } from "@/hooks/query/useDayAvailability";

/** The week starts on Monday — matching the OPD editor's "monday…sunday" order. */
const WEEK_STARTS_ON = 1;

/**
 * A Date for an IST day key, anchored at local noon so the calendar day it points at never
 * slides across midnight on this device; every day-key -> Date conversion on this page goes
 * through it, so the grid, the marks and the selection all agree.
 */
function dateOfDayKey(dayKey: DayKey): Date {
  const [year = "0", month = "1", day = "1"] = dayKey.split("-");
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
}

/** The IST day key ("YYYY-MM-DD") a Date points at on this device. */
function dayKeyOf(date: Date): DayKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Appointment statuses that are no longer a "booked patient" — mirrors the leave logic's filter. */
const CLOSED_APPOINTMENT_STATUSES = new Set(["CANCELLED", "COMPLETED", "NO_SHOW", "EXPIRED"]);

/**
 * Open-appointment counts per day key, for the days in `monthDays`. `null` means "nothing
 * loaded yet" (the query has no data); a `Map` otherwise (days with no bookings have no
 * entry — read them as 0).
 */
function openAppointmentCounts(raw: unknown, monthDays: readonly string[]): Map<string, number> | null {
  const host = asRecordOrEmpty(raw);
  const list = Array.isArray(host.data) ? (host.data as unknown[]) : null;
  if (list === null) return null;
  const inMonth = new Set(monthDays);
  const counts = new Map<string, number>();
  for (const entry of list) {
    const appointment = asRecordOrEmpty(entry);
    if (CLOSED_APPOINTMENT_STATUSES.has(textOf(appointment.status).toUpperCase())) continue;
    const startedAt = getAppointmentDateTimeValue(appointment);
    if (!startedAt) continue;
    const dayKey = formatDateKeyInIST(startedAt);
    if (inMonth.has(dayKey)) counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
  }
  return counts;
}

/**
 * "This month": a read-only month calendar over the doctor's own schedule, the at-a-glance
 * hero of the page. The cells carry distinct marks — a rose-tinted fill on full-day
 * leave days, a solid amber dot on reduced-hours / break days, a dotted fill plus a
 * "Closed" hint on OPD-closed weekdays, a ring on today (see `CalendarDayCell` and its
 * matching legend chips). Picking a day shows its detail — OPD blocks, leave rows, booked
 * patients — with a one-click "Add leave" that pre-fills the page's leave drawer for that
 * day.
 *
 * Data: no new request families of its own — the leave rows and the weekly OPD schedule are
 * already fetched on this page, and the booking counts reuse the realtime appointments query
 * the drawer already uses, scoped to the displayed month (per-day figures are free once the
 * month's data is in).
 */
export function DoctorScheduleCalendar({
  onAddLeave,
}: {
  /** Opens the page's "Add leave" drawer with its dates pre-filled to this IST day key. */
  onAddLeave: (dateKey: DayKey) => void;
}) {
  // Start on today's IST day key — the same convention the leave rows and drawer use — and
  // the displayed month is initialised from it so the two can never disagree at mount.
  const [selected, setSelected] = useState<DayKey>(() => formatDateKeyInIST(new Date()));
  const [month, setMonth] = useState<Date>(() => dateOfDayKey(formatDateKeyInIST(new Date())));

  const leave = useMyLeaveRequests();
  const profile = useUserProfile();

  // The weekly OPD schedule, exactly the source the OPD editor on this page reads: the
  // profile's `availability` / `workingHours` record, parsed with the editor's own loader so
  // a legacy flat shape and multi-block days behave identically in both places.
  const availability = useMemo(
    () =>
      ((profile.data as Record<string, unknown> | null | undefined)?.availability ??
        (profile.data as Record<string, unknown> | null | undefined)?.workingHours) as unknown,
    [profile.data],
  );
  const week = useMemo(() => loadOpdWeek(availability), [availability]);
  const closedDays = useMemo(() => closedWeekdaysOf(week), [week]);

  // PENDING + APPROVED leave rows paint the displayed month: full-day leave = rose tint,
  // reduced hours / break = amber dot. One map for the whole grid currently on screen, so
  // navigating months repaints the cells without re-querying anything.
  const monthKey = monthKeyOf(dayKeyOf(month));
  const monthDays = useMemo(() => monthDayKeys(monthKey), [monthKey]);
  const dayMarks = useMemo(
    () => (leave.data ? leaveMarksForMonth(leave.data, monthDays) : new Map<DayKey, DayMark[]>()),
    [leave.data, monthDays],
  );

  // Booked-patient counts for every day of the visible month: the realtime hook's query
  // family (the same one the drawer's "N booked patients" preview uses), scoped to this
  // doctor and the displayed month — one request covers all the cells of that month.
  const { user } = useAuth();
  const appointments = useRealTimeAppointments({
    doctorId: user?.id || undefined,
    startDate: monthDays[0] || undefined,
    endDate: monthDays[monthDays.length - 1] || undefined,
    limit: 500,
  } as Parameters<typeof useRealTimeAppointments>[0]);
  const appointmentCounts = useMemo(
    () => openAppointmentCounts(appointments.data, monthDays),
    [appointments.data, monthDays],
  );

  // Per-day availability overrides across the displayed month: one month-wide request (the
  // backend bounds the read, so superseded days can never come back) tints their cells
  // amber — the "Emergency override" legend chip explains the mark.
  const todayKey = formatDateKeyInIST(new Date());
  const firstDay = monthDays[0] || "";
  const lastDay = monthDays[monthDays.length - 1] || "";
  const monthOverrides = useDayAvailability(firstDay, firstDay ? lastDay : undefined);
  const overriddenDays = useMemo(
    () => new Set((monthOverrides.overrides?.data ?? []).map((row) => row.date)),
    [monthOverrides.overrides?.data],
  );

  const dataPending = leave.isPending || profile.isPending;
  const dataFailed = Boolean(leave.error) || Boolean(profile.error);

  const selectedWeekday = weekdayKeyOf(selected);
  const opdBlocks = selectedWeekday ? opdBlocksForDay(week, selectedWeekday) : [];
  const appointmentCount = appointmentCounts ? (appointmentCounts.get(selected) ?? 0) : null;
  const appointmentsLoading = appointmentCounts === null && appointments.isFetching;

  return (
    <Surface flush as="section" aria-label="Month at a glance">
      <div className="border-b border-hair px-5 py-4">
        <SectionTitle
          icon={CalendarIcon}
          title="This month"
          description="Closed OPD days, leave and breaks across the month. Pick a day to see it in detail, or add leave straight from it."
        />
        {/* Today's emergency-hours state, one glance away: an active override shows here
            with "Resume normal schedule"; otherwise one tap selects today so the strip's
            preset panel takes over. */}
        <div className="mt-3">
          <DayOverrideTodayRow
            dateKey={todayKey}
            onSelect={() => {
              setSelected(todayKey);
              setMonth(dateOfDayKey(monthKeyOf(todayKey) + "-01"));
            }}
          />
        </div>
      </div>

      {dataPending ? (
        <div className="px-5 py-3">
          <SkeletonRows rows={3} />
        </div>
      ) : dataFailed ? (
        <div className="px-5 py-3">
          <LoadError
            title="The month could not be loaded"
            message="Check the connection and try again."
            onRetry={() => {
              void leave.refetch();
              void profile.refetch();
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[440px]">
            <Calendar
              mode="single"
              weekStartsOn={WEEK_STARTS_ON}
              // The shared Calendar's root is `sm:w-fit`, which collapses this grid to ~160px at
              // tablet widths (cells 19px). Fill the wrapper (max 440px) so each day is >= 44px, and
              // use short weekday names so the headers never run together.
              classNames={{ root: "mx-auto w-full max-w-full" }}
              formatters={{
                formatWeekdayName: (date) =>
                  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][date.getDay()] ?? "",
              }}
              selected={dateOfDayKey(selected)}
              onSelect={(date) => {
                if (!date) return;
                const key = dayKeyOf(date);
                setSelected(key);
                setMonth(dateOfDayKey(monthKeyOf(key) + "-01"));
              }}
              month={month}
              onMonthChange={setMonth}
              components={{
                DayButton: ({ day, modifiers, ...buttonProps }) => {
                  // RDP composes the day number as `children` and its own `className` /
                  // `style` onto the button; the cell owns its classes and renders the
                  // number itself, so those come off the spread and the rest (onClick,
                  // a11y attributes, tabIndex) passes through untouched.
                  const { children, className, style, ...cellProps } = buttonProps;
                  void children;
                  void className;
                  void style;
                  // `day.isoDate` is RDP's stable "YYYY-MM-DD" for the cell — the same local
                  // day-key the marks and closed-weekday test key off, so no Date parts
                  // need reading here.
                  return (
                    <CalendarDayCell
                      dayKey={day.isoDate}
                      outside={day.outside}
                      modifiers={modifiers}
                      marks={dayMarks.get(day.isoDate) ?? []}
                      closed={!day.outside && closedDays.has(weekdayKeyOf(day.isoDate) ?? "monday")}
                      overridden={!day.outside && overriddenDays.has(day.isoDate)}
                      {...cellProps}
                    />
                  );
                },
              }}
            />
            <CalendarLegend />
          </div>

          {/* The selected day: OPD blocks, leave rows covering it, booked patients. */}
          <CalendarDayDetail
            dayKey={selected}
            blocks={opdBlocks}
            closed={selectedWeekday ? closedDays.has(selectedWeekday) : false}
            appointmentCount={appointmentCount}
            appointmentsLoading={appointmentsLoading}
            onAddLeave={onAddLeave}
          />
        </div>
      )}
    </Surface>
  );
}
