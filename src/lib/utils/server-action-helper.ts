/**
 * ✅ Unified Server Action Helper
 * Follows SOLID, DRY, KISS principles
 * Centralizes common server action patterns: API calls, error handling, logging
 * Single Responsibility: Handle server action API operations
 * Open/Closed: Extensible for different action types
 * Dependency Inversion: Uses abstractions (logger, error handler) not implementations
 */

'use server';

import { logger } from '@/lib/utils/logger';
import { fetchWithAbort } from '@/lib/utils/fetch-with-abort';
import { handleApiError, sanitizeErrorMessage } from '@/lib/utils/error-handler';
import { APP_CONFIG, ERROR_MESSAGES } from '@/lib/config/config';
import { cookies } from 'next/headers';

// API URL configuration from central config
const API_URL = APP_CONFIG.API.BASE_URL;
const API_PREFIX = '/api/v1';
const CLINIC_ID = APP_CONFIG.CLINIC.ID;

export interface ServerActionOptions {
  /** Endpoint path (will be prefixed with API_URL + API_PREFIX) */
  endpoint: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request body */
  body?: Record<string, any> | string;
  /** Request headers */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether authentication is required */
  requireAuth?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Log operation name for debugging */
  operationName?: string;
}

/**
 * ✅ Unified Server Action Helper
 * Provides consistent API calls, error handling, and logging
 * 
 * @example
 * ```typescript
 * const data = await executeServerAction({
 *   endpoint: API_ENDPOINTS.PATIENTS.CREATE,
 *   method: 'POST',
 *   body: patientData,
 *   operationName: 'createPatient',
 * });
 * ```
 */
export async function executeServerAction<T = any>(
  options: ServerActionOptions
): Promise<T> {
  const {
    endpoint,
    method = 'GET',
    body,
    headers = {},
    timeout = 10000,
    requireAuth = true,
    errorMessage,
    operationName = 'serverAction',
  } = options;

  try {
    // ✅ Get authentication headers if required
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (requireAuth) {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('access_token')?.value;
      const sessionId = cookieStore.get('session_id')?.value;

      if (!accessToken) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      requestHeaders['Authorization'] = `Bearer ${accessToken}`;
      if (sessionId) {
        requestHeaders['X-Session-ID'] = sessionId;
      }
    }

    // ✅ Always include clinic ID in headers
    const clinicId = CLINIC_ID?.trim();
    if (clinicId) {
      requestHeaders['X-Clinic-ID'] = clinicId;
    }

    // ✅ Build full URL
    const fullUrl = `${API_URL}${API_PREFIX}${endpoint}`;

    // ✅ Log request in development
    if (APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) {
      logger.debug(`[${operationName}] Request`, {
        method,
        endpoint,
        url: fullUrl,
        hasBody: !!body,
      });
    }

    // ✅ Execute request
    const requestBody = typeof body === 'string' ? body : body ? JSON.stringify(body) : null;
    const response = await fetchWithAbort(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
      timeout,
    });

    // ✅ Handle response
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      responseData = {};
    }

    if (!response.ok) {
      // ✅ Use centralized error handler
      const errorMessage = await handleApiError(response, responseData);
      
      logger.error(`[${operationName}] Error`, {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        url: fullUrl,
        originalError: responseData.message || responseData.error,
        userMessage: errorMessage,
      });

      throw new Error(errorMessage || errorMessage || ERROR_MESSAGES.UNKNOWN_ERROR);
    }

    // ✅ Log success in development
    if (APP_CONFIG.IS_DEVELOPMENT || APP_CONFIG.FEATURES.DEBUG) {
      logger.debug(`[${operationName}] Success`, {
        endpoint,
        status: response.status,
      });
    }

    return responseData as T;
  } catch (error) {
    // ✅ Consistent error handling
    const sanitizedError = sanitizeErrorMessage(error);
    const finalErrorMessage = errorMessage || sanitizedError || ERROR_MESSAGES.UNKNOWN_ERROR;

    logger.error(`[${operationName}] Failed`, {
      endpoint,
      originalError: error instanceof Error ? error.message : String(error),
      userMessage: finalErrorMessage,
    });

    throw new Error(finalErrorMessage);
  }
}

/**
 * ✅ Helper for authenticated API calls (backward compatibility)
 * Wraps executeServerAction with requireAuth: true
 */
export async function authenticatedServerAction<T = any>(
  endpoint: string,
  options?: Omit<ServerActionOptions, 'endpoint' | 'requireAuth'>
): Promise<T> {
  return executeServerAction<T>({
    ...options,
    endpoint,
    requireAuth: true,
  });
}
