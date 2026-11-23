/**
 * Backend list routes answer a bare array or one of a few envelopes: `{ value }`, `{ items }`,
 * `{ results }`, a named list such as `{ doctors }` / `{ locations }`, `{ data }`, or the named
 * list one level down (`{ data: { doctors } }`). Returns the array, or `[]` when there is none.
 * Shared by server actions and browser-side reads so both unwrap lists the same way.
 */
export function readCollection<T>(payload: unknown, listKey: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['value', 'items', 'results', listKey, 'data']) {
    const list = record[key];
    if (Array.isArray(list)) return list as T[];
  }
  const nested = record.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const list = (nested as Record<string, unknown>)[listKey];
    if (Array.isArray(list)) return list as T[];
  }
  return [];
}
