/**
 * React 19 useOptimistic Hook Integration
 * Provides optimistic UI updates for mutations
 */

import { useOptimistic, useTransition, useMemo } from 'react';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

export interface OptimisticMutationOptions<TData, TVariables, TError = Error> {
  /**
   * Optimistic update function
   * Receives current state and new variables, returns optimistic state
   */
  optimisticUpdate: (current: TData[], variables: TVariables) => TData[];
  
  /**
   * Rollback function (optional)
   * Called if mutation fails to restore previous state
   */
  rollback?: (previous: TData[], error: TError) => TData[];
  
  /**
   * Query key to update optimistically
   */
  queryKey: (string | number | boolean | null | undefined)[];
  
  /**
   * Standard mutation options
   */
  mutationOptions?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>;
}

/**
 * Hook for optimistic mutations with React 19 useOptimistic
 * 
 * @example
 * ```tsx
 * const { optimisticData, addOptimistic, mutation } = useOptimisticMutation({
 *   queryKey: ['appointments', clinicId],
 *   optimisticUpdate: (current, newAppointment) => [...current, newAppointment],
 *   mutationFn: createAppointment,
 * });
 * ```
 */
export function useOptimisticMutation<TData, TVariables, TError = Error>(
  options: OptimisticMutationOptions<TData, TVariables, TError> & {
    mutationFn: (variables: TVariables) => Promise<TData>;
  }
) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  
  // ✅ OPTIMIZED: Memoize current data to prevent unnecessary re-renders
  // Get current data from query cache (updates when query data changes)
  const currentData = useMemo(
    () => queryClient.getQueryData<TData[]>(options.queryKey) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, JSON.stringify(options.queryKey)]
  );
  
  // Optimistic state with useOptimistic
  // React 19's useOptimistic automatically syncs with base state changes
  const [optimisticData, addOptimistic] = useOptimistic(
    currentData,
    (state: TData[], variables: TVariables) => {
      return options.optimisticUpdate(state, variables);
    }
  );
  
  // Mutation with optimistic updates
  const mutation = useMutation({
    mutationFn: options.mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData<TData[]>(options.queryKey) || [];
      
      // Optimistically update
      startTransition(() => {
        addOptimistic(variables);
      });
      
      // Update query cache optimistically
      queryClient.setQueryData<TData[]>(options.queryKey, (old = []) => 
        options.optimisticUpdate(old, variables)
      );
      
      return { previous };
    },
    onError: (error: TError, _variables: TVariables, context) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previous' in context && context.previous) {
        queryClient.setQueryData(options.queryKey, context.previous);
      } else if (options.rollback) {
        const current = queryClient.getQueryData<TData[]>(options.queryKey) || [];
        queryClient.setQueryData(options.queryKey, options.rollback(current, error));
      }
    },
    onSuccess: (data: TData) => {
      // Update with real data on success
      queryClient.setQueryData<TData[]>(options.queryKey, (old = []) => {
        // Replace optimistic entry with real data
        const index = old.findIndex((item: any) => 
          (item as any).id === (data as any).id || 
          (item as any).tempId
        );
        if (index >= 0) {
          const updated = [...old];
          updated[index] = data;
          return updated;
        }
        return [...old, data];
      });
      
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: options.queryKey, exact: false });
    },
    ...options.mutationOptions,
  });
  
  return {
    optimisticData,
    addOptimistic,
    mutation,
    isPending: isPending || mutation.isPending,
  };
}

/**
 * Simplified hook for adding items optimistically
 */
export function useOptimisticAdd<TData extends { id: string }, TVariables>(
  queryKey: (string | number | boolean | null | undefined)[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  createOptimisticItem: (variables: TVariables) => TData,
  options?: Omit<UseMutationOptions<TData, Error, TVariables, { previous: TData[] }>, 'mutationFn'>
) {
  return useOptimisticMutation<TData, TVariables, Error>({
    queryKey,
    mutationFn,
    optimisticUpdate: (current, variables) => {
      const optimisticItem = {
        ...createOptimisticItem(variables),
        id: `temp-${Date.now()}`,
        tempId: true,
      };
      return [...current, optimisticItem as TData];
    },
    ...(options && { 
      mutationOptions: options as Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'>
    }),
  });
}

/**
 * Simplified hook for updating items optimistically
 */
export function useOptimisticUpdate<TData extends { id: string }, TVariables extends { id: string }>(
  queryKey: (string | number | boolean | null | undefined)[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables, { previous: TData[] }>, 'mutationFn'>
) {
  return useOptimisticMutation<TData, TVariables, Error>({
    queryKey,
    mutationFn,
    optimisticUpdate: (current, variables) => {
      return current.map((item) =>
        (item as TData & { id: string }).id === variables.id ? { ...item, ...variables } : item
      ) as TData[];
    },
    ...(options && { mutationOptions: options as Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'> }),
  });
}

/**
 * Simplified hook for deleting items optimistically
 */
export function useOptimisticDelete<TData extends { id: string }, TVariables extends { id: string }>(
  queryKey: (string | number | boolean | null | undefined)[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables, { previous: TData[] }>, 'mutationFn'>
) {
  return useOptimisticMutation<TData, TVariables, Error>({
    queryKey,
    mutationFn,
    optimisticUpdate: (current, variables) => {
      return current.filter((item) => (item as TData & { id: string }).id !== variables.id) as TData[];
    },
    ...(options && { mutationOptions: options as Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'> }),
  });
}
