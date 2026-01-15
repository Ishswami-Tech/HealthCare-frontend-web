/**
 * ✅ Centralized Error Handler
 * Sanitizes technical errors and maps them to user-friendly messages
 * Use this for all API error handling
 */

import { ERROR_MESSAGES } from '@/lib/config/config';

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * Check if an error message contains technical details that should be hidden from users
 */
export function isTechnicalError(message: string): boolean {
  if (!message) return false;
  
  const technicalPatterns = [
    /\/api\//i,
    /Cannot POST/i,
    /Cannot GET/i,
    /Cannot PUT/i,
    /Cannot DELETE/i,
    /Cannot PATCH/i,
    /\d{3}/, // HTTP status codes
    /Not Found/i,
    /Internal Server Error/i,
    /http:\/\//i,
    /https:\/\//i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /ECONNRESET/i,
  ];
  
  return technicalPatterns.some(pattern => pattern.test(message));
}

/**
 * Map HTTP status codes to user-friendly error messages
 */
export function getErrorMessageForStatus(status: number, backendMessage?: string): string {
  // If backend provides a user-friendly message and it's not technical, use it
  if (backendMessage && !isTechnicalError(backendMessage)) {
    return backendMessage;
  }
  
  // Map status codes to error messages
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      // ✅ More specific message for 404 - could be endpoint not found or service down
      // Check if backend message suggests endpoint issue
      if (backendMessage && (backendMessage.includes('Cannot POST') || backendMessage.includes('Cannot GET'))) {
        return 'The registration service is currently unavailable. Please contact support if this persists.';
      }
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    case 409:
      return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
    case 422:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return ERROR_MESSAGES.SERVER_ERROR;
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    default:
      if (status >= 500) {
        return ERROR_MESSAGES.SERVER_ERROR;
      }
      if (status >= 400) {
        return ERROR_MESSAGES.TRY_AGAIN;
      }
      return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Sanitize and convert API error to user-friendly message
 * @param error - Error object, response, or error message
 * @param statusCode - HTTP status code (optional)
 * @returns User-friendly error message
 */
export function sanitizeErrorMessage(
  error: Error | ApiErrorResponse | string | unknown,
  statusCode?: number
): string {
  let errorMessage = '';
  let httpStatus = statusCode;
  
  // Extract error message and status code
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    const apiError = error as ApiErrorResponse;
    errorMessage = apiError.message || apiError.error || apiError.details || '';
    httpStatus = apiError.statusCode || httpStatus;
  }
  
  // If we have a status code, use status-based mapping
  if (httpStatus) {
    return getErrorMessageForStatus(httpStatus, errorMessage);
  }
  
  // If error message is technical, replace with generic message
  if (isTechnicalError(errorMessage)) {
    return ERROR_MESSAGES.TRY_AGAIN;
  }
  
  // If error message is empty, use generic message
  if (!errorMessage || errorMessage.trim() === '') {
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  
  // Return the error message if it's user-friendly
  return errorMessage;
}

/**
 * Handle API response errors
 * @param response - Fetch Response object
 * @param responseData - Parsed response data (optional)
 * @returns User-friendly error message
 */
export async function handleApiError(
  response: Response,
  responseData?: ApiErrorResponse
): Promise<string> {
  // Try to parse response if not provided
  if (!responseData) {
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }
  }
  
  const backendMessage = responseData?.message || responseData?.error || responseData?.details || '';
  return getErrorMessageForStatus(response.status, backendMessage);
}

/**
 * Create a user-friendly error from various error types
 * @param error - Error object, response, or error message
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns Error object with user-friendly message
 */
export function createUserFriendlyError(
  error: Error | ApiErrorResponse | string | unknown,
  defaultMessage: string = ERROR_MESSAGES.UNKNOWN_ERROR
): Error {
  const message = sanitizeErrorMessage(error);
  return new Error(message || defaultMessage);
}
