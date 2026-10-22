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
import { ERROR_MESSAGES } from "@/lib/config/config";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { isSessionInvalidError, triggerClientAuthRecovery } from "@/lib/utils/auth-recovery";
import { dedupeRequest, hasInflightRequest } from "./requestDeduper";


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
  /**
   * refetchType passed to each invalidateQueries() call. Defaults to
   * React Query's own default ('active') to preserve existing behavior for
   * every caller of this shared hook. Pass 'none' when invalidating a large
   * number of query-key families (e.g. appointment mutations invalidating
   * ~27 families at once) so mounted-but-currently-inactive queries don't
   * all refetch simultaneously - they'll still refetch on next use since
   * they're marked stale, just not all at once on this mutation.
   */
  invalidateRefetchType?: "active" | "inactive" | "all" | "none";
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
    invalidateRefetchType,
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
  const wrappedMutationFn = useCallback(
    (variables: TVariables) =>
      dedupeRequest("mutation", [toastId, variables], () => mutationFn(variables)),
    [mutationFn, toastId]
  );

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn: wrappedMutationFn,
    onSuccess: async (data, variables) => {
      // ✅ Invalidate queries
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClientRef.current.invalidateQueries({
              queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
              exact: false,
              ...(invalidateRefetchType ? { refetchType: invalidateRefetchType } : {}),
            })
          )
        );
      }

      // ✅ The success toast reuses the loading toast's id, so Sonner turns the loading toast into
      // it in place. Dismissing first would race the update: Sonner applies the dismiss a frame
      // later and deletes the new toast too (the toast "vanished"). Only clear the loading toast
      // when no success toast follows.
      if (showToast) {
        showSuccessToast(successMessage, { id: toastId });
      } else if (showLoading) {
        dismissToast(toastId);
      }

      // ✅ Call success callback
      if (onSuccess) {
        await onSuccess(data, variables);
      }
    },
    onError: (error, variables) => {
      // ✅ Consistent error handling. The error toast replaces the loading toast in place (same
      // id); see onSuccess for why it is not dismissed first.
      const sanitizedError = sanitizeErrorMessage(error);
      const finalErrorMessage =
        sanitizedError && sanitizedError.trim().length > 0
          ? sanitizedError
          : errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR;

      if (isSessionInvalidError(error)) {
        if (showLoading || showToast) {
          dismissToast(toastId);
        }
        triggerClientAuthRecovery();
        return;
      }

      if (showToast) {
        showErrorToast(finalErrorMessage, {
          id: toastId,
        });
      } else if (showLoading) {
        dismissToast(toastId);
      }

      // ✅ Call error callback
      if (onError) {
        onError(error, variables);
      }
    },
    ...mutationOptions,
  });

  /**
   * ✅ Wrapper for mutate that shows loading toast
   */
  const mutate = useCallback(
    (variables: TVariables, customOptions?: any) => {
      const requestKey = [toastId, variables];
      if (showLoading && !hasInflightRequest("mutation-operation", requestKey)) {
        showLoadingToast(loadingMessage, toastId);
      }
      // Fire-and-forget: onError already reports the failure, so the rejection is consumed here
      // instead of surfacing as an unhandled promise rejection (an unhandled ApiError).
      dedupeRequest("mutation-operation", requestKey, () =>
        mutation.mutateAsync(variables, customOptions)
      ).catch(() => undefined);
      return undefined;
    },
    [mutation, loadingMessage, toastId, showLoading]
  );

  /**
   * ✅ Wrapper for mutateAsync that shows loading toast
   */
  const mutateAsync = useCallback(
    async (variables: TVariables, customOptions?: any) => {
      const requestKey = [toastId, variables];
      if (showLoading && !hasInflightRequest("mutation-operation", requestKey)) {
        showLoadingToast(loadingMessage, toastId);
      }
      try {
        const result = await dedupeRequest(
          "mutation-operation",
          requestKey,
          () => mutation.mutateAsync(variables, customOptions)
        );
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
