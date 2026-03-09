// Billing Server Actions
// Integrated with backend billing API

'use server';

import { authenticatedApi } from './auth.server';
import { z } from 'zod';
import { API_ENDPOINTS } from '../config/config';
import type {
  BillingPlan,
  Subscription,
  Invoice,
  Payment,
  BillingAnalytics,
  SubscriptionUsageStats,
  ClinicLedgerResponse,
  LedgerPaymentRow,
  CreateBillingPlanData,
  CreateSubscriptionData,
  CreateInvoiceData,
  CreatePaymentData,
} from '@/types/billing.types';
import { createInvoiceSchema, createPaymentSchema } from '@/lib/schema/billing.schema';
import type { PaymentProvider } from '@/lib/payments/providers';

type RawBillingPlan = Record<string, unknown>;

function normalizeBillingPlan(raw: RawBillingPlan): BillingPlan {
  const billingCycleRaw = raw.interval ?? raw.billingCycle;
  const billingCycle =
    typeof billingCycleRaw === 'string'
      ? (billingCycleRaw as BillingPlan['billingCycle'])
      : 'MONTHLY';

  const featuresRaw = raw.features;
  const normalizedFeatures = Array.isArray(featuresRaw)
    ? (featuresRaw as string[])
    : [];

  const appointmentTypesRaw = raw.appointmentTypes;
  const normalizedAppointmentTypes = Array.isArray(appointmentTypesRaw)
    ? (appointmentTypesRaw as string[])
    : [];

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Untitled Plan'),
    ...(raw.description ? { description: String(raw.description) } : {}),
    price: Number(raw.price ?? raw.amount ?? 0),
    currency: String(raw.currency ?? 'INR'),
    billingCycle,
    ...(raw.appointmentsIncluded !== undefined
      ? { appointmentsIncluded: Number(raw.appointmentsIncluded) }
      : {}),
    isUnlimitedAppointments: Boolean(raw.isUnlimitedAppointments),
    ...(normalizedAppointmentTypes.length > 0
      ? { appointmentTypes: normalizedAppointmentTypes }
      : {}),
    ...(normalizedFeatures.length > 0 ? { features: normalizedFeatures } : {}),
    isActive: raw.isActive !== false,
    ...(raw.clinicId ? { clinicId: String(raw.clinicId) } : {}),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

// ============ Billing Plans ============

// 🔒 TENANT ISOLATION: clinicId is auto-provided via X-Clinic-ID header by authenticatedApi.
// The backend ClinicGuard uses the header, not query params, for tenant scoping.
export async function getBillingPlans(_clinicId?: string): Promise<{
  success: boolean;
  plans?: BillingPlan[];
  error?: string;
}> {
  try {
    const extractPlans = (value: unknown): unknown[] => {
      if (Array.isArray(value)) return value;
      if (!value || typeof value !== 'object') return [];

      const obj = value as Record<string, unknown>;
      const directKeys = ['data', 'plans', 'items', 'results', 'billingPlans', 'rows'];
      for (const key of directKeys) {
        const candidate = obj[key];
        if (Array.isArray(candidate)) return candidate;
      }

      for (const key of directKeys) {
        const nested = obj[key];
        if (nested && typeof nested === 'object') {
          const nestedObj = nested as Record<string, unknown>;
          for (const nestedKey of directKeys) {
            const candidate = nestedObj[nestedKey];
            if (Array.isArray(candidate)) return candidate;
          }
        }
      }
      return [];
    };

    const parsePlans = (value: unknown): BillingPlan[] =>
      extractPlans(value)
        .filter((plan): plan is RawBillingPlan => !!plan && typeof plan === 'object')
        .map((plan) => normalizeBillingPlan(plan));

    const { status, data } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.GET_ALL, {
      ...(_clinicId ? { headers: { 'X-Clinic-ID': _clinicId } } : {}),
    });
    if (status >= 400) {
      return {
        success: false,
        error: status === 403
          ? 'Profile incomplete. Please complete profile first.'
          : 'Failed to fetch billing plans',
      };
    }

    let plans = parsePlans(data);

    // Fallback in case clinic header format causes over-filtering in some environments.
    if (_clinicId && plans.length === 0) {
      const fallback = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.GET_ALL);
      if (fallback.status < 400) {
        plans = parsePlans(fallback.data);
      }
    }

    return { success: true, plans };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch billing plans' };
  }
}

export async function getBillingPlan(id: string): Promise<{
  success: boolean;
  plan?: BillingPlan;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.GET_BY_ID(id));
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid billing plan response' };
    }
    return { success: true, plan: normalizeBillingPlan(data as RawBillingPlan) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch billing plan' };
  }
}

export async function createBillingPlan(data: CreateBillingPlanData): Promise<{
  success: boolean;
  plan?: BillingPlan;
  error?: string;
}> {
  try {
    const payload = {
      name: data.name,
      ...(data.description ? { description: data.description } : {}),
      amount: data.price,
      currency: data.currency || 'INR',
      interval: data.billingCycle,
      ...(data.appointmentsIncluded !== undefined
        ? { appointmentsIncluded: data.appointmentsIncluded }
        : {}),
      ...(data.isUnlimitedAppointments !== undefined
        ? { isUnlimitedAppointments: data.isUnlimitedAppointments }
        : {}),
      ...(data.clinicId ? { clinicId: data.clinicId } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    const { status, data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (status >= 400) {
      return {
        success: false,
        error: status === 403
          ? 'Profile incomplete. Please complete profile first.'
          : 'Failed to create billing plan',
      };
    }
    // Some backend deployments return 200/201 with empty body for create/update.
    // Treat that as success and rely on query invalidation/refetch to refresh plan list.
    if (!response || typeof response !== 'object') {
      return { success: true };
    }
    return { success: true, plan: normalizeBillingPlan(response as RawBillingPlan) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create billing plan' };
  }
}

export async function updateBillingPlan(
  id: string,
  data: Partial<CreateBillingPlanData>
): Promise<{
  success: boolean;
  plan?: BillingPlan;
  error?: string;
}> {
  try {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.price !== undefined) payload.amount = data.price;
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.billingCycle !== undefined) payload.interval = data.billingCycle;
    if (data.appointmentsIncluded !== undefined) payload.appointmentsIncluded = data.appointmentsIncluded;
    if (data.isUnlimitedAppointments !== undefined) {
      payload.isUnlimitedAppointments = data.isUnlimitedAppointments;
    }
    if (data.isActive !== undefined) payload.isActive = data.isActive;

    const { status, data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (status >= 400) {
      return {
        success: false,
        error: status === 403
          ? 'Profile incomplete. Please complete profile first.'
          : 'Failed to update billing plan',
      };
    }
    if (!response || typeof response !== 'object') {
      return { success: true };
    }
    return { success: true, plan: normalizeBillingPlan(response as RawBillingPlan) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update billing plan' };
  }
}

export async function deleteBillingPlan(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.DELETE(id), {
      method: 'DELETE',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete billing plan' };
  }
}

// ============ Subscriptions ============

export async function getSubscriptions(userId: string): Promise<{
  success: boolean;
  subscriptions?: Subscription[];
  error?: string;
}> {
  try {
    const normalizedUserId = (userId || '').trim();
    if (!normalizedUserId) {
      return { success: true, subscriptions: [] };
    }
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_USER_SUBSCRIPTIONS(normalizedUserId)
    );
    return { success: true, subscriptions: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch subscriptions' };
  }
}

export async function getActiveSubscription(
  userId: string,
  clinicId: string
): Promise<{
  success: boolean;
  subscription?: Subscription;
  error?: string;
}> {
  try {
    const endpoint = `${API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_ACTIVE(userId)}?clinicId=${encodeURIComponent(clinicId)}`;
    const { data } = await authenticatedApi(endpoint);
    return { success: true, subscription: data as Subscription };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch active subscription' };
  }
}

export async function createSubscription(data: CreateSubscriptionData): Promise<{
  success: boolean;
  subscription?: Subscription;
  error?: string;
}> {
  try {
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, subscription: response as Subscription };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create subscription' };
  }
}

export async function cancelSubscription(
  id: string,
  immediate?: boolean
): Promise<{
  success: boolean;
  subscription?: Subscription;
  error?: string;
}> {
  try {
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CANCEL(id), {
      method: 'POST',
      body: JSON.stringify({ immediate }),
    });
    return { success: true, subscription: response as Subscription };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
  }
}

export async function getSubscriptionUsageStats(id: string): Promise<{
  success: boolean;
  stats?: SubscriptionUsageStats;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.USAGE_STATS(id));
    return { success: true, stats: data as SubscriptionUsageStats };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch usage stats' };
  }
}

// ✅ Validation Schemas Imported from '@/lib/schema/billing.schema'

// ============ Invoices ============

export async function getInvoices(userId: string): Promise<{
  success: boolean;
  invoices?: Invoice[];
  error?: string;
}> {
  try {
    const normalizedUserId = (userId || '').trim();
    if (!normalizedUserId) {
      return { success: true, invoices: [] };
    }
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.INVOICES.GET_USER_INVOICES(normalizedUserId)
    );
    return { success: true, invoices: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch invoices' };
  }
}

export async function createInvoice(data: CreateInvoiceData): Promise<{
  success: boolean;
  invoice?: Invoice;
  error?: string;
}> {
  try {
    const validated = createInvoiceSchema.parse(data);
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.CREATE, {
      method: 'POST',
      body: JSON.stringify(validated),
    });
    return { success: true, invoice: response as Invoice };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.issues[0]?.message}` };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create invoice' };
  }
}

export async function markInvoiceAsPaid(id: string): Promise<{
  success: boolean;
  invoice?: Invoice;
  error?: string;
}> {
  try {
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.MARK_PAID(id), {
      method: 'POST',
    });
    return { success: true, invoice: response as Invoice };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to mark invoice as paid' };
  }
}

export async function sendInvoiceViaWhatsApp(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.SEND_WHATSAPP(invoiceId), {
      method: 'POST',
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send invoice via WhatsApp' };
  }
}

export async function generateInvoicePDF(id: string): Promise<{
  success: boolean;
  pdfUrl?: string;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.GENERATE_PDF(id));
    const pdfData = data as { url?: string; pdfUrl?: string } | undefined;
    const pdfUrl = pdfData?.url || pdfData?.pdfUrl;
    return { success: true, ...(pdfUrl ? { pdfUrl } : {}) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate invoice PDF' };
  }
}

// ============ Payments ============

export async function getPayments(userId: string): Promise<{
  success: boolean;
  payments?: Payment[];
  error?: string;
}> {
  try {
    const normalizedUserId = (userId || '').trim();
    if (!normalizedUserId) {
      return { success: true, payments: [] };
    }
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.PAYMENTS.GET_USER_PAYMENTS(normalizedUserId)
    );
    return { success: true, payments: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch payments' };
  }
}

export async function getClinicPayments(filters?: {
  status?: string;
  revenueModel?: 'APPOINTMENT' | 'SUBSCRIPTION' | 'OTHER';
  appointmentType?: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
  provider?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  payments?: LedgerPaymentRow[];
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.revenueModel) params.set('revenueModel', filters.revenueModel);
    if (filters?.appointmentType) params.set('appointmentType', filters.appointmentType);
    if (filters?.provider) params.set('provider', filters.provider);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const query = params.toString();
    const endpoint = `${API_ENDPOINTS.BILLING.PAYMENTS.GET_CLINIC_PAYMENTS}${query ? `?${query}` : ''}`;
    const { data } = await authenticatedApi(endpoint);
    return { success: true, payments: Array.isArray(data) ? (data as LedgerPaymentRow[]) : [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch clinic payments' };
  }
}

export async function getClinicLedger(filters?: {
  status?: string;
  revenueModel?: 'APPOINTMENT' | 'SUBSCRIPTION' | 'OTHER';
  appointmentType?: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT';
  provider?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  success: boolean;
  ledger?: ClinicLedgerResponse;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.revenueModel) params.set('revenueModel', filters.revenueModel);
    if (filters?.appointmentType) params.set('appointmentType', filters.appointmentType);
    if (filters?.provider) params.set('provider', filters.provider);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    const query = params.toString();
    const endpoint = `${API_ENDPOINTS.BILLING.PAYMENTS.GET_LEDGER}${query ? `?${query}` : ''}`;
    const { data } = await authenticatedApi(endpoint);
    return { success: true, ledger: data as ClinicLedgerResponse };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch clinic ledger' };
  }
}

export async function createPayment(data: CreatePaymentData): Promise<{
  success: boolean;
  payment?: Payment;
  error?: string;
}> {
  try {
    const validated = createPaymentSchema.parse(data);
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(validated),
    });
    return { success: true, payment: response as Payment };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.issues[0]?.message}` };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create payment' };
  }
}

// ✅ NEW: Missing Payment Processing Actions

export async function processSubscriptionPayment(
  subscriptionId: string,
  provider: PaymentProvider = 'cashfree'
): Promise<{
  success: boolean;
  invoice?: any;
  paymentIntent?: any;
  message?: string;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.BILLING.SUBSCRIPTIONS.BASE}/${subscriptionId}/process-payment?provider=${provider}`, {
      method: 'POST',
    });
    return { 
      success: true, 
      invoice: (data as any).invoice, 
      paymentIntent: (data as any).paymentIntent,
      message: (data as any).message 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process subscription payment' };
  }
}

export async function processAppointmentPayment(
  appointmentId: string,
  amount: number,
  appointmentType: 'VIDEO_CALL' | 'IN_PERSON' | 'HOME_VISIT',
  provider: PaymentProvider = 'cashfree'
): Promise<{
  success: boolean;
  invoice?: any;
  paymentIntent?: any;
  message?: string;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PROCESS_PAYMENT(appointmentId)}?provider=${provider}`, {
      method: 'POST',
      body: JSON.stringify({ amount, appointmentType }),
    });
    return { 
      success: true, 
      invoice: (data as any).invoice, 
      paymentIntent: (data as any).paymentIntent,
      message: (data as any).message 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process appointment payment' };
  }
}

export async function getAppointmentPayoutStatus(appointmentId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.PAYOUT_STATUS(appointmentId)
    );
    return { success: true, data: data as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payout status',
    };
  }
}

export async function releaseAppointmentPayout(appointmentId: string): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.APPOINTMENT_PAYMENTS.RELEASE_PAYOUT(appointmentId),
      {
        method: 'POST',
      }
    );
    return { success: true, data: data as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to release payout',
    };
  }
}

export async function reconcilePayment(
  paymentId: string,
  provider?: PaymentProvider
): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.PAYMENTS.RECONCILE(paymentId),
      {
        method: 'POST',
        body: JSON.stringify(provider ? { provider } : {}),
      }
    );
    return { success: true, data: data as Record<string, unknown> };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconcile payment',
    };
  }
}

export async function bookAppointmentWithSubscription(
  subscriptionId: string,
  appointmentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data } = await authenticatedApi(
      API_ENDPOINTS.BILLING.SUBSCRIPTIONS.BOOK_APPOINTMENT(subscriptionId, appointmentId),
      { method: 'POST' }
    );
    return { success: true, message: (data as { message?: string })?.message || 'Appointment linked to subscription' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to link appointment to subscription' };
  }
}

export async function checkSubscriptionCoverage(
  subscriptionId: string,
  appointmentType: 'IN_PERSON' | 'VIDEO_CALL' | 'HOME_VISIT'
): Promise<{
  success: boolean;
  coverage?: {
    covered?: boolean;
    allowed?: boolean;
    requiresPayment?: boolean;
    paymentAmount?: number | null;
    message?: string;
    reason?: string;
  };
  error?: string;
}> {
  try {
    const endpoint =
      `${API_ENDPOINTS.BILLING.SUBSCRIPTIONS.CHECK_COVERAGE(subscriptionId)}?` +
      `appointmentType=${encodeURIComponent(appointmentType)}&detailed=true`;
    const { data } = await authenticatedApi(endpoint);
    return { success: true, coverage: data as any };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check subscription coverage',
    };
  }
}

export async function createInPersonAppointmentWithSubscription(data: {
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
}): Promise<{ success: boolean; appointment?: any; error?: string }> {
  try {
    const { subscriptionId, ...payload } = data;
    const { data: response } = await authenticatedApi(
      API_ENDPOINTS.BILLING.SUBSCRIPTIONS.BOOK_INPERSON(subscriptionId),
      {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          type: 'IN_PERSON',
        }),
      }
    );
    return { success: true, appointment: (response as any)?.appointment || response };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create in-person appointment with subscription',
    };
  }
}

// ============ Analytics ============

export async function getBillingAnalytics(_clinicId: string): Promise<{
  success: boolean;
  analytics?: BillingAnalytics;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.ANALYTICS.REVENUE);
    return { success: true, analytics: data as BillingAnalytics };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch billing analytics' };
  }
}
