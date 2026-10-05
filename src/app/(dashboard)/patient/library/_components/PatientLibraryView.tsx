"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, ChevronUp, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, PageHead, SearchBox, SegTabs, SoftCard, Surface, type TbdOption } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  LIBRARY_FOCUS,
  LibraryCardGrid,
  LibraryCardGridSkeleton,
  LibraryCover,
  LibraryError,
  LibraryPager,
} from "./LibraryBits";
import {
  SHELF_LABEL,
  topicLook,
  type LibraryCardItem,
  type LibraryShelfKey,
  type LibraryTabKey,
  type LibraryTopic,
} from "./library.logic";

export type LibraryLoadState = "loading" | "error" | "ready";

export interface LibraryFeatured {
  item: LibraryCardItem;
  /** "Dr. C. Deshmukh · 6 min read" */
  byline: string;
}

export interface LibraryShelf {
  key: LibraryShelfKey;
  items: LibraryCardItem[];
  total: number;
}

/** A shelf tab or a search: one paged list instead of the overview. */
export interface LibraryListing {
  state: LibraryLoadState;
  /** The search text the list was loaded for ("" on a plain shelf). */
  query: string;
  items: LibraryCardItem[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onClearSearch: () => void;
}

export interface PatientLibraryViewProps {
  /** State of the overview (featured, topics, shelves). */
  state: LibraryLoadState;
  onRetry: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  tab: LibraryTabKey;
  tabs: TbdOption<LibraryTabKey>[];
  onTabChange: (tab: LibraryTabKey) => void;
  /** The newest published post. */
  featured: LibraryFeatured | null;
  mostRead: LibraryCardItem[];
  topics: LibraryTopic[];
  /** Shelves that have something on them, in display order. */
  shelves: LibraryShelf[];
  /** Set on a shelf tab or while searching; the overview is hidden then. */
  listing: LibraryListing | null;
}

const TOPIC_PREVIEW = 8;

const EMPTY_SHELF: Record<LibraryShelfKey, { title: string; description: string }> = {
  articles: { title: "No articles yet", description: "When your clinic adds articles, they will show up here." },
  videos: { title: "No videos yet", description: "When your clinic adds videos, they will show up here." },
  guides: { title: "No guides yet", description: "When your clinic adds guides, they will show up here." },
  practices: { title: "No practices yet", description: "When your clinic adds practices, they will show up here." },
  courses: { title: "No courses yet", description: "When your clinic adds courses, they will show up here." },
};

function FeaturedCard({ featured }: { featured: LibraryFeatured }) {
  const { item, byline } = featured;
  return (
    <SoftCard className="flex h-full flex-col justify-center p-6 sm:p-7">
      <div className="flex items-center gap-6">
        <div className="flex min-h-[180px] min-w-0 flex-1 flex-col justify-center gap-2.5">
          <span className="self-start rounded-[8px] bg-[#facc15] px-[9px] py-[5px] text-[11px] font-extrabold uppercase leading-none tracking-[0.6px] text-[#422006]">
            Featured
          </span>
          <h2 className="m-0 text-2xl font-extrabold leading-[1.2] tracking-[-0.4px] text-ink">{item.title}</h2>
          {byline ? <span className="text-[13px] text-ink-muted">{byline}</span> : null}
          <div className="mt-1">
            <Button asChild className="h-10 px-3.5">
              <Link href={item.href}>{item.isVideo ? "Watch now" : "Read now"}</Link>
            </Button>
          </div>
        </div>
        {item.coverImageUrl ? (
          <LibraryCover
            src={item.coverImageUrl}
            category={item.category}
            isVideo={item.isVideo}
            eager
            className="hidden h-[160px] w-[212px] rounded-[18px] shadow-card sm:block"
          />
        ) : null}
      </div>
    </SoftCard>
  );
}

function MostReadCard({ items }: { items: LibraryCardItem[] }) {
  return (
    <Surface as="aside" className="h-full gap-1.5" aria-labelledby="library-most-read">
      <h2 id="library-most-read" className="m-0 text-base font-bold text-ink">
        Most read
      </h2>
      <ol className="m-0 flex list-none flex-col p-0">
        {items.map((item, index) => (
          <li key={item.id} className="border-b border-hair last:border-b-0">
            <Link href={item.href} className={cn("flex items-center gap-3 rounded-lg py-2.5 text-ink hover:text-brand-dark", LIBRARY_FOCUS)}>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-mint text-[13px] font-extrabold text-brand-dark"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-bold">{item.title}</span>
                <span className="truncate text-xs text-ink-muted">{item.meta || item.eyebrow}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </Surface>
  );
}

function TopicTiles({ topics }: { topics: LibraryTopic[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? topics : topics.slice(0, TOPIC_PREVIEW);
  const Toggle = showAll ? ChevronUp : ChevronDown;
  return (
    <section aria-labelledby="library-topics" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="library-topics" className="m-0 text-base font-bold text-ink">
          Explore topics
        </h2>
        {topics.length > TOPIC_PREVIEW ? (
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((open) => !open)}
            className={cn("inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark", LIBRARY_FOCUS)}
          >
            {showAll ? "Show less" : `See all ${topics.length}`}
            <Toggle className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0 sm:grid-cols-4 lg:grid-cols-8">
        {visible.map((topic) => {
          const { icon: Icon, tone } = topicLook(topic.name);
          return (
            <li key={topic.name} className="min-w-0">
              <Link
                href={topic.href}
                className={cn(
                  "flex h-full min-h-[100px] flex-col items-center justify-center gap-2 rounded-[18px] bg-card px-2 py-3 text-center text-[13px] font-semibold leading-tight text-ink shadow-card transition-shadow hover:shadow-md dark:border dark:border-border/70",
                  LIBRARY_FOCUS,
                )}
              >
                <span className={cn("flex size-[42px] shrink-0 items-center justify-center rounded-[14px] text-white", tone.solid)} aria-hidden="true">
                  <Icon className="size-5" strokeWidth={2.2} />
                </span>
                <span className="line-clamp-2 break-words">{topic.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ShelfSection({
  shelf,
  size,
  stacked = false,
  onSeeAll,
}: {
  shelf: LibraryShelf;
  /** Cards shown before "See all". */
  size: number;
  /** One column (the two half-width shelves of the overview). */
  stacked?: boolean;
  onSeeAll: (key: LibraryShelfKey) => void;
}) {
  const id = `library-shelf-${shelf.key}`;
  const items = shelf.items.slice(0, size);
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="m-0 text-base font-bold text-ink">
          {SHELF_LABEL[shelf.key]}
        </h2>
        {shelf.total > items.length ? (
          <button
            type="button"
            onClick={() => onSeeAll(shelf.key)}
            className={cn("inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark", LIBRARY_FOCUS)}
          >
            See all {shelf.total}
            <span className="sr-only"> {SHELF_LABEL[shelf.key].toLowerCase()}</span>
            <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <LibraryCardGrid items={items} {...(stacked ? { className: "sm:grid-cols-1 lg:grid-cols-1" } : {})} />
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading the health library">
      <Skeleton className="h-[236px] w-full rounded-3xl" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-[100px] rounded-[18px]" />
        ))}
      </div>
      <LibraryCardGridSkeleton count={6} label="Loading library items" />
    </div>
  );
}

function Overview({
  featured,
  mostRead,
  topics,
  shelves,
  onTabChange,
}: Pick<PatientLibraryViewProps, "featured" | "mostRead" | "topics" | "shelves" | "onTabChange">) {
  if (!featured && shelves.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={BookOpen}
          title="The library is empty for now"
          description="Health reads and videos from your clinic will show up here."
        />
      </Surface>
    );
  }

  // Guides and Courses sit side by side when both have something (as on the design).
  const halves = shelves.filter((shelf) => shelf.key === "guides" || shelf.key === "courses");
  const paired = halves.length === 2;
  const rows = shelves.filter((shelf) => !paired || (shelf.key !== "guides" && shelf.key !== "courses"));

  return (
    <>
      {featured ? (
        <div className={cn("grid items-stretch gap-5", mostRead.length > 0 && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
          <FeaturedCard featured={featured} />
          {mostRead.length > 0 ? <MostReadCard items={mostRead} /> : null}
        </div>
      ) : null}

      {topics.length > 0 ? <TopicTiles topics={topics} /> : null}

      {rows.map((shelf) => (
        <ShelfSection key={shelf.key} shelf={shelf} size={3} onSeeAll={onTabChange} />
      ))}

      {paired ? (
        <div className="grid gap-5 md:grid-cols-2 md:gap-4">
          {halves.map((shelf) => (
            <ShelfSection key={shelf.key} shelf={shelf} size={2} stacked onSeeAll={onTabChange} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function Listing({ tab, listing }: { tab: LibraryTabKey; listing: LibraryListing }) {
  const searching = listing.query.length > 0;
  const shelfName = tab === "all" ? "the library" : SHELF_LABEL[tab].toLowerCase();
  const heading = searching ? `Results for “${listing.query}”` : tab === "all" ? "All items" : SHELF_LABEL[tab];

  return (
    <section aria-labelledby="library-listing" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="library-listing" className="m-0 scroll-mt-4 text-base font-bold text-ink">
          {heading}
        </h2>
        {listing.state === "ready" && listing.total > 0 ? (
          <span className="text-[13px] text-ink-muted">
            {listing.total} {listing.total === 1 ? "item" : "items"}
            {searching && tab !== "all" ? ` in ${shelfName}` : ""}
          </span>
        ) : null}
      </div>

      {listing.state === "loading" ? (
        <LibraryCardGridSkeleton count={6} label="Loading library items" />
      ) : listing.state === "error" ? (
        <LibraryError
          title={searching ? "We could not run this search" : `We could not load ${shelfName}`}
          onRetry={listing.onRetry}
        />
      ) : listing.items.length > 0 ? (
        <>
          <LibraryCardGrid items={listing.items} />
          <LibraryPager page={listing.page} pageSize={listing.pageSize} total={listing.total} onPageChange={listing.onPageChange} />
        </>
      ) : searching ? (
        <Surface flush>
          <EmptyBlock
            icon={SearchX}
            tone="slate"
            title={`Nothing found for “${listing.query}”`}
            description={
              tab === "all"
                ? "Try another word. The search looks at titles, summaries and topics."
                : `Nothing in ${shelfName} matches. Try another word, or search the whole library.`
            }
            action={
              <Button variant="outline" size="md" onClick={listing.onClearSearch}>
                Clear search
              </Button>
            }
          />
        </Surface>
      ) : (
        <Surface flush>
          <EmptyBlock
            icon={BookOpen}
            title={tab === "all" ? "The library is empty for now" : EMPTY_SHELF[tab].title}
            description={
              tab === "all" ? "Health reads and videos from your clinic will show up here." : EMPTY_SHELF[tab].description
            }
          />
        </Surface>
      )}
    </section>
  );
}

/** Health Library home: search, shelf tabs, then the overview or one paged list. */
export function PatientLibraryView({
  state,
  onRetry,
  search,
  onSearchChange,
  tab,
  tabs,
  onTabChange,
  featured,
  mostRead,
  topics,
  shelves,
  listing,
}: PatientLibraryViewProps) {
  return (
    <>
      <PageHead
        backHref="/patient/health"
        backLabel="Health"
        title="Health Library"
        description="Health reads, videos and guides from your clinic"
      />

      <SearchBox
        value={search}
        onChange={onSearchChange}
        placeholder="Search by title or topic…"
        ariaLabel="Search the library"
        className="min-h-[52px] gap-3 rounded-2xl px-4 shadow-[0_2px_8px_rgba(4,120,87,0.06)]"
      />

      <SegTabs options={tabs} value={tab} onChange={onTabChange} ariaLabel="Library shelves" />

      {listing ? (
        <Listing tab={tab} listing={listing} />
      ) : state === "loading" ? (
        <OverviewSkeleton />
      ) : state === "error" ? (
        <LibraryError onRetry={onRetry} />
      ) : (
        <Overview featured={featured} mostRead={mostRead} topics={topics} shelves={shelves} onTabChange={onTabChange} />
      )}
    </>
  );
}
