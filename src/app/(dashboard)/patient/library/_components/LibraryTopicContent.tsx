"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import type { TbdOption } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHealthLibrary, useHealthLibraryOverview } from "@/hooks/query/useHealthLibrary";
import type { HealthLibraryListFilters } from "@/lib/actions/health-library.server";
import { LibraryTopicView, type LibraryTopicState, type LibraryTopicTop } from "./LibraryTopicView";
import {
  TOPIC_PAGE_SIZE,
  buildTopics,
  itemsLabel,
  libraryTopicHref,
  parsePage,
  toCardItem,
  topicBreakdown,
} from "./library.logic";

/**
 * Data container for one topic. A topic is a post `category`: the list comes from
 * `GET health-library?category=…` (the backend matches it without regard to case).
 */
export function LibraryTopicContent({ topic }: { topic: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isPending: authLoading } = useAuth();
  const signedIn = Boolean(session?.user?.id);
  const page = parsePage(searchParams.get("page"));

  const filters = useMemo<HealthLibraryListFilters>(
    () => ({ category: topic, limit: TOPIC_PAGE_SIZE, offset: (page - 1) * TOPIC_PAGE_SIZE }),
    [topic, page],
  );
  const list = useHealthLibrary(filters, { enabled: topic.length > 0 });
  // Shares the library home's cache: the topic switcher is built from the newest posts.
  const overview = useHealthLibraryOverview();

  const posts = useMemo(() => list.data?.items ?? [], [list.data]);
  const total = list.data?.total ?? 0;
  const key = topic.toLowerCase();

  const knownTopics = useMemo(() => buildTopics(overview.data?.latest.items ?? []), [overview.data]);
  const title = posts[0]?.category?.trim() || knownTopics.find((entry) => entry.name.toLowerCase() === key)?.name || topic;

  const topics = useMemo<TbdOption<string>[]>(() => {
    const options = knownTopics.map((entry) => ({ value: entry.name, label: entry.name }));
    // A topic that is not among the newest posts still gets its own tab.
    return options.some((option) => option.value.toLowerCase() === key) || !title
      ? options
      : [{ value: title, label: title }, ...options];
  }, [knownTopics, key, title]);
  const activeTopic = topics.find((option) => option.value.toLowerCase() === key)?.value ?? title;

  const items = useMemo(() => posts.map(toCardItem), [posts]);
  const top = useMemo<LibraryTopicTop | null>(() => {
    if (page !== 1 || items.length === 0) return null;
    const best = items.reduce((winner, item) => (item.viewCount > winner.viewCount ? item : winner));
    return { item: best, label: best.viewCount > 0 ? "Most read" : "Latest" };
  }, [items, page]);

  const state: LibraryTopicState =
    list.isFetching || (!list.data && !list.error && (authLoading || (signedIn && list.isPending)))
      ? "loading"
      : list.error && !list.data
        ? "error"
        : "ready";

  // The breakdown needs every item of the topic; with more than one page only the total is known.
  const description = total > 0 ? (total <= posts.length ? topicBreakdown(posts) : itemsLabel(total)) : "";

  return (
    <DashboardPageShell>
      <LibraryTopicView
        state={state}
        title={title}
        description={description}
        topics={topics}
        activeTopic={activeTopic}
        onTopicChange={(next) => router.push(libraryTopicHref(next))}
        top={top}
        items={items}
        firstNumber={(page - 1) * TOPIC_PAGE_SIZE + 1}
        total={total}
        page={page}
        pageSize={TOPIC_PAGE_SIZE}
        onPageChange={(next) => {
          const base = libraryTopicHref(title);
          router.replace(next > 1 ? `${base}?page=${next}` : base, { scroll: false });
          document.getElementById("library-topic-items")?.scrollIntoView({ block: "start" });
        }}
        onRetry={() => void list.refetch()}
      />
    </DashboardPageShell>
  );
}
