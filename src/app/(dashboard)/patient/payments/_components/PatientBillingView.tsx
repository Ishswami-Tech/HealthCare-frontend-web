"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, Receipt } from "lucide-react";
import { PaymentHistory } from "@/components/billing/PaymentHistory";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { PageHead, Surface } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import type { BillingPlan, Invoice, Payment } from "@/types/billing.types";
import { BillingMoreTabs, type PatientBillingTab } from "./BillingMoreTabs";
import {
  BillingDueCard,
  BillingPendingInvoicesCard,
  BillingPlanCard,
  BillingSpendCard,
  SeeAllTransactionsLink,
  type RenderInvoicePay,
} from "./BillingOverviewCards";
import {
  PROFILE_ROUTE,
  TRANSACTIONS_ROUTE,
  buildDueSummary,
  buildSpendSummary,
  invoiceRoute,
  pendingInvoices,
  type SubscriptionGroups,
} from "./patientBilling.logic";

export interface PatientBillingViewProps {
  /**
   * Why the billing data could not be refreshed; empty when all is well.
   * The `…Failed` flags mean "no data at all", so those blocks say so instead of showing zeros.
   */
  loadError: string;
  onRetry: () => void;
  invoices: Invoice[];
  invoicesLoading: boolean;
  invoicesFailed: boolean;
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsFailed: boolean;
  subscriptions: SubscriptionGroups;
  subscriptionsLoading: boolean;
  subscriptionsFailed: boolean;
  /** Active plans the patient can subscribe to. */
  plans: BillingPlan[];
  plansLoading: boolean;
  tab: PatientBillingTab;
  onTabChange: (tab: string) => void;
  /** Opens the Plans tab and brings it into view. */
  onOpenPlans: () => void;
  /** Opens the Invoices tab and brings it into view. */
  onOpenInvoices: () => void;
  /** The pay control for a pending invoice (the container supplies the real payment button). */
  renderPay: RenderInvoicePay;
  onDownloadPdf: (invoiceId: string) => void;
  downloadingPdfId: string | null;
  onChoosePlan: (plan: BillingPlan) => void;
  onReloadPlans: () => void;
  showSubscriptionHistory: boolean;
  onToggleSubscriptionHistory: () => void;
  /** "Today" for the spending chart (the preview pins it). */
  now?: Date;
  /** Dialogs owned by the container. */
  children?: ReactNode;
}

/** Billing & Payments for a patient. Props only: every number comes from the container. */
export function PatientBillingView({
  loadError,
  onRetry,
  invoices,
  invoicesLoading,
  invoicesFailed,
  payments,
  paymentsLoading,
  paymentsFailed,
  subscriptions,
  subscriptionsLoading,
  subscriptionsFailed,
  plans,
  plansLoading,
  tab,
  onTabChange,
  onOpenPlans,
  onOpenInvoices,
  renderPay,
  onDownloadPdf,
  downloadingPdfId,
  onChoosePlan,
  onReloadPlans,
  showSubscriptionHistory,
  onToggleSubscriptionHistory,
  now,
  children,
}: PatientBillingViewProps) {
  const due = useMemo(() => buildDueSummary(invoices), [invoices]);
  const toPay = useMemo(() => pendingInvoices(invoices), [invoices]);
  const spend = useMemo(() => buildSpendSummary(payments, now), [payments, now]);

  return (
    <DashboardPageShell>
      <PageHead
        backHref={PROFILE_ROUTE}
        backLabel="Profile"
        title="Billing & Payments"
        description="Invoices, payments and plans"
        actions={
          <Button variant="outline" size="md" asChild>
            <Link href={TRANSACTIONS_ROUTE}>
              <Receipt aria-hidden="true" />
              All transactions
            </Link>
          </Button>
        }
      />

      {loadError ? (
        <Surface
          role="alert"
          className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 border border-dashed border-[#fcd34d] bg-[#fffbeb] px-4 py-3.5 text-[13px] text-[#92400e] shadow-none dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <span className="flex min-w-0 items-center gap-3">
            <AlertCircle className="size-[22px] shrink-0 text-[#d97706] dark:text-amber-300" strokeWidth={2} aria-hidden="true" />
            <span className="flex min-w-0 flex-col">
              <strong className="text-sm font-bold">We could not refresh your billing data.</strong>
              <span>{loadError}</span>
            </span>
          </span>
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </Surface>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <BillingDueCard
          due={due}
          loading={invoicesLoading}
          failed={invoicesFailed}
          renderPay={renderPay}
          onSeeInvoices={onOpenInvoices}
        />
        <BillingPlanCard
          subscription={subscriptions.current}
          loading={subscriptionsLoading}
          failed={subscriptionsFailed}
          onOpenPlans={onOpenPlans}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <BillingSpendCard spend={spend} loading={paymentsLoading} failed={paymentsFailed} />
        <BillingPendingInvoicesCard
          invoices={toPay}
          loading={invoicesLoading}
          failed={invoicesFailed}
          renderPay={renderPay}
        />
      </div>

      <PaymentHistory
        payments={payments}
        compact
        title="Recent transactions"
        action={<SeeAllTransactionsLink />}
        limit={5}
        showStatus={false}
        loading={paymentsLoading}
        failed={paymentsFailed}
        invoiceHref={invoiceRoute}
        emptyTitle="No payments yet"
        emptyDescription="Completed or pending payments will appear here."
      />

      <BillingMoreTabs
        tab={tab}
        onTabChange={onTabChange}
        invoices={invoices}
        invoicesLoading={invoicesLoading}
        invoicesFailed={invoicesFailed}
        renderPay={renderPay}
        onDownloadPdf={onDownloadPdf}
        downloadingPdfId={downloadingPdfId}
        plans={plans}
        plansLoading={plansLoading}
        onChoosePlan={onChoosePlan}
        onReloadPlans={onReloadPlans}
        subscriptions={subscriptions}
        subscriptionsLoading={subscriptionsLoading}
        subscriptionsFailed={subscriptionsFailed}
        showSubscriptionHistory={showSubscriptionHistory}
        onToggleSubscriptionHistory={onToggleSubscriptionHistory}
      />

      {children}
    </DashboardPageShell>
  );
}
