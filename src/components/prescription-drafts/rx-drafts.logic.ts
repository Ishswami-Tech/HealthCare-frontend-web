import type { PillTone } from "@/components/tbd";
import type { RxDraft, RxDraftItem, RxDraftLine, UpdateRxDraftInput } from "@/types/rx-drafts.types";

/**
 * Prescription-draft rules with no React in them, shared by the assistant screens (AsDrafts,
 * AsRxDraftPreview, AsDraftReturned) and the doctor's review (DocDraftReview).
 */

export type DraftFilter = "ALL" | "DRAFT" | "RETURNED";

const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  DRAFT: { label: "Awaiting doctor", tone: "amber" },
  RETURNED: { label: "Changes requested", tone: "rose" },
  PENDING: { label: "Approved", tone: "green" },
  DISCARDED: { label: "Discarded", tone: "slate" },
};

export function draftStatusMeta(status: string | null | undefined): { label: string; tone: PillTone } {
  const key = String(status ?? "").toUpperCase();
  return STATUS_META[key] ?? { label: key ? key.charAt(0) + key.slice(1).toLowerCase() : "Draft", tone: "slate" };
}

export const isAwaitingDoctor = (draft: Pick<RxDraft, "status">) => String(draft.status).toUpperCase() === "DRAFT";
export const isReturned = (draft: Pick<RxDraft, "status">) => String(draft.status).toUpperCase() === "RETURNED";

export function countDrafts(drafts: readonly Pick<RxDraft, "status">[]): { all: number; awaiting: number; returned: number } {
  return {
    all: drafts.length,
    awaiting: drafts.filter(isAwaitingDoctor).length,
    returned: drafts.filter(isReturned).length,
  };
}

export function filterDrafts<T extends Pick<RxDraft, "status">>(drafts: readonly T[], filter: DraftFilter): T[] {
  if (filter === "ALL") return [...drafts];
  return drafts.filter((draft) => String(draft.status).toUpperCase() === filter);
}

/** "Metformin SR, Glimepiride, Atorvastatin" (first `max` names, then "+2 more"). */
export function draftMedicineSummary(items: readonly Pick<RxDraftItem, "medicineName">[], max = 4): string {
  const names = items.map((item) => (item.medicineName ?? "").trim()).filter(Boolean);
  if (names.length === 0) return "No medicines";
  const shown = names.slice(0, max).join(", ");
  return names.length > max ? `${shown} +${names.length - max} more` : shown;
}

/** One printable line: "1 tablet · 1-0-1 · 5 days · After food". */
export function draftLineText(item: Pick<RxDraftItem, "dosage" | "frequency" | "duration" | "instructions">): string {
  return [item.dosage, item.frequency, item.duration, item.instructions]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

let lineCounter = 0;
const nextKey = () => `line-${Date.now().toString(36)}-${(lineCounter += 1)}`;

export function toDraftLine(item: Partial<RxDraftItem> & { medicineId?: string | null; medicineName?: string | null }): RxDraftLine {
  return {
    key: item.id || nextKey(),
    medicineId: item.medicineId ?? "",
    medicineName: item.medicineName ?? "",
    dosage: item.dosage ?? "",
    frequency: item.frequency ?? "",
    duration: item.duration ?? "",
    quantity: item.quantity === null || item.quantity === undefined ? "" : String(item.quantity),
    instructions: item.instructions ?? "",
  };
}

export const toDraftLines = (items: readonly RxDraftItem[]): RxDraftLine[] => items.map(toDraftLine);

/** A new line for a medicine picked from clinic stock. */
export const newDraftLine = (medicineId: string, medicineName: string): RxDraftLine =>
  toDraftLine({ medicineId, medicineName, quantity: 1 });

/** Why the lines cannot be saved, or null. Every line needs a stock medicine and a whole quantity of 1 or more. */
export function validateDraftLines(lines: readonly RxDraftLine[]): string | null {
  if (lines.length === 0) return "Add at least one medicine.";
  for (const line of lines) {
    const name = line.medicineName || "A medicine";
    if (!line.medicineId) return `${name} is not from clinic stock. Remove it and add it from stock.`;
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return `${name}: enter a quantity of 1 or more.`;
  }
  return null;
}

const optional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

/** Body of the draft update (`PATCH /pharmacy/prescriptions/:id`). Call `validateDraftLines` first. */
export function toUpdateDraftInput(
  lines: readonly RxDraftLine[],
  text: { diagnosis?: string; notes?: string } = {},
): UpdateRxDraftInput {
  const diagnosis = optional(text.diagnosis ?? "");
  const notes = optional(text.notes ?? "");
  return {
    items: lines.map((line) => {
      const dosage = optional(line.dosage);
      const frequency = optional(line.frequency);
      const duration = optional(line.duration);
      const instructions = optional(line.instructions);
      return {
        medicineId: line.medicineId,
        quantity: Number(line.quantity),
        ...(dosage ? { dosage } : {}),
        ...(frequency ? { frequency } : {}),
        ...(duration ? { duration } : {}),
        ...(instructions ? { instructions } : {}),
      };
    }),
    ...(diagnosis ? { diagnosis } : {}),
    ...(notes ? { notes } : {}),
  };
}

/** The items the doctor saw when returning the draft (`returnedSnapshot.items`), or [] when there is no snapshot. */
export function snapshotItems(snapshot: unknown): RxDraftItem[] {
  const record = snapshot && typeof snapshot === "object" ? (snapshot as Record<string, unknown>) : {};
  const items = Array.isArray(record.items) ? record.items : [];
  return items.map((raw, index) => {
    const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const str = (key: string) => (typeof item[key] === "string" ? (item[key] as string) : null);
    return {
      id: `snapshot-${index}`,
      medicineId: str("medicineId"),
      medicineName: str("medicineName"),
      dosage: str("dosage"),
      frequency: str("frequency"),
      duration: str("duration"),
      quantity: typeof item.quantity === "number" ? item.quantity : null,
      instructions: str("instructions"),
    };
  });
}

export type LineChange = "UNCHANGED" | "EDITED" | "ADDED";

const COMPARED_FIELDS = ["dosage", "frequency", "duration", "quantity", "instructions"] as const;
type ComparedField = (typeof COMPARED_FIELDS)[number];

const FIELD_LABELS: Record<ComparedField, string> = {
  dosage: "dose",
  frequency: "frequency",
  duration: "duration",
  quantity: "quantity",
  instructions: "timing",
};

/**
 * How each line differs from what was there before (matched by medicine), plus the medicines
 * that were taken out. Used for "2 changes made" and the per-line tags.
 */
export function diffDraftLines(
  before: readonly RxDraftItem[],
  after: readonly RxDraftLine[],
): { lines: Array<{ key: string; change: LineChange; fields: string[] }>; removed: string[]; changeCount: number } {
  const byMedicine = new Map(before.filter((item) => item.medicineId).map((item) => [item.medicineId as string, toDraftLine(item)]));
  const lines = after.map((line) => {
    const previous = byMedicine.get(line.medicineId);
    if (!previous) return { key: line.key, change: "ADDED" as const, fields: [] };
    byMedicine.delete(line.medicineId);
    const fields = COMPARED_FIELDS.filter((field) => previous[field].trim() !== line[field].trim()).map(
      (field) => FIELD_LABELS[field],
    );
    return { key: line.key, change: fields.length > 0 ? ("EDITED" as const) : ("UNCHANGED" as const), fields };
  });
  const removed = [...byMedicine.values()].map((line) => line.medicineName || "Medicine");
  const changeCount = lines.filter((line) => line.change !== "UNCHANGED").length + removed.length;
  return { lines, removed, changeCount };
}

/** "11:58 am" (today) or "20 Oct, 11:58 am", in clinic time. Empty for a missing date. */
export function draftTimeLabel(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const zone = "Asia/Kolkata";
  const day = (value: Date) => value.toLocaleDateString("en-CA", { timeZone: zone });
  const time = date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: zone });
  if (day(date) === day(now)) return time;
  const dateText = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: zone });
  return `${dateText}, ${time}`;
}
