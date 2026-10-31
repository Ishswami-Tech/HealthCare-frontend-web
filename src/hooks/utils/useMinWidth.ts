import { useCallback, useSyncExternalStore } from "react";

/**
 * True while the viewport is at least `minWidthPx` wide (false on the server).
 * Lets a component skip mounting work that CSS would hide anyway (e.g. `hidden lg:flex`).
 */
export function useMinWidth(minWidthPx: number): boolean {
  const query = `(min-width: ${minWidthPx}px)`;
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
