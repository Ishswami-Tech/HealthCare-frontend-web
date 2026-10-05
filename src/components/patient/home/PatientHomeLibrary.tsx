"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SegTabs, type TbdOption } from "@/components/tbd";
import type { HomeLibraryItem, HomeLibraryTab } from "./types";

const TABS: TbdOption<HomeLibraryTab>[] = [
  { value: "articles", label: "Articles" },
  { value: "videos", label: "Videos" },
  { value: "guides", label: "Guides" },
  { value: "courses", label: "Courses" },
];

const CARD = "flex min-w-0 items-center gap-3.5 rounded-[20px] bg-card p-3 text-ink shadow-card dark:border dark:border-border/70";

function Cover({ item }: { item: HomeLibraryItem }) {
  const [failed, setFailed] = useState(false);
  if (item.coverImageUrl && !failed) {
    return (
      <Image
        src={item.coverImageUrl}
        alt=""
        width={84}
        height={64}
        unoptimized
        onError={() => setFailed(true)}
        className="h-16 w-[84px] shrink-0 rounded-xl object-cover"
      />
    );
  }
  const Icon = item.isVideo ? Play : BookOpen;
  return (
    <span
      className="flex h-16 w-[84px] shrink-0 items-center justify-center rounded-xl bg-[#f1ebff] text-[#7c3aed] dark:bg-violet-500/15 dark:text-violet-300"
      aria-hidden="true"
    >
      <Icon className="size-6" strokeWidth={2.2} />
    </span>
  );
}

export interface PatientHomeLibraryProps {
  tab: HomeLibraryTab;
  onTabChange: (tab: HomeLibraryTab) => void;
  /** Published items for the current tab. Never sample data. */
  items: HomeLibraryItem[];
  isLoading?: boolean;
}

/** Health Library strip: four tabs and up to three cards from the clinic's library. */
export function PatientHomeLibrary({ tab, onTabChange, items, isLoading = false }: PatientHomeLibraryProps) {
  return (
    <section aria-labelledby="patient-home-library" className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="patient-home-library" className="m-0 text-base font-bold text-ink">
          Health Library
        </h2>
        <Link
          href="/patient/library"
          className="inline-flex items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          See all
          <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      </div>

      <SegTabs options={TABS} value={tab} onChange={onTabChange} ariaLabel="Health library sections" />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4" aria-busy="true" aria-label="Loading the health library">
          {[0, 1, 2].map((index) => (
            <div key={index} className={CARD}>
              <Skeleton className="h-16 w-[84px] shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-4/5 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <Link
                href={`/patient/library/${encodeURIComponent(item.id)}`}
                className={`${CARD} transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40`}
              >
                <Cover item={item} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="line-clamp-2 text-sm font-bold leading-snug">{item.title}</span>
                  {item.meta ? <span className="truncate text-xs text-ink-muted">{item.meta}</span> : null}
                </span>
                <ChevronRight className="size-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 rounded-[20px] border border-dashed border-line px-5 py-6 text-center text-[13px] text-ink-muted">
          Nothing here yet. New health reads from your clinic will show up here.
        </p>
      )}
    </section>
  );
}
