"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
  getJwtRefreshDelayMs,
  refreshClientSessionOnce,
} from "@/lib/utils/auth-recovery";

/**
 * useAuthRefreshScheduler
 *
 * Proactively refreshes the access token ~2 minutes before it expires. This
 * complements the WebSocket-side `scheduleAuthRefresh` (which only fires after
 * the socket has connected) and the HTTP `performTokenRefresh` interceptor
 * (which only fires on a 401 round-trip). The dashboard can therefore mount
 * with a token that's already close to expiring, the scheduler refreshes
 * silently in the background, and the appointment fetches never see a 401.
 *
 * Module-level state prevents duplicate schedulers if the hook is mounted by
 * multiple provider stacks during dev/HMR.
 */

const SCHEDULER_KEY = "__healthcare_frontend_auth_scheduler__";

interface SchedulerState {
  timer: number | null;
  token: string | null;
}

const schedulerState: SchedulerState =
  typeof window !== "undefined"
    ? (((window as unknown as Record<string, SchedulerState>)[SCHEDULER_KEY] ||= {
        timer: null,
        token: null,
      }))
    : { timer: null, token: null };

function clearSchedulerTimer(): void {
  if (schedulerState.timer !== null && typeof window !== "undefined") {
    window.clearTimeout(schedulerState.timer);
    schedulerState.timer = null;
  }
}

function scheduleNextRefresh(delayMs: number): void {
  if (typeof window === "undefined") return;
  clearSchedulerTimer();
  schedulerState.timer = window.setTimeout(async () => {
    try {
      const refreshed = await refreshClientSessionOnce("auth-refresh-scheduler");
      if (refreshed?.access_token) {
        schedulerState.token = refreshed.access_token;
        // Reschedule based on the *new* token's exp.
        const nextDelay = getJwtRefreshDelayMs(refreshed.access_token) ?? 60_000;
        scheduleNextRefresh(Math.max(nextDelay, 5_000));
      } else {
        // Refresh returned no token — try again in 30s. The HTTP interceptor
        // will also retry on the next 401.
        scheduleNextRefresh(30_000);
      }
    } catch {
      scheduleNextRefresh(30_000);
    }
  }, Math.max(delayMs, 5_000));
}

export function useAuthRefreshScheduler(): void {
  const accessToken = useAuthStore((state) => state.session?.access_token);
  const lastTokenRef = useRef<string | null>(accessToken ?? null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!accessToken) {
      clearSchedulerTimer();
      lastTokenRef.current = null;
      return;
    }

    // If the token hasn't changed and we already have a timer, do nothing.
    if (accessToken === lastTokenRef.current && schedulerState.timer !== null) {
      return;
    }
    lastTokenRef.current = accessToken;
    schedulerState.token = accessToken;

    const delayMs = getJwtRefreshDelayMs(accessToken);
    if (delayMs === null) return;
    scheduleNextRefresh(delayMs);

    return () => {
      // Don't clear the timer on unmount — another provider mount may have
      // re-used the same access token. The scheduler self-clears on
      // accessToken === null in the effect above.
    };
  }, [accessToken]);
}
