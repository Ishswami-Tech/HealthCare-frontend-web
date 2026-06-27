// Billing Hooks
// Integrated with real API - using Docker backend

import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { useCurrentClinicId } from './useClinics';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useAuthStore } from '@/stores/auth.store';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { PaymentProvider } from '@/lib/payments/providers';
import type {
  BillingPlan,
  CreateBillingPlanData,
  CreateSubscriptionData,
  CreateInvoiceData,
  CreatePaymentData,
  Invoice,
  Subscription,
  Payment,
  BillingAnalytics,
  SubscriptionUsageStats,
  ClinicLedgerResponse,
} from '@/types/billing.types';

type SubscriptionCoverage = {
  covered?: boolean;
  allowed?: boolean;
  requiresPayment?: boolean;
  message?: string;
  reason?: string;
  paymentAmount?: number;
};

type SubscriptionCoverageResult = {
  success: boolean;
  coverage?: SubscriptionCoverage;
  error?: string;
};

type InPersonSubscriptionAppointmentData = {
  subscriptionId: string;
  patientId: string;
  doctorId: string;
  clinicId: string;
  locationId: string;
  appointmentDate: string;
  duration: number;
  treatmentType?: string;
  priority?: string;
  notes?: string;
};

type ActionEnvelope<TKey extends string, TValue> = {
  success: boolean;
} & Record<TKey, TValue>;

function unwrapList<T>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function unwrapObject<T>(value: unknown, keys: string[]): T | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (candidate && typeof candidate === 'object') {
      return candidate as T;
    }
  }

  return undefined;
}

function getInvoiceSortTimestamp(invoice: Pick<Invoice, 'createdAt' | 'updatedAt' | 'dueDate' | 'paidDate'>): number {
  const candidate =
    invoice.createdAt ||
    invoice.updatedAt ||
    invoice.paidDate ||
    invoice.dueDate ||
    '';
  const timestamp = new Date(candidate).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortInvoicesNewestFirst(invoices: Invoice[]): Invoice[] {
  return invoices.toSorted((left, right) => getInvoiceSortTimestamp(right) - getInvoiceSortTimestamp(left));
}

function getPaymentSortTimestamp(payment: {
  createdAt?: string;
  updatedAt?: string;
  paymentDate?: string;
}): number {
  const candidate = payment.paymentDate || payment.createdAt || payment.updatedAt || "";
  const timestamp = new Date(candidate).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortPaymentsNewestFirst<T extends { createdAt?: string; updatedAt?: string; paymentDate?: string }>(
  payments: T[]
): T[] {
  return payments.toSorted((left, right) => getPaymentSortTimestamp(right) - getPaymentSortTimestamp(left));
}

// ============ Billing Plans Hooks ============

export function useBillingPlans(clinicId?: string, enabled: boolean = true) {
  return useQueryData<BillingPlan[]>(
    ['billing-plans', clinicId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.PLANS.GET_ALL, clinicId ? { clinicId } : undefined);
      return unwrapList<BillingPlan>(result.data, ['plans', 'data', 'items', 'results']);
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
  return useQueryData<BillingPlan | null>(
    ['billing-plan', id],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.PLANS.GET_BY_ID(id));
      return (unwrapObject<BillingPlan>(result.data, ['plan']) ?? (result.data as BillingPlan | null)) ?? null;
    },
    {
      enabled: !!id,
    }
  );
}

export function useCreateBillingPlan() {
  return useMutationOperation<ActionEnvelope<'plan', BillingPlan>, CreateBillingPlanData>(
    async (data: CreateBillingPlanData) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.PLANS.CREATE, data);
      const plan = unwrapObject<BillingPlan>(result.data, ['plan']) ?? (result.data as BillingPlan);
      return { success: true, plan };
    },
    {
      toastId: 'billing-plan-create',
      loadingMessage: 'Creating billing plan...',
      successMessage: 'Billing plan created successfully',
      invalidateQueries: [['billing-plans'], ['billing-analytics']],
    }
  );
}

export function useUpdateBillingPlan() {
  return useMutationOperation<ActionEnvelope<'plan', BillingPlan>, { id: string; data: Partial<CreateBillingPlanData> }>(
    async ({ id, data }: { id: string; data: Partial<CreateBillingPlanData> }) => {
      const result = await clinicApiClient.put(API_ENDPOINTS.BILLING.PLANS.UPDATE(id), data);
      const plan = unwrapObject<BillingPlan>(result.data, ['plan']) ?? (result.data as BillingPlan);
      return { success: true, plan };
    },
    {
      toastId: 'billing-plan-update',
      loadingMessage: 'Updating billing plan...',
      successMessage: 'Billing plan updated successfully',
      invalidateQueries: [['billing-plans'], ['billing-plan'], ['billing-analytics']],
    }
  );
}

export function useDeleteBillingPlan() {
  return useMutationOperation<{ success: boolean }, string>(
    async (id: string) => {
      await clinicApiClient.delete(API_ENDPOINTS.BILLING.PLANS.DELETE(id));
      return { success: true };
    },
    {
      toastId: 'billing-plan-delete',
      loadingMessage: 'Deleting billing plan...',
      successMessage: 'Billing plan deleted successfully',
      invalidateQueries: [['billing-plans'], ['billing-plan'], ['billing-analytics']],
    }
  );
}

// ============ Subscriptions Hooks ============

export function useSubscriptions(userId: string, enabled: boolean = true) {
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Subscription[]>(
    ['subscriptions', userId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_USER_SUBSCRIPTIONS(userId));
      return unwrapList<Subscription>(result.data, ['subscriptions', 'data', 'items', 'results']);
    },
    {
      enabled: enabled && !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useClinicSubscriptions(enabled: boolean = true) {
  const clinicId = useCurrentClinicId();
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Subscription[]>(
    ['clinic-subscriptions', clinicId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_CLINIC_SUBSCRIPTIONS, clinicId ? { clinicId } : undefined);
      return unwrapList<Subscription>(result.data, ['subscriptions', 'data', 'items', 'results']);
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useActiveSubscription(userId: string, clinicId: string, enabled: boolean = true) {
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Subscription | null>(
    ['active-subscription', userId, clinicId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_ACTIVE(userId), { clinicId });
      return (unwrapObject<Subscription>(result.data, ['subscription']) ?? (result.data as Subscription | null)) ?? null;
    },
    {
      enabled: enabled && !!userId && !!clinicId,
      staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
      gcTime: 15 * 60 * 1000, // 15 minutes
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useCreateSubscription() {
  return useMutationOperation<Subscription, CreateSubscriptionData>(
    async (data: CreateSubscriptionData) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CREATE, data);
      return (unwrapObject<Subscription>(result.data, ['subscription']) ?? (result.data as Subscription)) as Subscription;
    },
    {
      toastId: 'subscription-create',
      loadingMessage: 'Creating subscription...',
      successMessage: 'Subscription created successfully',
      invalidateQueries: [['subscriptions'], ['active-subscription'], ['clinic-subscriptions'], ['billing-analytics']],
    }
  );
}

export function useCancelSubscription() {
  return useMutationOperation<Subscription, { id: string; immediate?: boolean }>(
    async ({ id, immediate }: { id: string; immediate?: boolean }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CANCEL(id), { immediate });
      return (unwrapObject<Subscription>(result.data, ['subscription']) ?? (result.data as Subscription)) as Subscription;
    },
    {
      toastId: 'subscription-cancel',
      loadingMessage: 'Cancelling subscription...',
      successMessage: 'Subscription cancelled successfully',
      invalidateQueries: [['subscriptions'], ['active-subscription'], ['clinic-subscriptions'], ['billing-analytics']],
    }
  );
}

export function useSubscriptionUsageStats(id: string) {
  return useQueryData<SubscriptionUsageStats>(
    ['subscription-usage', id],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.USAGE_STATS(id));
      return (unwrapObject<SubscriptionUsageStats>(result.data, ['stats']) ?? (result.data as SubscriptionUsageStats)) as SubscriptionUsageStats;
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
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Invoice[]>(
    ['invoices', userId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.INVOICES.GET_USER_INVOICES(userId));
      return sortInvoicesNewestFirst(unwrapList<Invoice>(result.data, ['invoices', 'data', 'items', 'results']));
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useClinicInvoices(enabled: boolean = true) {
  const clinicId = useCurrentClinicId();
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Invoice[]>(
    ['clinic-invoices', clinicId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.INVOICES.GET_CLINIC_INVOICES, clinicId ? { clinicId } : undefined);
      return sortInvoicesNewestFirst(unwrapList<Invoice>(result.data, ['invoices', 'data', 'items', 'results']));
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 10 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useCreateInvoice() {
  return useMutationOperation<{ success: boolean; invoice?: Invoice; error?: string }, CreateInvoiceData>(
    async (data: CreateInvoiceData) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.INVOICES.CREATE, data);
      const invoice = unwrapObject<Invoice>(result.data, ['invoice']) ?? (result.data as Invoice);
      return { success: true, invoice };
    },
    {
      toastId: 'invoice-create',
      loadingMessage: 'Creating invoice...',
      successMessage: 'Invoice created successfully',
      invalidateQueries: [['invoices'], ['clinic-invoices'], ['billing-analytics']],
    }
  );
}

export function useMarkInvoiceAsPaid() {
  return useMutationOperation<{ success: boolean; invoice?: Invoice; error?: string }, string>(
    async (invoiceId: string) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.INVOICES.MARK_PAID(invoiceId));
      const invoice = unwrapObject<Invoice>(result.data, ['invoice']) ?? (result.data as Invoice);
      return { success: true, invoice };
    },
    {
      toastId: 'invoice-mark-paid',
      loadingMessage: 'Marking invoice as paid...',
      successMessage: 'Invoice marked as paid',
      invalidateQueries: [
        ['invoices'],
        ['clinic-invoices'],
        ['payments'],
        ['clinic-payments'],
        ['clinic-ledger'],
        ['billing-analytics'],
      ],
    }
  );
}

// ============ Payments Hooks ============

export function usePayments(userId: string) {
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Payment[]>(
    ['payments', userId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.PAYMENTS.GET_USER_PAYMENTS(userId));
      return sortPaymentsNewestFirst(unwrapList<Payment>(result.data, ['payments', 'data', 'items', 'results']));
    },
    {
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
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
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<Payment[]>(
    ['clinic-payments', clinicId, filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.PAYMENTS.GET_CLINIC_PAYMENTS, { clinicId, ...filters });
      return sortPaymentsNewestFirst(unwrapList<Payment>(result.data, ['payments', 'data', 'items', 'results']));
    },
    {
      enabled: enabled && !!clinicId,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
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
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<ClinicLedgerResponse>(
    ['clinic-ledger', filters],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.PAYMENTS.GET_LEDGER, filters);
      return (unwrapObject<ClinicLedgerResponse>(result.data, ['ledger']) ?? (result.data as ClinicLedgerResponse)) as ClinicLedgerResponse;
    },
    {
      enabled,
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

export function useCreatePayment() {
  return useMutationOperation<{ success: boolean; payment?: Payment; error?: string }, CreatePaymentData>(
    async (data: CreatePaymentData) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.PAYMENTS.CREATE, data);
      const payment = unwrapObject<Payment>(result.data, ['payment']) ?? (result.data as Payment);
      return { success: true, payment };
    },
    {
      toastId: 'payment-create',
      loadingMessage: 'Processing payment...',
      successMessage: 'Payment verified.',
      invalidateQueries: [
        ['payments'],
        ['invoices'],
        ['clinic-payments'],
        ['clinic-invoices'],
        ['clinic-ledger'],
        ['billing-analytics'],
      ],
    }
  );
}

export function useReleaseAppointmentPayout() {
  return useMutationOperation<unknown, string>(
    async (appointmentId: string) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.RELEASE_PAYOUT(appointmentId));
      return (result.data ?? result) as Record<string, unknown>;
    },
    {
      toastId: 'release-payout',
      loadingMessage: 'Releasing payout...',
      successMessage: 'Payout released successfully',
      invalidateQueries: [
        ['clinic-ledger'],
        ['clinic-payments'],
        ['payments'],
        ['billing-analytics'],
        ['clinic-invoices'],
      ],
    }
  );
}

export function useCheckSubscriptionCoverage() {
  return useMutationOperation<SubscriptionCoverageResult, {
    subscriptionId: string;
    appointmentType: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
  }>(
    async ({
      subscriptionId,
      appointmentType,
    }: {
      subscriptionId: string;
      appointmentType: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
    }) => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CHECK_COVERAGE(subscriptionId), { appointmentType });
      const coverage = unwrapObject<SubscriptionCoverage>(result.data, ['coverage']) ?? (result.data as SubscriptionCoverage);
      return { success: true, coverage };
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
  return useMutationOperation<{ success: boolean; appointment?: unknown; message?: string; error?: string }, InPersonSubscriptionAppointmentData>(
    async (data: InPersonSubscriptionAppointmentData) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.BOOK_INPERSON(data.subscriptionId), {
        ...data,
        type: 'IN_PERSON',
      });
      const appointment = unwrapObject<unknown>(result.data, ['appointment']) ?? (result.data as unknown);
      return {
        success: true,
        appointment,
        ...(result.data && typeof result.data === 'object' && 'message' in (result.data as Record<string, unknown>)
          ? { message: String((result.data as Record<string, unknown>).message ?? '') }
          : {}),
      };
    },
    {
      toastId: 'subscription-appointment-create',
      loadingMessage: 'Booking appointment...',
      successMessage: 'Appointment booked successfully',
      invalidateQueries: [
        ['appointments'],
        ['myAppointments'],
        ['subscriptions'],
        ['active-subscription'],
        ['clinic-subscriptions'],
        ['billing-analytics'],
      ],
      showToast: false,
    }
  );
}

export function useReconcilePayment() {
  return useMutationOperation<{ success: boolean; payment?: Payment; error?: string }, { paymentId: string; provider?: PaymentProvider }>(
    async ({ paymentId, provider }: { paymentId: string; provider?: PaymentProvider }) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.PAYMENTS.RECONCILE(paymentId), { provider });
      const payment = unwrapObject<Payment>(result.data, ['payment']) ?? (result.data as Payment);
      return { success: true, payment };
    },
    {
      toastId: 'reconcile-payment',
      loadingMessage: 'Reconciling payment...',
      successMessage: 'Payment reconciled',
      invalidateQueries: [
        ['clinic-ledger'],
        ['clinic-payments'],
        ['payments'],
        ['billing-analytics'],
        ['clinic-invoices'],
      ],
    }
  );
}

// ============ Invoice Communication Hooks ============

export function useSendInvoiceViaWhatsApp() {
  return useMutationOperation<{ success: boolean; error?: string }, string>(
    async (invoiceId: string) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.INVOICES.SEND_WHATSAPP(invoiceId));
      const payload = result.data as { success?: boolean; error?: string } | undefined;
      return { success: payload?.success ?? true, ...(payload?.error ? { error: payload.error } : {}) };
    },
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
  >(
    async (invoiceId: string) => {
      const result = await clinicApiClient.post(API_ENDPOINTS.BILLING.INVOICES.GENERATE_PDF(invoiceId));
      const payload = result.data as { success?: boolean; pdfUrl?: string; url?: string; message?: string; data?: unknown; error?: string } | undefined;
      return {
        success: payload?.success ?? true,
        ...(payload?.pdfUrl || payload?.url ? { pdfUrl: payload.pdfUrl || payload.url } : {}),
        ...(payload?.message ? { message: payload.message } : {}),
        ...(payload?.data !== undefined ? { data: payload.data } : {}),
        ...(payload?.error ? { error: payload.error } : {}),
      };
    },
    {
      toastId: 'generate-invoice-pdf',
      loadingMessage: 'Generating invoice PDF...',
      successMessage: 'Invoice PDF request submitted',
      errorMessage: 'Failed to generate invoice PDF',
      invalidateQueries: [['invoices'], ['clinic-invoices'], ['billing-analytics']],
    }
  );
}

// ============ Analytics Hooks ============

export function useBillingAnalytics(clinicId: string) {
  const { isConnected } = useWebSocketStatus();
  const isAuthRefreshing = useAuthStore((state) => state.isRefreshing);

  return useQueryData<BillingAnalytics>(
    ['billing-analytics', clinicId],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.BILLING.ANALYTICS.REVENUE, { clinicId });
      return ((result.data as { analytics?: BillingAnalytics } | undefined)?.analytics ?? result.data) as BillingAnalytics;
    },
    {
      enabled: !!clinicId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: isConnected || isAuthRefreshing ? false : 60_000,
    }
  );
}

