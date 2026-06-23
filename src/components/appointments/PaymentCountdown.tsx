"use client";

import { useEffect } from "react";
import { Clock, AlertTriangle, Hourglass } from "lucide-react";
import { useCountdown } from "@/hooks/utils";
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
 * Renders a live "Appointment will be cancelled in MM:SS" banner for video
 * appointments that are still in PENDING (i.e. created, payment window
 * started, payment not yet completed). Visually escalates to red in the
 * final minute so patients are nudged to act before the deadline.
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

  // Fire onExpire exactly once when the timer crosses zero.
  useEffect(() => {
    if (countdown.isExpired && onExpire) {
      onExpire();
    }
  }, [countdown.isExpired, onExpire]);

  const isUrgent = countdown.msRemaining > 0 && countdown.msRemaining <= URGENT_THRESHOLD_SECONDS * 1000;
  const isLastFiveMinutes =
    countdown.msRemaining > 0 && countdown.msRemaining <= 5 * 60_000;

  const palette = isUrgent
    ? {
        ring: "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
        text: "text-red-800 dark:text-red-200",
        sub: "text-red-700 dark:text-red-300",
        bar: "bg-red-500",
        icon: "text-red-600 dark:text-red-400",
        Icon: AlertTriangle,
        label: "Hurry!",
      }
    : isLastFiveMinutes
      ? {
          ring: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
          text: "text-amber-900 dark:text-amber-200",
          sub: "text-amber-700 dark:text-amber-300",
          bar: "bg-amber-500",
          icon: "text-amber-600 dark:text-amber-400",
          Icon: Clock,
          label: "Almost out of time",
        }
      : {
          ring: "border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30",
          text: "text-sky-900 dark:text-sky-200",
          sub: "text-sky-700 dark:text-sky-300",
          bar: "bg-sky-500",
          icon: "text-sky-600 dark:text-sky-400",
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
          ? "Payment window expired"
          : `Appointment will be cancelled in ${countdown.formatted}`
      }
      className={cn(
        "rounded-lg border p-3 shadow-sm",
        palette.ring,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 shrink-0", palette.icon)}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={cn("text-xs font-semibold uppercase tracking-wide", palette.sub)}>
              {countdown.isExpired ? "Payment window expired" : palette.label}
            </p>
            {!countdown.isExpired && (
              <p
                className={cn(
                  "font-mono text-lg font-bold tabular-nums leading-none",
                  palette.text
                )}
              >
                {countdown.formatted}
              </p>
            )}
          </div>
          <p className={cn("mt-1 text-sm font-medium", palette.text)}>
            {countdown.isExpired
              ? "Your appointment has been auto-cancelled. Please book a new slot."
              : `Complete payment within ${countdown.formatted} or this appointment will be auto-cancelled.`}
          </p>

          {/* Progress bar — shows the shrinking window visually. */}
          {!countdown.isExpired && windowMs && (
            <div
              className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800/60"
              aria-hidden="true"
            >
              <div
                className={cn("h-full transition-all duration-1000 ease-linear", palette.bar)}
                style={{ width: `${Math.max(2, (1 - countdown.progress) * 100)}%` }}
              />
            </div>
          )}

          {showCompletePaymentCta && onCompletePayment && !countdown.isExpired && (
            <button
              type="button"
              onClick={onCompletePayment}
              disabled={ctaDisabled}
              className={cn(
                "mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-sm transition",
                isUrgent
                  ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  : isLastFiveMinutes
                    ? "bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    : "bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              )}
            >
              Complete Payment Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
