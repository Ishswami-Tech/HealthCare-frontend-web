"use client";

/**
 * Small layout pieces shared by the "Register patient" and "OPD registration" dialogs: the
 * numbered step title and the grey panel that groups a step's fields. The field, the chips,
 * the date field, the close button and the footer bar come from `@/components/tbd`.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** "1 · Who is visiting?" — step number in a mint circle, title, optional note and action. */
export function StepTitle({
  step,
  title,
  note,
  action,
}: {
  step?: number;
  title: ReactNode;
  note?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-9 flex-wrap items-center gap-x-2.5 gap-y-2">
      {step !== undefined ? (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-extrabold text-brand-dark"
          aria-hidden="true"
        >
          {step}
        </span>
      ) : null}
      <h3 className="m-0 text-[15px] font-bold text-ink">
        {step !== undefined ? <span className="sr-only">Step {step}: </span> : null}
        {title}
      </h3>
      {note ? <span className="min-w-0 truncate text-[13px] text-ink-muted">{note}</span> : null}
      {action ? <span className="ml-auto flex shrink-0 items-center">{action}</span> : null}
    </div>
  );
}

/** Light grey panel that holds the fields of one step. */
export function FieldPanel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-[#f8fafc] p-3.5 dark:bg-white/5",
        className,
      )}
    >
      {children}
    </div>
  );
}
