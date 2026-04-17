"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { RoleBasedBillingDashboard } from "@/components/billing";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import {
  useBillingPlans,
  useSubscriptions,
  useClinicSubscriptions,
  useInvoices,
  useClinicInvoices,
  usePayments,
  useClinicPayments,
  useBillingAnalytics,
  useClinicLedger,
} from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent } from "@/components/ui/card";
import { useLayoutStore } from "@/stores/layout.store";

function BillingPageContent() {
  const { session, isPending: isAuthPending } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();
  const searchParams = useSearchParams();
  const setPageTitle = useLayoutStore((state) => state.setPageTitle);

  useWebSocketQuerySync();

  const userRoleForTitle = (session?.user?.role || "").toUpperCase();
  useEffect(() => {
    const isPatientRole = userRoleForTitle === "PATIENT";
    setPageTitle(isPatientRole ? "My Billing" : "Billing Dashboard");
  }, [userRoleForTitle, setPageTitle]);

  const userId = (session?.user?.id || "").trim();
  const clinicId = contextClinicId || session?.user?.clinicId || "";
  const isAdminRole = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(
    (session?.user?.role as Role) || Role.PATIENT
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
  const {
    data: userSubscriptions = [],
    isPending: userSubscriptionsPending,
    refetch: refetchUserSubscriptions,
  } = useSubscriptions(userId);
  const {
    data: clinicSubscriptions = [],
    isPending: clinicSubscriptionsPending,
    refetch: refetchClinicSubscriptions,
  } = useClinicSubscriptions(isAdminRole);
  const {
    data: userInvoices = [],
    isPending: userInvoicesPending,
    refetch: refetchUserInvoices,
  } = useInvoices(userId);
  const {
    data: clinicInvoices = [],
    isPending: clinicInvoicesPending,
    refetch: refetchClinicInvoices,
  } = useClinicInvoices(isAdminRole);
  const {
    data: userPayments = [],
    isPending: userPaymentsPending,
    refetch: refetchUserPayments,
  } = usePayments(userId);
  const {
    data: clinicPayments = [],
    isPending: clinicPaymentsPending,
    refetch: refetchClinicPayments,
  } = useClinicPayments(undefined, isAdminRole);
  const { data: analytics } = useBillingAnalytics(isAdminRole ? clinicId : "");
  const { data: clinicLedger, refetch: refetchLedger } = useClinicLedger(undefined, isAdminRole);

  const hasUserId = !!userId;
  const subscriptions = isAdminRole ? clinicSubscriptions : userSubscriptions;
  const invoices = isAdminRole ? clinicInvoices : userInvoices;
  const payments = isAdminRole ? clinicPayments : userPayments;
  const plans = useMemo(
    () => (clinicPlans.length > 0 ? clinicPlans : fallbackPlans),
    [clinicPlans, fallbackPlans]
  );
  const plansPending = clinicId ? clinicPlansPending : fallbackPlansPending;

  const isPending =
    isAuthPending ||
    plansPending ||
    (isAdminRole
      ? clinicSubscriptionsPending || clinicInvoicesPending || clinicPaymentsPending
      : hasUserId && (userSubscriptionsPending || userInvoicesPending || userPaymentsPending));

  const handleRefetchAll = () => {
    void refetchClinicPlans();
    void refetchFallbackPlans();
    if (isAdminRole) {
      void refetchClinicSubscriptions();
      void refetchClinicInvoices();
      void refetchClinicPayments();
      void refetchLedger();
    } else if (hasUserId) {
      void refetchUserSubscriptions();
      void refetchUserInvoices();
      void refetchUserPayments();
    }
  };

  // Only block the page while auth session is not available yet.
  // For billing queries, render UI immediately and let sections refresh progressively.
  if (isAuthPending && !session?.user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading billing data...
        </CardContent>
      </Card>
    );
  }

  const initialTab = searchParams.get("tab") || "overview";

  return (
    <RoleBasedBillingDashboard
      initialTab={initialTab}
      plans={plans}
      subscriptions={subscriptions}
      invoices={invoices}
      payments={payments}
      isLoading={isPending}
      {...(isAdminRole && clinicLedger ? { ledger: clinicLedger } : {})}
      onRefetch={handleRefetchAll}
      {...(analytics ? { analytics } : {})}
    />
  );
}

export default function BillingPage() {
  return (
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
  );
}
