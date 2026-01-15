/**
 * ✅ API Error Wrapper Utility
 * Wrapper function to automatically handle API errors with centralized error messages
 * Use this for all API calls in hooks and components
 */

import { handleApiError, sanitizeErrorMessage } from './error-handler';

/**
 * Wraps an API call function to automatically handle errors
 * @param apiCall - The API call function
 * @returns Wrapped function with error handling
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<Response>
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = await handleApiError(response, errorData);
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    // If it's already a sanitized error, re-throw it
    if (error instanceof Error) {
      const sanitized = sanitizeErrorMessage(error);
      throw new Error(sanitized);
    }
    throw error;
  }
}

/**
 * Wraps a fetch call with automatic error handling
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns Parsed JSON response
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const { fetchWithAbort } = await import('./fetch-with-abort');
  
  try {
    const response = await fetchWithAbort(url, {
      ...options,
      timeout: options.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = await handleApiError(response, errorData);
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    const sanitized = sanitizeErrorMessage(error);
    throw new Error(sanitized);
  }
}
