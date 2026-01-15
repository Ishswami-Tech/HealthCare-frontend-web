// Billing Server Actions
// Integrated with backend billing API

'use server';

import { authenticatedApi } from './auth.server';
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
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.INVOICES.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, invoice: response as Invoice };
  } catch (error) {
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
    const { data: response } = await authenticatedApi(API_ENDPOINTS.BILLING.PAYMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return { success: true, payment: response as Payment };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create payment' };
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
