"use client";

import { Activity, AlertCircle, ChevronRight, Clock, CreditCard, FileText, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTitle, EmptyBlock, IconBox, InitialsAvatar, Pill, Surface, statusLabel } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { Invoice, Payment } from "@/types/billing.types";
import { InvoiceRowActions, type BillingInvoiceActions } from "./BillingInvoicesTable";
import { BillingSplitChart } from "./BillingSplitChart";
import {
  formatBillingDate,
  formatRupees,
  invoiceNumberLabel,
  paymentDateValue,
  paymentMethodLabel,
  paymentStatusTone,
  sortPaymentsNewestFirst,
  type BillingTotals,
} from "./billing.logic";

const PENDING_LIMIT = 5;
const RECENT_LIMIT = 4;

const PENDING_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_64px_264px] @2xl:items-center @2xl:gap-x-4";
const PENDING_GRID_WIDE =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-5 @4xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_64px_400px] @4xl:items-center @4xl:gap-x-4";

interface BillingOverviewTabProps {
  totals: BillingTotals;
  invoices: Invoice[];
  payments: Payment[];
  loading?: boolean;
  /** Invoices and payments could not be loaded (the page shows the reason above). */
  failed?: boolean;
  invoiceActions: BillingInvoiceActions;
  onViewAllInvoices: () => void;
  onViewAllPayments: () => void;
}

function ViewAllButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {label}
      <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

function AmountTile({
  tone,
  label,
  value,
  hint,
  loading,
}: {
  tone: "paid" | "pending";
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  const Icon = tone === "paid" ? Wallet : Clock;
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl border p-[18px]",
        tone === "paid"
          ? "border-[#c9eedb] bg-[#ecfdf5] dark:border-emerald-900 dark:bg-emerald-500/10"
          : "border-[#fde9a8] bg-[#fffbeb] dark:border-amber-900 dark:bg-amber-500/10",
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-[14px]",
          tone === "paid"
            ? "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/20 dark:text-emerald-300"
            : "bg-[#fde68a] text-[#b45309] dark:bg-amber-500/20 dark:text-amber-300",
        )}
        aria-hidden="true"
      >
        <Icon className="size-[22px]" strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-bold text-ink-muted">{label}</span>
        {loading ? (
          <Skeleton className="my-1 h-6 w-24 rounded" />
        ) : (
          <span className="truncate text-[28px] font-extrabold leading-[1.15] tracking-[-0.5px] text-ink">{value}</span>
        )}
        <span className="text-xs text-ink-muted">{loading ? "Loading" : hint}</span>
      </span>
    </div>
  );
}

function OverviewCard({ totals, loading }: { totals: BillingTotals; loading: boolean }) {
  const { paidAmount, pendingAmount, paidShare, completedPayments, pendingInvoices } = totals;
  return (
    <Surface as="section" className="gap-[18px]" aria-labelledby="billing-overview-title">
      <div className="flex items-center gap-3">
        <IconBox icon={Activity} tone="mint" size={36} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id="billing-overview-title" className="m-0 text-base font-bold text-ink">
            Overview
          </h2>
          <p className="m-0 text-[13px] text-ink-muted">Paid revenue against the amount still pending</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <AmountTile
          tone="paid"
          label="Total Paid Revenue"
          value={formatRupees(paidAmount)}
          hint={`${completedPayments} completed payment${completedPayments === 1 ? "" : "s"}`}
          loading={loading}
        />
        <AmountTile
          tone="pending"
          label="Total Pending"
          value={formatRupees(pendingAmount)}
          hint={`${pendingInvoices} pending invoice${pendingInvoices === 1 ? "" : "s"}`}
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          <Skeleton className="h-3 w-full rounded-[6px]" />
          <Skeleton className="h-3.5 w-48 rounded" />
        </div>
      ) : paidShare === null ? (
        <p className="m-0 rounded-[14px] border border-dashed border-line px-4 py-3.5 text-[13px] text-ink-muted">
          Nothing to chart yet. The bar shows up once there is a completed payment or a pending invoice.
        </p>
      ) : (
        <BillingSplitChart paid={paidAmount} pending={pendingAmount} paidShare={paidShare} />
      )}
    </Surface>
  );
}

function PendingInvoicesCard({
  invoices,
  loading,
  invoiceActions,
  onViewAll,
}: {
  invoices: Invoice[];
  loading: boolean;
  invoiceActions: BillingInvoiceActions;
  onViewAll: () => void;
}) {
  const pending = invoices.filter((invoice) => invoice.status === "PENDING");
  const rows = pending.slice(0, PENDING_LIMIT);
  const wide = Boolean(invoiceActions.onMarkPaid || invoiceActions.onSendWhatsApp);
  const grid = wide ? PENDING_GRID_WIDE : PENDING_GRID;
  const auto = wide ? "@4xl:col-auto @4xl:row-auto" : "@2xl:col-auto @2xl:row-auto";
  const tall = wide ? "@4xl:min-h-16 @4xl:py-2" : "@2xl:min-h-16 @2xl:py-2";

  return (
    <Surface flush as="section" className="@container" aria-labelledby="billing-pending-title">
      <div className="flex items-center justify-between gap-3 px-5 pt-[18px] pb-1.5">
        <h2 id="billing-pending-title" className="m-0 text-base font-bold text-ink">
          Pending invoices
        </h2>
        <ViewAllButton label="View all invoices" onClick={onViewAll} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 px-5 py-4" aria-hidden="true">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyBlock icon={FileText} title="No pending invoices" description="Every invoice is paid or closed." className="py-8" />
      ) : (
        <div role="table" aria-label="Pending invoices">
          <div
            role="row"
            className={cn(
              grid,
              "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted",
              wide ? "@4xl:grid" : "@2xl:grid",
            )}
          >
            <span role="columnheader">Invoice</span>
            <span role="columnheader">Patient</span>
            <span role="columnheader">Amount</span>
            <span role="columnheader">Actions</span>
          </div>
          {rows.map((invoice) => (
            <div
              key={invoice.id}
              role="row"
              className={cn(grid, tall, "items-start gap-y-2.5 border-b border-hair py-3.5 text-sm last:border-b-0")}
            >
              <div role="cell" className="min-w-0">
                <CellTitle title={invoiceNumberLabel(invoice)} description={`Due ${formatBillingDate(invoice.dueDate)}`} />
              </div>
              <div role="cell" className={cn("col-[1] row-[2] min-w-0", auto)}>
                <CellTitle left={<InitialsAvatar name={invoice.patientName} size={32} />} title={invoice.patientName || "Unknown"} />
              </div>
              <div role="cell" className={cn("col-[2] row-[1] min-w-0 font-bold text-ink", auto)}>
                {formatRupees(invoice.amount)}
              </div>
              <div role="cell" className={cn("col-[1/-1] row-[3] min-w-0", auto)}>
                <InvoiceRowActions invoice={invoice} {...invoiceActions} />
              </div>
            </div>
          ))}
          {pending.length > rows.length ? (
            <p className="m-0 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
              Showing {rows.length} of {pending.length} pending invoices.
            </p>
          ) : null}
        </div>
      )}
    </Surface>
  );
}

function RecentPaymentsCard({
  payments,
  loading,
  onViewAll,
}: {
  payments: Payment[];
  loading: boolean;
  onViewAll: () => void;
}) {
  const recent = sortPaymentsNewestFirst(payments).slice(0, RECENT_LIMIT);
  return (
    <Surface as="section" className="gap-1" aria-labelledby="billing-recent-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="billing-recent-title" className="m-0 text-base font-bold text-ink">
          Recent payments
        </h2>
        <ViewAllButton label="View all" onClick={onViewAll} />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 pt-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-3.5 w-12 rounded" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <EmptyBlock icon={CreditCard} title="No payments yet" description="Payments show here as they come in." className="py-8" />
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {recent.map((payment) => (
            <li key={payment.id} className="flex items-center gap-3.5 border-b border-hair py-[11px] last:border-b-0">
              <InitialsAvatar name={payment.patientName} size={36} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-bold text-ink">{payment.patientName || "Unknown"}</span>
                <span className="truncate text-xs text-ink-muted">
                  {paymentMethodLabel(payment.method)} · {formatBillingDate(paymentDateValue(payment), "2-digit")}
                </span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-sm font-bold text-ink">{formatRupees(payment.amount)}</span>
                <Pill tone={paymentStatusTone(payment.status)}>{statusLabel(payment.status)}</Pill>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}

/** Overview tab for staff: paid against pending, the pending invoices and the latest payments. Props only. */
export function BillingOverviewTab({
  totals,
  invoices,
  payments,
  loading = false,
  failed = false,
  invoiceActions,
  onViewAllInvoices,
  onViewAllPayments,
}: BillingOverviewTabProps) {
  if (failed) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={AlertCircle}
          tone="rose"
          title="The overview could not be loaded"
          description="Press Sync Data to try again."
        />
      </Surface>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <OverviewCard totals={totals} loading={loading} />
        <PendingInvoicesCard
          invoices={invoices}
          loading={loading}
          invoiceActions={invoiceActions}
          onViewAll={onViewAllInvoices}
        />
      </div>
      <RecentPaymentsCard payments={payments} loading={loading} onViewAll={onViewAllPayments} />
    </div>
  );
}
