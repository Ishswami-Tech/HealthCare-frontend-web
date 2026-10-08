/**
 * Reads the answer of GET /analytics/doctor/me/earnings:
 * { from, to, currency, consultations, total, daily: [{ date, consultations, total }] }.
 */

export interface EarningsDay {
  date: string;
  consultations: number;
  total: number;
}

export interface Earnings {
  consultations: number;
  total: number;
  daily: EarningsDay[];
}

const EMPTY: Earnings = { consultations: 0, total: 0, daily: [] };

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function asEarnings(payload: unknown): Earnings {
  const root = asRecord(payload);
  // The API client may leave the answer one level down, in `data`.
  const source = Array.isArray(root.daily) ? root : asRecord(root.data);
  if (!Array.isArray(source.daily)) return EMPTY;
  const daily = source.daily.flatMap((entry): EarningsDay[] => {
    const day = asRecord(entry);
    const date = typeof day.date === "string" ? day.date : "";
    return date ? [{ date, consultations: asNumber(day.consultations ?? day.count), total: asNumber(day.total) }] : [];
  });
  return {
    consultations: asNumber(source.consultations ?? source.count),
    total: asNumber(source.total),
    daily,
  };
}

/** Rupees with paise, Indian grouping: "₹12,500.00". */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}
