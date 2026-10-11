"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Activity, Calendar, CalendarClock, Clock, Hospital, ScanLine, Video } from "lucide-react";
import { AppointmentExpiryCountdown } from "@/components/appointments/AppointmentExpiryCountdown";
import { PaymentCountdown } from "@/components/appointments/PaymentCountdown";
import { describeStart } from "@/components/patient/home/HomeVisitCard";
import { Chip, Divider, InitialsAvatar, Pill, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import type { ManagerPayRenderer, ManagerVisit, ManagerVisitActions } from "./types";

/** Doctor photo (or initials) used by the cards and the table rows. */
export function VisitAvatar({ visit, size }: { visit: ManagerVisit; size: number }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  if (visit.photoUrl && !photoFailed) {
    return (
      <Image
        src={visit.photoUrl}
        alt=""
        width={size}
        height={size}
        unoptimized
        onError={() => setPhotoFailed(true)}
        className="shrink-0 bg-mint object-cover object-top"
        style={{ width: size, height: size, borderRadius: size >= 56 ? 14 : 12 }}
      />
    );
  }
  return <InitialsAvatar name={visit.avatarName} size={size} square />;
}

/** "Video" (indigo) or "In-Clinic · place" (green). */
export function VisitTypeChip({ visit, short = false }: { visit: ManagerVisit; short?: boolean }) {
  const isVideo = visit.kind === "video";
  return (
    <Chip icon={isVideo ? Video : Hospital} tone={isVideo ? "video" : "clinic"} className="max-w-full">
      <span className="min-w-0 truncate">{isVideo ? "Video" : short ? "In-Clinic" : visit.typeLabel}</span>
    </Chip>
  );
}

/**
 * One upcoming visit: who, when, what kind, where it stands, and what can be done now.
 * One main button: pay (amber), join (amber), check in or track the queue (emerald).
 */
export function ManagerVisitCard({
  visit,
  now,
  actions,
  renderPay,
  checkInHref,
  cancelling,
  rescheduling,
}: {
  visit: ManagerVisit;
  now: number | null;
  actions: ManagerVisitActions;
  renderPay: ManagerPayRenderer;
  /** Where "Check in" goes for this viewer. */
  checkInHref: string;
  cancelling: boolean;
  rescheduling: boolean;
}) {
  const isVideo = visit.kind === "video";
  const isRejoin = visit.joinAction === "resume";
  const started = visit.startsAtMs !== null && now !== null && now >= visit.startsAtMs;
  const reasonId = `visit-${visit.id}-join-note`;
  const showReason = visit.showJoin && !visit.canJoin && Boolean(visit.joinBlockedReason);

  const stateLine = visit.showJoin
    ? isRejoin
      ? "The doctor has started the visit"
      : describeStart(visit.startsAt, now)
    : visit.clinicStage === "queue"
      ? "Checked in"
      : visit.clinicStage === "in_progress"
        ? "Visit in progress"
        : null;

  const mainAction = visit.awaitingPayment ? (
    renderPay(visit, "pay")
  ) : visit.showJoin ? (
    // Join is amber, and works only inside the join window (or once the doctor has started).
    <Button
      variant="action"
      size="md"
      className="max-sm:flex-1"
      disabled={!visit.canJoin}
      aria-describedby={showReason ? reasonId : undefined}
      onClick={() => actions.onJoin(visit.id)}
    >
      <Video aria-hidden="true" />
      {isRejoin ? "Rejoin session" : "Join call"}
    </Button>
  ) : visit.canTrackQueue ? (
    <Button size="md" className="max-sm:flex-1" asChild>
      <Link href="/patient/queue">
        <Activity aria-hidden="true" />
        Track live queue
      </Link>
    </Button>
  ) : visit.canCheckIn ? (
    <Button size="md" className="max-sm:flex-1" asChild>
      <Link href={checkInHref}>
        <ScanLine aria-hidden="true" />
        Check in
      </Link>
    </Button>
  ) : null;

  const hasFooter =
    Boolean(mainAction) ||
    visit.canCancel ||
    visit.canReschedule ||
    visit.canDeclineSlots ||
    Boolean(visit.directionsUrl);

  return (
    <Surface
      as="article"
      className="@container"
      aria-label={`${isVideo ? "Video visit" : "Clinic visit"}: ${visit.title}, ${visit.whenLabel}`}
    >
      <div className="flex items-center gap-3.5">
        <VisitAvatar visit={visit} size={56} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-ink">{visit.title}</span>
          <span className="truncate text-[13px] text-ink-muted">{visit.subtitle}</span>
          {/* On a narrow card the tag sits under the name, so the name keeps its room. */}
          <Pill tone={visit.statusTone} dot={visit.statusDot} className="mt-1 self-start @md:hidden">
            {visit.statusLabel}
          </Pill>
        </div>
        <Pill tone={visit.statusTone} dot={visit.statusDot} className="hidden @md:inline-flex">
          {visit.statusLabel}
        </Pill>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip icon={Calendar}>{visit.whenLabel}</Chip>
        <VisitTypeChip visit={visit} />
        {stateLine ? (
          <Chip icon={visit.kind === "video" ? Clock : Activity} tone={visit.canJoin || !isVideo ? "green" : "slate"}>
            <span suppressHydrationWarning>{stateLine}</span>
          </Chip>
        ) : null}
        {visit.showJoin && started ? (
          <AppointmentExpiryCountdown
            expiresAt={visit.confirmationExpiresAt}
            windowMinutes={visit.confirmationWindowMinutes}
            status={visit.filterStatus}
          />
        ) : null}
      </div>

      {visit.awaitingPayment ? (
        visit.paymentExpiresAt ? (
          <PaymentCountdown
            paymentExpiresAt={visit.paymentExpiresAt}
            paymentWindowMinutes={visit.paymentWindowMinutes}
            onExpire={actions.onPaymentWindowExpired}
          />
        ) : (
          <p className="m-0 text-[13px] leading-snug text-ink-muted">
            This slot is held for you. Pay to confirm the visit.
          </p>
        )
      ) : null}

      {visit.awaitingSlot ? (
        <div className="flex flex-col gap-2 rounded-[14px] bg-[#fffbeb] px-3.5 py-3 text-[#92400e] dark:bg-amber-950/30 dark:text-amber-200">
          <p className="m-0 flex items-center gap-2 text-[13px] font-bold">
            <CalendarClock className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            Waiting for the doctor to pick a time
          </p>
          {visit.proposedSlots.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Times proposed">
              {visit.proposedSlots.map((slot) => (
                <li
                  key={slot}
                  className="rounded-lg bg-white/80 px-2 py-1 text-xs font-semibold text-[#92400e] dark:bg-white/10 dark:text-amber-200"
                >
                  {slot}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="m-0 text-xs leading-snug">You will be told as soon as the time is confirmed.</p>
        </div>
      ) : null}

      {showReason ? (
        <p id={reasonId} className="m-0 text-xs leading-snug text-ink-muted">
          {visit.joinBlockedReason}
        </p>
      ) : null}

      {hasFooter ? (
        <>
          <Divider />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
            {visit.rescheduleHint ? (
              <span className="text-xs font-semibold text-ink-muted">{visit.rescheduleHint}</span>
            ) : null}
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2.5">
              {/* A patient never gets Cancel on a video visit: `canCancel` is false for it. */}
              {visit.canCancel ? (
                <Button variant="danger" size="md" disabled={cancelling} onClick={() => actions.onCancel(visit.id)}>
                  Cancel
                </Button>
              ) : null}
              {visit.directionsUrl ? (
                <Button variant="outline" size="md" asChild>
                  <a href={visit.directionsUrl} target="_blank" rel="noopener noreferrer">
                    Directions
                  </a>
                </Button>
              ) : null}
              {visit.canDeclineSlots ? (
                <Button variant="outline" size="md" onClick={() => actions.onDeclineSlots(visit.id)}>
                  Decline times
                </Button>
              ) : null}
              {visit.canReschedule ? (
                <Button
                  variant="outline"
                  size="md"
                  disabled={rescheduling}
                  onClick={() => actions.onReschedule(visit.id)}
                >
                  Reschedule
                </Button>
              ) : null}
              {mainAction}
            </div>
          </div>
        </>
      ) : null}
    </Surface>
  );
}
