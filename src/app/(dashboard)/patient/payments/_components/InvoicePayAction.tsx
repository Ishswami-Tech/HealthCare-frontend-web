"use client";

import type { ReactNode } from "react";
import { PaymentCountdown } from "@/components/appointments/PaymentCountdown";
import { Pill } from "@/components/tbd";
import { useCountdown } from "@/hooks/utils";
import type { Invoice } from "@/types/billing.types";

/**
 * After a window closes the backend expires the attempt (and voids a plan purchase) on its next
 * one-minute sweep, once the provider buffer has passed: refetch again after this delay.
 */
export const PAYMENT_WINDOW_SETTLE_MS = 90_000;

/** Refetches now and once more after the backend sweep has run. */
export function refetchAroundWindowClose(refetch: () => void): void {
  refetch();
  window.setTimeout(refetch, PAYMENT_WINDOW_SETTLE_MS);
}

interface InvoicePayActionProps {
  invoice: Pick<Invoice, "subscriptionId" | "paymentExpiresAt">;
  /** Fired once when the payment window of the open attempt closes (refetch the lists). */
  onExpired?: (() => void) | undefined;
  /** The Pay button. */
  children: ReactNode;
}

/**
 * The Pay button of an invoice with the live 15-minute window of its open payment attempt
 * (`paymentExpiresAt` from the backend), using the shared video PaymentCountdown. When the
 * window closes Pay disappears and the invoice reads "Expired" (the backend voids it within a
 * minute or two).
 */
export function InvoicePayAction({ invoice, onExpired, children }: InvoicePayActionProps) {
  const expiresAt = invoice.paymentExpiresAt ?? null;
  const countdown = useCountdown(expiresAt);
  const hasDeadline = Boolean(expiresAt) && Number.isFinite(Date.parse(String(expiresAt)));
  const lapsed = hasDeadline && countdown.isExpired;
  const isPlanPurchase = Boolean(invoice.subscriptionId);

  if (lapsed) {
    return <Pill tone="slate">Expired</Pill>;
  }

  return (
    <>
      {hasDeadline ? (
        <PaymentCountdown
          className="w-full basis-full"
          paymentExpiresAt={expiresAt}
          noun={isPlanPurchase ? "plan purchase" : "payment"}
          expiredMessage="This payment was not completed in time."
          {...(onExpired ? { onExpire: onExpired } : {})}
        />
      ) : null}
      {children}
    </>
  );
}
