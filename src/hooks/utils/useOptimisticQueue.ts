/**
 * React 19 useOptimistic Hook for Queue Operations
 * Provides optimistic UI updates for queue mutations
 */

import { useCallback } from 'react';
import { useOptimisticMutation, useQueryClient } from '@/hooks/core';
import { updateQueueStatus, callNextPatient } from '@/lib/actions/queue.server';

/**
 * Hook for updating queue status with optimistic updates
 */
export function useOptimisticUpdateQueueStatus(clinicId?: string) {
  const queryClient = useQueryClient();
  
  return useOptimisticMutation<any, { patientId: string; status: string }>({
    queryKey: ['queue', clinicId],
    mutationFn: useCallback(async ({ patientId, status }: { patientId: string; status: string }) => {
      const result = await updateQueueStatus(patientId, status) as { success: boolean; error?: string; data?: unknown };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update queue status');
      }
      return result.data as any;
    }, []),
    optimisticUpdate: (current, variables) => {
      if (!current) return current;
      return current.map((item: any) =>
        item.patientId === variables.patientId
          ? { ...item, status: variables.status, updatedAt: new Date().toISOString() }
          : item
      );
    },
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['queue', clinicId] });
      },
    },
  });
}

/**
 * Hook for calling next patient with optimistic updates
 */
export function useOptimisticCallNextPatient(clinicId?: string, queueType: string = 'general') {
  const queryClient = useQueryClient();
  
  return useOptimisticMutation<any, void>({
    queryKey: ['queue', clinicId],
    mutationFn: useCallback(async () => {
      const result = await callNextPatient(queueType) as { success: boolean; error?: string; data?: unknown };
      if (!result.success) {
        throw new Error(result.error || 'Failed to call next patient');
      }
      return result.data as any;
    }, [queueType]),
    optimisticUpdate: (current) => {
      if (!current || !Array.isArray(current)) return current;
      return current.slice(1);
    },
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['queue', clinicId] });
      },
    },
  });
}

