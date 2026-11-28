"use client";

import { useState } from "react";
import { Clock, RotateCcw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/tbd";
import {
  useCancelDayOverride,
  useCreateDayOverride,
  useDayAvailability,
  type DayOverrideSession,
} from "@/hooks/query/useDayAvailability";
import { formatDateInIST, formatDateKeyInIST } from "@/lib/utils/date-time";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";

/**
 * "Emergency hours" for one IST day: one-tap presets that close, shrink or re-window the day
 * via the L1 per-day availability override — no confirmation step, because "Resume normal
 * schedule" next to the active override restores the weekly hours with one more tap. Two
 * surfaces share it: the panel on the day-detail strip (today or any selected day) and the
 * compact "Today" quick-access row in the hero, so today's override is one glance away
 * without picking a date.
 */

interface DayOverridePreset {
  id: string;
  label: string;
  /** The sessions the preset applies; `[]` closes the day. */
  sessions: DayOverrideSession[];
  /** The default emergency reason sent with the override. */
  reason: string;
}

/** The one-tap presets, compactly listed. Times are 24h "HH:mm", the override's session shape. */
const PRESETS: DayOverridePreset[] = [
  { id: "leaving-soon", label: "Leaving soon — closed until 5:00 pm", sessions: [], reason: "Emergency: leaving, closed until 5 pm" },
  { id: "closed", label: "Closed for the rest of today", sessions: [], reason: "Emergency: closed for the rest of today" },
  { id: "limited-hours", label: "Open 12:00 – 3:00 only", sessions: [{ start: "12:00", end: "15:00" }], reason: "Emergency: limited hours" },
];

/** "12:00–15:00 · 17:00–18:00" for an open day, "Closed for the day" for `[]`. */
function sessionsLabel(sessions: DayOverrideSession[]): string {
  return sessions.length === 0 ? "Closed for the day" : sessions.map((block) => `${block.start}–${block.end}`).join(" · ");
}

/** A short IST label for a day key ("Wed 18 Jun 2026"), for the success/error notes. */
function dayLabel(dateKey: string): string {
  return formatDateInIST(new Date(`${dateKey}T00:00:00+05:30`), { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** The IST day key of "today" on this device — the same convention the leave rows use. */
function todayIstKey(): string {
  return formatDateKeyInIST(new Date());
}

/**
 * The panel under the day-detail strip, folded by default to one quiet row —
 * "Emergency hours — Set" — that expands on tap; when the day already carries an active
 * override it renders expanded instead, so the restore row never has to be discovered.
 * Inside, the presets, an optional reason (tiny, inline) that replaces the preset's
 * default, the custom-hours row (two time inputs + Apply, same endpoint) and — when the
 * day already has an active override — its prominent amber row: "Resume normal schedule"
 * (DELETE the override) plus a subtle "Re-set hours" affordance that re-opens the custom
 * row prefilled with the override's window.
 */
export function DayOverridePanel({ dateKey }: { dateKey: string }) {
  const { override, isPending } = useDayAvailability(dateKey);
  const create = useCreateDayOverride();
  const cancel = useCancelDayOverride();

  // Which preset matches the active override (if any) so its chip stays pressed.
  const activePresetId =
    PRESETS.find(
      (preset) =>
        preset.sessions.length === override?.sessions.length &&
        preset.sessions.every(
          (block, index) => block.start === override?.sessions[index]?.start && block.end === override?.sessions[index]?.end,
        ),
    )?.id ?? null;

  const [expanded, setExpanded] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customStart, setCustomStart] = useState("09:00");
  const [customEnd, setCustomEnd] = useState("17:00");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "Re-set hours": prefill the custom row with the override's first session and open it.
  const openCustom = () => {
    const session = override?.sessions[0];
    if (session) {
      setCustomStart(session.start);
      setCustomEnd(session.end);
    }
    setCustomOpen(true);
  };

  // Client-side guard: both times present and start < end. The backend also validates.
  const customProblem =
    !customStart || !customEnd ? "Enter both times." : customStart >= customEnd ? "Start must be before end." : null;

  const apply = async (sessions: DayOverrideSession[], presetReason: string) => {
    setStatus(null);
    setError(null);
    try {
      await create.mutateAsync({ date: dateKey, sessions, ...(reason.trim() ? { reason: reason.trim() } : { reason: presetReason }) });
      setStatus(`Done — patients can no longer book outside the override windows for ${dayLabel(dateKey)}.`);
    } catch (failure) {
      setError(sanitizeErrorMessage(failure) || "The override could not be saved.");
    }
  };

  const resume = async () => {
    if (!override) return;
    setStatus(null);
    setError(null);
    try {
      await cancel.mutateAsync(override.id);
      setStatus(`Normal weekly hours restored for ${dayLabel(dateKey)}.`);
    } catch (failure) {
      setError(sanitizeErrorMessage(failure) || "The override could not be cancelled.");
    }
  };

  const busy = create.isPending || cancel.isPending;

  // The panel renders folded (one quiet row) until the doctor taps "Set"; an active
  // override, or a just-shown success/error, expands it automatically — the restore row
  // must never hide behind a collapsed affordance.
  const showFull = expanded || override !== null || status !== null || error !== null;

  if (!showFull) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50/40 px-3 py-2 dark:border-amber-800/60 dark:bg-amber-950/20">
        <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Emergency hours</span>
        <span className="text-[11px] font-medium text-ink-soft">· {dayLabel(dateKey)}</span>
        {isPending ? (
          <span className="ml-auto text-[11px] text-ink-muted">Loading…</span>
        ) : (
          <Button size="compact" variant="ghost" className="ml-auto" onClick={() => setExpanded(true)}>
            Set
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50/40 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted">
        <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        Emergency hours
        <span className="text-[11px] font-medium normal-case tracking-normal text-ink-soft">· {dayLabel(dateKey)}</span>
      </div>

      {/* The active override: the prominent amber row — windows, reason, set-time, and the
       * one-tap restore. Superseded rows never come back from the list, so one row is enough. */}
      {override ? (
        <div className="rounded-lg border border-amber-300/80 bg-amber-100/70 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-900/30">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-amber-900 dark:text-amber-100">
            <span>
              {dateKey === todayIstKey() ? "Today's" : "This day's"} hours overridden: {sessionsLabel(override.sessions)}
            </span>
            {override.reason ? <span className="font-medium text-amber-800/80 dark:text-amber-300/80">· {override.reason}</span> : null}
            <span className="text-[11px] font-medium text-amber-700/70 dark:text-amber-400/70">
              · set {formatDateInIST(override.createdAt, { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Button size="compact" variant="outline" disabled={busy} onClick={() => void resume()}>
              <Undo2 className="size-3.5" aria-hidden="true" />
              Resume normal schedule
            </Button>
            <Button size="compact" variant="ghost" disabled={busy} onClick={openCustom} title="Re-set the hours">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Re-set hours
            </Button>
          </div>
        </div>
      ) : null}

      {/* The presets, quick and reversible — no confirmation step. Chips wrap instead of
       * truncating; when a preset is active the inactive ones dim out of the way. */}
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Emergency hour presets">
        {PRESETS.map((preset) => {
          const isActivePreset = activePresetId === preset.id;
          const dimmed = override !== null && !isActivePreset;
          return (
            <Button
              key={preset.id}
              size="compact"
              variant={isActivePreset ? "default" : "outline"}
              disabled={busy}
              className={`whitespace-normal ${dimmed ? "opacity-45" : ""}`}
              title={`Applies ${preset.sessions.length === 0 ? "closed" : `open ${sessionsLabel(preset.sessions)}`} for the day`}
              onClick={() => void apply(preset.sessions, preset.reason)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* An optional short reason that replaces the preset's default before applying —
       * full width, so the placeholder never cuts off. */}
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional, replaces the preset's default)"
        className="h-8 w-full text-xs"
        aria-label="Custom reason for the override"
      />

      {/* The custom-hours row: two time inputs + Apply, same endpoint as the presets. */}
      {customOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="time"
            value={customStart}
            onChange={(event) => setCustomStart(event.target.value)}
            className="h-8 w-[110px] text-xs"
            aria-label="Custom start time"
          />
          <span className="text-xs text-ink-muted">to</span>
          <Input
            type="time"
            value={customEnd}
            onChange={(event) => setCustomEnd(event.target.value)}
            className="h-8 w-[110px] text-xs"
            aria-label="Custom end time"
          />
          <Button
            size="compact"
            disabled={busy || Boolean(customProblem)}
            onClick={() => void apply([{ start: customStart, end: customEnd }], "Emergency: custom hours")}
          >
            Apply
          </Button>
          {customProblem ? <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{customProblem}</span> : null}
        </div>
      ) : (
        <Button size="compact" variant="ghost" disabled={busy} onClick={openCustom}>
          Custom hours…
        </Button>
      )}

      {/* Feedback: a small green note on apply / resume, errors the same shape in rose. */}
      {status ? (
        <Note tone="green">
          <span className="font-medium">{status}</span>
        </Note>
      ) : null}
      {error ? (
        <Note tone="rose">
          <span className="font-medium">{error}</span>
        </Note>
      ) : null}
    </div>
  );
}

/**
 * The "Today" quick-access row near the top of the hero: today's override state without
 * picking a date. Active override → the amber row with "Resume normal schedule" and
 * "Adjust" (jumps the selected day to today so the strip's panel takes over); no override →
 * a quiet row with one tap into the preset panel for today.
 */
export function DayOverrideTodayRow({ dateKey, onSelect }: { dateKey: string; onSelect: () => void }) {
  const { override, isPending } = useDayAvailability(dateKey);
  const cancel = useCancelDayOverride();

  const resume = async () => {
    if (!override) return;
    await cancel.mutateAsync(override.id);
  };

  if (isPending && !override) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink-muted">
        <Clock className="size-3.5" aria-hidden="true" />
        Loading today's hours…
      </div>
    );
  }

  if (override) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/80 bg-amber-100/70 px-3 py-2 dark:border-amber-700/60 dark:bg-amber-900/30">
        <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span className="text-[13px] font-bold text-amber-900 dark:text-amber-100">
          Today's hours overridden: {sessionsLabel(override.sessions)}
        </span>
        {override.reason ? <span className="text-xs font-medium text-amber-800/80 dark:text-amber-300/80">· {override.reason}</span> : null}
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button size="compact" variant="outline" disabled={cancel.isPending} onClick={() => void resume()}>
            <Undo2 className="size-3.5" aria-hidden="true" />
            Resume normal schedule
          </Button>
          <Button size="compact" variant="ghost" onClick={onSelect} title="Adjust today's hours">
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Adjust
          </Button>
        </div>
      </div>
    );
  }

  // No active override: the quiet row, one tap into the preset panel for today.
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
      <Clock className="size-3.5 shrink-0 text-mint dark:text-mint" aria-hidden="true" />
      <span className="text-[13px] font-bold text-ink">Today</span>
      <span className="text-xs text-ink-muted">normal weekly hours</span>
      <div className="ml-auto">
        <Button size="compact" variant="outline" onClick={onSelect}>
          Set emergency hours
        </Button>
      </div>
    </div>
  );
}
