"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TbdOption<T extends string = string> {
  value: T;
  label: ReactNode;
  count?: ReactNode;
  disabled?: boolean;
}

/**
 * Row of filter chips with optional counts. The active chip is emerald with white text.
 * Use for filters that narrow a list (All / Confirmed / Completed).
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: TbdOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-[38px] items-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-[13px] transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-[#047857] font-bold text-white shadow-[0_6px_14px_rgba(4,120,87,0.22)]"
                : "border border-line bg-card font-semibold text-ink hover:bg-mint-soft",
            )}
          >
            {option.label}
            {option.count !== undefined && option.count !== null ? (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold",
                  active ? "bg-white/25 text-white" : "bg-well text-ink-soft",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Segmented control (white thumb on a grey rail). Use to switch between views of the same
 * thing (Consultations / Procedures). For Radix tabs use `@/components/ui/tabs`, which has
 * the same look.
 */
export function SegTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: TbdOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex max-w-full gap-1 self-start overflow-x-auto rounded-[13px] bg-[#e8eef5] p-1 dark:bg-white/10",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex min-h-[38px] shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] px-[18px] text-sm transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
              active
                ? "bg-card font-bold text-brand shadow-[0_1px_3px_rgba(15,27,45,0.12)]"
                : "font-medium text-ink-soft hover:text-ink",
            )}
          >
            {option.label}
            {option.count !== undefined && option.count !== null ? (
              <span
                className={cn(
                  "inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold",
                  active ? "bg-mint text-brand-dark" : "bg-[#dbe3ec] text-ink-soft dark:bg-white/10",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Search field with the emerald magnifier, 44 px high. */
export function SearchBox({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 text-sm text-ink focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
        className,
      )}
    >
      <Search className="size-[18px] shrink-0 text-brand" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="min-w-0 flex-1 bg-transparent outline-hidden ring-0 ring-offset-0 placeholder:text-ink-muted focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </label>
  );
}
