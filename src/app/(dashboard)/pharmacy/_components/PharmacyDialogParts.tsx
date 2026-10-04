"use client";

import type { ReactNode } from "react";
import { CircleAlert, Pill as PillIcon, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { IconBox, Note, Pill } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  STATUS_LABEL,
  STATUS_TONE,
  expiryMonthLabel,
  formatRupees,
  type MedicineRow,
} from "./pharmacy-inventory.logic";

/**
 * Dialog chrome shared by every inventory dialog: title row with the grey close square,
 * a scrolling body and a grey action bar. `busy` blocks closing while a request runs.
 */
export function PharmacyDialog({
  open,
  onClose,
  busy = false,
  title,
  description,
  width,
  children,
}: {
  open: boolean;
  onClose: () => void;
  busy?: boolean;
  title: ReactNode;
  description?: ReactNode;
  /** Max width in px at desktop size (the boards use 600 – 780). */
  width: number;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[min(var(--ph-dialog-width),calc(100%-2rem))]"
        style={{ "--ph-dialog-width": `${width}px` } as React.CSSProperties}
      >
        <div className="flex items-start gap-3 px-6 pb-3.5 pt-[22px]">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{title}</DialogDescription>
            )}
          </div>
          <DialogClose
            disabled={busy}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function PharmacyDialogBody({
  className,
  children,
  ...rest
}: { className?: string; children: ReactNode } & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div
      className={cn("flex max-h-[calc(100dvh-230px)] flex-col gap-4 overflow-y-auto px-6 pb-5 pt-1", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Grey bar with the dialog buttons. `start` sits on the left (Remove). */
export function PharmacyDialogActions({ start, children }: { start?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] px-6 py-3.5 sm:flex-row sm:items-center sm:justify-end dark:bg-white/5">
      {start ? <div className="flex sm:mr-auto [&>*]:w-full sm:[&>*]:w-auto">{start}</div> : null}
      {children}
    </div>
  );
}

/** Small emerald heading between groups of fields ("MEDICINE"). */
export function FormSectionLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-brand">{children}</span>;
}

/** Label, control, optional hint and the validation message of one field. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-bold text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <span id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </div>
  );
}

/** Props that link an input to its `Field` message. */
export function fieldAria(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

/** Wraps an amount input so it shows the rupee sign inside the field. */
export function RupeeField({ children }: { children: ReactNode }) {
  return (
    <span className="relative block [&>input]:pl-7">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted" aria-hidden="true">
        ₹
      </span>
      {children}
    </span>
  );
}

/** The medicine a dialog is about: name, a line of facts and its stock status. */
export function MedicineSummary({ medicine }: { medicine: MedicineRow }) {
  const facts = [
    medicine.category || medicine.typeLabel,
    medicine.manufacturer,
    medicine.batchNumber ? `Batch ${medicine.batchNumber}` : "",
    medicine.expiryDate ? `expires ${expiryMonthLabel(medicine.expiryDate)}` : "",
    medicine.price > 0 ? `${formatRupees(medicine.price)} per unit` : "",
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
      <IconBox icon={PillIcon} tone="aqua" size={40} />
      <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-px">
        <span className="text-[15px] font-extrabold text-ink">{medicine.name}</span>
        <span className="text-xs font-medium text-ink-muted">{facts.join(" · ")}</span>
      </span>
      <Pill tone={STATUS_TONE[medicine.status]}>{STATUS_LABEL[medicine.status]}</Pill>
    </div>
  );
}

/** Message from a failed request, shown inside the dialog so the form stays open. */
export function DialogError({ lead, message }: { lead: string; message?: string | null }) {
  if (!message) return null;
  return (
    <Note tone="rose" icon={CircleAlert}>
      <span role="alert">
        {lead} {message}
      </span>
    </Note>
  );
}
