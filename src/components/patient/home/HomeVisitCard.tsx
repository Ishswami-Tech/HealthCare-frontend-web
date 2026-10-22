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
import { plural } from "@/lib/utils/labels";
import { selfCheckInWindowState, type SelfCheckInWindowState } from "@/lib/utils/appointmentUtils";
import { formatDateInIST } from "@/lib/utils/date-time";
import { ClinicMapTile } from "@/components/patient/queue/ClinicMapArt";
import { formatDistance } from "@/components/patient/queue/deviceLocation";
import { useClinicProximity } from "@/components/patient/queue/useClinicProximity";

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

/** "Starts in 25 minutes" up to a day ahead, then the day: "Starts Mon, 28 Sept". */
function videoStartText(startsAt: string | null, now: number | null): string {
  const start = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  if (now !== null && Number.isFinite(start) && start - now >= 24 * 60 * 60_000) {
    const day = formatDateInIST(new Date(start), { weekday: "short", day: "numeric", month: "short" });
    if (day) return `Starts ${day}`;
  }
  return describeStart(startsAt, now);
}

function VideoVisitCard({ visit, actions }: { visit: HomeVisit; actions: HomeVisitActions }) {
  const now = useMinuteClock();
  const isRejoin = visit.joinAction === "resume";
  const headline = visit.awaitingPayment
    ? "Pay to confirm this visit"
    : isRejoin
      ? "Your doctor has started the visit"
      : videoStartText(visit.startsAt, now);
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
                "transition-colors hover:bg-mint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
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

type StepState = "done" | "current" | "todo";

const CHECK_IN_STEPS = ["Arrived", "Scan desk QR", "Get token"] as const;

/**
 * Arrived → Scan desk QR → Get token. `done` steps are ticked; `current` (or -1 for none) is
 * the one to do now: step 1 while the check-in window is open, step 2 once the device shows the
 * patient at the clinic.
 */
function CheckInSteps({ done, current }: { done: number; current: number }) {
  return (
    <ol className="relative m-0 grid list-none grid-cols-3 p-0" aria-label="Check-in steps">
      <span aria-hidden="true" className="absolute left-[16.67%] top-[17px] h-0.5 w-[66.66%] bg-line" />
      {done > 0 ? (
        <span
          aria-hidden="true"
          className="absolute left-[16.67%] top-[17px] h-0.5 bg-[#34d399]"
          style={{ width: `${(Math.min(done, CHECK_IN_STEPS.length - 1) / (CHECK_IN_STEPS.length - 1)) * 66.66}%` }}
        />
      ) : null}
      {CHECK_IN_STEPS.map((label, index) => {
        const state: StepState = index < done ? "done" : index === current ? "current" : "todo";
        return (
          <li
            key={label}
            className="relative flex flex-col items-center gap-2 text-center"
            aria-current={state === "current" ? "step" : undefined}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                state === "done" && "bg-primary text-white",
                state === "current" &&
                  "border-2 border-brand bg-card text-brand shadow-[0_0_0_4px_#d1fae5] dark:shadow-none",
                state === "todo" && "bg-well text-ink-muted",
              )}
              aria-hidden="true"
            >
              {state === "done" ? <Check className="size-4" strokeWidth={3} /> : index + 1}
            </span>
            <span className={cn("text-xs font-bold", state === "todo" ? "text-ink-muted" : "text-ink")}>
              <span className="sr-only">
                Step {index + 1}
                {state === "done" ? " (done)" : state === "current" ? " (now)" : ""}:{" "}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function QueueTile({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-center gap-0.5 px-1 text-center", !last && "border-r border-mint")}>
      <span className="text-xs text-ink-muted">{label}</span>
      <span className={cn("break-all text-[20px] font-extrabold leading-tight", accent ? "text-brand" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}

/** After check-in: token, now serving, people ahead and the wait. Token numbers only, never names. */
function QueuePanel({ visit, queue }: { visit: HomeVisit; queue?: HomeQueue | null }) {
  const position = queue?.position ?? null;
  const ahead = queue?.patientsAhead ?? (position !== null ? Math.max(0, position - 1) : null);
  const wait = queue?.estimatedWaitMinutes ?? null;
  // The appointment row rarely carries the token; the in-person visit read does (K-014).
  const tokenLabel = visit.tokenLabel ?? queue?.tokenLabel ?? null;
  const nowServing = queue?.nowServingToken ?? null;

  if (queue?.isLoading && position === null && !tokenLabel) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading your queue position">
        <Skeleton className="h-[74px] w-full rounded-[14px]" />
        <Skeleton className="h-4 w-48 rounded-md" />
      </div>
    );
  }

  if (!tokenLabel && position === null) {
    return (
      <Note tone="green" icon={Activity}>
        You are checked in. Open the live queue to see your place.
      </Note>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="grid grid-cols-3 rounded-[14px] bg-[#f4faf6] py-3.5 dark:bg-emerald-500/10">
        <QueueTile label="Your token" value={tokenLabel ?? (position !== null ? `#${position}` : "—")} accent />
        <QueueTile label="Now serving" value={nowServing ?? "—"} />
        <QueueTile label="Ahead of you" value={ahead !== null ? String(ahead) : "—"} last />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-1 text-[13px] text-ink-soft">
        {ahead === 0 ? (
          <span className="font-bold text-brand">You are next.</span>
        ) : wait !== null ? (
          <span>
            Est. wait <strong className="font-extrabold text-brand">~{Math.max(0, Math.round(wait))} min</strong>
          </span>
        ) : (
          <span>Wait time shows on the live queue.</span>
        )}
        <span className="text-xs text-ink-muted">Updates by itself</span>
      </div>
    </div>
  );
}

function clinicWindowState(visit: HomeVisit, now: number | null): SelfCheckInWindowState | null {
  // Same window as the server: 20 min before .. 45 min after the slot start. Shown for today's
  // visits, and for a late / early slot whose open window crosses midnight (23:45 at 00:10).
  const slot = visit.startsAt && now !== null ? selfCheckInWindowState(new Date(visit.startsAt), now) : null;
  return visit.isToday || slot === "OPEN" ? slot : null;
}

function ClinicChip({
  visit,
  queue,
  windowState,
}: {
  visit: HomeVisit;
  queue?: HomeQueue | null;
  windowState: SelfCheckInWindowState | null;
}) {
  if (visit.clinicStage === "queue") {
    const token = visit.tokenLabel ?? queue?.tokenLabel ?? null;
    return (
      <Pill tone="green" dot>
        {token ? `Checked in · Token ${token}` : "Checked in"}
      </Pill>
    );
  }
  if (visit.clinicStage === "in_progress") return <Pill tone="blue">In consultation</Pill>;
  if (windowState === "OPEN") {
    return (
      <Pill tone="amber" dot>
        Check-in open
      </Pill>
    );
  }
  if (windowState === "CLOSED") return <Pill tone="rose">Check-in closed</Pill>;
  if (visit.isToday) return <Pill tone="slate">Not checked in</Pill>;
  return <Pill tone={statusTone(visit.statusCode)}>{visit.statusLabel}</Pill>;
}

function ProximityBadge({ meters, atClinic }: { meters: number; atClinic: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-[#065f46] shadow-sm dark:bg-black/60 dark:text-emerald-300">
      <MapPin className="size-3" strokeWidth={2.4} aria-hidden="true" />
      {atClinic ? `You're at the clinic · ${formatDistance(meters)}` : `${formatDistance(meters)} away`}
    </span>
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
  const now = useMinuteClock();
  const windowState = clinicWindowState(visit, now);
  const checkInClosed = windowState === "CLOSED";
  const windowOpen = windowState === "OPEN";
  // Step 1 is ticked only when the device (permission already granted) puts the patient at the clinic.
  const proximity = useClinicProximity(visit.clinicPoint ?? null, windowOpen && !inQueue && !withDoctor);
  const stepsDone = proximity?.atClinic ? 1 : 0;
  const stepsCurrent = windowOpen ? stepsDone : -1;

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
        <ClinicChip visit={visit} queue={queue} windowState={windowState} />
      </div>

      <div
        className={cn(
          "grid items-stretch gap-x-7 gap-y-5",
          inQueue ? "@3xl:grid-cols-[minmax(0,1fr)_360px]" : "@3xl:grid-cols-[minmax(0,1fr)_260px]",
        )}
      >
        <div className="flex min-w-0 flex-col justify-center gap-5">
          <DoctorBlock visit={visit} />
          {!inQueue && !withDoctor && !checkInClosed ? (
            <CheckInSteps done={stepsDone} current={stepsCurrent} />
          ) : null}
          {withDoctor ? (
            <Note tone="green" icon={Activity}>
              Your consultation is in progress.
            </Note>
          ) : null}
        </div>
        {inQueue ? (
          <div className="flex min-w-0 flex-col justify-center">
            <QueuePanel visit={visit} queue={queue} />
          </div>
        ) : (
          <ClinicMapTile
            directionsUrl={visit.directionsUrl}
            placeName={visit.locationLabel}
            className="h-[150px] @3xl:h-full @3xl:min-h-[190px]"
            badge={proximity ? <ProximityBadge meters={proximity.meters} atClinic={proximity.atClinic} /> : null}
          />
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
              View live queue
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : withDoctor ? null : checkInClosed ? (
          <p className="m-0 text-sm font-semibold text-ink-soft">
            Self check-in has closed. Please ask the reception desk.
          </p>
        ) : (
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
  const now = useMinuteClock();
  const isVideo = visit.kind === "video";
  const Icon = isVideo ? Video : Hospital;
  const when = [visit.isToday ? "Today" : visit.dateLabel, visit.timeLabel].filter(Boolean).join(" · ");
  const canCheckIn = !isVideo && visit.clinicStage === "upcoming" && clinicWindowState(visit, now) === "OPEN";
  const subtitle = [visit.doctorName, isVideo ? "Video consultation" : "In-clinic visit"].filter(Boolean).join(" · ");
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
        <span className="truncate text-sm font-bold text-ink">{when}</span>
        <span className="truncate text-xs text-ink-muted">{subtitle}</span>
      </span>
      {visit.clinicStage === "queue" && !isVideo ? (
        <Pill tone="green">{visit.tokenLabel ? `Token ${visit.tokenLabel}` : "Checked in"}</Pill>
      ) : (
        <Pill tone={visit.awaitingPayment ? "amber" : statusTone(visit.statusCode)}>{visit.statusLabel}</Pill>
      )}
      {isVideo && visit.canJoin ? (
        <Button variant="action" onClick={() => actions.onJoin(visit.id)}>
          <Video aria-hidden="true" />
          {visit.joinAction === "resume" ? "Rejoin session" : "Join session"}
        </Button>
      ) : canCheckIn ? (
        <Button onClick={actions.onCheckIn}>
          <ScanLine aria-hidden="true" />
          Check in
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <Link
            href={`/patient/appointments?id=${encodeURIComponent(visit.id)}`}
            aria-label={`Details of the visit on ${when}`}
          >
            Details
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </li>
  );
}
