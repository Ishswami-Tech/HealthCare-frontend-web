"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useActiveSubscription,
  useBillingPlans,
  useCreateSubscription,
  useInvoices,
  usePayments,
  useSubscriptions,
} from "@/hooks/query/useBilling";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CreditCard,
  Wallet,
  Download,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Activity,
  Sparkles,
  Check,
} from "lucide-react";
import { PaymentButton } from "@/components/payments";
import { useLayoutStore } from "@/stores/layout.store";
import type { BillingPlan, Subscription } from "@/types/billing.types";

export default function PatientBillingPage() {
  const { session } = useAuth();
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [pendingSubscriptionPayment, setPendingSubscriptionPayment] = useState<{
    subscriptionId: string;
    planName: string;
    amount: number;
  } | null>(null);
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  useEffect(() => {
    setPageTitle("My Billing & Payments");
  }, [setPageTitle]);

  const userId = session?.user?.id || "";
  const clinicId = session?.user?.clinicId || "";

  const {
    data: invoices = [],
    isPending: invoicesPending,
    refetch: refetchInvoices,
  } = useInvoices(userId);
  const {
    data: payments = [],
    isPending: paymentsPending,
    refetch: refetchPayments,
  } = usePayments(userId);
  const {
    data: subscriptions = [],
    isPending: subscriptionsPending,
    refetch: refetchSubscriptions,
  } = useSubscriptions(userId);
  const {
    data: backendActiveSubscription,
    refetch: refetchActiveSubscription,
  } = useActiveSubscription(userId, clinicId, !!userId && !!clinicId);
  const {
    data: clinicPlans = [],
    isPending: clinicPlansPending,
    refetch: refetchClinicPlans,
  } = useBillingPlans(clinicId, !!clinicId);
  const {
    data: fallbackPlans = [],
    isPending: fallbackPlansPending,
    refetch: refetchFallbackPlans,
  } = useBillingPlans(undefined, !clinicId);
  const createSubscriptionMutation = useCreateSubscription();
  const typedSubscriptions = subscriptions as Subscription[];
  const plans = useMemo(
    () => (clinicPlans.length > 0 ? clinicPlans : fallbackPlans),
    [clinicPlans, fallbackPlans]
  );
  const activePlans = useMemo(
    () => plans.filter((plan) => plan.isActive),
    [plans]
  );
  const plansPending = clinicId ? clinicPlansPending : fallbackPlansPending;

  const openInvoices = invoices.filter(
    (inv) => inv.status === "OPEN" || inv.status === "OVERDUE"
  );
  const mergedSubscriptions = backendActiveSubscription
    ? typedSubscriptions.some((sub) => sub.id === backendActiveSubscription.id)
      ? typedSubscriptions.map((sub) =>
          sub.id === backendActiveSubscription.id ? backendActiveSubscription : sub
        )
      : [backendActiveSubscription, ...typedSubscriptions]
    : typedSubscriptions;
  const displayedSubscriptions = backendActiveSubscription
    ? [...mergedSubscriptions].sort((left, right) => {
        if (left.id === backendActiveSubscription.id) return -1;
        if (right.id === backendActiveSubscription.id) return 1;
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })
    : mergedSubscriptions;
  const isEffectivelyActive = (sub: Subscription) => {
    if (!["ACTIVE", "TRIALING"].includes(sub.status)) return false;
    const expiry = getExpiryInfo(sub);
    // If it's mathematically overdue (negative days left), it's no longer actively providing benefits
    if (expiry !== null && expiry.days < 0) {
      return false;
    }
    return true;
  };

  const activeSubscriptions = displayedSubscriptions.filter((sub) => isEffectivelyActive(sub));
  const endedSubscriptions = displayedSubscriptions.filter((sub) => !isEffectivelyActive(sub));
  const visibleSubscriptions =
    activeSubscriptions.length > 0 || !showSubscriptionHistory
      ? activeSubscriptions
      : endedSubscriptions;
  const historySubscriptions =
    activeSubscriptions.length > 0 && showSubscriptionHistory ? endedSubscriptions : [];
  const subscriptionCards = [...visibleSubscriptions, ...historySubscriptions];
  const currentActiveSubscription = activeSubscriptions[0];
  const currentActivePlanId = currentActiveSubscription?.planId || currentActiveSubscription?.plan?.id;
  const activeSubscriptionCount = backendActiveSubscription ? 1 : activeSubscriptions.length;

  // ─── Formatters ──────────────────────────────────────────────────────────────

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
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800";
    }
  }

  function formatAmount(amount: number, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getInvoiceDateLabel(invoice: { status: string; dueDate?: string; paidDate?: string }) {
    if (invoice.status === "PAID") {
      return `Paid: ${invoice.paidDate ? formatDate(invoice.paidDate) : "--"}`;
    }
    return `Due: ${invoice.dueDate ? formatDate(invoice.dueDate) : "--"}`;
  }

  /** Days until a date (negative = past) */
  function daysUntil(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function cycleLabel(cycle: string | undefined) {
    switch (cycle) {
      case "DAILY": return "Daily";
      case "WEEKLY": return "Weekly";
      case "MONTHLY": return "Monthly";
      case "QUARTERLY": return "Quarterly";
      case "YEARLY": return "Annual";
      default: return cycle ?? "";
    }
  }

  // ─── Subscription helpers ─────────────────────────────────────────────────────

  function getVisitProgress(sub: Subscription) {
    const used = sub.appointmentsUsed ?? 0;
    const limit = sub.appointmentsLimit;
    if (limit == null || limit === 0) return null;
    const remaining = limit - used;
    const pct = Math.min(100, Math.round((used / limit) * 100));
    return { used, limit, remaining: Math.max(0, remaining), pct };
  }

  function getExpiryInfo(sub: Subscription) {
    const target = sub.currentPeriodEnd || sub.nextBillingDate || sub.endDate;
    const days = daysUntil(target);
    if (days === null) return null;
    return { days, target };
  }

  function getPeriodStart(sub: Subscription) {
    return sub.currentPeriodStart || sub.startDate;
  }

  function getPeriodEnd(sub: Subscription) {
    return sub.currentPeriodEnd || sub.endDate;
  }

  function getPeriodEndLabel(sub: Subscription) {
    const periodEnd = getPeriodEnd(sub);
    if (periodEnd) return formatDate(periodEnd);
    return sub.autoRenew ? "Renews automatically" : "Ongoing";
  }

  function getSubscriptionDisplayStatus(sub: Subscription, expiryInfo: { days: number; target: string | undefined } | null) {
    const rawStatus = sub.status?.toUpperCase?.() || "UNKNOWN";
    if (expiryInfo && expiryInfo.days < 0 && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(rawStatus)) {
      return "EXPIRED";
    }
    return rawStatus;
  }

  function formatSubscriptionStatus(status: string) {
    return status.replace(/_/g, " ");
  }

  function formatStatusLabel(status: string | undefined) {
    if (!status) return "Unknown";
    return status.replace(/_/g, " ");
  }

  // ─── Invoice PDF download ─────────────────────────────────────────────────────

  function handleDownloadPDF(invoiceId: string) {
    // Opens the Next.js API proxy route in a new tab — triggers browser PDF save dialog.
    window.open(`/api/billing/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
  }

  function openPlansTab() {
    document.getElementById("patient-billing-plans-trigger")?.click();
  }

  async function handleSubscribePlan() {
    setSubscribeError("");
    if (!session?.user?.id || !planToConfirm) return;

    const effectiveClinicId = planToConfirm.clinicId || clinicId;
    if (!effectiveClinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId: session.user.id,
        clinicId: effectiveClinicId,
        planId: planToConfirm.id,
      });

      if (!created?.id) {
        setSubscribeError("Subscription was created with an invalid response.");
        return;
      }

      setPendingSubscriptionPayment({
        subscriptionId: created.id,
        planName: planToConfirm.name,
        amount: planToConfirm.price ?? 0,
      });
      setPlanToConfirm(null);
      void refetchSubscriptions();
      void refetchActiveSubscription();
    } catch (error) {
      setSubscribeError(
        error instanceof Error ? error.message : "Failed to create subscription."
      );
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-950/40">
              <FileText className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open Invoices</p>
              <p className="text-2xl font-bold">{openInvoices.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950/40">
              <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payments</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/40">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold">{activeSubscriptionCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <TabsList className="inline-flex w-max min-w-full sm:flex sm:w-full">
          <TabsTrigger
            id="patient-billing-plans-trigger"
            value="plans"
            className="px-4 text-xs sm:text-sm"
          >
            Plans
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="px-4 text-xs sm:text-sm"
          >
            Invoices
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="px-4 text-xs sm:text-sm"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="subscriptions"
            className="px-4 text-xs sm:text-sm"
          >
            Subscriptions
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="plans" className="space-y-4 mt-4">
          {plansPending ? (
            <Card>
              <CardContent className="py-10 text-center">
                <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading plans...</p>
              </CardContent>
            </Card>
          ) : activePlans.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
                <p className="font-medium">No subscription plans are available right now.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try refreshing or check again later.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    void refetchClinicPlans();
                    void refetchFallbackPlans();
                  }}
                >
                  Refresh Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {currentActiveSubscription && (
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
                  <CardContent className="flex items-start gap-3 py-4">
                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/40 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-green-900 dark:text-green-200 text-sm">
                        {currentActiveSubscription.plan?.name
                          ? `${currentActiveSubscription.plan.name} is active`
                          : "You have an active subscription"}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                        You can still review or switch plans below.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {activePlans.map((plan) => {
                    const isCurrentPlan = currentActivePlanId === plan.id;

                    return (
                      <Card
                        key={plan.id}
                        className={`overflow-hidden ${
                          isCurrentPlan
                            ? "border-green-300 dark:border-green-900"
                            : ""
                        }`}
                      >
                        {/* Top accent bar for current plan */}
                        {isCurrentPlan && (
                          <div className="h-1 w-full bg-green-500" />
                        )}

                        <CardContent className="p-4 sm:p-5 space-y-3">
                          {/* ── Header: name + price always side-by-side ── */}
                          <div className="flex items-start justify-between gap-3">
                            {/* Left: name + badges */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-base leading-tight">{plan.name}</p>
                                {isCurrentPlan && (
                                  <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 text-xs px-2 py-0">
                                    Active
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">
                                  {cycleLabel(plan.billingCycle)}
                                </Badge>
                              </div>
                              {plan.description && (
                                <p className="text-xs text-muted-foreground">{plan.description}</p>
                              )}
                            </div>

                            {/* Right: price — no w-full, always right-aligned */}
                            <div className="shrink-0 text-right">
                              <p className="text-xl font-bold tracking-tight">
                                {formatAmount(plan.price, plan.currency)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                per {cycleLabel(plan.billingCycle).toLowerCase()}
                              </p>
                            </div>
                          </div>

                          {/* ── Visits ── */}
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            {plan.isUnlimitedAppointments
                              ? "Unlimited visits included"
                              : `${plan.appointmentsIncluded ?? 0} visits included`}
                          </div>

                          {/* ── Features ── */}
                          {Array.isArray(plan.features) && plan.features.length > 0 && (
                            <div className="grid gap-1 pt-1 border-t">
                              {plan.features.slice(0, 4).map((feature, index) => (
                                <div
                                  key={`${plan.id}-feature-${index}`}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ── CTA button ── */}
                          <div className="flex justify-stretch sm:justify-end pt-1">
                            {isCurrentPlan ? (
                              <Button variant="outline" disabled className="w-full sm:w-auto gap-1.5">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                Current Plan
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setPlanToConfirm(plan)}
                                className="w-full sm:w-auto"
                              >
                                Subscribe & Pay
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

        </TabsContent>

        {/* ── Invoices ── */}
        <TabsContent value="invoices" className="space-y-3 mt-4">
          {invoicesPending ? (
            <Card>
              <CardContent className="py-10 text-center">
                <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading invoices...</p>
              </CardContent>
            </Card>
          ) : invoices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
                <p className="font-medium">No invoices found.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Any open or paid invoices will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left: invoice info */}
                    <div className="min-w-0 space-y-1 sm:flex-1">
                      <p className="font-medium">
                        {invoice.invoiceNumber
                          ? `Invoice ${invoice.invoiceNumber}`
                          : `Invoice #${invoice.id.slice(-8).toUpperCase()}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getInvoiceDateLabel(invoice)}
                      </p>
                      <Badge variant="outline" className={`font-medium ${statusColor(invoice.status)}`}>
                        {formatStatusLabel(invoice.status)}
                      </Badge>
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex w-full flex-col gap-2 sm:min-w-[148px] sm:w-auto sm:items-end shrink-0">
                      <p className="text-lg font-semibold tracking-tight sm:text-right">{formatAmount(invoice.amount, invoice.currency)}</p>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                        {/* Pay button for open/overdue */}
                        {(invoice.status === "OPEN" || invoice.status === "OVERDUE") && (
                          <PaymentButton
                            invoiceId={invoice.id}
                            amount={invoice.amount}
                            className="w-full sm:min-w-[110px] sm:w-auto"
                          />
                        )}

                        {/* PDF download — always visible */}
                        <Button
                          id={`download-invoice-${invoice.id}`}
                          size="sm"
                          variant="outline"
                          className="h-8 w-full gap-1.5 text-xs sm:min-w-[84px] sm:w-auto"
                          onClick={() => handleDownloadPDF(invoice.id)}
                          title="Download invoice PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Line items preview (if available) */}
                  {Array.isArray(invoice.items) && invoice.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-1">
                      {invoice.items.slice(0, 3).map((item, i) => (
                        <div key={item.id ?? i} className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
                          <span className="min-w-0 flex-1 break-words">{item.description}</span>
                          <span className="shrink-0">{formatAmount(item.total, invoice.currency)}</span>
                        </div>
                      ))}
                      {invoice.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{invoice.items.length - 3} more item{invoice.items.length - 3 !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Payments ── */}
        <TabsContent value="payments" className="space-y-3 mt-4">
          {paymentsPending ? (
            <Card>
              <CardContent className="py-10 text-center">
                <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading payments...</p>
              </CardContent>
            </Card>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
                <p className="font-medium">No payment history found.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completed or pending payments will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1 sm:flex-1">
                    <p className="font-medium">
                      {payment.method || "Payment"} - #{payment.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paymentDate
                        ? formatDate(payment.paymentDate)
                        : payment.createdAt
                          ? formatDate(payment.createdAt)
                          : "--"}
                    </p>
                    {payment.transactionId && (
                      <p className="text-xs text-muted-foreground font-mono">
                        Txn: {payment.transactionId}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:min-w-[132px] sm:w-auto sm:items-end sm:text-right">
                    <p className="text-lg font-semibold tracking-tight text-emerald-600 sm:text-right">
                      {formatAmount(payment.amount, payment.currency)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`font-medium ${statusColor(payment.status || "COMPLETED")}`}
                    >
                      {formatStatusLabel(payment.status || "COMPLETED")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Subscriptions ── */}
        <TabsContent value="subscriptions" className="space-y-4 mt-4">
          {subscriptionsPending ? (
            <Card>
              <CardContent className="py-10 text-center">
                <RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
              </CardContent>
            </Card>
          ) : displayedSubscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
                <p className="font-medium">You do not have any subscriptions yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a plan to start using subscription benefits.
                </p>
                <Button
                  className="mt-4"
                  onClick={openPlansTab}
                >
                  View Plans
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeSubscriptions.length === 0 && endedSubscriptions.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
                  <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">Your subscription has ended</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        You can purchase a plan again from the plans tab on this page.
                      </p>
                    </div>
                    <Button onClick={openPlansTab}>
                      Purchase Again
                    </Button>
                  </CardContent>
                </Card>
              )}

              {activeSubscriptions.length > 0 && endedSubscriptions.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSubscriptionHistory((value) => !value)}
                  >
                    {showSubscriptionHistory
                      ? "Hide subscription history"
                      : `View subscription history (${endedSubscriptions.length})`}
                  </Button>
                </div>
              )}

              {subscriptionCards.map((sub, index) => {
                const plan = sub.plan;
                const visitProgress = getVisitProgress(sub);
                const expiryInfo = getExpiryInfo(sub);
                const displayStatus = getSubscriptionDisplayStatus(sub, expiryInfo);
                const features = plan?.features?.slice(0, 4) ?? [];
                const planName = plan?.name ?? "Subscription Plan";
                const cycle = plan?.billingCycle;
                const planPrice = plan?.price;
                const currency = plan?.currency ?? "INR";
                const isActive = isEffectivelyActive(sub);
                const previousSubscription = subscriptionCards[index - 1];
                const previousIsActive = previousSubscription
                  ? isEffectivelyActive(previousSubscription)
                  : false;
                const showCurrentHeader = isActive && (index === 0 || !previousIsActive);
                const showHistoryHeader = !isActive && (index === 0 || previousIsActive);

                return (
                  <Fragment key={sub.id}>
                  {showCurrentHeader && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Current subscription</p>
                      <p className="text-xs text-muted-foreground">
                        This is the plan currently available for appointments and benefits.
                      </p>
                    </div>
                  )}

                  {showHistoryHeader && (
                    <div className="space-y-1 pt-2">
                      <p className="text-sm font-semibold text-foreground">Subscription history</p>
                      <p className="text-xs text-muted-foreground">
                        Previous or expired subscription records are kept for billing history.
                      </p>
                    </div>
                  )}

                  <Card
                    className={`overflow-hidden ${isActive ? "border-green-300 dark:border-green-900" : ""}`}
                  >
                    {/* Top accent bar */}
                    <div
                      className={`h-1 w-full ${
                        isActive && sub.status === "ACTIVE"
                          ? "bg-green-500"
                          : isActive && sub.status === "TRIALING"
                            ? "bg-blue-500"
                            : (!isActive && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(sub.status))
                              ? "bg-amber-500"
                              : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    />

                    <CardContent className="p-4 sm:p-5 space-y-3">
                      {/* ── Header: plan name + price side-by-side ── */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        {/* Left: name + badges */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base leading-tight">{planName}</p>
                            {isActive && (
                              <Badge className="bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 text-xs px-2 py-0">
                                Active
                              </Badge>
                            )}
                            {cycle && (
                              <Badge variant="secondary" className="text-xs px-2 py-0 font-normal">
                                {cycleLabel(cycle)}
                              </Badge>
                            )}
                          </div>

                          {/* Status + auto-renew row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isActive && (
                              <Badge variant="outline" className={`font-medium text-xs ${statusColor(displayStatus)}`}>
                                {formatSubscriptionStatus(displayStatus)}
                              </Badge>
                            )}
                            {isActive ? (
                              <span
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                                  sub.autoRenew
                                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900"
                                    : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                                }`}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Auto-renew {sub.autoRenew ? "ON" : "OFF"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                                Renewal stopped
                              </span>
                            )}
                          </div>

                          {/* Date range */}
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 shrink-0" />
                            {getPeriodStart(sub) ? formatDate(getPeriodStart(sub)!) : "--"}
                            {" - "}
                            {getPeriodEndLabel(sub)}
                          </p>
                        </div>

                        {/* Right: price */}
                        {planPrice != null && (
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-bold tracking-tight">
                              {formatAmount(planPrice, currency)}
                            </p>
                            {cycle && (
                              <p className="text-xs text-muted-foreground">
                                per {cycleLabel(cycle).toLowerCase()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Visits section ── */}
                      {visitProgress !== null ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Activity className="h-3.5 w-3.5" />
                              Visits used
                            </span>
                            <span className="font-medium text-foreground">
                              {visitProgress.used} / {visitProgress.limit}
                              <span className="font-normal text-muted-foreground ml-1">
                                ({visitProgress.remaining} remaining)
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all ${
                                visitProgress.pct >= 90
                                  ? "bg-red-500"
                                  : visitProgress.pct >= 70
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${visitProgress.pct}%` }}
                            />
                          </div>
                        </div>
                      ) : plan?.isUnlimitedAppointments ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          Unlimited visits included
                        </div>
                      ) : null}

                      {/* ── Renewal / expiry countdown ── */}
                      {expiryInfo !== null && (
                        <div
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                            expiryInfo.days <= 0
                              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                              : expiryInfo.days <= 7
                                ? "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
                                : expiryInfo.days <= 30
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                                  : "bg-muted text-muted-foreground dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            {isActive
                              ? sub.nextBillingDate
                                ? "Next renewal"
                                : "Expires"
                              : "Expired on"}:{" "}
                            <span className="font-medium">{formatDate(expiryInfo.target!)}</span>
                          </span>
                          <span className="font-semibold ml-2 shrink-0">
                            {!isActive && expiryInfo.days < 0
                              ? `Expired ${Math.abs(expiryInfo.days)}d ago`
                              : expiryInfo.days > 0
                              ? `${expiryInfo.days}d left`
                              : expiryInfo.days === 0
                                ? "Today"
                                : sub.nextBillingDate
                                  ? `Overdue by ${Math.abs(expiryInfo.days)}d`
                                  : `Expired ${Math.abs(expiryInfo.days)}d ago`}
                          </span>
                        </div>
                      )}

                      {/* ── Features list ── */}
                      {features.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            Plan includes
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {features.map((feat, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                                <span className="truncate">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  </Fragment>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!planToConfirm} onOpenChange={(open) => !open && setPlanToConfirm(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Confirm Subscription</DialogTitle>
          </DialogHeader>
          {planToConfirm && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-lg break-words">{planToConfirm.name}</span>
                  <span className="font-bold text-lg whitespace-nowrap">
                    {formatAmount(planToConfirm.price ?? 0, planToConfirm.currency)}
                  </span>
                </div>
                {planToConfirm.description && (
                  <p className="text-sm text-muted-foreground">{planToConfirm.description}</p>
                )}
              </div>
              {subscribeError && (
                <div className="text-sm p-2.5 bg-red-50 text-red-700 border border-red-100 rounded-xl dark:bg-red-950/30 dark:text-red-300 dark:border-red-900">
                  {subscribeError}
                </div>
              )}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setPlanToConfirm(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleSubscribePlan()}
                  disabled={createSubscriptionMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createSubscriptionMutation.isPending ? "Hold on..." : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingSubscriptionPayment}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSubscriptionPayment(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Complete Subscription Payment</DialogTitle>
          </DialogHeader>
          {pendingSubscriptionPayment && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Plan:{" "}
                <span className="font-medium text-foreground">
                  {pendingSubscriptionPayment.planName}
                </span>
              </p>
              <PaymentButton
                subscriptionId={pendingSubscriptionPayment.subscriptionId}
                amount={pendingSubscriptionPayment.amount}
                description={pendingSubscriptionPayment.planName}
                autoStart
                className="w-full"
                onSuccess={() => {
                  setPendingSubscriptionPayment(null);
                  void refetchSubscriptions();
                  void refetchActiveSubscription();
                  void refetchInvoices();
                  void refetchPayments();
                  void refetchClinicPlans();
                  void refetchFallbackPlans();
                }}
              >
                Pay {formatAmount(pendingSubscriptionPayment.amount)}
              </PaymentButton>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
