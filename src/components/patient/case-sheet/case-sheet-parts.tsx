import type { CSSProperties, ReactNode } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";

/**
 * Small building blocks shared by the case-sheet History sections
 * (Basic Details, Complaints, Past History, Habits, Family, Medicines).
 * Layout only: no data, no hooks.
 */

/** White section card with the standard heading row (title, one line, action on the right). */
export function CaseSheetCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Surface as="section" className={cn("gap-4", className)}>
      <SectionTitle title={title} description={description} action={action} />
      {children}
    </Surface>
  );
}

/** The save button in a card heading. Stays disabled until something changed. */
export function SaveButton({
  label = "Save",
  saving,
  disabled,
  onClick,
}: {
  label?: string;
  saving: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button className="h-[38px] px-3.5 has-[>svg]:px-3.5" onClick={onClick} disabled={disabled}>
      <Save aria-hidden="true" />
      {saving ? "Saving..." : label}
    </Button>
  );
}

/** Small caps heading over a group of chips. */
export function GroupLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <span id={id} className="text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted">
      {children}
    </span>
  );
}

/** Bordered box that holds a small table (family history, medicine history). */
export function RowTable({
  label,
  columns,
  headings,
  children,
}: {
  /** Accessible name of the table. */
  label: string;
  /** CSS grid-template-columns for the wide layout; the last column is the remove button. */
  columns: string;
  headings: [string, string, string];
  children: ReactNode;
}) {
  return (
    <div
      role="table"
      aria-label={label}
      className="overflow-hidden rounded-[14px] border border-line"
      style={{ "--cs-cols": columns } as CSSProperties}
    >
      <div
        role="row"
        className="hidden items-center gap-3.5 border-b border-hair px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted md:grid md:grid-cols-[var(--cs-cols)]"
      >
        {headings.map((heading) => (
          <span role="columnheader" key={heading}>
            {heading}
          </span>
        ))}
        <span role="columnheader">
          <span className="sr-only">Remove</span>
        </span>
      </div>
      {children}
    </div>
  );
}

/** One row: bold first cell, plain second, muted third, remove button on the right. */
export function RowTableRow({
  primary,
  secondary,
  tertiary,
  action,
}: {
  primary: ReactNode;
  secondary: ReactNode;
  tertiary: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role="row"
      className="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-x-3.5 gap-y-0.5 border-b border-hair px-5 py-2.5 text-sm text-ink last:border-b-0 md:min-h-14 md:grid-cols-[var(--cs-cols)]"
    >
      <span role="cell" className="min-w-0 font-bold [overflow-wrap:anywhere]">
        {primary}
      </span>
      <span role="cell" className="min-w-0 [overflow-wrap:anywhere] max-md:col-start-1">
        {secondary}
      </span>
      <span role="cell" className="min-w-0 text-ink-muted [overflow-wrap:anywhere] max-md:col-start-1">
        {tertiary}
      </span>
      <span role="cell" className="flex justify-end max-md:col-start-2 max-md:row-span-3 max-md:row-start-1">
        {action}
      </span>
    </div>
  );
}

/** Red-outlined bin button that removes one row. */
export function RemoveRowButton({
  label,
  disabled,
  onClick,
}: {
  /** Accessible name, for example "Remove Father, Hypertension". */
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="danger"
      size="icon"
      className="rounded-[10px]"
      aria-label={label}
      title="Remove"
      disabled={disabled}
      onClick={onClick}
    >
      <Trash2 aria-hidden="true" />
    </Button>
  );
}

/** Grey placeholder rows while a table loads. */
export function RowTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line" aria-busy="true">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex min-h-14 items-center gap-3.5 border-b border-hair px-5 py-2.5 last:border-b-0"
        >
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  );
}
