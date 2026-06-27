"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { PaymentHistory } from "@/components/billing/PaymentHistory";
import { PaymentButton } from "@/components/payments";
import { DashboardPageHeader, DashboardPageShell as PatientPageShell } from "@/components/dashboard/DashboardPageShell";
import { Check, CheckCircle2, CreditCard, Download, FileText, RefreshCw, Wallet } from "lucide-react";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { BillingPlan, Invoice, Subscription } from "@/types/billing.types";

interface PatientBillingContentProps {
  clinicId: string;
  userId: string;
  invoices: Invoice[];
  invoicesPending: boolean;
  payments: any[];
  paymentsPending: boolean;
  subscriptions: Subscription[];
  subscriptionsPending: boolean;
  backendActiveSubscription?: Subscription | null;
  clinicPlans: BillingPlan[];
  clinicPlansPending: boolean;
  fallbackPlans: BillingPlan[];
  fallbackPlansPending: boolean;
  planToConfirm: BillingPlan | null;
  pendingSubscriptionPayment: { subscriptionId: string; planName: string; amount: number } | null;
  showSubscriptionHistory: boolean;
  subscribeError: string;
  createSubscriptionPending: boolean;
  onOpenPlansTab: () => void;
  onSetPlanToConfirm: (plan: BillingPlan | null) => void;
  onSetPendingSubscriptionPayment: (value: { subscriptionId: string; planName: string; amount: number } | null) => void;
  onSetShowSubscriptionHistory: (value: boolean | ((value: boolean) => boolean)) => void;
  onSetSubscribeError: (value: string) => void;
  onRefetchClinicPlans: () => void;
  onRefetchFallbackPlans: () => void;
  onRefetchInvoices: () => void;
  onRefetchPayments: () => void;
  onRefetchSubscriptions: () => void;
  onRefetchActiveSubscription: () => void;
  onCreateSubscription: (plan: BillingPlan) => Promise<void>;
}

function statusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
    case "ACTIVE":
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900";
    case "OPEN":
    case "TRIALING":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900";
    case "OVERDUE":
    case "PAST_DUE":
    case "EXPIRED":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900";
    case "CANCELLED":
    case "VOID":
      return "bg-slate-100 text-slate-500 border-slate-200 line-through dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800";
    case "DRAFT":
    case "PAUSED":
    default:
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800";
  }
}

function formatAmount(amount: number, currency = "INR") {
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

function formatDate(date: string) {
  return formatDateInIST(date, { day: "2-digit", month: "short", year: "numeric" }, "en-IN");
}

function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function cycleLabel(cycle: string | undefined) {
  switch (cycle) {
    case "DAILY":
      return "Daily";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "QUARTERLY":
      return "Quarterly";
    case "YEARLY":
      return "Annual";
    default:
      return cycle ?? "";
  }
}

function getVisitProgress(sub: Subscription) {
  const used = sub.appointmentsUsed ?? 0;
  const limit = sub.appointmentsLimit;
  if (limit == null || limit === 0) return null;
  return { used, limit, remaining: Math.max(0, limit - used), pct: Math.min(100, Math.round((used / limit) * 100)) };
}

function getExpiryInfo(sub: Subscription) {
  const target = sub.currentPeriodEnd || sub.nextBillingDate || sub.endDate;
  const days = daysUntil(target);
  return days === null ? null : { days, target };
}

function getPeriodStart(sub: Subscription) {
  return sub.currentPeriodStart || sub.startDate;
}

function getPeriodEnd(sub: Subscription) {
  return sub.currentPeriodEnd || sub.endDate;
}

function getPeriodEndLabel(sub: Subscription) {
  const periodEnd = getPeriodEnd(sub);
  return periodEnd ? formatDate(periodEnd) : sub.autoRenew ? "Renews automatically" : "Ongoing";
}

function getSubscriptionDisplayStatus(sub: Subscription, expiryInfo: { days: number; target: string | undefined } | null) {
  const rawStatus = sub.status?.toUpperCase?.() || "UNKNOWN";
  if (expiryInfo && expiryInfo.days < 0 && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(rawStatus)) return "EXPIRED";
  return rawStatus;
}

function formatSubscriptionStatus(status: string) {
  return status.replace(/_/g, " ");
}

function getInvoiceDateLabel(invoice: { status: string; dueDate?: string; paidDate?: string; paidAt?: string; invoiceDate?: string; createdAt?: string; updatedAt?: string }) {
  const issuedAt = invoice.invoiceDate || invoice.createdAt;
  const paidTime = invoice.paidDate || invoice.paidAt || invoice.updatedAt;
  const statusLabel =
    invoice.status === "PAID"
      ? `Paid: ${paidTime ? formatDate(paidTime) : "--"}`
      : `Due: ${invoice.dueDate ? formatDate(invoice.dueDate) : "--"}`;
  return `Issued: ${issuedAt ? formatDate(issuedAt) : "--"} · ${statusLabel}`;
}

export function PatientBillingContent({
  clinicId,
  userId,
  invoices,
  invoicesPending,
  payments,
  paymentsPending,
  subscriptions,
  subscriptionsPending,
  backendActiveSubscription,
  clinicPlans,
  clinicPlansPending,
  fallbackPlans,
  fallbackPlansPending,
  planToConfirm,
  pendingSubscriptionPayment,
  showSubscriptionHistory,
  subscribeError,
  createSubscriptionPending,
  onOpenPlansTab,
  onSetPlanToConfirm,
  onSetPendingSubscriptionPayment,
  onSetShowSubscriptionHistory,
  onSetSubscribeError,
  onRefetchClinicPlans,
  onRefetchFallbackPlans,
  onRefetchInvoices,
  onRefetchPayments,
  onRefetchSubscriptions,
  onRefetchActiveSubscription,
  onCreateSubscription,
}: PatientBillingContentProps) {
  const typedSubscriptions = subscriptions as Subscription[];
  const plans = clinicPlans.length > 0 ? clinicPlans : fallbackPlans;
  const activePlans = plans.filter((plan) => plan.isActive);
  const plansPending = clinicId ? clinicPlansPending : fallbackPlansPending;
  const openInvoices = invoices.filter((inv) => inv.status === "OPEN" || inv.status === "OVERDUE");
  const mergedSubscriptions = useMemo(() => {
    if (!backendActiveSubscription) return typedSubscriptions;
    return typedSubscriptions.some((sub) => sub.id === backendActiveSubscription.id)
      ? typedSubscriptions.map((sub) => (sub.id === backendActiveSubscription.id ? backendActiveSubscription : sub))
      : [backendActiveSubscription, ...typedSubscriptions];
  }, [backendActiveSubscription, typedSubscriptions]);
  const displayedSubscriptions = backendActiveSubscription
    ? mergedSubscriptions.toSorted((left, right) => {
        if (left.id === backendActiveSubscription.id) return -1;
        if (right.id === backendActiveSubscription.id) return 1;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })
    : mergedSubscriptions;
  const isEffectivelyActive = (sub: Subscription) => {
    if (!["ACTIVE", "TRIALING"].includes(sub.status)) return false;
    const expiry = getExpiryInfo(sub);
    return expiry === null || expiry.days >= 0;
  };
  const activeSubscriptions = displayedSubscriptions.filter(isEffectivelyActive);
  const endedSubscriptions = displayedSubscriptions.filter((sub) => !isEffectivelyActive(sub));
  const visibleSubscriptions = activeSubscriptions.length > 0 || !showSubscriptionHistory ? activeSubscriptions : endedSubscriptions;
  const historySubscriptions = activeSubscriptions.length > 0 && showSubscriptionHistory ? endedSubscriptions : [];
  const subscriptionCards = [...visibleSubscriptions, ...historySubscriptions];
  const currentActiveSubscription = activeSubscriptions[0];
  const currentActivePlanId = currentActiveSubscription?.planId || currentActiveSubscription?.plan?.id;
  const activeSubscriptionCount = backendActiveSubscription ? 1 : activeSubscriptions.length;

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.original.invoiceNumber || `#${row.original.id.slice(-8).toUpperCase()}`}</span>
          <span className="text-xs text-muted-foreground">{getInvoiceDateLabel(row.original)}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="font-semibold">{formatAmount(row.original.amount, row.original.currency)}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline" className={`font-medium ${statusColor(row.original.status)}`}>{formatSubscriptionStatus(row.original.status)}</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-2">
          {(row.original.status === "OPEN" || row.original.status === "OVERDUE") && (
            <PaymentButton invoiceId={row.original.id} amount={row.original.amount} className="w-full sm:w-auto" />
          )}
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => window.open(`/api/billing/invoices/${row.original.id}/download`, "_blank", "noopener,noreferrer")} title="Download invoice PDF">
            <Download className="size-3.5" />
            PDF
          </Button>
        </div>
      ),
    },
  ];

  const subscriptionColumns: ColumnDef<Subscription>[] = [
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.original.plan;
        const isActive = isEffectivelyActive(row.original);
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{plan?.name ?? "Subscription Plan"}</span>
              {isActive && <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-700">Active</Badge>}
            </div>
            <span className="text-xs text-muted-foreground">{plan?.billingCycle ? cycleLabel(plan.billingCycle) : "Cycle unknown"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "period",
      header: "Period",
      cell: ({ row }) => (
        <div className="flex flex-col text-sm">
          <span className="text-foreground">{getPeriodStart(row.original) ? formatDate(getPeriodStart(row.original)!) : "--"}</span>
          <span className="text-xs text-muted-foreground">{getPeriodEndLabel(row.original)}</span>
        </div>
      ),
    },
    {
      accessorKey: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const progress = getVisitProgress(row.original);
        return progress ? <span className="text-sm text-muted-foreground">{progress.used}/{progress.limit} used</span> : <span className="text-sm text-muted-foreground">Unlimited visits</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const expiryInfo = getExpiryInfo(row.original);
        const displayStatus = getSubscriptionDisplayStatus(row.original, expiryInfo);
        return <Badge variant="outline" className={`font-medium ${statusColor(displayStatus)}`}>{formatSubscriptionStatus(displayStatus)}</Badge>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => <Button variant="outline" size="sm" className="h-8" onClick={onOpenPlansTab}>View Plans</Button>,
    },
  ];

  return (
    <PatientPageShell className="mx-auto max-w-6xl gap-y-4">
      <DashboardPageHeader
        eyebrow="Payments"
        title="My payments"
        description="Review invoices, payments, and subscription plans in one place."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card><CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4 text-left"><div className="rounded-full bg-amber-100 p-2 sm:p-3 dark:bg-amber-950/40"><FileText className="size-5 text-amber-600 dark:text-amber-300" /></div><div><p className="text-xs sm:text-sm text-muted-foreground">Open Invoices</p><p className="text-xl sm:text-2xl font-bold">{openInvoices.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4 text-left"><div className="rounded-full bg-emerald-100 p-2 sm:p-3 dark:bg-emerald-950/40"><CreditCard className="size-5 text-emerald-600 dark:text-emerald-300" /></div><div><p className="text-xs sm:text-sm text-muted-foreground">Total Payments</p><p className="text-xl sm:text-2xl font-bold">{payments.length}</p></div></CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="flex flex-row items-center justify-start gap-3 p-3 sm:p-4 text-left"><div className="rounded-full bg-blue-100 p-2 sm:p-3 dark:bg-blue-950/40"><Wallet className="size-5 text-blue-600 dark:text-blue-300" /></div><div><p className="text-xs sm:text-sm text-muted-foreground">Active Subscriptions</p><p className="text-xl sm:text-2xl font-bold">{activeSubscriptionCount}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="plans" className="flex flex-col gap-y-4">
        <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-max min-w-full sm:flex sm:w-full">
            <TabsTrigger id="patient-billing-plans-trigger" value="plans">Plans</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plans" className="mt-4 flex flex-col gap-y-4">
          {plansPending ? (
            <Card><CardContent className="py-10 text-center"><RefreshCw className="mx-auto mb-3 size-5 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Loading plans…</p></CardContent></Card>
          ) : activePlans.length === 0 ? (
            <Empty><EmptyContent><EmptyMedia><Wallet className="size-5" /></EmptyMedia><EmptyTitle>No subscription plans are available right now.</EmptyTitle><EmptyDescription>Try refreshing or check again later.</EmptyDescription><Button variant="outline" className="mt-2" onClick={() => { void onRefetchClinicPlans(); void onRefetchFallbackPlans(); }}>Refresh Plans</Button></EmptyContent></Empty>
          ) : (
            <div className="flex flex-col gap-y-4">
              {currentActiveSubscription && (
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"><CardContent className="flex items-start gap-3 py-4"><div className="rounded-full bg-green-100 p-2 dark:bg-green-900/40 shrink-0"><CheckCircle2 className="size-4 text-green-700 dark:text-green-300" /></div><div className="min-w-0"><p className="font-semibold text-green-900 dark:text-green-200 text-sm">{currentActiveSubscription.plan?.name ? `${currentActiveSubscription.plan.name} is active` : "You have an active subscription"}</p><p className="text-xs text-green-700 dark:text-green-300 mt-0.5">You can still review or switch plans below.</p></div></CardContent></Card>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-2 sm:gap-4">
                {activePlans.map((plan) => {
                  const isCurrentPlan = currentActivePlanId === plan.id;
                  return (
                    <Card key={plan.id} className={`overflow-hidden ${isCurrentPlan ? "border-green-300 dark:border-green-900" : ""}`}>
                      {isCurrentPlan && <div className="h-1 w-full bg-green-500" />}
                      <CardContent className="flex flex-col gap-y-2.5 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-3">
                          <div className="flex min-w-0 flex-1 flex-col gap-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-sm sm:text-base leading-tight">{plan.name}</p>
                              {isCurrentPlan && <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 text-[10px] sm:text-xs px-1.5 py-0">Active</Badge>}
                              <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0 font-normal">{cycleLabel(plan.billingCycle)}</Badge>
                            </div>
                            {plan.description && <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{plan.description}</p>}
                          </div>
                          <div className="shrink-0 text-left sm:text-right">
                            <p className="text-base sm:text-xl font-bold tracking-tight">{formatAmount(plan.price, plan.currency)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">per {cycleLabel(plan.billingCycle).toLowerCase()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground"><CheckCircle2 className="size-3.5 text-green-500 shrink-0" />{plan.isUnlimitedAppointments ? "Unlimited visits included" : `${plan.appointmentsIncluded ?? 0} visits included`}</div>
                        {Array.isArray(plan.features) && plan.features.length > 0 && <div className="grid gap-1 pt-1 border-t">{plan.features.slice(0, 3).map((feature) => <div key={`${plan.id}-feature-${feature}`} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground"><Check className="size-3 text-green-600 shrink-0" /><span className="truncate">{feature}</span></div>)}</div>}
                        <div className="flex justify-stretch sm:justify-end pt-1 mt-auto">{isCurrentPlan ? <Button variant="outline" disabled size="sm" className="w-full sm:w-auto gap-1.5 text-xs"><CheckCircle2 className="size-3 text-green-600" />Current Plan</Button> : <Button size="sm" onClick={() => onSetPlanToConfirm(plan)} className="w-full sm:w-auto text-xs">Subscribe</Button>}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 flex flex-col gap-y-3">
          {invoicesPending ? (
            <Card><CardContent className="py-10 text-center"><RefreshCw className="mx-auto mb-3 size-5 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Loading invoices…</p></CardContent></Card>
          ) : invoices.length === 0 ? (
            <Empty><EmptyContent><EmptyMedia><FileText className="size-5" /></EmptyMedia><EmptyTitle>No invoices found.</EmptyTitle><EmptyDescription>Any open or paid invoices will appear here.</EmptyDescription></EmptyContent></Empty>
          ) : (
            <Card className="border-border/70 bg-card">
              <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-0">
                <CardTitle className="text-lg font-extrabold text-foreground">Invoices</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-3 sm:p-4 pt-3">
                <DataTable columns={invoiceColumns} data={invoices} pageSize={10} emptyMessage="No invoices found" compact scrollable />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4 flex flex-col gap-y-3">
          {paymentsPending ? (
            <Card><CardContent className="py-10 text-center"><RefreshCw className="mx-auto mb-3 size-5 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Loading payments…</p></CardContent></Card>
          ) : payments.length === 0 ? (
            <Empty><EmptyContent><EmptyMedia><CreditCard className="size-5" /></EmptyMedia><EmptyTitle>No payment history found.</EmptyTitle><EmptyDescription>Completed or pending payments will appear here.</EmptyDescription></EmptyContent></Empty>
          ) : (
            <PaymentHistory payments={payments} compact />
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4 flex flex-col gap-y-4">
          {subscriptionsPending ? (
            <Card><CardContent className="py-10 text-center"><RefreshCw className="mx-auto mb-3 size-5 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Loading subscriptions…</p></CardContent></Card>
          ) : displayedSubscriptions.length === 0 ? (
            <Empty><EmptyContent><EmptyMedia><Wallet className="size-5" /></EmptyMedia><EmptyTitle>You do not have any subscriptions yet.</EmptyTitle><EmptyDescription>Pick a plan to start using subscription benefits.</EmptyDescription><Button className="mt-2" onClick={onOpenPlansTab}>View Plans</Button></EmptyContent></Empty>
          ) : (
            <>
              {activeSubscriptions.length === 0 && endedSubscriptions.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"><CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-amber-900 dark:text-amber-200">Your subscription has ended</p><p className="text-sm text-amber-700 dark:text-amber-300">You can purchase a plan again from the plans tab on this page.</p></div><Button onClick={onOpenPlansTab}>Purchase Again</Button></CardContent></Card>
              )}
              {activeSubscriptions.length > 0 && endedSubscriptions.length > 0 && (
                <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => onSetShowSubscriptionHistory((value) => !value)}>{showSubscriptionHistory ? "Hide subscription history" : `View subscription history (${endedSubscriptions.length})`}</Button></div>
              )}
              <Card className="border-border/70 bg-card">
                <CardHeader className="p-2 sm:p-4 pb-0 sm:pb-0">
                  <CardTitle className="text-lg font-extrabold text-foreground">Subscriptions</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-3 sm:p-4 pt-3">
                  <DataTable columns={subscriptionColumns} data={subscriptionCards} pageSize={10} emptyMessage="No subscriptions found" compact scrollable />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!planToConfirm} onOpenChange={(open) => !open && onSetPlanToConfirm(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader><DialogTitle>Confirm Subscription</DialogTitle></DialogHeader>
          {planToConfirm && (
            <div className="flex flex-col gap-y-4 py-4">
              <div className="flex flex-col gap-y-2 rounded-lg bg-muted p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><span className="font-semibold text-lg break-words">{planToConfirm.name}</span><span className="font-bold text-lg whitespace-nowrap">{formatAmount(planToConfirm.price ?? 0, planToConfirm.currency)}</span></div>
                {planToConfirm.description && <p className="text-sm text-muted-foreground">{planToConfirm.description}</p>}
              </div>
              {subscribeError && <div className="text-sm p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-xl dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">{subscribeError}</div>}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => onSetPlanToConfirm(null)} className="w-full sm:w-auto">Cancel</Button>
                <Button onClick={() => void onCreateSubscription(planToConfirm)} disabled={createSubscriptionPending} className="w-full sm:w-auto">
                  {createSubscriptionPending ? "Hold on…" : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingSubscriptionPayment} onOpenChange={(open) => { if (!open) onSetPendingSubscriptionPayment(null); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader><DialogTitle>Complete Subscription Payment</DialogTitle></DialogHeader>
          {pendingSubscriptionPayment && (
            <div className="flex flex-col gap-y-4">
              <p className="text-sm text-muted-foreground">Plan: <span className="font-medium text-foreground">{pendingSubscriptionPayment.planName}</span></p>
              <PaymentButton subscriptionId={pendingSubscriptionPayment.subscriptionId} amount={pendingSubscriptionPayment.amount} description={pendingSubscriptionPayment.planName} autoStart className="w-full" onSuccess={() => { onSetPendingSubscriptionPayment(null); onRefetchSubscriptions(); onRefetchActiveSubscription(); onRefetchInvoices(); onRefetchPayments(); onRefetchClinicPlans(); onRefetchFallbackPlans(); }}>
                Pay {formatAmount(pendingSubscriptionPayment.amount)}
              </PaymentButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PatientPageShell>
  );
}
