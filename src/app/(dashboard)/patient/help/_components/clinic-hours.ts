import { formatSlotLabel, summarizeWorkingHours } from "@/components/appointments/booking/format";

/**
 * Clinic hours for the Help page, from the backend clinic payload (`GET /clinics/my-clinic`):
 * each active location's `workingHours` — either one window for every day (`{ start, end }`) or a
 * day map (`{ monday: { start, end }, ... }`), sometimes sent as a JSON string. Pure, no React.
 */

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  if (typeof value === "string") {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function windowLabel(start: string, end: string): string {
  if (start === "00:00" && (end === "23:59" || end === "24:00")) return "Open 24 hours";
  return `${formatSlotLabel(start, "12h")} – ${formatSlotLabel(end, "12h")}`;
}

/** "Mon – Sat 09:00 am – 01:00 pm · Sun Closed", "Every day Open 24 hours", or "" when unknown. */
export function workingHoursText(workingHours: unknown): string {
  const record = asRecord(workingHours);
  if (!record) return "";
  const start = text(record.start);
  const end = text(record.end);
  if (start && end) return `Every day ${windowLabel(start, end)}`;
  return summarizeWorkingHours(record)
    .map((row) => `${row.label} ${row.value}`)
    .join(" · ");
}

/** One line per active location that has hours ("Main Clinic: Every day …"); the name is left out for one. */
export function clinicHoursLines(clinic: unknown): string[] {
  const locations = Array.isArray(asRecord(clinic)?.locations) ? (asRecord(clinic)?.locations as unknown[]) : [];
  const rows = locations
    .map(asRecord)
    .filter((location): location is Raw => Boolean(location) && location?.isActive !== false)
    .map((location) => ({ name: text(location.name), hours: workingHoursText(location.workingHours) }))
    .filter((row) => Boolean(row.hours));
  if (rows.length === 1) return [rows[0]?.hours ?? ""].filter(Boolean);
  return rows.map((row) => (row.name ? `${row.name}: ${row.hours}` : row.hours));
}
