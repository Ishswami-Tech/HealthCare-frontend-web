"use client";

import { useCallback, useEffect, useState } from "react";

export type UseHashTabOptions<T extends string> = {
  /** Allowed tab ids for this page/section */
  tabs: readonly T[];
  /** Fallback when hash/query is missing or invalid */
  defaultValue: T;
  /** Map common misspellings / legacy values → canonical tab */
  aliases?: Partial<Record<string, T>>;
  /**
   * Nested tabs: hash becomes `#namespace/tab` (e.g. `#records/history`).
   * Top-level tabs omit this and use `#tab`.
   */
  namespace?: string;
  /**
   * When hash is empty, accept legacy `?tab=` deep-links once, then mirror to hash.
   * Default true so existing sidebar links keep working.
   */
  acceptQueryFallback?: boolean;
  /** Query param name used for the one-time fallback. Default `"tab"`. */
  queryParam?: string;
};

export type UseHashTabResult<T extends string> = {
  tab: T;
  setTab: (value: string) => void;
  isTab: (value: T) => boolean;
};

function readRawHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "").trim();
}

function readQueryParam(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return new URLSearchParams(window.location.search).get(name)?.trim() || "";
  } catch {
    return "";
  }
}

function parseHashSegment(rawHash: string, namespace?: string): string {
  const cleaned = rawHash.replace(/^#/, "").trim().toLowerCase();
  if (!cleaned) return "";

  if (!namespace) {
    // Top-level: use first segment only (`invoices` from `invoices` or legacy `invoices/foo`)
    return cleaned.split("/")[0] || "";
  }

  const parts = cleaned.split("/").filter(Boolean);
  const ns = namespace.toLowerCase();
  if (parts[0] === ns) {
    return parts[1] || "";
  }
  // Hash belongs to another namespace — ignore
  return "";
}

function buildHash(tab: string, namespace?: string): string {
  return namespace ? `#${namespace}/${tab}` : `#${tab}`;
}

/**
 * Shared hash-synced tab state for every role dashboard.
 *
 * Usage:
 * ```tsx
 * const { tab, setTab } = useHashTab({
 *   tabs: ["plans", "invoices", "payments"] as const,
 *   defaultValue: "payments",
 * });
 * <Tabs value={tab} onValueChange={setTab}>...</Tabs>
 * ```
 */
export function useHashTab<T extends string>(
  options: UseHashTabOptions<T>,
): UseHashTabResult<T> {
  const {
    tabs,
    defaultValue,
    aliases,
    namespace,
    acceptQueryFallback = true,
    queryParam = "tab",
  } = options;

  const resolveTab = useCallback(
    (raw: string | null | undefined): T => {
      const normalized = String(raw || "")
        .trim()
        .toLowerCase();
      if (!normalized) return defaultValue;

      const aliased = aliases?.[normalized];
      if (aliased && (tabs as readonly string[]).includes(aliased)) {
        return aliased;
      }

      if ((tabs as readonly string[]).includes(normalized)) {
        return normalized as T;
      }

      return defaultValue;
    },
    [aliases, defaultValue, tabs],
  );

  const readTabFromLocation = useCallback((): T => {
    const fromHash = parseHashSegment(readRawHash(), namespace);
    if (fromHash) return resolveTab(fromHash);

    if (acceptQueryFallback && !namespace) {
      const fromQuery = readQueryParam(queryParam);
      if (fromQuery) return resolveTab(fromQuery);
    }

    return defaultValue;
  }, [acceptQueryFallback, defaultValue, namespace, queryParam, resolveTab]);

  const [tab, setTabState] = useState<T>(() => readTabFromLocation());

  const writeHash = useCallback(
    (next: T) => {
      if (typeof window === "undefined") return;
      const nextHash = buildHash(next, namespace);
      if (window.location.hash === nextHash) return;

      // Nested tabs: don't clobber a top-level hash that isn't our namespace
      if (namespace) {
        const current = readRawHash().toLowerCase();
        const currentNs = current.split("/")[0] || "";
        // Only write when parent namespace is active or hash empty/ours
        if (current && currentNs !== namespace.toLowerCase() && !current.includes("/")) {
          // Parent may still be on a different top-level tab — skip writing nested hash
          return;
        }
      }

      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${nextHash}`);
    },
    [namespace],
  );

  const setTab = useCallback(
    (value: string) => {
      const next = resolveTab(value);
      setTabState(next);
      writeHash(next);
    },
    [resolveTab, writeHash],
  );

  // Keep React state + hash in sync (refresh, back/forward, manual hash edits)
  useEffect(() => {
    const syncFromLocation = () => {
      const next = readTabFromLocation();
      setTabState(next);
      // Mirror query-only deep links into hash so refresh stays on the same tab
      writeHash(next);
    };

    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, [readTabFromLocation, writeHash]);

  const isTab = useCallback((value: T) => tab === value, [tab]);

  return { tab, setTab, isTab };
}
