"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { IST_TIMEZONE } from "@/lib/utils/date-time";

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
      timeZone: IST_TIMEZONE,
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

  // Same colours as the status tags: rose once expired, amber when close, slate otherwise.
  const palette = isExpired
    ? {
        icon: AlertTriangle,
        containerClass: "bg-[#ffe4e6] text-[#be123c] dark:bg-rose-500/15 dark:text-rose-300",
        label: "Expired",
      }
    : isUrgent
    ? {
        icon: AlertTriangle,
        containerClass: "bg-[#fef3c7] text-[#92400e] dark:bg-amber-500/15 dark:text-amber-300",
        label: `Expires in ${remainingLabel}`,
      }
    : isWarning
    ? {
        icon: Clock,
        containerClass: "bg-[#fef3c7] text-[#92400e] dark:bg-amber-500/15 dark:text-amber-300",
        label: `Expires in ${remainingLabel}`,
      }
    : {
        icon: Clock,
        containerClass: "bg-[#f1f5f9] text-[#334155] dark:bg-slate-500/20 dark:text-slate-300",
        label: `Expires in ${remainingLabel}`,
      };

  const Icon = palette.icon;
  const sizing =
    variant === "compact"
      ? "gap-1 rounded-[8px] px-2 py-1 text-[11px] leading-none"
      : "gap-1.5 rounded-[10px] px-2.5 py-[7px] text-xs";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap font-semibold ${sizing} ${palette.containerClass}`}
      title={
        formattedTime
          ? isExpired
            ? `Expired at ${formattedTime} IST`
            : `This visit expires at ${formattedTime} IST${
                windowMinutes ? ` (${windowMinutes} minute window)` : ""
              }`
          : undefined
      }
    >
      <Icon className={variant === "compact" ? "size-3 shrink-0" : "size-3.5 shrink-0"} strokeWidth={2.2} aria-hidden="true" />
      <span>
        {isExpired
          ? formattedTime
            ? `Expired at ${formattedTime}`
            : "Expired"
          : palette.label}
      </span>
    </span>
  );
}
