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
  CreateBillingPlanData,
  CreateSubscriptionData,
  CreateInvoiceData,
  CreatePaymentData,
} from '@/types/billing.types';
import { createInvoiceSchema, createPaymentSchema } from '@/lib/schema/billing.schema';

// ============ Billing Plans ============

// 🔒 TENANT ISOLATION: clinicId is auto-provided via X-Clinic-ID header by authenticatedApi.
// The backend ClinicGuard uses the header, not query params, for tenant scoping.
export async function getBillingPlans(_clinicId?: string): Promise<{
  success: boolean;
  plans?: BillingPlan[];
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.GET_ALL);
    return { success: true, plans: Array.isArray(data) ? data : [] };
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
    return { success: true, plan: data as BillingPlan };
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
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, plan: response as BillingPlan };
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
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PLANS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return { success: true, plan: response as BillingPlan };
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
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_USER_SUBSCRIPTIONS(userId));
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
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.GET_USER_INVOICES(userId));
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
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.PAYMENTS.GET_USER_PAYMENTS(userId));
    return { success: true, payments: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch payments' };
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
  provider: 'razorpay' | 'cashfree' | 'phonepe'
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
  provider: 'razorpay' | 'cashfree' | 'phonepe'
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
