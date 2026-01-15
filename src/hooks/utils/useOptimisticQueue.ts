/**
 * React 19 useOptimistic Hook for Queue Operations
 * Provides optimistic UI updates for queue mutations
 */

import { useCallback } from 'react';
import { useToast } from './use-toast';
import { updateQueueStatus, callNextPatient } from '@/lib/actions/queue.server';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for updating queue status with optimistic updates
 */
export function useOptimisticUpdateQueueStatus(clinicId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: useCallback(async ({ patientId, status }: { patientId: string; status: string }) => {
      const result = await updateQueueStatus(patientId, status) as { success: boolean; error?: string; data?: unknown };
      if (!result.success) {
        throw new Error(result.error || 'Failed to update queue status');
      }
      return result;
    }, []),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['queue', clinicId] });
      const previous = queryClient.getQueryData(['queue', clinicId]);
      queryClient.setQueryData(['queue', clinicId], (old: any) => {
        if (!old) return old;
        return old.map((item: any) =>
          item.patientId === variables.patientId
            ? { ...item, status: variables.status, updatedAt: new Date().toISOString() }
            : item
        );
      });
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue', clinicId], context.previous);
      }
      toast({
        title: 'Error',
        description: 'Failed to update queue status',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Queue status updated successfully',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', clinicId] });
    },
  });
}

/**
 * Hook for calling next patient with optimistic updates
 */
export function useOptimisticCallNextPatient(clinicId?: string, queueType: string = 'general') {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: useCallback(async () => {
      const result = await callNextPatient(queueType) as { success: boolean; error?: string; data?: unknown };
      if (!result.success) {
        throw new Error(result.error || 'Failed to call next patient');
      }
      return result;
    }, [queueType]),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['queue', clinicId] });
      const previous = queryClient.getQueryData(['queue', clinicId]);
      queryClient.setQueryData(['queue', clinicId], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.slice(1);
      });
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['queue', clinicId], context.previous);
      }
      toast({
        title: 'Error',
        description: 'Failed to call next patient',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Next patient called',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', clinicId] });
    },
  });
}

