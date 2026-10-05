"use client";

import type { ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Shared pieces of the case-sheet "Plan and files" sections (Therapy, Diet,
 * Investigation, Documents, Progress): the card heading, the field label, the
 * segmented toggle and the dialog layout (title row, body, grey footer).
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

/** Small bold label above a form control. */
export function PlanField({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-xs font-bold text-ink-soft">
          {label}
        </label>
      ) : (
        <span className="text-xs font-bold text-ink-soft">{label}</span>
      )}
      {children}
      {hint ? <p className="m-0 text-xs text-ink-muted">{hint}</p> : null}
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

// ── Dialog layout ──────────────────────────────────────────────────────────

/**
 * Class for `DialogContent` / `AlertDialogContent`: no padding (the header, body and
 * footer bring their own), the body scrolls, the footer stays in view.
 * Use with `showCloseButton={false}`; `PlanDialogHeader` has the close button.
 */
export const PLAN_DIALOG_CONTENT = "flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0";

const CLOSE_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";

/** Title row of a dialog, with the close button on the right. */
export function PlanDialogHeader({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-5 pb-3.5 pt-[22px] sm:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <DialogTitle className="text-lg font-extrabold leading-tight text-ink">{title}</DialogTitle>
        {description ? (
          <DialogDescription className="break-words text-[13px] text-ink-muted">{description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{title}</DialogDescription>
        )}
      </div>
      <DialogClose className={CLOSE_BUTTON}>
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </div>
  );
}

export function PlanDialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1 sm:px-6", className)}>
      {children}
    </div>
  );
}

/** Grey footer with the buttons on the right (stacked on a phone, main button first). */
export function PlanDialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] px-5 py-3.5 dark:bg-white/[0.03] sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}

/**
 * "Are you sure?" dialog for removing something. The confirm button is the red
 * `danger` button; Cancel and the close button leave everything as it is.
 */
export function PlanConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmIcon,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  cancelLabel?: ReactNode;
  confirmIcon?: ReactNode;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn(PLAN_DIALOG_CONTENT, "sm:max-w-[460px]")}>
        <div className="flex items-start gap-3 px-5 pb-3.5 pt-[22px] sm:px-6">
          <AlertDialogTitle className="min-w-0 flex-1 text-lg font-extrabold leading-tight text-ink">
            {title}
          </AlertDialogTitle>
          <AlertDialogPrimitive.Cancel className={CLOSE_BUTTON}>
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </AlertDialogPrimitive.Cancel>
        </div>
        <div className="px-5 pb-5 pt-1 sm:px-6">
          <AlertDialogDescription className="text-sm leading-[1.55] text-ink-soft">
            {description}
          </AlertDialogDescription>
        </div>
        <PlanDialogFooter>
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="outline" size="md">
              {cancelLabel}
            </Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant="danger" size="md" onClick={onConfirm}>
              {confirmIcon}
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </PlanDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
