/**
 * ✅ Unified Loading State Hook
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for loading states
 * Replaces 260+ instances of isLoading/isPending patterns
 */

"use client";

import { useState, useCallback, useMemo } from 'react';

export interface LoadingState {
  isLoading: (key: string) => boolean;
  setLoading: (key: string, value: boolean) => void;
  loadingKeys: string[];
  hasAnyLoading: boolean;
  clearAll: () => void;
}

/**
 * ✅ Unified Loading State Hook
 * Manages multiple loading states with a single hook
 * 
 * @example
 * ```tsx
 * const { isLoading, setLoading } = useLoadingState();
 * 
 * const handleSubmit = async () => {
 *   setLoading('submit', true);
 *   try {
 *     await submitForm();
 *   } finally {
 *     setLoading('submit', false);
 *   }
 * };
 * 
 * return <Button disabled={isLoading('submit')}>Submit</Button>;
 * ```
 */
export function useLoadingState(): LoadingState {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const isLoading = useCallback((key: string): boolean => {
    return loadingStates[key] || false;
  }, [loadingStates]);
  
  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingStates(prev => {
      if (prev[key] === value) return prev; // No change
      return { ...prev, [key]: value };
    });
  }, []);
  
  const loadingKeys = useMemo(() => {
    return Object.keys(loadingStates).filter(key => loadingStates[key]);
  }, [loadingStates]);
  
  const hasAnyLoading = useMemo(() => {
    return loadingKeys.length > 0;
  }, [loadingKeys]);
  
  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);
  
  return {
    isLoading,
    setLoading,
    loadingKeys,
    hasAnyLoading,
    clearAll,
  };
}

/**
 * ✅ Single Loading State Hook
 * For simple single loading state management
 * 
 * @example
 * ```tsx
 * const { isLoading, setLoading } = useSingleLoadingState();
 * 
 * const handleSubmit = async () => {
 *   setLoading(true);
 *   try {
 *     await submitForm();
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * ```
 */
export function useSingleLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  
  return {
    isLoading,
    setLoading: setIsLoading,
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
  };
}

/**
 * ✅ Async Operation Hook
 * Wraps async operations with loading state
 * 
 * @example
 * ```tsx
 * const { execute, isLoading, error } = useAsyncOperation(async () => {
 *   return await fetchData();
 * });
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export function useAsyncOperation<T, TError = Error>(
  operation: () => Promise<T>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TError | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err as TError;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [operation]);
  
  return {
    execute,
    isLoading,
    error,
    data,
    reset: () => {
      setError(null);
      setData(null);
      setIsLoading(false);
    },
  };
}
