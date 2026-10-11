"use client";

import { useMutationOperation } from "../core/useMutationOperation";
import { deactivateMyAccount, type DeactivateAccountResult } from "@/lib/actions/account.server";

/**
 * Deactivates the signed-in user's own account (`POST /user/me/deactivate`).
 * The backend revokes every session; the caller then runs the normal log-out to clear this device.
 */
export const useDeactivateAccount = () =>
  useMutationOperation<DeactivateAccountResult, void>(
    async () => {
      const result = await deactivateMyAccount();
      if (!result.success) {
        throw new Error(result.error || "Failed to deactivate the account");
      }
      return result.data;
    },
    {
      toastId: "account-deactivate",
      loadingMessage: "Deactivating your account...",
      successMessage: "Your account has been deactivated",
      errorMessage: "We could not deactivate your account. Please try again.",
    },
  );
