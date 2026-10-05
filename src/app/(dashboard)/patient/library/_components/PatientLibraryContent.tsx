"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import type { TbdOption } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHealthLibrary, useHealthLibraryOverview } from "@/hooks/query/useHealthLibrary";
import type { HealthLibraryListFilters } from "@/lib/actions/health-library.server";
import {
  PatientLibraryView,
  type LibraryFeatured,
  type LibraryListing,
  type LibraryLoadState,
  type LibraryShelf,
} from "./PatientLibraryView";
import {
  LIBRARY_HREF,
  LIBRARY_PAGE_SIZE,
  LIBRARY_SHELVES,
  SHELF_FILTERS,
  SHELF_LABEL,
  authorDisplayName,
  buildTopics,
  mostRead,
  parseLibraryTab,
  parsePage,
  toCardItem,
  videoLengthLabel,
  type LibraryTabKey,
} from "./library.logic";

const SEARCH_DELAY_MS = 350;
const MOST_READ_SIZE = 3;

/**
 * Data container for the Health Library home. The shelf, the search text and the page live in
 * the URL (`?tab=videos&q=sleep&page=2`), so coming back from an article keeps the place.
 */
export default function PatientLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isPending: authLoading } = useAuth();
  const signedIn = Boolean(session?.user?.id);

  const tab = parseLibraryTab(searchParams.get("tab"));
  const query = (searchParams.get("q") ?? "").trim();
  const page = parsePage(searchParams.get("page"));
  const [searchText, setSearchText] = useState(query);

  const goTo = useCallback(
    (next: { tab: LibraryTabKey; q: string; page: number }) => {
      const params = new URLSearchParams();
      if (next.tab !== "all") params.set("tab", next.tab);
      if (next.q) params.set("q", next.q);
      if (next.page > 1) params.set("page", String(next.page));
      const suffix = params.toString();
      router.replace(suffix ? `${LIBRARY_HREF}?${suffix}` : LIBRARY_HREF, { scroll: false });
    },
    [router],
  );

  // The search box filters through the API's `search` param once typing pauses.
  useEffect(() => {
    const wanted = searchText.trim();
    if (wanted === query) return undefined;
    const timer = window.setTimeout(() => goTo({ tab, q: wanted, page: 1 }), SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [searchText, query, tab, goTo]);

  const overview = useHealthLibraryOverview();

  const listMode = tab !== "all" || query.length > 0;
  const listFilters = useMemo<HealthLibraryListFilters>(
    () => ({
      ...(tab !== "all" ? SHELF_FILTERS[tab] : {}),
      ...(query ? { search: query } : {}),
      limit: LIBRARY_PAGE_SIZE,
      offset: (page - 1) * LIBRARY_PAGE_SIZE,
    }),
    [tab, query, page],
  );
  const list = useHealthLibrary(listFilters, { enabled: listMode });

  const model = useMemo(() => {
    const data = overview.data;
    const latest = data?.latest.items ?? [];
    const newest = latest[0];
    const featured: LibraryFeatured | null = newest
      ? {
          item: toCardItem(newest),
          byline: [
            authorDisplayName(newest.authorName, newest.authorRole),
            newest.readTime || videoLengthLabel(newest.videoDurationSeconds),
          ]
            .filter(Boolean)
            .join(" · "),
        }
      : null;
    const shelves: LibraryShelf[] = LIBRARY_SHELVES.map((key) => ({
      key,
      items: (data?.[key].items ?? []).map(toCardItem),
      total: data?.[key].total ?? 0,
    })).filter((shelf) => shelf.items.length > 0);
    return {
      featured,
      shelves,
      topics: buildTopics(latest),
      mostRead: mostRead(latest, MOST_READ_SIZE).map(toCardItem),
    };
  }, [overview.data]);

  // Practices is a real shelf of the API, but it is only offered once it has something on it.
  const tabs = useMemo<TbdOption<LibraryTabKey>[]>(() => {
    const data = overview.data;
    const shelfTabs = LIBRARY_SHELVES.filter(
      (key) => key !== "practices" || tab === "practices" || (data?.practices.total ?? 0) > 0,
    ).map((key) => ({
      value: key,
      label: SHELF_LABEL[key],
      ...(data ? { count: data[key].total } : {}),
    }));
    return [{ value: "all", label: "All" }, ...shelfTabs];
  }, [overview.data, tab]);

  const waiting = (pending: boolean) => authLoading || (signedIn && pending);
  const overviewState: LibraryLoadState = overview.data
    ? "ready"
    : overview.error
      ? "error"
      : waiting(overview.isPending)
        ? "loading"
        : "ready";

  const listItems = list.data?.items ?? [];
  const listing: LibraryListing | null = listMode
    ? {
        // A shelf or page switch shows skeletons, not the previous list under the new heading.
        state:
          list.isFetching || (!list.data && !list.error && waiting(list.isPending))
            ? "loading"
            : list.error && !list.data
              ? "error"
              : "ready",
        query,
        items: listItems.map(toCardItem),
        total: list.data?.total ?? 0,
        page,
        pageSize: LIBRARY_PAGE_SIZE,
        onPageChange: (next) => {
          goTo({ tab, q: query, page: next });
          // The dashboard scrolls inside <main>, so bring the list heading back into view.
          document.getElementById("library-listing")?.scrollIntoView({ block: "start" });
        },
        onRetry: () => void list.refetch(),
        onClearSearch: () => {
          setSearchText("");
          goTo({ tab, q: "", page: 1 });
        },
      }
    : null;

  return (
    <DashboardPageShell>
      <PatientLibraryView
        state={overviewState}
        onRetry={() => void overview.refetch()}
        search={searchText}
        onSearchChange={setSearchText}
        tab={tab}
        tabs={tabs}
        onTabChange={(next) => goTo({ tab: next, q: query, page: 1 })}
        featured={model.featured}
        mostRead={model.mostRead}
        topics={model.topics}
        shelves={model.shelves}
        listing={listing}
      />
    </DashboardPageShell>
  );
}
