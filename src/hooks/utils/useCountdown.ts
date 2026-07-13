"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface CountdownResult {
  /** Total milliseconds remaining (0 once expired). */
  msRemaining: number;
  /** True when the target time has been reached. */
  isExpired: boolean;
  /** Whole minutes remaining, clamped to >= 0. */
  minutes: number;
  /** Whole seconds remaining in the current minute, 0..59. */
  seconds: number;
  /** Padded MM:SS string for the UI. */
  formatted: string;
  /** Same as `formatted` but with hours prefix when >= 1h. */
  formattedLong: string;
  /** 0..1 ratio representing time elapsed in the window. */
  progress: number;
}

/**
 * Live countdown to a target ISO timestamp.
 *
 * Re-evaluates every second while the target is in the future and stops
 * updating once expired (avoids a runaway timer that keeps ratcheting the
 * page every second after the deadline).
 *
 * `windowMs` is the original total window length (e.g. 15 minutes). It is
 * used to compute a 0..1 progress ratio so the UI can render a shrinking
 * ring / bar. Optional — pass `null` if you don't need a progress value.
 */
export function useCountdown(
  targetIso: string | null | undefined,
  windowMs: number | null = null
): CountdownResult {
  const targetMs = useMemo(() => {
    if (!targetIso) return null;
    const parsed = Date.parse(targetIso);
    return Number.isFinite(parsed) ? parsed : null;
  }, [targetIso]);

  const targetMsRef = useRef(targetMs);
  targetMsRef.current = targetMs;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs === null) return;

    const id = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (targetMsRef.current !== null && targetMsRef.current <= currentNow) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [targetMs]);

  return useMemo<CountdownResult>(() => {
    if (targetMs === null) {
      return {
        msRemaining: 0,
        isExpired: true,
        minutes: 0,
        seconds: 0,
        formatted: "00:00",
        formattedLong: "00:00",
        progress: 0,
      };
    }
    const msRemaining = Math.max(0, targetMs - now);
    const isExpired = msRemaining <= 0;
    const totalSeconds = Math.floor(msRemaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
    const progress = windowMs && windowMs > 0
      ? Math.max(0, Math.min(1, 1 - msRemaining / windowMs))
      : 0;

    return {
      msRemaining,
      isExpired,
      minutes,
      seconds,
      formatted,
      formattedLong: formatted,
      progress,
    };
  }, [targetMs, now, windowMs]);
}
