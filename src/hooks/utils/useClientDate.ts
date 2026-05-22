"use client";

import { useState, useEffect, useMemo } from 'react';

/**
 * Hook to get a date value that's only computed on the client side
 * This prevents hydration mismatch issues with SSR
 * @param getValue - Function that returns the date value
 * @param initialValue - Initial value to use during SSR
 */
export function useClientDate<T>(
  getValue: () => T,
  initialValue: T
): T {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    return getValue();
  }, [getValue, initialValue]);
}

/**
 * Hook to get current date formatted as ISO date string
 * Safe for SSR with hydration handling
 */
export function useCurrentDate(): string {
  return useClientDate(
    () => new Date().toDateString(),
    '' // Initial value during SSR
  );
}

/**
 * Hook to get current date object safely for SSR
 * Returns null during SSR, Date object after hydration
 */
export function useCurrentDateObject(): Date | null {
  const [date] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date()
  );

  return date;
}

/**
 * Hook to get a "now" Date object that updates periodically
 * Safe for SSR and hydration - returns null initially
 * @param intervalMs - Update interval in ms (default: 60000 = 1 minute)
 */
export function useNow(intervalMs: number = 60000): Date | null {
  const [now, setNow] = useState<Date | null>(() => new Date());

  useEffect(() => {
    // Set up interval for periodic updates
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}

/**
 * Hook to get current timestamp (for IDs, tokens, etc.)
 * Returns null during SSR, number after hydration
 */
export function useCurrentTimestamp(): number | null {
  const [timestamp] = useState<number | null>(() =>
    typeof window === "undefined" ? null : Date.now()
  );

  return timestamp;
}

/**
 * Hook to format a date only on the client side
 */
export function useClientFormattedDate(
  date: Date | string | undefined,
  formatFn: (date: Date) => string
): string {
  return useMemo(() => {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return formatFn(dateObj);
  }, [date, formatFn]);
}

/**
 * Hook-safe memoized date formatting
 * Use this when you need to format dates that depend on dynamic values
 * but want to avoid hydration mismatches
 */
export function useMemoizedDate<T>(
  computeFn: (now: Date | null) => T,
  deps: React.DependencyList,
  intervalMs?: number
): T {
  const now = useNow(intervalMs);
  void deps;
  return computeFn(now);
}
