"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { useQueryData } from "../core/useQueryData";
import { useAuth } from "../auth/useAuth";
import { useAuthStore } from "@/stores/auth.store";
import {
  fetchHealthLibraryOverview,
  fetchHealthLibraryPost,
  fetchHealthLibraryPosts,
  type HealthLibraryList,
  type HealthLibraryListFilters,
  type HealthLibraryOverview,
  type HealthLibraryPost,
} from "@/lib/actions/health-library.server";

export type {
  HealthLibraryList,
  HealthLibraryListFilters,
  HealthLibraryMediaType,
  HealthLibraryOverview,
  HealthLibraryPost,
  HealthLibrarySection,
  HealthLibraryTab,
} from "@/lib/actions/health-library.server";

/** Query keys for the health library. Clinic-aware: posts belong to one clinic. */
export const healthLibraryKeys = {
  all: ["healthLibrary"] as const,
  list: (clinicId: string | undefined, filters: HealthLibraryListFilters = {}) =>
    [
      "healthLibrary",
      "list",
      clinicId,
      filters.tab ?? null,
      filters.mediaType ?? null,
      filters.category?.trim() || null,
      filters.search?.trim() || null,
      filters.limit ?? null,
      filters.offset ?? 0,
    ] as const,
  detail: (clinicId: string | undefined, id: string) => ["healthLibrary", "detail", clinicId, id] as const,
  overview: (clinicId: string | undefined) => ["healthLibrary", "overview", clinicId] as const,
};

export type UseHealthLibraryOptions = {
  enabled?: boolean;
};

const EMPTY_LIST: HealthLibraryList = { items: [], total: 0 };
const EMPTY_OVERVIEW: HealthLibraryOverview = {
  latest: EMPTY_LIST,
  articles: EMPTY_LIST,
  videos: EMPTY_LIST,
  guides: EMPTY_LIST,
  practices: EMPTY_LIST,
  courses: EMPTY_LIST,
};

function useLibraryScope() {
  const { session } = useAuth();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);
  const sessionUser = session?.user as
    | { id?: string; clinicId?: string; primaryClinicId?: string }
    | undefined;
  return {
    userId: sessionUser?.id,
    clinicId: sessionUser?.clinicId || sessionUser?.primaryClinicId || undefined,
    isAuthRefreshing,
  };
}

const libraryRetry = (failureCount: number, error: Error) => {
  const message = error.message || "";
  if (
    message.includes("Access denied") ||
    message.includes("Not authenticated") ||
    message.includes("Forbidden") ||
    message.includes("not found")
  ) {
    return false;
  }
  return failureCount < 2;
};

/**
 * Lists published health library posts for the signed-in user's clinic.
 *
 * Filters are optional: `tab` (ARTICLES / GUIDES / PRACTICES / COURSES), `mediaType`
 * (ARTICLE / VIDEO), `category`, `search`, `limit` and `offset`.
 * Resolves to `{ items: [], total: 0 }` when the user has no session or clinic yet, so a
 * strip or page can show its empty state without special cases.
 */
export const useHealthLibrary = (
  filters: HealthLibraryListFilters = {},
  options: UseHealthLibraryOptions = {}
) => {
  const { userId, clinicId, isAuthRefreshing } = useLibraryScope();

  return useQueryData<HealthLibraryList>(
    healthLibraryKeys.list(clinicId, filters),
    async () => {
      const result = await fetchHealthLibraryPosts(filters);
      if (!result.success) {
        if (
          result.code === "UNAUTHENTICATED" ||
          result.code === "CLINIC_CONTEXT_REQUIRED" ||
          result.code === "FORBIDDEN"
        ) {
          return EMPTY_LIST;
        }
        throw new Error(result.error || "Failed to fetch the health library");
      }
      return result.data;
    },
    {
      enabled: (options.enabled ?? true) && !!userId,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isAuthRefreshing,
      retry: libraryRetry,
      placeholderData: keepPreviousData,
    }
  );
};

/**
 * Loads one health library post. Resolves to `null` when it does not exist or the user may
 * not read it, so a page can show "not found" without catching an error.
 */
export const useHealthLibraryItem = (id: string | undefined, options: UseHealthLibraryOptions = {}) => {
  const { userId, clinicId, isAuthRefreshing } = useLibraryScope();
  const postId = String(id || "").trim();

  return useQueryData<HealthLibraryPost | null>(
    healthLibraryKeys.detail(clinicId, postId),
    async () => {
      const result = await fetchHealthLibraryPost(postId);
      if (!result.success) {
        if (
          result.code === "UNAUTHENTICATED" ||
          result.code === "CLINIC_CONTEXT_REQUIRED" ||
          result.code === "FORBIDDEN" ||
          result.code === "NOT_FOUND"
        ) {
          return null;
        }
        throw new Error(result.error || "Failed to fetch the library item");
      }
      return result.data;
    },
    {
      enabled: (options.enabled ?? true) && !!userId && !!postId,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isAuthRefreshing,
      retry: libraryRetry,
    }
  );
};

/**
 * The library home page in one request: the newest posts (featured item, topics, most read)
 * and the first cards and total of each shelf. Resolves to empty lists when the user has no
 * session or clinic yet.
 */
export const useHealthLibraryOverview = (options: UseHealthLibraryOptions = {}) => {
  const { userId, clinicId, isAuthRefreshing } = useLibraryScope();

  return useQueryData<HealthLibraryOverview>(
    healthLibraryKeys.overview(clinicId),
    async () => {
      const result = await fetchHealthLibraryOverview();
      if (!result.success) {
        if (
          result.code === "UNAUTHENTICATED" ||
          result.code === "CLINIC_CONTEXT_REQUIRED" ||
          result.code === "FORBIDDEN"
        ) {
          return EMPTY_OVERVIEW;
        }
        throw new Error(result.error || "Failed to fetch the health library");
      }
      return result.data;
    },
    {
      enabled: (options.enabled ?? true) && !!userId,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: !isAuthRefreshing,
      retry: libraryRetry,
    }
  );
};
