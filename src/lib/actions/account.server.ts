"use server";

import { authenticatedApi, getServerSession } from "./auth.server";

/**
 * Self-service account actions of the signed-in user.
 *
 * Backend: `UsersController` — `POST /user/me/deactivate`. Any signed-in role except SUPER_ADMIN
 * may call it for their own account. It is a soft delete: the account can no longer sign in and
 * every session is revoked, while clinical records are kept as the law requires. The user is
 * taken from the session, never from the request, so nothing is sent in the body.
 */

const DEACTIVATE_MY_ACCOUNT = "/user/me/deactivate";

export interface DeactivateAccountResult {
  success: boolean;
  message: string;
  /** ISO timestamp of the deactivation. */
  deactivatedAt: string;
}

async function requireSession(): Promise<void> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized: Authentication required");
  }
}

export async function deactivateMyAccount(): Promise<DeactivateAccountResult> {
  await requireSession();
  const { data } = await authenticatedApi<DeactivateAccountResult>(DEACTIVATE_MY_ACCOUNT, {
    method: "POST",
  });
  return data;
}
