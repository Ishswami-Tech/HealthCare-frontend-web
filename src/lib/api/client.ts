// ✅ API Client for Healthcare Frontend - Backend Integration
// This file provides a comprehensive API client that integrates with the backend clinic app

import { cookies } from 'next/headers';
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS, ERROR_CODES } from './config';
import type { 
  ApiResponse, 
  PaginationParams, 
  PaginatedResponse, 
  ErrorResponse, 
  RequestHeaders, 
  ApiClientConfig 
} from './config';

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

// ✅ Default Headers Generator
async function getDefaultHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  
  return {
    'Content-Type': 'application/json',
    'X-Request-ID': generateRequestId(),
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'web',
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'HealthcareFrontend/1.0.0',
  };
}

// ✅ Authentication Headers Generator
async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const clinicId = cookieStore.get('clinic_id')?.value;

  const headers = await getDefaultHeaders();

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (sessionId) {
    headers['X-Session-ID'] = sessionId;
  }

  if (clinicId) {
    headers['X-Clinic-ID'] = clinicId;
  }

  return headers;
}

// ✅ Retry Logic
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxAttempts: number = API_CONFIG.RETRY.MAX_ATTEMPTS,
  delay: number = API_CONFIG.RETRY.DELAY,
  backoffMultiplier: number = API_CONFIG.RETRY.BACKOFF_MULTIPLIER
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
    const errorResponse: ErrorResponse = {
      success: false,
      error: data?.error || 'Unknown error',
      code: data?.code || ERROR_CODES.SYSTEM_ERROR,
      message: data?.message || `HTTP ${response.status}`,
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

// ✅ Base API Client Class
export class ApiClient {
  private baseURL: string;
  private timeout: number;
  private withCredentials: boolean;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || API_CONFIG.TIMEOUTS.REQUEST;
    this.withCredentials = config.withCredentials ?? true;
  }

  // ✅ Generic Request Method
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await getAuthHeaders();
    
    const config: RequestInit = {
      method: 'GET',
      headers: headers as HeadersInit,
      credentials: this.withCredentials ? 'include' : 'omit',
      ...options,
    };

    // Merge headers
    if (options.headers) {
      config.headers = { ...headers, ...options.headers } as HeadersInit;
    }

    // Add timeout
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
        throw new TimeoutError();
      }
      
      if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
        throw new NetworkError();
      }
      
      throw new ApiError(
        error instanceof Error ? (error as Error).message : 'Unknown error occurred',
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

  // ✅ File Upload Helper
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers = await getAuthHeaders();
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

// ✅ Clinic API Client (Specialized for Healthcare)
export class ClinicApiClient extends ApiClient {
  constructor() {
    super({
      baseURL: API_CONFIG.CLINIC_API_URL,
      timeout: API_CONFIG.TIMEOUTS.REQUEST,
      withCredentials: true,
    });
  }

  // ✅ Authentication Methods
  async login(credentials: { email: string; password: string; clinicId?: string }) {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    clinicId?: string;
  }) {
    return this.post(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  async refreshToken() {
    return this.post(API_ENDPOINTS.AUTH.REFRESH);
  }

  async logout() {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async requestOTP(email: string, clinicId?: string) {
    return this.post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email, clinicId });
  }

  async verifyOTP(data: { email: string; otp: string; rememberMe?: boolean }) {
    return this.post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
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

  // ✅ Appointments Methods
  async getAppointments(clinicId: string, params?: PaginationParams) {
    return this.getPaginated(API_ENDPOINTS.APPOINTMENTS.GET_BY_TENANT(clinicId), params);
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
    clinicId: string;
  }) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CREATE, data);
  }

  async updateAppointment(id: string, data: {
    date?: string;
    time?: string;
    duration?: number;
    type?: string;
    notes?: string;
    status?: string;
  }) {
    return this.put(API_ENDPOINTS.APPOINTMENTS.UPDATE(id), data);
  }

  async cancelAppointment(id: string, reason?: string) {
    return this.post(API_ENDPOINTS.APPOINTMENTS.CANCEL(id), { reason });
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

  // ✅ Health Check Methods
  async getHealthStatus() {
    return this.get(API_ENDPOINTS.HEALTH.STATUS);
  }

  async getHealthReady() {
    return this.get(API_ENDPOINTS.HEALTH.READY);
  }

  async getHealthLive() {
    return this.get(API_ENDPOINTS.HEALTH.LIVE);
  }
}

// ✅ Export Default Instances
export const clinicApiClient = new ClinicApiClient();

// ✅ Export for Server Actions
export async function getAuthenticatedApiClient(): Promise<ClinicApiClient> {
  return clinicApiClient;
}
