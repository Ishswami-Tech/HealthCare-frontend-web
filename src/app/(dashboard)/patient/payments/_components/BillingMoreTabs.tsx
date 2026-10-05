"use client";

import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, CreditCard, Download, FileText, Loader2, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyBlock, IconBox, Note, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import { BillingPager, useBillingPaging } from "@/components/billing/staff/BillingPager";
import { invoiceNumberLabel } from "@/components/billing/staff/billing.logic";
import { cn } from "@/lib/utils";
import type { BillingPlan, Invoice, Subscription } from "@/types/billing.types";
import type { RenderInvoicePay } from "./BillingOverviewCards";
import {
  cycleLabel,
  formatAmount,
  formatDate,
  getPeriodEndLabel,
  getPeriodStart,
  getSubscriptionDisplayStatus,
  getVisitProgress,
  invoiceIssuedAt,
  invoicePaidAt,
  invoiceRoute,
  invoiceSubject,
  invoiceTotal,
  isPaidInvoice,
  isPayableInvoice,
  type SubscriptionGroups,
} from "./patientBilling.logic";

export const PATIENT_BILLING_TABS = ["invoices", "plans", "subscriptions"] as const;
export type PatientBillingTab = (typeof PATIENT_BILLING_TABS)[number];

/** Id of the block, so "View plans" can scroll to it. */
export const BILLING_TABS_ID = "patient-billing-more";

interface BillingMoreTabsProps {
  tab: PatientBillingTab;
  onTabChange: (tab: string) => void;
  invoices: Invoice[];
  invoicesLoading?: boolean;
  invoicesFailed?: boolean;
  renderPay: RenderInvoicePay;
  onDownloadPdf: (invoiceId: string) => void;
  downloadingPdfId?: string | null;
  plans: BillingPlan[];
  plansLoading?: boolean;
  onChoosePlan: (plan: BillingPlan) => void;
  onReloadPlans: () => void;
  subscriptions: SubscriptionGroups;
  subscriptionsLoading?: boolean;
  subscriptionsFailed?: boolean;
  showSubscriptionHistory: boolean;
  onToggleSubscriptionHistory: () => void;
}

// ── Invoices ───────────────────────────────────────────────────────────────

/** Wide card: one line per invoice. Narrow card: number and amount, then dates and status, then the buttons. */
const INVOICE_GRID =
  "grid-cols-[minmax(0,1fr)_auto] gap-x-3 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,1.2fr)] @3xl:items-center @3xl:gap-x-4";
const AUTO = "@3xl:col-auto @3xl:row-auto";

function invoiceDateLine(invoice: Invoice): string {
  if (isPaidInvoice(invoice)) return `Paid ${formatDate(invoicePaidAt(invoice) ?? invoice.updatedAt)}`;
  return `Due ${formatDate(invoice.dueDate)}`;
}

function InvoicesList({
  invoices,
  loading,
  failed,
  renderPay,
  onDownloadPdf,
  downloadingPdfId,
}: Pick<BillingMoreTabsProps, "invoices" | "renderPay" | "onDownloadPdf" | "downloadingPdfId"> & {
  loading: boolean;
  failed: boolean;
}) {
  const paging = useBillingPaging(invoices, "invoices");

  if (loading) {
    return (
      <Surface flush aria-busy="true" aria-label="Loading invoices">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-hair px-5 py-4 last:border-b-0">
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="h-[22px] w-16 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-xl" />
          </div>
        ))}
      </Surface>
    );
  }

  if (invoices.length === 0) {
    return (
      <Surface flush>
        {failed ? (
          <EmptyBlock
            icon={AlertCircle}
            tone="rose"
            title="Invoices could not be loaded"
            description="Press Retry at the top of the page."
          />
        ) : (
          <EmptyBlock
            icon={FileText}
            title="No invoices found"
            description="Any open or paid invoices will appear here."
          />
        )}
      </Surface>
    );
  }

  return (
    <Surface flush as="section" className="@container" aria-label="Invoices">
      <div
        aria-hidden="true"
        className={cn(
          INVOICE_GRID,
          "hidden border-b border-hair px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @3xl:grid",
        )}
      >
        <span>Invoice</span>
        <span>Date</span>
        <span>Status</span>
        <span>Amount</span>
        <span className="text-right">Actions</span>
      </div>
      <ul className="m-0 list-none p-0">
        {paging.pageRows.map((invoice) => (
          <li
            key={invoice.id}
            className={cn(
              INVOICE_GRID,
              "grid items-start gap-y-2.5 border-b border-hair px-5 py-3.5 text-sm last:border-b-0 @3xl:min-h-[62px] @3xl:py-2",
            )}
          >
            <Link
              href={invoiceRoute(invoice.id)}
              className="flex min-w-0 flex-col gap-px rounded-[8px] hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span className="truncate font-bold text-ink">{invoiceNumberLabel(invoice)}</span>
              <span className="truncate text-xs text-ink-muted">{invoiceSubject(invoice)}</span>
            </Link>
            <span className={cn("col-[1] row-[2] flex min-w-0 flex-col gap-px text-[13px] text-ink-soft", AUTO)}>
              <span>Issued {formatDate(invoiceIssuedAt(invoice))}</span>
              <span className="text-xs text-ink-muted">{invoiceDateLine(invoice)}</span>
            </span>
            <span className={cn("col-[2] row-[2] flex justify-self-end @3xl:justify-self-start", AUTO)}>
              <Pill tone={statusTone(invoice.status)}>{statusLabel(invoice.status)}</Pill>
            </span>
            <span className={cn("col-[2] row-[1] text-right font-bold text-ink @3xl:text-left", AUTO)}>
              {formatAmount(invoiceTotal(invoice), invoice.currency)}
            </span>
            <span className={cn("col-span-2 row-[3] flex flex-wrap items-center gap-2 @3xl:justify-end", AUTO)}>
              <Button
                variant="outline"
                disabled={downloadingPdfId === invoice.id}
                onClick={() => onDownloadPdf(invoice.id)}
                aria-label={`Download PDF of invoice ${invoiceNumberLabel(invoice)}`}
              >
                {downloadingPdfId === invoice.id ? <Loader2 className="animate-spin" /> : <Download />}
                PDF
              </Button>
              {isPayableInvoice(invoice) ? renderPay(invoice, "row") : null}
            </span>
          </li>
        ))}
      </ul>
      {paging.total > 10 ? <BillingPager paging={paging} id="patient-invoices" /> : null}
    </Surface>
  );
}

// ── Plans ──────────────────────────────────────────────────────────────────

function PlansGrid({
  plans,
  loading,
  current,
  currentPlanId,
  onChoosePlan,
  onReloadPlans,
}: Pick<BillingMoreTabsProps, "plans" | "onChoosePlan" | "onReloadPlans"> & {
  loading: boolean;
  current: Subscription | undefined;
  currentPlanId: string | undefined;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading plans">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[212px] rounded-[20px]" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={Wallet}
          title="No subscription plans are available right now"
          description="Try refreshing or check again later."
          action={
            <Button variant="outline" size="md" onClick={onReloadPlans}>
              <RefreshCw />
              Refresh plans
            </Button>
          }
        />
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <Note tone="green" icon={CheckCircle2}>
          <strong className="font-bold">
            {current.plan?.name ? `${current.plan.name} is active.` : "You have an active subscription."}
          </strong>{" "}
          You can still review or switch plans below.
        </Note>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <Surface key={plan.id} as="article" className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-lg font-extrabold text-ink">{plan.name}</h3>
                {isCurrent ? <Pill tone="green">Active</Pill> : null}
              </div>
              <p className="m-0 flex items-baseline gap-1.5">
                <span className="text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-brand">
                  {formatAmount(plan.price, plan.currency)}
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.6px] text-ink-muted">
                  / {cycleLabel(plan.billingCycle).toLowerCase()}
                </span>
              </p>
              {plan.description ? <p className="m-0 line-clamp-2 text-[13px] text-ink-muted">{plan.description}</p> : null}
              <div>
                {plan.isUnlimitedAppointments ? (
                  <Pill tone="green">Unlimited visits</Pill>
                ) : (
                  <Pill tone="blue">{plan.appointmentsIncluded ?? 0} visits included</Pill>
                )}
              </div>
              {Array.isArray(plan.features) && plan.features.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li key={`${plan.id}-${feature}`} className="flex items-center gap-2 text-[13px] text-ink-soft">
                      <Check className="size-3.5 shrink-0 text-brand" strokeWidth={2.6} aria-hidden="true" />
                      <span className="truncate">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-auto border-t border-hair pt-4">
                {isCurrent ? (
                  <div className="flex h-11 items-center justify-center rounded-xl bg-mint-soft">
                    <Pill tone="green">Current plan</Pill>
                  </div>
                ) : (
                  <Button size="md" className="w-full" onClick={() => onChoosePlan(plan)}>
                    Subscribe
                  </Button>
                )}
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}

// ── Subscriptions ──────────────────────────────────────────────────────────

function SubscriptionsList({
  groups,
  loading,
  failed,
  showHistory,
  onToggleHistory,
  onOpenPlans,
}: {
  groups: SubscriptionGroups;
  loading: boolean;
  failed: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
  onOpenPlans: () => void;
}) {
  if (loading) {
    return <Skeleton className="h-[76px] w-full rounded-[20px]" aria-busy="true" aria-label="Loading subscriptions" />;
  }

  if (groups.all.length === 0 && failed) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={AlertCircle}
          tone="rose"
          title="Subscriptions could not be loaded"
          description="Press Retry at the top of the page."
        />
      </Surface>
    );
  }

  if (groups.all.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={Wallet}
          title="You do not have any subscriptions yet"
          description="Pick a plan to start using subscription benefits."
          action={
            <Button size="md" onClick={onOpenPlans}>
              View plans
            </Button>
          }
        />
      </Surface>
    );
  }

  const hasActive = groups.active.length > 0;
  const hasEnded = groups.ended.length > 0;
  // No active plan: the ended ones are the list. Otherwise they are shown on request.
  const rows = hasActive ? [...groups.active, ...(showHistory ? groups.ended : [])] : groups.ended;

  return (
    <div className="flex flex-col gap-4">
      {!hasActive && hasEnded ? (
        <Note tone="amber" icon={AlertCircle} className="flex-wrap">
          <strong className="font-bold">Your subscription has ended.</strong> You can buy a plan again from the Plans tab.
        </Note>
      ) : null}
      <Surface flush as="section" aria-label="Subscriptions">
        <ul className="m-0 list-none p-0">
          {rows.map((subscription) => {
            const progress = getVisitProgress(subscription);
            const status = getSubscriptionDisplayStatus(subscription);
            const start = getPeriodStart(subscription);
            return (
              <li
                key={subscription.id}
                className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-hair px-5 py-3.5 last:border-b-0"
              >
                <IconBox icon={CreditCard} tone="mint" />
                <span className="flex min-w-[160px] flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-bold text-ink">
                    {subscription.plan?.name ?? "Subscription plan"}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {subscription.plan?.billingCycle ? `${cycleLabel(subscription.plan.billingCycle)} · ` : ""}
                    {start ? formatDate(start) : "--"} to {getPeriodEndLabel(subscription)}
                  </span>
                </span>
                <span className="text-[13px] text-ink-soft">
                  {progress ? `${progress.used}/${progress.limit} visits used` : "Unlimited visits"}
                </span>
                <Pill tone={status === "TRIALING" ? "blue" : statusTone(status)}>{statusLabel(status)}</Pill>
              </li>
            );
          })}
        </ul>
      </Surface>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="md" onClick={onOpenPlans}>
          View plans
        </Button>
        {hasActive && hasEnded ? (
          <Button variant="ghost" size="md" onClick={onToggleHistory} aria-expanded={showHistory}>
            {showHistory ? "Hide subscription history" : `View subscription history (${groups.ended.length})`}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Everything the board has no place for, kept below it in the same look:
 * all invoices (with PDF), the plans to subscribe to, and the patient's subscriptions.
 */
export function BillingMoreTabs({
  tab,
  onTabChange,
  invoices,
  invoicesLoading = false,
  invoicesFailed = false,
  renderPay,
  onDownloadPdf,
  downloadingPdfId,
  plans,
  plansLoading = false,
  onChoosePlan,
  onReloadPlans,
  subscriptions,
  subscriptionsLoading = false,
  subscriptionsFailed = false,
  showSubscriptionHistory,
  onToggleSubscriptionHistory,
}: BillingMoreTabsProps) {
  return (
    <Tabs id={BILLING_TABS_ID} value={tab} onValueChange={onTabChange} className="scroll-mt-24 gap-4">
      <TabsList aria-label="Invoices, plans and subscriptions">
        <TabsTrigger value="invoices">
          Invoices
          {invoicesLoading ? null : <TabsCount>{invoices.length}</TabsCount>}
        </TabsTrigger>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
      </TabsList>

      <TabsContent value="invoices">
        <InvoicesList
          invoices={invoices}
          loading={invoicesLoading}
          failed={invoicesFailed}
          renderPay={renderPay}
          onDownloadPdf={onDownloadPdf}
          downloadingPdfId={downloadingPdfId}
        />
      </TabsContent>

      <TabsContent value="plans">
        <PlansGrid
          plans={plans}
          loading={plansLoading}
          current={subscriptions.current}
          currentPlanId={subscriptions.currentPlanId}
          onChoosePlan={onChoosePlan}
          onReloadPlans={onReloadPlans}
        />
      </TabsContent>

      <TabsContent value="subscriptions">
        <SubscriptionsList
          groups={subscriptions}
          loading={subscriptionsLoading}
          failed={subscriptionsFailed}
          showHistory={showSubscriptionHistory}
          onToggleHistory={onToggleSubscriptionHistory}
          onOpenPlans={() => onTabChange("plans")}
        />
      </TabsContent>
    </Tabs>
  );
}
