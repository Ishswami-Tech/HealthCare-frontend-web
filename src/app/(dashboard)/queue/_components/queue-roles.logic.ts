import type { PillTone } from "@/components/tbd";
import { Role } from "@/types/auth.types";
import {
  QUEUE_STATUS,
  getQueueWaitMinutes,
  isVideoQueueEntry,
  type QueueDisplayItem,
} from "./queue.logic";

/**
 * In-clinic queue rules per role (product rules V2), with no React in them.
 *
 * Stages: BOOKED (not in the queue) -> CHECKED_IN (QR scan or reception check-in, token K-0xx)
 * -> WITH_DOCTOR -> COMPLETED / NO_SHOW / EXPIRED. There is no vitals or "ready for doctor" stage:
 * a checked-in patient goes straight to the doctor. Video visits never appear in this queue.
 */

// ── Who sees what ──────────────────────────────────────────────────────────

export type QueueRoleVariant = "doctor" | "assistant" | "reception" | "clinicAdmin" | "viewer";

export interface QueueCapabilities {
  variant: QueueRoleVariant;
  /** Only the doctor calls, starts and completes a visit. */
  canRunVisit: boolean;
  /** Assistant: open a checked-in patient to draft a prescription or dispense from clinic stock. */
  canPrepareForDoctor: boolean;
  /** Senior / pregnant / emergency priority (front desk and clinic admin). */
  canSetPriority: boolean;
  /** Mark a checked-in patient who left as a no-show (front desk and clinic admin). */
  canMarkNoShow: boolean;
  /** Clinic admin: waiting / with doctor / waits per location above the lanes. */
  showLocationOverview: boolean;
}

export function queueRoleVariant(role: string | null | undefined): QueueRoleVariant {
  switch (String(role ?? "").toUpperCase()) {
    case Role.DOCTOR:
      return "doctor";
    case Role.ASSISTANT_DOCTOR:
      return "assistant";
    case Role.RECEPTIONIST:
      return "reception";
    case Role.CLINIC_ADMIN:
      return "clinicAdmin";
    default:
      return "viewer";
  }
}

export function queueCapabilities(role: string | null | undefined): QueueCapabilities {
  const variant = queueRoleVariant(role);
  const frontDesk = variant === "reception" || variant === "clinicAdmin";
  return {
    variant,
    canRunVisit: variant === "doctor",
    canPrepareForDoctor: variant === "assistant",
    canSetPriority: frontDesk,
    canMarkNoShow: frontDesk,
    showLocationOverview: variant === "clinicAdmin",
  };
}

// ── Checked-in entries only ────────────────────────────────────────────────

const LIVE_STAGES = new Set(["CHECKED_IN", "WITH_DOCTOR"]);
const LIVE_STATUSES = new Set([QUEUE_STATUS.WAITING, QUEUE_STATUS.CONFIRMED, QUEUE_STATUS.IN_PROGRESS, "CHECKED_IN"]);

/**
 * True for an in-clinic patient who has arrived (checked in) and is waiting or with the doctor.
 * The queue API sends `stage` for appointment entries; older entries without it fall back to status.
 */
export function isCheckedInQueueEntry(item: QueueDisplayItem): boolean {
  if (isVideoQueueEntry(item)) return false;
  const stage = String(item.stage ?? "").toUpperCase();
  if (stage) return LIVE_STAGES.has(stage);
  return LIVE_STATUSES.has(String(item.status ?? "").toUpperCase());
}

export function isWithDoctor(item: QueueDisplayItem): boolean {
  const stage = String(item.stage ?? "").toUpperCase();
  return stage ? stage === "WITH_DOCTOR" : String(item.status ?? "").toUpperCase() === QUEUE_STATUS.IN_PROGRESS;
}

/**
 * The token exactly as the server prints it (one series per location per day with the location
 * prefix: "K-001" Kothrud, "B-001" Baner). Older payloads with only a number show "#14"; "" when
 * there is none (video visits have no token).
 */
export function queueTokenLabel(item: Pick<QueueDisplayItem, "token" | "tokenNumber">): string {
  const token = String(item.token ?? "").trim();
  if (token) return token;
  const number = Number(item.tokenNumber);
  return Number.isFinite(number) && number > 0 ? `#${Math.trunc(number)}` : "";
}

/** Minutes since check-in (falls back to the wait estimate the API sends). */
export function waitedMinutes(item: QueueDisplayItem, now: Date = new Date()): number {
  const since = item.checkedInAt || item.confirmedAt;
  const at = since ? new Date(since).getTime() : Number.NaN;
  if (Number.isFinite(at)) return Math.max(0, Math.round((now.getTime() - at) / 60_000));
  return getQueueWaitMinutes(item);
}

// ── Priority ───────────────────────────────────────────────────────────────

export type QueuePriority = "NORMAL" | "SENIOR" | "PREGNANT" | "EMERGENCY";

export const QUEUE_PRIORITY_OPTIONS: ReadonlyArray<{ value: QueuePriority; label: string; hint: string }> = [
  { value: "NORMAL", label: "Normal", hint: "Token order" },
  { value: "SENIOR", label: "Senior citizen", hint: "Age 60 and above" },
  { value: "PREGNANT", label: "Pregnant", hint: "Moves ahead of normal patients" },
  { value: "EMERGENCY", label: "Emergency", hint: "Alerts the doctor at once" },
];

const PRIORITY_TONE: Record<QueuePriority, PillTone> = {
  NORMAL: "slate",
  SENIOR: "blue",
  PREGNANT: "teal",
  EMERGENCY: "rose",
};

/** A priority word the API may send, mapped to the four desk priorities ("" when not one of them). */
function priorityFromText(text: string): QueuePriority | "" {
  if (text === "EMERGENCY" || text === "URGENT") return "EMERGENCY";
  if (text === "SENIOR" || text === "SENIOR_CITIZEN") return "SENIOR";
  if (text === "PREGNANT") return "PREGNANT";
  if (text === "NORMAL" || text === "MEDIUM" || text === "LOW" || text === "ROUTINE") return "NORMAL";
  // HIGH is the column value for both senior and pregnant; without a label, show it as senior.
  if (text === "HIGH") return "SENIOR";
  return "";
}

/** Queue weight (backend scale: EMERGENCY 100, URGENT 80, HIGH 50, NORMAL 0) as a desk priority. */
function priorityFromWeight(weight: number): QueuePriority {
  if (weight >= 80) return "EMERGENCY";
  if (weight >= 50) return "SENIOR";
  return "NORMAL";
}

/**
 * The priority on an entry. The live queue sends `priority` as a weight (100 / 50 / 0) and the desk
 * choice in `priorityLabel` (EMERGENCY / SENIOR / PREGNANT, absent for normal), so the label wins;
 * the weight or an older text value is the fallback.
 */
export function queuePriorityOf(item: Pick<QueueDisplayItem, "priority" | "priorityLabel">): QueuePriority {
  const label = priorityFromText(String(item.priorityLabel ?? "").trim().toUpperCase());
  if (label) return label;
  const raw = String(item.priority ?? "").trim();
  if (!raw) return "NORMAL";
  const weight = Number(raw);
  if (Number.isFinite(weight)) return priorityFromWeight(weight);
  return priorityFromText(raw.toUpperCase()) || "NORMAL";
}

export function queuePriorityLabel(priority: QueuePriority): string {
  return QUEUE_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? "Normal";
}

export function queuePriorityTone(priority: QueuePriority): PillTone {
  return PRIORITY_TONE[priority];
}

/** Emergency needs a reason (it alerts the doctor); the others take an optional note. */
export function priorityReasonRequired(priority: QueuePriority): boolean {
  return priority === "EMERGENCY";
}

// ── Clinic admin: all locations ────────────────────────────────────────────

/** A wait longer than this raises a wait alert on the overview. */
export const WAIT_ALERT_MINUTES = 30;

export interface LocationQueueSummary {
  locationId: string;
  name: string;
  waiting: number;
  withDoctor: number;
  averageWait: number;
  longestWait: number;
  /** Token or name of the patient waiting longest; "" when nobody waits. */
  longestWaitLabel: string;
  /** Patients waiting longer than `WAIT_ALERT_MINUTES`. */
  overLimit: number;
}

export interface QueueOverview {
  locations: LocationQueueSummary[];
  waiting: number;
  withDoctor: number;
  averageWait: number;
  longestWait: number;
  alerts: Array<{ id: string; locationName: string; label: string; minutes: number }>;
}

const UNKNOWN_LOCATION = "__unassigned__";

/**
 * Live numbers per location for the clinic admin, from the checked-in entries of the clinic queue.
 * Every active location gets a card (zeros when nobody is there); entries without a location are
 * grouped under "Other".
 */
export function buildQueueOverview(
  entries: QueueDisplayItem[],
  locations: Array<{ id: string; name?: string | null }>,
  now: Date = new Date(),
): QueueOverview {
  const names = new Map(locations.map((location) => [location.id, location.name || "Location"]));
  const groups = new Map<string, QueueDisplayItem[]>(locations.map((location) => [location.id, []]));
  for (const entry of entries) {
    const key = entry.locationId && names.has(entry.locationId) ? entry.locationId : UNKNOWN_LOCATION;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  if ((groups.get(UNKNOWN_LOCATION) ?? []).length === 0) groups.delete(UNKNOWN_LOCATION);

  const alerts: QueueOverview["alerts"] = [];
  const summaries = [...groups.entries()].map(([locationId, items]): LocationQueueSummary => {
    const name = locationId === UNKNOWN_LOCATION ? "Other" : (names.get(locationId) ?? "Location");
    const waitingItems = items.filter((item) => !isWithDoctor(item));
    const waits = waitingItems.map((item) => ({ item, minutes: waitedMinutes(item, now) }));
    const longest = waits.reduce<{ item: QueueDisplayItem; minutes: number } | null>(
      (best, current) => (!best || current.minutes > best.minutes ? current : best),
      null,
    );
    const over = waits.filter((wait) => wait.minutes > WAIT_ALERT_MINUTES);
    over.forEach((wait) =>
      alerts.push({
        id: wait.item.id,
        locationName: name,
        label: queueTokenLabel(wait.item) || wait.item.patientName || "Patient",
        minutes: wait.minutes,
      }),
    );
    return {
      locationId,
      name,
      waiting: waitingItems.length,
      withDoctor: items.length - waitingItems.length,
      averageWait: waits.length ? Math.round(waits.reduce((sum, wait) => sum + wait.minutes, 0) / waits.length) : 0,
      longestWait: longest?.minutes ?? 0,
      longestWaitLabel: longest ? queueTokenLabel(longest.item) || longest.item.patientName || "" : "",
      overLimit: over.length,
    };
  });

  const waiting = summaries.reduce((sum, location) => sum + location.waiting, 0);
  const weighted = summaries.reduce((sum, location) => sum + location.averageWait * location.waiting, 0);
  return {
    locations: summaries,
    waiting,
    withDoctor: summaries.reduce((sum, location) => sum + location.withDoctor, 0),
    averageWait: waiting ? Math.round(weighted / waiting) : 0,
    longestWait: summaries.reduce((max, location) => Math.max(max, location.longestWait), 0),
    alerts: alerts.sort((left, right) => right.minutes - left.minutes),
  };
}
