// ✅ API Configuration for Healthcare Frontend - Backend Integration
// This file configures the API client to integrate with the comprehensive backend

import { z } from 'zod';

// ✅ Environment Configuration Schema
const envSchema = z.object({
  // Backend API Configuration
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default('http://localhost:4001'),
  NEXT_PUBLIC_API_VERSION: z.string().default('v1'),
  NEXT_PUBLIC_CLINIC_API_URL: z.string().url().default('http://localhost:4001/api/v1'),
  NEXT_PUBLIC_FASHION_API_URL: z.string().url().default('http://localhost:4002/api/v1'),
  
  // Authentication Configuration
  NEXT_PUBLIC_AUTH_ENDPOINT: z.string().default('/auth'),
  NEXT_PUBLIC_SESSION_ENDPOINT: z.string().default('/session'),
  
  // Clinic Configuration
  NEXT_PUBLIC_CLINIC_ID: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_REAL_TIME: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_VIDEO_CALLS: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  
  // Security Configuration
  NEXT_PUBLIC_ENABLE_HTTPS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_CORS: z.string().transform(val => val === 'true').default('true'),
});

// ✅ Environment Configuration
export const env = envSchema.parse(process.env);

// ✅ API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication Endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_OTP: '/auth/verify-otp',
    REQUEST_OTP: '/auth/request-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE_LOGIN: '/auth/google',
    FACEBOOK_LOGIN: '/auth/facebook',
    APPLE_LOGIN: '/auth/apple',
  },
  
  // Clinic Management Endpoints
  CLINICS: {
    BASE: '/clinics',
    CREATE: '/clinics',
    GET_ALL: '/clinics',
    GET_BY_ID: (id: string) => `/clinics/${id}`,
    GET_BY_APP_NAME: (appName: string) => `/clinics/app/${appName}`,
    UPDATE: (id: string) => `/clinics/${id}`,
    DELETE: (id: string) => `/clinics/${id}`,
    STATS: (id: string) => `/clinics/${id}/stats`,
    ANALYTICS: (id: string) => `/clinics/${id}/analytics`,
    SETTINGS: (id: string) => `/clinics/${id}/settings`,
  },
  
  // Clinic Locations Endpoints
  CLINIC_LOCATIONS: {
    BASE: (clinicId: string) => `/clinics/${clinicId}/locations`,
    CREATE: (clinicId: string) => `/clinics/${clinicId}/locations`,
    GET_ALL: (clinicId: string) => `/clinics/${clinicId}/locations`,
    GET_BY_ID: (clinicId: string, locationId: string) => `/clinics/${clinicId}/locations/${locationId}`,
    UPDATE: (clinicId: string, locationId: string) => `/clinics/${clinicId}/locations/${locationId}`,
    DELETE: (clinicId: string, locationId: string) => `/clinics/${clinicId}/locations/${locationId}`,
    QR_GENERATE: (locationId: string) => `/clinics/locations/${locationId}/qr`,
    QR_VERIFY: '/clinics/locations/verify-qr',
  },
  
  // Appointments Endpoints
  APPOINTMENTS: {
    BASE: '/appointments',
    CREATE: '/appointments',
    GET_ALL: '/appointments',
    GET_BY_TENANT: (tenantId: string) => `/appointments/tenant/${tenantId}`,
    GET_BY_ID: (id: string) => `/appointments/${id}`,
    UPDATE: (id: string) => `/appointments/${id}`,
    DELETE: (id: string) => `/appointments/${id}`,
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    CONFIRM: (id: string) => `/appointments/${id}/confirm`,
    CHECK_IN: (id: string) => `/appointments/${id}/check-in`,
    START: (id: string) => `/appointments/${id}/start`,
    COMPLETE: (id: string) => `/appointments/${id}/complete`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
    
    // Doctor Availability
    DOCTOR_AVAILABILITY: (doctorId: string) => `/appointments/doctor/${doctorId}/availability`,
    UPDATE_AVAILABILITY: (doctorId: string) => `/appointments/doctor/${doctorId}/availability`,
    
    // Queue Management
    QUEUE: {
      GET: (queueType: string) => `/appointments/queue/${queueType}`,
      ADD: '/appointments/queue/add',
      REMOVE: (queueId: string) => `/appointments/queue/${queueId}`,
      CALL_NEXT: (queueType: string) => `/appointments/queue/${queueType}/call-next`,
      REORDER: (queueType: string) => `/appointments/queue/${queueType}/reorder`,
      STATS: '/appointments/queue/stats',
      ANALYTICS: '/appointments/queue/analytics',
    },
    
    // QR Code Management
    QR: {
      GENERATE: (appointmentId: string) => `/appointments/${appointmentId}/qr`,
      VERIFY: '/appointments/verify-qr',
    },
    
    // Notifications
    NOTIFICATIONS: {
      GET: (userId: string) => `/appointments/notifications/${userId}`,
      SEND_REMINDER: (appointmentId: string) => `/appointments/${appointmentId}/reminder`,
      MARK_READ: (notificationId: string) => `/appointments/notifications/${notificationId}/read`,
    },
  },
  
  // Users Endpoints
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    GET_ALL: '/users',
    GET_BY_ROLE: (role: string) => `/users/role/${role}`,
    GET_BY_CLINIC: (clinicId: string) => `/users/clinic/${clinicId}`,
    SEARCH: '/users/search',
    STATS: '/users/stats',
    BULK_UPDATE: '/users/bulk-update',
    EXPORT: '/users/export',
    CHANGE_PASSWORD: (id: string) => `/users/${id}/password`,
    TOGGLE_VERIFICATION: (id: string) => `/users/${id}/verification`,
    ACTIVITY_LOGS: (id: string) => `/users/${id}/activity-logs`,
    SESSIONS: (id: string) => `/users/${id}/sessions`,
    TERMINATE_SESSION: (id: string, sessionId: string) => `/users/${id}/sessions/${sessionId}`,
  },
  
  // Health Check Endpoints
  HEALTH: {
    BASE: '/health',
    STATUS: '/health/status',
    READY: '/health/ready',
    LIVE: '/health/live',
  },
} as const;

// ✅ API Configuration
export const API_CONFIG = {
  // Base URLs
  BASE_URL: env.NEXT_PUBLIC_API_BASE_URL,
  CLINIC_API_URL: env.NEXT_PUBLIC_CLINIC_API_URL,
  FASHION_API_URL: env.NEXT_PUBLIC_FASHION_API_URL,
  
  // API Version
  VERSION: env.NEXT_PUBLIC_API_VERSION,
  
  // Timeouts
  TIMEOUTS: {
    REQUEST: 30000, // 30 seconds
    UPLOAD: 120000, // 2 minutes
    DOWNLOAD: 60000, // 1 minute
  },
  
  // Retry Configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2,
  },
  
  // Rate Limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
  },
  
  // Cache Configuration
  CACHE: {
    TTL: 5 * 60 * 1000, // 5 minutes
    STALE_TIME: 2 * 60 * 1000, // 2 minutes
    MAX_AGE: 10 * 60 * 1000, // 10 minutes
  },
  
  // Feature Flags
  FEATURES: {
    REAL_TIME: env.NEXT_PUBLIC_ENABLE_REAL_TIME,
    VIDEO_CALLS: env.NEXT_PUBLIC_ENABLE_VIDEO_CALLS,
    NOTIFICATIONS: env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
    HTTPS: env.NEXT_PUBLIC_ENABLE_HTTPS,
    CORS: env.NEXT_PUBLIC_ENABLE_CORS,
  },
} as const;

// ✅ HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ✅ Error Codes
export const ERROR_CODES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_LENGTH: 'VALIDATION_INVALID_LENGTH',
  VALIDATION_INVALID_VALUE: 'VALIDATION_INVALID_VALUE',
  
  // Resource Errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION: 'INVALID_OPERATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // System Errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// ✅ API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
  method?: string;
  requestId?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// ✅ Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ✅ Error Response Type
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
  details?: Record<string, any>;
}

// ✅ Request Headers Type
export interface RequestHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'X-Session-ID'?: string;
  'X-Clinic-ID'?: string;
  'X-Request-ID'?: string;
  'X-Client-Version'?: string;
  'X-Client-Platform'?: string;
  'Accept-Language'?: string;
  'User-Agent'?: string;
}

// ✅ API Client Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: RequestHeaders;
  withCredentials?: boolean;
  retry?: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier: number;
  };
}

// ✅ Export all configurations
export default {
  env,
  API_ENDPOINTS,
  API_CONFIG,
  HTTP_STATUS,
  ERROR_CODES,
};
