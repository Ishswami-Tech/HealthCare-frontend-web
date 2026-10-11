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
import { normalizeClinicId } from '@/lib/utils/clinic-id';
import { useAuthStore } from '@/stores/auth.store';
import { triggerClientAuthRecovery, refreshClientSessionOnce } from '@/lib/utils/auth-recovery';
import { dedupeRequest } from '@/hooks/core/requestDeduper';
import type { Session } from '@/types/auth.types';

type ClinicRequestInit = RequestInit & {
  omitClinicId?: boolean;
  clinicId?: string | undefined;
  requireClinicId?: boolean;
};

// ✅ Custom Error Classes
export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public backendCode?: string;
  public requestId?: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ERROR_CODES.SYSTEM_ERROR,
    backendCode?: string,
    requestId?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    if (backendCode !== undefined) this.backendCode = backendCode;
    if (requestId !== undefined) this.requestId = requestId;
    if (details !== undefined) this.details = details;
  }

  static fromResponse(response: ErrorResponse): ApiError {
    return new ApiError(
      response.message,
      response.statusCode,
      response.code || response.error,
      response.code,
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

/**
 * Backend contract for request bodies (read from the backend source):
 * - Fastify 5 answers 400 ("Body cannot be empty when content-type is set to
 *   'application/json'") when a JSON Content-Type arrives with an empty body,
 *   and the backend registers no parser that accepts one.
 * - JwtAuthGuard.validateRequest answers 400 ("Invalid Content-Type") outside
 *   development when a POST / PUT / PATCH does not declare a JSON Content-Type.
 * So a bodyless POST / PUT / PATCH is sent as an empty JSON object, and a
 * bodyless DELETE is sent with no Content-Type at all.
 */
const METHODS_REQUIRING_JSON_BODY: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH']);
const BODYLESS_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD']);

function hasRequestBody(body: BodyInit | null | undefined): body is BodyInit {
  return body !== undefined && body !== null && body !== '';
}

function resolveRequestBody(
  method: string,
  body: BodyInit | null | undefined
): BodyInit | null | undefined {
  if (hasRequestBody(body)) return body;
  return METHODS_REQUIRING_JSON_BODY.has(method) ? '{}' : body;
}

/**
 * Drops the default JSON Content-Type when it would be wrong for the body:
 * - multipart bodies: fetch has to write `multipart/form-data; boundary=...`
 *   itself, otherwise the server receives a body it cannot parse and every
 *   file upload fails;
 * - bodyless requests other than GET / HEAD (in practice DELETE): see the
 *   contract note above.
 */
function stripJsonContentTypeForBody(
  headers: Record<string, string>,
  body: BodyInit | null | undefined,
  method: string
): Record<string, string> {
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const isBodylessWrite = !hasRequestBody(body) && !BODYLESS_METHODS.has(method);
  if (!isFormData && !isBodylessWrite) return headers;

  const next = { ...headers };
  for (const key of Object.keys(next)) {
    if (key.toLowerCase() === 'content-type') {
      delete next[key];
    }
  }
  return next;
}

// ✅ Authentication Headers Generator
// Requires authentication unless explicitly marked as public
async function getAuthHeaders(
  requireAuth: boolean = true,
  includeClinicId: boolean = true,
  explicitClinicId?: string | undefined,
  requireClinicId: boolean = false
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
      clinicId = normalizeClinicId(cookieStore.get('clinic_id')?.value);
    } catch {
      // If cookies() is not available, fall back to empty values
    }
  } else {
    // Client-side: use token-manager
    accessToken = (await getAccessToken()) || undefined;
    sessionId = (await getSessionId()) || undefined;
    clinicId = (await getClinicId()) || undefined;
  }

  if (explicitClinicId) {
    clinicId = normalizeClinicId(explicitClinicId);
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
        clinicId = normalizeClinicId(payload.clinicId || payload.primaryClinicId);
      }
    } catch {
      // Ignore JWT decode issues; request can proceed without clinic header.
    }
  }

  if (!clinicId && requireClinicId) {
    throw new ApiError(
      'Clinic ID is required for this request.',
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Public endpoints without clinicId requirement should not auto-inject a hardcoded clinic ID.
  // Each public flow should explicitly provide clinicId via domain/subdomain or query param.
  // if (!clinicId && !requireAuth && !requireClinicId) {
  //   clinicId = normalizeClinicId(APP_CONFIG.CLINIC.ID);  // REMOVED: Avoid hardcoded fallback
  // }

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
const NON_RETRYABLE_API_STATUSES: ReadonlySet<number> = new Set([
  HTTP_STATUS.BAD_REQUEST,
  HTTP_STATUS.UNAUTHORIZED,
  HTTP_STATUS.FORBIDDEN,
  HTTP_STATUS.NOT_FOUND,
  HTTP_STATUS.CONFLICT,
  HTTP_STATUS.UNPROCESSABLE_ENTITY,
]);

async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxAttempts: number = APP_CONFIG.API.RETRY.MAX_ATTEMPTS,
  delay: number = APP_CONFIG.API.RETRY.DELAY,
  backoffMultiplier: number = APP_CONFIG.API.RETRY.BACKOFF_MULTIPLIER
): Promise<T> {
  const attemptRequest = async (attempt: number): Promise<T> => {
    try {
      return await requestFn();
    } catch (error) {
      const lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof ApiError) {
        if (NON_RETRYABLE_API_STATUSES.has(error.statusCode)) {
          throw error;
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Wait before retrying
      const waitTime = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return attemptRequest(attempt + 1);
    }
  };

  return attemptRequest(1);
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
      error: data?.code || data?.error || ERROR_CODES.SYSTEM_ERROR,
      code: data?.code || data?.error || ERROR_CODES.SYSTEM_ERROR,
      message: userFriendlyMessage, // Use sanitized user-friendly message
      statusCode: response.status,
      timestamp: nowIso(),
      path: response.url,
      method: 'GET', // This will be overridden by the actual method
      requestId: requestId || generateRequestId(),
      details: data?.details || (data?.errors ? { validationErrors: data.errors } : undefined),
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

// ✅ GET /appointments contract (backend AppointmentsController.getAppointments)
// The backend reads exactly these query params: userId, doctorId, status
// (comma separated), date, dateFrom, dateTo, locationId, page, limit. The range
// filters are `dateFrom` / `dateTo` (a `startDate` / `endDate` pair is silently
// ignored), `limit` is clamped to 100 and rows come back newest first.
export const APPOINTMENT_LIST_MAX_PAGE_SIZE = 100;
/** Hard stop for one logical list request: at most this many backend pages. */
export const APPOINTMENT_LIST_MAX_PAGES = 10;

export interface AppointmentListQueryInput {
  userId?: string | undefined;
  doctorId?: string | undefined;
  patientId?: string | undefined;
  clinicId?: string | undefined;
  status?: string | string[] | undefined;
  date?: string | undefined;
  /** Web-side name of the range start; sent to the backend as `dateFrom`. */
  startDate?: string | undefined;
  /** Web-side name of the range end; sent to the backend as `dateTo`. */
  endDate?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  locationId?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface AppointmentListPage {
  appointments: unknown[];
  pagination?: Record<string, unknown> | undefined;
}

function toPositiveInteger(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : undefined;
}

/** Filter part of the query (everything except `page` / `limit`). */
export function buildAppointmentListFilterQuery(
  params?: AppointmentListQueryInput
): Record<string, string> {
  const query: Record<string, string> = {};
  const put = (key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    const text = String(value).trim();
    if (text) query[key] = text;
  };

  put('userId', params?.userId);
  put('doctorId', params?.doctorId);
  put('patientId', params?.patientId);
  put('clinicId', params?.clinicId);
  put('locationId', params?.locationId);
  put('status', Array.isArray(params?.status) ? params.status.join(',') : params?.status);

  if (params?.date) {
    // An exact day wins: the backend ignores the range when `date` is present.
    put('date', params.date);
  } else {
    put('dateFrom', params?.dateFrom ?? params?.startDate);
    put('dateTo', params?.dateTo ?? params?.endDate);
  }

  return query;
}

/** Reads `{ appointments, pagination }` out of the envelopes the list route returns. */
export function extractAppointmentListPage(payload: unknown): AppointmentListPage {
  if (Array.isArray(payload)) return { appointments: payload };
  if (!payload || typeof payload !== 'object') return { appointments: [] };

  const record = payload as Record<string, unknown>;
  const asPagination = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;

  if (Array.isArray(record.appointments)) {
    return { appointments: record.appointments, pagination: asPagination(record.pagination) };
  }
  if (Array.isArray(record.data)) {
    return { appointments: record.data, pagination: asPagination(record.pagination ?? record.meta) };
  }
  if (record.data && typeof record.data === 'object') {
    const nested = extractAppointmentListPage(record.data);
    return {
      appointments: nested.appointments,
      pagination: nested.pagination ?? asPagination(record.pagination ?? record.meta),
    };
  }
  return { appointments: [], pagination: asPagination(record.pagination ?? record.meta) };
}

/**
 * Runs one logical list request against `GET /appointments`.
 * - no `limit`: one request without paging params (the backend then returns its
 *   default page of 20);
 * - `limit` up to 100: one request;
 * - `limit` above 100: the window `[(page - 1) * limit, page * limit)` is read in
 *   backend pages of 100, stopping at the last backend page and never reading
 *   more than APPOINTMENT_LIST_MAX_PAGES pages.
 */
export async function collectAppointmentListPages(
  params: AppointmentListQueryInput | undefined,
  fetchPage: (query: Record<string, string>) => Promise<AppointmentListPage>
): Promise<AppointmentListPage> {
  const filterQuery = buildAppointmentListFilterQuery(params);
  const requestedLimit = toPositiveInteger(params?.limit);
  const requestedPage = toPositiveInteger(params?.page) ?? 1;

  if (!requestedLimit) {
    return fetchPage(
      params?.page ? { ...filterQuery, page: String(requestedPage) } : filterQuery
    );
  }

  if (requestedLimit <= APPOINTMENT_LIST_MAX_PAGE_SIZE) {
    return fetchPage({
      ...filterQuery,
      page: String(requestedPage),
      limit: String(requestedLimit),
    });
  }

  const pageSize = APPOINTMENT_LIST_MAX_PAGE_SIZE;
  const windowStart = (requestedPage - 1) * requestedLimit;
  const firstBackendPage = Math.floor(windowStart / pageSize) + 1;
  const lastWantedPage = Math.ceil((windowStart + requestedLimit) / pageSize);
  const lastAllowedPage = Math.min(
    lastWantedPage,
    firstBackendPage + APPOINTMENT_LIST_MAX_PAGES - 1
  );
  const readBackendPage = (backendPage: number) =>
    fetchPage({ ...filterQuery, page: String(backendPage), limit: String(pageSize) });

  const firstPage = await readBackendPage(firstBackendPage);
  const total = toPositiveInteger(firstPage.pagination?.total) ?? 0;
  const totalBackendPages =
    toPositiveInteger(firstPage.pagination?.totalPages) ??
    (total ? Math.ceil(total / pageSize) : firstBackendPage);
  const lastPage = Math.min(lastAllowedPage, Math.max(totalBackendPages, firstBackendPage));

  const remainingPageNumbers: number[] = [];
  for (let backendPage = firstBackendPage + 1; backendPage <= lastPage; backendPage += 1) {
    remainingPageNumbers.push(backendPage);
  }
  const remainingPages = await Promise.all(remainingPageNumbers.map(readBackendPage));

  const rows = [firstPage, ...remainingPages].flatMap((page) => page.appointments);
  const offsetInFirstPage = windowStart - (firstBackendPage - 1) * pageSize;
  const appointments = rows.slice(offsetInFirstPage, offsetInFirstPage + requestedLimit);
  const knownTotal = total || rows.length;

  return {
    appointments,
    pagination: {
      page: requestedPage,
      limit: requestedLimit,
      total: knownTotal,
      totalPages: Math.max(1, Math.ceil(knownTotal / requestedLimit)),
      hasNext: windowStart + appointments.length < knownTotal,
      hasPrev: requestedPage > 1,
    },
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

  private normalizeHeadersForCache(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key.toLowerCase()] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      return headers.reduce<Record<string, string>>((acc, [key, value]) => {
        acc[String(key).toLowerCase()] = String(value);
        return acc;
      }, {});
    }

    return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key.toLowerCase()] = value;
      }
      return acc;
    }, {});
  }

  private buildRequestScopeKey(headers: HeadersInit | undefined): string {
    const normalized = this.normalizeHeadersForCache(headers);
    const authScope = normalized.authorization ? 'auth' : 'public';
    const sessionId = normalized['x-session-id'] || 'no-session';
    const clinicId = normalized['x-clinic-id'] || 'no-clinic';
    return `${authScope}:${sessionId}:${clinicId}`;
  }

  protected resolveBaseURL(endpoint: string): string {
    // Health endpoints intentionally bypass /api/v1 versioning and must hit the raw backend base URL.
    if (endpoint === '/health' || endpoint.startsWith('/health?') || endpoint.startsWith('/health/')) {
      return APP_CONFIG.API.HEALTH_BASE_URL || this.baseURL;
    }
    return this.baseURL;
  }

  /**
   * Endpoints that must not trigger the "authentication required" / 401-refresh path.
   * Health checks are matched exactly (`/health`, `/health?...`, `/health/...` on the
   * backend base URL): a substring test also matched `/health-library` and
   * `/communication/health`, so a 401 there never refreshed the token.
   */
  private isHealthCheckUrl(url: string): boolean {
    const bases = [APP_CONFIG.API.HEALTH_BASE_URL, this.baseURL];
    return bases.some((base) => {
      if (typeof base !== 'string' || !url.startsWith(base)) return false;
      const rest = url.slice(base.length);
      return (
        rest === '/health' ||
        rest.startsWith('/health?') ||
        rest.startsWith('/health/') ||
        rest.startsWith('/health#')
      );
    });
  }

  private isPublicEndpointUrl(url: string): boolean {
    return url.includes('/auth/') || this.isHealthCheckUrl(url);
  }

  // ✅ Generic Request Method (Optimized with Request Deduplication & Batching for 10M users)
  async request<T>(
    endpoint: string,
    options: ClinicRequestInit = {}
  ): Promise<ApiResponse<T>> {
    // ✅ Add API prefix if this is ClinicApiClient and endpoint doesn't already include it
    const apiPrefix = (this as any).API_PREFIX || '';
    const prefixedEndpoint = apiPrefix && !endpoint.startsWith(apiPrefix)
      ? `${apiPrefix}${endpoint}`
      : endpoint;
    const url = `${this.resolveBaseURL(prefixedEndpoint)}${prefixedEndpoint}`;
    const method = (options.method || 'GET').toUpperCase();
    const clinicOptions = options as ClinicRequestInit;
    const includeClinicId = clinicOptions.omitClinicId !== true;
    const isPublicEndpoint = this.isPublicEndpointUrl(url);
    const shouldRequireAuth = !isPublicEndpoint;
    const headers = await getAuthHeaders(
      shouldRequireAuth,
      includeClinicId,
      clinicOptions.clinicId,
      clinicOptions.requireClinicId === true
    );
    const mergedHeaders = stripJsonContentTypeForBody(
      options.headers ? { ...headers, ...(options.headers as Record<string, string>) } : headers,
      resolveRequestBody(method, options.body),
      method
    );
    const scopeKey = this.buildRequestScopeKey(mergedHeaders);
    const cacheKey = this.getCacheKey(`${endpoint}:${scopeKey}`, options);

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
        scopeKey,
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
    options: ClinicRequestInit = {},
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
    const isPublicEndpoint = this.isPublicEndpointUrl(url);
    const shouldRequireAuth = requireAuth && !isPublicEndpoint;
    const clinicOptions = options as ClinicRequestInit;
    const includeClinicId = clinicOptions.omitClinicId !== true;
    const headers = await getAuthHeaders(
      shouldRequireAuth,
      includeClinicId,
      clinicOptions.clinicId,
      clinicOptions.requireClinicId === true
    );
    const requestMethod = (options.method || 'GET').toUpperCase();
    const requestBody = resolveRequestBody(requestMethod, options.body);
    
    const config: RequestInit = {
      method: 'GET',
      headers: stripJsonContentTypeForBody(headers, requestBody, requestMethod) as HeadersInit,
      credentials: this.withCredentials ? 'include' : 'omit',
      // Do not use keepalive on normal requests.
      // Safari/iOS often surfaces it as a hard "Load failed" network error.
      // Server-side (Server Actions/RSC) fetches must opt out of Next.js's
      // fetch Data Cache: it otherwise caches this per-user, mutable, PHI
      // response indefinitely for the life of the server process, so a doctor
      // never sees new data after the first request. Browser-side requests
      // keep the default HTTP cache behavior.
      cache: typeof window === 'undefined' ? 'no-store' : 'default',
      ...options,
    };

    // A bodyless POST / PUT / PATCH goes out as `{}` (see resolveRequestBody).
    if (requestBody !== options.body) {
      config.body = requestBody ?? null;
    }

    // Merge headers efficiently
    if (options.headers) {
      config.headers = stripJsonContentTypeForBody(
        { ...headers, ...(options.headers as Record<string, string>) },
        requestBody,
        requestMethod
      ) as HeadersInit;
    }

    // Add timeout with AbortController
    // fetchWithAbort handles the abort controller internally
    
    try {
      const performFetch = async () => {
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
               headers: stripJsonContentTypeForBody(
                 { ...newHeaders, ...(options.headers as Record<string, string> | undefined) },
                 requestBody,
                 requestMethod
               ) as HeadersInit,
               timeout: this.timeout
           };
           return fetchWithAbort(url, newConfig);
        }

        return res;
      };

      // Only auto-retry safe, idempotent-by-convention methods (GET/HEAD).
      // POST/PUT/PATCH/DELETE carry real side effects (send an OTP, create a
      // booking, charge a payment) — silently repeating them on a timeout or
      // transient 5xx duplicates the side effect instead of just retrying a
      // read. This was firing for OTP requests: a slow/failed response was
      // retried up to RETRY.MAX_ATTEMPTS times, each attempt generating and
      // dispatching a brand-new OTP.
      const method = (config.method || 'GET').toUpperCase();
      const isSafeToAutoRetry = method === 'GET' || method === 'HEAD';
      const response = isSafeToAutoRetry ? await retryRequest(performFetch) : await performFetch();

      const result = await handleResponse<T>(response);
      
      // ✅ Track Metrics & Log Success
      const duration = Date.now() - startTime;
      trackApiCall(url, config.method || 'GET', response.status, duration, undefined, undefined, undefined);
      logger.debug('API Request Success', { url, status: response.status, duration });
      logger.debug('API Response Received', { url, status: response.status, duration, requestId: response.headers.get('X-Request-ID') });

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
      
      const errorCause = (error as { cause?: { name?: unknown; code?: unknown; message?: unknown } })?.cause;
      const causeName = typeof errorCause?.name === 'string' ? errorCause.name : '';
      const causeCode = typeof errorCause?.code === 'string' ? errorCause.code : '';
      const causeMessage = typeof errorCause?.message === 'string' ? errorCause.message : '';
      const message = error instanceof Error ? error.message.toLowerCase() : '';

      if (
        error instanceof TypeError &&
        message.includes('fetch') &&
        (
          causeName === 'AbortError' ||
          causeCode === 'ABORT_ERR' ||
          /abort|timed out/i.test(causeMessage)
        )
      ) {
        throw new TimeoutError(ERROR_MESSAGES.TIMEOUT_ERROR);
      }

      if (
        error instanceof TypeError &&
        /fetch|load failed|networkerror|network request failed/i.test(
          (error as Error).message || ''
        )
      ) {
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
        //   (routed through refreshClientSessionOnce so the WebSocket scheduler
        //   and the HTTP interceptor share a single in-flight refresh)
        // - server: direct backend refresh using the request cookies
        const tokens = isClient
          ? await (async () => {
              const refreshedSession = await refreshClientSessionOnce('api-client-401');
              if (!refreshedSession) {
                throw new Error('Token refresh failed');
              }
              return refreshedSession;
            })()
          : await (async () => {
              const response = await fetchWithAbort(`${this.baseURL}${API_ENDPOINTS.AUTH.REFRESH}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(sessionId ? { 'X-Session-ID': sessionId } : {})
                },
                credentials: this.withCredentials ? 'include' : 'omit',
                timeout: this.timeout,
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
          // The shared refresh clears auth only for an invalid refresh session. Preserve
          // the client session when a temporary failure interrupts renewal.
          if (isClient && useAuthStore.getState().session?.access_token) {
            throw error instanceof ApiError ? error : new ApiError(
              error instanceof Error ? error.message : 'Session refresh is temporarily unavailable',
              503,
              ERROR_CODES.SYSTEM_ERROR
            );
          }
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
  public clearRequestCache(): void {
    this.requestCache = {};
  }

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
       if (user?.clinicId) {
         cookieStore.set('clinic_id', normalizeClinicId(user.clinicId), {
           ...cookieOptions,
           maxAge: 604800,
         });
       }

    } else {
      const currentSession = useAuthStore.getState().session;
      // Always preserve the existing user when the refresh response omits it.
      // Without this, the Zustand session.access_token never updates after a
      // 401 retry, so every subsequent request sends the expired token and
      // triggers another 401 -> refresh -> still-expired loop, which is what
      // causes the 35+ appointment fetches logged in the browser network tab.
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
            clinicId: normalizeClinicId(user?.clinicId || currentSession?.user?.clinicId),
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
    options: ClinicRequestInit = {}
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

    // Content-Type is stripped centrally for FormData bodies — see
    // stripJsonContentTypeForBody. Deleting it from a local copy here did
    // nothing, because request() rebuilds the default headers underneath.
    return this.request<T>(endpoint, {
      method: 'POST',
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
    clinicId?: string | undefined;
  }) {
    const loginRequestOptions: RequestInit & { omitClinicId: boolean } = {
      method: 'POST',
      body: JSON.stringify(credentials),
      // Do not force a fallback clinic header during login.
      // The clinic is included in the body when the caller provides it.
      omitClinicId: true,
    };
    return this.publicRequest(API_ENDPOINTS.AUTH.LOGIN, {
      ...loginRequestOptions,
      clinicId: credentials.clinicId,
      requireClinicId: true,
    });
  }

  async refreshToken(refreshTokenDto?: { refreshToken?: string }) {
    return this.post(API_ENDPOINTS.AUTH.REFRESH, refreshTokenDto);
  }

  async logout(logoutDto?: { sessionId?: string; allDevices?: boolean }) {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT, logoutDto);
  }

  async requestOTP(requestDto: { identifier?: string; contact?: string; clinicId?: string }) {
    const identifier = requestDto.identifier || requestDto.contact;
    return this.publicRequest(API_ENDPOINTS.AUTH.REQUEST_OTP, {
      method: 'POST',
      omitClinicId: false,
      clinicId: requestDto.clinicId,
      requireClinicId: true,
      body: JSON.stringify({
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
    firstName?: string;
    lastName?: string;
  }) {
    const identifier = data.identifier || data.contact;
    return this.publicRequest(API_ENDPOINTS.AUTH.VERIFY_OTP, {
      method: 'POST',
      omitClinicId: false, // Include X-Clinic-ID header for OTP verification
      clinicId: data.clinicId,
      requireClinicId: true,
      body: JSON.stringify({
        identifier,
        otp: data.otp,
        ...(data.rememberMe !== undefined ? { rememberMe: data.rememberMe } : {}),
        ...(data.firstName ? { firstName: data.firstName } : {}),
        ...(data.lastName ? { lastName: data.lastName } : {}),
      })
    });
  }

  async forgotPassword(requestDto: { email: string; clinicId?: string }) {
    return this.publicRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      method: 'POST',
      clinicId: requestDto.clinicId,
      requireClinicId: true,
      body: JSON.stringify({ email: requestDto.email })
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
      omitClinicId: true,
      clinicId: data.clinicId,
      requireClinicId: true,
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
  /**
   * GET /appointments. Accepts the web filter names (`startDate` / `endDate`,
   * any `limit`) and translates them to the backend contract; see
   * collectAppointmentListPages for the paging rules.
   */
  async getAppointments(params?: AppointmentListQueryInput) {
    const responses: Array<ApiResponse<unknown>> = [];

    const merged = await collectAppointmentListPages(params, async (query) => {
      const response = await this.get<unknown>(API_ENDPOINTS.APPOINTMENTS.GET_ALL, query);
      responses.push(response);
      return extractAppointmentListPage(response.data);
    });

    const firstResponse = responses[0];
    const isMergedWindow =
      (toPositiveInteger(params?.limit) ?? 0) > APPOINTMENT_LIST_MAX_PAGE_SIZE;

    // A plain single-page request is returned untouched (same envelope as before).
    if (firstResponse && !isMergedWindow) {
      return firstResponse;
    }

    const base: ApiResponse<unknown> = firstResponse ?? { success: true, statusCode: 200 };
    return { ...base, data: merged };
  }

  async getMyAppointments(params?: {
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.MY_APPOINTMENTS, params);
  }

  async getPatientDashboardSummary() {
    return this.get(API_ENDPOINTS.PATIENTS.DASHBOARD_SUMMARY, {
      cache: 'no-store',
    });
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

  async checkInAppointment(id: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id));
  }

  async scanLocationQRAndCheckIn(data: { qrCode: string; locationId?: string }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.SCAN_QR, data);
  }

  async getDoctorAvailability(
    clinicId: string,
    doctorId: string,
    date: string,
    locationId?: string,
    appointmentType?: string
  ) {
    const params: Record<string, string> = { date };
    if (locationId) params.locationId = locationId;
    if (appointmentType) params.type = appointmentType;
    const url = `${API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY(doctorId)}?${new URLSearchParams(params)}`;
    return this.publicRequest(url, { method: 'GET', clinicId, requireClinicId: true });
  }

  async getUserUpcomingAppointments(userId: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.UPCOMING(userId));
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
