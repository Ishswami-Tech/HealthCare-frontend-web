"use client";

import { useQueryData } from "@/hooks/core";
import {
  getClinicPaymentConfig,
  type ClinicPaymentConfig,
} from "@/lib/actions/payment-config.server";

/**
 * The clinic's actual payment-provider configuration, fetched from the
 * backend (`GET /payments/config/:clinicId`) — the single source of truth
 * for which providers are enabled for checkout. Never derive this from a
 * frontend-static list or an env var.
 */
export function useClinicPaymentConfig(clinicId?: string) {
  return useQueryData<ClinicPaymentConfig | null>(
    ["clinic-payment-config", clinicId],
    async () => (clinicId ? await getClinicPaymentConfig(clinicId) : null),
    {
      enabled: !!clinicId,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  );
}

/**
 * Providers this clinic has enabled AND has real credentials for, primary
 * first, then fallback in priority order. Empty when the config hasn't
 * loaded yet or the clinic has none configured — callers should treat an
 * empty result as "unknown", not "nothing is enabled", and fall back to
 * `SUPPORTED_PAYMENT_PROVIDERS` for that case.
 */
export function enabledProvidersFromConfig(
  config: ClinicPaymentConfig | null | undefined,
): string[] {
  if (!config) return [];
  const candidates = [config.primary, ...(config.fallback ?? [])];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const candidate of candidates) {
    if (
      candidate?.enabled &&
      candidate.hasCredentials &&
      candidate.provider &&
      !seen.has(candidate.provider)
    ) {
      seen.add(candidate.provider);
      result.push(candidate.provider);
    }
  }
  return result;
}
