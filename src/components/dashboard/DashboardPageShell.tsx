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
              size="md"
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
            size="md"
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
  // Page banner from the designs: light mint-to-cream card, eyebrow, title, one line of
  // text, optional tags and actions. `showArt` adds the doctor artwork on large screens.
  return (
    <header className="tbd-hero">
      {showArt ? (
        <DashboardHeroArt className="pointer-events-none absolute right-4 bottom-0 hidden h-full max-h-full object-contain lg:block" />
      ) : null}

      <div
        className={cn(
          "relative flex flex-col gap-5 p-[26px] lg:flex-row lg:items-end lg:justify-between lg:gap-6",
          // leave room for the artwork so the copy never runs under it
          showArt && "lg:pr-[21rem]",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-brand">
            {eyebrow}
          </span>
          <h1 className="max-w-2xl text-[26px] font-extrabold leading-tight tracking-[-0.5px] text-ink text-balance">
            {title}
          </h1>
          <p className="max-w-[620px] text-sm text-ink-muted" suppressHydrationWarning>
            {description}
          </p>
          {meta ? <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        <HeaderActions actions={actions} actionsSlot={actionsSlot} />
      </div>
    </header>
  );
}
