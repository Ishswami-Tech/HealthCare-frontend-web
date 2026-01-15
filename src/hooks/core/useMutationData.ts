import { MutationKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// ✅ Import query configuration for default options
import { queryClientConfig } from '../query/config';

interface ApiResponse<T> {
  status: number;
  data: T;
}

/**
 * useMutationData Hook
 * Purpose: A wrapper around TanStack Query's useMutation hook to standardize mutation handling
 * Uses centralized query configuration for consistent behavior
 * 
 * @param mutationKey - Unique identifier for the mutation
 * @param mutationFn - Function that performs the mutation
 * @param queryKey - Optional query key to invalidate on success
 * @param onSuccess - Optional success callback
 * 
 * Returns: mutate function and isPending state
 */
export const useMutationData = <TData = unknown, TVariables = unknown>(
  mutationKey: MutationKey,
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  queryKey?: string | string[],
  onSuccess?: (data: ApiResponse<TData>) => void
) => {
  const client = useQueryClient();
  
  // ✅ Merge with default mutation config for consistent behavior
  const defaultOptions = queryClientConfig.defaultOptions?.mutations || {};

  const { mutate, isPending } = useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationKey,
    mutationFn: mutationFn as any,
    ...defaultOptions,
    onSuccess(data: ApiResponse<TData>) {
      if (onSuccess) {
        onSuccess(data);
      } else {
        // Only show automatic toast if no custom success handler is provided
        toast(data.status === 200 ? 'Success' : 'Error', {
          description: typeof data.data === 'object' ? 'Operation completed successfully' : String(data.data),
        });
      }
    },
    onSettled: async () => {
      if (queryKey) {
        const key = Array.isArray(queryKey) ? queryKey : [queryKey];
        return await client.invalidateQueries({ queryKey: key });
      }
    },
  });

  return { mutate, isPending };
};