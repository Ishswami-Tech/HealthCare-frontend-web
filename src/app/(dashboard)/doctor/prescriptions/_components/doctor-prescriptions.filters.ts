import type {
  PrescriptionListParams,
  PrescriptionPharmacyStageParam,
  PrescriptionSortParam,
  PrescriptionStatusParam,
  PrescriptionSummary,
  PrescriptionSummaryRange,
} from "@/hooks/query/usePrescriptions";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { isDraftPrescription, type DoctorPrescriptionRow } from "./doctor-prescriptions.logic";

/**
 * Filters of the doctor's prescriptions list: what the URL holds, how it maps onto the
 * GET /pharmacy/prescriptions query, and the client-side fallback used while the backend still
 * answers the whole list as one array. Pure functions, no React.
 */

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "all" | "custom";
export type StatusFilter = "all" | "active" | "completed" | "cancelled" | "draft";
export type StageFilter = "all" | "payment-pending" | "ready" | "dispensed" | "not-sent";
export type SortFilter = PrescriptionSortParam;

export const PAGE_SIZE_CHOICES = [25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
export const SEARCH_DEBOUNCE_MS = 300;

export interface DoctorRxFilters {
  q: string;
  date: DatePreset;
  /** Custom range (IST day keys); only read when `date` is "custom". */
  from: string;
  to: string;
  status: StatusFilter;
  stage: StageFilter;
  sort: SortFilter;
  page: number;
  size: number;
}

export const DEFAULT_FILTERS: DoctorRxFilters = {
  q: "",
  date: "today",
  from: "",
  to: "",
  status: "all",
  stage: "all",
  sort: "newest",
  page: 1,
  size: DEFAULT_PAGE_SIZE,
};

export const DATE_PRESET_OPTIONS: ReadonlyArray<{ value: DatePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

export const STAGE_OPTIONS: ReadonlyArray<{ value: StageFilter; label: string }> = [
  { value: "all", label: "All stages" },
  { value: "payment-pending", label: "Payment pending" },
  { value: "ready", label: "Ready to dispense" },
  { value: "dispensed", label: "Dispensed" },
  { value: "not-sent", label: "Not sent" },
];

export const SORT_OPTIONS: ReadonlyArray<{ value: SortFilter; label: string }> = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "patient", label: "Patient A–Z" },
];

const STATUS_PARAM: Record<Exclude<StatusFilter, "all">, PrescriptionStatusParam> = {
  active: "ACTIVE",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  draft: "DRAFT",
};

const STAGE_PARAM: Record<Exclude<StageFilter, "all">, PrescriptionPharmacyStageParam> = {
  "payment-pending": "PAYMENT_PENDING",
  ready: "READY_TO_DISPENSE",
  dispensed: "DISPENSED",
  "not-sent": "NOT_SENT",
};

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

function dayKey(value: string | null): string {
  return value && DAY_KEY.test(value) ? value : "";
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** URL query -> filters; anything unknown falls back to its default. */
export function parseFilters(search: Pick<URLSearchParams, "get">): DoctorRxFilters {
  const size = positiveInt(search.get("size"), DEFAULT_PAGE_SIZE);
  return {
    q: (search.get("q") ?? "").slice(0, 120),
    date: oneOf(search.get("date"), DATE_PRESET_OPTIONS.map((option) => option.value), DEFAULT_FILTERS.date),
    from: dayKey(search.get("from")),
    to: dayKey(search.get("to")),
    status: oneOf(search.get("status"), ["all", "active", "completed", "cancelled", "draft"], "all"),
    stage: oneOf(search.get("stage"), STAGE_OPTIONS.map((option) => option.value), "all"),
    sort: oneOf(search.get("sort"), SORT_OPTIONS.map((option) => option.value), "newest"),
    page: positiveInt(search.get("page"), 1),
    size: (PAGE_SIZE_CHOICES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
  };
}

/** Filters -> URL query; defaults are left out so a fresh visit has a clean address. */
export function serializeFilters(filters: DoctorRxFilters): string {
  const entries: Array<[string, string]> = [];
  if (filters.q.trim()) entries.push(["q", filters.q.trim()]);
  if (filters.date !== DEFAULT_FILTERS.date) entries.push(["date", filters.date]);
  if (filters.date === "custom" && filters.from) entries.push(["from", filters.from]);
  if (filters.date === "custom" && filters.to) entries.push(["to", filters.to]);
  if (filters.status !== "all") entries.push(["status", filters.status]);
  if (filters.stage !== "all") entries.push(["stage", filters.stage]);
  if (filters.sort !== "newest") entries.push(["sort", filters.sort]);
  if (filters.page > 1) entries.push(["page", String(filters.page)]);
  if (filters.size !== DEFAULT_PAGE_SIZE) entries.push(["size", String(filters.size)]);
  return new URLSearchParams(entries).toString();
}

/** True when anything but the page differs from the defaults. */
export function hasNonDefaultFilters(filters: DoctorRxFilters): boolean {
  return (
    filters.q.trim() !== "" ||
    filters.date !== DEFAULT_FILTERS.date ||
    filters.status !== "all" ||
    filters.stage !== "all" ||
    filters.sort !== "newest"
  );
}

/** `YYYY-MM-DD` shifted by whole days (calendar arithmetic, no time zone involved). */
export function shiftDayKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** IST day range of the chosen preset; both ends empty for "All" (or before hydration). */
export function resolveDateRange(filters: Pick<DoctorRxFilters, "date" | "from" | "to">, todayKey: string): PrescriptionSummaryRange {
  if (!todayKey) return {};
  switch (filters.date) {
    case "today":
      return { dateFrom: todayKey, dateTo: todayKey };
    case "yesterday": {
      const yesterday = shiftDayKey(todayKey, -1);
      return { dateFrom: yesterday, dateTo: yesterday };
    }
    case "7d":
      return { dateFrom: shiftDayKey(todayKey, -6), dateTo: todayKey };
    case "30d":
      return { dateFrom: shiftDayKey(todayKey, -29), dateTo: todayKey };
    case "custom": {
      // A range typed backwards is read the right way round.
      const [from, to] = filters.from && filters.to && filters.from > filters.to ? [filters.to, filters.from] : [filters.from, filters.to];
      return { ...(from ? { dateFrom: from } : {}), ...(to ? { dateTo: to } : {}) };
    }
    default:
      return {};
  }
}

/** Filters -> query of GET /pharmacy/prescriptions (only set keys). */
export function toListParams(filters: DoctorRxFilters, todayKey: string): PrescriptionListParams {
  const range = resolveDateRange(filters, todayKey);
  const q = filters.q.trim();
  return {
    page: filters.page,
    limit: filters.size,
    ...(q ? { q } : {}),
    ...(filters.status !== "all" ? { status: STATUS_PARAM[filters.status] } : {}),
    ...(filters.stage !== "all" ? { pharmacyStage: STAGE_PARAM[filters.stage] } : {}),
    ...range,
    ...(filters.sort !== "newest" ? { sort: filters.sort } : {}),
  };
}

// ── Client-side fallback (backend without paging) ──────────────────────────

function matchesStatus(row: DoctorPrescriptionRow, status: PrescriptionStatusParam | undefined): boolean {
  if (!status) return !isDraftPrescription(row);
  if (status === "DRAFT" || status === "RETURNED") return isDraftPrescription(row);
  if (isDraftPrescription(row)) return false;
  return row.status === status.toLowerCase();
}

function matchesStage(row: DoctorPrescriptionRow, stage: PrescriptionPharmacyStageParam | undefined): boolean {
  if (!stage) return true;
  const rowStage = row.pharmacy?.stage;
  if (stage === "NOT_SENT") return !rowStage;
  // A part-dispensed prescription still has medicine waiting at the desk.
  if (stage === "READY_TO_DISPENSE") return rowStage === "READY_TO_DISPENSE" || rowStage === "PARTIAL";
  return rowStage === stage;
}

function matchesQuery(row: DoctorPrescriptionRow, needle: string): boolean {
  if (!needle) return true;
  return [row.patientName, row.patientUhid, row.patientPhone, row.reference, row.diagnosis, ...row.medicines].some(
    (value) => value.toLowerCase().includes(needle),
  );
}

function inRange(row: DoctorPrescriptionRow, from: string | undefined, to: string | undefined): boolean {
  if (!from && !to) return true;
  const key = row.date ? formatDateKeyInIST(row.date) : "";
  if (!key) return false;
  return (!from || key >= from) && (!to || key <= to);
}

function compareRows(sort: PrescriptionSortParam | undefined) {
  return (left: DoctorPrescriptionRow, right: DoctorPrescriptionRow): number => {
    if (sort === "patient") return left.patientName.localeCompare(right.patientName, "en", { sensitivity: "base" });
    const diff = (Date.parse(left.date) || 0) - (Date.parse(right.date) || 0);
    return sort === "oldest" ? diff : -diff;
  };
}

/** What the server would answer for `params`, worked out on the whole list. */
export function applyClientQuery(
  rows: DoctorPrescriptionRow[],
  params: PrescriptionListParams,
): { rows: DoctorPrescriptionRow[]; total: number } {
  const needle = (params.q ?? "").trim().toLowerCase();
  const matching = rows
    .filter(
      (row) =>
        matchesStatus(row, params.status) &&
        matchesStage(row, params.pharmacyStage) &&
        matchesQuery(row, needle) &&
        inRange(row, params.dateFrom, params.dateTo) &&
        (!params.patientId || row.patientId === params.patientId),
    )
    .sort(compareRows(params.sort));
  const start = (params.page - 1) * params.limit;
  return { rows: matching.slice(start, start + params.limit), total: matching.length };
}

/** Summary counts worked out on the whole list (same meaning as GET /pharmacy/prescriptions/summary). */
export function summarizeRows(
  rows: DoctorPrescriptionRow[],
  range: PrescriptionSummaryRange,
  todayKey: string,
): PrescriptionSummary {
  const inPeriod = rows.filter((row) => inRange(row, range.dateFrom, range.dateTo));
  const written = inPeriod.filter((row) => !isDraftPrescription(row));
  return {
    total: written.length,
    active: written.filter((row) => row.status === "active").length,
    completed: written.filter((row) => row.status === "completed").length,
    cancelled: written.filter((row) => row.status === "cancelled").length,
    drafts: inPeriod.length - written.length,
    today: todayKey ? rows.filter((row) => !isDraftPrescription(row) && inRange(row, todayKey, todayKey)).length : 0,
    uniquePatients: new Set(written.map((row) => row.patientId || row.patientName)).size,
  };
}

/** Page numbers with gaps: [1, "gap", 4, 5, 6, "gap", 20]. */
export function pageWindow(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((value) => pages.add(value));
  if (page >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((value) => pages.add(value));
  const sorted = [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1];
    return previous !== undefined && value - previous > 1 ? (["gap", value] as const) : [value];
  });
}
