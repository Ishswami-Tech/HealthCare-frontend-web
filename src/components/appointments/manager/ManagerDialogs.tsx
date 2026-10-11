"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { BookingSlotGroups } from "@/components/appointments/booking/BookingSlotGroups";
import type { BookingSlotPeriod } from "@/components/appointments/booking/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateField, Note, DialogActions, DialogBody, DialogShell } from "@/components/tbd";
import { APPOINTMENT_MAX_RESCHEDULES } from "@/lib/utils/appointmentUtils";
import type { ManagerVisit } from "./types";

function VisitLine({ visit }: { visit: ManagerVisit | null }) {
  if (!visit) return null;
  return (
    <p className="m-0 rounded-xl bg-well px-3.5 py-2.5 text-[13px] text-ink">
      <span className="font-bold">{visit.title}</span>
      <span className="text-ink-muted"> · {visit.whenLabel}</span>
    </p>
  );
}

/** The doctor's free times for the chosen day, as the container loaded them. */
export interface RescheduleSlots {
  /** "idle" = no date chosen yet. */
  status: "idle" | "loading" | "error" | "empty" | "ready";
  periods: BookingSlotPeriod[];
  errorMessage?: string | undefined;
  onRetry: () => void;
}

function RescheduleSlotPicker({
  slots,
  time,
  onTimeChange,
}: {
  slots: RescheduleSlots;
  time: string;
  onTimeChange: (value: string) => void;
}) {
  if (slots.status === "idle") {
    return <p className="m-0 text-[13px] text-ink-muted">Pick a date to see the free times.</p>;
  }
  if (slots.status === "loading") {
    return (
      <p role="status" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink-muted">
        <Loader2 className="size-4 animate-spin text-brand" aria-hidden="true" />
        Loading free times…
      </p>
    );
  }
  if (slots.status === "error") {
    return (
      <Note tone="rose" icon={AlertTriangle}>
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>{slots.errorMessage || "Could not load the free times."}</span>
          <Button variant="outline" onClick={slots.onRetry}>
            Try again
          </Button>
        </span>
      </Note>
    );
  }
  if (slots.status === "empty") {
    return <Note tone="amber">No free times on this day. Pick another date.</Note>;
  }
  return (
    <div className="max-h-[280px] overflow-y-auto pr-1">
      <BookingSlotGroups
        periods={slots.periods}
        selected={time}
        onSelect={onTimeChange}
        timeStyle="12h"
        columnsClassName="grid-cols-3 sm:grid-cols-4"
      />
    </div>
  );
}

/** `yyyy-mm-dd` of a local-time date, for the `min` of a date field. */
function localDateKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Pick a new date and time for a visit. Shows how many moves are left.
 * With `slots` the time is picked from the doctor's free times (the same grid as booking);
 * without it (the doctor or clinic of the visit is unknown) a plain time field is shown.
 */
export function RescheduleDialog({
  open,
  onOpenChange,
  visit,
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
  submitting,
  onSubmit,
  slots,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ManagerVisit | null;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  /** Days before this one cannot be picked. */
  minDate: Date | null;
  submitting: boolean;
  onSubmit: () => void;
  slots?: RescheduleSlots | null | undefined;
}) {
  // With a slot grid, only a time that is still free can be sent.
  const timeIsFree =
    !slots ||
    (slots.status === "ready" &&
      slots.periods.some((period) => period.slots.some((slot) => !slot.unavailable && slot.value === time)));
  return (
    <DialogShell
      plain
      open={open}
      onOpenChange={onOpenChange}
      title="Reschedule visit"
      description={slots ? "Choose a new date, then one of the doctor's free times." : "Choose a new date and time."}
      width={slots ? 512 : 448}
    >
      <DialogBody>
        <VisitLine visit={visit} />
        <div className={slots ? "flex flex-col gap-4" : "grid gap-3 sm:grid-cols-2"}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="appointment-reschedule-date" className="text-[13px] font-semibold text-ink">
              New date
            </label>
            <DateField
              id="appointment-reschedule-date"
              value={date}
              min={minDate ? localDateKey(minDate) : undefined}
              onChange={onDateChange}
              className="w-full"
            />
          </div>
          {slots ? (
            <div className="flex flex-col gap-2" role="group" aria-label="New time">
              <span className="text-[13px] font-semibold text-ink">New time</span>
              <RescheduleSlotPicker slots={slots} time={time} onTimeChange={onTimeChange} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="appointment-reschedule-time" className="text-[13px] font-semibold text-ink">
                New time
              </label>
              <Input
                id="appointment-reschedule-time"
                type="time"
                value={time}
                onChange={(event) => onTimeChange(event.target.value)}
              />
            </div>
          )}
        </div>
        {visit?.rescheduleHint ? (
          <Note tone="blue">
            <strong className="font-bold">{visit.rescheduleHint}.</strong> A visit can be moved{" "}
            {APPOINTMENT_MAX_RESCHEDULES} times.
          </Note>
        ) : null}
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
          Keep current time
        </Button>
        <Button size="md" onClick={onSubmit} disabled={submitting || !date || !time || !timeIsFree}>
          {submitting ? "Moving…" : "Move visit"}
        </Button>
      </DialogActions>
    </DialogShell>
  );
}

/** Ask before cancelling: the action cannot be undone. */
export function CancelVisitDialog({
  open,
  onOpenChange,
  visit,
  submitting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ManagerVisit | null;
  submitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <DialogShell
      plain
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel this visit?"
      description="The slot is released. You cannot undo this."
      width={448}
    >
      <VisitLine visit={visit} />
      <DialogActions>
        <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
          Keep visit
        </Button>
        <Button variant="danger" size="md" onClick={onConfirm} disabled={submitting}>
          {submitting ? "Cancelling…" : "Cancel visit"}
        </Button>
      </DialogActions>
    </DialogShell>
  );
}

/** A doctor declines the times a patient proposed, with a reason. */
export function DeclineSlotsDialog({
  open,
  onOpenChange,
  visit,
  reason,
  onReasonChange,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ManagerVisit | null;
  reason: string;
  onReasonChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <DialogShell
      plain
      open={open}
      onOpenChange={onOpenChange}
      title="Decline the proposed times"
      description="Tell the patient why these times do not work."
      width={448}
    >
      <DialogBody className="gap-3">
        <VisitLine visit={visit} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-proposal-reason" className="text-[13px] font-semibold text-ink">
            Reason
          </label>
          <Textarea
            id="reject-proposal-reason"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="For example: only free in the evenings"
          />
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
          Back
        </Button>
        <Button variant="danger" size="md" onClick={onSubmit} disabled={!reason || submitting}>
          {submitting ? "Declining…" : "Decline times"}
        </Button>
      </DialogActions>
    </DialogShell>
  );
}
