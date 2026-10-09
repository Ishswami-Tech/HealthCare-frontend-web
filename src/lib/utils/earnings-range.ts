import { formatISODateInIST } from "@/lib/utils/date-time";

export type EarningsRange = { from: string; to: string };

/** Rupees with paise, Indian grouping: "₹12,500.00". */
export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

/** The longest window the earnings routes accept, in days (both ends included). */
export const MAX_EARNINGS_RANGE_DAYS = 366;

/** Days from `from` to `to`, both included, for two YYYY-MM-DD keys; null when either is not a day. */
export function inclusiveDayCount(from: string, to: string): number | null {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 86_400_000) + 1;
}

/** This month so far, in IST: the 1st up to today. */
export function currentMonthRange(): EarningsRange {
  const today = formatISODateInIST(new Date());
  return { from: `${today.slice(0, 8)}01`, to: today };
}
