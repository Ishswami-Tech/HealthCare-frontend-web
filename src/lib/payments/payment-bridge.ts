/**
 * Payment bridge helpers (pure, no React / no env access, so they are unit-testable).
 *
 * The bridge is an optional hand-off to a separately hosted payment page. It is used ONLY when
 * NEXT_PUBLIC_PAYMENT_BRIDGE_URL is set explicitly; otherwise the in-app checkout runs. It is
 * also never used when this app talks to a local backend but the bridge lives on a public host:
 * that bridge would open a local (sandbox) order against a deployed site and fail.
 */

export type CashfreeMode = "sandbox" | "production";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

/** Only these keys may travel to the bridge. Customer contact data (phone, email, name) never does. */
const FORBIDDEN_PAYLOAD_KEYS = [
  "phone",
  "email",
  "customerPhone",
  "customerEmail",
  "customerName",
  "customer_phone",
  "customer_email",
] as const;

function parseUrl(value: string): URL | null {
  const trimmed = value.trim().replace(/\/+$/u, "");
  if (!trimmed) {
    return null;
  }
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

export function isLocalHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  return LOCAL_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".test");
}

/**
 * Returns the bridge base URL to use, or "" when the in-app checkout must be used instead.
 * @param configuredBridgeUrl value of NEXT_PUBLIC_PAYMENT_BRIDGE_URL (no implicit default)
 * @param apiBaseUrl the backend base URL this build talks to
 */
export function resolvePaymentBridgeBaseUrl(
  configuredBridgeUrl: string | undefined,
  apiBaseUrl: string | undefined,
): string {
  const bridge = parseUrl(configuredBridgeUrl ?? "");
  if (!bridge || (bridge.protocol !== "https:" && bridge.protocol !== "http:")) {
    return "";
  }
  const api = parseUrl(apiBaseUrl ?? "");
  if (api && isLocalHostname(api.hostname) && !isLocalHostname(bridge.hostname)) {
    return "";
  }
  return bridge.toString().replace(/\/+$/u, "");
}

/** Reads the Cashfree mode the backend minted the order in, when it said so. */
export function readIntentCashfreeMode(
  paymentIntent: Record<string, unknown> | undefined,
): CashfreeMode | undefined {
  const metadata = (paymentIntent?.metadata as Record<string, unknown> | undefined) ?? {};
  for (const candidate of [metadata.environment, paymentIntent?.environment]) {
    if (candidate === "sandbox" || candidate === "production") {
      return candidate;
    }
  }
  return undefined;
}

/** Drops empty values and any customer contact field before the payload leaves this app. */
export function sanitizeBridgePayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const forbidden = new Set<string>(FORBIDDEN_PAYLOAD_KEYS);
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => !forbidden.has(key) && value !== undefined && value !== null && value !== "",
    ),
  ) as Partial<T>;
}

/**
 * Builds the bridge launch URL. The encoded payload goes ONLY in the URL fragment: browsers never
 * send the fragment to any server (not in the request line, logs, or the Referer header), so the
 * payment session details stay on the patient's device until the bridge page reads them.
 */
export function buildPaymentBridgeLaunchUrl(bridgeBaseUrl: string, encodedPayload: string): string {
  const base = parseUrl(bridgeBaseUrl);
  if (!base || !encodedPayload) {
    return "";
  }
  base.pathname = base.pathname.replace(/\/+$/u, "");
  if (!base.pathname || base.pathname === "/") {
    base.pathname = "/payments/start";
  }
  base.search = "";
  base.hash = `payload=${encodedPayload}`;
  return base.toString();
}
