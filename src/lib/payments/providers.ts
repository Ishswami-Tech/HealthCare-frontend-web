export const SUPPORTED_PAYMENT_PROVIDERS = [
  "cashfree",
  "razorpay",
  "phonepe",
  "easebuzz",
  "paytm",
  "payu",
] as const;
export type PaymentProvider = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

const configuredProviders =
  process.env.NEXT_PUBLIC_ENABLED_PAYMENT_PROVIDERS?.split(",")
    .flatMap((value) => {
      const normalized = value.trim().toLowerCase();
      return normalized ? [normalized] : [];
    }) ?? [];

const normalizedConfiguredProviders = configuredProviders.filter((value): value is PaymentProvider =>
  (SUPPORTED_PAYMENT_PROVIDERS as readonly string[]).includes(value)
);

export const ENABLED_PAYMENT_PROVIDERS: PaymentProvider[] =
  normalizedConfiguredProviders.length > 0
    ? normalizedConfiguredProviders
    : ["cashfree", "razorpay", "phonepe"];

export const DEFAULT_PAYMENT_PROVIDER: PaymentProvider =
  ENABLED_PAYMENT_PROVIDERS[0] || "cashfree";

export function isPaymentProviderEnabled(provider: string): provider is PaymentProvider {
  return ENABLED_PAYMENT_PROVIDERS.includes(provider as PaymentProvider);
}
