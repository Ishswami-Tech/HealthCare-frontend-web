/**
 * ✅ Secure Fetch Utility with AbortController
 * Provides fetch wrapper with timeout and cancellation support
 * Replaces direct fetch calls throughout the codebase
 */

export interface FetchWithAbortOptions extends RequestInit {
  timeout?: number;
  requireAuth?: boolean;
}

export class FetchTimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'FetchTimeoutError';
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

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchTimeoutError(`Request to ${url} timed out after ${timeout}ms`);
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

