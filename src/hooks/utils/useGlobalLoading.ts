/**
 * ✅ useGlobalLoading Hook
 * Enterprise-level global loading state management
 * Uses Zustand (useAppStore) as single source of truth
 * 
 * Pattern: Hook-based, integrates with React Query and Server Actions
 */

"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores";

export interface UseGlobalLoadingReturn {
  /** Current loading state */
  isLoading: boolean;
  /** Current loading message */
  message: string;
  /** Start loading with optional message */
  startLoading: (message?: string) => void;
  /** Stop loading */
  stopLoading: () => void;
  /** Execute async operation with automatic loading state */
  withLoading: <T>(operation: () => Promise<T>, message?: string) => Promise<T>;
}

/**
 * ✅ useGlobalLoading - Global loading state hook
 * 
 * @example
 * ```tsx
 * const { isLoading, startLoading, stopLoading, withLoading } = useGlobalLoading();
 * 
 * // Manual control
 * startLoading("Saving...");
 * await saveData();
 * stopLoading();
 * 
 * // Or automatic
 * await withLoading(saveData, "Saving...");
 * ```
 */
export function useGlobalLoading(): UseGlobalLoadingReturn {
  const isLoading = useAppStore((s) => s.isLoading);
  const message = useAppStore((s) => s.loadingMessage);
  const setLoading = useAppStore((s) => s.setLoading);

  const startLoading = useCallback(
    (msg?: string) => setLoading(true, msg || "Loading..."),
    [setLoading]
  );

  const stopLoading = useCallback(
    () => setLoading(false),
    [setLoading]
  );

  const withLoading = useCallback(
    async <T,>(operation: () => Promise<T>, msg?: string): Promise<T> => {
      try {
        startLoading(msg);
        return await operation();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    message,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * ✅ Selector for loading state (performance optimized)
 */
export const useIsLoading = () => useAppStore((s) => s.isLoading);
export const useLoadingMessage = () => useAppStore((s) => s.loadingMessage);
