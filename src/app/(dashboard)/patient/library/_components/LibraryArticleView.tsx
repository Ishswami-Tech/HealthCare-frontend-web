"use client";

import Link from "next/link";
import { BadgeCheck, BookOpen, CalendarDays, ChevronLeft, Eye, Share2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, InitialsAvatar, Pill, SoftCard, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { BookVisitCard, LIBRARY_FOCUS, LibraryCover, LibraryError } from "./LibraryBits";
import { LibraryVideoPlayer } from "./LibraryVideoPlayer";
import {
  LIBRARY_HREF,
  LIBRARY_TONES,
  topicLook,
  type ArticleSection,
  type LibraryArticle,
  type LibraryCardItem,
  type LibraryToneKey,
} from "./library.logic";

export type LibraryArticleState = "loading" | "error" | "missing" | "ready";

export interface LibraryArticleViewProps {
  state: LibraryArticleState;
  article: LibraryArticle | null;
  /** Other items of the same topic. */
  related: LibraryCardItem[];
  relatedLoading?: boolean;
  onShare: () => void;
  onRetry: () => void;
}

/** Tints for the numbered section rows, in order. */
const SECTION_TONES: LibraryToneKey[] = ["blue", "green", "indigo", "violet", "amber", "rose"];

const ARTICLE_SHELL = "min-w-0 overflow-hidden rounded-3xl bg-card text-card-foreground shadow-card dark:border dark:border-border/70";
const LAYOUT = "grid items-start gap-5 lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]";

function BackLink() {
  return (
    <Link
      href={LIBRARY_HREF}
      className={cn("inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-ink-muted hover:text-ink", LIBRARY_FOCUS)}
    >
      <ChevronLeft className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
      Health Library
    </Link>
  );
}

function SectionRow({ section, index }: { section: ArticleSection; index: number }) {
  const tone = LIBRARY_TONES[SECTION_TONES[index % SECTION_TONES.length] ?? "blue"];
  const short = section.paragraphs.length <= 1 && (section.paragraphs[0]?.length ?? 0) <= 160;
  return (
    <li className={cn("flex gap-4 rounded-[18px] p-4", short ? "items-center" : "items-start", tone.wash)}>
      <span
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px] text-base font-extrabold text-white", tone.solid)}
        aria-hidden="true"
      >
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        {section.heading ? <h2 className="m-0 text-[15px] font-extrabold leading-snug text-ink">{section.heading}</h2> : null}
        {section.paragraphs.map((paragraph, at) => (
          <p key={at} className="m-0 whitespace-pre-line break-words text-sm leading-[1.55] text-ink-soft">
            {paragraph}
          </p>
        ))}
      </div>
    </li>
  );
}

function Article({ article }: { article: LibraryArticle }) {
  const { icon: TopicIcon, tone } = topicLook(article.category);
  return (
    <article className={ARTICLE_SHELL}>
      {article.video ? (
        <LibraryVideoPlayer
          source={article.video}
          title={article.title}
          posterUrl={article.coverImageUrl}
          category={article.category}
        />
      ) : article.coverImageUrl ? (
        <LibraryCover
          src={article.coverImageUrl}
          category={article.category}
          eager
          className="aspect-[720/410] w-full"
          iconClassName="size-12"
        />
      ) : (
        <div className={cn("flex h-[140px] items-center justify-center", tone.soft)} aria-hidden="true">
          <TopicIcon className="size-12" strokeWidth={1.8} />
        </div>
      )}

      <div className="flex flex-col gap-5 px-5 pb-7 pt-6 sm:px-9 sm:pb-8 sm:pt-7">
        <div className="flex flex-wrap items-center gap-2">
          {article.category ? (
            <Link href={article.topicHref} className={cn("rounded-[8px]", LIBRARY_FOCUS)}>
              <Pill tone={tone.pill}>{article.category}</Pill>
            </Link>
          ) : null}
          {article.lengthLabel ? <Pill tone={article.isVideo ? "video" : "slate"}>{article.lengthLabel}</Pill> : null}
        </div>

        <h1 className="m-0 break-words text-[26px] font-extrabold leading-[1.2] tracking-[-0.6px] text-ink sm:text-[30px]">
          {article.title}
        </h1>

        {article.authorName ? (
          <div className="flex items-center gap-3">
            <InitialsAvatar name={article.authorName} size={46} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm font-bold text-ink">{article.authorName}</span>
              <span className="flex items-center gap-1 text-[13px] font-semibold text-brand">
                {article.isDoctorAuthor ? <BadgeCheck className="size-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" /> : null}
                {article.authorRole}
              </span>
            </div>
          </div>
        ) : null}

        {article.views || article.published ? (
          <div className="flex flex-wrap gap-x-[22px] gap-y-2 border-y border-hair py-3 text-[13px] font-semibold text-ink-muted">
            {article.views ? (
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" strokeWidth={2.2} aria-hidden="true" />
                {article.views}
              </span>
            ) : null}
            {article.published ? (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" strokeWidth={2.2} aria-hidden="true" />
                <span className="sr-only">Published </span>
                {article.published}
              </span>
            ) : null}
          </div>
        ) : null}

        {article.summary.map((paragraph, index) => (
          <p key={index} className="m-0 whitespace-pre-line break-words text-base leading-[1.7] text-ink-soft">
            {paragraph}
          </p>
        ))}

        {article.sections.length > 0 ? (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {article.sections.map((section, index) => (
              <SectionRow key={index} section={section} index={index} />
            ))}
          </ol>
        ) : null}

        {article.whenToSeeDoctor.length > 0 ? (
          <SoftCard as="section" className="flex flex-col gap-3" aria-labelledby="library-see-doctor">
            <div className="flex items-center gap-2.5">
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[#047857] text-white" aria-hidden="true">
                <Stethoscope className="size-[18px]" strokeWidth={2.2} />
              </span>
              <h2 id="library-see-doctor" className="m-0 text-base font-extrabold text-brand-dark">
                When to see a doctor
              </h2>
            </div>
            {article.whenToSeeDoctor.map((paragraph, index) => (
              <p key={index} className="m-0 whitespace-pre-line break-words text-base font-semibold leading-normal text-ink">
                {paragraph}
              </p>
            ))}
          </SoftCard>
        ) : null}

        <p className="m-0 rounded-[18px] bg-well px-5 py-3.5 text-[13px] leading-relaxed text-ink-muted">
          This is general health information. It does not replace a visit to your doctor. In an emergency, call 112 or go to
          the nearest hospital.
        </p>
      </div>
    </article>
  );
}

function RelatedCard({ item }: { item: LibraryCardItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[20px] bg-card text-ink shadow-card transition-shadow hover:shadow-md dark:border dark:border-border/70",
        LIBRARY_FOCUS,
      )}
    >
      <LibraryCover
        src={item.coverImageUrl}
        category={item.category}
        isVideo={item.isVideo}
        className="h-[150px] w-full"
        iconClassName="size-9"
      />
      <span className="flex flex-col gap-1 px-4 pb-3.5 pt-3">
        <span className="line-clamp-2 text-sm font-bold leading-[1.3]">{item.title}</span>
        {item.kindMeta ? <span className="text-xs text-ink-muted">{item.kindMeta}</span> : null}
      </span>
    </Link>
  );
}

function ArticleSkeleton() {
  return (
    <div className={LAYOUT} aria-busy="true" aria-label="Loading this item">
      <div className={ARTICLE_SHELL}>
        <Skeleton className="aspect-[720/410] w-full rounded-none" />
        <div className="flex flex-col gap-5 px-5 pb-7 pt-6 sm:px-9">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-9 w-4/5 rounded-md" />
          <Skeleton className="h-11 w-56 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-11/12 rounded-md" />
          <Skeleton className="h-[76px] w-full rounded-[18px]" />
          <Skeleton className="h-[76px] w-full rounded-[18px]" />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-[152px] rounded-[20px]" />
        <Skeleton className="h-[214px] rounded-[20px]" />
      </div>
    </div>
  );
}

/** Reader for one library item: picture or video, title, author, text, then related items. */
export function LibraryArticleView({ state, article, related, relatedLoading = false, onShare, onRetry }: LibraryArticleViewProps) {
  const ready = state === "ready" && article;
  return (
    <>
      <div className="flex min-h-10 items-center justify-between gap-5">
        <BackLink />
        {ready ? (
          <Button variant="outline" className="h-10 px-3.5" onClick={onShare}>
            <Share2 aria-hidden="true" />
            Share
          </Button>
        ) : null}
      </div>

      {state === "loading" ? (
        <ArticleSkeleton />
      ) : state === "error" ? (
        <LibraryError title="We could not load this item" onRetry={onRetry} />
      ) : !ready ? (
        <Surface flush>
          <EmptyBlock
            icon={BookOpen}
            tone="slate"
            title="This item is not available"
            description="It may have been removed, or the link is not right."
            action={
              <Button asChild size="md">
                <Link href={LIBRARY_HREF}>Back to the Health Library</Link>
              </Button>
            }
          />
        </Surface>
      ) : (
        <div className={LAYOUT}>
          <Article article={article} />
          <div className="flex min-w-0 flex-col gap-5">
            <BookVisitCard
              title="Have a question about this?"
              description="Book a visit and ask your doctor."
              buttonLabel="Book now"
            />
            {relatedLoading ? (
              <Skeleton className="h-[214px] rounded-[20px]" />
            ) : related.length > 0 ? (
              <section aria-labelledby="library-related" className="flex min-w-0 flex-col gap-3">
                <h2 id="library-related" className="m-0 text-base font-bold text-ink">
                  {article.category ? `More on ${article.category}` : "Related reads"}
                </h2>
                <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-1">
                  {related.map((item) => (
                    <li key={item.id} className="min-w-0">
                      <RelatedCard item={item} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
