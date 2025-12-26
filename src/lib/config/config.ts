/**
 * 🎯 CENTRAL CONFIGURATION - SINGLE SOURCE OF TRUTH
 * 
 * This is the ONLY configuration file used throughout the entire application.
 * Use this for: UI components, hooks, actions, API clients, WebSocket, and everything else.
 * 
 * Import: import { APP_CONFIG } from '@/lib/config/config'
 * 
 * @module Config
 */

import { z } from 'zod';

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

export type Environment = 'development' | 'staging' | 'production';

function getEnvironment(): Environment {
  const env = process.env.NODE_ENV;
  const customEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  if (customEnv) {
    return customEnv as Environment;
  }

  if (env === 'production') {
    if (apiUrl.includes('staging') || apiUrl.includes('stg')) {
      return 'staging';
    }
    return 'production';
  }

  return 'development';
}

export const currentEnvironment = getEnvironment();
export const isDevelopment = currentEnvironment === 'development';
export const isStaging = currentEnvironment === 'staging';
export const isProduction = currentEnvironment === 'production';

// ============================================================================
// ENVIRONMENT VARIABLE SCHEMA & VALIDATION
// ============================================================================

const envSchema = z.object({
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_API_VERSION: z.string().default('v1'),
  NEXT_PUBLIC_CLINIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_FASHION_API_URL: z.string().optional(),
  
  // WebSocket Configuration
  NEXT_PUBLIC_WEBSOCKET_URL: z.string().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  NEXT_PUBLIC_WS_TIMEOUT: z.string().optional(),
  NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS: z.string().optional(),
  
  // Authentication Configuration
  NEXT_PUBLIC_AUTH_ENABLED: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_APP_ID: z.string().optional(),
  NEXT_PUBLIC_APPLE_CLIENT_ID: z.string().optional(),
  
  // Clinic Configuration
  NEXT_PUBLIC_CLINIC_ID: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  
  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  
  // Third-party API Keys
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY: z.string().optional(),
  
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_REAL_TIME: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_VIDEO_CALLS: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z.string().transform(val => val === 'true').default('true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_HTTPS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_CORS: z.string().transform(val => val === 'true').default('true'),
  
  // Debug & Monitoring
  NEXT_PUBLIC_DEBUG_BACKEND_STATUS: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_HEALTH_CHECK_INTERVAL: z.string().optional(),
  NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
  
  // Logging
  NEXT_PUBLIC_LOG_LEVEL: z.string().default('info'),
  NEXT_PUBLIC_ENABLE_CONSOLE_LOGS: z.string().transform(val => val === 'true').default('false'),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// ============================================================================
// ENVIRONMENT-SPECIFIC DEFAULTS
// ============================================================================

const envDefaults = {
  development: {
    apiUrl: 'http://localhost:8088',
    websocketUrl: 'ws://localhost:8088/socket.io',
    appUrl: 'http://localhost:3000',
    enableDebug: true,
    enableAnalytics: false,
    logLevel: 'debug' as const,
  },
  staging: {
    apiUrl: 'https://staging-api.ishswami.in',
    websocketUrl: 'wss://staging-api.ishswami.in/socket.io',
    appUrl: 'https://staging.ishswami.in',
    enableDebug: true,
    enableAnalytics: true,
    logLevel: 'info' as const,
  },
  production: {
    apiUrl: 'https://api.ishswami.in',
    websocketUrl: 'wss://api.ishswami.in/socket.io',
    appUrl: 'https://ishswami.in',
    enableDebug: false,
    enableAnalytics: true,
    logLevel: 'error' as const,
  },
} as const;

const currentEnvDefaults = envDefaults[currentEnvironment];

// ============================================================================
// CENTRAL APPLICATION CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  // ============================================
  // ENVIRONMENT
  // ============================================
  ENVIRONMENT: currentEnvironment,
  IS_DEVELOPMENT: isDevelopment,
  IS_STAGING: isStaging,
  IS_PRODUCTION: isProduction,
  
  // ============================================
  // API CONFIGURATION
  // ============================================
  API: {
    BASE_URL: env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
    CLINIC_URL: env.NEXT_PUBLIC_CLINIC_API_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
    FASHION_URL: env.NEXT_PUBLIC_FASHION_API_URL || 'http://localhost:4002/api/v1',
    VERSION: env.NEXT_PUBLIC_API_VERSION,
    TIMEOUT: {
      REQUEST: 30000,
      UPLOAD: 120000,
      DOWNLOAD: 60000,
    },
    RETRY: {
      MAX_ATTEMPTS: 3,
      DELAY: 1000,
      BACKOFF_MULTIPLIER: 2,
    },
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 120,
      REQUESTS_PER_HOUR: 5000,
      CONCURRENT_REQUESTS: 10,
    },
    CACHE: {
      TTL: 5 * 60 * 1000,
      STALE_TIME: 5 * 60 * 1000,
      MAX_AGE: 30 * 60 * 1000,
      MAX_SIZE: 100000,
    },
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 20,
      MAX_PAGE_SIZE: 100,
      LARGE_LIST_PAGE_SIZE: 50,
    },
    BATCHING: {
      ENABLED: true,
      MAX_BATCH_SIZE: 50,
      BATCH_DELAY: 100,
      MAX_WAIT_TIME: 500,
    },
  },
  
  // ============================================
  // WEBSOCKET CONFIGURATION
  // ============================================
  WEBSOCKET: {
    URL: env.NEXT_PUBLIC_WEBSOCKET_URL || env.NEXT_PUBLIC_WS_URL || currentEnvDefaults.websocketUrl,
    TIMEOUT: parseInt(env.NEXT_PUBLIC_WS_TIMEOUT || '10000', 10),
    MAX_RECONNECT_ATTEMPTS: parseInt(env.NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS || '5', 10),
  },
  
  // ============================================
  // AUTHENTICATION CONFIGURATION
  // ============================================
  AUTH: {
    ENABLED: env.NEXT_PUBLIC_AUTH_ENABLED,
    GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    FACEBOOK_APP_ID: env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    APPLE_CLIENT_ID: env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
  },
  
  // ============================================
  // CLINIC CONFIGURATION
  // ============================================
  CLINIC: {
    ID: env.NEXT_PUBLIC_CLINIC_ID || 'CL0002',
    APP_NAME: env.NEXT_PUBLIC_APP_NAME || 'Healthcare',
  },
  
  // ============================================
  // APP CONFIGURATION
  // ============================================
  APP: {
    URL: env.NEXT_PUBLIC_APP_URL || currentEnvDefaults.appUrl,
    VERSION: env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // ============================================
  // THIRD-PARTY SERVICES
  // ============================================
  SERVICES: {
    GOOGLE_MAPS_API_KEY: env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    RAZORPAY_KEY: env.NEXT_PUBLIC_RAZORPAY_KEY || '',
  },
  
  // ============================================
  // FIREBASE CONFIGURATION
  // ============================================
  FIREBASE: {
    API_KEY: env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    AUTH_DOMAIN: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    PROJECT_ID: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    STORAGE_BUCKET: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    MESSAGING_SENDER_ID: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    APP_ID: env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    VAPID_KEY: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
  },
  
  // ============================================
  // FEATURE FLAGS
  // ============================================
  FEATURES: {
    REAL_TIME: env.NEXT_PUBLIC_ENABLE_REAL_TIME,
    VIDEO_CALLS: env.NEXT_PUBLIC_ENABLE_VIDEO_CALLS,
    NOTIFICATIONS: env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
    ANALYTICS: env.NEXT_PUBLIC_ENABLE_ANALYTICS || currentEnvDefaults.enableAnalytics,
    HTTPS: env.NEXT_PUBLIC_ENABLE_HTTPS,
    CORS: env.NEXT_PUBLIC_ENABLE_CORS,
    DEBUG: currentEnvDefaults.enableDebug,
  },
  
  // ============================================
  // DEBUG & MONITORING
  // ============================================
  DEBUG: {
    BACKEND_STATUS: env.NEXT_PUBLIC_DEBUG_BACKEND_STATUS,
    HEALTH_CHECK_INTERVAL: parseInt(env.NEXT_PUBLIC_HEALTH_CHECK_INTERVAL || '15000', 10),
    BACKEND_URL: env.NEXT_PUBLIC_BACKEND_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
  },
  
  // ============================================
  // LOGGING CONFIGURATION
  // ============================================
  LOGGING: {
    LEVEL: (env.NEXT_PUBLIC_LOG_LEVEL || currentEnvDefaults.logLevel) as 'debug' | 'info' | 'warn' | 'error',
    ENABLE_CONSOLE: env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS || isDevelopment,
  },
} as const;

// ============================================================================
// API ENDPOINTS (Keep existing structure for backward compatibility)
// ============================================================================

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
    DOCTOR_AVAILABILITY: (doctorId: string) => `/appointments/doctor/${doctorId}/availability`,
    UPDATE_AVAILABILITY: (doctorId: string) => `/appointments/doctor/${doctorId}/availability`,
    QUEUE: {
      GET: (queueType: string) => `/appointments/queue/${queueType}`,
      ADD: '/appointments/queue/add',
      REMOVE: (queueId: string) => `/appointments/queue/${queueId}`,
      CALL_NEXT: (queueType: string) => `/appointments/queue/${queueType}/call-next`,
      REORDER: (queueType: string) => `/appointments/queue/${queueType}/reorder`,
      STATS: '/appointments/queue/stats',
      ANALYTICS: '/appointments/queue/analytics',
    },
    QR: {
      GENERATE: (appointmentId: string) => `/appointments/${appointmentId}/qr`,
      VERIFY: '/appointments/verify-qr',
    },
    NOTIFICATIONS: {
      GET: (userId: string) => `/appointments/notifications/${userId}`,
      SEND_REMINDER: (appointmentId: string) => `/appointments/${appointmentId}/reminder`,
      MARK_READ: (notificationId: string) => `/appointments/notifications/${notificationId}/read`,
    },
    ANALYTICS: '/appointments/analytics/wait-times',
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
  
  // Billing Endpoints
  BILLING: {
    PLANS: {
      BASE: '/billing/plans',
      GET_ALL: '/billing/plans',
      GET_BY_ID: (id: string) => `/billing/plans/${id}`,
      CREATE: '/billing/plans',
      UPDATE: (id: string) => `/billing/plans/${id}`,
      DELETE: (id: string) => `/billing/plans/${id}`,
    },
    SUBSCRIPTIONS: {
      BASE: '/billing/subscriptions',
      CREATE: '/billing/subscriptions',
      GET_BY_ID: (id: string) => `/billing/subscriptions/${id}`,
      GET_USER_SUBSCRIPTIONS: (userId: string) => `/billing/subscriptions/user/${userId}`,
      GET_ACTIVE: (userId: string) => `/billing/subscriptions/user/${userId}/active`,
      UPDATE: (id: string) => `/billing/subscriptions/${id}`,
      CANCEL: (id: string) => `/billing/subscriptions/${id}/cancel`,
      RENEW: (id: string) => `/billing/subscriptions/${id}/renew`,
      USAGE_STATS: (id: string) => `/billing/subscriptions/${id}/usage-stats`,
      RESET_QUOTA: (id: string) => `/billing/subscriptions/${id}/reset-quota`,
      CAN_BOOK: (id: string) => `/billing/subscriptions/${id}/can-book-appointment`,
      CHECK_COVERAGE: (id: string) => `/billing/subscriptions/${id}/check-coverage`,
      BOOK_APPOINTMENT: (subscriptionId: string, appointmentId: string) => 
        `/billing/subscriptions/${subscriptionId}/book-appointment/${appointmentId}`,
      PROCESS_PAYMENT: (id: string) => `/billing/subscriptions/${id}/process-payment`,
    },
    INVOICES: {
      BASE: '/billing/invoices',
      CREATE: '/billing/invoices',
      GET_BY_ID: (id: string) => `/billing/invoices/${id}`,
      GET_USER_INVOICES: (userId: string) => `/billing/invoices/user/${userId}`,
      UPDATE: (id: string) => `/billing/invoices/${id}`,
      MARK_PAID: (id: string) => `/billing/invoices/${id}/mark-paid`,
      GENERATE_PDF: (id: string) => `/billing/invoices/${id}/generate-pdf`,
      SEND_WHATSAPP: (id: string) => `/billing/invoices/${id}/send-whatsapp`,
      DOWNLOAD: (fileName: string) => `/billing/invoices/download/${fileName}`,
    },
    PAYMENTS: {
      BASE: '/billing/payments',
      CREATE: '/billing/payments',
      GET_BY_ID: (id: string) => `/billing/payments/${id}`,
      GET_USER_PAYMENTS: (userId: string) => `/billing/payments/user/${userId}`,
      UPDATE: (id: string) => `/billing/payments/${id}`,
      CALLBACK: '/billing/payments/callback',
      REFUND: (id: string) => `/billing/payments/${id}/refund`,
    },
    APPOINTMENT_PAYMENTS: {
      PROCESS_PAYMENT: (id: string) => `/billing/appointments/${id}/process-payment`,
    },
    ANALYTICS: {
      REVENUE: '/billing/analytics/revenue',
      SUBSCRIPTIONS: '/billing/analytics/subscriptions',
    },
  },
  
  // EHR Endpoints
  EHR: {
    BASE: '/ehr',
    COMPREHENSIVE: (userId: string) => `/ehr/comprehensive/${userId}`,
    MEDICAL_HISTORY: {
      CREATE: '/ehr/medical-history',
      GET_BY_USER: (userId: string) => `/ehr/medical-history/${userId}`,
      UPDATE: (id: string) => `/ehr/medical-history/${id}`,
      DELETE: (id: string) => `/ehr/medical-history/${id}`,
    },
    LAB_REPORTS: {
      CREATE: '/ehr/lab-reports',
      GET_BY_USER: (userId: string) => `/ehr/lab-reports/${userId}`,
      UPDATE: (id: string) => `/ehr/lab-reports/${id}`,
      DELETE: (id: string) => `/ehr/lab-reports/${id}`,
    },
    RADIOLOGY_REPORTS: {
      CREATE: '/ehr/radiology-reports',
      GET_BY_USER: (userId: string) => `/ehr/radiology-reports/${userId}`,
      UPDATE: (id: string) => `/ehr/radiology-reports/${id}`,
      DELETE: (id: string) => `/ehr/radiology-reports/${id}`,
    },
    SURGICAL_RECORDS: {
      CREATE: '/ehr/surgical-records',
      GET_BY_USER: (userId: string) => `/ehr/surgical-records/${userId}`,
      UPDATE: (id: string) => `/ehr/surgical-records/${id}`,
      DELETE: (id: string) => `/ehr/surgical-records/${id}`,
    },
    VITALS: {
      CREATE: '/ehr/vitals',
      GET_BY_USER: (userId: string, type?: string) => 
        `/ehr/vitals/${userId}${type ? `?type=${type}` : ''}`,
      UPDATE: (id: string) => `/ehr/vitals/${id}`,
      DELETE: (id: string) => `/ehr/vitals/${id}`,
    },
    ALLERGIES: {
      CREATE: '/ehr/allergies',
      GET_BY_USER: (userId: string) => `/ehr/allergies/${userId}`,
      UPDATE: (id: string) => `/ehr/allergies/${id}`,
      DELETE: (id: string) => `/ehr/allergies/${id}`,
    },
    MEDICATIONS: {
      CREATE: '/ehr/medications',
      GET_BY_USER: (userId: string, activeOnly?: boolean) => 
        `/ehr/medications/${userId}${activeOnly !== undefined ? `?activeOnly=${activeOnly}` : ''}`,
      UPDATE: (id: string) => `/ehr/medications/${id}`,
      DELETE: (id: string) => `/ehr/medications/${id}`,
    },
    IMMUNIZATIONS: {
      CREATE: '/ehr/immunizations',
      GET_BY_USER: (userId: string) => `/ehr/immunizations/${userId}`,
      UPDATE: (id: string) => `/ehr/immunizations/${id}`,
      DELETE: (id: string) => `/ehr/immunizations/${id}`,
    },
    ANALYTICS: {
      HEALTH_TRENDS: (userId: string, vitalType: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        params.append('vitalType', vitalType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return `/ehr/analytics/health-trends/${userId}?${params.toString()}`;
      },
      MEDICATION_ADHERENCE: (userId: string) => `/ehr/analytics/medication-adherence/${userId}`,
    },
  },
  
  // Video Consultation Endpoints
  VIDEO: {
    BASE: '/video',
    TOKEN: '/video/token',
    CONSULTATION: {
      START: '/video/consultation/start',
      END: '/video/consultation/end',
      STATUS: (appointmentId: string) => `/video/consultation/${appointmentId}/status`,
      REPORT: (appointmentId: string) => `/video/consultation/${appointmentId}/report`,
      SHARE_IMAGE: (appointmentId: string) => `/video/consultation/${appointmentId}/share-image`,
    },
    HISTORY: '/video/history',
    RECORDING: {
      START: '/video/recording/start',
      STOP: '/video/recording/stop',
      GET: (appointmentId: string) => `/video/recording/${appointmentId}`,
    },
    PARTICIPANTS: {
      MANAGE: '/video/participant/manage',
      GET: (appointmentId: string) => `/video/participants/${appointmentId}`,
    },
    ANALYTICS: (appointmentId: string) => `/video/analytics/${appointmentId}`,
    HEALTH: '/video/health',
  },
  
  // Communication Endpoints
  COMMUNICATION: {
    BASE: '/communication',
    SEND: '/communication/send',
    APPOINTMENT_REMINDER: '/communication/appointment/reminder',
    PRESCRIPTION_READY: '/communication/prescription/ready',
    PUSH: {
      SEND: '/communication/push',
      SEND_MULTIPLE: '/communication/push/multiple',
      SEND_TOPIC: '/communication/push/topic',
      SUBSCRIBE: '/communication/push/subscribe',
      UNSUBSCRIBE: '/communication/push/unsubscribe',
      REGISTER_DEVICE_TOKEN: '/communication/push/device-token',
    },
    EMAIL: {
      SEND: '/communication/email',
    },
    CHAT: {
      BACKUP: '/communication/chat/backup',
      HISTORY: (userId: string) => `/communication/chat/history/${userId}`,
      STATS: '/communication/chat/stats',
    },
    STATS: '/communication/stats',
    HEALTH: '/communication/health',
    TEST: '/communication/test',
  },
  
  // Notifications Endpoints (Deprecated - use COMMUNICATION)
  NOTIFICATIONS: {
    BASE: '/notifications',
    PUSH: {
      SEND: '/notifications/push',
      SEND_MULTIPLE: '/notifications/push/multiple',
      SEND_TOPIC: '/notifications/push/topic',
      SUBSCRIBE: '/notifications/push/subscribe',
      UNSUBSCRIBE: '/notifications/push/unsubscribe',
    },
    EMAIL: {
      SEND: '/notifications/email',
    },
    APPOINTMENT_REMINDER: '/notifications/appointment-reminder',
    PRESCRIPTION_READY: '/notifications/prescription-ready',
    UNIFIED: '/notifications/unified',
    CHAT: {
      BACKUP: '/notifications/chat-backup',
      HISTORY: (userId: string) => `/notifications/chat-history/${userId}`,
      STATS: '/notifications/chat-stats',
    },
    STATS: '/notifications/stats',
    HEALTH: '/notifications/health',
    TEST: '/notifications/test',
  },
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

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

// ============================================================================
// ERROR CODES
// ============================================================================

export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_LENGTH: 'VALIDATION_INVALID_LENGTH',
  VALIDATION_INVALID_VALUE: 'VALIDATION_INVALID_VALUE',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_DELETED: 'RESOURCE_DELETED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION: 'INVALID_OPERATION',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ApiResponse<T = unknown> {
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

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, unknown>;
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
  details?: Record<string, unknown>;
}

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

// ============================================================================
// VALIDATION & INITIALIZATION
// ============================================================================

function validateEnvironment(): void {
  const requiredVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_API_VERSION'];
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Current environment: ${currentEnvironment}\n` +
      `Please check your .env file.`
    );
  }

  const apiUrl = env.NEXT_PUBLIC_API_URL || APP_CONFIG.API.BASE_URL;
  if (apiUrl) {
    try {
      new URL(apiUrl);
    } catch {
      console.error(
        `❌ Invalid API URL format: ${apiUrl}\n` +
        `Please provide a valid URL (e.g., http://localhost:8088 or https://api.example.com)`
      );
    }
  }
}

function logEnvironmentInfo(): void {
  if (isProduction && !APP_CONFIG.FEATURES.DEBUG) {
    return;
  }

  console.log('🌍 Environment Configuration:', {
    environment: currentEnvironment,
    apiUrl: APP_CONFIG.API.BASE_URL,
    websocketUrl: APP_CONFIG.WEBSOCKET.URL,
    debug: APP_CONFIG.FEATURES.DEBUG,
    analytics: APP_CONFIG.FEATURES.ANALYTICS,
    logLevel: APP_CONFIG.LOGGING.LEVEL,
  });
}

// Initialize validation on import (server-side only)
if (typeof window === 'undefined') {
  validateEnvironment();
  if (isDevelopment || isStaging) {
    logEnvironmentInfo();
  }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default APP_CONFIG;
