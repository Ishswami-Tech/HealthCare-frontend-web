"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface AppointmentExpiryCountdownProps {
  /**
   * ISO timestamp at which the backend will auto-expire the appointment.
   * Sourced from `confirmationExpiresAt` on the appointment payload —
   * stamped at CONFIRMED time using `VIDEO_ACTIVE_WINDOW_MINUTES`
   * (default 300 min) measured from the scheduled start.
   */
  expiresAt: string | Date | null | undefined;
  /**
   * Window length in minutes (mirrors `confirmationWindowMinutes`).
   * Optional — used purely for the label so the user knows the
   * schedule at a glance.
   */
  windowMinutes?: number | null;
  /**
   * Status of the appointment. Only renders the countdown for statuses
   * the backend can still expire (CONFIRMED / SCHEDULED / PENDING).
   * For terminal statuses the component returns null.
   */
  status: string;
  /**
   * Render size — `compact` shrinks the badge for tight rows,
   * `default` uses the regular sizing.
   */
  variant?: "compact" | "default";
}

/**
 * Live "Expires in" countdown for a confirmed appointment.
 *
 * Source of truth: the backend. We never re-derive the deadline on the
 * client; the timestamp on the appointment row is authoritative. The
 * component just formats the remaining time into a friendly label.
 *
 * The backend expires confirmed appointments via its scheduler when
 * `now > confirmationExpiresAt`, so once the countdown crosses zero
 * we display "Expired at HH:MM" instead of a negative timer.
 */
export function AppointmentExpiryCountdown({
  expiresAt,
  windowMinutes,
  status,
  variant = "default",
}: AppointmentExpiryCountdownProps) {
  const [now, setNow] = useState<number>(() => Date.now());

  // The backend only expires CONFIRMED / SCHEDULED / PENDING rows.
  // Skip the badge entirely for terminal statuses.
  const statusUpper = (status || "").toUpperCase();
  const isEligible = ["CONFIRMED", "SCHEDULED", "PENDING"].includes(statusUpper);

  const expiry = useMemo(() => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime();
    if (!Number.isFinite(ms)) return null;
    return ms;
  }, [expiresAt]);

  // Hooks must run unconditionally on every render — compute the
  // derived values BEFORE any early return, then bail out below.
  const formattedTime = useMemo(() => {
    if (!expiry) return null;
    return new Date(expiry).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  }, [expiry]);

  const diffMs = expiry ? expiry - now : 0;
  const isExpired = expiry != null && diffMs <= 0;

  const remainingLabel = useMemo(() => {
    if (!expiry || isExpired) return null;
    const totalMinutes = Math.floor(diffMs / 60_000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, [diffMs, isExpired, expiry]);

  useEffect(() => {
    if (!expiry || !isEligible) return;
    const tickInterval = setInterval(() => {
      setNow(Date.now());
    }, 30_000);
    return () => clearInterval(tickInterval);
  }, [expiry, isEligible]);

  if (!isEligible || !expiry) return null;

  const isUrgent = !isExpired && diffMs <= 60 * 60_000; // <1h left
  const isWarning = !isExpired && !isUrgent && diffMs <= 3 * 60 * 60_000; // <3h left

  const palette = isExpired
    ? {
        icon: AlertTriangle,
        iconClass: "text-red-600 dark:text-red-400",
        containerClass:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
        label: "Expired",
      }
    : isUrgent
    ? {
        icon: AlertTriangle,
        iconClass: "text-amber-700 dark:text-amber-300",
        containerClass:
          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200",
        label: `Expires in ${remainingLabel}`,
      }
    : isWarning
    ? {
        icon: Clock,
        iconClass: "text-amber-700 dark:text-amber-300",
        containerClass:
          "border-amber-200 bg-amber-50/70 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        label: `Expires in ${remainingLabel}`,
      }
    : {
        icon: Clock,
        iconClass: "text-slate-600 dark:text-slate-300",
        containerClass:
          "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300",
        label: `Expires in ${remainingLabel}`,
      };

  const Icon = palette.icon;
  const sizing =
    variant === "compact"
      ? "h-5 px-2 text-[10px] gap-1"
      : "h-6 px-2.5 text-[11px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizing} ${palette.containerClass}`}
      title={
        formattedTime
          ? isExpired
            ? `Expired at ${formattedTime} IST`
            : `Backend will expire this appointment at ${formattedTime} IST${
                windowMinutes ? ` (${windowMinutes}m window)` : ""
              }`
          : undefined
      }
    >
      <Icon className={`size-3 ${palette.iconClass}`} />
      <span className="font-semibold tracking-wide">
        {isExpired
          ? formattedTime
            ? `Expired at ${formattedTime}`
            : "Expired"
          : palette.label}
      </span>
    </span>
  );
}
