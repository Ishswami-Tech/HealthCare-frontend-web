"use client";

import { useMemo, type ComponentProps, type ReactNode } from "react";
import type { DayButton } from "react-day-picker";
import { Clock, Loader2, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note, Pill } from "@/components/tbd";
import { useMyLeaveRequests } from "@/hooks/query/useLeaveRequests";
import { formatDateInIST } from "@/lib/utils/date-time";
import { LEAVE_KIND_LABEL, LEAVE_STATUS } from "./leave.logic";
import { leaveRowCoversDay, type DayKey, type DayMark } from "./schedule-calendar.logic";
import { DayOverridePanel } from "./DayOverridePanel";

/**
 * The grid cell and the day-detail strip of "Month at a glance" — the presentational half of
 * `DoctorScheduleCalendar`, split out to keep each file small.
 */

/**
 * One grid cell with clearly distinct marks: a rose-tinted fill on full-day leave days, a
 * solid amber dot on reduced-hours / break days, a dotted muted fill plus a dashed border
 * on OPD-closed weekdays (the "Closed OPD" legend chip explains it — no in-cell text, so
 * the mark never collides with the day number), a solid ring on today, the selected day in
 * the theme's primary style — marks and the today ring stack when a day carries several.
 * RDP renders it inside its `Day` grid cell (`aspect-square`), which already dims outside
 * days — the mark fills are suppressed there so they never leak across the month edge.
 */
export function CalendarDayCell({
  dayKey,
  outside,
  modifiers,
  marks,
  closed,
  overridden = false,
  ...buttonProps
}: {
  dayKey: DayKey;
  outside: boolean;
  modifiers: Record<string, boolean>;
  marks: DayMark[];
  closed: boolean;
  /** An active per-day availability override for this day: an amber-tinted fill so the
   * emergency closure/shrink is visible on the grid, not only in the day strip. */
  overridden?: boolean;
  /** RDP composes the day number as children and its own classes; the cell renders the
   * number from `dayKey` and supplies its own classes, so both are pulled off the spread. */
  children?: ReactNode;
  className?: string;
  style?: import("react").CSSProperties;
} & Omit<ComponentProps<typeof DayButton>, "day" | "modifiers" | "children" | "className" | "style">) {
  const hasFullLeave = marks.includes("LEAVE");
  const hasPartial = marks.includes("PARTIAL");
  const isSelected = Boolean(modifiers.selected);
  const isToday = Boolean(modifiers.today);

  const className = [
    // The RDP `Day` `<td>` already owns the square slot (`aspect-square w-full h-full`);
    // the button just fills it, so the day number sits centred and nothing stacks under it.
    "relative flex h-full w-full items-center justify-center p-0 text-[0.8rem] font-medium",
    "rounded-lg bg-transparent text-ink transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-ring",
    isSelected
      ? "bg-primary font-bold text-primary-foreground shadow-md"
      : outside
        ? "text-ink-soft/40 dark:text-ink-soft/30"
        : "",
    !isSelected && !outside && isToday ? "font-extrabold text-brand-dark ring-1 ring-inset ring-brand-500" : "",
    !isSelected && !outside && hasFullLeave ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200" : "",
    !isSelected && !outside && hasPartial && !hasFullLeave
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
      : "",
    // OPD-closed weekday: a dotted "hatched" muted fill plus a dashed border. It is a
    // pattern rather than just a colour, so it still reads on top of a leave/break tint.
    !isSelected && !outside && closed
      ? "border border-dashed border-ink-soft/50 bg-[radial-gradient(circle,rgb(0_0_0_/_0.05)_1px,transparent_1px)] [background-size:6px_6px] text-ink-soft/80"
      : "",
    // An active per-day override (emergency closure / shrunk hours) tints the cell amber —
    // the "Emergency override" legend chip below carries the same swatch.
    !isSelected && !outside && overridden ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} {...buttonProps}>
      {dayKey.slice(8)}
      {hasPartial ? (
        <span className="absolute bottom-1 right-1.5 size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      ) : null}
    </button>
  );
}

/** The tiny chips under the grid: one per mark, each swatch matching its cell mark exactly. */
export function CalendarLegend() {
  const chips: { label: string; swatch: ReactNode }[] = [
    {
      label: "Leave",
      swatch: <span className="size-2.5 rounded-[3px] bg-rose-100 ring-1 ring-inset ring-rose-300" aria-hidden="true" />,
    },
    {
      // A break / reduced-hours day: amber fill with the same solid dot the cells carry.
      label: "Break",
      swatch: (
        <span
          className="relative grid size-2.5 place-items-center rounded-[3px] bg-amber-100 ring-1 ring-inset ring-amber-300"
          aria-hidden="true"
        >
          <span className="size-1 rounded-full bg-amber-500" />
        </span>
      ),
    },
    {
      // Same dotted fill + dashed border the closed cells carry.
      label: "Closed OPD",
      swatch: (
        <span
          className="h-2.5 w-3.5 rounded-[3px] border border-dashed border-ink-soft/50 bg-[radial-gradient(circle,rgb(0_0_0_/_0.05)_1px,transparent_1px)] [background-size:4px_4px]"
          aria-hidden="true"
        />
      ),
    },
    {
      // The solid ring today's cell carries.
      label: "Today",
      swatch: <span className="size-2.5 rounded-[3px] ring-1 ring-inset ring-brand-500" aria-hidden="true" />,
    },
    {
      // The amber fill a cell with an active per-day availability override carries.
      label: "Emergency override",
      swatch: <span className="size-2.5 rounded-[3px] bg-amber-100 ring-1 ring-inset ring-amber-300 dark:bg-amber-950/60" aria-hidden="true" />,
    },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-ink-muted">
      {chips.map((chip) => (
        <span key={chip.label} className="inline-flex items-center gap-1.5">
          {chip.swatch}
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/**
 * The compact strip next to the grid: that day's OPD blocks, the leave rows covering it
 * (kind, status pill and reason), how many patients are already booked, and the "Add
 * leave" shortcut that pre-fills the drawer for this day. Reads the leave rows itself
 * (`useMyLeaveRequests` — the page already caches them) so the parent stays lean.
 */
export function CalendarDayDetail({
  dayKey,
  blocks,
  closed,
  appointmentCount,
  appointmentsLoading,
  onAddLeave,
}: {
  dayKey: DayKey;
  blocks: { start: string; end: string }[];
  closed: boolean;
  /** Open appointments on the day; `null` while nothing is loaded yet. */
  appointmentCount: number | null;
  appointmentsLoading: boolean;
  onAddLeave: (dateKey: DayKey) => void;
}) {
  const leave = useMyLeaveRequests();

  const leaveRows = useMemo(
    () =>
      (leave.data ?? []).filter(
        (row) => (row.status === "PENDING" || row.status === "APPROVED") && leaveRowCoversDay(row, dayKey),
      ),
    [leave.data, dayKey],
  );

  const label = formatDateInIST(new Date(`${dayKey}T00:00:00+05:30`), {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const nothingHere = blocks.length === 0 && leaveRows.length === 0 && appointmentCount !== null;

  return (
    <div className="flex min-h-[120px] flex-col gap-3 self-start rounded-xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">{label}</span>
        <Button size="compact" onClick={() => onAddLeave(dayKey)}>
          <Plus aria-hidden="true" />
          Add leave
        </Button>
      </div>

      {nothingHere ? (
        <Note tone="blue">No OPD blocks, leave or bookings on this day.</Note>
      ) : (
        <div className="flex flex-col gap-2.5">
          {blocks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
              {blocks.map((block, index) => (
                <span key={index} className="rounded-md bg-mint-soft px-1.5 py-0.5 text-xs font-bold text-brand-dark">
                  {block.start}–{block.end}
                </span>
              ))}
            </div>
          ) : null}

          {closed ? (
            <Note tone="blue">
              No OPD hours set for this weekday in your weekly schedule — patients cannot book here unless you add a block.
            </Note>
          ) : null}

          {leaveRows.length > 0 ? (
            <ul className="m-0 flex flex-col gap-1.5 list-none p-0">
              {leaveRows.map((row) => {
                const status = LEAVE_STATUS[row.status] ?? LEAVE_STATUS.PENDING;
                return (
                  <li key={row.id} className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink">
                    <Pill tone={status.tone} dot>
                      {status.label}
                    </Pill>
                    <span className="font-bold">{LEAVE_KIND_LABEL[row.kind]}</span>
                    {row.kind !== "LEAVE" && row.startTime && row.endTime ? (
                      <span className="text-xs text-ink-muted">
                        {row.startTime}–{row.endTime}
                      </span>
                    ) : null}
                    {row.reason ? <span className="text-xs text-ink-muted">· {row.reason}</span> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {appointmentCount !== null ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink">
              <Users className="size-3.5 text-ink-soft" aria-hidden="true" />
              <strong className="font-bold">{appointmentCount}</strong>
              <span className="text-ink-muted">
                booked {appointmentCount === 1 ? "patient" : "patients"} this day
              </span>
            </span>
          ) : appointmentsLoading ? (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Checking your bookings…
            </span>
          ) : null}
        </div>
      )}

      {/* The day's emergency-hours panel: one-tap presets close, shrink or re-window this
          day (the L1 per-day availability override) — no confirmation, the amber row
          appearing above it restores the weekly hours with one more tap. */}
      <DayOverridePanel dateKey={dayKey} />
    </div>
  );
}
