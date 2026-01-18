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

// ============ Billing Plans ============

export async function getBillingPlans(clinicId?: string): Promise<{
  success: boolean;
  plans?: BillingPlan[];
  error?: string;
}> {
  try {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const { data } = await authenticatedApi(`${API_ENDPOINTS.BILLING.PLANS.GET_ALL}${params}`);
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
  _clinicId: string
): Promise<{
  success: boolean;
  subscription?: Subscription;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.BILLING.SUBSCRIPTIONS.GET_ACTIVE(userId));
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

// ✅ Validation Schemas
const createInvoiceSchema = z.object({
  userId: z.string().uuid(),
  clinicId: z.string().uuid().or(z.string().regex(/^CL\d+$/)),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().positive(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  description: z.string().optional(),
  lineItems: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  clinicId: z.string().uuid().or(z.string().regex(/^CL\d+$/)),
  appointmentId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  method: z.enum(['CASH', 'CARD', 'UPI', 'NET_BANKING', 'INSURANCE']).optional(),
  transactionId: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

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
  provider: 'razorpay' | 'phonepe'
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
  provider: 'razorpay' | 'phonepe'
): Promise<{
  success: boolean;
  invoice?: any;
  paymentIntent?: any;
  message?: string;
  error?: string;
}> {
  try {
    const { data } = await authenticatedApi(`${API_ENDPOINTS.APPOINTMENTS.BASE}/${appointmentId}/process-payment?provider=${provider}`, {
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
