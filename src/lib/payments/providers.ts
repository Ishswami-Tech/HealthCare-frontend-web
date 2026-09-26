/**
 * Payment provider identifiers this codebase knows how to integrate with.
 *
 * This is deliberately the ONLY static thing here. Which of these are
 * actually *enabled* — and which have real, usable credentials — is a
 * per-clinic decision that lives entirely in the backend
 * (`Clinic.settings.billingSettings` / `PaymentConfigService`, exposed via
 * `GET /payments/config/:clinicId`). There is no frontend build-time or
 * env-var default list of "enabled" providers: a hardcoded subset here
 * previously caused two real bugs — a merge conflict where one branch's
 * static list silently dropped easebuzz/paytm/payu, and a checkout flow
 * that could offer a provider the clinic never configured. Callers that
 * need "what's enabled for this clinic" must fetch it — see
 * `useClinicPaymentConfig` / `enabledProvidersFromConfig` in
 * `@/hooks/query/useClinicPaymentConfig`.
 */
export const SUPPORTED_PAYMENT_PROVIDERS = [
  "cashfree",
  "razorpay",
  "phonepe",
  "zoho",
  "easebuzz",
  "paytm",
  "payu",
] as const;
export type PaymentProvider = (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

export function isSupportedPaymentProvider(
  value: string,
): value is PaymentProvider {
  return (SUPPORTED_PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

/**
 * True when `provider` is one of the (optionally clinic-scoped) enabled
 * providers. Pass the clinic's real enabled-provider list (from
 * `enabledProvidersFromConfig`) once it's loaded; without one, this only
 * checks that the value is a provider the app knows about at all — it does
 * NOT claim to know whether any clinic has actually enabled it.
 */
export function isPaymentProviderEnabled(
  provider: string,
  enabledProviders: readonly string[] = SUPPORTED_PAYMENT_PROVIDERS,
): provider is PaymentProvider {
  return (
    isSupportedPaymentProvider(provider) && enabledProviders.includes(provider)
  );
}
