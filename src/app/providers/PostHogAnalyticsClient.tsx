"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { APP_CONFIG } from "@/lib/config/config";
import { sanitizeAnalyticsEvent } from "@/lib/analytics/posthog-privacy";
import { useUser } from "@/stores/app.store";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
// Must match the CSP connect-src, which is built from the same variable (src/lib/config/csp.ts).
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

/**
 * PostHog product analytics with PHI-safe defaults. A no-op unless NEXT_PUBLIC_POSTHOG_KEY and
 * NEXT_PUBLIC_POSTHOG_HOST are set and NEXT_PUBLIC_ENABLE_ANALYTICS is true.
 *
 * - Memory-only persistence: no cookies or localStorage, so the essential-cookies banner stays
 *   accurate.
 * - No autocapture, session recording, surveys, heatmaps or remote scripts; only page views
 *   (sent here, on route change) and explicit `posthog.capture` calls.
 * - Every URL/path/referrer property is reduced to origin + path with ids replaced by `:id`
 *   (`sanitizeAnalyticsEvent`).
 * - Signed-in users are identified by their user UUID plus role and clinic id; never name,
 *   phone or email.
 */
export function PostHogAnalyticsClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useUser();
  const [ready, setReady] = useState(false);
  const identifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (!POSTHOG_KEY || !POSTHOG_HOST || !APP_CONFIG.FEATURES.ANALYTICS) {
      return;
    }
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: "memory",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      capture_performance: false,
      capture_exceptions: false,
      rageclick: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_product_tours: true,
      disable_conversations: true,
      disable_web_experiments: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
      mask_all_text: true,
      mask_all_element_attributes: true,
      person_profiles: "identified_only",
      before_send: sanitizeAnalyticsEvent,
    });
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && pathname) {
      posthog.capture("$pageview", { $current_url: window.location.href });
    }
  }, [ready, pathname]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (user?.id && identifiedId.current !== user.id) {
      posthog.identify(user.id, {
        role: user.role,
        clinic_id: user.clinicId ?? null,
      });
      identifiedId.current = user.id;
    } else if (!user && identifiedId.current) {
      posthog.reset();
      identifiedId.current = null;
    }
  }, [ready, user]);

  return <>{children}</>;
}
