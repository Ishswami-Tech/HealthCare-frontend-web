import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PatientPageShellProps {
  children: ReactNode;
  className?: string;
}

interface PatientPageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
  disabled?: boolean;
}

interface PatientPageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  actions?: PatientPageHeaderAction[];
  actionsSlot?: ReactNode;
}

/**
 * PatientPageShell — page canvas with a muted tinted surface.
 *
 * Provides a slightly grey/muted background so the white bg-card sections
 * (header, content cards) visually float as elevated surfaces above it.
 * This is the same technique used by Linear, Vercel, and Stripe dashboards.
 */
export function PatientPageShell({ children, className }: PatientPageShellProps) {
  return (
    <div
      className={cn(
        "space-y-4 sm:space-y-5",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * PatientPageHeader — the premium page hero element.
 *
 * Design:
 * - Solid 4 px primary top accent: unmistakable brand stripe
 * - Green tint (12 → 4 → 0 %) that's clearly visible against the white card bg
 * - Primary-tinted border so the whole card reads as "branded"
 * - Bold oversized title with generous padding for clear typographic hierarchy
 */
export function PatientPageHeader({
  eyebrow = "Patient Portal",
  title,
  description,
  meta,
  actions = [],
  actionsSlot,
}: PatientPageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:rounded-2xl">
      {/* 4 px solid top accent — brand stripe */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400" />

      <div className="relative px-5 pt-6 pb-5 sm:px-7 sm:pt-7 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
          {/* Left: text */}
          <div className="min-w-0 space-y-1.5">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.28em] text-primary sm:text-[11px]">
              {eyebrow}
            </span>
            <h1 className="text-[1.6rem] font-bold leading-[1.2] tracking-tight text-foreground sm:text-[1.85rem] lg:text-[2rem]">
              {title}
            </h1>
            <p className="max-w-xl text-[13px] leading-[1.55] text-muted-foreground sm:text-sm sm:leading-relaxed">
              {description}
            </p>
            {meta ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>
            ) : null}
          </div>

          {/* Right: actions */}
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
