const LOCAL_CONNECT_SRC = [
  "'self'",
  "http://localhost:3000",
  "ws://localhost:3000",
  "http://localhost:8088",
  "ws://localhost:8088",
];

// Daily call-object mode: signalling + media servers and their fallback
// domains (docs.daily.co/guides/privacy-and-security/content-security-policy).
const DAILY_CONNECT_SRC = [
  "https://c.daily.co",
  "https://*.daily.co",
  "wss://*.daily.co",
  "wss://*.wss.daily.co",
  "https://*.dailywebrtc.com",
  "wss://*.dailywebrtc.com",
  "https://*.dailywebrtc.net",
  "wss://*.dailywebrtc.net",
];

const THIRD_PARTY_CONNECT_SRC = [
  "https://*.ingest.sentry.io",
  "https://*.cashfree.com",
  "https://api.cashfree.com",
  "https://sandbox.cashfree.com",
  "https://payments.cashfree.com",
  "https://payments-test.cashfree.com",
  "https://sdk.cashfree.com",
  "https://checkout.razorpay.com",
  "https://*.razorpay.com",
  "https://payments.zoho.com",
  "https://static.zohocdn.com",
  "https://*.googleapis.com",
  "https://accounts.google.com",
];

export function normalizeOrigin(input: string | undefined): string {
  if (!input || !input.trim()) {
    return "";
  }

  const trimmed = input.trim();
  const isLocalhostLike =
    /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(trimmed);

  try {
    const normalized = /^[a-z]+:\/\//i.test(trimmed)
      ? trimmed
      : isLocalhostLike
        ? `http://${trimmed}`
        : `https://${trimmed}`;
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

export function buildOriginConnectSrc(input: string | undefined): string[] {
  const origin = normalizeOrigin(input);
  if (!origin) {
    return [];
  }

  try {
    const parsed = new URL(origin);
    const websocketScheme = parsed.protocol === "https:" ? "wss" : "ws";
    return [origin, `${websocketScheme}://${parsed.host}`];
  } catch {
    return [origin];
  }
}

export function buildConnectSrcSources(input: string | undefined): string[] {
  return Array.from(
    new Set([
      ...LOCAL_CONNECT_SRC,
      ...buildOriginConnectSrc(input),
      ...DAILY_CONNECT_SRC,
      ...THIRD_PARTY_CONNECT_SRC,
    ]),
  );
}

export function buildConnectSrcValue(input: string | undefined): string {
  return buildConnectSrcSources(input).join(" ");
}

/**
 * Single source of truth for the Permissions-Policy header (used by both
 * next.config.ts headers() and src/proxy.ts). Geolocation is needed for
 * desk-code check-in distance checks and camera for QR scanning / video
 * consults; everything else stays restricted.
 */
export const PERMISSIONS_POLICY_VALUE = [
  "camera=(self)",
  "microphone=(self)",
  "geolocation=(self)",
  "usb=()",
  "magnetometer=()",
  "gyroscope=()",
  "accelerometer=()",
].join(", ");

// ---------------------------------------------------------------------------
// Full Content-Security-Policy (single source of truth for next.config.ts
// headers() and src/proxy.ts, so public pages, protected pages, redirects
// and static assets all carry the same policy).
//
// script-src uses an explicit host allow-list rather than nonces: nonces force
// every page to render dynamically, which would disable static/ISR rendering
// of the public site. 'unsafe-inline' is still required for the Next.js inline
// bootstrap scripts and JSON-LD; 'unsafe-eval' is only sent in development
// (React refresh). Daily runs with dailyConfig.avoidEval so it does not need
// eval in production. Moving to nonce-based script-src is a follow-up.
// ---------------------------------------------------------------------------

const SCRIPT_HOSTS = [
  "https://accounts.google.com", // Google Identity Services (sign-in)
  "https://sdk.cashfree.com",
  "https://checkout.razorpay.com",
  "https://payments.zoho.com",
  "https://static.zohocdn.com",
  "https://*.daily.co", // Daily call-machine bundle (avoidEval mode)
  "https://*.dailywebrtc.com",
  "https://*.dailywebrtc.net",
  "https://www.gstatic.com", // Firebase messaging service worker importScripts
];

const STYLE_HOSTS = [
  "https://fonts.googleapis.com",
  "https://accounts.google.com",
];

const FONT_HOSTS = ["https://fonts.gstatic.com"];

const FRAME_HOSTS = [
  "https://accounts.google.com",
  "https://*.cashfree.com",
  "https://checkout.razorpay.com",
  "https://api.razorpay.com",
  "https://*.razorpay.com",
  "https://payments.zoho.com",
  "https://static.zohocdn.com",
  "https://*.daily.co",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://maps.google.com",
  "https://www.google.com",
];

const FORM_ACTION_HOSTS = [
  "https://*.cashfree.com",
  "https://checkout.razorpay.com",
  "https://*.razorpay.com",
  "https://payments.zoho.com",
  "https://static.zohocdn.com",
];

export interface ContentSecurityPolicyOptions {
  appUrl?: string | undefined;
  apiUrl?: string | undefined;
  websocketUrl?: string | undefined;
  /** Adds 'unsafe-eval' for React refresh; never true in production. */
  isDevelopment: boolean;
  /** Adds upgrade-insecure-requests; only for production HTTPS. */
  enforceHttps: boolean;
}

function joinSources(...groups: ReadonlyArray<ReadonlyArray<string>>): string {
  return Array.from(new Set(groups.flat().filter(Boolean))).join(" ");
}

export function buildContentSecurityPolicy(
  options: ContentSecurityPolicyOptions,
): string {
  const apiOrigin = normalizeOrigin(options.apiUrl);
  const apiSources = apiOrigin ? [apiOrigin] : [];
  const connectSources = joinSources(
    buildConnectSrcSources(undefined),
    buildOriginConnectSrc(options.appUrl),
    buildOriginConnectSrc(options.apiUrl),
    buildOriginConnectSrc(options.websocketUrl),
  );
  const scriptSources = joinSources(
    ["'self'", "'unsafe-inline'"],
    options.isDevelopment ? ["'unsafe-eval'"] : [],
    SCRIPT_HOSTS,
  );

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    `style-src ${joinSources(["'self'", "'unsafe-inline'"], STYLE_HOSTS)}`,
    // Avatars, uploaded documents and clinic media come from the API origin,
    // cloud storage and OAuth providers; images cannot execute script.
    `img-src ${joinSources(["'self'", "data:", "blob:", "https:"], apiSources)}`,
    `media-src ${joinSources(["'self'", "data:", "blob:", "mediastream:", "https:"], apiSources)}`,
    `font-src ${joinSources(["'self'", "data:"], FONT_HOSTS)}`,
    `connect-src ${connectSources}`,
    `worker-src 'self' blob:`,
    `frame-src ${joinSources(["'self'", "blob:"], FRAME_HOSTS)}`,
    `manifest-src 'self'`,
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${joinSources(["'self'"], FORM_ACTION_HOSTS)}`,
    "frame-ancestors 'none'",
    ...(options.enforceHttps ? ["upgrade-insecure-requests"] : []),
  ];

  return `${directives.join("; ")};`;
}
