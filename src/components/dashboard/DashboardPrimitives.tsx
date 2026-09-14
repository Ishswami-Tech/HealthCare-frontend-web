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
  cardHead: "px-5 py-4",
  /** Padding for a card body. */
  card: "p-5",
  /** Padding for nested rows inside a card. */
  row: "p-3.5",
  /** Gap for every responsive grid of cards. */
  grid: "gap-3.5",
  /** Same gap, vertical only — for stacked rail content. */
  stack: "gap-y-3.5",
} as const;

/** Neutral surface shared by all dashboard panels. */
export const DASHBOARD_SURFACE =
  "rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,20,0.04)]";

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
  description,
  icon,
  children,
  className,
}: {
  title: ReactNode;
  /** Sits under the title inside the header, not as a separate strip. */
  description?: string;
  /** Small brand-tinted glyph shown before the title. */
  icon?: ReactNode;
  /** Right-aligned actions. */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border/70",
        DASHBOARD_SPACING.cardHead,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-[15px] font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="truncate text-[12.5px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
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
  brand: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  info: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  warn: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  crit: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  plain: "bg-muted text-muted-foreground",
};

export interface DashboardStatItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: DashboardStatTone;
  isPending?: boolean;
  /** Turns the card into a link with a chevron. */
  href?: string;
}

/**
 * KPI row. Separate cards rather than one divided block: each figure reads as
 * its own tile, with a soft tinted glyph and an optional chevron when the card
 * navigates somewhere.
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
    <div className={cn("grid grid-cols-2 gap-3.5", columnClass, className)}>
      {items.map((item) => (
        <DashboardStatCard
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
          isPending={item.isPending}
          {...(item.href ? { href: item.href } : {})}
        />
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
  tone?: DashboardStatTone;
  isPending?: boolean;
  /** Renders the card as a link and shows a chevron. */
  href?: string;
  className?: string;
}

export function DashboardStatCard({
  label,
  value,
  hint,
  icon,
  tone = "plain",
  isPending = false,
  href,
  className,
}: DashboardStatCardProps) {
  const body = (
    <>
      {icon ? (
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            STAT_TONES[tone],
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col">
        {isPending ? (
          <Skeleton className="h-7 w-16 rounded-md" />
        ) : (
          <span className="truncate text-[26px] font-bold leading-none tracking-tight text-foreground">
            {value}
          </span>
        )}
        <span className="mt-1.5 truncate text-[12.5px] font-medium leading-tight text-muted-foreground">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 truncate text-[11.5px] leading-tight text-muted-foreground/80">
            {hint}
          </span>
        ) : null}
      </span>
      {href ? (
        <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  const shell = cn(
    DASHBOARD_SURFACE,
    "group flex items-start gap-3.5 p-4 sm:p-[18px]",
    href &&
      "transition-colors hover:border-emerald-200 hover:bg-accent/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:border-emerald-900",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {body}
      </Link>
    );
  }

  return <div className={shell}>{body}</div>;
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
        "group flex items-center gap-3 p-4 transition-colors hover:border-emerald-200 hover:bg-accent/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:hover:border-emerald-900",
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
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
      <DashboardCardHead
        title={title}
        icon={icon}
        {...(description ? { description } : {})}
      >
        {action}
      </DashboardCardHead>
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
