"use client";

import type { ReactNode } from "react";
import { TempsAnalyticsProvider } from "@temps-sdk/react-analytics";

/**
 * Temps analytics wrapper. Events go to the same-origin `/api/_temps` path that
 * the Temps platform proxy serves, so no CSP change or env value is needed.
 * The SDK no-ops on localhost/test environments (ignoreLocalhost defaults to
 * true) and when `localStorage.temps_ignore === "true"`. Session recording is
 * left off (SDK default) to keep PHI out of captured data.
 */
export function TempsAnalyticsClient({ children }: { children: ReactNode }) {
  return (
    <TempsAnalyticsProvider basePath="/api/_temps">
      {children}
    </TempsAnalyticsProvider>
  );
}
