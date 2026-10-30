"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Note, SectionTitle, SkeletonRows, Surface } from "@/components/tbd";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { PROFILE_SWITCH } from "../../profile/_components/DoctorProfileParts";

/** One OPD time block, the same `{ start, end }` shape the slot engine reads per weekday. */
export interface TimeBlock {
  start: string;
  end: string;
}

/** The editor's state for one weekday: whether it is open and its OPD blocks (several allowed). */
export interface OpdDay {
  available: boolean;
  blocks: TimeBlock[];
}

export type OpdWeek = Record<string, OpdDay>;

/** The slot-engine's weekday order (Monday first). */
export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

/** "HH:mm" -> minutes, or null when the input is empty / malformed. */
function toMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Read the doctor's stored availability (the profile's `availability` / `workingHours` JSON)
 * into the multi-block editor shape. The profile's save writes one block per day, but the
 * engine also accepts several, so a day may already carry two or more blocks.
 *
 * `availability` and `workingHours` are the same record: `Record<weekday, { start, end }[]>`
 * (a possibly-longer array of blocks), or a legacy flat shape that applies to every day.
 */
export function loadOpdWeek(raw: unknown): OpdWeek {
  const record =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : undefined;

  // Per-day shape: keyed by weekday name.
  if (record && WEEK_DAYS.some((day) => day in record)) {
    const week = buildEmptyWeek();
    for (const day of WEEK_DAYS) {
      week[day] = dayToOpdDay(record[day]);
    }
    return week;
  }

  // Legacy flat shape: one block (or session array) that applies to every day.
  const flat = dayToOpdDay(record && !WEEK_DAYS.some((day) => day in record) ? record : undefined);
  const week = buildEmptyWeek();
  for (const day of WEEK_DAYS) {
    week[day] = { available: flat.available, blocks: flat.blocks.map((block) => ({ ...block })) };
  }
  return week;
}

/** Normalise whatever one weekday stored into its list of blocks. */
function dayToOpdDay(value: unknown): OpdDay {
  // Per-day session array: [{ start, end }, ...]
  if (Array.isArray(value)) {
    const blocks = value
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const item = entry as Record<string, unknown>;
        const start = typeof item.start === "string" ? item.start : "";
        const end = typeof item.end === "string" ? item.end : "";
        return start && end ? { start, end } : null;
      })
      .filter((block): block is TimeBlock => block !== null);
    return { available: blocks.length > 0, blocks };
  }

  // Single session object: { start, end }
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    const start = typeof item.start === "string" ? item.start : "";
    const end = typeof item.end === "string" ? item.end : "";
    if (start && end) return { available: true, blocks: [{ start, end }] };
  }

  return { available: false, blocks: [] };
}

function buildEmptyWeek(): OpdWeek {
  const week = {} as OpdWeek;
  for (const day of WEEK_DAYS) week[day] = emptyDay();
  return week;
}

/** A fresh, unavailable day — used as the safe fallback when a weekday key is missing. */
function emptyDay(): OpdDay {
  return { available: false, blocks: [] };
}

/**
 * The weekday-keyed `{ start, end }[]` shape the slot engine consumes and the profile save
 * already writes — the same `availability` field, so both editors read and write one record.
 */
function weekToPayload(week: OpdWeek): Record<string, TimeBlock[]> {
  const payload: Record<string, TimeBlock[]> = {};
  for (const day of WEEK_DAYS) {
    const dayState = week[day];
    payload[day] = dayState?.available
      ? dayState.blocks
          .filter((block) => block.start && block.end)
          .map((block) => ({ start: block.start, end: block.end }))
      : [];
  }
  return payload;
}

/** A fresh block: one hour after the previous block's end, or 09:00–12:00 for the first. */
function nextBlockAfter(blocks: TimeBlock[]): TimeBlock {
  const last = blocks[blocks.length - 1];
  const start = last ? toMinutes(last.end) : null;
  const startMinutes = start !== null && start + 120 < 24 * 60 ? start : 9 * 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    start: `${pad(Math.floor(startMinutes / 60))}:${pad(startMinutes % 60)}`,
    end: `${pad(Math.floor((startMinutes + 120) / 60))}:${pad((startMinutes + 120) % 60)}`,
  };
}

/**
 * The doctor's weekly OPD schedule — one row per weekday: a single "Open for OPD" toggle
 * and, when open, that day's first block as two time inputs. Days with more than one
 * stored block keep all of them editable under a small "extra blocks" disclosure, so
 * nothing is silently dropped. It persists through the same `availability` field the
 * Profile page's Availability tab writes (`updateUserProfile` ->
 * POST /profile/completion/update -> `doctor.workingHours`), so the booking slot engine
 * and both editors stay in sync.
 */
export function DoctorWeeklyOPDSchedule() {
  const { data: userProfile } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const stored = useMemo(
    () =>
      ((userProfile as Record<string, unknown> | null | undefined)?.availability ??
        (userProfile as Record<string, unknown> | null | undefined)?.workingHours) as unknown,
    [userProfile],
  );

  const [week, setWeek] = useState<OpdWeek>(() => loadOpdWeek(stored));
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-seed the local editor only when a fresh server copy arrives (the profile is loaded,
  // or a save elsewhere refreshed it) — never when the doctor is mid-edit on this page.
  useEffect(() => {
    setWeek(loadOpdWeek(stored));
    setSaveError(null);
  }, [stored]);

  const updateDay = (day: string, patch: Partial<OpdDay>) => {
    setWeek((prev) => ({ ...prev, [day]: { ...(prev[day] ?? emptyDay()), ...patch } }));
  };

  const updateBlock = (day: string, index: number, patch: Partial<TimeBlock>) => {
    setWeek((prev) => {
      const dayState = prev[day] ?? emptyDay();
      return {
        ...prev,
        [day]: {
          ...dayState,
          blocks: dayState.blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)),
        },
      };
    });
  };

  const addBlock = (day: string) => {
    setWeek((prev) => {
      const dayState = prev[day] ?? emptyDay();
      const block = nextBlockAfter(dayState.blocks);
      return {
        ...prev,
        [day]: { ...dayState, blocks: [...dayState.blocks, block] },
      };
    });
  };

  const removeBlock = (day: string, index: number) => {
    setWeek((prev) => {
      const dayState = prev[day] ?? emptyDay();
      const blocks = dayState.blocks.filter((_, i) => i !== index);
      return {
        ...prev,
        [day]: { ...dayState, blocks, available: blocks.length > 0 },
      };
    });
  };

  const save = async () => {
    setSaveError(null);
    try {
      const result = await updateProfile.mutateAsync({ availability: weekToPayload(week) });
      if (!result.success) {
        // The action's failure shapes carry `error`; its success shape carries `message` — read
        // whichever is present before falling back to a generic copy.
        const reason =
          ("error" in result && typeof result.error === "string" ? result.error : undefined) ??
          ("message" in result && typeof result.message === "string" ? result.message : undefined) ??
          "The schedule could not be saved.";
        setSaveError(reason);
        return;
      }
      showSuccessToast("Weekly OPD schedule saved", { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The schedule could not be saved.");
      showErrorToast(error instanceof Error ? error.message : "The schedule could not be saved.", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  return (
    <Surface flush as="section" aria-label="Weekly OPD schedule">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair px-5 py-4">
        <SectionTitle
          title="Weekly OPD hours"
          description="One toggle per weekday, open the day and set its hours — the Profile's Availability tab edits the same record."
          action={
            <Button
              type="button"
              variant="soft"
              size="md"
              onClick={() => void save()}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              Save schedule
            </Button>
          }
        />
      </div>

      {!userProfile ? (
        <div className="px-5 py-3">
          <SkeletonRows rows={7} />
        </div>
      ) : (
        <div className="flex flex-col">
          <OpdDayGroup label="Weekdays">
            {WEEK_DAYS.slice(0, 5).map((day) => (
              <OpdDayRow
                key={day}
                day={day}
                state={week[day] ?? emptyDay()}
                onToggle={(available) => updateDay(day, { available })}
                onBlock={(index, patch) => updateBlock(day, index, patch)}
                onAddBlock={() => addBlock(day)}
                onRemoveBlock={(index) => removeBlock(day, index)}
              />
            ))}
          </OpdDayGroup>
          <OpdDayGroup label="Weekend">
            {WEEK_DAYS.slice(5).map((day) => (
              <OpdDayRow
                key={day}
                day={day}
                state={week[day] ?? emptyDay()}
                onToggle={(available) => updateDay(day, { available })}
                onBlock={(index, patch) => updateBlock(day, index, patch)}
                onAddBlock={() => addBlock(day)}
                onRemoveBlock={(index) => removeBlock(day, index)}
              />
            ))}
          </OpdDayGroup>
        </div>
      )}

      {saveError ? (
        <div className="border-t border-hair px-5 py-3">
          <Note tone="rose">{saveError}</Note>
        </div>
      ) : null}
    </Surface>
  );
}

/** One labelled group of weekday rows: a quiet uppercase band, then its rows. */
function OpdDayGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="border-b border-hair bg-muted/40 px-5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-ink-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

/**
 * One weekday, one row: the day's label, a single toggle and — when open — the day's first
 * block as two time inputs. A toggle-off day collapses to the muted "Closed" state of the
 * same row (never a second "Closed" row). Any extra stored blocks stay editable under a
 * small "extra blocks" disclosure, so a day with several blocks doesn't lose data when
 * the doctor only touches the first one.
 */
function OpdDayRow({
  day,
  state,
  onToggle,
  onBlock,
  onAddBlock,
  onRemoveBlock,
}: {
  day: string;
  state: OpdDay;
  onToggle: (available: boolean) => void;
  onBlock: (index: number, patch: Partial<TimeBlock>) => void;
  onAddBlock: () => void;
  onRemoveBlock: (index: number) => void;
}) {
  const name = day.charAt(0).toUpperCase() + day.slice(1);
  // The default view edits block 0; anything after it folds into the disclosure.
  const extraBlocks = state.blocks.slice(1);
  const [showExtras, setShowExtras] = useState(false);

  return (
    <div className={state.available ? "border-b border-hair px-5 py-3 last:border-b-0" : "border-b border-hair px-5 py-2 last:border-b-0"}>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className={`w-[88px] shrink-0 text-sm ${
            state.available ? "font-bold text-ink" : "font-medium text-ink-soft/70"
          }`}
        >
          {name}
        </span>
        <Switch
          id={`opd-${day}`}
          className={PROFILE_SWITCH}
          checked={state.available}
          onCheckedChange={onToggle}
        />
        <label
          htmlFor={`opd-${day}`}
          className={`text-[13px] ${state.available ? "text-ink-muted" : "font-medium text-ink-soft/70"}`}
        >
          {state.available ? "Open" : "Closed"}
        </label>

        {state.available && state.blocks[0] ? (
          <span className="ml-auto flex items-center gap-1.5">
            <Input
              type="time"
              aria-label={`${name} start`}
              value={state.blocks[0].start}
              onChange={(event) => onBlock(0, { start: event.target.value })}
              className="h-8 w-[112px]"
            />
            <span className="text-[13px] text-ink-muted" aria-hidden="true">
              to
            </span>
            <Input
              type="time"
              aria-label={`${name} end`}
              value={state.blocks[0].end}
              onChange={(event) => onBlock(0, { end: event.target.value })}
              className="h-8 w-[112px]"
            />
          </span>
        ) : null}
      </div>

      {state.available && extraBlocks.length > 0 ? (
        <div className="mt-1.5 pl-[88px]">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[12px] font-bold text-ink-muted hover:text-ink"
            onClick={() => setShowExtras((open) => !open)}
            aria-expanded={showExtras}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${showExtras ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
            {showExtras ? "Hide extra blocks" : `${extraBlocks.length} extra ${extraBlocks.length === 1 ? "block" : "blocks"}`}
          </button>

          {showExtras ? (
            <div className="mt-1.5 flex flex-col gap-1.5">
              {extraBlocks.map((block, index) => {
                const realIndex = index + 1;
                return (
                  <div key={realIndex} className="flex flex-wrap items-center gap-1.5">
                    <Input
                      type="time"
                      aria-label={`${name} extra block ${index + 1} start`}
                      value={block.start}
                      onChange={(event) => onBlock(realIndex, { start: event.target.value })}
                      className="h-8 w-[112px]"
                    />
                    <span className="text-[13px] text-ink-muted" aria-hidden="true">
                      to
                    </span>
                    <Input
                      type="time"
                      aria-label={`${name} extra block ${index + 1} end`}
                      value={block.end}
                      onChange={(event) => onBlock(realIndex, { end: event.target.value })}
                      className="h-8 w-[112px]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="compact"
                      aria-label={`Remove ${name} extra block ${index + 1}`}
                      onClick={() => onRemoveBlock(realIndex)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="compact" onClick={onAddBlock}>
                <Plus aria-hidden="true" />
                Add OPD block
              </Button>
            </div>
          ) : null}
        </div>
      ) : state.available ? (
        <div className="mt-1.5 pl-[88px]">
          <Button type="button" variant="outline" size="compact" onClick={onAddBlock}>
            <Plus aria-hidden="true" />
            Add OPD block
          </Button>
        </div>
      ) : null}
    </div>
  );
}
