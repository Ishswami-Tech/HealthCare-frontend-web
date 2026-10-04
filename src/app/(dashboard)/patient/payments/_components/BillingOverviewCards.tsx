"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, ChevronRight, FileText, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, Pill, SoftCard, Surface } from "@/components/tbd";
import { invoiceNumberLabel } from "@/components/billing/staff/billing.logic";
import { cn } from "@/lib/utils";
import type { Invoice, Subscription } from "@/types/billing.types";
import {
  TRANSACTIONS_ROUTE,
  cycleLabel,
  formatAmount,
  formatAmountExact,
  formatDate,
  getPeriodEndLabel,
  getVisitProgress,
  invoiceRoute,
  invoiceSubject,
  invoiceTotal,
  type DueSummary,
  type SpendCategoryKey,
  type SpendSummary,
} from "./patientBilling.logic";

/** The pay control for an invoice. The container supplies the real payment button. */
export type RenderInvoicePay = (invoice: Invoice, placement: "hero" | "row" | "page") => ReactNode;

// ── Amount due ─────────────────────────────────────────────────────────────

/** Feature card: what the patient still has to pay, with the pay button for the invoice due first. */
export function BillingDueCard({
  due,
  loading = false,
  failed = false,
  renderPay,
  onSeeInvoices,
}: {
  due: DueSummary;
  loading?: boolean;
  /** The invoices could not be loaded, so the amount is not known. */
  failed?: boolean;
  renderPay: RenderInvoicePay;
  onSeeInvoices: () => void;
}) {
  const next = due.next;
  return (
    <SoftCard as="section" aria-label="Amount due" className="flex h-full flex-col gap-4" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] font-bold text-ink-muted">
          <Wallet className="size-[18px] shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
          Amount due
        </span>
        {loading || failed ? null : (
          <Pill tone="white">{due.count > 0 ? `${due.count} to pay` : "All paid"}</Pill>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[13px] text-ink-muted">Total to pay</span>
        {loading ? (
          <Skeleton className="my-1 h-8 w-44 rounded-lg" />
        ) : (
          <span className="text-[30px] font-extrabold leading-[1.2] tracking-[-0.5px] text-ink">
            {failed ? "–" : formatAmountExact(due.total)}
          </span>
        )}
        {loading ? (
          <Skeleton className="h-3.5 w-56 rounded" />
        ) : (
          <span className="text-[13px] text-ink-muted">
            {failed
              ? "Your invoices could not be loaded."
              : next
                ? `Next: ${invoiceNumberLabel(next)} · due ${formatDate(next.dueDate)}`
                : "You have nothing to pay right now."}
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-11 w-40 rounded-xl" />
      ) : failed ? null : next ? (
        <div className="flex flex-wrap items-center gap-2.5">
          {renderPay(next, "hero")}
          <Button variant="outline" size="md" asChild>
            <Link href={invoiceRoute(next.id)}>View invoice</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="md" onClick={onSeeInvoices}>
            <FileText aria-hidden="true" />
            See invoices
          </Button>
        </div>
      )}
    </SoftCard>
  );
}

// ── Plan ───────────────────────────────────────────────────────────────────

/** The active plan (or "no plan"), with the way to the plans list. */
export function BillingPlanCard({
  subscription,
  loading = false,
  failed = false,
  onOpenPlans,
}: {
  subscription: Subscription | undefined;
  loading?: boolean;
  /** The subscriptions could not be loaded, so the plan is not known. */
  failed?: boolean;
  onOpenPlans: () => void;
}) {
  const progress = subscription ? getVisitProgress(subscription) : null;
  const cycle = cycleLabel(subscription?.plan?.billingCycle);
  return (
    <Surface as="section" aria-label="Your plan" className="h-full" aria-busy={loading}>
      <div className="flex items-center gap-3.5">
        <IconBox icon={ShieldCheck} tone={subscription ? "mint" : "slate"} size={56} />
        {loading ? (
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-3.5 w-48 rounded" />
            <Skeleton className="h-3.5 w-32 rounded" />
          </div>
        ) : subscription ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-bold text-ink">{subscription.plan?.name ?? "Subscription plan"}</span>
              <Pill tone="green">Active</Pill>
            </span>
            <span className="text-[13px] text-ink-muted">
              {progress ? `${progress.used} of ${progress.limit} visits used` : "Unlimited visits"}
            </span>
            <span className="text-[13px] text-ink-muted">
              {cycle ? `${cycle} plan · ` : ""}valid till {getPeriodEndLabel(subscription)}
            </span>
          </div>
        ) : failed ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15px] font-bold text-ink">Your plan</span>
            <span className="text-[13px] text-ink-muted">Your plan could not be loaded.</span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15px] font-bold text-ink">No active plan</span>
            <span className="text-[13px] text-ink-muted">Subscribe to a plan to book in-clinic visits.</span>
          </div>
        )}
      </div>
      <div className="flex-1" />
      <Button variant="soft" className="h-10 w-full" onClick={onOpenPlans}>
        {subscription ? "View plans" : "See plans"}
      </Button>
    </Surface>
  );
}

// ── Spending ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<SpendCategoryKey, string> = {
  consultations: "bg-[#4f46e5]",
  medicines: "bg-[#059669]",
  plans: "bg-[#ea580c]",
  other: "bg-[#94a3b8]",
};

const CHART = { width: 318, height: 120, base: 96, bar: 34, step: 53, left: 10, max: 78 };

/** Paid this month, the last six months as bars, and this month split by what it was for. */
export function BillingSpendCard({
  spend,
  loading = false,
  failed = false,
}: {
  spend: SpendSummary;
  loading?: boolean;
  /** The payments could not be loaded, so the numbers are not known. */
  failed?: boolean;
}) {
  const peak = Math.max(...spend.months.map((month) => month.total), 0);
  const change = spend.change;
  const first = spend.months[0];
  return (
    <Surface as="section" aria-label="Spending" className="h-full gap-4 p-[22px]" aria-busy={loading}>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-ink-muted">Spent in {spend.current.name}</span>
          {loading ? (
            <Skeleton className="my-0.5 h-7 w-28 rounded-lg" />
          ) : (
            <span className="text-2xl font-extrabold leading-[1.2] text-ink">
              {failed ? "–" : formatAmount(spend.current.total)}
            </span>
          )}
        </div>
        {!loading && change !== null && change !== 0 && spend.previous ? (
          <span
            className={cn(
              "flex items-center gap-1 rounded-[8px] px-[9px] py-[5px] text-xs font-bold",
              change < 0
                ? "bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-[#f1f5f9] text-[#334155] dark:bg-slate-500/20 dark:text-slate-300",
            )}
          >
            {change < 0 ? (
              <ArrowDown className="size-3" strokeWidth={3} aria-hidden="true" />
            ) : (
              <ArrowUp className="size-3" strokeWidth={3} aria-hidden="true" />
            )}
            {Math.abs(change)}% vs {spend.previous.label}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-label={`Paid each month, ${first?.label ?? ""} to ${spend.current.label}`}
          className="h-auto w-full max-w-[318px] shrink-0"
        >
          <line x1="0" y1={CHART.base} x2={CHART.width} y2={CHART.base} className="stroke-line" strokeWidth="1" />
          {spend.months.map((month, index) => {
            const height = loading || peak <= 0 || month.total <= 0 ? 0 : Math.max(6, (month.total / peak) * CHART.max);
            const x = CHART.left + index * CHART.step;
            return (
              <g key={month.key}>
                {height > 0 ? (
                  <rect
                    x={x}
                    y={CHART.base - height}
                    width={CHART.bar}
                    height={height}
                    rx="8"
                    className={month.current ? "fill-[#059669]" : "fill-[#d1fae5] dark:fill-emerald-500/25"}
                  >
                    <title>{`${month.name}: ${formatAmount(month.total)}`}</title>
                  </rect>
                ) : null}
                <text
                  x={x + CHART.bar / 2}
                  y="114"
                  textAnchor="middle"
                  fontSize="12"
                  className={month.current ? "fill-brand font-bold" : "fill-ink-muted"}
                >
                  {month.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          {loading ? (
            <>
              <Skeleton className="h-2.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
            </>
          ) : failed ? (
            <p className="m-0 text-[13px] text-ink-muted">Your payments could not be loaded.</p>
          ) : spend.categories.length === 0 ? (
            <p className="m-0 text-[13px] text-ink-muted">No payments this month.</p>
          ) : (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-md" aria-hidden="true">
                {spend.categories.map((category) => (
                  <span
                    key={category.key}
                    className={CATEGORY_COLORS[category.key]}
                    style={{ width: `${category.share}%` }}
                  />
                ))}
              </div>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[13px] text-ink">
                {spend.categories.map((category) => (
                  <li key={category.key} className="flex items-center gap-2">
                    <span className={cn("size-2.5 shrink-0 rounded-[3px]", CATEGORY_COLORS[category.key])} aria-hidden="true" />
                    <span className="flex-1">{category.label}</span>
                    <span className="font-bold">{formatAmount(category.amount)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Surface>
  );
}

// ── Invoices to pay ────────────────────────────────────────────────────────

/** Pending invoices, each with its own pay button. */
export function BillingPendingInvoicesCard({
  invoices,
  loading = false,
  failed = false,
  renderPay,
}: {
  invoices: Invoice[];
  loading?: boolean;
  failed?: boolean;
  renderPay: RenderInvoicePay;
}) {
  const shown = invoices.slice(0, 4);
  const more = invoices.length - shown.length;
  return (
    <Surface as="section" aria-label="Invoices to pay" className="h-full gap-1.5" aria-busy={loading}>
      <h2 className="m-0 text-base font-bold text-ink">Invoices to pay</h2>
      {loading ? (
        <div className="flex flex-col" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex min-h-[60px] items-center gap-3 border-b border-hair last:border-b-0">
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyBlock
          className="py-6"
          icon={failed ? AlertCircle : CheckCircle2}
          tone={failed ? "rose" : "mint"}
          title={failed ? "Invoices could not be loaded" : "Nothing to pay"}
          description={failed ? "Please try again in a moment." : "New invoices will show here."}
        />
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {shown.map((invoice) => (
            <li
              key={invoice.id}
              className="flex min-h-[60px] flex-wrap items-center gap-x-3 gap-y-2 border-b border-hair py-2 last:border-b-0"
            >
              <Link
                href={invoiceRoute(invoice.id)}
                className="flex min-w-0 flex-1 flex-col rounded-[8px] hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <span className="truncate text-sm font-bold text-ink">{invoiceNumberLabel(invoice)}</span>
                <span className="truncate text-xs text-ink-muted">
                  Due {formatDate(invoice.dueDate)} · {invoiceSubject(invoice)}
                </span>
              </Link>
              {renderPay(invoice, "row")}
            </li>
          ))}
        </ul>
      )}
      {more > 0 ? (
        <p className="m-0 pt-1 text-[13px] text-ink-muted">
          And {more} more in the invoices list below ({formatAmount(invoices.slice(4).reduce((sum, invoice) => sum + invoiceTotal(invoice), 0))}).
        </p>
      ) : null}
    </Surface>
  );
}

/** "See all" link at the right of the recent transactions title. */
export function SeeAllTransactionsLink() {
  return (
    <Link
      href={TRANSACTIONS_ROUTE}
      className="inline-flex items-center gap-1 rounded-[8px] text-[13px] font-bold text-brand hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      See all
      <ChevronRight className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  );
}
