"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";

/**
 * Deployment skew: a tab that was loaded from an older build keeps calling server actions by the
 * IDs that build had. After a deploy the server no longer knows those IDs and answers every call
 * with "Server Action ... was not found on the server" — polling queries then fail every 30 s
 * until the user reloads. One full reload loads the current build and fixes it.
 */

const RELOAD_GUARD_KEY = "hc:stale-deployment-reload-at";
/** At most one automatic reload per tab in this window, so a broken deploy can't cause a loop. */
const RELOAD_GUARD_MS = 5 * 60 * 1000;

// Next's own message when it raises UnrecognizedActionError. Matching it too covers hooks that
// catch the error and rethrow `new Error(error.message)`.
const STALE_ACTION_MESSAGE = /Server Action "[^"]*" was not found on the server/;

export function isStaleServerActionError(error: unknown): boolean {
  if (unstable_isUnrecognizedActionError(error)) {
    return true;
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return STALE_ACTION_MESSAGE.test(message);
}

/**
 * Reloads the page once when `error` shows this tab runs an older build than the server.
 * Returns true when the error is a stale-action error (reload started or already done recently),
 * so callers can skip their usual error toast or retry for it.
 */
export function reloadIfStaleDeployment(error: unknown): boolean {
  if (typeof window === "undefined" || !isStaleServerActionError(error)) {
    return false;
  }

  try {
    const lastReloadAt = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - lastReloadAt < RELOAD_GUARD_MS) {
      return true;
    }
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // sessionStorage can be unavailable (privacy mode); reloading once is still the right fix.
  }

  window.location.reload();
  return true;
}
