import { MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, SoftCard, Surface, statusLabel, statusTone } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  formatWait,
  plural,
  queueProgress,
  ticketHeadline,
  type QueueTicket,
  type QueueVisitInfo,
} from "./queueData";

/**
 * Pieces shared by the checked-in screen and the live queue. Props-driven: no data hooks here.
 */

// ── Map drawing ────────────────────────────────────────────────────────────

/**
 * A drawn street map with the clinic pin. Decoration only: it is not a live map.
 * Cropped from the left on narrow cards, so the pin stays in view.
 */
export function ClinicMapArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 680 224"
      preserveAspectRatio="xMaxYMid slice"
      className={cn("block size-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="680" height="224" className="fill-[#e9f0ea] dark:fill-[#1c2a26]" />
      <g className="fill-[#dde6de] dark:fill-[#24352f]">
        <rect x="18" y="22" width="170" height="100" rx="12" />
        <rect x="224" y="22" width="190" height="78" rx="12" />
        <rect x="470" y="22" width="190" height="118" rx="12" />
        <rect x="18" y="164" width="330" height="60" rx="12" />
        <rect x="384" y="196" width="276" height="40" rx="12" />
      </g>
      <ellipse cx="566" cy="88" rx="58" ry="34" className="fill-[#c5e3cd] dark:fill-[#2c4a3d]" />
      <g className="fill-white dark:fill-[#3a4b46]">
        <rect x="0" y="140" width="680" height="16" />
        <rect x="200" y="0" width="16" height="224" />
        <rect x="446" y="0" width="16" height="224" />
      </g>
      <path
        d="M366 0C352 76 300 150 150 224"
        fill="none"
        strokeWidth="18"
        strokeLinecap="round"
        className="stroke-[#fbe38e] dark:stroke-[#7a6a2c]"
      />
      <path
        d="M232 216C300 176 372 148 452 118"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="2 14"
        className="stroke-[#2563eb] dark:stroke-[#60a5fa]"
      />
      <g transform="translate(456 20)">
        <path d="M0 38C0 17 17 0 38 0s38 17 38 38c0 26-38 62-38 62S0 64 0 38z" fill="#dc2626" />
        <circle cx="38" cy="38" r="17" fill="#ffffff" />
        <path d="M38 28v20M28 38h20" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ── Ticket ─────────────────────────────────────────────────────────────────

function Tile({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center gap-0.5 px-1 text-center",
        !last && "border-r border-[#047857]/20 dark:border-emerald-400/20",
      )}
    >
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-lg font-extrabold leading-tight text-ink">{value}</span>
    </div>
  );
}

function waitText(ticket: QueueTicket): string {
  if (ticket.isWithDoctor) return "Your turn";
  if (ticket.estimatedWaitMinutes !== null) return formatWait(ticket.estimatedWaitMinutes);
  return "—";
}

function aheadText(ticket: QueueTicket): string {
  if (ticket.isWithDoctor) return "You are with the doctor";
  if (ticket.patientsAhead === null) return "Your place updates here";
  if (ticket.patientsAhead === 0) return "You are next";
  return `${plural(ticket.patientsAhead, "patient")} ahead`;
}

function doctorText(ticket: QueueTicket): string {
  if (ticket.isWithDoctor) return "Your visit is in progress";
  if (ticket.doctorBusy === true) return "The doctor is with a patient";
  if (ticket.doctorBusy === false) return "No one is with the doctor yet";
  return ticket.position !== null && ticket.totalInQueue !== null
    ? `Place ${ticket.position} of ${ticket.totalInQueue}`
    : "Waiting";
}

/**
 * The patient's ticket: token (or place in line) and the estimated wait.
 * `tiles` = the three figures under it (checked-in screen); `progress` = a bar (live queue).
 */
export function QueueTokenCard({
  ticket,
  layout,
  className,
}: {
  ticket: QueueTicket;
  layout: "tiles" | "progress";
  className?: string;
}) {
  const headline = ticketHeadline(ticket);
  const progress = queueProgress(ticket);
  const showStatus = ticket.statusCode !== "WAITING";

  return (
    <SoftCard as="section" className={className} aria-label="Your place in the queue">
      <div className="flex flex-col gap-[18px]">
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
              {headline.label}
              {showStatus ? <Pill tone={statusTone(ticket.statusCode)}>{statusLabel(ticket.statusCode)}</Pill> : null}
            </span>
            <span className="break-words text-[40px] font-extrabold leading-none tracking-[-1px] text-ink">
              {headline.value}
            </span>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            <span className="text-[13px] text-ink-muted">Est. wait</span>
            <span
              className={cn(
                "font-extrabold leading-[1.1] text-ink",
                layout === "progress" ? "text-2xl" : "text-[22px]",
              )}
            >
              {waitText(ticket)}
            </span>
          </div>
        </div>

        {layout === "tiles" ? (
          <div className="grid grid-cols-3 rounded-2xl bg-white/[0.72] py-3.5 dark:bg-white/5">
            <Tile
              label={ticket.tokenLabel ? "Your place" : "In the queue"}
              value={
                ticket.tokenLabel
                  ? ticket.position !== null
                    ? `#${ticket.position}`
                    : "—"
                  : ticket.totalInQueue !== null
                    ? String(ticket.totalInQueue)
                    : "—"
              }
            />
            <Tile label="Ahead of you" value={ticket.patientsAhead !== null ? String(ticket.patientsAhead) : "—"} />
            <Tile label="Checked in" value={ticket.checkedInLabel ?? "—"} last />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {progress !== null ? (
              <div
                className="h-2.5 overflow-hidden rounded-md bg-white/[0.72] dark:bg-white/10"
                role="progressbar"
                aria-label="How close you are to your turn"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                aria-valuetext={aheadText(ticket)}
              >
                <div
                  className="h-2.5 rounded-md bg-[#34d399] transition-[width] duration-500"
                  style={{ width: `${Math.max(6, Math.round(progress * 100))}%` }}
                />
              </div>
            ) : null}
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-ink-muted">
              <span>{doctorText(ticket)}</span>
              <span>{aheadText(ticket)}</span>
            </div>
          </div>
        )}
      </div>
    </SoftCard>
  );
}

// ── Clinic card ────────────────────────────────────────────────────────────

/** Map drawing, clinic name and address, with Call and Directions when the visit has them. */
export function QueueClinicCard({ info, className }: { info: QueueVisitInfo; className?: string }) {
  const hasActions = Boolean(info.clinicPhone || info.directionsUrl);
  return (
    <Surface as="section" flush className={cn("flex flex-col", className)} aria-label="Clinic">
      <div className="relative min-h-[200px] flex-1">
        <div className="absolute inset-0">
          <ClinicMapArt />
        </div>
      </div>
      <div className="flex flex-col gap-3.5 px-[18px] pb-[18px] pt-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="break-words text-sm font-bold text-ink">{info.locationLabel ?? "Your clinic"}</span>
          {info.address ? <span className="break-words text-[13px] text-ink-muted">{info.address}</span> : null}
        </div>
        {hasActions ? (
          <div className={cn("grid gap-2.5", info.clinicPhone && info.directionsUrl ? "grid-cols-2" : "grid-cols-1")}>
            {info.clinicPhone ? (
              <Button variant="outline" size="md" className="w-full" asChild>
                <a href={`tel:${info.clinicPhone}`}>
                  <Phone aria-hidden="true" />
                  Call Clinic
                </a>
              </Button>
            ) : null}
            {info.directionsUrl ? (
              <Button size="md" className="w-full" asChild>
                <a href={info.directionsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin aria-hidden="true" />
                  Directions
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Surface>
  );
}
