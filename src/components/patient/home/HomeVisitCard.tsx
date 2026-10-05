"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  Hospital,
  MapPin,
  Phone,
  ScanLine,
  Video,
} from "lucide-react";
import { AppointmentExpiryCountdown } from "@/components/appointments/AppointmentExpiryCountdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialsAvatar, Note, Pill, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { HomeQueue, HomeVisit } from "./types";

export interface HomeVisitActions {
  /** Open the video waiting room for this visit. */
  onJoin: (visitId: string) => void;
  /** Go to where the visit can be moved to another slot. */
  onReschedule: (visitId: string) => void;
  /** Go to where a pending video visit is paid. */
  onPay: (visitId: string) => void;
  /** Start the clinic QR check-in. */
  onCheckIn: () => void;
}

/** Re-renders on a slow tick so "Starts in 25 minutes" stays true while the page is open. */
function useMinuteClock(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

/** "Starts in 25 minutes", "Started 5 minutes ago", "Starts in 3 days". */
export function describeStart(startsAt: string | null, now: number | null): string {
  if (!startsAt) return "Time to be confirmed";
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return "Time to be confirmed";
  if (now === null) return "Starts soon";
  const minutes = Math.round((start - now) / 60_000);
  if (minutes >= 48 * 60) return `Starts in ${plural(Math.round(minutes / (24 * 60)), "day")}`;
  if (minutes >= 90) return `Starts in ${plural(Math.round(minutes / 60), "hour")}`;
  if (minutes >= 1) return `Starts in ${plural(minutes, "minute")}`;
  if (minutes > -1) return "Starting now";
  if (minutes > -90) return `Started ${plural(-minutes, "minute")} ago`;
  return `Started ${plural(Math.round(-minutes / 60), "hour")} ago`;
}

function DoctorBlock({ visit }: { visit: HomeVisit }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="flex min-w-0 items-center gap-3.5">
        {visit.doctorPhotoUrl && !photoFailed ? (
          <Image
            src={visit.doctorPhotoUrl}
            alt=""
            width={60}
            height={60}
            unoptimized
            onError={() => setPhotoFailed(true)}
            className="size-[60px] shrink-0 rounded-[14px] bg-mint object-cover object-top"
          />
        ) : (
          <InitialsAvatar name={visit.doctorName} size={60} square />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 break-words text-[15px] font-bold leading-snug text-ink">{visit.doctorName}</span>
          <span className="truncate text-[13px] text-ink-soft">{visit.visitLabel}</span>
          {visit.doctorDetail ? <span className="truncate text-xs text-ink-muted">{visit.doctorDetail}</span> : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2 text-[13px] font-semibold text-ink">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Calendar className="size-4 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
          <span>{visit.dateLabel}</span>
          {visit.timeLabel ? (
            <>
              <span aria-hidden="true" className="h-3.5 w-px bg-[#cbd5e1] dark:bg-white/20" />
              <span>{visit.timeLabel}</span>
            </>
          ) : null}
        </div>
        {visit.kind === "clinic" && visit.locationLabel ? (
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-px size-4 shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
            <span className="min-w-0 break-words">{visit.locationLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Video ──────────────────────────────────────────────────────────────────

function VideoVisitCard({ visit, actions }: { visit: HomeVisit; actions: HomeVisitActions }) {
  const now = useMinuteClock();
  const isRejoin = visit.joinAction === "resume";
  const headline = visit.awaitingPayment
    ? "Pay to confirm this visit"
    : isRejoin
      ? "Your doctor has started the visit"
      : describeStart(visit.startsAt, now);
  const reasonId = `visit-${visit.id}-join-note`;
  const showReason = !visit.canJoin && !visit.awaitingPayment && Boolean(visit.joinBlockedReason);

  const barClass =
    "flex min-h-12 w-full items-center gap-2.5 rounded-xl bg-[#ecfdf5] px-3.5 text-left text-[#065f46] dark:bg-emerald-500/10 dark:text-emerald-300";
  const barBody = (
    <>
      {visit.awaitingPayment ? (
        <CreditCard className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      ) : (
        <Clock className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      )}
      <span className="flex-1 text-sm font-bold" suppressHydrationWarning>
        {headline}
      </span>
    </>
  );

  return (
    <article
      aria-label={`Video consultation with ${visit.doctorName}`}
      className="flex flex-col gap-[18px] rounded-[18px] border border-line bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#eef2ff] text-[#4f46e5] dark:bg-indigo-500/15 dark:text-indigo-300"
          aria-hidden="true"
        >
          <Video className="size-4 fill-current" strokeWidth={2} />
        </span>
        <span className="flex-1 text-sm font-bold text-[#3730a3] dark:text-indigo-300">Video Consultation</span>
        <AppointmentExpiryCountdown
          expiresAt={visit.confirmationExpiresAt}
          windowMinutes={visit.confirmationWindowMinutes}
          status={visit.statusCode}
          variant="compact"
        />
        <Pill tone={visit.awaitingPayment ? "amber" : statusTone(visit.statusCode)}>{visit.statusLabel}</Pill>
      </div>

      <div className="grid items-center gap-x-7 gap-y-4 @3xl:grid-cols-[minmax(0,1fr)_380px]">
        <DoctorBlock visit={visit} />
        <div className="flex min-w-0 flex-col gap-2">
          {visit.canJoin ? (
            <button
              type="button"
              onClick={() => actions.onJoin(visit.id)}
              className={cn(
                barClass,
                "transition-colors hover:bg-[#d1fae5] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 dark:hover:bg-emerald-500/20",
              )}
            >
              {barBody}
              <ChevronRight className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : (
            <div className={barClass}>{barBody}</div>
          )}
          {showReason ? (
            <p id={reasonId} className="m-0 text-xs leading-snug text-ink-muted">
              {visit.joinBlockedReason}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* A patient can never cancel a video visit, so there is no Cancel button here. */}
          {visit.canReschedule ? (
            <Button variant="outline" size="md" onClick={() => actions.onReschedule(visit.id)}>
              <Calendar aria-hidden="true" />
              Reschedule
            </Button>
          ) : null}
        </div>
        {visit.awaitingPayment ? (
          <Button variant="action" size="md" className="h-12 w-full sm:w-auto" onClick={() => actions.onPay(visit.id)}>
            <CreditCard aria-hidden="true" />
            Pay now
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="action"
            size="md"
            className="h-12 w-full sm:w-auto"
            disabled={!visit.canJoin}
            aria-describedby={showReason ? reasonId : undefined}
            onClick={() => actions.onJoin(visit.id)}
          >
            <Video aria-hidden="true" />
            {isRejoin ? "Rejoin session" : "Join Video Consultation"}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </article>
  );
}

// ── In clinic ──────────────────────────────────────────────────────────────

const CHECK_IN_STEPS = ["Reach the clinic", "Scan desk QR", "Get token"] as const;

/** The three steps of a clinic check-in. Step 1 is the current one until the patient checks in. */
function CheckInSteps() {
  return (
    <ol className="relative m-0 grid list-none grid-cols-3 p-0" aria-label="How check-in works">
      <span aria-hidden="true" className="absolute left-[16.67%] top-[17px] h-0.5 w-[66.66%] bg-line" />
      {CHECK_IN_STEPS.map((label, index) => {
        const current = index === 0;
        return (
          <li key={label} className="relative flex flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                current
                  ? "border-2 border-[#047857] bg-card text-[#047857] dark:border-emerald-400 dark:text-emerald-300"
                  : "bg-[#f1f5f9] text-ink-muted dark:bg-white/10",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className={cn("text-xs font-bold", current ? "text-ink" : "text-ink-muted")}>
              <span className="sr-only">Step {index + 1}: </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function QueueTile({ label, value, accent = false, last = false }: { label: string; value: string; accent?: boolean; last?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5 px-1 text-center", !last && "border-r border-[#d1fae5] dark:border-emerald-900/60")}>
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={cn("text-[22px] font-extrabold leading-tight", accent ? "text-[#047857] dark:text-emerald-300" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}

/** Dots from "Now" to "You": one open dot per person ahead (at most four are drawn). */
function QueueTrack({ ahead }: { ahead: number }) {
  const drawn = Math.min(ahead, 4);
  const hidden = ahead - drawn;
  const columns = drawn + 1;
  return (
    <div
      className="relative grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="img"
      aria-label={ahead === 0 ? "You are next" : `${plural(ahead, "patient")} ahead of you`}
    >
      {columns > 1 ? (
        <span
          aria-hidden="true"
          className="absolute top-3 h-[3px] rounded-sm bg-[#bbe5c9] dark:bg-emerald-800"
          style={{ left: `${50 / columns}%`, right: `${50 / columns}%` }}
        />
      ) : null}
      {Array.from({ length: drawn }, (_, index) => (
        <div key={index} className="relative flex flex-col items-center gap-1.5">
          <span className="flex size-[26px] items-center justify-center">
            {index === 0 ? (
              <span className="size-3.5 rounded-full border-[3px] border-card bg-[#047857] shadow-[0_0_0_1px_#047857]" />
            ) : (
              <span className="size-3 rounded-full border-2 border-[#047857] bg-card" />
            )}
          </span>
          <span className={cn("text-xs", index === 0 ? "font-semibold text-ink" : "font-medium text-ink-muted")}>
            {index === 0 ? "Now" : index === drawn - 1 && hidden > 0 ? `+${hidden}` : " "}
          </span>
        </div>
      ))}
      <div className="relative flex flex-col items-center gap-1.5">
        <span className="flex size-[26px] items-center justify-center rounded-full bg-[#047857] text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
        <span className="text-xs font-extrabold text-[#047857] dark:text-emerald-300">You</span>
      </div>
    </div>
  );
}

function QueuePanel({ visit, queue }: { visit: HomeVisit; queue?: HomeQueue | null }) {
  const position = queue?.position ?? null;
  const ahead = queue?.patientsAhead ?? (position !== null ? Math.max(0, position - 1) : null);
  const wait = queue?.estimatedWaitMinutes ?? null;

  if (queue?.isLoading && position === null) {
    return (
      <div className="flex flex-col gap-3 @4xl:col-span-2" aria-busy="true" aria-label="Loading your queue position">
        <Skeleton className="h-[74px] w-full rounded-[14px]" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
    );
  }

  if (!visit.tokenLabel && position === null) {
    return (
      <Note tone="green" icon={Activity} className="@4xl:col-span-2">
        You are checked in. Open the live queue to see your place.
      </Note>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 rounded-[14px] bg-[#f4faf6] py-3.5 dark:bg-emerald-500/10">
        <QueueTile label="Your token" value={visit.tokenLabel ?? "—"} accent />
        <QueueTile label="Your position" value={position !== null ? String(position) : "—"} />
        <QueueTile label="Patients ahead" value={ahead !== null ? String(ahead) : "—"} last />
      </div>
      <div className="flex min-w-0 flex-col gap-3.5">
        {ahead !== null ? <QueueTrack ahead={ahead} /> : null}
        <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-[13px] text-ink-soft">
          {wait !== null ? (
            <span>
              Estimated wait time:{" "}
              <strong className="font-extrabold text-[#047857] dark:text-emerald-300">~{Math.max(0, Math.round(wait))} min</strong>
            </span>
          ) : ahead === 0 ? (
            <span className="font-bold text-[#047857] dark:text-emerald-300">You are next.</span>
          ) : (
            <span>Wait time shows on the live queue.</span>
          )}
          {position !== null ? <span className="text-xs text-ink-muted">Updates every 30 seconds</span> : null}
        </div>
      </div>
    </>
  );
}

function ClinicVisitCard({
  visit,
  queue,
  actions,
}: {
  visit: HomeVisit;
  queue?: HomeQueue | null;
  actions: HomeVisitActions;
}) {
  const inQueue = visit.clinicStage === "queue";
  const withDoctor = visit.clinicStage === "in_progress";

  return (
    <article
      aria-label={`Clinic visit with ${visit.doctorName}`}
      className="flex flex-col gap-[18px] rounded-[18px] border border-[#d1fae5] bg-[#fbfefc] p-4 sm:p-5 dark:border-emerald-900/50 dark:bg-emerald-500/5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="flex size-[30px] shrink-0 items-center justify-center rounded-[9px] bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
          aria-hidden="true"
        >
          <Hospital className="size-[15px]" strokeWidth={2.2} />
        </span>
        <span className="flex-1 text-sm font-bold text-ink">In-Clinic Visit</span>
        {inQueue ? (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#047857] px-2.5 py-[5px] text-[11px] font-extrabold uppercase leading-none tracking-[0.4px] text-white">
            <span className="tbd-pulse size-1.5 rounded-full bg-[#a7f3d0]" aria-hidden="true" />
            Live queue
          </span>
        ) : withDoctor ? (
          <Pill tone="blue">In progress</Pill>
        ) : visit.isToday ? (
          <Pill tone="amber" dot>
            Check-in open
          </Pill>
        ) : (
          <Pill tone={statusTone(visit.statusCode)}>{visit.statusLabel}</Pill>
        )}
      </div>

      <div
        className={cn(
          "grid items-center gap-x-7 gap-y-5",
          inQueue
            ? "@4xl:grid-cols-[minmax(0,1fr)_320px_330px]"
            : "@3xl:grid-cols-[minmax(0,1fr)_340px]",
        )}
      >
        <DoctorBlock visit={visit} />
        {inQueue ? (
          <QueuePanel visit={visit} queue={queue} />
        ) : withDoctor ? (
          <Note tone="green" icon={Activity}>
            Your visit is in progress.
          </Note>
        ) : (
          <CheckInSteps />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {visit.clinicPhone ? (
            <Button variant="outline" size="md" asChild>
              <a href={`tel:${visit.clinicPhone}`}>
                <Phone aria-hidden="true" />
                Call Clinic
              </a>
            </Button>
          ) : null}
          {visit.directionsUrl ? (
            <Button variant="outline" size="md" asChild>
              <a href={visit.directionsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                Get Directions
              </a>
            </Button>
          ) : null}
        </div>
        {inQueue ? (
          <Button size="md" className="h-12 w-full sm:w-auto" asChild>
            <Link href="/patient/queue">
              <Activity aria-hidden="true" />
              Track Live Queue
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : withDoctor ? null : (
          <Button size="md" className="h-12 w-full sm:w-auto" onClick={actions.onCheckIn}>
            <ScanLine aria-hidden="true" />
            Check in with QR
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </article>
  );
}

/** The full card for the next visit: video, clinic (check-in), or clinic (in the queue). */
export function HomeVisitCard({
  visit,
  queue,
  actions,
}: {
  visit: HomeVisit;
  queue?: HomeQueue | null;
  actions: HomeVisitActions;
}) {
  return visit.kind === "video" ? (
    <VideoVisitCard visit={visit} actions={actions} />
  ) : (
    <ClinicVisitCard visit={visit} queue={queue} actions={actions} />
  );
}

/** One line for every further upcoming visit, under the main card. */
export function HomeVisitRow({ visit, actions }: { visit: HomeVisit; actions: HomeVisitActions }) {
  const isVideo = visit.kind === "video";
  const Icon = isVideo ? Video : Hospital;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-card px-3.5 py-3">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          isVideo
            ? "bg-[#eef2ff] text-[#4f46e5] dark:bg-indigo-500/15 dark:text-indigo-300"
            : "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300",
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <span className="truncate text-sm font-bold text-ink">{visit.doctorName}</span>
        <span className="truncate text-xs text-ink-muted">
          {isVideo ? "Video" : "In clinic"} · {[visit.dateLabel, visit.timeLabel].filter(Boolean).join(" · ")}
        </span>
      </span>
      <Pill tone={visit.awaitingPayment ? "amber" : statusTone(visit.statusCode)}>{visit.statusLabel}</Pill>
      {isVideo && visit.canJoin ? (
        <Button variant="action" onClick={() => actions.onJoin(visit.id)}>
          <Video aria-hidden="true" />
          {visit.joinAction === "resume" ? "Rejoin session" : "Join session"}
        </Button>
      ) : null}
    </li>
  );
}
