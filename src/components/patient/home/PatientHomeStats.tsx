import Link from "next/link";
import { Calendar, ChevronRight, CreditCard, FileText, Pill, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { HomeStat, HomeStatKey } from "./types";

const LOOK: Record<HomeStatKey, { icon: LucideIcon; well: string }> = {
  appointments: { icon: Calendar, well: "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300" },
  medicines: { icon: Pill, well: "bg-[#dcf6f3] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300" },
  records: { icon: FileText, well: "bg-[#eff6ff] text-[#1d4ed8] dark:bg-blue-500/15 dark:text-blue-300" },
  payments: { icon: CreditCard, well: "bg-[#fff5d2] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300" },
};

const CARD =
  "flex min-w-0 items-center gap-3.5 rounded-[18px] bg-card p-4 text-ink shadow-card dark:border dark:border-border/70";

/**
 * The four Home numbers. Each card links to its page. A number the API did not provide is
 * simply not in `stats`, so its card is left out instead of showing a made-up value.
 */
export function PatientHomeStats({ stats, isLoading = false }: { stats: HomeStat[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-busy="true" aria-label="Loading your numbers">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={CARD}>
            <Skeleton className="size-11 shrink-0 rounded-[14px]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-6 w-10 rounded-md" />
              <Skeleton className="h-3.5 w-24 max-w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => {
        const { icon: Icon, well } = LOOK[stat.key];
        return (
          <Link
            key={stat.key}
            href={stat.href}
            className={cn(
              CARD,
              "transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
            )}
          >
            <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-[14px]", well)} aria-hidden="true">
              <Icon className="size-5" strokeWidth={2.2} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[22px] font-extrabold leading-[1.1]">{stat.value}</span>
              <span className="text-[13px] leading-snug text-ink-muted">{stat.label}</span>
            </span>
            <ChevronRight className="hidden size-4 shrink-0 text-ink-soft sm:block" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
