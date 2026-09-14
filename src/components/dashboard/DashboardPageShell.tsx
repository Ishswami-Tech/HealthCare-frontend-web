import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_SPACING } from "@/components/dashboard/DashboardPrimitives";
import { DashboardHeroArt } from "@/components/dashboard/DashboardHeroArt";

interface DashboardPageShellProps {
  children: ReactNode;
  className?: string;
}

const EMPTY_ACTIONS: DashboardPageHeaderAction[] = [];

interface DashboardPageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

/**
 * Kept so existing call sites keep compiling. Every variant now renders the same
 * header — one eyebrow, one serif title, one rule — because per-page variants
 * were the reason no two dashboards lined up.
 */
export type DashboardPageHeaderVariant =
  | "welcome"
  | "schedule"
  | "clinical"
  | "ledger"
  | "default";

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: DashboardPageHeaderAction[];
  actionsSlot?: ReactNode;
  variant?: DashboardPageHeaderVariant;
  icon?: ReactNode;
  /** Shows the doctor artwork on the right of the banner (large screens only). */
  showArt?: boolean;
}

/** Shared vertical rhythm for every dashboard page. */
export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col text-foreground",
        DASHBOARD_SPACING.page,
        className,
      )}
    >
      {children}
    </div>
  );
}

function HeaderActions({
  actions,
  actionsSlot,
}: {
  actions: DashboardPageHeaderAction[];
  actionsSlot?: ReactNode;
}) {
  if (actions.length === 0 && !actionsSlot) return null;

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
      {actions.map((action) => {
        const content = (
          <>
            {action.icon ? <span className="shrink-0">{action.icon}</span> : null}
            <span>{action.label}</span>
          </>
        );

        if (action.href) {
          return (
            <Button
              key={`${action.label}-${action.href}`}
              asChild
              variant={action.variant ?? "outline"}
              disabled={action.disabled}
              className="h-9 rounded-lg px-3.5 text-[13.5px] font-semibold"
            >
              <a href={action.href}>{content}</a>
            </Button>
          );
        }

        return (
          <Button
            key={action.label}
            variant={action.variant ?? "outline"}
            onClick={action.onClick}
            disabled={action.disabled}
            className="h-9 rounded-lg px-3.5 text-[13.5px] font-semibold"
          >
            {content}
          </Button>
        );
      })}
      {actionsSlot}
    </div>
  );
}

export function DashboardPageHeader({
  eyebrow = "Dashboard",
  title,
  description,
  meta,
  actions = EMPTY_ACTIONS,
  actionsSlot,
  showArt = false,
}: DashboardPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50/90 via-emerald-50/40 to-card shadow-sm dark:border-emerald-950/60 dark:from-emerald-950/40 dark:via-emerald-950/15 dark:to-card">
      {showArt ? (
        <DashboardHeroArt className="pointer-events-none absolute -right-8 bottom-0 hidden h-[118%] lg:block" />
      ) : (
        /* Decorative leaf motif — drawn, not an asset, so it themes cleanly. */
        <svg
          aria-hidden="true"
          viewBox="0 0 240 200"
          className="pointer-events-none absolute -right-6 -top-10 hidden h-[150%] w-auto text-emerald-500/10 lg:block dark:text-emerald-400/10"
        >
          <path
            fill="currentColor"
            d="M120 20c60 0 100 40 100 90s-40 90-100 90S20 160 20 110 60 20 120 20Z"
            opacity="0.5"
          />
          <path
            fill="currentColor"
            d="M186 40c6 44-22 78-66 84 2-46 26-76 66-84ZM60 150c28-38 56-54 96-66-26 40-56 60-96 66Z"
          />
        </svg>
      )}

      <div
        className={cn(
          "relative flex flex-col gap-5 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-end lg:justify-between lg:gap-8",
          // leave room for the artwork so the copy never runs under it
          showArt && "lg:pr-[21rem]",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
            {eyebrow}
          </span>
          <h1 className="mt-2 max-w-2xl text-[26px] font-bold leading-[1.12] tracking-tight text-foreground text-balance sm:text-[32px]">
            {title}
          </h1>
          <p
            className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground"
            suppressHydrationWarning
          >
            {description}
          </p>
          {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        <HeaderActions actions={actions} actionsSlot={actionsSlot} />
      </div>
    </div>
  );
}
