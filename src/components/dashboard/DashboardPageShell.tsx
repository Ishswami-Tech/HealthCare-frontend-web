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
    <div className={cn("space-y-4 text-foreground sm:space-y-5", className)}>
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
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-border/30">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-cyan-500" />

      <div className="relative px-4 pb-5 pt-6 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-2">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </span>
            <h1 className="text-[1.35rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[1.7rem] lg:text-[2rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
          </div>

          {actions.length > 0 || actionsSlot ? (
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:pl-4">
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
                      className="h-10 rounded-lg px-4 text-sm font-semibold"
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
                    className="h-10 rounded-lg px-4 text-sm font-semibold"
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
