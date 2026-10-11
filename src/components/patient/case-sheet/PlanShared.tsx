"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared pieces of the case-sheet "Plan and files" sections (Therapy, Diet,
 * Investigation, Documents, Progress): the card heading, the small caption, the
 * segmented toggle. The dialogs use `DialogShell` / `ConfirmDialog` from `@/components/tbd`.
 */

/** 38 px: the height of the action buttons in a section heading. */
export const PLAN_HEAD_BUTTON = "h-[38px] px-3.5 has-[>svg]:px-3.5";

/** Inner card inside a section (plan card, pending upload). */
export const PLAN_INNER_CARD =
  "rounded-2xl border border-line bg-[#fbfdfc] dark:bg-white/[0.03]";

/** Section heading: title and one line of text on the left, controls on the right. */
export function PlanCardHeader({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  /** Controls on the right (they wrap under the title on a phone). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-3", className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="m-0 text-base font-bold text-ink">{title}</h2>
        {description ? <p className="m-0 text-[13px] text-ink-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Small uppercase caption ("MEDICINES", "NOTES"). */
export function PlanCaption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted", className)}>
      {children}
    </span>
  );
}

export interface PlanToggleOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Full name for screen readers and the tooltip when the label is short. */
  title?: string;
  lang?: string;
}

/**
 * Small segmented toggle inside a white rail.
 * `tone="solid"`: the chosen item is emerald (language). `tone="soft"`: mint (this visit / all visits).
 */
export function PlanToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  tone = "solid",
  size = "sm",
  className,
}: {
  options: readonly PlanToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  tone?: "solid" | "soft";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full gap-0.5 rounded-[11px] border border-line bg-card p-[3px]",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-lg transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
              size === "md" ? "min-h-[34px] px-3 text-[13px]" : "",
              size === "sm" && tone === "solid" ? "h-[30px] min-w-[30px] px-2 text-xs" : "",
              size === "sm" && tone === "soft" ? "min-h-8 px-3 text-[13px]" : "",
              active
                ? tone === "solid"
                  ? "bg-primary font-bold text-primary-foreground"
                  : "bg-mint font-bold text-brand-dark"
                : cn("text-ink-soft hover:bg-well", tone === "solid" ? "font-bold" : "font-medium"),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
