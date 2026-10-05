"use client";

import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@/hooks/core";

const APPOINTMENT_QUERY_KEYS = [
  "appointments",
  "appointment",
  "myAppointments",
  "userUpcomingAppointments",
  "appointmentStats",
];

/**
 * Refreshing the appointments list. With a live socket it first waits a moment for the
 * socket to deliver the update; only then does it fall back to a refetch.
 */
export function useAppointmentsRefresh({
  isConnected,
  onRefreshAppointments,
  refetch,
}: {
  isConnected: boolean;
  /** The page's own refetch, when the page owns the query. */
  onRefreshAppointments?: (() => Promise<unknown> | unknown) | undefined;
  refetch: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const waitForWebsocketAppointmentUpdate = useCallback(async (timeoutMs: number) => {
    const cache = queryClient.getQueryCache();
    return await new Promise<boolean>((resolve) => {
      let settled = false;

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(value);
      };

      const unsubscribe = cache.subscribe((event) => {
        const queryKey: unknown = event?.query?.queryKey;
        const firstKey = Array.isArray(queryKey) ? String(queryKey[0] || "") : "";
        if (!APPOINTMENT_QUERY_KEYS.includes(firstKey)) {
          return;
        }

        if (event?.type === "updated") {
          finish(true);
        }
      });

      const timer = window.setTimeout(() => finish(false), timeoutMs);

      const cleanup = () => {
        window.clearTimeout(timer);
        unsubscribe();
      };
    });
  }, [queryClient]);

  const refresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    try {
      if (isConnected) {
        const websocketUpdated = await waitForWebsocketAppointmentUpdate(900);
        if (websocketUpdated) {
          return;
        }
      }

      if (onRefreshAppointments) {
        await onRefreshAppointments();
        return;
      }

      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected, isRefreshing, onRefreshAppointments, refetch, waitForWebsocketAppointmentUpdate]);

  // A global hook, so nested components can ask the manager to refresh the list (for
  // example when a payment window runs out) without callbacks through the whole tree.
  useEffect(() => {
    const w = window as Window & { __refreshAppointments?: () => void };
    w.__refreshAppointments = () => {
      void refresh();
    };
    return () => {
      if (w.__refreshAppointments) {
        delete w.__refreshAppointments;
      }
    };
  }, [refresh]);

  return { isRefreshing, refresh };
}
