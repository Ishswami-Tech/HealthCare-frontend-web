/**
 * Pure helpers that keep the slot grid honest. The availability API stays the source of truth
 * for which times are open; these only (a) drop in-clinic times that fall outside the clinic's
 * own opening windows for that weekday (from the clinic settings, never hardcoded) and (b) thin a
 * very dense grid (for example every 3 minutes) down to a readable step for display.
 */

export interface ClinicWindow {
  startMinutes: number;
  endMinutes: number;
}

/** Smallest gap between two chips on screen, in minutes. Real slot lengths of 15+ are untouched. */
export const MIN_DISPLAY_STEP_MINUTES = 15;

export function slotToMinutes(slot: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(slot.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

/** Reads `{ start: "09:00", end: "17:00" }` or an array of those (one weekday of operatingWindowsByDay). */
export function readClinicWindows(dayWindows: unknown): ClinicWindow[] {
  const entries = Array.isArray(dayWindows) ? dayWindows : dayWindows ? [dayWindows] : [];
  const windows: ClinicWindow[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const start = typeof record.start === "string" ? slotToMinutes(record.start) : null;
    const end = typeof record.end === "string" ? slotToMinutes(record.end) : null;
    if (start !== null && end !== null && start < end) windows.push({ startMinutes: start, endMinutes: end });
  }
  return windows;
}

/**
 * Keeps the slots that start and finish inside one of the clinic windows. With no readable
 * windows the list is returned unchanged (the API alone decides).
 */
export function clipSlotsToWindows(
  slots: readonly string[],
  windows: readonly ClinicWindow[],
  durationMinutes: number,
): string[] {
  if (windows.length === 0) return [...slots];
  const length = durationMinutes > 0 ? durationMinutes : 0;
  return slots.filter((slot) => {
    const minutes = slotToMinutes(slot);
    if (minutes === null) return false;
    return windows.some((window) => minutes >= window.startMinutes && minutes + length <= window.endMinutes);
  });
}

/**
 * When the open times are closer together than `minStep` minutes, keeps one chip per `minStep`
 * (the earliest of each run). A grid that is already coarse enough is returned as it is.
 */
export function thinDenseSlots(slots: readonly string[], minStep = MIN_DISPLAY_STEP_MINUTES): string[] {
  const entries = slots
    .map((slot) => ({ slot, minutes: slotToMinutes(slot) }))
    .filter((entry): entry is { slot: string; minutes: number } => entry.minutes !== null)
    .sort((a, b) => a.minutes - b.minutes);
  let smallestGap = Number.POSITIVE_INFINITY;
  for (let index = 1; index < entries.length; index += 1) {
    const gap = (entries[index]?.minutes ?? 0) - (entries[index - 1]?.minutes ?? 0);
    if (gap > 0 && gap < smallestGap) smallestGap = gap;
  }
  if (smallestGap >= minStep) return entries.map((entry) => entry.slot);
  const kept: string[] = [];
  let lastKept = Number.NEGATIVE_INFINITY;
  for (const entry of entries) {
    if (entry.minutes - lastKept >= minStep) {
      kept.push(entry.slot);
      lastKept = entry.minutes;
    }
  }
  return kept;
}
