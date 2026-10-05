/**
 * "Add to Calendar" for the booked screen: builds a small .ics file in the browser.
 * Nothing is sent anywhere. Slot times are clinic time (IST, UTC+05:30).
 */

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

export interface BookingCalendarEvent {
  /** Calendar day of the visit in clinic time, "yyyy-MM-dd". */
  day: string;
  /** Slot start, "HH:mm". */
  slot: string;
  durationMinutes: number;
  title: string;
  description?: string | undefined;
  uid?: string | undefined;
}

/** Returns the .ics text, or null when the day or slot cannot be read. */
export function buildBookingCalendarFile(event: BookingCalendarEvent): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event.day) || !/^\d{2}:\d{2}$/.test(event.slot)) return null;
  const start = new Date(`${event.day}T${event.slot}:00+05:30`);
  if (!Number.isFinite(start.getTime())) return null;
  const end = new Date(start.getTime() + Math.max(event.durationMinutes, 1) * 60_000);
  const uid = `${event.uid || `${event.day}-${event.slot}`}@testbydoctor`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TestByDoctor//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Saves the .ics file from the browser. Returns false when there is nothing to save. */
export function downloadBookingCalendarFile(event: BookingCalendarEvent, fileName = "appointment.ics"): boolean {
  const content = buildBookingCalendarFile(event);
  if (!content || typeof window === "undefined") return false;
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
