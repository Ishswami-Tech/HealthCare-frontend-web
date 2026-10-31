"use client";

import { useWebSocketStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';

/** Poll interval while the socket is down: the screen keeps up without live pushes. */
export const REALTIME_FALLBACK_POLL_MS = 30_000;
/** Safety-net poll while the socket is up, in case one push is missed (reconnect gap, relay drop). */
export const REALTIME_SAFETY_POLL_MS = 60_000;

/**
 * `refetchInterval` for screens that also refresh on socket events (pharmacy desk, prescriptions,
 * hand-over): 30 s while disconnected, 60 s while connected, off while the session token is being
 * refreshed (the requests would only fail and retry).
 */
export function realtimeFallbackInterval(isConnected: boolean, isAuthRefreshing: boolean): number | false {
  if (isAuthRefreshing) return false;
  return isConnected ? REALTIME_SAFETY_POLL_MS : REALTIME_FALLBACK_POLL_MS;
}

export function useRealtimeFallbackInterval(): number | false {
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  return realtimeFallbackInterval(isConnected, isAuthRefreshing);
}
