"use client";

import { useMutationOperation } from "@/hooks/core/useMutationOperation";
import { deactivateMyAccount, type DeactivateAccountResult } from "@/lib/actions/account.server";

/**
 * Deactivates the signed-in patient's own account (`POST /user/me/deactivate`).
 * The backend revokes every session; the caller then runs the normal log-out to clear this device.
 */
export const useDeactivateAccount = () =>
  useMutationOperation<DeactivateAccountResult, void>(async () => deactivateMyAccount(), {
    toastId: "account-deactivate",
    loadingMessage: "Deactivating your account...",
    successMessage: "Your account has been deactivated",
    errorMessage: "We could not deactivate your account. Please try again.",
  });
