"use server";

import { authenticatedApi } from "./auth.server";
import { actionSuccess, caughtFailure, requireSession, statusFailure, type ActionResult } from "./_shared";
import { API_ENDPOINTS } from "../config/config";

/**
 * Self-service account actions of the signed-in user.
 *
 * Backend: `UsersController` — `POST /user/me/deactivate`. Any signed-in role except SUPER_ADMIN
 * may call it for their own account. It is a soft delete: the account can no longer sign in and
 * every session is revoked, while clinical records are kept as the law requires. The user is
 * taken from the session, never from the request, so nothing is sent in the body.
 */

export interface DeactivateAccountResult {
  success: boolean;
  message: string;
  /** ISO timestamp of the deactivation. */
  deactivatedAt: string;
}

export async function deactivateMyAccount(): Promise<ActionResult<DeactivateAccountResult>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;

    const { status, data } = await authenticatedApi<DeactivateAccountResult>(API_ENDPOINTS.USERS.DEACTIVATE_ME, {
      method: "POST",
      // The API client always sends `Content-Type: application/json`, and the backend (Fastify)
      // answers 400 "Body cannot be empty" to a JSON request without a body. The route reads no body.
      body: JSON.stringify({}),
    });
    return statusFailure(status, "Account deactivation") ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}
