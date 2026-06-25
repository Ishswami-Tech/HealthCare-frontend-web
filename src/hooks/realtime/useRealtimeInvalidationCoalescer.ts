"use client";
/**
 * Realtime invalidation coalescer.
 *
 * When the WebSocket layer emits multiple events in quick succession (e.g. a
 * single mutation on the backend produces `appointment.created` →
 * `appointment.status_changed` → `appointment.updated` → `appointment.checked_in`
 * within a few hundred ms, or a token expiry reconnects all the subscription
 * handlers at once), each handler historically fired
 * `invalidateAppointmentQueryFamilies()` immediately. That fans out to 40+
 * appointment-surface query keys, each with `refetchType: 'all'`, producing a
 * refetch storm.
 *
 * This helper debounces a *family* of invalidations into a single trailing
 * pass within `windowMs`. Net effect: N events arriving within 200ms collapse
 * into 1 invalidation round, instead of N.
 *
 * Design notes:
 * - Module-level state keyed by `coalescerKey`. Within a single tab the
 *   coalescer is shared across all realtime handlers — collapsing duplicate
 *   invalidations regardless of which event triggered them.
 * - The debounce uses `requestIdleCallback` with a `setTimeout` fallback so
 *   we still flush under tab-throttled conditions.
 * - The coalescer schedules at most one flush at a time per key. A late
 *   schedule that arrives mid-flush gets folded into the *next* trailing
 *   window so we don't keep extending indefinitely under sustained load.
 * - `invalidateQueries` itself is idempotent within TanStack Query — calling
 *   it twice in the same microtask is a no-op for caches already marked
 *   invalid. The coalescer's job is to skip the redundant *fan-out* cost
 *   (walking 40+ key families, scheduling 40+ refetches, observing them).
 */

import type { QueryClient, QueryKey } from '@tanstack/react-query';

const DEFAULT_WINDOW_MS = 200;

type FamilyPredicate = (queryClient: QueryClient) => void;

interface CoalescerEntry {
  flushTimer: ReturnType<typeof setTimeout> | null;
  flushing: boolean;
  // Track which families have been requested in the current window so we
  // don't replay work that's already been queued. We *want* each family to
  // run at least once per window; we just don't want to run them N times
  // when N events fire.
  pendingFamilies: Set<FamilyPredicate>;
}

// Key by (coalescerKey, queryClient identity) so a hot-reloaded or freshly
// remounted QueryClientProvider subtree never flushes into a stale instance.
const coalescers = new Map<string, Map<QueryClient, CoalescerEntry>>();

function getOrCreateEntry(
  coalescerKey: string,
  queryClient: QueryClient
): CoalescerEntry {
  let byClient = coalescers.get(coalescerKey);
  if (!byClient) {
    byClient = new Map<QueryClient, CoalescerEntry>();
    coalescers.set(coalescerKey, byClient);
  }
  let entry = byClient.get(queryClient);
  if (!entry) {
    entry = {
      flushTimer: null,
      flushing: false,
      pendingFamilies: new Set(),
    };
    byClient.set(queryClient, entry);
  }
  return entry;
}

function flushEntry(
  coalescerKey: string,
  queryClient: QueryClient
): void {
  const byClient = coalescers.get(coalescerKey);
  if (!byClient) return;
  const entry = byClient.get(queryClient);
  if (!entry) return;

  const families = Array.from(entry.pendingFamilies);
  entry.pendingFamilies.clear();
  entry.flushing = true;

  // Yield to the event loop so any synchronous handlers finishing up get a
  // chance to enqueue their families into the *next* window before we run.
  const run = () => {
    for (const family of families) {
      try {
        family(queryClient);
      } catch {
        // Best-effort: invalidation errors shouldn't crash the realtime loop.
      }
    }
    entry.flushing = false;

    // If new families arrived while we were flushing, schedule another pass.
    // Use a re-entry check rather than relying on `scheduleFlush` to be called
    // again by a new event — that way the queue can never sit in limbo if the
    // main thread is contended and idle callbacks are delayed past their
    // timeout.
    if (entry.pendingFamilies.size > 0) {
      scheduleFlush(coalescerKey, queryClient);
    } else {
      byClient.delete(queryClient);
      if (byClient.size === 0) {
        coalescers.delete(coalescerKey);
      }
    }
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 250 });
  } else {
    setTimeout(run, 0);
  }
}

function scheduleFlush(
  coalescerKey: string,
  queryClient: QueryClient
): void {
  const entry = getOrCreateEntry(coalescerKey, queryClient);

  if (entry.flushTimer !== null) {
    // Already scheduled — let it fire.
    return;
  }

  entry.flushTimer = setTimeout(() => {
    entry.flushTimer = null;
    flushEntry(coalescerKey, queryClient);
  }, DEFAULT_WINDOW_MS);
}

/**
 * Coalesce an invalidation call. Use this wrapper in realtime handlers in
 * place of calling `invalidateAppointmentQueryFamilies(queryClient)` (and
 * similar) directly. Multiple events arriving within the coalesce window
 * produce a single invalidation pass.
 */
export function coalesceRealtimeInvalidation(
  queryClient: QueryClient,
  coalescerKey: string,
  family: FamilyPredicate
): void {
  const entry = getOrCreateEntry(coalescerKey, queryClient);
  entry.pendingFamilies.add(family);
  scheduleFlush(coalescerKey, queryClient);
}

/**
 * Invalidate a single query key through the coalescer. Useful for targeted
 * invalidations (e.g. a specific `counselorClients` key).
 */
export function coalesceRealtimeInvalidateQueries(
  queryClient: QueryClient,
  coalescerKey: string,
  queryKey: QueryKey
): void {
  coalesceRealtimeInvalidation(queryClient, coalescerKey, (qc) => {
    void qc.invalidateQueries({ queryKey, exact: false });
  });
}