/**
 * ✅ Unified Mutation Operation Hook
 * Follows SOLID, DRY, KISS principles
 * Centralizes common mutation patterns: loading, error handling, toast, cache invalidation
 * Single Responsibility: Handle mutation operations with consistent patterns
 * Open/Closed: Extensible for different mutation operations
 * Dependency Inversion: Uses abstractions (toast, query client) not implementations
 */

"use client";

import { useCallback, useRef } from "react";
import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import {
  showLoadingToast,
  showSuccessToast,
  showErrorToast,
  dismissToast,
} from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";


export interface MutationOperationOptions<TData, TVariables, TError = Error> {
  /** Toast ID for this operation */
  toastId: string;
  /** Loading message */
  loadingMessage: string;
  /** Success message */
  successMessage: string;
  /** Error message fallback */
  errorMessage?: string;
  /** Query keys to invalidate on success */
  invalidateQueries?: (string | string[])[];
  /** Callback on success */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  /** Callback on error */
  onError?: (error: TError, variables: TVariables) => void;
  /** Whether to show toast */
  showToast?: boolean;
  /** Whether to show loading toast */
  showLoading?: boolean;
  /** Additional mutation options */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    "mutationFn" | "onSuccess" | "onError"
  >;
}

/**
 * ✅ Unified Mutation Operation Hook
 * Provides consistent loading, error handling, toast, and cache invalidation
 * 
 * @example
 * ```typescript
 * const { mutate, mutateAsync, isPending } = useMutationOperation({
 *   mutationFn: createPatient,
 *   toastId: TOAST_IDS.PATIENT.CREATE,
 *   loadingMessage: "Creating patient...",
 *   successMessage: "Patient created successfully!",
 *   invalidateQueries: [["patients", clinicId]],
 * });
 * ```
 */
export function useMutationOperation<TData, TVariables, TError = Error>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: MutationOperationOptions<TData, TVariables, TError>
) {
  const queryClient = useQueryClient();
  const {
    toastId,
    loadingMessage,
    successMessage,
    errorMessage,
    invalidateQueries = [],
    onSuccess,
    onError,
    showToast = true,
    showLoading = true,
    mutationOptions,
  } = options;

  // ✅ Use refs to avoid dependency issues
  const queryClientRef = useRef(queryClient);
  queryClientRef.current = queryClient;

  /**
   * ✅ Execute mutation with consistent error handling
   * Follows DRY - single implementation for all mutation operations
   */
  const handleSuccess = useCallback(
    (data: TData, variables: TVariables) => {
      // ✅ Invalidate queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach((queryKey) => {
          queryClientRef.current.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        });
      }

      // ✅ Handle success toast
      if (showToast) {
        dismissToast(toastId);
        showSuccessToast(successMessage, { id: toastId });
      }

      // ✅ Call success callback
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    [toastId, successMessage, invalidateQueries, showToast, onSuccess]
  );

  const handleError = useCallback(
    (error: TError, variables: TVariables) => {
      // ✅ Consistent error handling
      if (showToast) {
        dismissToast(toastId);
      }

      sanitizeErrorMessage(error);
      // const finalErrorMessage =
      //   errorMessage || sanitizedError || ERROR_MESSAGES.UNKNOWN_ERROR;

      if (showToast) {
        showErrorToast(error, {
          id: toastId,
        });
      }

      // ✅ Call error callback
      if (onError) {
        onError(error, variables);
      }
    },
    [toastId, errorMessage, showToast, onError]
  );

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: handleSuccess,
    onError: handleError,
    ...mutationOptions,
  });

  /**
   * ✅ Wrapper for mutate that shows loading toast
   */
  const mutate = useCallback(
    (variables: TVariables, customOptions?: any) => {
      if (showLoading) {
        showLoadingToast(loadingMessage, toastId);
      }
      return mutation.mutate(variables, customOptions);
    },
    [mutation, loadingMessage, toastId, showLoading]
  );

  /**
   * ✅ Wrapper for mutateAsync that shows loading toast
   */
  const mutateAsync = useCallback(
    async (variables: TVariables, customOptions?: any) => {
      if (showLoading) {
        showLoadingToast(loadingMessage, toastId);
      }
      try {
        const result = await mutation.mutateAsync(variables, customOptions);
        return result;
      } catch (error) {
        // Error is handled by onError
        throw error;
      }
    },
    [mutation, loadingMessage, toastId, showLoading]
  );

  return {
    ...mutation,
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
  };
}
