"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, Download, FileText, Loader2, Pill as PillIcon, Star, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Divider,
  EmptyBlock,
  IconBox,
  InitialsAvatar,
  Pill,
  SoftCard,
  Surface,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { cn } from "@/lib/utils";
import { VideoStageShell } from "@/components/video/lobby/VideoStageShell";

export type SummaryMedicine = { id: string; name: string; detail: string };

/** One block of what the doctor wrote: a heading and text, labelled lines, or a short list. */
export type SummaryNoteBlock = {
  id: string;
  heading: string;
  text?: string;
  lines?: Array<{ label: string; value: string }>;
  list?: string[];
};

export type SummaryPrescription = {
  /** `loading` while the prescriptions are fetched; `error` when they could not be loaded. */
  state: "loading" | "ready" | "empty" | "error";
  /** "RX-58213AB1". Only for a pharmacy prescription. */
  number?: string;
  medicines: SummaryMedicine[];
  /** True when the medicines come from the doctor's call notes and no pharmacy prescription exists yet. */
  fromNotes?: boolean;
  /** Present only when there is a prescription to download. */
  onDownload?: () => void;
  isDownloading?: boolean;
};

export type SummaryRating = {
  /** `rate`: the patient can rate; `readonly`: staff see the patient's rating; `hidden`: no rating yet possible. */
  mode: "rate" | "readonly" | "hidden";
  /** The saved rating (0 = none). */
  value: number;
  pending: boolean;
  /** The last submit succeeded. */
  saved: boolean;
  error?: string;
  onRate: (stars: number) => void;
};

export type CallSummaryViewProps = {
  portalLabel?: string;
  backHref: string;
  backLabel: string;
  closeHref: string;
  homeHref: string;
  viewerIsPatient: boolean;
  /** Whole-page state. `missing` = the backend has no such appointment. */
  state: "loading" | "error" | "missing" | "ready";
  errorMessage?: string;
  onRetry: () => void;

  /** Name for the banner picture and line (the doctor for a patient, the patient for staff). */
  personName: string;
  personPhotoUrl?: string;
  bannerTitle: string;
  /** "Dr. Deshmukh · 14 min · 28 Sept". */
  bannerLine: string;
  /** Appointment status code. COMPLETED shows the green tick, anything else a status tag. */
  statusCode: string;
  /** The visit is still open: offer Rejoin instead of treating it as finished. */
  rejoinHref?: string;

  prescription: SummaryPrescription;
  /** Link to the patient's medicines list (patients only). */
  medicinesHref?: string;
  notes: SummaryNoteBlock[];
  /** The doctor's follow-up advice, when the notes carry one. */
  followUp?: string;
  /** Booking link (patients only). */
  followUpHref?: string;
  rating: SummaryRating;
};

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function RatingCard({ rating, viewerIsPatient }: { rating: SummaryRating; viewerIsPatient: boolean }) {
  const [hovered, setHovered] = useState(0);
  const [picked, setPicked] = useState(0);
  if (rating.mode === "hidden") return null;
  const interactive = rating.mode === "rate";
  // While saving, show the star that was just pressed; afterwards the saved value.
  const committed = rating.pending && picked ? picked : rating.value;
  const shown = interactive && hovered ? hovered : committed;

  let line: string;
  if (!interactive) {
    line = rating.value ? `Rated ${rating.value} out of 5` : "Not rated yet";
  } else if (rating.pending) {
    line = "Saving your rating…";
  } else if (rating.error) {
    line = rating.error;
  } else if (rating.value) {
    line = `${rating.saved ? "Thank you. " : ""}You rated this visit ${rating.value} out of 5${
      RATING_WORDS[rating.value] ? ` · ${RATING_WORDS[rating.value]}` : ""
    }.`;
  } else {
    line = "Click a star to rate";
  }

  return (
    <Surface className="items-center gap-2.5 px-5 py-6 text-center">
      <h2 className="m-0 text-base font-bold text-ink">
        {viewerIsPatient ? "How was your consultation?" : "Patient rating"}
      </h2>
      <div className="flex gap-1.5" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((stars) => {
          const filled = stars <= shown;
          const star = (
            <Star
              className={cn(
                "size-8 transition-colors",
                filled
                  ? "fill-[#f59e0b] text-[#f59e0b]"
                  : "fill-[#e2e8f0] text-[#e2e8f0] dark:fill-slate-700 dark:text-slate-700",
              )}
              strokeWidth={1.6}
              aria-hidden="true"
            />
          );
          return interactive ? (
            <button
              key={stars}
              type="button"
              aria-label={`Rate ${stars} out of 5`}
              aria-pressed={stars === committed}
              disabled={rating.pending}
              onMouseEnter={() => setHovered(stars)}
              onFocus={() => setHovered(stars)}
              onBlur={() => setHovered(0)}
              onClick={() => {
                setPicked(stars);
                rating.onRate(stars);
              }}
              className="flex size-11 items-center justify-center rounded-xl bg-transparent p-0 transition-transform hover:scale-110 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-wait"
            >
              {star}
            </button>
          ) : (
            <span key={stars} className="flex size-11 items-center justify-center">
              {star}
            </span>
          );
        })}
      </div>
      {!interactive && rating.value ? <span className="sr-only">{`${rating.value} out of 5 stars`}</span> : null}
      <p
        className={cn(
          "m-0 flex items-center justify-center gap-1.5 text-[13px]",
          interactive && rating.error && !rating.pending
            ? "font-semibold text-[#e11d48] dark:text-rose-300"
            : "text-ink-muted",
        )}
        role={interactive && rating.error && !rating.pending ? "alert" : "status"}
      >
        {interactive && rating.pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
        {line}
      </p>
    </Surface>
  );
}

function PrescriptionCard({
  prescription,
  medicinesHref,
}: {
  prescription: SummaryPrescription;
  medicinesHref?: string;
}) {
  const { state, medicines } = prescription;
  return (
    <Surface className="gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold text-ink">Prescription</h2>
        {prescription.number ? <span className="text-[13px] text-ink-muted">{prescription.number}</span> : null}
      </div>

      {state === "loading" ? (
        <p className="m-0 flex items-center gap-2 py-4 text-sm text-ink-muted" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Looking for the prescription…
        </p>
      ) : null}

      {state === "error" ? (
        <EmptyBlock
          icon={CircleAlert}
          tone="rose"
          title="We could not load the prescription"
          description="Please check your connection and open this page again."
          className="py-6"
        />
      ) : null}

      {state === "empty" ? (
        <EmptyBlock
          icon={PillIcon}
          title="No prescription for this visit"
          description={
            medicinesHref
              ? "If the doctor writes one, it will show here and in your medicines."
              : "If the doctor writes one, it will show here."
          }
          action={
            medicinesHref ? (
              <Button asChild variant="outline" size="md">
                <Link href={medicinesHref}>See my medicines</Link>
              </Button>
            ) : undefined
          }
          className="py-6"
        />
      ) : null}

      {state === "ready" ? (
        <>
          <div className="flex flex-col">
            {medicines.map((medicine) => (
              <div
                key={medicine.id}
                className="flex items-center gap-3.5 border-b border-hair py-3 text-ink last:border-b-0"
              >
                <IconBox icon={PillIcon} tone="orange" size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold">{medicine.name}</span>
                  {medicine.detail ? <span className="text-xs text-ink-muted">{medicine.detail}</span> : null}
                </span>
              </div>
            ))}
            {medicines.length === 0 ? (
              <p className="m-0 py-3 text-sm text-ink-muted">This prescription lists no medicines.</p>
            ) : null}
          </div>
          {prescription.onDownload ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="md"
                onClick={prescription.onDownload}
                disabled={prescription.isDownloading}
                aria-busy={prescription.isDownloading}
              >
                {prescription.isDownloading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="size-4" strokeWidth={2.2} aria-hidden="true" />
                )}
                Download prescription (PDF)
              </Button>
            </div>
          ) : null}
          {prescription.fromNotes ? (
            <p className="m-0 text-xs text-ink-muted">
              From the doctor's notes during the call. The pharmacy prescription is not ready yet.
            </p>
          ) : null}
        </>
      ) : null}
    </Surface>
  );
}

function NotesCard({ notes, viewerIsPatient }: { notes: SummaryNoteBlock[]; viewerIsPatient: boolean }) {
  return (
    <Surface className="gap-2">
      <h2 className="m-0 text-base font-bold text-ink">{viewerIsPatient ? "Doctor's notes" : "Visit notes"}</h2>
      {notes.length === 0 ? (
        <EmptyBlock
          icon={FileText}
          title="No notes for this visit"
          description={
            viewerIsPatient
              ? "The doctor has not added a diagnosis or advice for this visit."
              : "No diagnosis or advice was saved during this visit."
          }
          className="py-6"
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {notes.map((note, index) => (
            <div key={note.id} className="flex flex-col gap-1.5">
              {index > 0 ? <Divider className="mb-2" /> : null}
              <h3 className="m-0 text-[13px] font-bold text-ink">{note.heading}</h3>
              {note.text ? (
                <p className="m-0 whitespace-pre-line text-sm leading-[1.6] text-ink-soft">{note.text}</p>
              ) : null}
              {note.lines?.length ? (
                <dl className="m-0 flex flex-col gap-1.5">
                  {note.lines.map((line) => (
                    <div key={line.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      <dt className="shrink-0 text-xs font-semibold text-ink-muted sm:w-[120px] sm:pt-0.5">
                        {line.label}
                      </dt>
                      <dd className="m-0 whitespace-pre-line text-sm leading-[1.6] text-ink-soft">{line.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {note.list?.length ? (
                <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-sm leading-[1.6] text-ink-soft">
                  {note.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Surface>
  );
}

/** Consultation Summary: what a person sees after the doctor completed a video visit. */
export function CallSummaryView(props: CallSummaryViewProps) {
  const {
    portalLabel,
    backHref,
    backLabel,
    closeHref,
    homeHref,
    viewerIsPatient,
    state,
    statusCode,
  } = props;
  const completed = statusCode === "COMPLETED";

  return (
    <VideoStageShell portalLabel={portalLabel} backHref={backHref} backLabel={backLabel}>
      <div className="flex items-center justify-between gap-3 sm:items-end sm:gap-5">
        <h1 className="m-0 min-w-0 text-2xl font-extrabold tracking-[-0.4px] text-ink">Consultation Summary</h1>
        <Button asChild variant="outline" className="h-10 shrink-0 px-3 sm:px-3.5">
          <Link href={closeHref} aria-label="Close">
            <X className="size-4" strokeWidth={2.4} aria-hidden="true" />
            <span className="hidden sm:inline">Close</span>
          </Link>
        </Button>
      </div>

      {state === "loading" ? (
        <Surface className="items-center gap-3 px-6 py-12 text-center" role="status" aria-live="polite">
          <Loader2 className="size-7 animate-spin text-brand" aria-hidden="true" />
          <p className="m-0 text-sm text-ink-muted">Loading the summary…</p>
        </Surface>
      ) : null}

      {state === "error" || state === "missing" ? (
        <Surface flush role="alert">
          <EmptyBlock
            icon={CircleAlert}
            tone={state === "error" ? "rose" : "amber"}
            title={state === "error" ? "We could not load this summary" : "We could not find this consultation"}
            description={
              state === "error"
                ? props.errorMessage || "Please check your connection and try again."
                : "Open a completed video visit from your appointments to see its summary."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2.5">
                {state === "error" ? (
                  <Button variant="outline" size="md" onClick={props.onRetry}>
                    Try again
                  </Button>
                ) : null}
                <Button asChild size="md">
                  <Link href={backHref}>{backLabel}</Link>
                </Button>
              </div>
            }
          />
        </Surface>
      ) : null}

      {state === "ready" ? (
        <>
          <SoftCard className="p-[22px]">
            <div className="flex items-center gap-4">
              {props.personPhotoUrl ? (
                <img
                  src={props.personPhotoUrl}
                  alt=""
                  className="size-[60px] shrink-0 rounded-2xl border-2 border-white/60 bg-[#d1fae5] object-cover object-top"
                />
              ) : (
                <InitialsAvatar name={props.personName} size={60} square className="border-2 border-white/60" />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-lg font-extrabold leading-snug text-ink">{props.bannerTitle}</span>
                <span className="text-[13px] text-ink-muted">{props.bannerLine}</span>
              </div>
              {completed ? (
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#047857] text-white"
                  aria-hidden="true"
                >
                  <Check className="size-5" strokeWidth={3} />
                </span>
              ) : statusCode ? (
                <Pill tone={statusTone(statusCode)} dot className="shrink-0">
                  {statusLabel(statusCode)}
                </Pill>
              ) : null}
            </div>
          </SoftCard>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex min-w-0 flex-col gap-5">
              <PrescriptionCard
                prescription={props.prescription}
                {...(props.medicinesHref ? { medicinesHref: props.medicinesHref } : {})}
              />
              <NotesCard notes={props.notes} viewerIsPatient={viewerIsPatient} />
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              {props.rejoinHref ? (
                <Surface>
                  <h2 className="m-0 text-base font-bold text-ink">This visit is still open</h2>
                  <p className="m-0 text-sm leading-[1.6] text-ink-soft">
                    The visit ends only when the doctor completes it. You can rejoin until then.
                  </p>
                  <Button asChild variant="action" size="xl" className="w-full">
                    <Link href={props.rejoinHref}>
                      <Video className="size-4" strokeWidth={2.4} aria-hidden="true" />
                      Rejoin call
                    </Link>
                  </Button>
                </Surface>
              ) : null}

              <RatingCard rating={props.rating} viewerIsPatient={viewerIsPatient} />

              {props.followUp ? (
                <Surface className="gap-2">
                  <h2 className="m-0 text-base font-bold text-ink">Follow-up</h2>
                  <p className="m-0 whitespace-pre-line text-sm leading-[1.6] text-ink-soft">{props.followUp}</p>
                </Surface>
              ) : null}

              <div className="flex min-w-0 flex-col gap-3">
                {props.followUpHref ? (
                  <Button asChild variant="outline" size="xl" className="w-full">
                    <Link href={props.followUpHref}>Book follow-up</Link>
                  </Button>
                ) : null}
                <Button asChild size="xl" className="w-full">
                  <Link href={homeHref}>Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </VideoStageShell>
  );
}
