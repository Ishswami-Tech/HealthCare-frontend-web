import { formatDateKeyInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { thinDenseSlots } from "./clinicHours";
import type { BookingPeriodKey, BookingSlotOption, BookingSlotPeriod } from "./types";

/**
 * Display helpers for the slot grid. They only decide what is DRAWN. Which slots can be
 * booked is still decided by the dialog (`effectiveSlots`) and re-checked on confirm.
 */

const PERIODS: Array<{ key: BookingPeriodKey; label: string; range: string }> = [
  { key: "morning", label: "Morning", range: "Before 12pm" },
  { key: "afternoon", label: "Afternoon", range: "12pm - 5pm" },
  { key: "evening", label: "Evening", range: "After 5pm" },
];

function toMinutes(slot: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(slot.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function normalize(slot: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(slot.trim());
  return match ? `${(match[1] ?? "").padStart(2, "0")}:${match[2] ?? ""}` : slot.trim();
}

function periodOf(slot: string): BookingPeriodKey {
  // Same split the dialog uses in `groupSlotsByPeriod`.
  const hour = parseInt(slot.split(":")[0] ?? "0");
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Reads `bookedSlots` from the availability response (root, `data`, or `data.data`). */
export function readBookedSlots(availability: unknown): string[] {
  const found = new Set<string>();
  let node: unknown = availability;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!node || typeof node !== "object" || Array.isArray(node)) break;
    const record = node as Record<string, unknown>;
    if (Array.isArray(record.bookedSlots)) {
      for (const entry of record.bookedSlots) {
        if (typeof entry === "string" && entry.trim()) found.add(normalize(entry));
      }
    }
    node = record.data;
  }
  return Array.from(found);
}

/**
 * Minutes since midnight right now, in IST. A slot already at or before this, on today's date,
 * went stale while the dialog sat open (the list was correct when it was fetched).
 */
function nowMinutesInIST(): number {
  const label = formatTimeInIST(new Date(), { hour: "2-digit", minute: "2-digit", hour12: false });
  return toMinutes(label) ?? 0;
}

/**
 * Builds the Morning / Afternoon / Evening groups.
 * `groups` are the bookable slots exactly as the dialog grouped them.
 * A booked slot is added (struck through) only when it sits on the same time grid as the open
 * slots and between the first and the last open slot, so bookings of another visit type or
 * outside the video hours never show up as chips.
 *
 * `dateKey` ("YYYY-MM-DD", IST): when it is today, any open slot at or before the current time
 * is shown struck through as "Expired" instead of selectable. The availability API already drops
 * past slots when it answers, but the grid can sit open past that slot's time (the user mid-flow,
 * a stale cache); without this a dead slot stays clickable until the booking call refuses it.
 */
export function buildSlotPeriods(
  groups: Record<BookingPeriodKey, string[]>,
  bookedSlots: string[],
  durationMinutes: number,
  dateKey?: string,
): BookingSlotPeriod[] {
  const open = [...groups.morning, ...groups.afternoon, ...groups.evening];
  // Dense grids (a 3-minute visit length) are thinned for display only; every chip is still a
  // slot the API reported as open.
  const shownOpen = new Set(thinDenseSlots(open));
  const shownGroups: Record<BookingPeriodKey, string[]> = {
    morning: groups.morning.filter((slot) => shownOpen.has(slot)),
    afternoon: groups.afternoon.filter((slot) => shownOpen.has(slot)),
    evening: groups.evening.filter((slot) => shownOpen.has(slot)),
  };
  const openSet = new Set(open);
  const openMinutes = open.map(toMinutes).filter((value): value is number => value !== null);
  const first = openMinutes.length > 0 ? Math.min(...openMinutes) : null;
  const last = openMinutes.length > 0 ? Math.max(...openMinutes) : null;
  const step = durationMinutes > 0 ? durationMinutes : 0;

  const taken: Record<BookingPeriodKey, string[]> = { morning: [], afternoon: [], evening: [] };
  if (first !== null && last !== null && step > 0) {
    for (const slot of bookedSlots) {
      if (openSet.has(slot)) continue;
      const minutes = toMinutes(slot);
      if (minutes === null || minutes < first || minutes > last) continue;
      if ((minutes - first) % step !== 0) continue;
      taken[periodOf(slot)].push(slot);
    }
  }

  const isToday = Boolean(dateKey) && dateKey === formatDateKeyInIST(new Date());
  const nowMinutes = isToday ? nowMinutesInIST() : -1;
  const isExpired = (value: string): boolean => {
    if (!isToday) return false;
    const minutes = toMinutes(value);
    return minutes !== null && minutes <= nowMinutes;
  };

  return PERIODS.map((period) => {
    const slots: BookingSlotOption[] = [
      ...shownGroups[period.key].map((value) =>
        isExpired(value)
          ? { value, unavailable: true as const, reason: "expired" as const }
          : { value, unavailable: false as const },
      ),
      ...taken[period.key].map((value) => ({ value, unavailable: true as const, reason: "booked" as const })),
    ].sort((a, b) => a.value.localeCompare(b.value));
    const openCount = shownGroups[period.key].filter((value) => !isExpired(value)).length;
    return { ...period, slots, openCount };
  }).filter((period) => period.slots.length > 0);
}
