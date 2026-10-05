"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { RoleBasedBillingDashboard } from "@/components/billing";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import {
  useBillingPlans,
  useSubscriptions,
  useInvoices,
  useClinicInvoices,
  usePayments,
  useClinicPayments,
  useBillingAnalytics,
  useClinicLedger,
} from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { useLayoutStore } from "@/stores/layout.store";

function BillingPageContent() {
  const { session, isPending: isAuthPending } = useAuth();
  const clinicId = useCurrentClinicId();
  const searchParams = useSearchParams();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);

  useWebSocketQuerySync();

  const userRoleForTitle = (session?.user?.role || "").toUpperCase();
  useEffect(() => {
    const isPatientRole = userRoleForTitle === "PATIENT";
    const isReceptionistRole = userRoleForTitle === "RECEPTIONIST";
    setPageTitle(
      isPatientRole ? "My Billing" : isReceptionistRole ? "Collections & Payments" : "Billing Dashboard"
    );
  }, [userRoleForTitle, setPageTitle]);

  const userId = (session?.user?.id || "").trim();
  const currentRole = (session?.user?.role as Role) || Role.PATIENT;
  const isPatientRole = currentRole === Role.PATIENT;
  const isAdminRole = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(
    currentRole
  );
  const usesClinicBillingData = [
    Role.SUPER_ADMIN,
    Role.CLINIC_ADMIN,
    Role.FINANCE_BILLING,
    Role.RECEPTIONIST,
  ].includes(
    (session?.user?.role as Role) || Role.PATIENT
  );

  const {
    data: clinicPlans = [],
    isPending: clinicPlansPending,
    isFetching: clinicPlansFetching,
    refetch: refetchClinicPlans,
  } = useBillingPlans(clinicId, !!clinicId);
  const {
    data: fallbackPlans = [],
    isPending: fallbackPlansPending,
    isFetching: fallbackPlansFetching,
    refetch: refetchFallbackPlans,
  } = useBillingPlans(undefined, !clinicId);
  const {
    data: userSubscriptions = [],
    isPending: userSubscriptionsPending,
    isFetching: userSubscriptionsFetching,
    refetch: refetchUserSubscriptions,
  } = useSubscriptions(userId, clinicId, isPatientRole);
  const {
    data: userInvoices = [],
    isPending: userInvoicesPending,
    isFetching: userInvoicesFetching,
    error: userInvoicesError,
    refetch: refetchUserInvoices,
  } = useInvoices(userId, clinicId);
  const {
    data: clinicInvoices = [],
    isPending: clinicInvoicesPending,
    isFetching: clinicInvoicesFetching,
    error: clinicInvoicesError,
    refetch: refetchClinicInvoices,
  } = useClinicInvoices(usesClinicBillingData);
  const {
    data: userPayments = [],
    isPending: userPaymentsPending,
    isFetching: userPaymentsFetching,
    error: userPaymentsError,
    refetch: refetchUserPayments,
  } = usePayments(userId, clinicId);
  const {
    data: clinicPayments = [],
    isPending: clinicPaymentsPending,
    isFetching: clinicPaymentsFetching,
    error: clinicPaymentsError,
    refetch: refetchClinicPayments,
  } = useClinicPayments(undefined, usesClinicBillingData);
  const { data: analytics } = useBillingAnalytics(isAdminRole ? clinicId : "");
  const { data: clinicLedger, refetch: refetchLedger } = useClinicLedger(undefined, isAdminRole);

  const hasUserId = !!userId;
  const subscriptions = isPatientRole ? userSubscriptions : [];
  const invoices = usesClinicBillingData ? clinicInvoices : userInvoices;
  const payments = usesClinicBillingData ? clinicPayments : userPayments;
  const plans = clinicPlans.length > 0 ? clinicPlans : fallbackPlans;
  const plansLoading = clinicId
    ? clinicPlansPending && clinicPlansFetching
    : fallbackPlansPending && fallbackPlansFetching;

  // First load of the lists this role reads. A switched-off query stays "pending" for ever,
  // so a list only counts as loading while its request is running.
  const isSyncing = usesClinicBillingData
    ? clinicInvoicesFetching || clinicPaymentsFetching
    : userInvoicesFetching || userPaymentsFetching;
  const isPending =
    isAuthPending ||
    (usesClinicBillingData
      ? (clinicInvoicesPending && clinicInvoicesFetching) || (clinicPaymentsPending && clinicPaymentsFetching)
      : hasUserId &&
        ((userInvoicesPending && userInvoicesFetching) || (userPaymentsPending && userPaymentsFetching))) ||
    // Plans and subscriptions are only shown to patients.
    (isPatientRole && (plansLoading || (userSubscriptionsPending && userSubscriptionsFetching)));
  const loadFailure = usesClinicBillingData
    ? clinicInvoicesError || clinicPaymentsError
    : userInvoicesError || userPaymentsError;
  const loadError = loadFailure ? loadFailure.message || "Please try again." : null;

  const handleRefetchAll = useCallback(() => {
    void refetchClinicPlans();
    void refetchFallbackPlans();
    if (isAdminRole) {
      void refetchClinicInvoices();
      void refetchClinicPayments();
      void refetchLedger();
    } else if (usesClinicBillingData) {
      void refetchClinicInvoices();
      void refetchClinicPayments();
    } else if (hasUserId) {
      void refetchUserSubscriptions();
      void refetchUserInvoices();
      void refetchUserPayments();
    }
  }, [
    isAdminRole,
    hasUserId,
    refetchClinicInvoices,
    refetchClinicPayments,
    refetchClinicPlans,
    refetchFallbackPlans,
    refetchLedger,
    refetchUserInvoices,
    refetchUserPayments,
    refetchUserSubscriptions,
    usesClinicBillingData,
  ]);

  useEffect(() => {
    if (!session?.user?.id && !clinicId) {
      return;
    }

    const refreshBillingData = () => {
      handleRefetchAll();
    };

    refreshBillingData();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshBillingData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshBillingData();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clinicId, handleRefetchAll, session?.user?.id]);

  // Only block the page while auth session is not available yet.
  // For billing queries, render UI immediately and let sections refresh progressively.
  if (isAuthPending && !session?.user) {
    return (
      <DashboardPageShell>
        <span className="sr-only" role="status">
          Loading billing data…
        </span>
        <Skeleton className="h-[132px] w-full rounded-[24px]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[92px] rounded-[18px]" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-[20px]" />
      </DashboardPageShell>
    );
  }

  const initialTab = getSearchParam("tab") || "overview";

  return (
    <RoleBasedBillingDashboard
      initialTab={initialTab}
      plans={plans}
      subscriptions={subscriptions}
      invoices={invoices}
      payments={payments}
      isLoading={isPending}
      loadError={loadError}
      isSyncing={isSyncing}
      {...(isAdminRole && clinicLedger ? { ledger: clinicLedger } : {})}
      onRefetch={handleRefetchAll}
      {...(analytics ? { analytics } : {})}
    />
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedRoute
        permission={Permission.VIEW_BILLING}
        allowedRoles={[
          Role.SUPER_ADMIN,
          Role.CLINIC_ADMIN,
          Role.DOCTOR,
          Role.ASSISTANT_DOCTOR,
          Role.RECEPTIONIST,
          Role.PATIENT,
          Role.FINANCE_BILLING,
          Role.PHARMACIST,
          Role.THERAPIST,
          Role.LAB_TECHNICIAN,
          Role.SUPPORT_STAFF,
          Role.COUNSELOR,
          Role.NURSE,
          Role.CLINIC_LOCATION_HEAD,
        ]}
      >
        <BillingPageContent />
      </ProtectedRoute>
    </Suspense>
  );
}
