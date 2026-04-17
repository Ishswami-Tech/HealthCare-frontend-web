import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardPageShellProps {
  children: ReactNode;
  className?: string;
}

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
    <div className={cn("space-y-3 text-foreground sm:space-y-5", className)}>
      {children}
    </div>
  );
}

export function DashboardPageHeader({
  eyebrow = "Dashboard",
  title,
  description,
  meta,
  actions = [],
  actionsSlot,
}: DashboardPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:rounded-2xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400" />

      <div className="relative px-4 pb-4 pt-5 sm:px-7 sm:pb-6 sm:pt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          <div className="min-w-0 space-y-1.5">
            <span className="inline-block text-[9px] font-extrabold uppercase tracking-[0.25em] text-primary sm:text-[11px]">
              {eyebrow}
            </span>
            <h1 className="text-[1.3rem] font-bold leading-[1.2] tracking-tight text-foreground sm:text-[1.7rem] lg:text-[2rem]">
              {title}
            </h1>
            <p className="max-w-xl text-[13px] leading-[1.55] text-muted-foreground sm:text-sm sm:leading-relaxed">
              {description}
            </p>
            {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
          </div>

          {actions.length > 0 || actionsSlot ? (
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:pl-6">
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
                      className="h-9 rounded-lg px-4 text-sm font-semibold sm:h-10"
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
                    className="h-9 rounded-lg px-4 text-sm font-semibold sm:h-10"
                  >
                    {content}
                  </Button>
                );
              })}
              {actionsSlot}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
