import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: DashboardPageHeaderAction[];
  actionsSlot?: ReactNode;
}

export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return (
    <div className={cn("flex flex-col gap-y-3 text-foreground sm:gap-y-4", className)}>
      {children}
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
}: DashboardPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:rounded-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400" />

      <div className="relative px-3 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-y-1">
            <span className="inline-block text-[9px] font-extrabold uppercase tracking-[0.25em] text-primary sm:text-[11px]">
              {eyebrow}
            </span>
            <h1 className="text-[1.2rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[1.5rem] lg:text-[1.8rem]">
              {title}
            </h1>
            <p className="max-w-xl text-[13px] leading-[1.5] text-muted-foreground sm:text-sm sm:leading-relaxed" suppressHydrationWarning>
              {description}
            </p>
            {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
          </div>

          {actions.length > 0 || actionsSlot ? (
            <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:shrink-0 sm:items-center sm:justify-end sm:pl-4">
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
                      className="h-9 w-full rounded-lg px-4 text-sm font-semibold sm:h-10 sm:w-auto"
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
                    className="h-9 w-full rounded-lg px-4 text-sm font-semibold sm:h-10 sm:w-auto"
                  >
                    {content}
                  </Button>
                );
              })}
              {actionsSlot ? <div className="w-full sm:w-auto">{actionsSlot}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

