"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleAlert,
  FileText,
  Pill as PillIcon,
  Play,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Note, PageHead, TBD_SURFACE } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { HomeLibraryItem } from "@/components/patient/home/types";
const CARD = cn(TBD_SURFACE, "min-w-0 text-ink");
const FOCUS = "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";

export interface HealthHubCard {
  key: "reports" | "medicines" | "family";
  /** Second line of the card. null while it loads. */
  detail: string | null;
}

const HUB_LOOK: Record<HealthHubCard["key"], { title: string; href: string; icon: LucideIcon; well: string }> = {
  reports: {
    title: "Reports & Lab",
    href: "/patient/health/reports",
    icon: FileText,
    well: "bg-[#fdf0e1] text-[#ea8a1b] dark:bg-orange-500/15 dark:text-orange-300",
  },
  medicines: {
    title: "Prescriptions",
    href: "/patient/health/medicines",
    icon: PillIcon,
    well: "bg-[#e6effd] text-[#2563eb] dark:bg-blue-500/15 dark:text-blue-300",
  },
  family: {
    title: "Family health",
    href: "/patient/family",
    icon: Users,
    well: "bg-[#efeafd] text-[#6d28d9] dark:bg-violet-500/15 dark:text-violet-300",
  },
};

function LibraryCover({ item }: { item: HomeLibraryItem }) {
  const [failed, setFailed] = useState(false);
  if (item.coverImageUrl && !failed) {
    return (
      <Image
        src={item.coverImageUrl}
        alt=""
        width={92}
        height={68}
        unoptimized
        onError={() => setFailed(true)}
        className="h-[68px] w-[92px] shrink-0 rounded-xl object-cover"
      />
    );
  }
  const Icon = item.isVideo ? Play : BookOpen;
  return (
    <span
      className="flex h-[68px] w-[92px] shrink-0 items-center justify-center rounded-xl bg-[#f1ebff] text-[#7c3aed] dark:bg-violet-500/15 dark:text-violet-300"
      aria-hidden="true"
    >
      <Icon className="size-6" strokeWidth={2.2} />
    </span>
  );
}

export interface PatientHealthHubViewProps {
  /** The health record could not be loaded. */
  failed?: boolean;
  onRetry?: () => void;
  cards: HealthHubCard[];
  library: { items: HomeLibraryItem[]; isLoading: boolean };
  /** The Records section (medical history, prescriptions, reports, allergies). */
  children?: ReactNode;
}

/**
 * My Health: the three doors (reports, medicines, family), the library, then Records.
 * Product rule: no vitals anywhere (no tiles, no history tab).
 */
export function PatientHealthHubView({ failed = false, onRetry, cards, library, children }: PatientHealthHubViewProps) {
  return (
    <>
      <PageHead title="My Health" description="Your reports, medicines and records in one place." />

      {failed ? (
        <Note tone="rose" icon={CircleAlert}>
          We could not load your health record.{" "}
          {onRetry ? (
            <button type="button" onClick={onRetry} className="font-bold underline underline-offset-2">
              Try again
            </button>
          ) : null}
        </Note>
      ) : null}

      <nav aria-label="Health sections" className="grid gap-3 md:grid-cols-3 lg:gap-4">
        {cards.map((card) => {
          const look = HUB_LOOK[card.key];
          const Icon = look.icon;
          return (
            <Link key={card.key} href={look.href} className={cn(CARD, FOCUS, "flex items-center gap-3.5 p-4")}>
              <span
                className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px]", look.well)}
                aria-hidden="true"
              >
                <Icon className="size-5" strokeWidth={2.2} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold">{look.title}</span>
                {card.detail === null ? (
                  <Skeleton className="my-0.5 h-3 w-28 rounded" />
                ) : (
                  <span className="text-xs text-ink-muted">{card.detail}</span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>

      <section aria-labelledby="patient-health-library" className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="patient-health-library" className="m-0 text-base font-bold text-ink">
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

        {library.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4" aria-busy="true" aria-label="Loading the health library">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex min-w-0 items-center gap-3.5 rounded-[18px] bg-card p-3 shadow-card dark:border dark:border-border/70">
                <Skeleton className="h-[68px] w-[92px] shrink-0 rounded-xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : library.items.length > 0 ? (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {library.items.map((item) => (
              <li key={item.id} className="min-w-0">
                <Link
                  href={`/patient/library/${encodeURIComponent(item.id)}`}
                  className={cn(
                    "flex min-w-0 items-center gap-3.5 rounded-[18px] bg-card p-3 text-ink shadow-card dark:border dark:border-border/70",
                    FOCUS,
                  )}
                >
                  <LibraryCover item={item} />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="line-clamp-2 text-sm font-bold leading-snug">{item.title}</span>
                    {item.meta ? <span className="truncate text-xs text-ink-muted">{item.meta}</span> : null}
                  </span>
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

      {children}
    </>
  );
}
