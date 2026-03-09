"use client";

import { useMemo } from "react";
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
  useInvoices,
  usePayments,
  useBillingAnalytics,
  useClinicLedger,
} from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent } from "@/components/ui/card";

function BillingPageContent() {
  const { session, isPending: isAuthPending } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();
  const searchParams = useSearchParams();

  useWebSocketQuerySync();

  const userId = (session?.user?.id || "").trim();
  const clinicId = contextClinicId || session?.user?.clinicId || "";

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
    data: subscriptions = [],
    isPending: subscriptionsPending,
    refetch: refetchSubscriptions,
  } = useSubscriptions(userId);
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
  const isAdminRole = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(
    (session?.user?.role as Role) || Role.PATIENT
  );
  const { data: analytics } = useBillingAnalytics(isAdminRole ? clinicId : "");
  const { data: clinicLedger, refetch: refetchLedger } = useClinicLedger(undefined, isAdminRole);

  const hasUserId = !!userId;
  const plans = useMemo(
    () => (clinicPlans.length > 0 ? clinicPlans : fallbackPlans),
    [clinicPlans, fallbackPlans]
  );

  const isPending =
    isAuthPending ||
    clinicPlansPending ||
    fallbackPlansPending ||
    (hasUserId && (subscriptionsPending || invoicesPending || paymentsPending));

  const handleRefetchAll = () => {
    void refetchClinicPlans();
    void refetchFallbackPlans();
    if (hasUserId) {
      void refetchSubscriptions();
      void refetchInvoices();
      void refetchPayments();
    }
    if (isAdminRole) {
      void refetchLedger();
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
