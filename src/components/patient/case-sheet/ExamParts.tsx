"use client";

import { useLocalizedLabel } from "./use-localized-option";
import type { ReactNode } from "react";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";

/**
 * Building blocks shared by the examination panels of the case sheet
 * (General Exam, Measurements, the classical examinations and Prakruti).
 *
 * The panel is a size container: grids inside it use `@…:` container variants,
 * so the columns follow the width of the card, not of the window (the EHR page
 * has a sidebar that opens and closes).
 */

/** White panel card with the examination spacing. */
export function ExamPanel({
  labelledBy,
  className,
  children,
}: {
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Surface as="section" aria-labelledby={labelledBy} className={cn("@container gap-4", className)}>
      {children}
    </Surface>
  );
}

/** Panel heading: title and one line under it on the left, status tag and Save on the right. */
export function ExamPanelHead({
  id,
  title,
  description,
  aside,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
}) {
  const localizeLabel = useLocalizedLabel();
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <h2 id={id} className="m-0 text-base font-bold text-ink">
          {typeof title === "string" ? localizeLabel(title) : title}
        </h2>
        {description ? (
          <div className="text-[13px] text-ink-muted">
            {typeof description === "string" ? localizeLabel(description) : description}
          </div>
        ) : null}
      </div>
      {aside ? <div className="ml-auto flex shrink-0 items-center gap-2">{aside}</div> : null}
    </div>
  );
}

/** The one main button of a panel. */
export function ExamSaveButton({
  onClick,
  disabled,
  saving,
  label = "Save",
}: {
  onClick: () => void;
  disabled: boolean;
  saving: boolean;
  label?: string;
}) {
  const localizeLabel = useLocalizedLabel();
  return (
    <Button onClick={onClick} disabled={disabled} className="h-[38px] px-3.5 has-[>svg]:px-3.5">
      <Save strokeWidth={2.4} aria-hidden="true" />
      {localizeLabel(saving ? "Saving..." : label)}
    </Button>
  );
}

/** Small upper-case label above a group ("SLEEP", "LAST ASSESSMENT"). */
export function ExamEyebrow({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <span
      id={id}
      className={cn("text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted", className)}
    >
      {children}
    </span>
  );
}

const CHIP_SIZES = {
  /** 30 px — inside the small tiles (Pain, Personal, Prakruti). */
  sm: "min-h-[30px] text-xs",
  /** 34 px — Sleep / Bowel / Appetite on General Exam. */
  md: "min-h-[34px] text-[13px]",
  /** 36 px — the Devanagari option lists of the classical examinations. */
  lg: "min-h-9 text-sm",
} as const;

export type ExamChipSize = keyof typeof CHIP_SIZES;

/** Option chip. Selected = emerald with a tick, so the state never depends on colour alone. */
export function ExamOptionChip({
  label,
  active,
  onClick,
  size = "lg",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: ExamChipSize;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-[13px] transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
        CHIP_SIZES[size],
        active
          ? "border-[#047857] bg-[#047857] font-bold text-white"
          : "border-line bg-card font-medium text-ink hover:bg-mint-soft",
      )}
    >
      {active ? <Check className="size-[13px] shrink-0" strokeWidth={3} aria-hidden="true" /> : null}
      {label}
    </button>
  );
}

/** Small bordered box inside a panel: one question, one body area, one score. */
export function ExamTile({
  labelledBy,
  className,
  children,
}: {
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      {...(labelledBy ? { role: "group", "aria-labelledby": labelledBy } : {})}
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-[14px] border border-line bg-[#fbfdfc] px-3.5 py-3 dark:bg-white/[0.03]",
        className,
      )}
    >
      {children}
    </div>
  );
}
