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
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPOINTMENT_MAX_RESCHEDULES } from "@/lib/utils/appointmentUtils";
import { BookingSlotGroups } from "@/components/appointments/booking/BookingSlotGroups";
import type { BookingSlotPeriod } from "@/components/appointments/booking/types";
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
  slotPeriods,
  slotsLoading = false,
  slotsError = null,
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
  /**
   * The open slots of the chosen day, grouped by period (the doctor's availability for this
   * visit type and location). Without it the dialog falls back to a free time field.
   */
  slotPeriods?: BookingSlotPeriod[] | undefined;
  slotsLoading?: boolean;
  slotsError?: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const useSlotGrid = slotPeriods !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule visit</DialogTitle>
          <DialogDescription>Choose a new date and time.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VisitLine visit={visit} />
          <div className={useSlotGrid ? "flex flex-col gap-3" : "grid gap-3 sm:grid-cols-2"}>
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
            {useSlotGrid ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-ink">New time</span>
                {!date ? (
                  <p className="m-0 text-[13px] text-ink-muted">Pick a date to see the open times.</p>
                ) : slotsLoading ? (
                  <p className="m-0 text-[13px] text-ink-muted" role="status">Loading open times…</p>
                ) : slotPeriods.length > 0 ? (
                  <BookingSlotGroups periods={slotPeriods} selected={time} onSelect={onTimeChange} columnsClassName="grid-cols-4" />
                ) : (
                  <p className="m-0 text-[13px] text-ink-muted">
                    {slotsError ?? "No open times on this day. Try another date."}
                  </p>
                )}
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

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Rate a completed in-clinic visit: 1 to 5 stars and an optional comment. */
export function RateVisitDialog({
  open,
  onOpenChange,
  visit,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
  error,
  submitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: ManagerVisit | null;
  rating: number;
  comment: string;
  onRatingChange: (value: number) => void;
  onCommentChange: (value: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your visit</DialogTitle>
          <DialogDescription>Tell others how it went. Your name is not shown in full.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <VisitLine visit={visit} />
          <div className="flex flex-col gap-1.5">
            <span id="rate-visit-stars-label" className="text-[13px] font-semibold text-ink">
              How was your visit?
            </span>
            <div role="radiogroup" aria-labelledby="rate-visit-stars-label" className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  role="radio"
                  aria-checked={rating === stars}
                  aria-label={`${stars} ${stars === 1 ? "star" : "stars"}`}
                  disabled={submitting}
                  onClick={() => onRatingChange(stars)}
                  className="rounded-md p-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <Star
                    className={cn(
                      "size-8",
                      stars <= rating ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-transparent text-[#cbd5e1] dark:text-slate-600",
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-ink-muted" aria-live="polite">
                {RATING_WORDS[rating] ?? ""}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rate-visit-comment" className="text-[13px] font-semibold text-ink">
              Comment (optional)
            </label>
            <Textarea
              id="rate-visit-comment"
              value={comment}
              maxLength={1000}
              placeholder="What went well, or what could be better?"
              onChange={(event) => onCommentChange(event.target.value)}
            />
          </div>
          {error ? (
            <Note tone="rose">
              <span role="alert">{error}</span>
            </Note>
          ) : null}
        </div>
        <DialogFooter className="gap-2.5">
          <Button variant="outline" size="md" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button size="md" onClick={onSubmit} disabled={submitting || rating < 1}>
            {submitting ? "Sending…" : "Send rating"}
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
