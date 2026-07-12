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
