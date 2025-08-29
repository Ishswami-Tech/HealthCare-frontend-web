import { QueryClient } from '@tanstack/react-query';

// API Configuration
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
} as const;

// API Error Types
export interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    data?: {
      message?: string;
      error?: string;
      details?: Record<string, unknown>;
    };
  };
}

export class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(config = API_CONFIG) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & {
      params?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { params, timeout = this.timeout, ...fetchOptions } = options;
    
    // Build URL with query parameters
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }

    // Set default headers
    const headers = new Headers(fetchOptions.headers);
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json');
    }

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Add tenant headers if available
    const clinicId = this.getClinicId();
    const studioId = this.getStudioId();
    if (clinicId) {
      headers.set('X-Clinic-ID', clinicId);
    }
    if (studioId) {
      headers.set('X-Studio-ID', studioId);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        const error = new Error(errorData.message || 'Request failed') as ApiError;
        error.status = response.status;
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout') as ApiError;
        timeoutError.status = 408;
        throw timeoutError;
      }
      
      throw error;
    }
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private getClinicId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('clinic_id') || sessionStorage.getItem('clinic_id');
  }

  private getStudioId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('studio_id') || sessionStorage.getItem('studio_id');
  }

  // HTTP Methods
  async get<T>(endpoint: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: Omit<Parameters<typeof this.request>[1], 'method' | 'body'>): Promise<T> {
    const requestOptions: Record<string, unknown> = {
      ...options,
      method: 'POST',
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, requestOptions);
  }

  async put<T>(endpoint: string, data?: unknown, options?: Omit<Parameters<typeof this.request>[1], 'method' | 'body'>): Promise<T> {
    const requestOptions: Record<string, unknown> = {
      ...options,
      method: 'PUT',
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, requestOptions);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: Omit<Parameters<typeof this.request>[1], 'method' | 'body'>): Promise<T> {
    const requestOptions: Record<string, unknown> = {
      ...options,
      method: 'PATCH',
    };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, requestOptions);
  }

  async delete<T>(endpoint: string, options?: Omit<Parameters<typeof this.request>[1], 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// Query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Don't retry on client errors (4xx)
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
        // Retry up to 3 times for server errors (5xx) and network errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Don't retry on client errors
        if (apiError?.status && apiError.status >= 400 && apiError.status < 500) {
          return false;
        }
        // Retry once for server errors
        return failureCount < 1;
      },
    },
  },
});