import { useWebSocketQuerySync as useRealHook } from "@/hooks/realtime/useRealTimeQueries";

// Backward-compatible signature for legacy dashboard pages that pass query keys.
export function useWebSocketQuerySync(_queryKeys?: unknown) {
  return useRealHook();
}
