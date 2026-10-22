"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Bell,
  Calendar,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hospital,
  KeyRound,
  MapPin,
  Pencil,
  ScanQrCode,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, InitialsAvatar, Note, PageHead, Pill, Surface } from "@/components/tbd";
import type { HomeVisit } from "@/components/patient/home/types";
import { cn } from "@/lib/utils";
import { QueueTokenCard } from "../../queue/_components/QueueParts";
import { ClinicMapTile } from "@/components/patient/queue/ClinicMapArt";
import { formatDistance } from "@/components/patient/queue/deviceLocation";
import { isNextInLine, type QueueTicket } from "@/components/patient/queue/queueData";
import {
  ENABLE_LOCATION_STEPS,
  PATIENT_PLAN_ROUTE,
  type CheckInErrorCopy,
} from "@/components/patient/queue/checkInErrors";
import { formatTimeLabel } from "@/lib/utils/date-time";
import type { InPersonVisit } from "@/types/in-person.types";

/**
 * Check in at clinic (patient): the three states of `/patient/check-in`, plus the smaller
 * ones (pick a visit, no in-clinic visit, loading). Props-driven: the page container owns the
 * data hooks and the check-in mutation.
 */

const BACK_HREF = "/patient/appointments";

// ── 1 · Check in at clinic ─────────────────────────────────────────────────

type StepState = "done" | "current" | "todo";

const STEPS: Array<{ title: string; text: string; doneText?: string }> = [
  { title: "Arrive at the clinic", text: "Go to the reception desk", doneText: "Done · we can see you are at the clinic" },
  { title: "Scan the QR at reception", text: "It is on the stand at the desk" },
  { title: "Get your token & join the queue", text: "We show your token, place and the wait" },
];

function StepList({ current }: { current: number }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1 p-0">
      {STEPS.map((step, index) => {
        const state: StepState = index < current ? "done" : index === current ? "current" : "todo";
        const last = index === STEPS.length - 1;
        return (
          <li key={step.title} className="flex items-start gap-3.5" aria-current={state === "current" ? "step" : undefined}>
            <span className="flex flex-col items-center" aria-hidden="true">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                  state === "done" && "bg-primary text-white",
                  state === "current" &&
                    "border-2 border-brand bg-card text-brand",
                  state === "todo" && "bg-well text-ink-muted",
                )}
              >
                {state === "done" ? <Check className="size-4" strokeWidth={3} /> : index + 1}
              </span>
              {!last ? (
                <span
                  className={cn(
                    "h-[26px] w-0.5",
                    state === "done" ? "bg-[#a7f3d0] dark:bg-emerald-700" : "bg-line",
                  )}
                />
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col gap-0.5 pt-px">
              <span className="text-sm font-bold text-ink">
                <span className="sr-only">
                  Step {index + 1}
                  {state === "done" ? " (done)" : ""}:{" "}
                </span>
                {step.title}
              </span>
              <span className={cn("text-[13px]", state === "done" ? "font-semibold text-brand" : "text-ink-muted")}>
                {state === "done" && step.doneText ? step.doneText : step.text}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DoctorPhoto({ visit }: { visit: HomeVisit }) {
  const [failed, setFailed] = useState(false);
  return visit.doctorPhotoUrl && !failed ? (
    <Image
      src={visit.doctorPhotoUrl}
      alt=""
      width={56}
      height={56}
      unoptimized
      onError={() => setFailed(true)}
      className="size-14 shrink-0 rounded-2xl bg-mint object-cover object-top"
    />
  ) : (
    <InitialsAvatar name={visit.doctorName} size={56} square />
  );
}

/**
 * The hint under "Scan clinic QR": the backend check-in window ("Check-in opens 09:40 am –
 * 10:45 am"; 20 min before .. 45 min after the slot) decides, not the calendar day: a 23:45
 * visit can still be checked in at 00:10.
 */
function checkInHint(visit: HomeVisit, window: InPersonVisit["checkInWindow"] | undefined): string {
  const opens = window ? formatTimeLabel(window.opensAt) : "";
  const closes = window ? formatTimeLabel(window.closesAt) : "";
  const range = opens && closes ? `Check-in opens ${opens} – ${closes}` : "";
  if (window?.state === "CLOSED") return "Self check-in has closed. Please ask the reception desk to check you in.";
  if (window?.state === "TOO_EARLY") return range ? `${range}. Scan the QR at the clinic then.` : "Check-in is not open yet.";
  if (window?.state === "OPEN") return range ? `${range} · we check your location when you scan.` : "We check your location when you scan.";
  return visit.isToday
    ? "We check your location when you scan."
    : `Your visit is on ${visit.dateLabel}. Check in at the clinic on that day.`;
}

/** "Monthly plan active till 28 Nov 2026 · this visit is included" (in-clinic visits only). */
export interface CheckInPlanInfo {
  planName: string;
  activeTillLabel: string | null;
}

export function CheckInIntroView({
  visit,
  bookingRef,
  checkInWindow,
  plan,
  proximity,
  onScan,
}: {
  /** The in-clinic visit to check in for. Never a video visit. */
  visit: HomeVisit;
  /** Short booking reference shown to people. */
  bookingRef?: string;
  /** The backend window of this visit (`GET in-person/me/today`), when the visit is in it. */
  checkInWindow?: InPersonVisit["checkInWindow"];
  /** The patient's active monthly plan, which covers in-clinic visits. Left out without one. */
  plan?: CheckInPlanInfo | null;
  /** Distance to the clinic, when the browser already shares the location. */
  proximity?: { meters: number; atClinic: boolean } | null;
  onScan: () => void;
}) {
  const when = [visit.isToday ? "Today" : visit.dateLabel, visit.timeLabel].filter(Boolean).join(", ");
  const arrived = Boolean(proximity?.atClinic);
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Check in at clinic" description={`In-clinic visit · ${when}`} backHref={BACK_HREF} />

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface as="section" className="gap-4" aria-label="Your visit">
          <div className="flex flex-wrap items-center gap-3.5">
            <DoctorPhoto visit={visit} />
            <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
              <span className="break-words text-[15px] font-extrabold text-ink">{visit.doctorName}</span>
              <span className="break-words text-[13px] text-ink-muted">
                {[visit.visitLabel, bookingRef ? `Booking ${bookingRef}` : ""].filter(Boolean).join(" · ")}
              </span>
            </div>
            <Pill tone="amber">Not checked in</Pill>
          </div>

          {plan ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-[#ecfdf5] px-3.5 py-2.5 text-[13px] font-semibold text-[#065f46] dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
              <span className="min-w-0 break-words">
                {plan.planName || "Monthly plan"} active{plan.activeTillLabel ? ` till ${plan.activeTillLabel}` : ""} · this
                visit is included
              </span>
            </div>
          ) : null}

          <ClinicMapTile
            directionsUrl={visit.directionsUrl}
            placeName={visit.locationLabel}
            className="h-[200px] sm:h-[224px]"
            badge={
              proximity ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold shadow-sm",
                    arrived
                      ? "bg-primary text-white"
                      : "bg-white/95 text-[#065f46] dark:bg-black/60 dark:text-emerald-300",
                  )}
                >
                  <MapPin className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
                  {arrived
                    ? `You're at the clinic · ${formatDistance(proximity.meters)}`
                    : `${formatDistance(proximity.meters)} from the clinic`}
                </span>
              ) : null
            }
          />

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
            <MapPin className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
            <span className="flex min-w-0 flex-1 basis-40 flex-col">
              <span className="break-words font-bold text-ink">{visit.locationLabel ?? "Your clinic"}</span>
              {visit.addressLine ? (
                <span className="break-words text-[13px] text-ink-muted">{visit.addressLine}</span>
              ) : null}
            </span>
            {visit.directionsUrl ? (
              <a
                href={visit.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Directions
                <ArrowRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </Surface>

        <Surface as="section" className="gap-[18px]" aria-label="How check-in works">
          <h2 className="m-0 text-base font-bold text-ink">How check-in works</h2>
          <StepList current={arrived ? 1 : 0} />
          <div className="flex-1" />
          <div className="flex flex-col gap-2.5">
            <Button size="xl" className="w-full" onClick={onScan}>
              <ScanQrCode aria-hidden="true" />
              Scan clinic QR
            </Button>
            <span className="text-center text-xs text-ink-muted">{checkInHint(visit, checkInWindow)}</span>
            <span className="text-center text-xs text-ink-muted">
              Trouble scanning? Enter the desk code on the next screen, or ask the reception desk.
            </span>
          </div>
        </Surface>
      </div>
    </div>
  );
}

// ── 2 · Scan clinic QR ─────────────────────────────────────────────────────

export function CheckInScanView({
  scanner,
  locationLabel,
  onBack,
  onEnterCode,
}: {
  /** The camera panel (`QRScanner`, or `ScannerFrame` while a code is being checked). */
  scanner: ReactNode;
  locationLabel?: string | null;
  onBack: () => void;
  onEnterCode: () => void;
}) {
  return (
    // Dark, edge to edge on phones (cancels the page padding), a rounded dark panel on desktop.
    <div className="-mx-4 -mt-1 flex flex-col gap-4 bg-[#0b1f1a] px-4 pb-5 pt-4 text-white sm:mx-0 sm:mt-0 sm:rounded-[28px] sm:p-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#34d399]"
        >
          <ChevronLeft className="size-5" strokeWidth={2.4} aria-hidden="true" />
        </button>
        <h1 className="m-0 text-xl font-extrabold tracking-[-0.3px] text-white sm:text-2xl">Scan clinic QR</h1>
      </div>

      {scanner}

      <div className="flex flex-col gap-3.5 rounded-[20px] bg-card px-5 py-[18px] text-ink sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
        <div className="flex min-w-0 items-center gap-3.5 sm:flex-1 sm:basis-52">
          <IconBox icon={Hospital} tone="mint" size={44} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold text-ink">Point at the QR on the reception desk</span>
            <span className="break-words text-[13px] text-ink-muted">
              {locationLabel ? `${locationLabel} · it scans automatically` : "It scans automatically"}
            </span>
          </span>
        </div>
        <span className="flex items-center gap-3 text-[13px] text-ink-muted" aria-hidden="true">
          <span className="h-px flex-1 bg-line sm:h-7 sm:w-px sm:flex-none" />
          or
          <span className="h-px flex-1 bg-line sm:h-7 sm:w-px sm:flex-none" />
        </span>
        <Button variant="outline" size="md" className="max-sm:w-full" onClick={onEnterCode}>
          <Pencil aria-hidden="true" />
          Enter the desk code instead
        </Button>
      </div>
      <p className="m-0 text-center text-xs text-white/70">
        Camera not working? Enter the desk code, or ask the reception desk to check you in.
      </p>
    </div>
  );
}

// ── 3 · Checked in ─────────────────────────────────────────────────────────

function CheckedInArt() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="58" className="fill-mint" />
      <circle cx="60" cy="60" r="44" className="fill-[#a7f3d0] dark:fill-emerald-500/30" />
      <circle cx="60" cy="60" r="32" fill="#047857" />
      <path d="M46 60l10 10 18-20" stroke="#ffffff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="14" cy="24" r="4" fill="#facc15" />
      <circle cx="106" cy="30" r="3" fill="#38bdf8" />
      <circle cx="100" cy="100" r="4" fill="#34d399" />
      <path d="M18 96l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#fbbf24" />
    </svg>
  );
}

export function CheckedInView({
  ticket,
  doctorName,
  locationLabel,
  onScanAgain,
}: {
  /** The patient's place. Null when the API has not returned one (yet). */
  ticket: QueueTicket | null;
  doctorName?: string | null;
  locationLabel?: string | null;
  /** Offered when the patient opened check-in while already checked in. */
  onScanAgain?: () => void;
}) {
  const line = ticket?.isWithDoctor
    ? `Your visit${doctorName ? ` with ${doctorName}` : ""} is in progress.`
    : doctorName
      ? `Your appointment with ${doctorName} is confirmed and you've joined the queue${locationLabel ? ` at ${locationLabel}` : ""}.`
      : `You've joined the queue${locationLabel ? ` at ${locationLabel}` : ""}.`;

  return (
    <div className="mx-auto mt-5 flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <CheckedInArt />
        <h1 className="m-0 mt-1.5 text-2xl font-extrabold tracking-[-0.4px] text-ink">You&apos;re checked in!</h1>
        <p className="m-0 max-w-[440px] text-sm leading-normal text-ink-muted">{line}</p>
      </div>

      {isNextInLine(ticket) ? <YoureNextNote /> : null}

      {ticket ? (
        <QueueTokenCard ticket={ticket} layout="tiles" />
      ) : (
        <Note tone="green" icon={Activity}>
          Your place in the queue will show on the live queue.
        </Note>
      )}

      {!isNextInLine(ticket) && !ticket?.isWithDoctor ? (
        <Surface className="p-4">
          <div className="flex items-center gap-3.5">
            <IconBox icon={Bell} tone="amber" size={40} />
            <span className="text-sm leading-[1.45] text-ink-soft">
              We&apos;ll notify you when you&apos;re next. Feel free to wait in the lounge.
            </span>
          </div>
        </Surface>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
        <Button size="xl" className="max-sm:w-full" asChild>
          <Link href="/patient/queue">
            <Activity aria-hidden="true" />
            View live queue
          </Link>
        </Button>
        {onScanAgain ? (
          <Button variant="outline" size="xl" className="max-sm:w-full" onClick={onScanAgain}>
            <ScanQrCode aria-hidden="true" />
            Scan again
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ── More than one visit today ──────────────────────────────────────────────

export interface CheckInChoice {
  id: string;
  doctorName: string;
  timeLabel: string;
  typeLabel?: string;
}

export function CheckInSelectView({
  choices,
  onSelect,
  onCancel,
}: {
  choices: CheckInChoice[];
  onSelect: (appointmentId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex flex-col">
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">Which visit is this for?</h1>
        <p className="m-0 mt-0.5 text-sm text-ink-muted">You have more than one visit today. Choose the one to check in for.</p>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              onClick={() => onSelect(choice.id)}
              className="flex w-full items-center gap-3.5 rounded-[20px] bg-card p-4 text-left shadow-card transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 dark:border dark:border-border/70"
            >
              <InitialsAvatar name={choice.doctorName} size={44} square />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="break-words text-[15px] font-bold text-ink">{choice.doctorName}</span>
                <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-muted">
                  <Clock className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                  {[choice.timeLabel, choice.typeLabel].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand">
                Check in
                <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Button variant="outline" size="md" className="self-center" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ── No in-clinic visit / loading ───────────────────────────────────────────

export function CheckInNoVisitView({ onBook }: { onBook: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Check in at clinic" backHref={BACK_HREF} />
      <Surface>
        <EmptyBlock
          icon={Calendar}
          title="No visit today"
          description="Book a clinic visit or ask the reception desk. Once you have a visit today, open this page at the clinic to scan the QR."
          action={
            // Booking is the one amber action in the app.
            <Button variant="action" size="md" onClick={onBook}>
              <CalendarPlus aria-hidden="true" />
              Book a clinic visit
            </Button>
          }
        />
      </Surface>
    </div>
  );
}

// ── Several visits today ───────────────────────────────────────────────────

/**
 * More than one in-clinic visit today (e.g. two family members, or two doctors): every visit is
 * listed with its own state, so a booked one can be checked in and a checked-in one shows its
 * token, instead of only the first visit with a "Scan again" button.
 */
export function TodayVisitsView({
  visits,
  onCheckIn,
}: {
  visits: readonly InPersonVisit[];
  /** Opens the scanner for a visit that is still booked. */
  onCheckIn: (appointmentId: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5">
      <PageHead title="Your visits today" backHref={BACK_HREF} />
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {visits.map((visit) => {
          const queued = visit.stage === "CHECKED_IN" || visit.stage === "WITH_DOCTOR";
          const meta = [visit.time || "Time to be confirmed", visit.patientName, visit.locationName]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={visit.appointmentId}>
              <Surface className="p-4">
                <div className="flex items-center gap-3.5">
                  <InitialsAvatar name={visit.doctorName} size={44} square />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="break-words text-[15px] font-bold text-ink">{visit.doctorName}</span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-muted">
                      <Clock className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
                      {meta}
                    </span>
                  </span>
                  {queued ? (
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <Pill tone="green">
                        {visit.stage === "WITH_DOCTOR" ? "With doctor" : "Checked in"}
                      </Pill>
                      {visit.token ? (
                        <span className="text-[13px] font-bold text-ink">Token {visit.token}</span>
                      ) : null}
                    </span>
                  ) : (
                    <Button size="md" className="shrink-0" onClick={() => onCheckIn(visit.appointmentId)}>
                      <ScanQrCode aria-hidden="true" />
                      Check in
                    </Button>
                  )}
                </div>
              </Surface>
            </li>
          );
        })}
      </ul>
      <Button size="xl" variant="outline" className="self-center max-sm:w-full" asChild>
        <Link href="/patient/queue">
          <Activity aria-hidden="true" />
          View live queue
        </Link>
      </Button>
    </div>
  );
}

export function CheckInLoadingView() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your visit">
      <PageHead title="Check in at clinic" backHref={BACK_HREF} />
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[380px] w-full rounded-[20px]" />
        <Skeleton className="h-[380px] w-full rounded-[20px]" />
      </div>
    </div>
  );
}

// ── You're next ───────────────────────────────────────────────────────────

/** Shown on the checked-in and live queue screens when nobody is waiting ahead (V2 YoureNext). */
export function YoureNextNote() {
  return (
    <div role="status" aria-live="polite">
      <Note tone="green" icon={Bell}>
        <span className="font-extrabold">You&apos;re next!</span> Please stay near the doctor&apos;s room. The doctor
        will call you in shortly.
      </Note>
    </div>
  );
}

// ── Check-in refused ───────────────────────────────────────────────────────

export function CheckInErrorView({
  copy,
  onScanAgain,
  onBook,
  onRetryCode,
}: {
  /** Title, message and fix for the backend reason (see `checkInErrorCopy`). */
  copy: CheckInErrorCopy;
  onScanAgain: () => void;
  onBook: () => void;
  /** Re-open the desk-code entry (location fix). */
  onRetryCode?: () => void;
}) {
  return (
    <div className="mx-auto mt-5 flex w-full max-w-[640px] flex-col gap-5" role="alert">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <IconBox icon={TriangleAlert} tone="amber" size={64} />
        <h1 className="m-0 mt-1.5 text-2xl font-extrabold tracking-[-0.4px] text-ink">{copy.title}</h1>
        <p className="m-0 max-w-[460px] text-sm leading-normal text-ink-muted">{copy.message}</p>
      </div>

      {copy.fix === "location" ? (
        <Note tone="amber" icon={MapPin}>
          {ENABLE_LOCATION_STEPS}
        </Note>
      ) : null}

      {copy.fix === "reception" ? (
        <Note tone="amber" icon={Hospital}>
          The reception desk can check you in with one click. Show them your booking.
        </Note>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
        {copy.fix === "book" ? (
          <Button variant="action" size="xl" className="max-sm:w-full" onClick={onBook}>
            <Calendar aria-hidden="true" />
            Book an appointment
          </Button>
        ) : null}
        {copy.fix === "plan" ? (
          <Button variant="action" size="xl" className="max-sm:w-full" asChild>
            <Link href={PATIENT_PLAN_ROUTE}>
              <Calendar aria-hidden="true" />
              Renew plan
            </Link>
          </Button>
        ) : null}
        {copy.fix === "location" && onRetryCode ? (
          <Button size="xl" className="max-sm:w-full" onClick={onRetryCode}>
            <KeyRound aria-hidden="true" />
            Try the desk code again
          </Button>
        ) : null}
        {copy.fix === "appointments" ? (
          <Button size="xl" className="max-sm:w-full" asChild>
            <Link href={BACK_HREF}>
              <Calendar aria-hidden="true" />
              My appointments
            </Link>
          </Button>
        ) : null}
        <Button
          variant={copy.fix === "rescan" ? "default" : "outline"}
          size="xl"
          className="max-sm:w-full"
          onClick={onScanAgain}
        >
          <ScanQrCode aria-hidden="true" />
          Scan again
        </Button>
      </div>
    </div>
  );
}
