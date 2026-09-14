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
  /** Visual identity per page — keeps patient routes from looking identical. */
  variant?: DashboardPageHeaderVariant;
  icon?: ReactNode;
}

/** Shared vertical rhythm for all patient dashboard pages. */
export function DashboardPageShell({ children, className }: DashboardPageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col gap-y-5 text-foreground sm:gap-y-6",
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
  align = "end",
}: {
  actions: DashboardPageHeaderAction[];
  actionsSlot?: ReactNode;
  align?: "end" | "start";
}) {
  if (actions.length === 0 && !actionsSlot) return null;

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-stretch gap-2.5 sm:w-auto sm:shrink-0 sm:items-center sm:gap-3",
        align === "end" ? "sm:justify-end sm:pt-1" : "sm:justify-start",
      )}
    >
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
              className="h-10 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto"
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
            className="h-10 w-full rounded-xl px-4 text-sm font-semibold sm:w-auto"
          >
            {content}
          </Button>
        );
      })}
      {actionsSlot ? (
        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          {actionsSlot}
        </div>
      ) : null}
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
  variant = "default",
  icon,
}: DashboardPageHeaderProps) {
  if (variant === "welcome") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-card to-teal-50/40 shadow-sm dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-card dark:to-teal-950/20">
        <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-14 left-8 size-28 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-y-1.5">
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200/80 bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200">
              {eyebrow}
            </span>
            <h1 className="max-w-2xl text-balance text-[1.35rem] font-semibold leading-[1.2] tracking-tight text-foreground sm:text-[1.65rem] lg:text-[1.75rem]">
              {title}
            </h1>
            <p className="max-w-xl text-pretty text-sm leading-snug text-muted-foreground" suppressHydrationWarning>
              {description}
            </p>
            {meta}
          </div>
          <HeaderActions actions={actions} actionsSlot={actionsSlot} />
        </div>
      </div>
    );
  }

  if (variant === "schedule") {
    return (
      <div className="overflow-hidden rounded-2xl border border-sky-200/70 bg-sky-50/40 dark:border-sky-900/50 dark:bg-sky-950/20">
        <div className="flex flex-col gap-5 border-b border-sky-200/60 bg-card px-5 py-5 dark:border-sky-900/40 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            {icon ? (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                {icon}
              </div>
            ) : null}
            <div className="flex min-w-0 flex-col gap-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-sky-700 dark:text-sky-300">
                {eyebrow}
              </span>
              <h1 className="text-balance text-[1.4rem] font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                {title}
              </h1>
              <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground" suppressHydrationWarning>
                {description}
              </p>
              {meta}
            </div>
          </div>
          <HeaderActions actions={actions} actionsSlot={actionsSlot} />
        </div>
        <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300" />
      </div>
    );
  }

  if (variant === "clinical") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 border-b border-border/70 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-4">
          <div className="flex min-w-0 items-start gap-3">
            {icon ? (
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
                {icon}
              </div>
            ) : null}
            <div className="flex min-w-0 flex-col gap-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-300">
                {eyebrow}
              </span>
              <h1 className="text-balance text-[1.35rem] font-semibold tracking-tight text-foreground sm:text-[1.55rem]">
                {title}
              </h1>
              <p className="max-w-lg text-pretty text-sm leading-snug text-muted-foreground" suppressHydrationWarning>
                {description}
              </p>
              {meta}
            </div>
          </div>
          <HeaderActions actions={actions} actionsSlot={actionsSlot} align="start" />
        </div>
      </div>
    );
  }

  if (variant === "ledger") {
    return (
      <div className="rounded-none border-0 bg-transparent">
        <div className="flex flex-col gap-4 border-b-2 border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
          <div className="flex min-w-0 flex-col gap-y-2">
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                {eyebrow}
              </span>
            </div>
            <h1 className="text-balance text-[1.45rem] font-semibold tracking-tight text-foreground sm:text-[1.8rem]">
              {title}
            </h1>
            <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground" suppressHydrationWarning>
              {description}
            </p>
            {meta}
          </div>
          <HeaderActions actions={actions} actionsSlot={actionsSlot} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400" />

      <div className="relative px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-y-2">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary sm:text-[11px]">
              {eyebrow}
            </span>
            <h1 className="text-balance text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground sm:text-[1.65rem] lg:text-[1.85rem]">
              {title}
            </h1>
            <p
              className="max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
              suppressHydrationWarning
            >
              {description}
            </p>
            {meta ? <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div> : null}
          </div>
          <HeaderActions actions={actions} actionsSlot={actionsSlot} />
        </div>
      </div>
    </div>
  );
}
