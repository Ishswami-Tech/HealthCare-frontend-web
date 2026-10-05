"use client";

import { useEffect, useRef } from "react";
import { Clock, AlertTriangle, Hourglass } from "lucide-react";
import { useCountdown } from "@/hooks/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentCountdownProps {
  /** ISO-8601 timestamp the payment window closes. */
  paymentExpiresAt: string | null | undefined;
  /** Total window length in minutes (e.g. 15). */
  paymentWindowMinutes?: number | null;
  /**
   * Optional callback fired exactly once when the countdown crosses zero.
   * Useful to trigger a data refresh so the UI reflects the now-cancelled
   * appointment without the user manually reloading.
   */
  onExpire?: () => void;
  /** Optional className applied to the outer wrapper. */
  className?: string;
  /** Show the "Complete Payment" CTA below the timer. */
  showCompletePaymentCta?: boolean;
  /** Click handler for the CTA. */
  onCompletePayment?: () => void;
  /** Whether the CTA should be disabled (e.g. retrying). */
  ctaDisabled?: boolean;
}

const URGENT_THRESHOLD_SECONDS = 60; // last minute -> red, full attention

/**
 * Renders a live "Pay within MM:SS" banner for video appointments that are
 * still in PENDING (i.e. created, payment window started, payment not yet
 * completed). Visually escalates to red in the final minute so patients are
 * nudged to act before the deadline. Renders nothing when the appointment
 * carries no deadline.
 */
export function PaymentCountdown({
  paymentExpiresAt,
  paymentWindowMinutes = null,
  onExpire,
  className,
  showCompletePaymentCta = false,
  onCompletePayment,
  ctaDisabled = false,
}: PaymentCountdownProps) {
  const windowMs =
    paymentWindowMinutes && paymentWindowMinutes > 0
      ? paymentWindowMinutes * 60_000
      : null;
  const countdown = useCountdown(paymentExpiresAt, windowMs);
  const hasDeadline = Boolean(paymentExpiresAt) && Number.isFinite(Date.parse(String(paymentExpiresAt)));

  // Fire onExpire exactly once when the timer crosses zero. Without a deadline there is
  // nothing to wait for, so nothing fires.
  const expiredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!hasDeadline || !countdown.isExpired || !onExpire) return;
    const key = String(paymentExpiresAt);
    if (expiredFor.current === key) return;
    expiredFor.current = key;
    onExpire();
  }, [hasDeadline, countdown.isExpired, onExpire, paymentExpiresAt]);

  if (!hasDeadline) return null;

  const isUrgent = countdown.msRemaining > 0 && countdown.msRemaining <= URGENT_THRESHOLD_SECONDS * 1000;
  const isLastFiveMinutes =
    countdown.msRemaining > 0 && countdown.msRemaining <= 5 * 60_000;

  // Red in the last minute and once the window has closed, amber in the last five
  // minutes, blue before that.
  const palette =
    isUrgent || countdown.isExpired
      ? {
          box: "bg-[#fff1f2] text-[#9f1239] dark:bg-rose-950/30 dark:text-rose-200",
          bar: "bg-[#e11d48]",
          icon: "text-[#e11d48] dark:text-rose-300",
          Icon: AlertTriangle,
          label: "Hurry, almost out of time",
        }
      : isLastFiveMinutes
        ? {
            box: "bg-[#fffbeb] text-[#92400e] dark:bg-amber-950/30 dark:text-amber-200",
            bar: "bg-[#f59e0b]",
            icon: "text-[#d97706] dark:text-amber-300",
            Icon: Clock,
            label: "Almost out of time",
          }
        : {
            box: "bg-[#eef6ff] text-[#1e3a8a] dark:bg-blue-950/30 dark:text-blue-200",
            bar: "bg-[#3b82f6]",
            icon: "text-[#2563eb] dark:text-blue-300",
            Icon: Hourglass,
            label: "Payment window open",
          };

  const { Icon } = palette;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        countdown.isExpired
          ? "Payment window closed"
          : `Pay within ${countdown.formatted} to keep this visit`
      }
      className={cn("rounded-[14px] px-3.5 py-3", palette.box, className)}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-[18px] shrink-0", palette.icon)} strokeWidth={2.2} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.4px]">
              {countdown.isExpired ? "Payment window closed" : palette.label}
            </p>
            {!countdown.isExpired && (
              <p className="m-0 text-lg font-extrabold tabular-nums leading-none">{countdown.formatted}</p>
            )}
          </div>
          <p className="m-0 mt-1 text-[13px] font-medium leading-snug">
            {countdown.isExpired
              ? "This visit was not paid in time. Please book a new slot."
              : `Pay within ${countdown.formatted} or this visit is cancelled automatically.`}
          </p>

          {/* Progress bar: shows the shrinking window. */}
          {!countdown.isExpired && windowMs && (
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
              aria-hidden="true"
            >
              <div
                className={cn("h-full rounded-full transition-all duration-1000 ease-linear", palette.bar)}
                style={{ width: `${Math.max(2, (1 - countdown.progress) * 100)}%` }}
              />
            </div>
          )}

          {showCompletePaymentCta && onCompletePayment && !countdown.isExpired && (
            <Button
              variant="action"
              size="md"
              onClick={onCompletePayment}
              disabled={ctaDisabled}
              className="mt-3 w-full"
            >
              Pay now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
