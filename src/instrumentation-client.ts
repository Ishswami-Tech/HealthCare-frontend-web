/**
 * Client-side instrumentation for Sentry.
 *
 * Re-exports from the root sentry.client.config.ts which is auto-loaded by
 * @sentry/nextjs. This file exists as a compatibility shim for any code that
 * imports onRouterTransitionStart from here.
 */

// Must stay the first import: zod reads `jitless` when schemas are constructed (see zod-config).
import "./lib/zod-config";

export { onRouterTransitionStart } from "../sentry.client.config";
