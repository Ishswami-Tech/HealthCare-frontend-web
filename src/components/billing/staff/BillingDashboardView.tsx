"use client";

import type { ReactNode } from "react";
import { AlertCircle, Clock, CreditCard, FileText, Plus, RotateCcw, Wallet } from "lucide-react";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kpi, Kv, Note, SectionTitle, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type {
  BillingAnalytics,
  BillingPlan,
  ClinicLedgerResponse,
  Invoice,
  Payment,
  Subscription,
} from "@/types/billing.types";
import { PaymentHistory } from "../PaymentHistory";
import { BillingFilters } from "./BillingFilters";
import { BillingInvoiceDialog } from "./BillingInvoiceDialog";
import { BillingInvoicesTable, type BillingInvoiceActions } from "./BillingInvoicesTable";
import { BillingLedgerTab } from "./BillingLedgerTab";
import { BillingOverviewTab } from "./BillingOverviewTab";
import { BillingPaymentsTable } from "./BillingPaymentsTable";
import {
  NoActivePlanNote,
  PatientBillingStats,
  PatientPlansTab,
  PatientSubscriptionsTab,
} from "./BillingPatientSections";
import {
  EMPTY_BILLING_FILTERS,
  buildBillingTotals,
  filterInvoices,
  filterPayments,
  formatRupees,
  invoiceBreakdownLabel,
  type BillingAccess,
  type BillingFilterState,
} from "./billing.logic";

export interface BillingDashboardViewProps {
  access: BillingAccess;
  header: { eyebrow: string; title: string; description: string };

  /** Tab ids for this role, in order (staff: overview, invoices, payments [, ledger]). */
  tabs: readonly string[];
  activeTab: string;
  onTabChange: (tab: string) => void;

  loading?: boolean;
  /** Set when the invoices or payments could not be loaded. */
  loadError?: string | null;
  syncing?: boolean;
  onRefetch: () => void;
  /** Given only to roles that may create an invoice. */
  onNewInvoice?: (() => void) | undefined;

  plans: BillingPlan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  analytics?: BillingAnalytics | undefined;
  ledger?: ClinicLedgerResponse | undefined;

  filters: BillingFilterState;
  onFiltersChange: (patch: Partial<BillingFilterState>) => void;
  onFiltersReset: () => void;

  /** Row and dialog actions on an invoice; only the ones the role may use are set. */
  invoiceActions: BillingInvoiceActions;
  selectedInvoice: Invoice | null;
  onCloseInvoice: () => void;
  onOpenInvoicePdf: (invoice: Invoice) => void;
  openInvoicePdfPending?: boolean;

  /** Patient branch: start the subscribe flow for a plan. */
  onChoosePlan: (plan: BillingPlan) => void;
  subscribeError?: string;

  /** Dialogs owned by the container (new invoice, subscription checkout). */
  children?: ReactNode;
}

function tabLabel(tab: string): string {
  return tab.charAt(0).toUpperCase() + tab.slice(1);
}

function isFiltered(filters: BillingFilterState, scope: "invoices" | "payments"): boolean {
  const shared = filters.searchTerm.trim() !== "" || filters.startDate !== "" || filters.endDate !== "";
  return scope === "invoices"
    ? shared || filters.invoiceStatus !== EMPTY_BILLING_FILTERS.invoiceStatus
    : shared ||
        filters.paymentStatus !== EMPTY_BILLING_FILTERS.paymentStatus ||
        filters.paymentMethod !== EMPTY_BILLING_FILTERS.paymentMethod;
}

/**
 * The `/billing` screen. One layout, two branches:
 *  - staff (pharmacist, receptionist, finance, clinic admin, doctor): stat cards, Overview,
 *    Invoices, Payments, and a Ledger tab for admins;
 *  - patient: plans, subscriptions, payments, invoices.
 * Props only — data, permissions and mutations live in `RoleBasedBillingDashboard`.
 */
export function BillingDashboardView({
  access,
  header,
  tabs,
  activeTab,
  onTabChange,
  loading = false,
  loadError = null,
  syncing = false,
  onRefetch,
  onNewInvoice,
  plans,
  subscriptions,
  invoices,
  payments,
  analytics,
  ledger,
  filters,
  onFiltersChange,
  onFiltersReset,
  invoiceActions,
  selectedInvoice,
  onCloseInvoice,
  onOpenInvoicePdf,
  openInvoicePdfPending = false,
  onChoosePlan,
  subscribeError = "",
  children,
}: BillingDashboardViewProps) {
  const { isPatient } = access;
  const totals = buildBillingTotals(invoices, payments);
  const filteredInvoices = filterInvoices(invoices, filters);
  const filteredPayments = filterPayments(payments, filters);
  const filterKey = JSON.stringify(filters);

  const activeSubscription = subscriptions.find((item) => item.status === "ACTIVE" || item.status === "TRIALING");
  const activeSubscriptionsCount = subscriptions.filter((item) => item.status === "ACTIVE").length;
  const lastCompletedPayment = payments.find((payment) => payment.status === "COMPLETED");
  const showFilters = activeTab === "invoices" || activeTab === "payments";
  // Nothing arrived at all: show "could not load" instead of zeros and "no invoices".
  const failed = Boolean(loadError) && invoices.length === 0 && payments.length === 0;
  const blank = loading || failed;
  const blankHint = loading ? "Loading" : "Not loaded";

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow={header.eyebrow}
        title={header.title}
        description={header.description}
        actionsSlot={
          <>
            <Button variant="outline" size="md" onClick={onRefetch} disabled={syncing}>
              <RotateCcw className={cn(syncing && "animate-spin [animation-direction:reverse]")} />
              Sync Data
            </Button>
            {onNewInvoice ? (
              <Button size="md" onClick={onNewInvoice}>
                <Plus />
                New Invoice
              </Button>
            ) : null}
          </>
        }
      />

      {loadError ? (
        <Note tone="rose" icon={AlertCircle} className="[&>div]:flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
            <span>
              <strong className="font-bold">Billing data could not be loaded.</strong> {loadError}
            </span>
            <Button variant="outline" onClick={onRefetch}>
              Try again
            </Button>
          </div>
        </Note>
      ) : null}

      {isPatient ? (
        <PatientBillingStats
          totalPaid={totals.paidAmount}
          totalPending={totals.pendingAmount}
          activeSubscriptions={activeSubscriptionsCount}
          lastPayment={lastCompletedPayment}
        />
      ) : (
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @5xl:grid-cols-4">
            <Kpi
              label="Total Invoices"
              value={blank ? "–" : totals.totalInvoices}
              hint={blank ? blankHint : invoiceBreakdownLabel(totals)}
              icon={FileText}
              tone="blue"
            />
            <Kpi
              label="Pending Invoices"
              value={blank ? "–" : totals.pendingInvoices}
              hint={blank ? blankHint : `${formatRupees(totals.pendingAmount)} to collect`}
              icon={Clock}
              tone="amber"
            />
            <Kpi
              label="Completed Payments"
              value={blank ? "–" : totals.completedPayments}
              hint={blank ? blankHint : `Of ${totals.totalPayments} payment${totals.totalPayments === 1 ? "" : "s"}`}
              icon={CreditCard}
              tone="mint"
            />
            <Kpi
              label="Paid Revenue"
              value={blank ? "–" : formatRupees(totals.paidAmount)}
              hint={blank ? blankHint : "From completed payments"}
              icon={Wallet}
              tone="mint"
            />
          </div>
        </div>
      )}

      {isPatient && activeSubscriptionsCount === 0 ? <NoActivePlanNote onViewPlans={() => onTabChange("plans")} /> : null}

      <Tabs value={activeTab} onValueChange={onTabChange} className="gap-5">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {tabLabel(tab)}
            </TabsTrigger>
          ))}
        </TabsList>

        {showFilters ? (
          <BillingFilters
            scope={activeTab === "invoices" ? "invoices" : "payments"}
            filters={filters}
            onChange={onFiltersChange}
            onReset={onFiltersReset}
          />
        ) : null}

        {!isPatient ? (
          <TabsContent value="overview">
            <BillingOverviewTab
              totals={totals}
              invoices={invoices}
              payments={payments}
              loading={loading}
              failed={failed}
              invoiceActions={invoiceActions}
              onViewAllInvoices={() => onTabChange("invoices")}
              onViewAllPayments={() => onTabChange("payments")}
            />
          </TabsContent>
        ) : null}

        {isPatient ? (
          <>
            <TabsContent value="plans">
              <PatientPlansTab
                plans={plans}
                activePlanId={activeSubscription?.planId}
                subscribeError={subscribeError}
                loading={loading}
                onChoosePlan={onChoosePlan}
                onReload={onRefetch}
              />
            </TabsContent>
            <TabsContent value="subscriptions">
              <PatientSubscriptionsTab subscriptions={subscriptions} loading={loading} />
            </TabsContent>
          </>
        ) : null}

        <TabsContent value="invoices">
          <BillingInvoicesTable
            invoices={filteredInvoices}
            resetKey={filterKey}
            loading={loading}
            failed={failed}
            filtered={isFiltered(filters, "invoices")}
            {...invoiceActions}
          />
        </TabsContent>

        <TabsContent value="payments">
          {isPatient ? (
            <PaymentHistory payments={filteredPayments} onRefetch={onRefetch} compact />
          ) : (
            <BillingPaymentsTable
              payments={filteredPayments}
              resetKey={filterKey}
              loading={loading}
              failed={failed}
              filtered={isFiltered(filters, "payments")}
            />
          )}
        </TabsContent>

        {access.showLedgerTab ? (
          <TabsContent value="ledger">
            <BillingLedgerTab ledger={ledger} />
          </TabsContent>
        ) : null}
      </Tabs>

      {!isPatient && analytics ? (
        <Surface as="section">
          <SectionTitle title="Financial Analytics Summary" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kv label="Paid Revenue" value={<span className="text-xl font-extrabold">{formatRupees(totals.paidAmount)}</span>} />
            <Kv
              label="Monthly Revenue"
              value={<span className="text-xl font-extrabold">{formatRupees(analytics.monthlyRevenue)}</span>}
            />
            <Kv
              label="Active Subscriptions"
              value={<span className="text-xl font-extrabold">{analytics.activeSubscriptions}</span>}
            />
            <Kv label="Pending Invoices" value={<span className="text-xl font-extrabold">{analytics.pendingInvoices}</span>} />
          </div>
        </Surface>
      ) : null}

      <BillingInvoiceDialog
        invoice={selectedInvoice}
        onClose={onCloseInvoice}
        onOpenPdf={onOpenInvoicePdf}
        openPdfPending={openInvoicePdfPending}
        onSendWhatsApp={invoiceActions.onSendWhatsApp}
        sendWhatsAppPending={invoiceActions.sendWhatsAppPending ?? false}
        renderPayAction={invoiceActions.renderPayAction}
      />

      {children}
    </DashboardPageShell>
  );
}
