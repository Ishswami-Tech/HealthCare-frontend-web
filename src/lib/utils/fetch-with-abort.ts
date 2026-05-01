import { APP_CONFIG } from '@/lib/config/config';

export interface FetchWithAbortOptions extends RequestInit {
  timeout?: number;
  requireAuth?: boolean;
}

// Renaming to TimeoutError to match client.ts expectation
export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export { TimeoutError as FetchTimeoutError };

const BACKEND_PROTECTION_HEADER = 'x-internal-request-token';

function getBackendProtectionKey(): string | undefined {
  if (typeof window !== 'undefined') {
    return undefined;
  }

  const value = process.env.BACKEND_PROTECTION_KEY?.trim();
  return value && value.length > 0 ? value : undefined;
}

function shouldAttachBackendProtectionHeader(url: string): boolean {
  const key = getBackendProtectionKey();
  if (!key) {
    return false;
  }

  const backendBaseUrl = APP_CONFIG.API.BASE_URL || APP_CONFIG.API.HEALTH_BASE_URL;
  if (!backendBaseUrl) {
    return false;
  }

  try {
    const requestUrl = new URL(url, backendBaseUrl);
    const backendUrl = new URL(backendBaseUrl);
    return requestUrl.origin === backendUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Fetch with AbortController and timeout support
 * @param url - Request URL
 * @param options - Fetch options with optional timeout
 * @returns Promise<Response>
 */
export async function fetchWithAbort(
  url: string,
  options: FetchWithAbortOptions = {}
): Promise<Response> {
  const { timeout = 10000, requireAuth = true, ...fetchOptions } = options;
  const backendProtectionKey = getBackendProtectionKey();
  const shouldAttachProtectionHeader = shouldAttachBackendProtectionHeader(url);

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const headers = new Headers(fetchOptions.headers || {});
    if (backendProtectionKey && shouldAttachProtectionHeader) {
      headers.set(BACKEND_PROTECTION_HEADER, backendProtectionKey);
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request to ${url} timed out after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Fetch JSON with AbortController and timeout
 * @param url - Request URL
 * @param options - Fetch options with optional timeout
 * @returns Promise<T>
 */
export async function fetchJsonWithAbort<T = unknown>(
  url: string,
  options: FetchWithAbortOptions = {}
): Promise<T> {
  const response = await fetchWithAbort(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

