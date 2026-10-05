"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, PageHead, Pill, SegTabs, SoftCard, Surface, type TbdOption } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { BookVisitCard, LIBRARY_FOCUS, LIBRARY_GRID, LibraryCover, LibraryError, LibraryPager } from "./LibraryBits";
import { BOOK_VIDEO_VISIT_HREF, LIBRARY_HREF, type LibraryCardItem } from "./library.logic";

export type LibraryTopicState = "loading" | "error" | "ready";

export interface LibraryTopicTop {
  item: LibraryCardItem;
  /** "Most read" when people have opened it, otherwise "Latest". */
  label: string;
}

export interface LibraryTopicViewProps {
  state: LibraryTopicState;
  /** The category name, as the clinic wrote it. */
  title: string;
  /** "24 articles · 9 videos · 3 guides" */
  description: string;
  topics: TbdOption<string>[];
  activeTopic: string;
  onTopicChange: (topic: string) => void;
  /** The big card (first page only). */
  top: LibraryTopicTop | null;
  items: LibraryCardItem[];
  /** Number of the first row on this page (1, 31, …). */
  firstNumber: number;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

const ROW =
  "flex min-w-0 items-center gap-3.5 rounded-[20px] bg-card p-4 text-ink shadow-card dark:border dark:border-border/70";

function TopCard({ top }: { top: LibraryTopicTop }) {
  const { item, label } = top;
  return (
    <Link href={item.href} className={cn("block min-w-0 rounded-3xl text-ink", LIBRARY_FOCUS)}>
      <SoftCard className="flex h-full flex-col justify-center p-6 transition-shadow hover:shadow-md sm:p-7">
        <div className="flex items-center gap-6">
          <div className="flex min-h-[132px] min-w-0 flex-1 flex-col justify-center gap-2.5">
            <Pill tone="white" className="self-start">
              {label}
            </Pill>
            <h2 className="m-0 break-words text-2xl font-extrabold leading-[1.2] tracking-[-0.4px]">{item.title}</h2>
            {item.summary ? <p className="m-0 line-clamp-2 text-sm text-ink-soft">{item.summary}</p> : null}
          </div>
          {item.coverImageUrl ? (
            <LibraryCover
              src={item.coverImageUrl}
              category={item.category}
              isVideo={item.isVideo}
              eager
              className="hidden h-[132px] w-[176px] rounded-[18px] shadow-card sm:block"
            />
          ) : null}
        </div>
      </SoftCard>
    </Link>
  );
}

function TopicSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading this topic">
      <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Skeleton className="h-[188px] rounded-3xl" />
        <Skeleton className="h-[188px] rounded-[20px]" />
      </div>
      <div className={LIBRARY_GRID}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={ROW}>
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** One topic of the library: its most read item, a way to ask a doctor, then every item. */
export function LibraryTopicView({
  state,
  title,
  description,
  topics,
  activeTopic,
  onTopicChange,
  top,
  items,
  firstNumber,
  total,
  page,
  pageSize,
  onPageChange,
  onRetry,
}: LibraryTopicViewProps) {
  return (
    <>
      <PageHead
        backHref={LIBRARY_HREF}
        backLabel="Health Library"
        title={title}
        {...(state === "ready" && description ? { description } : {})}
      />

      {topics.length > 1 ? (
        <SegTabs options={topics} value={activeTopic} onChange={onTopicChange} ariaLabel="Library topics" />
      ) : null}

      {state === "loading" ? (
        <TopicSkeleton />
      ) : state === "error" ? (
        <LibraryError title="We could not load this topic" onRetry={onRetry} />
      ) : items.length === 0 ? (
        <Surface flush>
          <EmptyBlock
            icon={BookOpen}
            title="Nothing in this topic yet"
            description="When your clinic adds something on this topic, it will show up here."
            action={
              <Button asChild variant="outline" size="md">
                <Link href={LIBRARY_HREF}>Back to the Health Library</Link>
              </Button>
            }
          />
        </Surface>
      ) : (
        <>
          <div className={cn("grid items-stretch gap-5", top && "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]")}>
            {top ? <TopCard top={top} /> : null}
            <BookVisitCard
              title={`Questions about ${title}?`}
              description="Ask a doctor in a video visit."
              buttonLabel="Book"
              buttonIcon={Video}
              href={BOOK_VIDEO_VISIT_HREF}
              className="h-full p-[22px]"
            />
          </div>

          <section aria-labelledby="library-topic-items" className="flex min-w-0 flex-col gap-3">
            <h2 id="library-topic-items" className="m-0 scroll-mt-4 text-base font-bold text-ink">
              More in {title}
            </h2>
            <ol className={LIBRARY_GRID} start={firstNumber}>
              {items.map((item, index) => (
                <li key={item.id} className="min-w-0">
                  <Link href={item.href} className={cn(ROW, LIBRARY_FOCUS, "h-full transition-shadow hover:shadow-md")}>
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#047857] text-[15px] font-extrabold text-white"
                      aria-hidden="true"
                    >
                      {firstNumber + index}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span className="line-clamp-2 text-sm font-bold leading-snug">{item.title}</span>
                      {item.kindMeta ? <span className="truncate text-xs text-ink-muted">{item.kindMeta}</span> : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
            <LibraryPager page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
          </section>
        </>
      )}
    </>
  );
}
