"use client";

import { useRef, useState, type ReactNode } from "react";
import { Calendar, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Form pieces shared by the portals: the labelled field, the date field and the choice chip.
 * (`ui/field.tsx` is the stock fieldset-based field with 14 px labels; the designs use the
 * smaller bold label below, so this is its own piece.)
 */

/** 12 px bold label over a control. */
export const FIELD_LABEL = "text-xs font-bold text-ink-soft";

/** Small 11 px label over a control inside a dense row (medicine lines). */
export const FIELD_LABEL_SMALL = "text-[11px] font-bold text-ink-muted";

const FIELD_ERROR = "text-xs font-semibold text-[#be123c] dark:text-rose-300";

/**
 * Label, control, optional hint and the validation message of one field.
 * Give the control the same id as `htmlFor` (spread `fieldAria(id, error)` on it) so the
 * label, the message and the hint are tied to it.
 */
export function Field({
  label,
  htmlFor,
  required = false,
  aside,
  hint,
  error,
  className,
  labelClassName,
  children,
}: {
  label: ReactNode;
  /** Id of the control. Without it the label is plain text (a group of chips). */
  htmlFor?: string | undefined;
  /** Adds the emerald `*` after the label. */
  required?: boolean;
  /** Sits next to the label (a "Verified" tag). */
  aside?: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  /** Extra classes for the label row, for example `min-h-5` in forms where some labels carry a tag. */
  labelClassName?: string;
  children: ReactNode;
}) {
  const mark = required ? (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  ) : null;
  const labelNode = htmlFor ? (
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {label}
      {mark}
    </label>
  ) : (
    <span className={FIELD_LABEL}>
      {label}
      {mark}
    </span>
  );
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {aside || labelClassName ? (
        <div className={cn("flex items-center gap-2", labelClassName)}>
          {labelNode}
          {aside}
        </div>
      ) : (
        labelNode
      )}
      {children}
      {error ? (
        <span id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className={FIELD_ERROR}>
          {error}
        </span>
      ) : hint ? (
        <span id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Props that link a control to the message and hint of its `Field`. */
export function fieldAria(id: string, error?: string, hasHint = false) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

interface DateFieldBase {
  id: string;
  /** ISO day, `yyyy-mm-dd`; empty when no day is chosen. */
  value: string;
  onChange: (value: string) => void;
  min?: string | undefined;
  max?: string | undefined;
  disabled?: boolean | undefined;
  className?: string;
}

export type DateFieldProps =
  | (DateFieldBase & {
      /** A calendar button on the left opens the browser's date picker. Label it with a `Field`. */
      variant?: "icon";
      label?: undefined;
    })
  | (DateFieldBase & {
      /** `inline`: the label sits inside the box ("From 12/05/2026"). `placeholder`: it shows while the field is empty. */
      variant: "inline" | "placeholder";
      label: string;
    });

/** Native date field in the three shapes the designs use. */
export function DateField({ id, value, onChange, min, max, disabled, className, variant = "icon", label }: DateFieldProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  if (variant === "inline") {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20",
          className,
        )}
      >
        <span className="text-xs font-bold text-ink-muted">{label}</span>
        <input
          id={id}
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-semibold text-ink outline-hidden dark:[color-scheme:dark]"
        />
      </label>
    );
  }

  if (variant === "placeholder") {
    // While it is empty and not focused the field reads its label; the browser's own
    // day / month / year boxes show as soon as it is used.
    const showLabel = value === "" && !focused;
    return (
      <div className={cn("relative min-w-0", className)}>
        <input
          id={id}
          type="date"
          aria-label={label}
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "h-11 w-full min-w-0 rounded-xl border border-line bg-card px-3.5 text-sm outline-hidden focus:border-brand focus:ring-2 focus:ring-brand/20 dark:bg-input/30 dark:[color-scheme:dark]",
            showLabel ? "text-transparent" : "text-ink",
          )}
        />
        {showLabel ? (
          <span
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-ink-muted"
            aria-hidden="true"
          >
            {label}
          </span>
        ) : null}
      </div>
    );
  }

  const openPicker = () => {
    const input = ref.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Some browsers refuse showPicker(); typing the date still works.
    }
    input.focus();
  };
  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Open calendar"
        disabled={disabled}
        onClick={openPicker}
        className="absolute left-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted hover:text-ink disabled:pointer-events-none"
      >
        <Calendar className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>
      <Input
        ref={ref}
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="pl-[38px] [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}

const CHIP_SIZES = {
  /** 30 px: inside small tiles. */
  sm: "min-h-[30px] text-xs",
  /** 34 px: the usual chip. */
  md: "min-h-[34px] text-[13px]",
  /** 36 px: long option lists. */
  lg: "min-h-9 text-sm",
} as const;

export type ChoiceChipSize = keyof typeof CHIP_SIZES;

/**
 * Selectable chip: emerald when chosen. `pill` (round) shows a tick while chosen, so the
 * state never depends on colour alone; `box` (radius 10) is the form chip of the dialogs.
 */
export function ChoiceChip({
  active,
  onClick,
  size = "md",
  shape = "pill",
  check = shape === "pill",
  block = false,
  disabled = false,
  title,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  size?: ChoiceChipSize;
  shape?: "pill" | "box";
  /** Shows a tick in front of the label while the chip is chosen. */
  check?: boolean;
  /** Fills its grid cell and centres the label. */
  block?: boolean;
  disabled?: boolean;
  title?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50",
        shape === "pill" ? "rounded-full px-[13px] py-1" : "rounded-[10px] px-3",
        CHIP_SIZES[size],
        block ? "w-full justify-center" : "max-w-full text-left",
        active
          ? "border-primary bg-primary font-bold text-primary-foreground"
          : cn("border-line bg-card text-ink hover:bg-mint-soft", shape === "pill" ? "font-medium" : "font-semibold"),
        className,
      )}
    >
      {check && active ? <Check className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" /> : null}
      <span className={block ? "whitespace-nowrap" : "min-w-0 break-words"}>{children}</span>
    </button>
  );
}
