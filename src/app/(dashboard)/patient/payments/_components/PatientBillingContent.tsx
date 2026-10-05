"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ConfirmSubscriptionDialog,
  SubscriptionPaymentDialog,
} from "@/components/billing/staff/BillingDialogs";
import {
  useActiveSubscription,
  useBillingPlans,
  useCreateSubscription,
  useInvoices,
  usePayments,
  useSubscriptions,
} from "@/hooks/query/useBilling";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import type { BillingPlan, Subscription } from "@/types/billing.types";
import { BILLING_TABS_ID, PATIENT_BILLING_TABS, type PatientBillingTab } from "./BillingMoreTabs";
import type { RenderInvoicePay } from "./BillingOverviewCards";
import { PatientBillingView } from "./PatientBillingView";
import { formatAmount, groupSubscriptions, invoiceTotal } from "./patientBilling.logic";
import { useInvoicePdfDownload, usePatientBillingIdentity } from "./usePatientBilling";

const PaymentButton = dynamic(
  () => import("@/components/payments/PaymentButton").then((module) => module.PaymentButton),
  { ssr: false },
);

/** Old deep links (`?tab=payments` after a payment) land on the invoices list. */
const TAB_ALIASES: Partial<Record<string, PatientBillingTab>> = { payments: "invoices" };

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/** Data container for Billing & Payments: every hook lives here, the layout is `PatientBillingView`. */
export function PatientBillingContent() {
  const { userId, clinicId } = usePatientBillingIdentity();
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [pendingSubscriptionPayment, setPendingSubscriptionPayment] = useState<{
    subscriptionId: string;
    planName: string;
    amount: number;
  } | null>(null);
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const { tab, setTab } = useHashTab({
    tabs: PATIENT_BILLING_TABS,
    defaultValue: "invoices",
    aliases: TAB_ALIASES,
  });
  const { downloadingPdfId, downloadPdf } = useInvoicePdfDownload();

  useWebSocketQuerySync();

  const {
    data: invoices = [],
    isPending: invoicesPending,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useInvoices(userId, clinicId);
  const {
    data: payments = [],
    isPending: paymentsPending,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(userId, clinicId);
  const {
    data: subscriptions = [],
    isPending: subscriptionsPending,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptions(userId, clinicId);
  const { data: backendActiveSubscription, refetch: refetchActiveSubscription } = useActiveSubscription(
    userId,
    clinicId,
    !!userId && !!clinicId,
  );
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

  const subscriptionGroups = useMemo(
    () => groupSubscriptions(subscriptions as Subscription[], backendActiveSubscription ?? null),
    [subscriptions, backendActiveSubscription],
  );
  const activePlans = useMemo(
    () => (clinicPlans.length > 0 ? clinicPlans : fallbackPlans).filter((plan) => plan.isActive),
    [clinicPlans, fallbackPlans],
  );

  const refetchAllBillingData = () => {
    void Promise.allSettled([
      refetchInvoices(),
      refetchPayments(),
      refetchSubscriptions(),
      refetchActiveSubscription(),
      clinicId ? refetchClinicPlans() : refetchFallbackPlans(),
    ]);
  };

  const openTab = useCallback(
    (next: PatientBillingTab) => {
      setTab(next);
      // Wait for the tab panel to render, then bring the block into view.
      window.requestAnimationFrame(() => {
        document.getElementById(BILLING_TABS_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [setTab],
  );

  // A deep link to a tab (`?tab=plans`, `#subscriptions`) should show that tab, not the top of the page.
  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, "").toLowerCase();
    const fromQuery = new URLSearchParams(window.location.search).get("tab")?.toLowerCase() ?? "";
    const wanted = fromHash || fromQuery;
    if (wanted === "plans" || wanted === "subscriptions") {
      document.getElementById(BILLING_TABS_ID)?.scrollIntoView({ block: "start" });
    }
  }, []);

  const handleCreateSubscription = async (plan: BillingPlan) => {
    setSubscribeError("");
    if (!userId) return;

    const effectiveClinicId = plan.clinicId || clinicId;
    if (!effectiveClinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId,
        clinicId: effectiveClinicId,
        planId: plan.id,
      });

      if (!created?.id) {
        setSubscribeError("Subscription was created with an invalid response.");
        return;
      }

      setPendingSubscriptionPayment({
        subscriptionId: created.id,
        planName: plan.name,
        amount: plan.price ?? 0,
      });
      setPlanToConfirm(null);
      void refetchSubscriptions();
      void refetchActiveSubscription();
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Failed to create subscription.");
    }
  };

  // The one way to pay an invoice from this screen: the shared PaymentButton (amber).
  // `amount` is in rupees, the invoice total the backend charges; the label shows the same rupees.
  const renderPay: RenderInvoicePay = (invoice, placement) => (
    <PaymentButton
      invoiceId={invoice.id}
      amount={invoiceTotal(invoice)}
      size={placement === "row" ? "default" : "md"}
      onSuccess={() => {
        void refetchInvoices();
        void refetchPayments();
      }}
    >
      Pay {formatAmount(invoiceTotal(invoice), invoice.currency)}
    </PaymentButton>
  );

  return (
    <PatientBillingView
      loadError={errorText(invoicesError) || errorText(paymentsError) || errorText(subscriptionsError)}
      onRetry={refetchAllBillingData}
      invoices={invoices}
      invoicesLoading={invoicesPending}
      invoicesFailed={!!invoicesError && invoices.length === 0}
      payments={payments}
      paymentsLoading={paymentsPending}
      paymentsFailed={!!paymentsError && payments.length === 0}
      subscriptions={subscriptionGroups}
      subscriptionsLoading={subscriptionsPending}
      subscriptionsFailed={!!subscriptionsError && subscriptionGroups.all.length === 0}
      plans={activePlans}
      plansLoading={clinicId ? clinicPlansPending : fallbackPlansPending}
      tab={tab}
      onTabChange={setTab}
      onOpenPlans={() => openTab("plans")}
      onOpenInvoices={() => openTab("invoices")}
      renderPay={renderPay}
      onDownloadPdf={(invoiceId) => void downloadPdf(invoiceId)}
      downloadingPdfId={downloadingPdfId}
      onChoosePlan={(plan) => {
        setSubscribeError("");
        setPlanToConfirm(plan);
      }}
      onReloadPlans={() => {
        void refetchClinicPlans();
        void refetchFallbackPlans();
      }}
      showSubscriptionHistory={showSubscriptionHistory}
      onToggleSubscriptionHistory={() => setShowSubscriptionHistory((value) => !value)}
    >
      <ConfirmSubscriptionDialog
        plan={planToConfirm}
        error={subscribeError}
        pending={createSubscriptionMutation.isPending}
        onConfirm={() => {
          if (planToConfirm) void handleCreateSubscription(planToConfirm);
        }}
        onClose={() => setPlanToConfirm(null)}
      />

      <SubscriptionPaymentDialog
        open={!!pendingSubscriptionPayment}
        onOpenChange={(open) => {
          if (!open) setPendingSubscriptionPayment(null);
        }}
        planName={pendingSubscriptionPayment?.planName}
      >
        {pendingSubscriptionPayment ? (
          <PaymentButton
            subscriptionId={pendingSubscriptionPayment.subscriptionId}
            amount={pendingSubscriptionPayment.amount}
            description={pendingSubscriptionPayment.planName}
            autoStart
            size="md"
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
        ) : null}
      </SubscriptionPaymentDialog>
    </PatientBillingView>
  );
}
