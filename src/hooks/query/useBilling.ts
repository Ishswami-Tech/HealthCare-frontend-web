// Billing Hooks
// Integrated with real API - using Docker backend

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  return useQuery({
    queryKey: ['billing-plans', clinicId],
    queryFn: async () => {
      const result = await getBillingPlans(clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch billing plans');
      }
      return result.plans || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // 5 minutes
  });
}

export function useBillingPlan(id: string) {
  return useQuery({
    queryKey: ['billing-plan', id],
    queryFn: async () => {
      const result = await getBillingPlan(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch billing plan');
      }
      return result.plan;
    },
    enabled: !!id,
  });
}

export function useCreateBillingPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateBillingPlanData) => {
      const result = await createBillingPlan(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create billing plan');
      }
      return result.plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });
}

export function useUpdateBillingPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateBillingPlanData> }) => {
      const result = await updateBillingPlan(id, data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update billing plan');
      }
      return result.plan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['billing-plan', variables.id] });
    },
  });
}

export function useDeleteBillingPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBillingPlan(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete billing plan');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
    },
  });
}

// ============ Subscriptions Hooks ============

export function useSubscriptions(userId: string) {
  return useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: async () => {
      const result = await getSubscriptions(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch subscriptions');
      }
      return result.subscriptions || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useActiveSubscription(userId: string, clinicId: string) {
  return useQuery({
    queryKey: ['active-subscription', userId, clinicId],
    queryFn: async () => {
      const result = await getActiveSubscription(userId, clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch active subscription');
      }
      return result.subscription;
    },
    enabled: !!userId && !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutes (optimized for 10M users)
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSubscriptionData) => {
      const result = await createSubscription(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create subscription');
      }
      return result.subscription;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['active-subscription', variables.userId, variables.clinicId] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, immediate }: { id: string; immediate?: boolean }) => {
      const result = await cancelSubscription(id, immediate);
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }
      return result.subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['active-subscription'] });
    },
  });
}

export function useSubscriptionUsageStats(id: string) {
  return useQuery({
    queryKey: ['subscription-usage', id],
    queryFn: async () => {
      const result = await getSubscriptionUsageStats(id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage stats');
      }
      return result.stats;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (optimized for 10M users)
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// ============ Invoices Hooks ============

export function useInvoices(userId: string) {
  return useQuery({
    queryKey: ['invoices', userId],
    queryFn: async () => {
      const result = await getInvoices(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch invoices');
      }
      return result.invoices || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const result = await createInvoice(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }
      return result.invoice;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.userId] });
    },
  });
}

// ============ Payments Hooks ============

export function usePayments(userId: string) {
  return useQuery({
    queryKey: ['payments', userId],
    queryFn: async () => {
      const result = await getPayments(userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments');
      }
      return result.payments || [];
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes (optimized for 10M users)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const result = await createPayment(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }
      return result.payment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.userId] });
    },
  });
}

// ============ Analytics Hooks ============

export function useBillingAnalytics(clinicId: string) {
  return useQuery({
    queryKey: ['billing-analytics', clinicId],
    queryFn: async () => {
      const result = await getBillingAnalytics(clinicId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
      return result.analytics;
    },
    enabled: !!clinicId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

