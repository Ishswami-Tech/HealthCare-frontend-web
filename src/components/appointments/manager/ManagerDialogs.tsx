"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@/components/tbd";
import { APPOINTMENT_MAX_RESCHEDULES } from "@/lib/utils/appointmentUtils";
import { DateField } from "./ManagerFilters";
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

/** Pick a new date and time for a visit. Shows how many moves are left. */
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
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule visit</DialogTitle>
          <DialogDescription>Choose a new date and time.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VisitLine visit={visit} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span id="appointment-reschedule-date-label" className="text-[13px] font-semibold text-ink">
                New date
              </span>
              <DateField
                value={date}
                placeholder="Pick a date"
                ariaLabel="New date"
                onChange={onDateChange}
                isDisabled={(day) => Boolean(minDate) && day < (minDate as Date)}
                className="w-full"
              />
            </div>
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
          </div>
          {visit?.rescheduleHint ? (
            <Note tone="blue">
              <strong className="font-bold">{visit.rescheduleHint}.</strong> A visit can be moved{" "}
              {APPOINTMENT_MAX_RESCHEDULES} times.
            </Note>
          ) : null}
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Keep current time
          </Button>
          <Button size="md" onClick={onSubmit} disabled={submitting || !date || !time}>
            {submitting ? "Moving…" : "Move visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this visit?</DialogTitle>
          <DialogDescription>The slot is released. You cannot undo this.</DialogDescription>
        </DialogHeader>
        <VisitLine visit={visit} />
        <DialogFooter className="gap-2.5">
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Keep visit
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Cancelling…" : "Cancel visit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Decline the proposed times</DialogTitle>
          <DialogDescription>Tell the patient why these times do not work.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
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
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Back
          </Button>
          <Button variant="danger" size="md" onClick={onSubmit} disabled={!reason || submitting}>
            {submitting ? "Declining…" : "Decline times"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
