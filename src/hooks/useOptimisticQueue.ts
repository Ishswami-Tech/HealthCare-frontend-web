/**
 * React 19 useOptimistic Hook for Queue Operations
 * Provides optimistic UI updates for queue mutations
 */

import { useOptimisticMutation } from './useOptimisticMutation';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';
import { updateQueueStatus, callNextPatient, addToQueue, removeFromQueue } from '@/lib/actions/queue.server';

/**
 * Hook for updating queue status with optimistic updates
 */
export function useOptimisticUpdateQueueStatus(clinicId?: string) {
  const { toast } = useToast();
  
  return useOptimisticMutation({
    queryKey: ['queue', clinicId],
    mutationFn: useCallback(async ({ patientId, status }: { patientId: string; status: string }) => {
      const result = await updateQueueStatus({ patientId, status });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update queue status');
      }
      return result;
    }, []),
    optimisticUpdate: (current, variables) => {
      // Update the queue entry optimistically
      return current.map((item: any) =>
        item.patientId === variables.patientId
          ? { ...item, status: variables.status, updatedAt: new Date().toISOString() }
          : item
      ) as any[];
    },
    mutationOptions: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Queue status updated successfully',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update queue status',
          variant: 'destructive',
        });
      },
    },
  });
}

/**
 * Hook for calling next patient with optimistic updates
 */
export function useOptimisticCallNextPatient(clinicId?: string) {
  const { toast } = useToast();
  
  return useOptimisticMutation({
    queryKey: ['queue', clinicId],
    mutationFn: useCallback(async () => {
      const result = await callNextPatient();
      if (!result.success) {
        throw new Error(result.error || 'Failed to call next patient');
      }
      return result;
    }, []),
    optimisticUpdate: (current) => {
      // Remove the first patient from queue optimistically
      return current.slice(1);
    },
    mutationOptions: {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Next patient called',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to call next patient',
          variant: 'destructive',
        });
      },
    },
  });
}

