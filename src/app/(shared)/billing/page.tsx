"use client";

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
} from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent } from "@/components/ui/card";

function BillingPageContent() {
  const { session } = useAuth();
  const { clinicId: contextClinicId } = useClinicContext();

  useWebSocketQuerySync();

  const userId = session?.user?.id || "";
  const clinicId = contextClinicId || session?.user?.clinicId || "";

  const {
    data: plans = [],
    isPending: plansPending,
    refetch: refetchPlans,
  } = useBillingPlans(clinicId);
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
  const { data: analytics } = useBillingAnalytics(clinicId);

  const isPending =
    plansPending || subscriptionsPending || invoicesPending || paymentsPending;

  const handleRefetchAll = () => {
    void refetchPlans();
    void refetchSubscriptions();
    void refetchInvoices();
    void refetchPayments();
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading billing data...
        </CardContent>
      </Card>
    );
  }

  return (
    <RoleBasedBillingDashboard
      plans={plans}
      subscriptions={subscriptions}
      invoices={invoices}
      payments={payments}
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
