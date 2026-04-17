import {
  UseQueryOptions,
  QueryKey,
  useQuery,
} from "@tanstack/react-query";
// ✅ Import query configuration for default options
import { queryClientConfig } from '../query/config';

/**
 * useQueryData Hook
 * Purpose: A wrapper around TanStack Query's useQuery hook to standardize query handling
 * Uses centralized query configuration for consistent behavior
 * 
 * @param queryKey - Unique identifier for the query (used for caching)
 * @param queryFn - Function that performs the actual data fetching
 * @param options - Optional useQuery options (merged with default config)
 * 
 * Returns: Commonly used query states and the refetch function
 */
export interface UseQueryDataReturn<TData, TError = Error> {
  data: TData | undefined;
  isPending: boolean;
  isFetched: boolean;
  isFetching: boolean;
  error: TError | null;
  refetch: (options?: { throwOnError?: boolean; cancelRefetch?: boolean }) => Promise<any>;
}

export const useQueryData = <
  TData = unknown,
  TError = Error
>(
  queryKey: QueryKey,
  queryFn: (() => Promise<TData>) | (() => TData),
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
): UseQueryDataReturn<TData, TError> => {
  // ✅ Merge with default query config for consistent behavior
  const defaultOptions = queryClientConfig.defaultOptions?.queries || {};
  
  const { 
    data,       // The query result data
    isPending,  // True if the query is in a pending state (loading first time)
    isFetched,  // True if the query has been fetched at least once
    isFetching, // True if the query is currently fetching (including background updates)
    error,      // Error object if query failed
    refetch     // Function to manually trigger a refetch
  } = useQuery<TData, TError>({
    queryKey,
    queryFn: queryFn as any,
    ...defaultOptions,
    ...options, // User options override defaults
  } as any);

  return { 
    data,       // The fetched data
    isPending,  // Loading state for first fetch (React Query v5)
    isFetched,  // Whether data has been fetched
    isFetching, // Current loading state
    error,      // Error object if query failed
    refetch     // Manual refetch trigger
  };
};
