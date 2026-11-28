/**
 * Prescription shortcuts kept per account on the server (`/doctor-favourites`): favourite
 * medicines with their usual dose, kits (several medicines added at once, with an optional voice
 * phrase), and the medicines the doctor prescribed most recently. Pure mapping only.
 */
import { asList, asRecordOrEmpty, textOf, trimmedString } from "@/lib/utils/coerce";
import type { MedicationPreset } from "./rx-form.logic";

export type FavouriteKind = "MEDICINE" | "RX_TEMPLATE" | "DIAGNOSIS" | "INVESTIGATION" | "PATIENT" | "OTHER";

export interface DoctorFavourite {
  id: string;
  kind: FavouriteKind;
  itemKey: string;
  label: string;
  payload: Record<string, unknown>;
  sortOrder: number;
}

export interface FavouriteInput {
  kind: FavouriteKind;
  itemKey: string;
  label: string;
  payload?: Record<string, unknown>;
  sortOrder?: number;
}

export function toFavourites(data: unknown): DoctorFavourite[] {
  const rows = Array.isArray(data) ? data : asList(asRecordOrEmpty(data).data);
  return rows
    .map((entry) => {
      const row = asRecordOrEmpty(entry);
      const sortOrder = Number(row.sortOrder);
      return {
        id: trimmedString(row.id),
        kind: (textOf(row.kind).toUpperCase() || "OTHER") as FavouriteKind,
        itemKey: textOf(row.itemKey),
        label: textOf(row.label),
        payload: asRecordOrEmpty(row.payload),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      };
    })
    .filter((row) => row.id && row.itemKey)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

/** The usual dose saved with a favourite medicine. */
export function presetOf(favourite: Pick<DoctorFavourite, "payload">): MedicationPreset {
  const payload = favourite.payload;
  const preset: MedicationPreset = {};
  const dosage = textOf(payload.dosage);
  const frequency = textOf(payload.frequency);
  const days = textOf(payload.days);
  if (dosage) preset.dosage = dosage;
  if (frequency) preset.frequency = frequency;
  if (days) preset.days = days;
  return preset;
}

export interface RxKitItem extends MedicationPreset {
  medicineId: string;
  name: string;
}

export interface RxKit {
  /** Favourite row id (for delete); empty for a kit that is not saved yet. */
  id: string;
  itemKey: string;
  name: string;
  voicePhrase: string;
  items: RxKitItem[];
}

export function kitFromFavourite(favourite: DoctorFavourite): RxKit {
  const items = asList(favourite.payload.items).flatMap((entry): RxKitItem[] => {
    const item = asRecordOrEmpty(entry);
    const medicineId = trimmedString(item.medicineId);
    if (!medicineId) return [];
    return [
      {
        medicineId,
        name: textOf(item.name) || "Medicine",
        ...presetOf({ payload: item }),
      },
    ];
  });
  return {
    id: favourite.id,
    itemKey: favourite.itemKey,
    name: favourite.label,
    voicePhrase: textOf(favourite.payload.voicePhrase),
    items,
  };
}

export function kitToFavourite(kit: RxKit, sortOrder?: number): FavouriteInput {
  const itemKey = kit.itemKey || `kit-${slug(kit.name)}-${Date.now().toString(36)}`;
  return {
    kind: "RX_TEMPLATE",
    itemKey: itemKey.slice(0, 120),
    label: kit.name.trim().slice(0, 200),
    payload: {
      voicePhrase: kit.voicePhrase.trim(),
      items: kit.items.map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        ...(item.dosage ? { dosage: item.dosage } : {}),
        ...(item.frequency ? { frequency: item.frequency } : {}),
        ...(item.days ? { days: item.days } : {}),
      })),
    },
    ...(sortOrder !== undefined ? { sortOrder } : {}),
  };
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "kit";
}

/** The kit whose voice phrase (or name) the doctor said, if any. */
export function kitForPhrase(transcript: string, kits: readonly RxKit[]): RxKit | null {
  const heard = transcript.toLowerCase();
  return (
    kits.find((kit) => {
      const phrase = (kit.voicePhrase || kit.name).trim().toLowerCase();
      return phrase.length >= 3 && heard.includes(phrase);
    }) ?? null
  );
}

/** Medicine ids of the doctor's own prescriptions, newest first, each once. */
export function recentMedicineIds(prescriptions: unknown, limit = 30): string[] {
  const rows = (Array.isArray(prescriptions) ? prescriptions : asList(asRecordOrEmpty(prescriptions).prescriptions)).map(asRecordOrEmpty);
  const sorted = [...rows].sort(
    (a, b) => new Date(textOf(b.createdAt) || textOf(b.date)).getTime() - new Date(textOf(a.createdAt) || textOf(a.date)).getTime(),
  );
  const ids: string[] = [];
  for (const row of sorted) {
    for (const entry of [...asList(row.items), ...asList(row.medications)]) {
      const item = asRecordOrEmpty(entry);
      const id = trimmedString(item.medicineId) || trimmedString(asRecordOrEmpty(item.medicine).id);
      if (id && !ids.includes(id)) ids.push(id);
      if (ids.length >= limit) return ids;
    }
  }
  return ids;
}

/** Where the favourite medicines were kept before they moved to the server (read once, then cleared). */
export const LEGACY_FAVOURITES_KEY = "rx-favourite-medicines";
export const LEGACY_RECENT_KEY = "rx-recent-medicines";

export function readLegacyIds(raw: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  } catch {
    return [];
  }
}
