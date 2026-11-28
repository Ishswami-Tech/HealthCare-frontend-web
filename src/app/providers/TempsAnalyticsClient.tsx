"use client";

import type { ReactNode } from "react";
import { TempsAnalyticsProvider } from "@temps-sdk/react-analytics";

/**
 * Temps analytics wrapper. Events go to the same-origin `/api/_temps` path that
 * the Temps platform proxy serves, so no CSP change or env value is needed.
 * Only mounted on images built for Temps (NEXT_PUBLIC_HOSTED_ON_TEMPS), since
 * other hosts do not serve `/api/_temps`.
 * The SDK no-ops on localhost/test environments (ignoreLocalhost defaults to
 * true) and when `localStorage.temps_ignore === "true"`. Session recording is
 * left off (SDK default) to keep PHI out of captured data.
 */
export function TempsAnalyticsClient({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_HOSTED_ON_TEMPS !== "true") {
    return <>{children}</>;
  }
  return (
    <TempsAnalyticsProvider basePath="/api/_temps">
      {children}
    </TempsAnalyticsProvider>
  );
}
