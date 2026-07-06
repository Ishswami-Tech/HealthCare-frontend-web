const LOCAL_CONNECT_SRC = [
  "'self'",
  "http://localhost:3000",
  "ws://localhost:3000",
  "http://localhost:8088",
  "ws://localhost:8088",
];

const DAILY_CONNECT_SRC = [
  "https://c.daily.co",
  "https://*.daily.co",
  "wss://*.daily.co",
  "wss://*.wss.daily.co",
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
  "https://*.googleapis.com",
];

export function normalizeOrigin(input: string | undefined): string {
  if (!input || !input.trim()) {
    return "";
  }

  const trimmed = input.trim();
  const isLocalhostLike = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(trimmed);

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
    ])
  );
}

export function buildConnectSrcValue(input: string | undefined): string {
  return buildConnectSrcSources(input).join(" ");
}
