import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DASHBOARD_SPACING } from "@/components/dashboard/DashboardPrimitives";

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
  icon,
}: DashboardPageHeaderProps) {
  return (
    <div className="border-b border-border pb-[18px]">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {icon ? <span className="opacity-75 [&>svg]:size-3">{icon}</span> : null}
            {eyebrow}
          </div>
          <h1 className="font-serif text-[27px] font-medium leading-[1.1] tracking-tight text-foreground text-balance sm:text-[33px]">
            {title}
          </h1>
          <p
            className="mt-1.5 max-w-[64ch] text-sm text-muted-foreground"
            suppressHydrationWarning
          >
            {description}
          </p>
          {meta ? <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        <HeaderActions actions={actions} actionsSlot={actionsSlot} />
      </div>
    </div>
  );
}
