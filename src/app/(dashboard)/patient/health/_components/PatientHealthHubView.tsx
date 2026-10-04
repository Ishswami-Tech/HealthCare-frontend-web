"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  ChevronRight,
  CircleAlert,
  Droplet,
  FileText,
  Heart,
  Pill as PillIcon,
  Play,
  Users,
  Weight,
  type LucideIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Note, PageHead } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { HomeLibraryItem } from "@/components/patient/home/types";
import type { VitalKey, VitalTile } from "./patient-health.logic";

const VITAL_LOOK: Record<VitalKey, { icon: LucideIcon; well: string; filled?: boolean }> = {
  heartRate: { icon: Heart, well: "bg-[#fee2e2] text-[#dc2626] dark:bg-red-500/15 dark:text-red-300", filled: true },
  bloodPressure: { icon: Activity, well: "bg-[#e0e7ff] text-[#4f46e5] dark:bg-indigo-500/15 dark:text-indigo-300" },
  bloodSugar: { icon: Droplet, well: "bg-[#fef3c7] text-[#d97706] dark:bg-amber-500/15 dark:text-amber-300", filled: true },
  weight: { icon: Weight, well: "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300" },
};

const CARD = "min-w-0 rounded-[20px] bg-card text-ink shadow-card dark:border dark:border-border/70";
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
  /** The four tiles in order. A tile whose `value` is null shows "No readings yet". */
  vitals: VitalTile[];
  /** "Vitals updated today, 8:30 am". Empty when there is no reading. */
  vitalsUpdatedLabel: string;
  isVitalsLoading?: boolean;
  /** The health record could not be loaded. */
  vitalsFailed?: boolean;
  onRetry?: () => void;
  cards: HealthHubCard[];
  library: { items: HomeLibraryItem[]; isLoading: boolean };
  /** The Records section (medical history, vitals history, allergies and so on). */
  children?: ReactNode;
}

/** My Health: latest vitals, the three doors (reports, medicines, family), the library, then Records. */
export function PatientHealthHubView({
  vitals,
  vitalsUpdatedLabel,
  isVitalsLoading = false,
  vitalsFailed = false,
  onRetry,
  cards,
  library,
  children,
}: PatientHealthHubViewProps) {
  const hasReading = vitals.some((tile) => tile.value !== null);
  const description = isVitalsLoading
    ? undefined
    : vitalsFailed
      ? "Your reports, medicines and records in one place."
      : hasReading
        ? vitalsUpdatedLabel || "Your latest vitals"
        : "No vitals yet. Your clinic adds them at each visit.";

  return (
    <>
      <PageHead title="My Health" description={description} />

      {vitalsFailed ? (
        <Note tone="rose" icon={CircleAlert}>
          We could not load your vitals.{" "}
          {onRetry ? (
            <button type="button" onClick={onRetry} className="font-bold underline underline-offset-2">
              Try again
            </button>
          ) : null}
        </Note>
      ) : (
        <section aria-label="Latest vitals" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {vitals.map((tile) => {
            const look = VITAL_LOOK[tile.key];
            const Icon = look.icon;
            return (
              <div key={tile.key} className={cn(CARD, "flex flex-col gap-3.5 p-[18px]")}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn("flex size-[38px] shrink-0 items-center justify-center rounded-[11px]", look.well)}
                    aria-hidden="true"
                  >
                    <Icon className="size-[18px]" strokeWidth={2} {...(look.filled ? { fill: "currentColor" } : {})} />
                  </span>
                  <span className="min-w-0 text-[13px] leading-tight text-ink-muted">{tile.label}</span>
                </div>
                {isVitalsLoading ? (
                  <Skeleton className="h-[31px] w-24 rounded-md" />
                ) : tile.value !== null ? (
                  <span className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.4px] text-ink">
                    {tile.value}{" "}
                    <span className="text-[13px] font-semibold tracking-normal text-ink-muted">{tile.unit}</span>
                  </span>
                ) : (
                  <span className="flex min-h-[31px] items-center text-sm font-semibold text-ink-muted">No readings yet</span>
                )}
              </div>
            );
          })}
        </section>
      )}

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
