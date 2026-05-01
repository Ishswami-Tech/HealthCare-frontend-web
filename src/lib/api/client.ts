// ✅ API Client for Healthcare Frontend - Backend Integration
// This file provides a comprehensive API client that integrates with the backend clinic app

import { APP_CONFIG, API_ENDPOINTS, HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '@/lib/config/config';
import { sanitizeErrorMessage, handleApiError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';
import { trackApiCall } from '@/lib/utils/metrics';
import { checkApiRateLimit, getClientIdentifier } from '@/lib/utils/security';
import { nowIso } from '@/lib/utils/date-time';
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse, 
  ErrorResponse, 
  ApiClientConfig 
} from '@/lib/config/config';

import { fetchWithAbort, TimeoutError } from '@/lib/utils/fetch-with-abort';
import { getAccessToken, getSessionId, getClinicId } from '@/lib/utils/token-manager';
import { useAuthStore } from '@/stores/auth.store';
import { triggerClientAuthRecovery } from '@/lib/utils/auth-recovery';
import { dedupeRequest } from '@/hooks/core/requestDeduper';
import type { Session } from '@/types/auth.types';

// ✅ Custom Error Classes
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public requestId?: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.SYSTEM_ERROR,
    requestId?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (requestId !== undefined) this.requestId = requestId;
    if (details !== undefined) this.details = details;
  }

  static fromResponse(response: ErrorResponse): ApiError {
    return new ApiError(
      response.message,
      response.statusCode,
      response.error,
      response.requestId,
      response.details
    );
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred') {
    super(message, 0, ERROR_CODES.NETWORK_ERROR);
    this.name = 'NetworkError';
  }
}

// ✅ Request ID Generator
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ Default Headers Generator (Optimized for 100K users)
const DEFAULT_HEADERS_CACHE = {
  'Content-Type': 'application/json',
  'X-Client-Version': '1.0.0',
  'X-Client-Platform': 'web',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'HealthcareFrontend/1.0.0',
};

async function getDefaultHeaders(): Promise<Record<string, string>> {
  return {
    ...DEFAULT_HEADERS_CACHE,
    'X-Request-ID': generateRequestId(),
  };
}

// ✅ Authentication Headers Generator
// Requires authentication unless explicitly marked as public
async function getAuthHeaders(
  requireAuth: boolean = true,
  includeClinicId: boolean = true
): Promise<Record<string, string>> {
  // Support both server-side (cookies) and client-side (localStorage)
  let accessToken: string | undefined;
  let sessionId: string | undefined;
  let clinicId: string | undefined;

  if (typeof window === 'undefined') {
    // Server-side: use cookies
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      accessToken = cookieStore.get('access_token')?.value;
      sessionId = cookieStore.get('session_id')?.value;
      clinicId = cookieStore.get('clinic_id')?.value;
    } catch {
      // If cookies() is not available, fall back to empty values
    }
  } else {
    // Client-side: use token-manager
    accessToken = (await getAccessToken()) || undefined;
    sessionId = (await getSessionId()) || undefined;
    clinicId = (await getClinicId()) || undefined;
  }

  // Prefer clinic context from access token claims when cookie/local storage is missing.
  if (!clinicId && accessToken) {
    try {
      const payloadSegment = accessToken.split('.')[1];
      if (payloadSegment) {
        const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        const decoded =
          typeof window === 'undefined'
            ? Buffer.from(padded, 'base64').toString('utf-8')
            : atob(padded);
        const payload = JSON.parse(decoded) as { clinicId?: string; primaryClinicId?: string };
        clinicId = payload.clinicId || payload.primaryClinicId;
      }
    } catch {
      // Ignore JWT decode issues; request can proceed without clinic header.
    }
  }

  // Only use static clinic fallback for non-authenticated/public flows.
  // For authenticated requests, forcing a default clinic can leak wrong tenant context.
  if (!clinicId && !requireAuth) {
    clinicId = APP_CONFIG.CLINIC.ID;
  }

  // ✅ Enforce authentication for server-side requests only.
  // Client-side requests rely on same-site httpOnly cookies.
  if (requireAuth && !accessToken && typeof window === 'undefined') {
    // If on server and we have a refresh token, we might be able to refresh. 
    // But getAuthHeaders is usually called before the request.
    // We'll let the request fail with 401 -> retry logic will handle refresh.
    // But if we throw here, we never make the request.
    // So if we have a refresh token, we should perhaps skip this throw?
    // Let's check for refresh token.
    let hasRefreshToken = false;
    if (typeof window === 'undefined') {
       try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        hasRefreshToken = !!cookieStore.get('refresh_token')?.value;
       } catch {}
    }

    if (!hasRefreshToken) {
        throw new ApiError(
        'Authentication required. Please log in to continue.',
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AUTH_TOKEN_INVALID
        );
    }
    // If we have refresh token, we proceed. The request will likely fail with 401 (or 403?) 
    // cause we send no/expired access token, then retry logic will refresh.
  }

  const headers = await getDefaultHeaders();

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  // ✅ Include clinic ID only when the caller opts into tenant scoping.
  if (includeClinicId && clinicId) {
    headers['X-Clinic-ID'] = clinicId;
  }

  return headers;
}

// ✅ Retry Logic
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxAttempts: number = APP_CONFIG.API.RETRY.MAX_ATTEMPTS,
  delay: number = APP_CONFIG.API.RETRY.DELAY,
  backoffMultiplier: number = APP_CONFIG.API.RETRY.BACKOFF_MULTIPLIER
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof ApiError) {
        if ([
          HTTP_STATUS.BAD_REQUEST,
          HTTP_STATUS.UNAUTHORIZED,
          HTTP_STATUS.FORBIDDEN,
          HTTP_STATUS.NOT_FOUND,
          HTTP_STATUS.CONFLICT,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ].includes(error.statusCode as any)) {
          throw error;
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Wait before retrying
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// ✅ Response Handler
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const requestId = response.headers.get('X-Request-ID');
  const contentType = response.headers.get('content-type');
  
  // Handle empty responses
  if (response.status === HTTP_STATUS.NO_CONTENT) {
    const result: ApiResponse<T> = {
      success: true,
      statusCode: response.status,
    };
    if (requestId !== null) {
      result.requestId = requestId;
    }
    return result;
  }
  
  // Parse response based on content type
  let data: any;
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('text/')) {
    data = await response.text();
  } else {
    data = await response.blob();
  }
  
  // Handle error responses
  if (!response.ok) {
    // ✅ Use centralized error handler to sanitize error messages
    const userFriendlyMessage = await handleApiError(response, data);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: data?.error || ERROR_CODES.SYSTEM_ERROR,
      code: data?.code || ERROR_CODES.SYSTEM_ERROR,
      message: userFriendlyMessage, // Use sanitized user-friendly message
      statusCode: response.status,
      timestamp: nowIso(),
      path: response.url,
      method: 'GET', // This will be overridden by the actual method
      requestId: requestId || generateRequestId(),
      details: data?.details,
    };
    
    throw ApiError.fromResponse(errorResponse);
  }
  
  // Return successful response
  return {
    success: true,
    data,
    statusCode: response.status,
    requestId: requestId || undefined,
    ...data, // Include any additional fields from the response
  };
}

// ✅ Request Cache for Connection Pooling
interface RequestCache {
  [url: string]: {
    timestamp: number;
    promise: Promise<any>;
  };
}

// ✅ Active Refresh Promises for Deduplication (Keyed by Session ID)
const activeRefreshPromises = new Map<string, Promise<any>>();

// ✅ Base API Client Class (Optimized for 10M+ users)
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private withCredentials: boolean;
  private requestCache: RequestCache = {};
  private readonly CACHE_DURATION = 2000; // 2 seconds deduplication window (increased for 10M users)
  private readonly MAX_CACHE_SIZE = 1000; // Maximum cache entries (optimized for 10M users)

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || APP_CONFIG.API.TIMEOUT.REQUEST;
    this.withCredentials = config.withCredentials ?? true;
    
    // Clean cache every 30 seconds for memory management (optimized for 10M users)
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanRequestCache();
      }, 30000);
    }
  }

  // ✅ Request Deduplication for High Load (Optimized for 10M users)
  private cleanRequestCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    // Collect keys to delete (more efficient than deleting during iteration)
    Object.keys(this.requestCache).forEach(key => {
      const entry = this.requestCache[key];
      if (entry && now - entry.timestamp > this.CACHE_DURATION) {
        keysToDelete.push(key);
      }
    });
    
    // Delete collected keys
    keysToDelete.forEach(key => delete this.requestCache[key]);
    
    // Limit cache size to prevent memory issues (optimized for 10M users)
    if (Object.keys(this.requestCache).length > this.MAX_CACHE_SIZE) {
      const sortedEntries = Object.entries(this.requestCache)
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = sortedEntries.slice(0, sortedEntries.length - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => delete this.requestCache[key]);
    }
  }

  private getCacheKey(endpoint: string, options: RequestInit): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  protected resolveBaseURL(endpoint: string): string {
    // Health endpoints intentionally bypass /api/v1 versioning and must hit the raw backend base URL.
    if (endpoint === '/health' || endpoint.startsWith('/health?') || endpoint.startsWith('/health/')) {
      return APP_CONFIG.API.HEALTH_BASE_URL || this.baseURL;
    }
    return this.baseURL;
  }

  // ✅ Generic Request Method (Optimized with Request Deduplication & Batching for 10M users)
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // ✅ Add API prefix if this is ClinicApiClient and endpoint doesn't already include it
    const apiPrefix = (this as any).API_PREFIX || '';
    const prefixedEndpoint = apiPrefix && !endpoint.startsWith(apiPrefix) 
      ? `${apiPrefix}${endpoint}` 
      : endpoint;
    const url = `${this.resolveBaseURL(prefixedEndpoint)}${prefixedEndpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Request deduplication for GET requests to reduce server load
    if (method === 'GET' && this.requestCache[cacheKey]) {
      const cached = this.requestCache[cacheKey];
      const now = Date.now();
      
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.promise;
      }
      delete this.requestCache[cacheKey];
    }
    
    // Execute request
    const requestPromise = dedupeRequest(
      'api-client',
      {
        url,
        method,
        body: options.body ?? null,
      },
      () => this.executeRequest<T>(url, options)
    );

    // Cache GET requests for deduplication
    if (method === 'GET') {
      this.requestCache[cacheKey] = {
        timestamp: Date.now(),
        promise: requestPromise,
      };
    }
    
    return requestPromise;
  }
  
  // ✅ Execute Request with Connection Pooling Optimization (10M users)
  protected async executeRequest<T>(
    url: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    // ✅ Rate Limiting Check (Client-side)
    if (typeof window !== 'undefined') {
      const clientId = getClientIdentifier();
      const rateLimit = checkApiRateLimit(`${clientId}:${url}`);
      if (!rateLimit.allowed) {
        logger.warn('Client-side rate limit exceeded', { url, clientId });
        throw new ApiError('Rate limit exceeded. Please try again later.', 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
      }
    }

    const startTime = Date.now();
    logger.debug('API Request Starting', { url, options });

    // ✅ Authentication is required for all API calls (unless explicitly public)
    // Check if this is a public endpoint (auth endpoints, health checks, etc.)
    const isPublicEndpoint = url.includes('/auth/') || url.includes('/health');
    const shouldRequireAuth = requireAuth && !isPublicEndpoint;
    const includeClinicId =
      (options as RequestInit & { omitClinicId?: boolean }).omitClinicId !== true;
    const headers = await getAuthHeaders(shouldRequireAuth, includeClinicId);
    
    const config: RequestInit = {
      method: 'GET',
      headers: headers as HeadersInit,
      credentials: this.withCredentials ? 'include' : 'omit',
      keepalive: true, // Optimize for connection reuse (10M users)
      cache: 'default', // Use browser cache for GET requests
      ...options,
    };

    // Merge headers efficiently
    if (options.headers) {
      config.headers = { ...headers, ...options.headers } as HeadersInit;
    }

    // Add timeout with AbortController
    // fetchWithAbort handles the abort controller internally
    
    try {
      const response = await retryRequest(async () => {
        // Use fetchWithAbort for timeout support
        const res = await fetchWithAbort(url, {
           ...config,
           timeout: this.timeout
        });
        
        if (res.status === HTTP_STATUS.UNAUTHORIZED && shouldRequireAuth) {
           // Attempt refresh
           await this.performTokenRefresh();
           // Retry request with new headers
           const newHeaders = await getAuthHeaders(shouldRequireAuth, includeClinicId);
           // Update headers in config
           const newConfig = { 
               ...config, 
               headers: { ...newHeaders, ...options.headers } as HeadersInit,
               timeout: this.timeout
           };
           return fetchWithAbort(url, newConfig);
        }

        return res;
      });

      const result = await handleResponse<T>(response);
      
      // ✅ Track Metrics & Log Success
      const duration = Date.now() - startTime;
      trackApiCall(url, config.method || 'GET', response.status, duration, undefined, undefined, undefined);
      logger.debug('API Request Success', { url, status: response.status, duration });

      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // FetchTimeoutError is already a subclass of Error, check name or instance if we imported it
      // but here we just need to catch it.
      // Actually fetchWithAbort throws FetchTimeoutError.
      // Let's check if we can just rethrow it wrapped or as is.
      // Client expects TimeoutError (from client.ts) which inherits ApiError.
      // We should probably convert FetchTimeoutError to client.ts TimeoutError or make them compatible.
      // For now, let's just handle the error message.
      
      if ((error as any).name === 'FetchTimeoutError' || (error as any).name === 'TimeoutError') {
          // If it's already our TimeoutError (imported), rethrow
          // If it's FetchTimeoutError, wrap it
          throw new TimeoutError(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      
      if ((error as any).name === 'AbortError') {
        throw new TimeoutError(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      
      if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
        throw new NetworkError(ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      // ✅ Use centralized error handler
      const errorMessage = sanitizeErrorMessage(
        error instanceof Error ? error : new Error(String(error))
      );
      
      // ✅ Track Metrics & Log Error
      const duration = Date.now() - startTime;
      trackApiCall(url, config.method || 'GET', 500, duration, errorMessage);
      logger.error('API Request Failed', { url, error: errorMessage, duration });

      throw new ApiError(
        errorMessage,
        500,
        ERROR_CODES.SYSTEM_ERROR
      );
    }
  }

  // ✅ Token Refresh Logic
  private async performTokenRefresh(): Promise<void> {
    let refreshToken: string | undefined;
    let sessionId: string | undefined;
    const isClient = typeof window !== 'undefined';

    // Get tokens context
    if (!isClient) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      refreshToken = cookieStore.get('refresh_token')?.value;
      sessionId = cookieStore.get('session_id')?.value;
    }

    // Use session ID for deduplication, or 'default' for client-side single user
    const refreshKey = sessionId || (isClient ? 'client' : 'server');
    
    // Check if refresh is already in progress
    if (activeRefreshPromises.has(refreshKey)) {
      await activeRefreshPromises.get(refreshKey);
      return;
    }

    const refreshPromise = (async () => {
      try {
        // Refresh through the same auth contract used by the app:
        // - client: backend refresh endpoint via the shared API client, which can read httpOnly cookies
        // - server: direct backend refresh using the request cookies
        const tokens = isClient
          ? await (async () => {
              const response = await this.publicRequest<Session>(API_ENDPOINTS.AUTH.REFRESH, {
                method: 'POST',
                credentials: this.withCredentials ? 'include' : 'omit',
              });

              const refreshedSession = (response.data as Record<string, any>)?.data || response.data;

              if (!refreshedSession) {
                throw new Error('Token refresh failed');
              }

              return refreshedSession;
            })()
          : await (async () => {
              const response = await fetch(`${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(sessionId ? { 'X-Session-ID': sessionId } : {})
                },
                credentials: this.withCredentials ? 'include' : 'omit',
                body: JSON.stringify(refreshToken ? { refreshToken } : {})
              });

              if (!response.ok) {
                throw new Error('Token refresh failed');
              }

              const data = await response.json();
              return data.data || data;
            })();

        // Update session with new tokens
        await this.updateSession(tokens);
        } catch (error) {
          // If refresh fails, clear session and throw
          await this.clearAuthSession();
          if (typeof window !== 'undefined') {
            triggerClientAuthRecovery();
          }
          
          // Throw proper ApiError to stop unintended retries
          if (!(error instanceof ApiError)) {
          throw new ApiError(
            'Session expired. Please log in again.',
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.AUTH_TOKEN_INVALID
          );
          }
          throw error;
        } finally {
        activeRefreshPromises.delete(refreshKey);
      }
    })();

    activeRefreshPromises.set(refreshKey, refreshPromise);
    await refreshPromise;
  }

  // ✅ Session Management Implementation
  private async updateSession(data: any) {
    const accessToken = data.access_token || data.accessToken;
    const refreshToken = data.refresh_token || data.refreshToken;
    const sessionId = data.session_id || data.sessionId;
    const user = data.user;
    
    if (typeof window === 'undefined') {
       // Server-side: Update cookies
       const { cookies } = await import('next/headers');
       const cookieStore = await cookies();
       const isProduction = process.env.NODE_ENV === 'production';
       const cookieOptions = {
         httpOnly: true,
         secure: isProduction,
         sameSite: 'lax' as const,
         path: '/'
       };

       if (accessToken) cookieStore.set('access_token', accessToken, { ...cookieOptions, maxAge: 900 }); // 15m
       if (refreshToken) cookieStore.set('refresh_token', refreshToken, { ...cookieOptions, maxAge: 604800 }); // 7d
       if (sessionId) cookieStore.set('session_id', sessionId, { ...cookieOptions, maxAge: 604800 });
       if (user?.role) cookieStore.set('user_role', user.role, { ...cookieOptions, maxAge: 604800 });
       if (user?.clinicId) cookieStore.set('clinic_id', user.clinicId, { ...cookieOptions, maxAge: 604800 });

    } else {
      const currentSession = useAuthStore.getState().session;
      const nextUser = (user || currentSession?.user) as Session['user'] | undefined;

      if (accessToken && nextUser) {
        const nextSession: Session = {
          ...(currentSession || {
            user: nextUser,
            access_token: accessToken,
            session_id: sessionId || '',
            isAuthenticated: true,
          }),
          access_token: accessToken,
          session_id: sessionId || currentSession?.session_id || '',
          isAuthenticated: true,
          user: {
            ...(currentSession?.user || nextUser),
            ...(user || {}),
            clinicId: user?.clinicId || currentSession?.user?.clinicId,
          },
        };

        useAuthStore.getState().setSession(nextSession);
      }
    }
  }

  private async clearAuthSession() {
     if (typeof window === 'undefined') {
       const { cookies } = await import('next/headers');
       const cookieStore = await cookies();
       cookieStore.delete('access_token');
       cookieStore.delete('refresh_token');
       cookieStore.delete('session_id');
       cookieStore.delete('user_role');
    }

    if (typeof window !== 'undefined') {
      useAuthStore.getState().clearAuth();
    }
  }

  // ✅ HTTP Method Helpers
  async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // ✅ Public Request Method (for unauthenticated endpoints)
  async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // ✅ Add API prefix if this is ClinicApiClient and endpoint doesn't already include it
    const apiPrefix = (this as any).API_PREFIX || '';
    const prefixedEndpoint = apiPrefix && !endpoint.startsWith(apiPrefix) 
      ? `${apiPrefix}${endpoint}` 
      : endpoint;
    const url = `${this.resolveBaseURL(prefixedEndpoint)}${prefixedEndpoint}`;
    return this.executeRequest<T>(url, options, false); // false = don't require auth
  }

  // ✅ File Upload Helper
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>, options?: RequestInit): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = await getAuthHeaders(true); // Require auth for uploads
    delete headers['Content-Type']; // Let browser set content-type for FormData

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: headers as HeadersInit,
      body: formData,
      ...options,
    });
  }

  // ✅ Paginated Request Helper
  async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams,
    options?: RequestInit
  ): Promise<PaginatedResponse<T>> {
    const queryParams: Record<string, any> = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      sortBy: params?.sortBy || 'createdAt',
      sortOrder: params?.sortOrder || 'desc',
      ...params?.filters,
    };

    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await this.get<PaginatedResponse<T>>(endpoint, queryParams, options);
    return response.data as PaginatedResponse<T>;
  }
}

// ✅ Clinic API Client (Optimized for 100K users)
export class ClinicApiClient extends ApiClient {
  private static instance: ClinicApiClient;
  // Note: API_PREFIX is handled by base ApiClient class

  constructor() {
    super({
      baseURL: APP_CONFIG.API.BASE_URL,
      timeout: APP_CONFIG.API.TIMEOUT.REQUEST,
      withCredentials: true,
    });
  }

  // ✅ Singleton Pattern for Connection Reuse
  static getInstance(): ClinicApiClient {
    if (!ClinicApiClient.instance) {
      ClinicApiClient.instance = new ClinicApiClient();
    }
    return ClinicApiClient.instance;
  }

  // ✅ Batch Request Helper (Integrated with centralized RequestBatcher)
  async batchRequest<T>(requests: Array<{ endpoint: string; options?: RequestInit }>): Promise<Array<ApiResponse<T>>> {
    const { requestBatcher } = await import('@/lib/config/request-batcher');
    
    // Process requests through the batcher
    const promises = requests.map(({ endpoint, options }) => 
      requestBatcher.batchRequest<ApiResponse<T>>(
        `${this.resolveBaseURL(endpoint)}${endpoint}`, 
        options || {},
        (url, opt) => this.executeRequest<T>(url, opt)
      ).catch(error => ({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        statusCode: 500
      } as ApiResponse<T>))
    );
    
    return Promise.all(promises);
  }

  // ✅ Authentication Methods (Enhanced to match backend)
  // ✅ clinicId is sent via X-Clinic-ID header automatically - never in body
  async login(credentials: { 
    email: string; 
    password: string; 
    rememberMe?: boolean; 
  }) {
    const loginRequestOptions: RequestInit & { omitClinicId: boolean } = {
      method: 'POST',
      body: JSON.stringify(credentials),
      // Do not force a fallback clinic header during login.
      // Backend now resolves clinic from the user's associations when needed.
      omitClinicId: true,
    };
    return this.publicRequest(API_ENDPOINTS.AUTH.LOGIN, {
      ...loginRequestOptions,
    });
  }

  // ✅ clinicId is sent via X-Clinic-ID header automatically - never in body
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    role?: string;
  }) {
    return this.publicRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async refreshToken(refreshTokenDto?: { refreshToken?: string }) {
    return this.post(API_ENDPOINTS.AUTH.REFRESH, refreshTokenDto);
  }

  async logout(logoutDto?: { sessionId?: string; allDevices?: boolean }) {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT, logoutDto);
  }

  async requestOTP(requestDto: { identifier?: string; contact?: string; clinicId?: string; isRegistration?: boolean }) {
    const identifier = requestDto.identifier || requestDto.contact;
    return this.publicRequest(API_ENDPOINTS.AUTH.REQUEST_OTP, {
      method: 'POST',
      body: JSON.stringify({
        ...requestDto,
        identifier,
      })
    });
  }

  async verifyOTP(data: {
    identifier?: string;
    contact?: string;
    otp: string;
    rememberMe?: boolean;
    clinicId?: string;
    isRegistration?: boolean;
    firstName?: string;
    lastName?: string;
  }) {
    const identifier = data.identifier || data.contact;
    return this.publicRequest(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        identifier,
      })
    });
  }

  async forgotPassword(requestDto: { email: string }) {
    return this.publicRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(requestDto)
    });
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.publicRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  async verifyEmail(token: string) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
  }

  async socialLogin(data: { provider: string; token: string; clinicId?: string }) {
    let endpoint = '';
    switch (data.provider) {
      case 'google':
        endpoint = API_ENDPOINTS.AUTH.GOOGLE_LOGIN;
        break;
      case 'facebook':
        endpoint = API_ENDPOINTS.AUTH.FACEBOOK_LOGIN;
        break;
      case 'apple':
        endpoint = API_ENDPOINTS.AUTH.APPLE_LOGIN;
        break;
      default:
        throw new Error('Invalid provider');
    }
    return this.publicRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ token: data.token, clinicId: data.clinicId })
    });
  }

  async getProfile() {
    return this.get(API_ENDPOINTS.USERS.PROFILE);
  }

  async getUserSessions(userId?: string) {
    if (userId) {
      return this.get(API_ENDPOINTS.USERS.SESSIONS.GET_ALL, { userId });
    }
    // Fallback to profile endpoint if no userId provided
    return this.get(API_ENDPOINTS.USERS.PROFILE);
  }

  // ✅ Clinic Management Methods
  async getClinics(params?: PaginationParams, options?: RequestInit) {
    return this.getPaginated(API_ENDPOINTS.CLINICS.GET_ALL, params, options);
  }

  async getClinicById(id: string, options?: RequestInit) {
    return this.get(API_ENDPOINTS.CLINICS.GET_BY_ID(id), undefined, options);
  }

  async getClinicByAppName(appName: string) {
    return this.get(API_ENDPOINTS.CLINICS.GET_BY_APP_NAME(appName));
  }

  // ✅ Clinic Methods

  async createClinic(data: {
    name: string;
    address: string;
    phone: string;
    email: string;
    subdomain: string;
    mainLocation: {
      name: string;
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      phone: string;
      email: string;
      timezone: string;
    };
    clinicAdminIdentifier: string;
    logo: string;
    website: string;
    description: string;
    timezone: string;
    currency: string;
    language: string;
  }, options?: RequestInit) {
    return this.post(API_ENDPOINTS.CLINICS.CREATE, data, options);
  }

  async updateClinic(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    website?: string;
    description?: string;
    timezone?: string;
    currency?: string;
    language?: string;
    isActive?: boolean;
  }, options?: RequestInit) {
    return this.put(API_ENDPOINTS.CLINICS.UPDATE(id), data, options);
  }

  async deleteClinic(id: string, options?: RequestInit) {
    return this.delete(API_ENDPOINTS.CLINICS.DELETE(id), options);
  }

  // ✅ Appointments Methods (Enhanced to match backend)
  async getAppointments(params?: {
    userId?: string;
    doctorId?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.GET_ALL, params);
  }

  async getMyAppointments(params?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS, params);
  }

  async getAppointmentById(id: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id));
  }

  async createAppointment(data: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    duration: number;
    type: string;
    notes?: string | undefined;
    clinicId?: string | undefined;
    locationId?: string | undefined;
    symptoms?: string[] | undefined;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | undefined;
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
  }

  async updateAppointment(id: string, data: {
    appointmentDate?: string | undefined;
    duration?: number | undefined;
    type?: string | undefined;
    notes?: string | undefined;
    status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | undefined;
    symptoms?: string[] | undefined;
    diagnosis?: string | undefined;
    prescription?: string | undefined;
    followUpDate?: string | undefined;
  }) {
    return this.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
  }

  /**
   * Update appointment status (Consolidated method)
   * Replaces checkIn, start, complete, cancel, etc.
   */
  async updateAppointmentStatus(id: string, data: {
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'CONFIRMED' | 'NO_SHOW' | 'SCHEDULED' | 'PENDING';
    reason?: string;
    notes?: string;
    // Check-in specific
    locationId?: string;
    qrCode?: string;
    checkInMethod?: string;
    coordinates?: { lat: number; lng: number };
    // Consultation specific
    consultationType?: string;
    // Completion specific
    diagnosis?: string;
    treatmentPlan?: string;
    prescription?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    followUpType?: string;
    followUpInstructions?: string;
    followUpPriority?: string;
    medications?: any[];
    tests?: any[];
    restrictions?: string[];
  }) {
    return this.patch(API_ENDPOINTS.APPOINTMENTS.STATUS(id), data);
  }

  async proposeVideoAppointment(data: {
    patientId: string;
    doctorId: string;
    clinicId: string;
    locationId?: string;
    duration: number;
    treatmentType: string;
    proposedSlots: Array<{ date: string; time: string }>;
    notes?: string | undefined;
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.VIDEO_PROPOSE, data);
  }

  async confirmVideoSlot(appointmentId: string, confirmedSlotIndex: number) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.VIDEO_CONFIRM_SLOT(appointmentId), {
      confirmedSlotIndex,
    });
  }

  async confirmFinalVideoSlot(
    appointmentId: string,
    data: {
      confirmedSlotIndex?: number;
      date?: string;
      time?: string;
      reason?: string;
    }
  ) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.VIDEO_CONFIRM_FINAL_SLOT(appointmentId), data);
  }

  async checkInAppointment(id: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id));
  }

  async scanLocationQRAndCheckIn(data: { qrCode: string; locationId?: string }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.SCAN_QR, data);
  }

  async getDoctorAvailability(
    doctorId: string,
    date: string,
    locationId?: string,
    appointmentType?: string
  ) {
    const params: Record<string, string> = { date };
    if (locationId) params.locationId = locationId;
    if (appointmentType) params.type = appointmentType;
    const url = `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY(doctorId)}?${new URLSearchParams(params)}`;
    return this.publicRequest(url, { method: 'GET' });
  }

  async getUserUpcomingAppointments(userId: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.GET_ALL, { patientId: userId, status: 'SCHEDULED,CONFIRMED' });
  }

  // ✅ Queue Management Methods
  async getQueue(queueType: string) {
    return this.get(API_ENDPOINTS.QUEUE.GET, { type: queueType });
  }

  async getQueueFilters() {
    return this.get(API_ENDPOINTS.QUEUE.FILTERS);
  }

  async addToQueue(data: {
    patientId: string;
    appointmentId?: string;
    queueType: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }) {
    return this.post(API_ENDPOINTS.QUEUE.ADD, data);
  }

  async callNextPatient(doctorId: string, appointmentId: string) {
    return this.post(API_ENDPOINTS.QUEUE.CALL_NEXT, { doctorId, appointmentId });
  }

  async getQueueStats(locationId: string) {
    return this.get(API_ENDPOINTS.QUEUE.STATS, { locationId });
  }

  // ✅ User Management Methods (Match Backend Users Controller)
  async getAllUsers() {
    return this.get(API_ENDPOINTS.USERS.GET_ALL);
  }

  async getUserById(id: string) {
    return this.get(API_ENDPOINTS.USERS.GET_BY_ID(id));
  }

  async updateUser(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    profilePicture?: string;
  }) {
    return this.patch(API_ENDPOINTS.USERS.UPDATE(id), data);
  }

  async deleteUser(id: string) {
    return this.delete(API_ENDPOINTS.USERS.DELETE(id));
  }

  async getPatients() {
    return this.get(API_ENDPOINTS.PATIENTS.GET_ALL);
  }

  async getDoctors() {
    return this.get(API_ENDPOINTS.DOCTORS.GET_ALL);
  }

  async getReceptionists() {
    return this.get(API_ENDPOINTS.STAFF.GET_ALL, { role: 'RECEPTIONIST' });
  }

  async getClinicAdmins() {
    return this.get(API_ENDPOINTS.STAFF.GET_ALL, { role: 'CLINIC_ADMIN' });
  }

  async updateUserRole(id: string, data: { role: string; clinicId?: string }) {
    return this.put(API_ENDPOINTS.USERS.UPDATE(id), data);
  }

  // ✅ Health Check Methods (Enhanced to match backend)
  async getHealthDetailed() {
    return this.get(API_ENDPOINTS.HEALTH.DETAILED);
  }

  // ✅ Clinic Enhancements Methods
  async getClinicStats(id: string) {
    return this.get(API_ENDPOINTS.CLINICS.STATS(id));
  }

  async getClinicOperatingHours(id: string) {
    return this.get(API_ENDPOINTS.CLINICS.OPERATING_HOURS(id));
  }

  async getHealthStatus() {
    return this.get(API_ENDPOINTS.HEALTH.BASE);
  }

  async getDetailedHealth() {
    return this.get(`${API_ENDPOINTS.HEALTH.BASE}?detailed=true`);
  }

  async getApiHealth() {
    return this.get(API_ENDPOINTS.HEALTH.BASE);
  }

  async getApiStatus() {
    return this.get(API_ENDPOINTS.HEALTH.BASE);
  }

  // ✅ Test Context Endpoint (from appointments controller)
  async testAppointmentContext() {
    return this.get(API_ENDPOINTS.APPOINTMENTS.TEST_CONTEXT);
  }

  // ✅ Utility Methods
  async validateSession() {
    try {
      const response = await this.getProfile();
      return response.success;
    } catch {
      return false;
    }
  }

  async ping() {
    try {
      const response = await this.getApiStatus();
      return response.success;
    } catch {
      return false;
    }
  }
}

// ✅ Export Optimized Instances (Singleton for Connection Pooling)
export const clinicApiClient = ClinicApiClient.getInstance();

// ✅ Export for Server Actions with Connection Optimization
export async function getAuthenticatedApiClient(): Promise<ClinicApiClient> {
  return ClinicApiClient.getInstance();
}

// ✅ Preload// Initialize connection check for clinic service
if (typeof window !== 'undefined') {
  // Pre-fetch health status to warm up connection
  ClinicApiClient.getInstance().ping().catch(() => {});
}
