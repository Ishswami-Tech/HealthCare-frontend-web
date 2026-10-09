/**
 * Reads the answer of GET /analytics/earnings/split. Every field is optional on the way in so a
 * missing array or number never breaks the page; money fields fall back to 0.
 */

export interface SplitAmounts {
  consultations: number;
  grossAmount: number;
  doctorShareAmount: number;
  convenienceFeeAmount: number;
}

export interface SplitDay extends SplitAmounts {
  date: string;
}

export interface SplitDoctor extends SplitAmounts {
  doctorId: string;
  doctorName: string;
  daily: SplitDay[];
}

export interface PaidNotCompleted {
  paymentId: string;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  appointmentStatus: string;
  amount: number;
}

export interface DoctorFeeSetting {
  userId: string;
  doctorName: string;
  /** Null when no fixed fee is set. */
  videoDoctorFee: number | null;
  inPersonDoctorFee: number | null;
}

export interface EarningsSplit {
  totals: SplitAmounts;
  doctors: SplitDoctor[];
  paidNotCompleted: PaidNotCompleted[];
  feeSettings: DoctorFeeSetting[];
}

const EMPTY_AMOUNTS: SplitAmounts = {
  consultations: 0,
  grossAmount: 0,
  doctorShareAmount: 0,
  convenienceFeeAmount: 0,
};

export const EMPTY_SPLIT: EarningsSplit = {
  totals: EMPTY_AMOUNTS,
  doctors: [],
  paidNotCompleted: [],
  feeSettings: [],
};

type Raw = Record<string, unknown>;

const asRecord = (value: unknown): Raw =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asRows = (value: unknown): Raw[] => (Array.isArray(value) ? value.map(asRecord) : []);

function toAmounts(raw: Raw): SplitAmounts {
  return {
    consultations: asNumber(raw.consultations),
    grossAmount: asNumber(raw.grossAmount),
    doctorShareAmount: asNumber(raw.doctorShareAmount),
    convenienceFeeAmount: asNumber(raw.convenienceFeeAmount),
  };
}

export function asEarningsSplit(payload: unknown): EarningsSplit {
  const root = asRecord(payload);
  // The API client may leave the answer one level down, in `data`.
  const source = "totals" in root || "doctors" in root ? root : asRecord(root.data);
  if (!("totals" in source) && !("doctors" in source)) return EMPTY_SPLIT;

  return {
    totals: toAmounts(asRecord(source.totals)),
    doctors: asRows(source.doctors).map((doctor) => ({
      ...toAmounts(doctor),
      doctorId: asText(doctor.doctorId),
      doctorName: asText(doctor.doctorName) || "Doctor",
      daily: asRows(doctor.daily)
        .map((day) => ({ ...toAmounts(day), date: asText(day.date) }))
        .filter((day) => day.date),
    })),
    paidNotCompleted: asRows(source.paidNotCompleted).map((row) => ({
      paymentId: asText(row.paymentId),
      appointmentId: asText(row.appointmentId),
      doctorId: asText(row.doctorId),
      doctorName: asText(row.doctorName) || "Doctor",
      date: asText(row.date),
      appointmentStatus: asText(row.appointmentStatus),
      amount: asNumber(row.amount),
    })),
    feeSettings: asRows(source.feeSettings)
      .map((row) => ({
        userId: asText(row.userId),
        doctorName: asText(row.doctorName) || "Doctor",
        videoDoctorFee: asNullableNumber(row.videoDoctorFee),
        inPersonDoctorFee: asNullableNumber(row.inPersonDoctorFee),
      }))
      .filter((row) => row.userId),
  };
}

export interface FeeDraft {
  video: string;
  inPerson: string;
}

export type FeeChanges = { videoDoctorFee?: number; inPersonDoctorFee?: number };

export type FeeDraftResult =
  | { ok: true; changes: FeeChanges }
  | { ok: false; error: string };

/** Text for a fee input: the stored number, or empty when none is set. */
export function feeToInput(fee: number | null): string {
  return fee === null ? "" : String(fee);
}

function parseFee(text: string, label: string): { value?: number; error?: string } {
  const trimmed = text.trim();
  const value = trimmed === "" ? Number.NaN : Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { error: `${label} must be a number, 0 or more.` };
  }
  return { value };
}

/**
 * Turns the two inputs into a PATCH body with only the fields that changed.
 * An untouched blank field (no fee set before) stays out of the body.
 */
export function buildFeeChanges(setting: DoctorFeeSetting, draft: FeeDraft): FeeDraftResult {
  const changes: FeeChanges = {};
  const fields: Array<[keyof FeeChanges, string, number | null, string]> = [
    ["videoDoctorFee", "Video fee", setting.videoDoctorFee, draft.video],
    ["inPersonDoctorFee", "In-person fee", setting.inPersonDoctorFee, draft.inPerson],
  ];

  for (const [key, label, current, text] of fields) {
    if (text.trim() === "" && current === null) continue;
    const parsed = parseFee(text, label);
    if (parsed.error) return { ok: false, error: parsed.error };
    if (parsed.value !== undefined && parsed.value !== current) changes[key] = parsed.value;
  }
  return { ok: true, changes };
}
