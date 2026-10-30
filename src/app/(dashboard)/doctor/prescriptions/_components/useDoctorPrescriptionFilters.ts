"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import {
  DEFAULT_FILTERS,
  SEARCH_DEBOUNCE_MS,
  parseFilters,
  serializeFilters,
  type DoctorRxFilters,
} from "./doctor-prescriptions.filters";

export interface DoctorRxFilterState {
  filters: DoctorRxFilters;
  /** What is typed in the search box (the filters catch up 300 ms later). */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** Changes filters; the list goes back to page 1 unless the patch sets a page. */
  update: (patch: Partial<DoctorRxFilters>) => void;
  clear: () => void;
  hrefFor: (patch: Partial<DoctorRxFilters>) => string;
}

/** Most own URL writes remembered while waiting for the router to report them back. */
const MAX_PENDING_WRITES = 20;

/**
 * Params that are not list filters but must survive a filter write: the view tab
 * (`?tab=handover`) and the hand-over pre-fills that live on the Stock hand-over tab.
 */
const PRESERVED_PARAMS = ["tab", "patientId", "appointmentId", "prescriptionId"] as const;

/** Two query strings mean the same thing when they hold the same params (order does not count). */
function sameQuery(left: string, right: string): boolean {
  const a = new URLSearchParams(left);
  const b = new URLSearchParams(right);
  if (a.size !== b.size) return false;
  for (const [key, value] of a.entries()) {
    if (b.get(key) !== value) return false;
  }
  return true;
}

/**
 * Filters and page of the prescriptions list. React state is the source of truth, so a date,
 * page or search change refetches at once; the URL query follows (`router.replace`, no scroll, no
 * new history entry) so a refresh or a shared link lands on the same view.
 *
 * The URL is read back only for navigations made elsewhere (back button, a tile link): the
 * router reports our own writes a moment later, and those are skipped so a slow echo of an older
 * write cannot undo a newer change.
 *
 * Params that are not filters — the view tab (`?tab=handover`) and the hand-over pre-fills — are
 * carried over into every write, so changing a filter never drops the tab the user is on.
 */
export function useDoctorPrescriptionFilters(): DoctorRxFilterState {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlQuery = searchParams?.toString() ?? "";

  const [filters, setFilters] = useState<DoctorRxFilters>(() => parseFilters(new URLSearchParams(urlQuery)));
  const ownWrites = useRef<Set<string>>(new Set());

  /** The serialized filters only — what the filters state owns. */
  const filterSearch = serializeFilters(filters);

  // A navigation from elsewhere -> the filters follow the address.
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  if (seenUrlQuery !== urlQuery) {
    setSeenUrlQuery(urlQuery);
    const fromUrl = serializeFilters(parseFilters(new URLSearchParams(urlQuery)));
    if (!ownWrites.current.has(fromUrl) && fromUrl !== filterSearch) {
      setFilters(parseFilters(new URLSearchParams(urlQuery)));
    }
  }

  // The filters changed -> the address follows. Only the filters trigger a write (the effect
  // keys on `filterSearch`), so switching the view tab never makes this hook rewrite the URL.
  useEffect(() => {
    // The params that are not filters are read at write time: they are whatever the address
    // holds right now, so a hand-over pre-fill or the tab survives the write.
    const params = new URLSearchParams(filterSearch);
    PRESERVED_PARAMS.forEach((key) => {
      const value = window.location.search.includes(`${key}=`)
        ? new URLSearchParams(window.location.search).get(key)
        : null;
      if (value) params.set(key, value);
    });
    const search = params.toString();
    if (sameQuery(window.location.search.replace(/^\?/, ""), search)) {
      ownWrites.current.clear();
      return;
    }
    const writes = ownWrites.current;
    if (writes.size >= MAX_PENDING_WRITES) writes.clear();
    writes.add(filterSearch);
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }, [filterSearch, pathname, router]);

  const hrefFor = useCallback(
    (patch: Partial<DoctorRxFilters>) => {
      const params = new URLSearchParams(serializeFilters({ ...filters, page: 1, ...patch }));
      PRESERVED_PARAMS.forEach((key) => {
        const value = searchParams?.get(key);
        if (value) params.set(key, value);
      });
      const next = params.toString();
      return next ? `${pathname}?${next}` : pathname;
    },
    [filters, pathname, searchParams],
  );

  // Functional update: two quick changes (or the debounced search landing between clicks) never
  // drop each other's filter.
  const update = useCallback((patch: Partial<DoctorRxFilters>) => {
    setFilters((current) => {
      const next = { ...current, page: 1, ...patch };
      return serializeFilters(next) === serializeFilters(current) ? current : next;
    });
  }, []);

  const [searchInput, setSearchInput] = useState(filters.q);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // Typing settles -> the filters (and the query) follow.
  const appliedQ = filters.q;
  useEffect(() => {
    if (debouncedSearch.trim() !== appliedQ.trim()) update({ q: debouncedSearch });
    // Only a settled search should write; a filter change alone must not re-run this.
  }, [debouncedSearch, update]);

  // The search filter changed from elsewhere (back button, "Clear filters", a tile link) -> the box follows.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (syncedQ !== filters.q) {
    setSyncedQ(filters.q);
    // Our own debounced write is not "elsewhere": the box may still hold newer typing.
    if (filters.q.trim() !== debouncedSearch.trim()) setSearchInput(filters.q);
  }

  const clear = useCallback(() => {
    setSearchInput("");
    setFilters((current) => ({ ...DEFAULT_FILTERS, size: current.size }));
  }, []);

  return { filters, searchInput, setSearchInput, update, clear, hrefFor };
}
