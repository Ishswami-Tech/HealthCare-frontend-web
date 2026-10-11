/** Display helpers for the booking screens. Display only: slot values sent to the API are never changed. */

/** "09:30" -> "09:30 AM" (patient boards) or unchanged (staff board). */
export function formatSlotLabel(slot: string, style: "12h" | "24h" = "24h"): string {
  if (style === "24h") return slot;
  const match = /^(\d{1,2}):(\d{2})/.exec(slot.trim());
  if (!match) return slot;
  const hours = Number(match[1]);
  const minutes = match[2] ?? "00";
  if (!Number.isFinite(hours)) return slot;
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(twelve).padStart(2, "0")}:${minutes} ${suffix}`;
}

/** Whole rupees, the same rounding the dialog already used (`toFixed(0)`). */
export function formatRupees(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

/** Short booking reference shown to people: first 8 characters of the appointment id, upper case. */
export function shortBookingRef(id: string | null | undefined): string {
  const clean = String(id ?? "").trim();
  if (!clean) return "";
  return clean.replace(/-/g, "").slice(0, 8).toUpperCase();
}

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_SHORT: Record<(typeof DAY_ORDER)[number], string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function readWindows(value: unknown): string[] {
  const list = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  const windows: string[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const record = entry as Record<string, unknown>;
    const start = typeof record.start === "string" ? record.start.trim() : "";
    const end = typeof record.end === "string" ? record.end.trim() : "";
    if (start && end && start < end) windows.push(`${start} – ${end}`);
  }
  return windows;
}

/**
 * Turns a doctor's `workingHours` JSON (day -> window or list of windows) into rows for the
 * "Clinic timings" card. Days in a row with the same hours are joined ("Mon – Sat").
 * Returns [] when the data is missing or has another shape, so the card is simply not shown.
 */
export function summarizeWorkingHours(workingHours: unknown): Array<{ label: string; value: string }> {
  if (!workingHours || typeof workingHours !== "object" || Array.isArray(workingHours)) return [];
  const record = workingHours as Record<string, unknown>;
  const perDay = DAY_ORDER.filter((day) => Object.prototype.hasOwnProperty.call(record, day)).map((day) => ({
    day,
    text: readWindows(record[day]).join(" · ") || "Closed",
  }));
  if (perDay.length === 0) return [];

  const rows: Array<{ from: string; to: string; value: string }> = [];
  for (const entry of perDay) {
    const last = rows[rows.length - 1];
    const short = DAY_SHORT[entry.day];
    if (last && last.value === entry.text) {
      last.to = short;
    } else {
      rows.push({ from: short, to: short, value: entry.text });
    }
  }
  return rows.map((row) => ({
    label: row.from === row.to ? row.from : `${row.from} – ${row.to}`,
    value: row.value,
  }));
}

/** A profile list field (string, array or empty) as trimmed, non-empty lines. */
export function toTextList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}
