"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FactTile, Field, Note, Pill, SectionTitle, Surface, VisitTypeChip } from "@/components/tbd";
import { useRescheduleAppointment } from "@/hooks/query/useAppointments";
import { APPOINTMENT_MAX_RESCHEDULES, formatISODateInIST, getAppointmentRescheduleCount } from "@/lib/utils/appointmentUtils";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { Row } from "@/components/patient/home/homeData";
import { toManagerVisit } from "../manager/managerData";
import { BookingDateStrip } from "../booking/BookingDateStrip";
import { BookingSlotGroups } from "../booking/BookingSlotGroups";
import { formatSlotLabel } from "../booking/format";
import { useRescheduleSlots } from "./useRescheduleSlots";

const DAYS_AHEAD = 14;

function nextDays(count: number) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, index) => ({
    date: new Date(start.getTime() + index * 24 * 60 * 60 * 1000),
    disabled: false,
  }));
}

/**
 * Full-page reschedule (boards WebReschedule and RecReschedule): the current booking, moves left,
 * a day strip, the open times of the visit's own doctor, an optional reason, and the confirm.
 * The rule (how many moves, which statuses, the 5-hour video window) comes from `toManagerVisit`,
 * the same rule the lists and the backend use. `aside` holds the audience's own cards
 * (the patient's 5-hour and refund cards).
 */
export function ReschedulePanel({
  appointment,
  audience,
  backHref,
  onDone,
  clinicId = "",
  aside,
}: {
  appointment: Row;
  audience: "patient" | "staff";
  backHref: string;
  onDone: () => void;
  clinicId?: string;
  aside?: ReactNode;
}) {
  const now = Date.now();
  const visit = useMemo(
    () =>
      toManagerVisit(appointment, {
        now,
        viewerRole: audience === "patient" ? "PATIENT" : "RECEPTIONIST",
        staffView: audience === "staff",
      }),
    // `now` only matters for the rule at the moment the page opens.
    [appointment, audience],
  );
  const days = useMemo(() => nextDays(DAYS_AHEAD), []);
  // Open on the booked day when it is still ahead and on the strip, else today.
  const [date, setDate] = useState(() => {
    const today = formatISODateInIST(new Date());
    const booked = appointment?.date ? formatISODateInIST(new Date(String(appointment.date))) : "";
    const onStrip = days.some((day) => formatISODateInIST(day.date) === booked);
    return booked && booked >= today && onStrip ? booked : today;
  });
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const slots = useRescheduleSlots(appointment, date, { enabled: visit.canReschedule, clinicId });
  const reschedule = useRescheduleAppointment();
  const used = getAppointmentRescheduleCount(appointment);
  const selectedDay = days.find((day) => formatISODateInIST(day.date) === date)?.date;
  const targetLabel =
    date && time
      ? `${formatDateInIST(new Date(`${date}T00:00:00+05:30`), { weekday: "short", day: "numeric", month: "short" })}, ${formatSlotLabel(time, "12h")}`
      : "";

  const submit = async () => {
    if (!date || !time) return;
    try {
      await reschedule.mutateAsync({ id: visit.id, data: { date, time, ...(reason.trim() ? { reason: reason.trim() } : {}) } });
      onDone();
    } catch {
      // The mutation hook shows the error toast; the page stays open to pick another time.
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Surface as="section" aria-label="Reschedule" className="gap-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-4 py-3.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">Current booking</span>
            <span className="truncate text-sm font-bold text-ink">{visit.whenLabel}</span>
            <span className="truncate text-xs text-ink-muted">
              {audience === "staff" ? `${visit.title} · ${visit.doctorName}` : visit.doctorName}
            </span>
          </span>
          <VisitTypeChip type={visit.kind === "video" ? "VIDEO_CALL" : "IN_PERSON"} variant="chip" />
          <Pill tone={visit.statusTone}>{visit.statusLabel}</Pill>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FactTile label="Reschedules used" value={`${used} of ${APPOINTMENT_MAX_RESCHEDULES}`} />
          <FactTile label="Booking ID" value={visit.id.slice(0, 8).toUpperCase()} />
        </div>

        {!visit.canReschedule ? (
          <Note tone="amber" icon={CalendarClock}>
            This visit can no longer be rescheduled. A visit can be moved {APPOINTMENT_MAX_RESCHEDULES} times while it is
            open and before check-in; a video visit only while it is confirmed and inside its 5-hour window. Need a
            different time? Ask the reception desk to help.
          </Note>
        ) : (
          <>
            <section className="flex flex-col gap-2.5" aria-label="New date">
              <SectionTitle title="1. Choose a new date" />
              <div className="overflow-x-auto pb-1">
                <BookingDateStrip
                  days={days}
                  selected={selectedDay}
                  onSelect={(day) => {
                    setDate(formatISODateInIST(day));
                    setTime("");
                  }}
                  className="min-w-[640px]"
                />
              </div>
            </section>

            <section className="flex flex-col gap-2.5" aria-label="New time">
              <SectionTitle
                title={`2. Choose a time with ${visit.doctorName}`}
                description="Crossed-out times are taken."
              />
              {slots.isLoading ? (
                <p className="m-0 flex items-center gap-2 text-[13px] text-ink-muted" role="status">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading open times…
                </p>
              ) : slots.periods && slots.periods.length > 0 ? (
                <BookingSlotGroups
                  periods={slots.periods}
                  selected={time}
                  onSelect={setTime}
                  timeStyle="12h"
                  columnsClassName="grid-cols-3 sm:grid-cols-6"
                />
              ) : (
                <p className="m-0 text-[13px] text-ink-muted">
                  {slots.error ?? "No open times on this day. Try another date."}
                </p>
              )}
            </section>

            <Field label="3. Reason for the change (optional)" htmlFor="reschedule-reason">
              <Textarea
                id="reschedule-reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder={audience === "staff" ? "For example: the patient asked for an evening slot" : "For example: a work meeting"}
              />
            </Field>

            <p className="m-0 text-xs text-ink-muted">
              {audience === "staff"
                ? "Use this only when the patient asks. The patient gets an SMS and an app notification, and the old slot is freed."
                : "You and the clinic get a confirmation straight away. Your booking ID stays the same."}
            </p>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-hair pt-4">
          <Button asChild variant="outline" size="md">
            <Link href={backHref}>Keep current time</Link>
          </Button>
          {visit.canReschedule ? (
            <Button size="md" disabled={!date || !time || reschedule.isPending} onClick={() => void submit()}>
              {reschedule.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CalendarClock aria-hidden="true" />}
              {targetLabel ? `Reschedule to ${targetLabel}` : "Pick a new time"}
            </Button>
          ) : null}
        </div>
      </Surface>
      {aside ? <div className="flex flex-col gap-5">{aside}</div> : null}
    </div>
  );
}
