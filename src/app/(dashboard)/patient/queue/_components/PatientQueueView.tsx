import Link from "next/link";
import { Activity, Home, RefreshCw, ScanLine, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, PageHead, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { QueueClinicCard, QueueTokenCard } from "./QueueParts";
import { formatWait, plural, ticketHeadline, type QueueTicket, type QueueVisitInfo } from "./queueData";

/**
 * Live Queue (patient): the patient's own token, place, people ahead and estimated wait.
 * Props-driven. It draws only what `GET queue/me` returns: no other patient is ever listed.
 */

const BACK_HREF = "/patient/dashboard";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#047857] px-2.5 py-[5px] text-[11px] font-extrabold uppercase leading-none tracking-[0.4px] text-white">
      <span className="tbd-pulse size-1.5 rounded-full bg-[#a7f3d0]" aria-hidden="true" />
      Live
    </span>
  );
}

// ── The line ───────────────────────────────────────────────────────────────

type LineRow = {
  key: string;
  dot: "now" | "open" | "you" | "muted";
  label: string;
  status: string;
  right?: string;
};

function buildLine(ticket: QueueTicket): LineRow[] {
  const rows: LineRow[] = [];
  if (!ticket.isWithDoctor && ticket.doctorBusy) {
    rows.push({ key: "now", dot: "now", label: "Now", status: "A patient is with the doctor" });
  }
  if (!ticket.isWithDoctor && ticket.patientsAhead !== null && ticket.patientsAhead > 0) {
    rows.push({
      key: "ahead",
      dot: "open",
      label: `${ticket.patientsAhead} ahead`,
      status: "Waiting before you",
    });
  }
  rows.push({
    key: "you",
    dot: "you",
    label: ticketHeadline(ticket).value,
    status: ticket.isWithDoctor ? "You · with the doctor now" : ticket.patientsAhead === 0 ? "You · next" : "You",
    right: ticket.isWithDoctor
      ? "Your turn"
      : ticket.estimatedWaitMinutes !== null
        ? formatWait(ticket.estimatedWaitMinutes)
        : undefined,
  });
  const behind =
    ticket.position !== null && ticket.totalInQueue !== null ? ticket.totalInQueue - ticket.position : 0;
  if (behind > 0) {
    rows.push({ key: "behind", dot: "muted", label: `${behind} behind`, status: "Joined after you" });
  }
  return rows;
}

function LineDot({ kind }: { kind: LineRow["dot"] }) {
  return (
    <span className="flex w-5 shrink-0 justify-center" aria-hidden="true">
      <span
        className={cn(
          "size-3 rounded-full",
          kind === "now" && "bg-[#047857] shadow-[0_0_0_4px_#d1fae5] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.25)]",
          kind === "open" && "border-2 border-[#047857] dark:border-emerald-400",
          kind === "you" && "bg-[#047857] dark:bg-emerald-400",
          kind === "muted" && "border-2 border-[#cbd5e1] dark:border-white/25",
        )}
      />
    </span>
  );
}

function QueueLine({ ticket, doctorName }: { ticket: QueueTicket; doctorName: string | null }) {
  const rows = buildLine(ticket);
  return (
    <Surface as="section" className="gap-2" aria-label="Your queue">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h2 className="m-0 text-base font-bold text-ink">{doctorName ? `Queue for ${doctorName}` : "Your queue"}</h2>
        {ticket.totalInQueue !== null ? (
          <span className="text-[13px] text-ink-muted">{plural(ticket.totalInQueue, "patient")} in the queue</span>
        ) : null}
      </div>
      <ol className="m-0 flex list-none flex-col p-0">
        {rows.map((row) => {
          const isYou = row.dot === "you";
          return (
            <li
              key={row.key}
              aria-current={isYou ? "true" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3.5",
                isYou
                  ? "-mx-3 my-1 rounded-xl bg-[#ecfdf5] px-3 dark:bg-emerald-500/10"
                  : "border-b border-hair last:border-b-0",
              )}
            >
              <LineDot kind={row.dot} />
              <span
                className={cn(
                  "w-[88px] shrink-0 text-sm sm:w-[120px]",
                  isYou ? "font-extrabold text-[#047857] dark:text-emerald-300" : "font-semibold text-ink",
                  row.dot === "now" && "font-bold",
                )}
              >
                {row.label}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-[13px]",
                  isYou
                    ? "font-bold text-[#047857] dark:text-emerald-300"
                    : row.dot === "now"
                      ? "font-semibold text-[#047857] dark:text-emerald-300"
                      : "text-ink-muted",
                )}
              >
                {row.status}
              </span>
              {row.right ? (
                <span
                  className={cn(
                    "shrink-0 text-[13px]",
                    isYou ? "font-bold text-[#047857] dark:text-emerald-300" : "text-ink-muted",
                  )}
                >
                  {row.right}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="m-0 pt-1 text-xs text-ink-muted">Other patients are not shown here, to keep visits private.</p>
    </Surface>
  );
}

// ── Screens ────────────────────────────────────────────────────────────────

export interface PatientQueueViewProps {
  ticket: QueueTicket;
  info: QueueVisitInfo;
  /** Reads the place again now. */
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function PatientQueueView({ ticket, info, onRefresh, isRefreshing }: PatientQueueViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Live Queue" backHref={BACK_HREF} actions={<LiveBadge />} />

      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <QueueTokenCard ticket={ticket} layout="progress" />
          <QueueLine ticket={ticket} doctorName={info.doctorName} />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Surface className="p-4">
            <div className="flex items-center gap-3.5">
              <IconBox icon={RefreshCw} tone="mint" size={40} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">Updates by itself</span>
                <span className="text-xs text-ink-muted">Every 30 seconds</span>
              </span>
              <Button variant="outline" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing}>
                <RefreshCw className={cn(isRefreshing && "animate-spin")} aria-hidden="true" />
                Refresh
              </Button>
            </div>
          </Surface>
          {info.locationLabel || info.clinicPhone || info.directionsUrl ? (
            <QueueClinicCard info={info} className="flex-1" />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The patient is not in a queue: say so, and point to check-in (or home). */
export function PatientQueueEmptyView({
  canCheckIn,
  visitLine,
}: {
  /** An in-clinic visit is booked for today and not checked in yet. */
  canCheckIn: boolean;
  /** "Dr. Deshmukh · Today, 02:00 PM", for that visit. */
  visitLine?: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Live Queue" backHref={BACK_HREF} />
      <Surface>
        <EmptyBlock
          icon={Activity}
          title="You are not in a queue right now"
          description={
            canCheckIn
              ? `${visitLine ? `Your in-clinic visit: ${visitLine}. ` : ""}Check in at the clinic and your place in the queue will show here.`
              : "The queue is for in-clinic visits. Your place will show here after you check in at the clinic on the day of your visit."
          }
          action={
            canCheckIn ? (
              <Button size="md" asChild>
                <Link href="/patient/check-in">
                  <ScanLine aria-hidden="true" />
                  Check in at clinic
                </Link>
              </Button>
            ) : (
              <Button size="md" variant="outline" asChild>
                <Link href={BACK_HREF}>
                  <Home aria-hidden="true" />
                  Back to home
                </Link>
              </Button>
            )
          }
        />
      </Surface>
    </div>
  );
}

export function PatientQueueErrorView({ onRetry, isRetrying }: { onRetry: () => void; isRetrying: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHead title="Live Queue" backHref={BACK_HREF} />
      <Surface role="alert">
        <EmptyBlock
          icon={TriangleAlert}
          tone="rose"
          title="We could not load your queue"
          description="Check your internet connection and try again. Your place in the queue is not lost."
          action={
            <Button size="md" onClick={onRetry} disabled={isRetrying} aria-busy={isRetrying}>
              <RefreshCw className={cn(isRetrying && "animate-spin")} aria-hidden="true" />
              Try again
            </Button>
          }
        />
      </Surface>
    </div>
  );
}

export function PatientQueueLoadingView() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your queue">
      <PageHead title="Live Queue" backHref={BACK_HREF} />
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Skeleton className="h-[160px] w-full rounded-[24px]" />
          <Skeleton className="h-[220px] w-full rounded-[20px]" />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Skeleton className="h-[72px] w-full rounded-[20px]" />
          <Skeleton className="h-[300px] w-full rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
