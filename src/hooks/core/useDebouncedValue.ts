'use client';

import { useEffect, useState } from 'react';

/** `value`, but only after it has stopped changing for `delayMs` (so typing does not fire a request per key). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
