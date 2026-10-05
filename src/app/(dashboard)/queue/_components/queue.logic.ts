import { QueueCategory, type CanonicalQueueEntry } from "@/types/queue.types";
import {
  getQueueStatusLabel,
  normalizeQueueEntry,
  resolveQueueDisplayLabel,
} from "@/lib/queue/queue-adapter";
import { statusLabel } from "@/components/tbd";

/**
 * Queue page rules with no React in them: how a raw queue entry is read, which lane it
 * belongs to, and the small pieces of text shown for it. The data container
 * (`useQueuePageData`) and the views share these.
 */

// Queue status constants - must match backend enum values
export const QUEUE_STATUS = {
  WAITING: "WAITING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export const TERMINAL_QUEUE_STATUSES = new Set(["COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED"]);

export const CONSULTATION_QUEUE_FILTERS = [
  { value: "GENERAL_CONSULTATION", label: "General Consultation" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "SPECIAL_CASE", label: "Special Case" },
  { value: "DIAGNOSTIC", label: "Diagnostic" },
  { value: "SENIOR_CITIZEN", label: "Senior Citizen" },
] as const;

/** Rows shown per page in a lane table. */
export const QUEUE_PAGE_SIZE = 5;

export type QueueTabKey = "consultations" | "therapies";

export type QueueDisplayItem = CanonicalQueueEntry & {
  id: string;
  type?: string;
  queueType?: string;
  queueLane?: string;
  displayLabel?: string;
  appointmentTime?: string;
  checkedInAt?: string;
  confirmedAt?: string;
  updatedAt?: string;
  estimatedWait?: string | number;
  estimatedDuration?: string | number;
  tokenNumber?: string | number;
  serviceType?: string;
  waitTime?: string | number;
};

export type QueueSection = {
  key: string;
  title: string;
  items: QueueDisplayItem[];
};

export type QueueStatsSummary = {
  totalInQueue: number;
  averageWaitTime: number;
  inProgress: number;
  completedToday: number;
};

export type AssignableDoctor = {
  id: string;
  name: string;
  role: string;
};

/** The one emerald button a doctor gets on their own row. */
export type QueuePrimaryAction = "start" | "case-sheet";

type RawQueueItem = Record<string, unknown>;

function asRecord(value: unknown): RawQueueItem {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawQueueItem) : {};
}

function rawText(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function rawTextOrNumber(value: unknown): string | number | undefined {
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

export function normalizeQueueToken(value?: string | null): string {
  const token = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (token === "THERAPY" || token === "SURGERY" || token === "THERAPY_PROCEDURE") {
    return "PROCEDURAL_CARE";
  }
  if (token === "LAB_TEST" || token === "IMAGING" || token === "VACCINATION") {
    return "DIAGNOSTIC_PREVENTIVE";
  }
  if (token === "GERIATRIC_CARE" || token === "SENIOR_CITIZEN_CARE") {
    return "SENIOR_CITIZEN";
  }
  if (
    token === "DOSHA_ANALYSIS" ||
    token === "VIRECHANA" ||
    token === "ABHYANGA" ||
    token === "SWEDANA" ||
    token === "BASTI" ||
    token === "NASYA" ||
    token === "RAKTAMOKSHANA"
  ) {
    return "AYURVEDIC_PROCEDURES";
  }
  return token;
}

export const CONSULTATION_QUEUE_FILTER_KEYS = new Set(
  CONSULTATION_QUEUE_FILTERS.map((filter) => normalizeQueueToken(filter.value)),
);

export function normalizeQueueDisplayItem(rawItem: unknown): QueueDisplayItem {
  const raw = asRecord(rawItem);
  const entry = normalizeQueueEntry(raw);

  return {
    ...entry,
    id: entry.entryId || rawText(raw.id) || "",
    type: rawText(raw.type),
    queueType: rawText(raw.queueType),
    queueLane: rawText(raw.queueLane),
    appointmentTime: rawText(raw.appointmentTime) || rawText(raw.time) || rawText(raw.startedAt) || "",
    checkedInAt: rawText(raw.checkedInAt),
    confirmedAt: rawText(raw.confirmedAt),
    updatedAt: rawText(raw.updatedAt),
    estimatedWait: rawTextOrNumber(raw.estimatedWait),
    estimatedDuration: typeof raw.estimatedDuration === "number" ? raw.estimatedDuration : undefined,
    tokenNumber: rawText(raw.tokenNumber),
    serviceType: rawText(raw.serviceType),
    waitTime: rawTextOrNumber(raw.waitTime),
  };
}

/** The queue list comes back as an array or wrapped in `data` / `queue` / `items`. */
export function extractRawQueueItems(queueData: unknown): unknown[] {
  if (Array.isArray(queueData)) {
    return queueData;
  }

  if (queueData && typeof queueData === "object") {
    const record = queueData as RawQueueItem;
    if (Array.isArray(record.data)) return record.data;
    if (Array.isArray(record.queue)) return record.queue;
    if (Array.isArray(record.items)) return record.items;

    for (const key of Object.keys(record)) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
}

export function extractQueueDisplayItems(queueData: unknown): QueueDisplayItem[] {
  return extractRawQueueItems(queueData).map((item) => normalizeQueueDisplayItem(item));
}

function hasQueueTaxonomy(
  entry: Pick<
    QueueDisplayItem,
    "queueCategory" | "queueType" | "queueLane" | "serviceBucket" | "treatmentType" | "displayLabel" | "serviceType"
  >,
): boolean {
  return Boolean(
    entry.queueCategory ||
      entry.queueType ||
      entry.queueLane ||
      entry.serviceBucket ||
      entry.treatmentType ||
      entry.displayLabel ||
      entry.serviceType,
  );
}

function isAnalyticsQueueEntry(entry: QueueDisplayItem): boolean {
  const tokens = [
    entry.queueCategory,
    entry.queueType,
    entry.queueLane,
    entry.serviceBucket,
    entry.treatmentType,
    entry.displayLabel,
    entry.serviceType,
    resolveQueueDisplayLabel(entry),
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));

  return tokens.some((token) => token.includes("ANALYTICS"));
}

/** Text in the Category column. */
export function getQueueDisplayLabel(entry: QueueDisplayItem): string {
  return hasQueueTaxonomy(entry) ? resolveQueueDisplayLabel(entry) : "Uncategorized";
}

/** Tokens a treatment-type filter is matched against. */
export function getTreatmentFilterTokens(item: QueueDisplayItem): string[] {
  return [
    item.treatmentType,
    item.queueCategory,
    item.queueType,
    item.queueLane,
    item.serviceBucket,
    item.displayLabel,
    item.serviceType,
  ]
    .filter(Boolean)
    .map((token) => normalizeQueueToken(token));
}

export function matchesQueueSection(item: QueueDisplayItem, section: string): boolean {
  const normalizedSection = normalizeQueueToken(section);
  const tokens = [
    item.queueCategory,
    item.queueType,
    item.queueLane,
    item.serviceBucket,
    item.treatmentType,
    item.displayLabel,
    item.serviceType,
    getQueueDisplayLabel(item),
  ].map(normalizeQueueToken);

  const taxonomyPresent = hasQueueTaxonomy(item);

  if (normalizedSection === "CONSULTATION" || normalizedSection === "CONSULTATIONS") {
    return tokens.some(
      (token) => token.includes("CONSULTATION") || token === normalizeQueueToken(QueueCategory.DOCTOR_CONSULTATION),
    );
  }

  if (normalizedSection === "UNCATEGORIZED" || normalizedSection === "UNCLASSIFIED") {
    return !taxonomyPresent || isAnalyticsQueueEntry(item);
  }

  if (normalizedSection === "THERAPY" || normalizedSection === "THERAPIES") {
    return tokens.some(
      (token) =>
        token.includes("PROCEDURAL_CARE") ||
        token.includes("THERAPY") ||
        token.includes("SURGERY") ||
        token.includes("AGNIKARMA") ||
        token.includes("PANCHAKARMA") ||
        token.includes("SHIRODHARA") ||
        token.includes("VIDDHAKARMA") ||
        token.includes("NASYA") ||
        token.includes("BASTI") ||
        token.includes("AYURVEDIC_PROCEDURES") ||
        token === normalizeQueueToken(QueueCategory.THERAPY_PROCEDURE),
    );
  }

  // Fallback match: if section name is contained in any of the tokens
  return tokens.some(
    (token) =>
      token === normalizedSection ||
      token.includes(normalizedSection) ||
      (normalizedSection.includes(token) && token.length > 3),
  );
}

/** Refetches the queue until `isSynced` is true, or the attempts run out. */
export async function pollQueueSync(
  refetchQueue: () => Promise<unknown>,
  maxAttempts: number,
  delayMs: number,
  isSynced: (entries: QueueDisplayItem[]) => boolean,
): Promise<boolean> {
  const response = await refetchQueue();
  const currentEntries = extractQueueDisplayItems((response as { data?: unknown } | null | undefined)?.data);

  if (isSynced(currentEntries)) {
    return true;
  }

  if (maxAttempts <= 1) {
    return false;
  }

  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return pollQueueSync(refetchQueue, maxAttempts - 1, delayMs, isSynced);
}

/** True when nobody is assigned to the entry yet. */
export function isUnassignedQueueItem(item: QueueDisplayItem): boolean {
  const doctorToken = String(item.doctorName || "").trim().toLowerCase();
  const hasDoctorId = Boolean(item.assignedDoctorId || item.primaryDoctorId);
  return !hasDoctorId || !doctorToken || doctorToken === "unassigned";
}

/**
 * The adapter falls back to the queue entry id when an entry has no appointment id. Starting a
 * visit needs the real appointment, so this checks the raw entry before trusting the id.
 */
export function hasReliableAppointmentReference(item: QueueDisplayItem, rawItem: unknown): boolean {
  const raw = asRecord(rawItem);
  const rawAppointmentId =
    rawText(raw.appointmentId) || rawText(asRecord(raw.appointment).id) || rawText(asRecord(raw.metadata).appointmentId) || "";

  if (rawAppointmentId) return true;
  if (!item.appointmentId) return false;
  return item.appointmentId !== item.id;
}

/** The queue is for in-clinic patients; a video entry never gets a Start button here. */
export function isVideoQueueEntry(item: QueueDisplayItem): boolean {
  return [item.queueCategory, item.queueType, item.queueLane, item.serviceType, item.type]
    .map((token) => normalizeQueueToken(token))
    .some((token) => token.includes("VIDEO"));
}

/** Status tag text. Keeps the queue wording (WAITING reads "Queued"); other codes are made readable. */
export function getQueueStatusText(item: QueueDisplayItem): string {
  const label = getQueueStatusLabel(item);
  return label && label !== item.status ? label : statusLabel(item.status);
}

/** "8 min" for a wait value from the API, or null when there is nothing to show. */
export function getQueueWaitText(item: QueueDisplayItem): string | null {
  if (String(item.status || "").toUpperCase() === QUEUE_STATUS.IN_PROGRESS) {
    return null;
  }

  const waitValue = item.estimatedWaitTime || item.waitTime;
  if (!waitValue) return null;

  const text = String(waitValue).trim();
  return /^\d+(\.\d+)?$/.test(text) ? `${text} min` : text;
}

export function getQueueWaitMinutes(item: QueueDisplayItem): number {
  const rawWait = item.estimatedWaitTime ?? item.waitTime ?? 0;
  return typeof rawWait === "number" ? rawWait : parseInt(String(rawWait), 10) || 0;
}

// ─── Page state ───────────────────────────────────────────────────────────────

export type QueuePageState = {
  activeTreatmentFilter: string;
  activeConsultationLane: string;
  activeTherapyLane: string;
  isCleaningUp: boolean;
  transferringQueueItem: QueueDisplayItem | null;
  transferringId: string | null;
  assigningQueueItem: QueueDisplayItem | null;
  selectedDoctorId: string;
  assignDoctorError: string;
  startingId: string | null;
};

export type QueuePageAction =
  | { type: "setActiveTreatmentFilter"; value: string }
  | { type: "setActiveConsultationLane"; value: string }
  | { type: "setActiveTherapyLane"; value: string }
  | { type: "setIsCleaningUp"; value: boolean }
  | { type: "setTransferringQueueItem"; value: QueueDisplayItem | null }
  | { type: "setTransferringId"; value: string | null }
  | { type: "setAssigningQueueItem"; value: QueueDisplayItem | null }
  | { type: "setSelectedDoctorId"; value: string }
  | { type: "setAssignDoctorError"; value: string }
  | { type: "setStartingId"; value: string | null };

export const initialQueuePageState: QueuePageState = {
  activeTreatmentFilter: "ALL",
  activeConsultationLane: "GENERAL_CONSULTATION",
  activeTherapyLane: "PROCEDURAL_CARE",
  isCleaningUp: false,
  transferringQueueItem: null,
  transferringId: null,
  assigningQueueItem: null,
  selectedDoctorId: "",
  assignDoctorError: "",
  startingId: null,
};

export function queuePageReducer(state: QueuePageState, action: QueuePageAction): QueuePageState {
  switch (action.type) {
    case "setActiveTreatmentFilter":
      return { ...state, activeTreatmentFilter: action.value };
    case "setActiveConsultationLane":
      return { ...state, activeConsultationLane: action.value };
    case "setActiveTherapyLane":
      return { ...state, activeTherapyLane: action.value };
    case "setIsCleaningUp":
      return { ...state, isCleaningUp: action.value };
    case "setTransferringQueueItem":
      return { ...state, transferringQueueItem: action.value };
    case "setTransferringId":
      return { ...state, transferringId: action.value };
    case "setAssigningQueueItem":
      return { ...state, assigningQueueItem: action.value };
    case "setSelectedDoctorId":
      return { ...state, selectedDoctorId: action.value };
    case "setAssignDoctorError":
      return { ...state, assignDoctorError: action.value };
    case "setStartingId":
      return { ...state, startingId: action.value };
    default:
      return state;
  }
}
