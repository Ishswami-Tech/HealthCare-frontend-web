/**
 * ✅ Centralized Error Handler
 * Sanitizes technical errors and maps them to user-friendly messages
 * Use this for all API error handling
 */

import { ERROR_MESSAGES } from '@/lib/config/config';

export interface ApiErrorResponse {
  message?: string;
  error?: string | { message?: string; error?: string; details?: unknown; code?: string; [key: string]: unknown };
  details?: string | { message?: string; error?: string; code?: string; [key: string]: unknown };
  statusCode?: number;
  errorCode?: string;
  code?: string;
  [key: string]: unknown;
}

function extractNestedMessage(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const payload = value as Record<string, unknown>;
    const nested = payload.message || payload.error || payload.details;
    if (typeof nested === 'string') return nested;
    if (Array.isArray(nested)) return nested.filter(Boolean).join(', ');
  }
  return '';
}

function extractBackendErrorCode(error: ApiErrorResponse): string | undefined {
  if (typeof error.errorCode === 'string' && error.errorCode.trim()) {
    return error.errorCode.trim();
  }

  if (typeof error.code === 'string' && error.code.trim()) {
    return error.code.trim();
  }

  const nestedError = error.error;
  if (nestedError && typeof nestedError === 'object') {
    const payload = nestedError as Record<string, unknown>;
    if (typeof payload.code === 'string' && payload.code.trim()) {
      return payload.code.trim();
    }
  }

  return undefined;
}

function extractBackendErrorMessage(error: ApiErrorResponse): string {
  const candidates = [error.message, error.error, error.details];
  for (const candidate of candidates) {
    const extracted = extractNestedMessage(candidate);
    if (extracted) return extracted;
  }
  return '';
}

function getMessageForErrorCode(errorCode?: string): string {
  switch (errorCode) {
    case 'AUTH_ACCOUNT_LOCKED':
      return 'Your account is temporarily locked. Please try again later.';
    case 'AUTH_ACCOUNT_DISABLED':
      return 'Your account is disabled. Please contact support.';
    case 'AUTH_INSUFFICIENT_PERMISSIONS':
      return ERROR_MESSAGES.FORBIDDEN;
    case 'CLINIC_ACCESS_DENIED':
      return 'You do not have access to this clinic.';
    default:
      return '';
  }
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
    /(?:^|\s)[45]\d{2}(?:\s|$)/, // HTTP status codes (4xx, 5xx) with boundaries
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
export function getErrorMessageForStatus(
  status: number,
  backendMessage?: string,
  backendErrorCode?: string
): string {
  const codeMessage = getMessageForErrorCode(backendErrorCode);
  if (codeMessage) {
    return codeMessage;
  }

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
      return backendMessage && backendMessage.trim().length > 0
        ? backendMessage
        : ERROR_MESSAGES.FORBIDDEN;
    case 423:
      return backendMessage && backendMessage.trim().length > 0
        ? backendMessage
        : 'This resource is currently unavailable. Please try again later.';
    case 404:
      // ✅ More specific message for 404 - could be endpoint not found or service down
      // Check if backend message suggests endpoint issue
      if (backendMessage && (backendMessage.includes('Cannot POST') || backendMessage.includes('Cannot GET'))) {
        return 'The service is currently unavailable. Please try again later or contact support if this persists.';
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
    errorMessage = extractBackendErrorMessage(apiError);
    httpStatus = apiError.statusCode || httpStatus;
  }

  const errorCode = error && typeof error === 'object' ? extractBackendErrorCode(error as ApiErrorResponse) : undefined;
  
  // If we have a status code, use status-based mapping
  if (httpStatus) {
    return getErrorMessageForStatus(httpStatus, errorMessage, errorCode);
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
 * Extract a plain error message string from an unknown catch value.
 * Prefer this over `(error as any).message` in catch blocks.
 */
export function extractErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const e = error as ApiErrorResponse;
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.error === 'string' && e.error) return e.error;
  }
  if (typeof error === 'string' && error) return error;
  return fallback;
}

/**
 * Type-narrow an unknown catch value to ApiErrorResponse for accessing custom fields
 * like statusCode, code, response.data etc.
 */
export function isApiError(error: unknown): error is ApiErrorResponse {
  return error !== null && typeof error === 'object' && (
    'statusCode' in error || 'message' in error || 'code' in error
  );
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
  
  const backendMessage = responseData ? extractBackendErrorMessage(responseData) : '';
  const backendErrorCode = responseData ? extractBackendErrorCode(responseData) : undefined;

  return getErrorMessageForStatus(response.status, backendMessage, backendErrorCode);
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
