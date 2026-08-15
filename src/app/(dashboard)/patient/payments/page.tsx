"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardPageSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useActiveSubscription,
  useBillingPlans,
  useCreateSubscription,
  useInvoices,
  usePayments,
  useSubscriptions,
} from "@/hooks/query/useBilling";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import type { BillingPlan, Subscription } from "@/types/billing.types";

const PatientBillingContent = dynamic(
  () => import("./_components/PatientBillingContent").then((module) => module.PatientBillingContent),
  {
    ssr: false,
    loading: () => <DashboardPageSkeleton />,
  }
);

export default function PatientBillingPage() {
  const { session, refreshSession, isPending: isSessionPending } = useAuth();
  const searchParams = useSearchParams();
  const currentClinicId = useCurrentClinicId();
  const clinicId = session?.user?.clinicId || currentClinicId || "";
  const userId = session?.user?.id || "";
  const initialTab = useMemo(() => searchParams.get("tab") || "payments", [searchParams]);
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [pendingSubscriptionPayment, setPendingSubscriptionPayment] = useState<{
    subscriptionId: string;
    planName: string;
    amount: number;
  } | null>(null);
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const refreshInFlightRef = useRef(false);
  const lastRefreshedScopeRef = useRef<string>("");

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
  const refreshAndRefetchBillingData = useCallback(async () => {
    if (refreshInFlightRef.current) {
      return;
    }

    const scopeKey = [session?.user?.id || "", session?.user?.clinicId || currentClinicId || ""].join("|");
    if (scopeKey && lastRefreshedScopeRef.current === scopeKey) {
      await Promise.allSettled([
        refetchInvoices(),
        refetchPayments(),
        refetchSubscriptions(),
        refetchActiveSubscription(),
        clinicId ? refetchClinicPlans() : refetchFallbackPlans(),
      ]);
      return;
    }

    refreshInFlightRef.current = true;
    try {
      const resolvedSession = session?.user?.id ? session : await refreshSession(true);
      const resolvedUserId = resolvedSession?.user?.id || "";
      const resolvedClinicId = resolvedSession?.user?.clinicId || currentClinicId || "";

      if (!resolvedUserId) {
        return;
      }

      lastRefreshedScopeRef.current = [resolvedUserId, resolvedClinicId].join("|");

      await Promise.allSettled([
        refetchInvoices(),
        refetchPayments(),
        refetchSubscriptions(),
        refetchActiveSubscription(),
        resolvedClinicId ? refetchClinicPlans() : refetchFallbackPlans(),
      ]);
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [
    clinicId,
    currentClinicId,
    refetchActiveSubscription,
    refetchClinicPlans,
    refetchFallbackPlans,
    refetchInvoices,
    refetchPayments,
    refetchSubscriptions,
    refreshSession,
    session?.user?.id,
    session?.user?.clinicId,
  ]);

  useEffect(() => {
    if (!session?.user?.id && !isSessionPending) {
      void refreshSession(true);
      return;
    }

    if (session?.user?.id) {
      void refreshAndRefetchBillingData();
    }
  }, [isSessionPending, refreshAndRefetchBillingData, refreshSession, session?.user?.id]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void refreshAndRefetchBillingData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAndRefetchBillingData();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAndRefetchBillingData]);

  const handleCreateSubscription = async (plan: BillingPlan) => {
    setSubscribeError("");
    if (!session?.user?.id) return;

    const effectiveClinicId = plan.clinicId || clinicId;
    if (!effectiveClinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId: session.user.id,
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

  return (
    <PatientBillingContent
      clinicId={clinicId}
      userId={userId}
      invoices={invoices}
      invoicesPending={invoicesPending}
      payments={payments}
      paymentsPending={paymentsPending}
      subscriptions={subscriptions as Subscription[]}
      subscriptionsPending={subscriptionsPending}
      backendActiveSubscription={backendActiveSubscription ?? null}
      clinicPlans={clinicPlans}
      clinicPlansPending={clinicPlansPending}
      fallbackPlans={fallbackPlans}
      fallbackPlansPending={fallbackPlansPending}
      initialTab={initialTab}
      planToConfirm={planToConfirm}
      pendingSubscriptionPayment={pendingSubscriptionPayment}
      showSubscriptionHistory={showSubscriptionHistory}
      subscribeError={subscribeError}
      loadError={
        invoicesError instanceof Error
          ? invoicesError.message
          : paymentsError instanceof Error
            ? paymentsError.message
            : subscriptionsError instanceof Error
              ? subscriptionsError.message
              : ""
      }
      createSubscriptionPending={createSubscriptionMutation.isPending}
      onRefetchAllBillingData={() => void refreshAndRefetchBillingData()}
      onOpenPlansTab={() => document.getElementById("patient-billing-plans-trigger")?.click()}
      onSetPlanToConfirm={setPlanToConfirm}
      onSetPendingSubscriptionPayment={setPendingSubscriptionPayment}
      onSetShowSubscriptionHistory={setShowSubscriptionHistory}
      onSetSubscribeError={setSubscribeError}
      onRefetchClinicPlans={() => void refetchClinicPlans()}
      onRefetchFallbackPlans={() => void refetchFallbackPlans()}
      onRefetchInvoices={() => void refetchInvoices()}
      onRefetchPayments={() => void refetchPayments()}
      onRefetchSubscriptions={() => void refetchSubscriptions()}
      onRefetchActiveSubscription={() => void refetchActiveSubscription()}
      onCreateSubscription={handleCreateSubscription}
    />
  );
}
