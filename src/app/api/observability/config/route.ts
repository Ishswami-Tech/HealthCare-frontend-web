export const dynamic = "force-dynamic";

/**
 * Browser error-tracking settings, read at request time from the runtime environment Temps injects
 * into every deployment (SENTRY_DSN, SENTRY_TUNNEL, SENTRY_RELEASE). One image serves both the
 * pre-prod and production environments, so these cannot be baked in at build time.
 *
 * Public by design: a Sentry DSN's public key only allows sending events. On hosts that do not
 * inject SENTRY_DSN (e.g. Vercel) every field is null and the browser keeps its build-time DSN.
 */
export function GET(): Response {
  const config = {
    sentryDsn: process.env.SENTRY_DSN?.trim() || null,
    sentryTunnel: process.env.SENTRY_TUNNEL?.trim() || null,
    sentryRelease: process.env.SENTRY_RELEASE?.trim() || null,
  };

  return Response.json(config, {
    headers: {
      // Same for every visitor of one deployment; a short cache keeps it off the hot path.
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
