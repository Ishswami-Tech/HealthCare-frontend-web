"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hospital,
  MapPin,
  Pencil,
  ScanQrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, InitialsAvatar, Note, PageHead, Pill, Surface } from "@/components/tbd";
import type { HomeVisit } from "@/components/patient/home/types";
import { cn } from "@/lib/utils";
import { ClinicMapArt, QueueTokenCard } from "../../queue/_components/QueueParts";
import type { QueueTicket } from "../../queue/_components/queueData";

/**
 * Check in at clinic (patient): the three states of `/patient/check-in`, plus the smaller
 * ones (pick a visit, no in-clinic visit, loading). Props-driven: the page container owns the
 * data hooks and the check-in mutation.
 */

const BACK_HREF = "/patient/appointments";

// ── 1 · Check in at clinic ─────────────────────────────────────────────────

type StepState = "done" | "current" | "todo";

const STEPS: Array<{ title: string; text: string }> = [
  { title: "Arrive at the clinic", text: "Go to the reception desk" },
  { title: "Scan the QR at reception", text: "It is on the stand at the desk" },
  { title: "Get your place in the queue", text: "We show your place and the wait" },
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
                  state === "done" && "bg-[#047857] text-white",
                  state === "current" &&
                    "border-2 border-[#047857] bg-card text-[#047857] dark:border-emerald-400 dark:text-emerald-300",
                  state === "todo" && "bg-[#f1f5f9] text-ink-muted dark:bg-white/10",
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
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </span>
              <span className="text-[13px] text-ink-muted">{step.text}</span>
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

export function CheckInIntroView({
  visit,
  bookingRef,
  onScan,
}: {
  /** The in-clinic visit to check in for. Never a video visit. */
  visit: HomeVisit;
  /** Short booking reference shown to people. */
  bookingRef?: string;
  onScan: () => void;
}) {
  const when = [visit.isToday ? "Today" : visit.dateLabel, visit.timeLabel].filter(Boolean).join(", ");
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

          <div className="h-[224px] overflow-hidden rounded-2xl">
            <ClinicMapArt />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
            <MapPin className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
            <span className="min-w-0 flex-1 basis-40 break-words font-bold text-ink">
              {visit.locationLabel ?? "Your clinic"}
            </span>
            {visit.directionsUrl ? (
              <a
                href={visit.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Directions
                <ArrowRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </Surface>

        <Surface as="section" className="gap-[18px]" aria-label="How check-in works">
          <h2 className="m-0 text-base font-bold text-ink">How check-in works</h2>
          <StepList current={0} />
          <div className="flex-1" />
          <div className="flex flex-col gap-2.5">
            <Button size="xl" className="w-full" onClick={onScan}>
              <ScanQrCode aria-hidden="true" />
              Scan clinic QR
            </Button>
            <span className="text-center text-xs text-ink-muted">
              {visit.isToday
                ? "We check your location when you scan."
                : `Your visit is on ${visit.dateLabel}. Check in at the clinic on that day.`}
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start">
        <button
          type="button"
          onClick={onBack}
          className="mb-1.5 inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-ink-muted hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          Back
        </button>
        <h1 className="m-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">Scan clinic QR</h1>
      </div>

      {scanner}

      <Surface className="flex-row flex-wrap items-center gap-x-5 gap-y-3.5 px-5 py-[18px]">
        <IconBox icon={Hospital} tone="mint" size={44} />
        <span className="flex min-w-0 flex-1 basis-52 flex-col gap-0.5">
          <span className="text-[15px] font-extrabold text-ink">Point at the QR on the reception desk</span>
          <span className="break-words text-[13px] text-ink-muted">
            {locationLabel ? `${locationLabel} · it scans automatically` : "It scans automatically"}
          </span>
        </span>
        <span className="hidden items-center gap-3 text-[13px] text-ink-muted sm:flex" aria-hidden="true">
          <span className="h-7 w-px bg-line" />
          or
          <span className="h-7 w-px bg-line" />
        </span>
        <Button variant="outline" size="md" className="max-sm:w-full" onClick={onEnterCode}>
          <Pencil aria-hidden="true" />
          Enter the desk code instead
        </Button>
      </Surface>
    </div>
  );
}

// ── 3 · Checked in ─────────────────────────────────────────────────────────

function CheckedInArt() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <circle cx="60" cy="60" r="58" className="fill-[#d1fae5] dark:fill-emerald-500/15" />
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
    : `You have joined the queue${doctorName ? ` for ${doctorName}` : ""}${locationLabel ? ` at ${locationLabel}` : ""}.`;

  return (
    <div className="mx-auto mt-5 flex w-full max-w-[640px] flex-col gap-5">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <CheckedInArt />
        <h1 className="m-0 mt-1.5 text-2xl font-extrabold tracking-[-0.4px] text-ink">You&apos;re checked in!</h1>
        <p className="m-0 max-w-[440px] text-sm leading-normal text-ink-muted">{line}</p>
      </div>

      {ticket ? (
        <QueueTokenCard ticket={ticket} layout="tiles" />
      ) : (
        <Note tone="green" icon={Activity}>
          Your place in the queue will show on the live queue.
        </Note>
      )}

      <Surface className="p-4">
        <div className="flex items-center gap-3.5">
          <IconBox icon={Bell} tone="amber" size={40} />
          <span className="text-sm leading-[1.45] text-ink-soft">
            Please wait near the reception. Your place updates here by itself every 30 seconds.
          </span>
        </div>
      </Surface>

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
          title="No in-clinic visit to check in for"
          description="Check-in with the clinic QR is only for in-clinic visits. A video visit does not need it. Once you have an in-clinic visit, open this page at the clinic to scan the QR."
          action={
            // Booking is the one amber action in the app.
            <Button variant="action" size="md" onClick={onBook}>
              <Calendar aria-hidden="true" />
              Book a visit
            </Button>
          }
        />
      </Surface>
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
