/**
 * Client-side instrumentation for Sentry.
 *
 * Re-exports from the root sentry.client.config.ts which is auto-loaded by
 * @sentry/nextjs. This file exists as a compatibility shim for any code that
 * imports onRouterTransitionStart from here.
 */

export { onRouterTransitionStart } from "../sentry.client.config";
