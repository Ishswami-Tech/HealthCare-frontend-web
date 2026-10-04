"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import {
  PaymentHistory,
  isPaidPayment,
  isRefundedPayment,
} from "@/components/billing/PaymentHistory";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHead, SegTabs, Surface, type TbdOption } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import type { Payment } from "@/types/billing.types";
import { BILLING_ROUTE, invoiceRoute, transactionsRangeLabel } from "./patientBilling.logic";

export type TransactionFilter = "all" | "paid" | "refunds" | "unpaid";

export interface PatientTransactionsViewProps {
  payments: Payment[];
  loading: boolean;
  failed: boolean;
  /** Why the list could not be refreshed; empty when all is well. */
  loadError: string;
  onRetry: () => void;
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
}

const FILTERS: Record<TransactionFilter, (payment: Payment) => boolean> = {
  all: () => true,
  paid: isPaidPayment,
  refunds: isRefundedPayment,
  unpaid: (payment) => !isPaidPayment(payment) && !isRefundedPayment(payment),
};

const EMPTY_TEXT: Record<TransactionFilter, { title: string; description: string }> = {
  all: { title: "No transactions yet", description: "Your payments will show here once they are made." },
  paid: { title: "No paid transactions", description: "Payments that went through will show here." },
  refunds: { title: "No refunds", description: "Money returned to you will show here." },
  unpaid: { title: "Nothing pending or failed", description: "Payments that did not go through will show here." },
};

/** All transactions of a patient with a status filter. Props only. */
export function PatientTransactionsView({
  payments,
  loading,
  failed,
  loadError,
  onRetry,
  filter,
  onFilterChange,
}: PatientTransactionsViewProps) {
  const filtered = useMemo(() => payments.filter(FILTERS[filter]), [payments, filter]);
  const options = useMemo<TbdOption<TransactionFilter>[]>(() => {
    const count = (key: TransactionFilter) => (loading ? undefined : payments.filter(FILTERS[key]).length);
    return [
      { value: "all", label: "All", count: count("all") },
      { value: "paid", label: "Paid", count: count("paid") },
      { value: "refunds", label: "Refunds", count: count("refunds") },
      { value: "unpaid", label: "Not paid", count: count("unpaid") },
    ];
  }, [payments, loading]);

  return (
    <DashboardPageShell>
      <PageHead
        backHref={BILLING_ROUTE}
        backLabel="Billing & Payments"
        title="All transactions"
        description={loading ? "Loading your transactions…" : transactionsRangeLabel(payments)}
      />

      {loadError ? (
        <Surface
          role="alert"
          className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 text-[13px] text-[#92400e] shadow-none dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span className="flex min-w-0 items-center gap-3">
            <AlertCircle className="size-[22px] shrink-0 text-[#d97706] dark:text-amber-300" strokeWidth={2} aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <strong className="text-sm font-bold">We could not refresh your transactions.</strong>
              <span>{loadError}</span>
            </span>
          </span>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </Surface>
      ) : null}

      <SegTabs options={options} value={filter} onChange={onFilterChange} ariaLabel="Filter transactions" />

      <PaymentHistory
        payments={filtered}
        compact
        title={null}
        loading={loading}
        failed={failed}
        invoiceHref={invoiceRoute}
        resetKey={filter}
        emptyTitle={EMPTY_TEXT[filter].title}
        emptyDescription={EMPTY_TEXT[filter].description}
      />
    </DashboardPageShell>
  );
}
