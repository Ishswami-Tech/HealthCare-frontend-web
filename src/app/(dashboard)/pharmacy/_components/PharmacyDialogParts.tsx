"use client";

import type { ReactNode } from "react";
import { Pill as PillIcon } from "lucide-react";
import { IconBox, Pill, statusTone } from "@/components/tbd";
import { STATUS_LABEL, type MedicineRow } from "./pharmacy-inventory.logic";
import { formatRupees } from "@/lib/utils/currency";
import { formatMonthYearLabel } from "@/lib/utils/date-time";

/**
 * Pharmacy-only pieces of the inventory dialogs. The dialog chrome and the labelled field
 * are the shared ones: `DialogShell`, `DialogBody`, `DialogActions`, `Field` from `@/components/tbd`.
 */

/** Small emerald heading between groups of fields ("MEDICINE"). */
export function FormSectionLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-extrabold uppercase tracking-[0.8px] text-brand">{children}</span>;
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
    medicine.expiryDate ? `expires ${formatMonthYearLabel(medicine.expiryDate)}` : "",
    medicine.price > 0 ? `${formatRupees(medicine.price)} per unit` : "",
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
      <IconBox icon={PillIcon} tone="aqua" size={40} />
      <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-px">
        <span className="text-[15px] font-extrabold text-ink">{medicine.name}</span>
        <span className="text-xs font-medium text-ink-muted">{facts.join(" · ")}</span>
      </span>
      <Pill tone={statusTone(medicine.status)}>{STATUS_LABEL[medicine.status]}</Pill>
    </div>
  );
}
