/**
 * Reads the open "HH:mm" slots out of a doctor-availability response and groups them into
 * Morning / Afternoon / Evening. The response may be wrapped in `data` / `data.data`.
 */

export interface SlotGroups {
  morning: string[];
  afternoon: string[];
  evening: string[];
}

function nonEmptyStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((slot): slot is string => typeof slot === "string" && slot.trim().length > 0)
    : [];
}

export function extractAvailabilitySlots(availability: unknown): string[] {
  let node: unknown = availability;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!node || typeof node !== "object" || Array.isArray(node)) return [];
    const record = node as Record<string, unknown>;
    if (Array.isArray(record.availableSlots)) return nonEmptyStrings(record.availableSlots);
    if (Array.isArray(record.slots)) {
      return record.slots.flatMap((slot) => {
        if (!slot || typeof slot !== "object") return [];
        const entry = slot as Record<string, unknown>;
        if (entry.isAvailable === false) return [];
        return typeof entry.startTime === "string" && entry.startTime.trim() ? [entry.startTime] : [];
      });
    }
    node = record.data;
  }
  return [];
}

export function groupSlotsByPeriod(slots: string[]): SlotGroups {
  const groups: SlotGroups = { morning: [], afternoon: [], evening: [] };
  for (const slot of slots) {
    const match = /^(\d{1,2}):(\d{2})/.exec(slot.trim());
    if (!match) continue;
    const hour = Number(match[1]);
    if (hour < 12) groups.morning.push(slot);
    else if (hour < 17) groups.afternoon.push(slot);
    else groups.evening.push(slot);
  }
  return groups;
}
