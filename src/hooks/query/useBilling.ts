// Billing Hooks
// Integrated with real API - using Docker backend

import { useQueryData, useMutationOperation } from '../core';
import { useCurrentClinicId } from './useClinics';
import {
  getBillingPlans,
  getBillingPlan,
  createBillingPlan,
  updateBillingPlan,
  deleteBillingPlan,
  getSubscriptions,
  getClinicSubscriptions,
  getActiveSubscription,
  createSubscription,
  cancelSubscription,
  getSubscriptionUsageStats,
  getInvoices,
  getClinicInvoices,
  createInvoice,
  getPayments,
  getClinicPayments,
  getClinicLedger,
  releaseAppointmentPayout,
  reconcilePayment,
  createPayment,
  getBillingAnalytics,
  sendInvoiceViaWhatsApp,
  generateInvoicePDF,
  markInvoiceAsPaid,
  checkSubscriptionCoverage,
  createInPersonAppointmentWithSubscription,
} from '@/lib/actions/billing.server';
import type { PaymentProvider } from '@/lib/payments/providers';
import type {
  CreateBillingPlanData,
  CreateSubscriptionData,
  CreateInvoiceData,
  CreatePaymentData,
} from '@/types/billing.types';

// ============ Billing Plans Hooks ============

export function useBillingPlans(clinicId?: string, enabled: boolean = true) {
  return useQueryData(
    ['billing-plans', clinicId],
    async () => {
      const result = await getBillingPlans(clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch billing plans');
      }
      return result.plans || [];
    },
    {
      enabled,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useBillingPlan(id: string) {
  return useQueryData(
    ['billing-plan', id],
    async () => {
      const result = await getBillingPlan(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch billing plan');
      }
      return result.plan;
    },
    {
      enabled: !!id,
    }
  );
}

export function useCreateBillingPlan() {
  return useMutationOperation(
    async (data: CreateBillingPlanData) => {
      const result = await createBillingPlan(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create billing plan');
      }
      return result.plan;
    },
    {
      toastId: 'billing-plan-create',
      loadingMessage: 'Creating billing plan...',
      successMessage: 'Billing plan created successfully',
      invalidateQueries: [['billing-plans']],
    }
  );
}

export function useUpdateBillingPlan() {
  return useMutationOperation(
    async ({ id, data }: { id: string; data: Partial<CreateBillingPlanData> }) => {
      const result = await updateBillingPlan(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update billing plan');
      }
      return result.plan;
    },
    {
      toastId: 'billing-plan-update',
      loadingMessage: 'Updating billing plan...',
      successMessage: 'Billing plan updated successfully',
      invalidateQueries: [['billing-plans'], ['billing-plan']],
    }
  );
}

export function useDeleteBillingPlan() {
  return useMutationOperation(
    async (id: string) => {
      const result = await deleteBillingPlan(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete billing plan');
      }
    },
    {
      toastId: 'billing-plan-delete',
      loadingMessage: 'Deleting billing plan...',
      successMessage: 'Billing plan deleted successfully',
      invalidateQueries: [['billing-plans']],
    }
  );
}

// ============ Subscriptions Hooks ============

export function useSubscriptions(userId: string, enabled: boolean = true) {
  return useQueryData(
    ['subscriptions', userId],
    async () => {
      const result = await getSubscriptions(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch subscriptions');
      }
      return result.subscriptions || [];
    },
    {
      enabled: enabled && !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useClinicSubscriptions(enabled: boolean = true) {
  const clinicId = useCurrentClinicId();

  return useQueryData(
    ['clinic-subscriptions', clinicId],
    async () => {
      const result = await getClinicSubscriptions();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clinic subscriptions');
      }
      return result.subscriptions || [];
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useActiveSubscription(userId: string, clinicId: string, enabled: boolean = true) {
  return useQueryData(
    ['active-subscription', userId, clinicId],
    async () => {
      const result = await getActiveSubscription(userId, clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch active subscription');
      }
      return result.subscription;
    },
    {
      enabled: enabled && !!userId && !!clinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
      gcTime: 15 * 60 * 1000, // 15 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useCreateSubscription() {
  return useMutationOperation(
    async (data: CreateSubscriptionData) => {
      const result = await createSubscription(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }
      return result.subscription;
    },
    {
      toastId: 'subscription-create',
      loadingMessage: 'Creating subscription...',
      successMessage: 'Subscription created successfully',
      invalidateQueries: [['subscriptions'], ['active-subscription']],
    }
  );
}

export function useCancelSubscription() {
  return useMutationOperation(
    async ({ id, immediate }: { id: string; immediate?: boolean }) => {
      const result = await cancelSubscription(id, immediate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
      return result.subscription;
    },
    {
      toastId: 'subscription-cancel',
      loadingMessage: 'Cancelling subscription...',
      successMessage: 'Subscription cancelled successfully',
      invalidateQueries: [['subscriptions'], ['active-subscription']],
    }
  );
}

export function useSubscriptionUsageStats(id: string) {
  return useQueryData(
    ['subscription-usage', id],
    async () => {
      const result = await getSubscriptionUsageStats(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage stats');
      }
      return result.stats;
    },
    {
      enabled: !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes (optimized for 10M users)
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    }
  );
}

// ============ Invoices Hooks ============

export function useInvoices(userId: string) {
  return useQueryData(
    ['invoices', userId],
    async () => {
      const result = await getInvoices(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoices');
      }
      return result.invoices || [];
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useClinicInvoices(enabled: boolean = true) {
  const clinicId = useCurrentClinicId();

  return useQueryData(
    ['clinic-invoices', clinicId],
    async () => {
      const result = await getClinicInvoices();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clinic invoices');
      }
      return result.invoices || [];
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useCreateInvoice() {
  return useMutationOperation(
    async (data: CreateInvoiceData) => {
      const result = await createInvoice(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }
      return result;
    },
    {
      toastId: 'invoice-create',
      loadingMessage: 'Creating invoice...',
      successMessage: 'Invoice created successfully',
      invalidateQueries: [['invoices']],
    }
  );
}

export function useMarkInvoiceAsPaid() {
  return useMutationOperation(
    async (invoiceId: string) => {
      const result = await markInvoiceAsPaid(invoiceId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to mark invoice as paid');
      }
      return result.invoice;
    },
    {
      toastId: 'invoice-mark-paid',
      loadingMessage: 'Marking invoice as paid...',
      successMessage: 'Invoice marked as paid',
      invalidateQueries: [['invoices'], ['clinic-invoices'], ['payments'], ['clinic-payments']],
    }
  );
}

// ============ Payments Hooks ============

export function usePayments(userId: string) {
  return useQueryData(
    ['payments', userId],
    async () => {
      const result = await getPayments(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments');
      }
      return result.payments || [];
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useClinicPayments(filters?: {
  status?: string;
  revenueModel?: 'APPOINTMENT' | 'SUBSCRIPTION' | 'OTHER';
  appointmentType?: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
  provider?: string;
  startDate?: string;
  endDate?: string;
}, enabled: boolean = true) {
  const clinicId = useCurrentClinicId();

  return useQueryData(
    ['clinic-payments', clinicId, filters],
    async () => {
      const result = await getClinicPayments(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clinic payments');
      }
      return result.payments || [];
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useClinicLedger(filters?: {
  status?: string;
  revenueModel?: 'APPOINTMENT' | 'SUBSCRIPTION' | 'OTHER';
  appointmentType?: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
  provider?: string;
  startDate?: string;
  endDate?: string;
}, enabled: boolean = true) {
  return useQueryData(
    ['clinic-ledger', filters],
    async () => {
      const result = await getClinicLedger(filters);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch clinic ledger');
      }
      return result.ledger;
    },
    {
      enabled,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}

export function useCreatePayment() {
  return useMutationOperation(
    async (data: CreatePaymentData) => {
      const result = await createPayment(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }
      return result.payment;
    },
    {
      toastId: 'payment-create',
      loadingMessage: 'Processing payment...',
      successMessage: 'Payment verified.',
      invalidateQueries: [['payments'], ['invoices']],
    }
  );
}

export function useReleaseAppointmentPayout() {
  return useMutationOperation(
    async (appointmentId: string) => {
      const result = await releaseAppointmentPayout(appointmentId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to release payout');
      }
      return result.data;
    },
    {
      toastId: 'release-payout',
      loadingMessage: 'Releasing payout...',
      successMessage: 'Payout released successfully',
      invalidateQueries: [['clinic-ledger'], ['clinic-payments'], ['payments'], ['billing-analytics']],
    }
  );
}

export function useCheckSubscriptionCoverage() {
  return useMutationOperation(
    async ({
      subscriptionId,
      appointmentType,
    }: {
      subscriptionId: string;
      appointmentType: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
    }) => {
      const result = await checkSubscriptionCoverage(subscriptionId, appointmentType);
      if (!result.success) {
        throw new Error(result.error || 'Unable to validate subscription coverage');
      }
      return result;
    },
    {
      toastId: 'subscription-coverage-check',
      loadingMessage: 'Validating subscription coverage...',
      successMessage: 'Subscription coverage validated',
      showToast: false,
      showLoading: false,
    }
  );
}

export function useCreateInPersonAppointmentWithSubscription() {
  return useMutationOperation(
    async (
      data: Parameters<typeof createInPersonAppointmentWithSubscription>[0]
    ) => {
      const result = await createInPersonAppointmentWithSubscription(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription-based appointment');
      }
      return result;
    },
    {
      toastId: 'subscription-appointment-create',
      loadingMessage: 'Booking appointment...',
      successMessage: 'Appointment booked successfully',
      invalidateQueries: [['appointments'], ['myAppointments'], ['subscriptions']],
      showToast: false,
    }
  );
}

export function useReconcilePayment() {
  return useMutationOperation(
    async ({ paymentId, provider }: { paymentId: string; provider?: PaymentProvider }) => {
      const result = await reconcilePayment(paymentId, provider);
      if (!result.success) {
        throw new Error(result.error || 'Failed to reconcile payment');
      }
      return result.data;
    },
    {
      toastId: 'reconcile-payment',
      loadingMessage: 'Reconciling payment...',
      successMessage: 'Payment reconciled',
      invalidateQueries: [['clinic-ledger'], ['clinic-payments'], ['payments'], ['billing-analytics']],
    }
  );
}

// ============ Invoice Communication Hooks ============

export function useSendInvoiceViaWhatsApp() {
  return useMutationOperation<{ success: boolean; error?: string }, string>(
    (invoiceId: string) => sendInvoiceViaWhatsApp(invoiceId),
    {
      toastId: 'send-invoice-whatsapp',
      loadingMessage: 'Sending invoice via WhatsApp...',
      successMessage: 'Invoice sent via WhatsApp successfully',
      errorMessage: 'Failed to send invoice via WhatsApp',
    }
  );
}

export function useGenerateInvoicePDF() {
  return useMutationOperation<
    { success: boolean; pdfUrl?: string; message?: string; data?: unknown; error?: string },
    string
  >((invoiceId: string) => generateInvoicePDF(invoiceId), {
    toastId: 'generate-invoice-pdf',
    loadingMessage: 'Generating invoice PDF...',
    successMessage: 'Invoice PDF request submitted',
    errorMessage: 'Failed to generate invoice PDF',
    invalidateQueries: [['invoices'], ['clinic-invoices']],
  });
}

// ============ Analytics Hooks ============

export function useBillingAnalytics(clinicId: string) {
  return useQueryData(
    ['billing-analytics', clinicId],
    async () => {
      const result = await getBillingAnalytics(clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
      return result.analytics;
    },
    {
      enabled: !!clinicId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
}

