"use client";

/**
 * Small form pieces shared by the "Register patient" and "OPD registration" dialogs:
 * a labelled field, a choice chip, a date field with the calendar on the left, a numbered
 * step title and the grey panel that groups a step's fields.
 */
import { useRef, type ReactNode } from "react";
import { Calendar, Check, X } from "lucide-react";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Label above a control. `htmlFor` ties it to the control; without it the label is plain text. */
export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  const labelClass = "text-xs font-bold text-ink-soft";
  const mark = required ? (
    <span className="text-brand" aria-hidden="true">
      {" "}
      *
    </span>
  ) : null;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClass}>
          {label}
          {mark}
        </label>
      ) : (
        <span className={labelClass}>
          {label}
          {mark}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-xs font-semibold text-[#be123c] dark:text-rose-300" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </div>
  );
}

/** Toggle chip (gender, special case, family member, how the fee is collected). */
export function ChoiceChip({
  label,
  active,
  onClick,
  disabled = false,
  showCheck = false,
  block = false,
  title,
}: {
  label: ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Shows a tick in front of the label while the chip is active. */
  showCheck?: boolean;
  /** Fills its grid cell and centres the label. */
  block?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[34px] items-center gap-1.5 rounded-[10px] border px-3 text-[13px] transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50",
        block ? "w-full justify-center" : "max-w-full text-left",
        active
          ? "border-[#047857] bg-[#047857] font-bold text-white"
          : "border-line bg-card font-semibold text-ink hover:bg-mint-soft",
      )}
    >
      {showCheck && active ? <Check className="size-3.5 shrink-0" strokeWidth={2.6} aria-hidden="true" /> : null}
      <span className={block ? "whitespace-nowrap" : "min-w-0 break-words"}>{label}</span>
    </button>
  );
}

/** Date field: the calendar button on the left opens the browser's date picker. */
export function DateInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
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
    <div className="relative">
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
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="pl-[38px] [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </div>
  );
}

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

/** The grey square close button in a dialog header. */
export function DialogCloseButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <DialogClose
      disabled={disabled}
      aria-label="Close"
      className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
    >
      <X className="size-4" aria-hidden="true" />
    </DialogClose>
  );
}

/** Footer bar of both dialogs: a short hint on the left, the buttons on the right. */
export function DialogActionBar({ hint, children }: { hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-3 border-t border-hair bg-[#f8fafc] px-4 py-3.5 dark:bg-white/5 sm:px-6">
      {hint ? <p className="m-0 min-w-[200px] flex-1 text-xs text-ink-muted">{hint}</p> : null}
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
}
