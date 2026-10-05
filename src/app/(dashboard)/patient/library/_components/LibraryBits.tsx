"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, CircleAlert, Play, RotateCcw, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { BOOK_VISIT_HREF, topicLook, type LibraryCardItem, type LibraryIcon } from "./library.logic";

/** White list card, the same shape as the Health Library strip on the home page. */
export const LIBRARY_CARD =
  "flex min-w-0 items-center gap-3.5 rounded-[20px] bg-card p-3 text-ink shadow-card dark:border dark:border-border/70";

export const LIBRARY_FOCUS = "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";

/**
 * Cover picture in a fixed box. Covers can live on any host (uploads or a pasted URL), so this
 * is a plain `<img>`; a missing or broken picture shows a soft tinted placeholder instead.
 */
export function LibraryCover({
  src,
  category,
  isVideo = false,
  alt = "",
  className,
  iconClassName = "size-6",
  showPlay = isVideo,
  eager = false,
}: {
  src: string | null | undefined;
  category?: string;
  isVideo?: boolean;
  alt?: string;
  /** Size and radius of the box, for example `h-[72px] w-24 rounded-xl`. */
  className?: string;
  iconClassName?: string;
  /** Dark play circle over the picture (video cards). */
  showPlay?: boolean;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const usable = src && failedSrc !== src ? src : null;
  const Icon = isVideo ? Play : BookOpen;

  return (
    <span className={cn("relative block shrink-0 overflow-hidden", !usable && topicLook(category).tone.soft, className)}>
      {usable ? (
        <img
          src={usable}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSrc(usable)}
          className="block size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center" aria-hidden="true">
          <Icon className={iconClassName} strokeWidth={2.2} />
        </span>
      )}
      {usable && showPlay ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex size-[30px] items-center justify-center rounded-full bg-[rgba(15,23,42,0.75)] text-white">
            <Play className="size-3 translate-x-px fill-current" strokeWidth={2.4} />
          </span>
        </span>
      ) : null}
    </span>
  );
}

/** One library card: cover, coloured label, title, second line. */
export function LibraryCard({ item }: { item: LibraryCardItem }) {
  const { tone } = topicLook(item.category);
  return (
    <Link href={item.href} className={cn(LIBRARY_CARD, LIBRARY_FOCUS, "h-full transition-shadow hover:shadow-md")}>
      <LibraryCover src={item.coverImageUrl} category={item.category} isVideo={item.isVideo} className="h-[72px] w-24 rounded-xl" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {item.eyebrow ? (
          <span className={cn("truncate text-[11px] font-extrabold uppercase tracking-[0.4px]", tone.text)}>{item.eyebrow}</span>
        ) : null}
        <span className="line-clamp-2 text-sm font-bold leading-[1.3]">{item.title}</span>
        {item.meta ? <span className="truncate text-xs text-ink-muted">{item.meta}</span> : null}
      </span>
    </Link>
  );
}

export function LibraryCardSkeleton() {
  return (
    <div className={LIBRARY_CARD}>
      <Skeleton className="h-[72px] w-24 shrink-0 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-1/3 rounded-md" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
        <Skeleton className="h-3 w-1/2 rounded-md" />
      </div>
    </div>
  );
}

export const LIBRARY_GRID = "m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4";

export function LibraryCardGrid({ items, className }: { items: LibraryCardItem[]; className?: string }) {
  return (
    <ul className={cn(LIBRARY_GRID, className)}>
      {items.map((item) => (
        <li key={item.id} className="min-w-0">
          <LibraryCard item={item} />
        </li>
      ))}
    </ul>
  );
}

export function LibraryCardGridSkeleton({ count = 6, label }: { count?: number; label: string }) {
  return (
    <div className={LIBRARY_GRID} aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <LibraryCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** "Could not load" card with the one way out: try again. */
export function LibraryError({
  title = "We could not load the library",
  description = "Check your connection and try again.",
  onRetry,
  action,
}: {
  title?: string;
  description?: string;
  onRetry?: (() => void) | undefined;
  action?: ReactNode;
}) {
  return (
    <Surface flush role="alert">
      <EmptyBlock
        icon={CircleAlert}
        tone="rose"
        title={title}
        description={description}
        action={
          action ??
          (onRetry ? (
            <Button variant="outline" size="md" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          ) : null)
        }
      />
    </Surface>
  );
}

/** Previous / next for a paged list. Hidden when everything fits on one page. */
export function LibraryPager({
  page,
  pageSize,
  total,
  onPageChange,
  isBusy = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isBusy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const current = Math.min(Math.max(1, page), pages);
  const first = (current - 1) * pageSize + 1;
  const last = Math.min(total, current * pageSize);
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[13px] text-ink-muted" aria-live="polite">
        Showing {first}–{last} of {total}
      </span>
      <span className="flex items-center gap-2">
        <Button variant="outline" disabled={current <= 1 || isBusy} onClick={() => onPageChange(current - 1)}>
          <ChevronLeft aria-hidden="true" />
          Previous
        </Button>
        <Button variant="outline" disabled={current >= pages || isBusy} onClick={() => onPageChange(current + 1)}>
          Next
          <ChevronRight aria-hidden="true" />
        </Button>
      </span>
    </nav>
  );
}

/** The one amber button of the reading screens: book a visit to ask a doctor. */
export function BookVisitCard({
  title,
  description,
  buttonLabel = "Book a visit",
  href = BOOK_VISIT_HREF,
  buttonIcon: ButtonIcon,
  className,
}: {
  title: string;
  description: string;
  buttonLabel?: string;
  href?: string;
  buttonIcon?: LibraryIcon;
  className?: string;
}) {
  return (
    <Surface as="aside" className={cn("gap-4", className)} aria-label="Book a visit">
      <div className="flex items-center gap-3.5">
        <IconBox icon={Stethoscope} tone="mint" size={52} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="break-words text-[15px] font-extrabold text-ink">{title}</span>
          <span className="text-[13px] text-ink-muted">{description}</span>
        </div>
      </div>
      <div className="flex-1" />
      <Button asChild variant="action" size="md" className="w-full">
        <Link href={href}>
          {ButtonIcon ? <ButtonIcon aria-hidden="true" /> : null}
          {buttonLabel}
        </Link>
      </Button>
    </Surface>
  );
}
