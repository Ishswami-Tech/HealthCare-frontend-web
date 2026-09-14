import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * One spacing scale for every dashboard page.
 *
 * Pages reference these instead of inventing their own `p-3 / p-3.5 / sm:p-4 /
 * lg:p-5` combinations — that drift is what made each screen sit on a slightly
 * different grid.
 */
export const DASHBOARD_SPACING = {
  /** Vertical rhythm between top-level page sections. */
  page: "gap-y-5",
  /** Vertical rhythm inside a section. */
  section: "gap-y-4",
  /** Padding for a card header strip. */
  cardHead: "px-[18px] py-3.5",
  /** Padding for a card body. */
  card: "p-[18px]",
  /** Padding for nested rows inside a card. */
  row: "p-3.5",
  /** Gap for every responsive grid of cards. */
  grid: "gap-3.5",
} as const;

/** Neutral surface shared by all dashboard panels. */
export const DASHBOARD_SURFACE =
  "rounded-2xl border border-border bg-card shadow-sm";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/**
 * Outer panel. Content is laid out edge to edge so a stat strip or tab rail can
 * sit flush against the border — use `DashboardCardBody` for padded content.
 */
export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(DASHBOARD_SURFACE, "overflow-hidden", className)}>
      {children}
    </section>
  );
}

export function DashboardCardHead({
  title,
  icon,
  children,
  className,
}: {
  title: ReactNode;
  /** Small brand-tinted glyph shown before the title. */
  icon?: ReactNode;
  /** Right-aligned actions. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex items-center gap-2.5 border-b border-border",
        DASHBOARD_SPACING.cardHead,
        className,
      )}
    >
      <h2 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground">
        {icon ? <span className="text-emerald-600 dark:text-emerald-400">{icon}</span> : null}
        {title}
      </h2>
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function DashboardCardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn(DASHBOARD_SPACING.card, className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Stat strip
// ---------------------------------------------------------------------------

export type DashboardStatTone = "brand" | "info" | "warn" | "violet" | "crit" | "plain";

const STAT_TONES: Record<DashboardStatTone, string> = {
  brand:
    "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300",
  info: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-300",
  warn: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300",
  violet:
    "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950/40 dark:border-violet-900/60 dark:text-violet-300",
  crit: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300",
  plain: "bg-muted border-border text-muted-foreground",
};

export interface DashboardStatItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: DashboardStatTone;
  isPending?: boolean;
}

/**
 * Edge-to-edge KPI row. The 1px gap over a border-coloured background draws the
 * hairline dividers, so the cells share one surface instead of floating as
 * separate cards with their own shadows.
 */
export function DashboardStatStrip({
  items,
  columns = 4,
  className,
}: {
  items: DashboardStatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const columnClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={cn("grid grid-cols-2 gap-px bg-border", columnClass, className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 items-start gap-3 bg-card px-[18px] py-4"
        >
          {item.icon ? (
            <span
              className={cn(
                "flex size-[30px] shrink-0 items-center justify-center rounded-lg border",
                STAT_TONES[item.tone ?? "plain"],
              )}
            >
              {item.icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="truncate text-[10.5px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
              {item.label}
            </div>
            {item.isPending ? (
              <Skeleton className="mt-1.5 h-6 w-16 rounded-md" />
            ) : (
              <div className="mt-0.5 truncate font-mono text-2xl font-medium leading-tight tracking-tight text-foreground">
                {item.value}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function DashboardEmpty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 px-5 py-11 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-lg font-medium text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-[46ch] text-[13.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card (standalone tile — use where a full strip does not fit)
// ---------------------------------------------------------------------------

interface DashboardStatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  isPending?: boolean;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  hint,
  icon,
  isPending = false,
  className,
}: DashboardStatCardProps) {
  return (
    <div className={cn(DASHBOARD_SURFACE, "flex flex-col gap-2 p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[10.5px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
          {label}
        </span>
        {icon ? (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
            {icon}
          </span>
        ) : null}
      </div>
      {isPending ? (
        <Skeleton className="h-7 w-20 rounded-md" />
      ) : (
        <div className="truncate font-mono text-2xl font-medium leading-tight tracking-tight text-foreground">
          {value}
        </div>
      )}
      {hint ? (
        <p className="truncate text-xs leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick action
// ---------------------------------------------------------------------------

interface DashboardQuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  className?: string;
}

/**
 * Navigation tile. Carries no counts on purpose — numbers live in the stat strip
 * so the same figure never appears twice on one page.
 */
export function DashboardQuickAction({
  title,
  description,
  href,
  icon,
  className,
}: DashboardQuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        DASHBOARD_SURFACE,
        "group flex items-center gap-3 p-4 transition-colors hover:border-emerald-300 hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:border-emerald-800",
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:border-emerald-900/60 dark:group-hover:bg-emerald-950/40 dark:group-hover:text-emerald-300">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-y-0.5">
        <span className="truncate text-[13.5px] font-semibold text-foreground">{title}</span>
        <span className="truncate text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Section (card head + padded body in one)
// ---------------------------------------------------------------------------

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Set when children supply their own padding (stat strips, tables). */
  flush?: boolean;
}

export function DashboardSection({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: DashboardSectionProps) {
  return (
    <DashboardCard className={className}>
      <DashboardCardHead title={title} icon={icon}>
        {action}
      </DashboardCardHead>
      {description ? (
        <p className="border-b border-border px-[18px] py-2.5 text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {flush ? (
        children
      ) : (
        <DashboardCardBody className={cn("flex flex-col", DASHBOARD_SPACING.section, bodyClassName)}>
          {children}
        </DashboardCardBody>
      )}
    </DashboardCard>
  );
}
