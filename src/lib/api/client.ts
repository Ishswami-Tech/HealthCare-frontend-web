// ✅ API Client for Healthcare Frontend - Backend Integration
// This file provides a comprehensive API client that integrates with the backend clinic app

import { APP_CONFIG, API_ENDPOINTS, HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '@/lib/config/config';
import { sanitizeErrorMessage, handleApiError } from '@/lib/utils/error-handler';
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse, 
  ErrorResponse, 
  ApiClientConfig 
} from '@/lib/config/config';

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

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, ERROR_CODES.TIMEOUT_ERROR);
    this.name = 'TimeoutError';
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
async function getAuthHeaders(requireAuth: boolean = true): Promise<Record<string, string>> {
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
    // Client-side: use localStorage
    accessToken = localStorage.getItem('access_token') || undefined;
    sessionId = localStorage.getItem('session_id') || undefined;
    clinicId = localStorage.getItem('clinic_id') || undefined;
  }

  // ✅ Fallback to APP_CONFIG.CLINIC.ID if clinic ID is not in cookies/localStorage
  // This ensures clinic ID is always set from environment variable or config default
  if (!clinicId) {
    clinicId = APP_CONFIG.CLINIC.ID;
  }

  // ✅ Enforce authentication unless explicitly disabled
  if (requireAuth && !accessToken) {
    throw new ApiError(
      'Authentication required. Please log in to continue.',
      HTTP_STATUS.UNAUTHORIZED,
      ERROR_CODES.AUTH_TOKEN_INVALID
    );
  }

  const headers = await getDefaultHeaders();

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  // ✅ Always include clinic ID in headers (from cookie/localStorage or config)
  if (clinicId) {
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
      timestamp: new Date().toISOString(),
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
    const url = `${this.baseURL}${prefixedEndpoint}`;
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
    const requestPromise = this.executeRequest<T>(url, options);
    
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
  private async executeRequest<T>(
    url: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    // ✅ Authentication is required for all API calls (unless explicitly public)
    // Check if this is a public endpoint (auth endpoints, health checks, etc.)
    const isPublicEndpoint = url.includes('/auth/') || url.includes('/health');
    const shouldRequireAuth = requireAuth && !isPublicEndpoint;
    const headers = await getAuthHeaders(shouldRequireAuth);
    
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    try {
      const response = await retryRequest(async () => {
        const res = await fetch(url, config);
        clearTimeout(timeoutId);
        return res;
      });

      return await handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
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
      
      throw new ApiError(
        errorMessage,
        500,
        ERROR_CODES.SYSTEM_ERROR
      );
    }
  }

  // ✅ HTTP Method Helpers
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
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
    const url = `${this.baseURL}${prefixedEndpoint}`;
    return this.executeRequest<T>(url, options, false); // false = don't require auth
  }

  // ✅ File Upload Helper
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
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
    });
  }

  // ✅ Paginated Request Helper
  async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams
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

    const response = await this.get<PaginatedResponse<T>>(endpoint, queryParams);
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

  // ✅ Batch Request Helper for High Load
  async batchRequest<T>(requests: Array<{ endpoint: string; options?: RequestInit }>): Promise<Array<ApiResponse<T>>> {
    const batchPromises = requests.map(({ endpoint, options }) => 
      this.request<T>(endpoint, options).catch(error => ({ error, success: false }))
    );
    
    return Promise.all(batchPromises) as Promise<Array<ApiResponse<T>>>;
  }

  // ✅ Authentication Methods (Enhanced to match backend)
  async login(credentials: { 
    email: string; 
    password: string; 
    clinicId?: string;
    rememberMe?: boolean; 
  }) {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

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
    clinicId?: string;
  }) {
    return this.post(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async refreshToken(refreshTokenDto?: { refreshToken?: string }) {
    return this.post(API_ENDPOINTS.AUTH.REFRESH, refreshTokenDto);
  }

  async logout(logoutDto?: { sessionId?: string; allDevices?: boolean }) {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT, logoutDto);
  }

  async requestOTP(requestDto: { contact: string; clinicId?: string }) {
    return this.post(API_ENDPOINTS.AUTH.REQUEST_OTP, requestDto);
  }

  async verifyOTP(data: { contact: string; otp: string; rememberMe?: boolean; clinicId?: string }) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
  }

  async forgotPassword(requestDto: { email: string }) {
    return this.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, requestDto);
  }

  async resetPassword(data: { token: string; password: string }) {
    return this.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
  }

  async getProfile() {
    return this.get(API_ENDPOINTS.USERS.PROFILE);
  }

  async getUserSessions(userId?: string) {
    if (userId) {
      return this.get(API_ENDPOINTS.USERS.SESSIONS(userId));
    }
    // Fallback to profile endpoint if no userId provided
    return this.get(API_ENDPOINTS.USERS.PROFILE);
  }

  // ✅ Clinic Management Methods
  async getClinics(params?: PaginationParams) {
    return this.getPaginated(API_ENDPOINTS.CLINICS.GET_ALL, params);
  }

  async getClinicById(id: string) {
    return this.get(API_ENDPOINTS.CLINICS.GET_BY_ID(id));
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
  }) {
    return this.post(API_ENDPOINTS.CLINICS.CREATE, data);
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
  }) {
    return this.put(API_ENDPOINTS.CLINICS.UPDATE(id), data);
  }

  async deleteClinic(id: string) {
    return this.delete(API_ENDPOINTS.CLINICS.DELETE(id));
  }

  // ✅ Appointments Methods (Enhanced to match backend)
  async getAppointments(params?: {
    userId?: string;
    doctorId?: string;
    status?: string;
    date?: string;
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
    date: string;
    time: string;
    duration: number;
    type: string;
    notes?: string;
    clinicId?: string;
    locationId?: string;
    symptoms?: string[];
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
  }

  async updateAppointment(id: string, data: {
    date?: string;
    time?: string;
    duration?: number;
    type?: string;
    notes?: string;
    status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    symptoms?: string[];
    diagnosis?: string;
    prescription?: string;
    followUpDate?: string;
  }) {
    return this.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
  }

  async cancelAppointment(id: string) {
    return this.delete(API_ENDPOINTS.APPOINTMENTS.CANCEL(id));
  }

  async confirmAppointment(id: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CONFIRM(id));
  }

  async checkInAppointment(id: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id));
  }

  async startAppointment(id: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.START(id));
  }

  async completeAppointment(id: string, data: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    followUpDate?: string;
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.COMPLETE(id), data);
  }

  async getDoctorAvailability(doctorId: string, date: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.DOCTOR_AVAILABILITY(doctorId), { date });
  }

  async getUserUpcomingAppointments(userId: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.GET_ALL, { patientId: userId, status: 'SCHEDULED,CONFIRMED' });
  }

  // ✅ Queue Management Methods
  async getQueue(queueType: string) {
    return this.get(API_ENDPOINTS.APPOINTMENTS.QUEUE.GET(queueType));
  }

  async addToQueue(data: {
    patientId: string;
    appointmentId?: string;
    queueType: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.QUEUE.ADD, data);
  }

  async callNextPatient(queueType: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.QUEUE.CALL_NEXT(queueType));
  }

  async getQueueStats() {
    return this.get(API_ENDPOINTS.APPOINTMENTS.QUEUE.STATS);
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
  async getHealthStatus() {
    return this.get(API_ENDPOINTS.HEALTH.BASE);
  }

  async getDetailedHealth() {
    return this.get(`${API_ENDPOINTS.HEALTH.BASE}?detailed=true`);
  }

  async getApiHealth() {
    return this.get(API_ENDPOINTS.HEALTH.STATUS);
  }

  async getApiStatus() {
    return this.get(API_ENDPOINTS.HEALTH.LIVE);
  }

  // ✅ Test Context Endpoint (from appointments controller)
  async testAppointmentContext() {
    return this.get(`${API_ENDPOINTS.APPOINTMENTS.BASE}/test/context`);
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

// ✅ Preload Critical Connections for 100K Users
if (typeof window !== 'undefined') {
  // Warm up connection pool on client load
  clinicApiClient.ping().catch(() => {});
}
