import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Temps traces: only register the OTLP exporter when the platform provides
    // a collector endpoint (standard OTel env var), otherwise stay a no-op.
    // No request/response bodies are captured by @vercel/otel.
    // Optional: a telemetry failure must never block app startup.
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      try {
        const { registerOTel } = await import("@vercel/otel");
        registerOTel({ serviceName: "healthcarefrontend-web" });
      } catch (error) {
        console.warn("[otel] tracing disabled:", error instanceof Error ? error.message : error);
      }
    }

    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
