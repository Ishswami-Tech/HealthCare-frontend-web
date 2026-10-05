"use client";

import { useMemo } from "react";

/**
 * Returns a copy of `value` whose identity only changes when its JSON
 * serialisation changes.
 *
 * Case-sheet panels seed a local draft from server data and reset the draft
 * when that data changes. Without this, every background refetch (window
 * focus, another panel's save invalidating the case sheet, websocket-driven
 * invalidation) produces new object identities and silently wipes the
 * clinician's unsaved edits. Only plain JSON data (as returned by the API)
 * should be passed in.
 */
export function useStableSnapshot<T>(value: T): T {
  const key = JSON.stringify(value ?? null);
  return useMemo(() => JSON.parse(key) as T, [key]);
}
