"use client";

import { useMemo } from "react";
import { AlertCircle, CreditCard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTitle, EmptyBlock, InitialsAvatar, Pill, Surface, statusLabel } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { Payment } from "@/types/billing.types";
import { BillingPager, useBillingPaging } from "./BillingPager";
import {
  formatBillingDate,
  formatRupees,
  paymentDateValue,
  paymentMethodLabel,
  paymentReference,
  paymentStatusTone,
  sortPaymentsNewestFirst,
} from "./billing.logic";

/** Wide card: one line per payment. Narrow card: reference and status, then patient and amount. */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,0.6fr)_120px] @3xl:items-center @3xl:gap-x-4";
const AUTO = "@3xl:col-auto @3xl:row-auto";

interface BillingPaymentsTableProps {
  /** Payments after the filters. The totals in the strip are for this list. */
  payments: Payment[];
  resetKey: string;
  loading?: boolean;
  /** The list could not be loaded (the page shows the reason above). */
  failed?: boolean;
  filtered?: boolean;
}

function Total({ label, value, last = false }: { label: string; value: string | number; last?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 px-[18px] py-2.5 sm:py-0",
        !last && "border-b border-line sm:border-r sm:border-b-0",
      )}
    >
      <dt className="text-xs font-bold text-ink-muted">{label}</dt>
      <dd className="m-0 text-xl font-extrabold text-ink">{value}</dd>
    </div>
  );
}

/** Payments tab for staff: totals strip and a grid table with its own paging. Props only. */
export function BillingPaymentsTable({
  payments,
  resetKey,
  loading = false,
  failed = false,
  filtered = false,
}: BillingPaymentsTableProps) {
  const blank = loading || failed;
  const sorted = useMemo(() => sortPaymentsNewestFirst(payments), [payments]);
  const paging = useBillingPaging(sorted, resetKey);
  const completed = sorted.filter((payment) => payment.status === "COMPLETED");
  const totalCompleted = completed.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  return (
    <Surface flush as="section" className="@container" aria-label="Payments">
      <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-3.5">
        <h2 className="m-0 text-base font-bold text-ink">Recent Transactions</h2>
        <dl className="m-0 flex flex-col rounded-[14px] border border-hair bg-[#f8fafc] py-1 sm:flex-row sm:py-3.5 dark:bg-white/5">
          <Total label="Total Payments" value={blank ? "–" : sorted.length} />
          <Total label="Total Paid (Completed)" value={blank ? "–" : formatRupees(totalCompleted)} />
          <Total label="Completed Count" value={blank ? "–" : completed.length} last />
        </dl>
      </div>

      <div role="table" aria-label="Payments" aria-busy={loading}>
        <div
          role="row"
          className={cn(
            ROW_GRID,
            "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @3xl:grid",
          )}
        >
          <span role="columnheader">Transaction</span>
          <span role="columnheader">Date</span>
          <span role="columnheader">Patient</span>
          <span role="columnheader">Amount</span>
          <span role="columnheader">Status</span>
        </div>

        {loading ? (
          <div aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={cn(ROW_GRID, "items-center gap-y-2.5 border-b border-hair py-3.5 last:border-b-0 @3xl:min-h-[62px] @3xl:py-2")}>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-36 rounded" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
                <Skeleton className={cn("col-[1] row-[3] h-3.5 w-24 rounded", AUTO)} />
                <div className={cn("col-[1] row-[2] flex items-center gap-3", AUTO)}>
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
                <Skeleton className={cn("col-[2] row-[2] h-3.5 w-12 rounded", AUTO)} />
                <Skeleton className={cn("col-[2] row-[1] h-[22px] w-24 rounded-lg", AUTO)} />
              </div>
            ))}
          </div>
        ) : paging.pageRows.length === 0 ? (
          <div role="row">
            <div role="cell">
              {failed ? (
                <EmptyBlock
                  icon={AlertCircle}
                  tone="rose"
                  title="Payments could not be loaded"
                  description="Press Sync Data to try again."
                />
              ) : (
                <EmptyBlock
                  icon={CreditCard}
                  title="No payment records found"
                  description={
                    filtered
                      ? "No payment matches these filters. Change them or press Reset."
                      : "Payments will show here once they are received."
                  }
                />
              )}
            </div>
          </div>
        ) : (
          paging.pageRows.map((payment) => (
            <div
              key={payment.id}
              role="row"
              className={cn(ROW_GRID, "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0 @3xl:min-h-[62px] @3xl:py-2")}
            >
              <div role="cell" className="min-w-0">
                <CellTitle title={paymentReference(payment)} description={paymentMethodLabel(payment.method)} />
              </div>
              <div role="cell" className={cn("col-[1] row-[3] min-w-0 text-ink-soft", AUTO)}>
                {formatBillingDate(paymentDateValue(payment), "2-digit")}
              </div>
              <div role="cell" className={cn("col-[1] row-[2] min-w-0", AUTO)}>
                <CellTitle
                  left={<InitialsAvatar name={payment.patientName} size={32} />}
                  title={payment.patientName || "Unknown"}
                />
              </div>
              <div role="cell" className={cn("col-[2] row-[2] min-w-0 self-center text-right font-bold text-ink @3xl:text-left", AUTO)}>
                {formatRupees(payment.amount)}
              </div>
              <div role="cell" className={cn("col-[2] row-[1] min-w-0 justify-self-end @3xl:justify-self-start", AUTO)}>
                <Pill tone={paymentStatusTone(payment.status)}>{statusLabel(payment.status)}</Pill>
              </div>
            </div>
          ))
        )}
      </div>

      {blank ? null : <BillingPager paging={paging} id="billing-payments" />}
    </Surface>
  );
}
