"use client";

import type { ReactNode } from "react";
import { Save } from "lucide-react";
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
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-0.5">
        <h2 id={id} className="m-0 text-base font-bold text-ink">
          {title}
        </h2>
        {description ? <div className="text-[13px] text-ink-muted">{description}</div> : null}
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
  return (
    <Button onClick={onClick} disabled={disabled} className="h-[38px] px-3.5 has-[>svg]:px-3.5">
      <Save strokeWidth={2.4} aria-hidden="true" />
      {saving ? "Saving..." : label}
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
