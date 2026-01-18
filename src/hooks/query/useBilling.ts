// Billing Hooks
// Integrated with real API - using Docker backend

import { useQueryData, useMutationOperation } from '../core';
import {
  getBillingPlans,
  getBillingPlan,
  createBillingPlan,
  updateBillingPlan,
  deleteBillingPlan,
  getSubscriptions,
  getActiveSubscription,
  createSubscription,
  cancelSubscription,
  getSubscriptionUsageStats,
  getInvoices,
  createInvoice,
  getPayments,
  createPayment,
  getBillingAnalytics,
} from '@/lib/actions/billing.server';
import type {
  CreateBillingPlanData,
  CreateSubscriptionData,
  CreateInvoiceData,
  CreatePaymentData,
} from '@/types/billing.types';

// ============ Billing Plans Hooks ============

export function useBillingPlans(clinicId?: string) {
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

export function useSubscriptions(userId: string) {
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
      enabled: !!userId,
      staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    }
  );
}

export function useActiveSubscription(userId: string, clinicId: string) {
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
      enabled: !!userId && !!clinicId,
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

export function useCreateInvoice() {
  return useMutationOperation(
    async (data: CreateInvoiceData) => {
      const result = await createInvoice(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }
      return result.invoice;
    },
    {
      toastId: 'invoice-create',
      loadingMessage: 'Creating invoice...',
      successMessage: 'Invoice created successfully',
      invalidateQueries: [['invoices']],
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
      successMessage: 'Payment processed successfully',
      invalidateQueries: [['payments'], ['invoices']],
    }
  );
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

