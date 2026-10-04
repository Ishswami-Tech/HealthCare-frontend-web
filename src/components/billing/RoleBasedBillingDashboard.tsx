"use client";

import { useCallback, useMemo, useState } from "react";
import { Role } from "@/types/auth.types";
import type {
  Invoice,
  Subscription,
  Payment,
  BillingPlan,
  BillingAnalytics,
  ClinicLedgerResponse,
} from "@/types/billing.types";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useAuth } from "@/hooks/auth/useAuth";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  useCreateSubscription,
  useCreateBillingPlan,
  useGenerateInvoicePDF,
  useSendInvoiceViaWhatsApp,
  useMarkInvoiceAsPaid,
} from "@/hooks/query/useBilling";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { showInfoToast } from "@/hooks/utils/use-toast";
import { PaymentButton } from "@/components/payments";
import { cn } from "@/lib/utils";
import { InvoiceForm } from "./InvoiceForm";
import { BillingDashboardView } from "./staff/BillingDashboardView";
import {
  ConfirmSubscriptionDialog,
  CreateInvoiceDialog,
  CreatePlanDialog,
  EMPTY_PLAN_FORM,
  SubscriptionPaymentDialog,
  type PlanFormState,
} from "./staff/BillingDialogs";
import type { BillingInvoiceActions, RenderPayAction } from "./staff/BillingInvoicesTable";
import {
  EMPTY_BILLING_FILTERS,
  PAY_BUTTON_CLASS,
  formatRupees,
  roleLabel,
  type BillingAccess,
  type BillingFilterState,
} from "./staff/billing.logic";

interface RoleBasedBillingDashboardProps {
  initialTab?: string;
  isLoading?: boolean;
  /** Set when the invoices or payments for this role could not be loaded. */
  loadError?: string | null;
  /** True while a refetch is running (spins the Sync Data icon). */
  isSyncing?: boolean;
  plans: BillingPlan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  analytics?: BillingAnalytics;
  ledger?: ClinicLedgerResponse;
  onRefetch?: () => void;
}

const PATIENT_TABS = ["plans", "subscriptions", "payments", "invoices"] as const;
const STAFF_TABS = ["overview", "invoices", "payments"] as const;
const ADMIN_TABS = ["overview", "invoices", "payments", "ledger"] as const;

interface PendingSubscriptionPayment {
  subscriptionId: string;
  planName: string;
  amount: number;
}

/**
 * Data, permissions and mutations for `/billing`. The layout is `BillingDashboardView`
 * (`./staff/`), which only takes props.
 */
export function RoleBasedBillingDashboard({
  initialTab,
  isLoading = false,
  loadError = null,
  isSyncing = false,
  plans,
  subscriptions,
  invoices,
  payments,
  analytics,
  ledger,
  onRefetch,
}: RoleBasedBillingDashboardProps) {
  const { session } = useAuth();
  const clinicId = useCurrentClinicId();
  const userRole = (session?.user?.role as Role) || Role.PATIENT;
  useWebSocketQuerySync();

  const isAdmin = [Role.SUPER_ADMIN, Role.CLINIC_ADMIN, Role.FINANCE_BILLING].includes(userRole);
  const isReceptionist = userRole === Role.RECEPTIONIST;
  const isDoctor = [Role.DOCTOR, Role.ASSISTANT_DOCTOR].includes(userRole);
  const isPatient = userRole === Role.PATIENT;
  const access: BillingAccess = {
    isPatient,
    isReceptionist,
    canManageBilling: isAdmin || isReceptionist || isDoctor,
    canMarkInvoicesPaid: isAdmin || isReceptionist,
    showLedgerTab: isAdmin,
  };

  const [filters, setFilters] = useState<BillingFilterState>(EMPTY_BILLING_FILTERS);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState<PlanFormState>(EMPTY_PLAN_FORM);
  const [planToConfirm, setPlanToConfirm] = useState<BillingPlan | null>(null);
  const [subscribeError, setSubscribeError] = useState("");
  const [isSubscriptionPaymentOpen, setIsSubscriptionPaymentOpen] = useState(false);
  const [pendingSubscriptionPayment, setPendingSubscriptionPayment] = useState<PendingSubscriptionPayment | null>(null);

  const createSubscriptionMutation = useCreateSubscription();
  const createPlanMutation = useCreateBillingPlan();
  const sendInvoiceWhatsAppMutation = useSendInvoiceViaWhatsApp();
  const generateInvoicePDFMutation = useGenerateInvoicePDF();
  const markInvoiceAsPaidMutation = useMarkInvoiceAsPaid();

  const activeSubscription = subscriptions.find((s) => s.status === "ACTIVE" || s.status === "TRIALING");

  const handleSubscribePlan = async () => {
    setSubscribeError("");
    if (!session?.user?.id || !planToConfirm) return;
    const resolvedClinicId = planToConfirm.clinicId || clinicId || "";
    if (!resolvedClinicId) {
      setSubscribeError("Clinic context is missing for subscription checkout.");
      return;
    }

    try {
      const created = await createSubscriptionMutation.mutateAsync({
        userId: session.user.id,
        clinicId: resolvedClinicId,
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
      setIsSubscriptionPaymentOpen(true);
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Failed to create subscription.");
    }
  };

  const handleCreatePlan = async () => {
    const fail = (error: string) => setPlanForm((current) => ({ ...current, error }));
    if (!session?.user?.profileComplete) {
      fail("Profile incomplete. Complete your profile before creating billing plans.");
      return;
    }

    const resolvedClinicId = clinicId || plans[0]?.clinicId || "";
    const name = planForm.name.trim();
    const parsedPrice = Number(planForm.price);
    const parsedAppointments = Number(planForm.appointments || "0");
    if (!resolvedClinicId || !name || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      fail("Please fill valid plan name, clinic, and price.");
      return;
    }

    try {
      await createPlanMutation.mutateAsync({
        clinicId: resolvedClinicId,
        name,
        price: parsedPrice,
        currency: "INR",
        billingCycle: planForm.cycle,
        isActive: true,
        isUnlimitedAppointments: planForm.unlimited,
        ...(planForm.unlimited ? {} : { appointmentsIncluded: Math.max(1, parsedAppointments || 1) }),
        description: `${name} (${planForm.cycle.toLowerCase()})`,
      });

      setIsCreatePlanOpen(false);
      setPlanForm(EMPTY_PLAN_FORM);
      onRefetch?.();
    } catch (error) {
      fail(error instanceof Error ? error.message : "Failed to create billing plan.");
    }
  };

  const roleTabs: readonly string[] = isPatient ? PATIENT_TABS : access.showLedgerTab ? ADMIN_TABS : STAFF_TABS;
  const defaultTab = isPatient ? "plans" : "overview";
  const initialDefault = initialTab && roleTabs.includes(initialTab.toLowerCase()) ? initialTab.toLowerCase() : defaultTab;
  const tabAliases = useMemo(() => ({ analytics: defaultTab, reports: defaultTab }), [defaultTab]);
  const { tab: activeTab, setTab: setActiveTab } = useHashTab({
    tabs: roleTabs,
    defaultValue: initialDefault,
    aliases: tabAliases,
  });

  const header = {
    eyebrow: isPatient ? "BILLING" : isReceptionist ? "COLLECTIONS" : "BILLING DASHBOARD",
    title: isPatient ? "My Billing" : isReceptionist ? "Collections & Payments" : "Billing Dashboard",
    description: isReceptionist
      ? "Collections and invoice payments for your clinic."
      : !isPatient
        ? `Role-wise billing access active for ${roleLabel(userRole)}`
        : !activeSubscription
          ? "Select a plan to unlock in-person appointments"
          : "Manage your billing, subscriptions, and history",
  };

  const handleGenerateInvoicePDF = async (invoice: Invoice) => {
    try {
      const result = await generateInvoicePDFMutation.mutateAsync(invoice.id);

      if (!result.success) {
        return;
      }

      if (result.pdfUrl) {
        window.open(result.pdfUrl, "_blank", "noopener,noreferrer");
        return;
      }

      showInfoToast(
        result.message || "Invoice PDF generation has been queued. Refresh in a moment to fetch the file.",
      );
    } catch {
      // Error toast is already handled by the mutation wrapper.
    }
  };

  const handleMarkInvoicePaid = useCallback(
    async (invoice: Invoice) => {
      setMarkingPaidId(invoice.id);
      try {
        await markInvoiceAsPaidMutation.mutateAsync(invoice.id);
        onRefetch?.();
      } catch {
        // Error toast is already handled by the mutation wrapper.
      } finally {
        setMarkingPaidId(null);
      }
    },
    [markInvoiceAsPaidMutation, onRefetch],
  );

  // The one place a payment can start from this screen: the shared PaymentButton, in amber.
  const renderPayAction: RenderPayAction = (invoice, placement) => (
    <PaymentButton
      invoiceId={invoice.id}
      amount={invoice.amount}
      className={cn(PAY_BUTTON_CLASS, placement === "dialog" && "h-11 px-[18px]")}
    >
      Pay {formatRupees(invoice.amount)}
    </PaymentButton>
  );

  const invoiceActions: BillingInvoiceActions = {
    onViewInvoice: setSelectedInvoice,
    renderPayAction,
    viewDisabled: generateInvoicePDFMutation.isPending,
    ...(access.canMarkInvoicesPaid
      ? {
          onMarkPaid: (invoice: Invoice) => void handleMarkInvoicePaid(invoice),
          markingPaidId,
          markPaidPending: markInvoiceAsPaidMutation.isPending,
        }
      : {}),
    ...(access.canManageBilling
      ? {
          onSendWhatsApp: (invoice: Invoice) => sendInvoiceWhatsAppMutation.mutate(invoice.id),
          sendWhatsAppPending: sendInvoiceWhatsAppMutation.isPending,
        }
      : {}),
  };

  return (
    <BillingDashboardView
      access={access}
      header={header}
      tabs={roleTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
      loadError={loadError}
      syncing={isSyncing}
      onRefetch={() => onRefetch?.()}
      onNewInvoice={access.canManageBilling ? () => setIsCreateInvoiceOpen(true) : undefined}
      plans={plans}
      subscriptions={subscriptions}
      invoices={invoices}
      payments={payments}
      analytics={analytics}
      ledger={ledger}
      filters={filters}
      onFiltersChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
      onFiltersReset={() => setFilters(EMPTY_BILLING_FILTERS)}
      invoiceActions={invoiceActions}
      selectedInvoice={selectedInvoice}
      onCloseInvoice={() => setSelectedInvoice(null)}
      onOpenInvoicePdf={(invoice) => void handleGenerateInvoicePDF(invoice)}
      openInvoicePdfPending={generateInvoicePDFMutation.isPending}
      onChoosePlan={setPlanToConfirm}
      subscribeError={subscribeError}
    >
      <CreateInvoiceDialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
        <InvoiceForm
          onSuccess={() => {
            setIsCreateInvoiceOpen(false);
            onRefetch?.();
          }}
          onCancel={() => setIsCreateInvoiceOpen(false)}
        />
      </CreateInvoiceDialog>

      <CreatePlanDialog
        open={isCreatePlanOpen}
        onOpenChange={(open) => {
          setIsCreatePlanOpen(open);
          if (!open) setPlanForm((current) => ({ ...current, error: "" }));
        }}
        form={planForm}
        onChange={(patch) => setPlanForm((current) => ({ ...current, ...patch }))}
        onSubmit={() => void handleCreatePlan()}
        pending={createPlanMutation.isPending}
      />

      <ConfirmSubscriptionDialog
        plan={planToConfirm}
        error={subscribeError}
        pending={createSubscriptionMutation.isPending}
        onConfirm={() => void handleSubscribePlan()}
        onClose={() => setPlanToConfirm(null)}
      />

      <SubscriptionPaymentDialog
        open={isSubscriptionPaymentOpen}
        onOpenChange={setIsSubscriptionPaymentOpen}
        planName={pendingSubscriptionPayment?.planName}
      >
        {pendingSubscriptionPayment ? (
          <PaymentButton
            subscriptionId={pendingSubscriptionPayment.subscriptionId}
            amount={pendingSubscriptionPayment.amount}
            description={pendingSubscriptionPayment.planName}
            autoStart
            className={cn(PAY_BUTTON_CLASS, "h-11 w-full")}
            onSuccess={() => {
              setIsSubscriptionPaymentOpen(false);
              setPendingSubscriptionPayment(null);
              onRefetch?.();
            }}
          >
            Pay {formatRupees(pendingSubscriptionPayment.amount)}
          </PaymentButton>
        ) : null}
      </SubscriptionPaymentDialog>
    </BillingDashboardView>
  );
}
