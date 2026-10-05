"use client";

import type { ReactNode } from "react";
import { Building, Calendar as CalendarIcon, CheckCircle, Clock, Video, Wifi, WifiOff } from "lucide-react";
import { Chip, SectionTitle } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { BookingDateStrip } from "./BookingDateStrip";
import { BookingDoctorPage } from "./BookingDoctor";
import { BookingSlotGroups } from "./BookingSlotGroups";
import { BookingEmpty, BookingLoading } from "./BookingStates";
import { formatSlotLabel } from "./format";
import type {
  BookingDay,
  BookingDoctorInfo,
  BookingHoursRow,
  BookingLayout,
  BookingLiveSync,
  BookingMode,
  BookingSlotPeriod,
} from "./types";

export type BookingSlotStatus = "idle" | "loading" | "empty" | "ready";

export interface BookingSlotStepViewProps {
  layout: BookingLayout;
  mode: BookingMode;
  doctor: BookingDoctorInfo | null;
  /** Rows of the "Clinic timings" card (page layout). */
  hours?: BookingHoursRow[] | undefined;
  /** Date strip above the slots (page layout). */
  dateStrip?:
    | { days: BookingDay[]; selected?: Date | undefined; monthLabel: string; onSelect: (date: Date) => void }
    | undefined;
  /** "5 Oct" */
  dateShort: string;
  /** "5 Oct 2026" */
  dateLong: string;
  durationMinutes: number;
  status: BookingSlotStatus;
  /** The clinic or doctor has switched this visit type off. */
  blocked: boolean;
  blockedReason?: string | undefined;
  errorMessage?: string | undefined;
  videoWindow?: { start: string; end: string } | null | undefined;
  periods: BookingSlotPeriod[];
  selectedSlot: string;
  /** In-clinic staff view: the chip text for the chosen slot ("10:30 - 3 min"). */
  selectedSlotChip?: string | undefined;
  onSelectSlot: (slot: string) => void;
  onClearSlot: () => void;
  liveSync?: BookingLiveSync | null | undefined;
  /** Shown to patients only ("₹600"). */
  feeLabel?: string | null | undefined;
}

function LiveSyncLine({ liveSync }: { liveSync: BookingLiveSync }) {
  const Icon = liveSync.mode === "live" ? Wifi : WifiOff;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold",
          liveSync.className ??
            (liveSync.mode === "live"
              ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : liveSync.mode === "connecting"
                ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-[#fcd34d] bg-[#fffbeb] text-[#92400e] dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"),
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {liveSync.label}
      </span>
      <span className="text-[11px] font-medium text-ink-muted">{liveSync.description}</span>
    </div>
  );
}

/** “Date and time” heading plus the same live-sync badge used before. */
function DateLiveSyncTitle({ liveSync }: { liveSync?: BookingLiveSync | null }) {
  const mode = liveSync?.mode ?? "live";
  const Icon = mode === "live" ? Wifi : WifiOff;
  const label =
    liveSync?.label ??
    (mode === "live" ? "Live synced" : mode === "connecting" ? "Connecting…" : "Offline");

  return (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span>Date and time</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-bold",
          liveSync?.className ??
            (mode === "live"
              ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : mode === "connecting"
                ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                : "border-[#fcd34d] bg-[#fffbeb] text-[#92400e] dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"),
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {label}
      </span>
    </span>
  );
}

/** Loading / nothing selected / no slots. The wording is the dialog's own. */
function SlotState({
  mode,
  status,
  blocked,
  blockedReason,
  errorMessage,
  videoWindow,
}: Pick<
  BookingSlotStepViewProps,
  "mode" | "status" | "blocked" | "blockedReason" | "errorMessage" | "videoWindow"
>) {
  const isVideo = mode === "VIDEO";
  const icon = isVideo ? Video : Clock;
  if (status === "idle") {
    return (
      <BookingEmpty
        icon={icon}
        tone="slate"
        title="Select a doctor and date to load availability"
        description="Availability will appear automatically once the doctor, clinic, and date are selected."
      />
    );
  }
  if (status === "loading") {
    return <BookingLoading>{isVideo ? "Checking video availability" : "Checking availability"}</BookingLoading>;
  }
  return (
    <BookingEmpty
      icon={icon}
      tone={blocked ? "amber" : "slate"}
      title={
        blocked
          ? isVideo
            ? "Video consultation currently unavailable"
            : "Consultation currently unavailable"
          : isVideo
            ? "No video slots available"
            : "No slots available"
      }
      description={
        blocked
          ? blockedReason || "Clinic/doctor settings currently block this consultation type"
          : "Try a different date or doctor"
      }
    >
      {(isVideo && videoWindow) || errorMessage ? (
        <div className="flex flex-col items-center gap-2">
          {isVideo && videoWindow ? (
            <p className="m-0 rounded-lg border border-[#fcd34d] bg-[#fffbeb] px-2.5 py-1.5 text-xs font-semibold text-[#92400e] dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              Video hours: {videoWindow.start} - {videoWindow.end}
            </p>
          ) : null}
          {errorMessage ? (
            <p
              role="alert"
              className="m-0 rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-2.5 py-1.5 text-xs font-semibold text-[#be123c] dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
            >
              Error: {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </BookingEmpty>
  );
}

function ClearSlotButton({ onClear, children }: { onClear: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="shrink-0 rounded-md text-[13px] font-bold text-brand hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {children}
    </button>
  );
}

/** Step "Time": your doctor, the date and the slots. */
export function BookingSlotStepView(props: BookingSlotStepViewProps) {
  return props.layout === "page" ? <SlotStepPage {...props} /> : <SlotStepCompact {...props} />;
}

// ── Patient layout (board WebDoctorProfile) ────────────────────────────────

function SlotStepPage({
  mode,
  doctor,
  hours = [],
  dateStrip,
  dateShort,
  durationMinutes,
  status,
  blocked,
  blockedReason,
  errorMessage,
  videoWindow,
  periods,
  selectedSlot,
  onSelectSlot,
  onClearSlot,
  liveSync,
  feeLabel,
}: BookingSlotStepViewProps) {
  const isVideo = mode === "VIDEO";
  const typeLine = [feeLabel, `${durationMinutes} min`].filter(Boolean).join(" · ");
  return (
    <BookingDoctorPage doctor={doctor} hours={hours} hoursTag={isVideo && videoWindow ? "Video" : undefined}>
        <section className="flex flex-col gap-2">
          <SectionTitle title="Consultation type" className="[&_h2]:text-sm" />
          <div className="flex min-h-[56px] items-center gap-2.5 rounded-xl border-2 border-[#047857] bg-mint-soft px-3 py-2.5 dark:border-emerald-500">
            {isVideo ? (
              <Video className="size-5 shrink-0 fill-[#4f46e5] text-[#4f46e5] dark:fill-indigo-400 dark:text-indigo-400" aria-hidden="true" />
            ) : (
              <Building className="size-5 shrink-0 text-[#059669] dark:text-emerald-300" strokeWidth={2.2} aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-bold text-ink">{isVideo ? "Video" : "In-Clinic"}</span>
              <span className="text-xs text-ink-muted">{typeLine}</span>
            </div>
          </div>
        </section>

        {dateStrip ? (
          <section className="flex flex-col gap-2">
            <SectionTitle
              title={<DateLiveSyncTitle liveSync={liveSync} />}
              action={<span className="text-xs font-semibold text-ink-muted">{dateStrip.monthLabel}</span>}
              className="[&_h2]:text-sm"
            />
            <BookingDateStrip days={dateStrip.days} selected={dateStrip.selected} onSelect={dateStrip.onSelect} />
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <SectionTitle
            title="Available slots"
            action={selectedSlot ? <ClearSlotButton onClear={onClearSlot}>Clear</ClearSlotButton> : undefined}
            className="[&_h2]:text-sm"
          />
          {isVideo && videoWindow && status === "ready" ? (
            <p className="m-0 text-[11px] text-ink-muted">
              Video slots are available only within {videoWindow.start} - {videoWindow.end}.
            </p>
          ) : null}
          {!isVideo && status === "ready" ? (
            <p className="m-0 text-[11px] text-ink-muted">{durationMinutes} min per slot · 20 slots / hour</p>
          ) : null}
          {status === "ready" ? (
            <BookingSlotGroups
              periods={periods}
              selected={selectedSlot}
              onSelect={onSelectSlot}
              timeStyle="12h"
              columnsClassName="grid-cols-3 sm:grid-cols-4 xl:grid-cols-5"
              className="gap-3"
            />
          ) : (
            <SlotState
              mode={mode}
              status={status}
              blocked={blocked}
              blockedReason={blockedReason}
              errorMessage={errorMessage}
              videoWindow={videoWindow}
            />
          )}
        </section>

        {selectedSlot ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
            <CheckCircle className="size-4 shrink-0 text-[#047857] dark:text-emerald-300" aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] font-bold text-[#065f46] dark:text-emerald-200">
                {formatSlotLabel(selectedSlot, "12h")} · {dateShort}
              </span>
              <span className="text-[11px] font-medium text-[#047857] dark:text-emerald-300">
                {durationMinutes} min {isVideo ? "video call" : "clinic visit"}
              </span>
            </span>
          </div>
        ) : null}

        {feeLabel ? (
          <div className="flex items-baseline justify-between border-t border-dashed border-line pt-3">
            <span className="text-[13px] text-ink-muted">Consultation fee</span>
            <span className="text-xl font-extrabold tracking-[-0.4px] text-ink">{feeLabel}</span>
          </div>
        ) : null}
    </BookingDoctorPage>
  );
}

// ── Staff layout (board DocAppointmentDialogs3) ────────────────────────────

function SlotStepCompact({
  mode,
  doctor,
  dateShort,
  dateLong,
  durationMinutes,
  status,
  blocked,
  blockedReason,
  errorMessage,
  videoWindow,
  periods,
  selectedSlot,
  selectedSlotChip,
  onSelectSlot,
  onClearSlot,
  liveSync,
}: BookingSlotStepViewProps) {
  const isVideo = mode === "VIDEO";
  return (
    <div className="flex flex-col gap-4">
      {isVideo ? (
        <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-hair bg-[#f8fafc] p-3.5 dark:bg-well/50">
          <div className="flex items-start justify-between gap-2.5">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-bold text-ink">Select 1 slot</span>
              <span className="text-xs font-medium text-ink-muted">15 min call within clinic video hours.</span>
            </span>
            <span className="rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] px-[9px] py-1 text-[11px] font-extrabold text-[#047857] dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
              {selectedSlot ? "1/1" : "0/1"}
            </span>
          </div>
          {liveSync ? <LiveSyncLine liveSync={liveSync} /> : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip icon={Video} tone="video">
              Video
            </Chip>
            <Chip icon={Clock}>{videoWindow ? `${videoWindow.start} – ${videoWindow.end}` : "Hours loading"}</Chip>
            {dateShort ? <Chip icon={CalendarIcon}>{dateShort}</Chip> : null}
            <Chip icon={Clock}>{durationMinutes} min</Chip>
          </div>
          {videoWindow ? (
            <span className="text-[11px] font-medium text-ink-muted">
              Video slots are available only within {videoWindow.start} – {videoWindow.end}.
            </span>
          ) : null}
          {selectedSlot ? (
            <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-950/30">
              <CheckCircle className="size-[18px] shrink-0 text-[#047857] dark:text-emerald-300" aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold text-[#065f46] dark:text-emerald-200">
                  Selected slot: {selectedSlot}
                </span>
                <span className="text-[11px] font-medium text-[#047857] dark:text-emerald-300">
                  {dateLong} · {durationMinutes} min video call
                </span>
              </span>
              <ClearSlotButton onClear={onClearSlot}>Clear selected slot</ClearSlotButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-sm text-ink-muted">
            Available slots for <span className="font-bold text-ink">{doctor?.name || "doctor"}</span> on{" "}
            <span className="font-bold text-ink">{dateShort}</span>
          </p>
          {liveSync ? <LiveSyncLine liveSync={liveSync} /> : null}
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip icon={Clock} tone="clinic">
              {durationMinutes} min per slot
            </Chip>
            <Chip>20 slots / hour</Chip>
            {selectedSlot ? (
              <Chip icon={CheckCircle} tone="green">
                {selectedSlotChip || `${selectedSlot} - ${durationMinutes} min`}
              </Chip>
            ) : null}
            {selectedSlot ? <ClearSlotButton onClear={onClearSlot}>Clear</ClearSlotButton> : null}
          </div>
        </div>
      )}

      {status === "ready" ? (
        <BookingSlotGroups
          periods={periods}
          selected={selectedSlot}
          onSelect={onSelectSlot}
          detail={`${durationMinutes} min`}
          columnsClassName="grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-4"
        />
      ) : (
        <SlotState
          mode={mode}
          status={status}
          blocked={blocked}
          blockedReason={blockedReason}
          errorMessage={errorMessage}
          videoWindow={videoWindow}
        />
      )}
    </div>
  );
}
