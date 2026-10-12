export function formatCurrencyFromMinorUnits(
  amountInMinorUnits: number,
  currency = "INR"
): string {
  const amount = Number.isFinite(amountInMinorUnits) ? amountInMinorUnits / 100 : 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmountFromMinorUnits(amountInMinorUnits: number): string {
  const amount = Number.isFinite(amountInMinorUnits) ? amountInMinorUnits / 100 : 0;
  return Math.round(amount).toLocaleString("en-IN");
}

export interface FormatRupeesOptions {
  /** ISO currency code of the amount; INR when left out. */
  currency?: string | null;
  /** `"auto"` (default) shows paise only when the amount has them; `"always"` shows them every time (an invoice). */
  paise?: "auto" | "always";
}

/**
 * The one money label of the app, for an amount in RUPEES (not paise — see
 * `formatCurrencyFromMinorUnits` for those): Indian grouping, no decimals for whole rupees,
 * two for fractions. "₹1,500", "₹1,05,000", "₹114.50". A missing amount reads as ₹0.
 */
export function formatRupees(amount: number | null | undefined, options: FormatRupeesOptions = {}): string {
  const value = Number(amount ?? 0);
  const safe = Number.isFinite(value) ? value : 0;
  const hasPaise = Math.round(safe * 100) % 100 !== 0;
  const digits = options.paise === "always" || hasPaise ? 2 : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: options.currency || "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(safe);
}
