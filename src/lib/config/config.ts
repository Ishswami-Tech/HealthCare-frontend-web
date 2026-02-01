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
  NEXT_PUBLIC_API_PREFIX: z.string().optional(),  // ✅ API prefix (e.g., /api/v1)
  NEXT_PUBLIC_CLINIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_FASHION_API_URL: z.string().optional(),
  
  // WebSocket Configuration
  NEXT_PUBLIC_WEBSOCKET_URL: z.string().optional(),
  NEXT_PUBLIC_WS_URL: z.string().optional(),
  NEXT_PUBLIC_WS_TIMEOUT: z.string().optional(),
  NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS: z.string().optional(),
  
  // Authentication Configuration
  NEXT_PUBLIC_AUTH_ENABLED: z.string().optional().transform(val => val === 'true'),
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
  
  // Video Configuration
  NEXT_PUBLIC_OPENVIDU_SERVER_URL: z.string().optional(),
  NEXT_PUBLIC_JITSI_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_JITSI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_JITSI_WS_URL: z.string().optional(),
  
  // App Domain Configuration
  NEXT_PUBLIC_MAIN_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FRONTEND_DOMAIN: z.string().optional(),
  
  // Feature Flags
  NEXT_PUBLIC_ENABLE_REAL_TIME: z.string().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_VIDEO_CALLS: z.string().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_NOTIFICATIONS: z.string().default('true').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().default('false').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_HTTPS: z.string().default('false').transform(val => val === 'true'),
  NEXT_PUBLIC_ENABLE_CORS: z.string().default('true').transform(val => val === 'true'),
  
  // Debug & Monitoring
  NEXT_PUBLIC_DEBUG_BACKEND_STATUS: z.string().default('false').transform(val => val === 'true'),
  NEXT_PUBLIC_HEALTH_CHECK_INTERVAL: z.string().optional(),
  NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
  
  // Logging
  NEXT_PUBLIC_LOG_LEVEL: z.string().default('info'),
  NEXT_PUBLIC_ENABLE_CONSOLE_LOGS: z.string().default('false').transform(val => val === 'true'),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// ============================================================================
// ENVIRONMENT-SPECIFIC DEFAULTS
// ============================================================================

// ⚠️ SECURITY: No hardcoded URLs - all URLs must come from environment variables
// This prevents exposing internal infrastructure details in the codebase
const envDefaults = {
  development: {
    // Development defaults - fallback to localhost only if env vars are not set
    // This prevents "Invalid URL" errors during SSR when env vars aren't loaded yet
    // In production, env vars MUST be set (no fallbacks)
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088',
    // ✅ FIX: Socket.IO expects base HTTP URL, not ws:// with /socket.io
    // Socket.IO automatically handles protocol upgrade and path
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8088',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    enableDebug: true,
    enableAnalytics: false,
    logLevel: 'debug' as const,
  },
  staging: {
    // Staging - all URLs must come from env vars
    apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    enableDebug: true,
    enableAnalytics: true,
    logLevel: 'info' as const,
  },
  production: {
    // ⚠️ SECURITY: All URLs MUST be provided via environment variables
    // No hardcoded URLs - prevents accidental exposure and allows flexible deployment
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_WS_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
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
    // ✅ API prefix is now configurable via environment variable
    PREFIX: env.NEXT_PUBLIC_API_PREFIX || '/api/v1',
    // Raw backend URL without prefix (for health checks, etc.)
    RAW_URL: env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
    // Backend uses /api/v1 prefix for all API endpoints (see HealthCareBackend/src/main.ts line 768)
    BASE_URL: `${env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl}${env.NEXT_PUBLIC_API_PREFIX || '/api/v1'}`,
    CLINIC_URL: `${env.NEXT_PUBLIC_CLINIC_API_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl}${env.NEXT_PUBLIC_API_PREFIX || '/api/v1'}`,
    // Health endpoint is excluded from /api/v1 prefix (public endpoint)
    HEALTH_BASE_URL: env.NEXT_PUBLIC_API_BASE_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
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
    ENABLED: env.NEXT_PUBLIC_AUTH_ENABLED ?? true,
    GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    FACEBOOK_APP_ID: env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    APPLE_CLIENT_ID: env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
  },
  
  // ============================================
  // CLINIC CONFIGURATION
  // ============================================
  CLINIC: {
    // ✅ Trim clinic ID to prevent whitespace issues
    ID: env.NEXT_PUBLIC_CLINIC_ID?.trim() || 'CL0002',
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
  // VIDEO CONFIGURATION (OpenVidu + Jitsi)
  // ============================================
  VIDEO: {
    // ⚠️ SECURITY: Video server URLs must come from environment variables
    OPENVIDU_URL: env.NEXT_PUBLIC_OPENVIDU_SERVER_URL || '',
    // Jitsi Configuration (Fallback Video Provider)
    JITSI: {
      DOMAIN: env.NEXT_PUBLIC_JITSI_DOMAIN || '',
      BASE_URL: env.NEXT_PUBLIC_JITSI_BASE_URL || '',
      WS_URL: env.NEXT_PUBLIC_JITSI_WS_URL || '',
    },
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
    BACKEND_STATUS: env.NEXT_PUBLIC_DEBUG_BACKEND_STATUS ?? false,
    HEALTH_CHECK_INTERVAL: parseInt(env.NEXT_PUBLIC_HEALTH_CHECK_INTERVAL || '15000', 10),
    BACKEND_URL: env.NEXT_PUBLIC_BACKEND_URL || env.NEXT_PUBLIC_API_URL || currentEnvDefaults.apiUrl,
  },
  
  // ============================================
  // LOGGING CONFIGURATION
  // ============================================
  LOGGING: {
    LEVEL: (env.NEXT_PUBLIC_LOG_LEVEL || currentEnvDefaults.logLevel) as 'debug' | 'info' | 'warn' | 'error',
    ENABLE_CONSOLE: env.NEXT_PUBLIC_ENABLE_CONSOLE_LOGS ?? isDevelopment,
  },
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // Authentication Endpoints
  
  AUTH: {
    BASE: '/auth',
    // ✅ Backend endpoints (verified)
    LOGIN: '/auth/login',                    // POST /auth/login
    REGISTER: '/auth/register',              // POST /auth/register
    REFRESH: '/auth/refresh',                // POST /auth/refresh
    LOGOUT: '/auth/logout',                  // POST /auth/logout
    FORGOT_PASSWORD: '/auth/forgot-password', // POST /auth/forgot-password
    RESET_PASSWORD: '/auth/reset-password',  // POST /auth/reset-password
    CHANGE_PASSWORD: '/auth/change-password', // POST /auth/change-password
    REQUEST_OTP: '/auth/request-otp',        // POST /auth/request-otp
    VERIFY_OTP: '/auth/verify-otp',           // POST /auth/verify-otp
    SESSIONS: '/auth/sessions',              // GET /auth/sessions ✅ Added
    GOOGLE_LOGIN: '/auth/google',            // POST /auth/google
    // Additional endpoints (frontend-specific or future)
    REGISTER_WITH_CLINIC: '/auth/register-with-clinic',
    CHECK_OTP_STATUS: '/auth/check-otp-status',
    INVALIDATE_OTP: '/auth/invalidate-otp',
    MAGIC_LINK: '/auth/magic-link',
    VERIFY_MAGIC_LINK: '/auth/verify-magic-link',
    VERIFY_EMAIL: '/auth/verify-email',
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
    MY_APPOINTMENTS: '/appointments/my-appointments', // Patient-specific endpoint
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
  
  // Queue Endpoints (Standalone queue management)
  QUEUE: {
    BASE: '/queue',
    GET: '/queue',
    STATS: '/queue/stats',
    UPDATE_STATUS: (patientId: string) => `/queue/${patientId}/status`,
    CALL_NEXT: '/queue/call-next',
    ADD: '/queue',
    REMOVE: (queueId: string) => `/queue/${queueId}`,
    REORDER: '/queue/reorder',
    HISTORY: '/queue/history',
    ANALYTICS: '/queue/analytics',
    UPDATE_POSITION: (queueId: string) => `/queue/${queueId}/position`,
    PAUSE: '/queue/pause',
    RESUME: '/queue/resume',
    CONFIG: '/queue/config',
    NOTIFICATIONS: {
      GET: '/queue/notifications',
      MARK_READ: (notificationId: string) => `/queue/notifications/${notificationId}/read`,
      SEND: '/queue/notifications',
    },
    WAIT_TIMES: '/queue/wait-times',
    ESTIMATE_WAIT_TIME: '/queue/estimate-wait-time',
    CAPACITY: '/queue/capacity',
    PERFORMANCE: '/queue/performance',
    EXPORT: '/queue/export',
    ALERTS: {
      GET: '/queue/alerts',
      CREATE: '/queue/alerts',
      UPDATE: (alertId: string) => `/queue/alerts/${alertId}`,
      DELETE: (alertId: string) => `/queue/alerts/${alertId}`,
    },
  },
  
  // Pharmacy Endpoints
  PHARMACY: {
    BASE: '/pharmacy',
    MEDICINES: {
      GET_BY_ID: (medicineId: string) => `/pharmacy/medicines/${medicineId}`,
      GET_CLINIC_INVENTORY: (clinicId: string) => `/clinics/${clinicId}/medicines/inventory`,
      CREATE: (clinicId: string) => `/clinics/${clinicId}/medicines`,
      UPDATE: (clinicId: string, medicineId: string) => `/clinics/${clinicId}/medicines/${medicineId}`,
      DELETE: (clinicId: string, medicineId: string) => `/clinics/${clinicId}/medicines/${medicineId}`,
    },
    PRESCRIPTIONS: {
      GET: (prescriptionId: string) => `/pharmacy/prescriptions/${prescriptionId}`,
      CREATE: (clinicId: string) => `/clinics/${clinicId}/prescriptions`,
      UPDATE_STATUS: (prescriptionId: string) => `/pharmacy/prescriptions/${prescriptionId}/status`,
      DISPENSE: (prescriptionId: string) => `/pharmacy/prescriptions/${prescriptionId}/dispense`,
    },
    INVENTORY: {
      UPDATE: (clinicId: string, medicineId: string) => `/clinics/${clinicId}/pharmacy/inventory/${medicineId}`,
    },
    ORDERS: {
      CREATE: (clinicId: string) => `/clinics/${clinicId}/pharmacy/orders`,
    },
    STATS: (clinicId: string) => `/clinics/${clinicId}/pharmacy/stats`,
    SEARCH: (clinicId: string) => `/clinics/${clinicId}/medicines/search`,
    CATEGORIES: '/pharmacy/categories',
    SUPPLIERS: '/pharmacy/suppliers',
    EXPORT: (clinicId: string) => `/clinics/${clinicId}/pharmacy/export`,
  },
  
  // Patients Endpoints
  PATIENTS: {
    BASE: '/patients',
    GET_ALL: '/patients',
    GET_CLINIC_PATIENTS: (clinicId: string) => `/clinics/${clinicId}/patients`,
    GET_BY_ID: (clinicId: string, patientId: string) => `/clinics/${clinicId}/patients/${patientId}`,
    CREATE: '/patients',
    UPDATE: (patientId: string) => `/patients/${patientId}`,
    DELETE: (patientId: string) => `/patients/${patientId}`,
    APPOINTMENTS: (patientId: string) => `/patients/${patientId}/appointments`,
    MEDICAL_HISTORY: {
      GET: (clinicId: string, patientId: string) => `/clinics/${clinicId}/patients/${patientId}/medical-history`,
      CREATE: (clinicId: string, patientId: string) => `/clinics/${clinicId}/patients/${patientId}/medical-history`,
    },
    VITALS: {
      GET: (patientId: string) => `/patients/${patientId}/vitals`,
      CREATE: (patientId: string) => `/patients/${patientId}/vitals`,
    },
    LAB_RESULTS: {
      GET: (patientId: string) => `/patients/${patientId}/lab-results`,
      CREATE: (patientId: string) => `/patients/${patientId}/lab-results`,
    },
    TIMELINE: (patientId: string) => `/patients/${patientId}/timeline`,
    STATS: (patientId: string) => `/patients/${patientId}/stats`,
    SEARCH: '/patients/search',
    EXPORT: '/patients/export',
    CARE_PLAN: {
      GET: (patientId: string) => `/patients/${patientId}/care-plan`,
      UPDATE: (patientId: string) => `/patients/${patientId}/care-plan`,
    },
  },
  
  // Doctors Endpoints
  DOCTORS: {
    BASE: '/doctors',
    GET_ALL: '/doctors',
    GET_CLINIC_DOCTORS: (clinicId: string) => `/clinics/${clinicId}/doctors`,
    GET_BY_ID: (doctorId: string) => `/doctors/${doctorId}`,
    CREATE: '/doctors',
    UPDATE: (doctorId: string) => `/doctors/${doctorId}`,
    DELETE: (doctorId: string) => `/doctors/${doctorId}`,
    SCHEDULE: {
      GET: (clinicId: string, doctorId: string) => `/clinics/${clinicId}/doctors/${doctorId}/schedule`,
      UPDATE: (doctorId: string) => `/doctors/${doctorId}/schedule`,
    },
    AVAILABILITY: {
      GET: (doctorId: string) => `/doctors/${doctorId}/availability`,
      UPDATE: (doctorId: string) => `/doctors/${doctorId}/availability`,
    },
    APPOINTMENTS: (doctorId: string) => `/doctors/${doctorId}/appointments`,
    PATIENTS: (clinicId: string, doctorId: string) => `/clinics/${clinicId}/doctors/${doctorId}/patients`,
    STATS: (doctorId: string) => `/doctors/${doctorId}/stats`,
    REVIEWS: {
      GET: (doctorId: string) => `/doctors/${doctorId}/reviews`,
      CREATE: (doctorId: string) => `/doctors/${doctorId}/reviews`,
    },
    SPECIALIZATIONS: '/doctors/specializations',
    SEARCH: '/doctors/search',
    PERFORMANCE: (doctorId: string) => `/doctors/${doctorId}/performance`,
    PROFILE: {
      UPDATE: (doctorId: string) => `/doctors/${doctorId}/profile`,
    },
    EARNINGS: (doctorId: string) => `/doctors/${doctorId}/earnings`,
    EXPORT: '/doctors/export',
  },

  // Staff Endpoints
  STAFF: {
    BASE: '/staff',
    GET_ALL: '/staff',
    GET_BY_ID: (id: string) => `/staff/${id}`,
    CREATE: '/staff',
    UPDATE: (id: string) => `/staff/${id}`,
    DELETE: (id: string) => `/staff/${id}`,
  },
  
  // Users Endpoints (Updated to /users for naming consistency)
  USERS: {
    BASE: '/user',
    PROFILE: '/user/profile',
    GET_BY_ID: (id: string) => `/user/${id}`,
    UPDATE: (id: string) => `/user/${id}`,
    DELETE: (id: string) => `/user/${id}`,
    GET_ALL: '/user/all',
    CREATE: '/user',
    GET_BY_ROLE: {
      PATIENT: '/user/role/patient',
      DOCTORS: '/user/role/doctors',
      RECEPTIONISTS: '/user/role/receptionists',
    },
    UPDATE_ROLE: (id: string) => `/user/${id}/role`,
    CHANGE_LOCATION: (id: string) => `/user/${id}/change-location`,
    SESSIONS: {
      GET_ALL: '/user/sessions',
      REVOKE: (sessionId: string) => `/user/sessions/${sessionId}`,
      REVOKE_ALL: '/user/sessions/revoke-all',
    },
  },
  
  // Health Check Endpoints (Public, no /api/v1 prefix)
  HEALTH: {
    BASE: '/health',
    DETAILED: '/health?detailed=true',
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
    // Video Appointments Management
    APPOINTMENTS: {
      BASE: '/video-appointments',
      CREATE: '/video-appointments',
      GET_ALL: (clinicId: string) => `/clinics/${clinicId}/video-appointments`,
      GET_BY_ID: (id: string) => `/video-appointments/${id}`,
      UPDATE: (appointmentId: string) => `/video-appointments/${appointmentId}`,
      DELETE: (appointmentId: string) => `/video-appointments/${appointmentId}`,
      JOIN: (appointmentId: string) => `/video-appointments/${appointmentId}/join`,
      END: (appointmentId: string) => `/video-appointments/${appointmentId}/end`,
      RECORDING: (appointmentId: string) => `/video-appointments/${appointmentId}/recording`,
    },
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
    // Phase 1 & 2 Features - Backend uses consultationId
    CHAT: {
      SEND: '/video/chat/send',
      GET: (consultationId: string) => `/video/chat/${consultationId}/history`,
      TYPING: '/video/chat/typing',
    },
    WAITING_ROOM: {
      JOIN: '/video/waiting-room/join',
      LEAVE: '/video/waiting-room/leave',
      GET_QUEUE: (consultationId: string) => `/video/waiting-room/${consultationId}/queue`,
      ADMIT: '/video/waiting-room/admit',
    },
    NOTES: {
      CREATE: '/video/notes',
      UPDATE: (noteId: string) => `/video/notes/${noteId}`,
      GET: (consultationId: string) => `/video/notes/${consultationId}`,
      DELETE: (noteId: string) => `/video/notes/${noteId}`,
      SAVE_TO_EHR: (noteId: string) => `/video/notes/${noteId}/save-to-ehr`,
    },
    QUALITY: {
      UPDATE: '/video/quality/update',
      GET: (consultationId: string, userId: string) => `/video/quality/${consultationId}/${userId}`,
    },
    ANNOTATION: {
      CREATE: '/video/annotations',
      GET: (consultationId: string) => `/video/annotations/${consultationId}`,
      DELETE: (annotationId: string) => `/video/annotations/${annotationId}`,
    },
    TRANSCRIPTION: {
      CREATE: '/video/transcription',
      GET: (consultationId: string) => `/video/transcription/${consultationId}`,
      SEARCH: (consultationId: string) => `/video/transcription/${consultationId}/search`,
      SAVE_TO_EHR: (consultationId: string) => `/video/transcription/${consultationId}/save-to-ehr`,
    },
    RECORDING_ENHANCED: {
      PAUSE: (appointmentId: string) => `/video/recording/${appointmentId}/pause`,
      RESUME: (appointmentId: string) => `/video/recording/${appointmentId}/resume`,
      SET_QUALITY: (appointmentId: string) => `/video/recording/${appointmentId}/quality`,
    },
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
    MESSAGING: {
      SMS: '/messaging/sms',
      EMAIL: '/messaging/email',
      WHATSAPP: '/messaging/whatsapp',
      TEMPLATES: {
        BASE: '/messaging/templates',
        GET: (templateId: string) => `/messaging/templates/${templateId}`,
        CREATE: '/messaging/templates',
        UPDATE: (templateId: string) => `/messaging/templates/${templateId}`,
        DELETE: (templateId: string) => `/messaging/templates/${templateId}`,
      },
      HISTORY: '/messaging/history',
      STATS: '/messaging/stats',
      SCHEDULE: {
        BASE: '/messaging/schedule',
        GET: (messageId: string) => `/messaging/schedule/${messageId}`,
        CREATE: '/messaging/schedule',
        DELETE: (messageId: string) => `/messaging/schedule/${messageId}`,
      },
    },
    STATS: '/communication/stats',
    ANALYTICS: '/communication/analytics',
    HEALTH: '/communication/health',
    TEST: '/communication/test',
  },
  
  // Notification Preferences Endpoints
  NOTIFICATION_PREFERENCES: {
    BASE: '/notification-preferences',
    GET_MY: '/notification-preferences/me',
    GET_BY_USER: (userId: string) => `/notification-preferences/${userId}`,
    CREATE: '/notification-preferences',
    UPDATE: (userId: string) => `/notification-preferences/${userId}`,
    DELETE: (userId: string) => `/notification-preferences/${userId}`,
  },
  
  // Email Unsubscribe Endpoints (Backend-only - no frontend integration needed)
  // Backend handles unsubscribe directly via /api/v1/email/unsubscribe?token=...
  // Frontend integration not required - backend returns JSON response
  // EMAIL_UNSUBSCRIBE: {
  //   BASE: '/email/unsubscribe',
  //   UNSUBSCRIBE: (token: string) => `/email/unsubscribe/${token}`,
  //   VERIFY: (token: string) => `/email/unsubscribe/verify/${token}`,
  //   PROCESS: (token: string) => `/email/unsubscribe/${token}`,
  // },
  
  // EHR Clinic Endpoints (Clinic-wide EHR features)
  EHR_CLINIC: {
    BASE: '/ehr/clinic',
    COMPREHENSIVE: (userId: string) => `/ehr/clinic/comprehensive/${userId}`,
    PATIENT_RECORDS: (clinicId: string) => `/ehr/clinic/${clinicId}/patients/records`,
    ANALYTICS: (clinicId: string) => `/ehr/clinic/${clinicId}/analytics`,
    PATIENT_SUMMARY: (clinicId: string) => `/ehr/clinic/${clinicId}/patients/summary`,
    SEARCH: (clinicId: string) => `/ehr/clinic/${clinicId}/search`,
    CRITICAL_ALERTS: (clinicId: string) => `/ehr/clinic/${clinicId}/alerts/critical`,
  },
  
  // Plugin Endpoints (Optional - Admin-only tool for plugin monitoring/management)
  // Note: Plugins are automatically used by the appointment system - these endpoints
  // are only for admin monitoring, configuration, and manual execution.
  // Frontend integration is optional since plugins work automatically.
  // PLUGINS: {
  //   BASE: '/api/appointments/plugins',
  //   INFO: '/api/appointments/plugins/info',
  //   BY_DOMAIN: (domain: string) => `/api/appointments/plugins/domain/${domain}`,
  //   DOMAIN_FEATURES: (domain: string) => `/api/appointments/plugins/domain/${domain}/features`,
  //   EXECUTE: '/api/appointments/plugins/execute',
  //   EXECUTE_BATCH: '/api/appointments/plugins/execute-batch',
  //   HEALTH: '/api/appointments/plugins/health',
  //   HEALTH_METRICS: '/api/appointments/plugins/health/metrics',
  //   HEALTH_DOMAIN: (domain: string) => `/api/appointments/plugins/health/domain/${domain}`,
  //   HEALTH_ALERTS: '/api/appointments/plugins/health/alerts',
  //   CONFIG: '/api/appointments/plugins/config',
  //   CONFIG_BY_NAME: (pluginName: string) => `/api/appointments/plugins/config/${pluginName}`,
  //   UPDATE_CONFIG: (pluginName: string) => `/api/appointments/plugins/config/${pluginName}`,
  // },
  
  // Medical Records Endpoints
  MEDICAL_RECORDS: {
    BASE: '/medical-records',
    GET_BY_PATIENT: (patientId: string) => `/medical-records/patient/${patientId}`,
    CREATE: '/medical-records',
    UPDATE: (recordId: string) => `/medical-records/${recordId}`,
    DELETE: (recordId: string) => `/medical-records/${recordId}`,
    GET_BY_ID: (recordId: string) => `/medical-records/${recordId}`,
    UPLOAD: (recordId: string) => `/medical-records/${recordId}/upload`,
    TEMPLATES: {
      GET: '/medical-records/templates',
      CREATE: '/medical-records/templates',
    },
  },
  
  // Prescriptions Endpoints
  PRESCRIPTIONS: {
    BASE: '/prescriptions',
    GET_BY_PATIENT: (patientId: string) => `/pharmacy/prescriptions/patient/${patientId}`,
    CREATE: '/prescriptions',
    UPDATE: (prescriptionId: string) => `/prescriptions/${prescriptionId}`,
    GET_BY_ID: (prescriptionId: string) => `/prescriptions/${prescriptionId}`,
    GENERATE_PDF: (prescriptionId: string) => `/prescriptions/${prescriptionId}/pdf`,
  },
  
  // Medicines Endpoints
  MEDICINES: {
    BASE: '/medicines',
    GET_ALL: '/medicines',
    CREATE: '/medicines',
    UPDATE: (medicineId: string) => `/medicines/${medicineId}`,
    DELETE: (medicineId: string) => `/medicines/${medicineId}`,
    SEARCH: '/medicines/search',
    INTERACTIONS: '/medicines/interactions',
    INVENTORY: {
      GET: '/medicines/inventory',
      UPDATE: (medicineId: string) => `/medicines/${medicineId}/inventory`,
    },
  },
  
  // Analytics Endpoints
  ANALYTICS: {
    BASE: '/analytics',
    DASHBOARD: '/analytics/dashboard',
    APPOINTMENTS: '/analytics/appointments',
    PATIENTS: '/analytics/patients',
    REVENUE: '/analytics/revenue',
    DOCTORS_PERFORMANCE: '/analytics/doctors/performance',
    CLINICS_PERFORMANCE: '/analytics/clinics/performance',
    SERVICES_UTILIZATION: '/analytics/services/utilization',
    WAIT_TIMES: '/analytics/wait-times',
    SATISFACTION: '/analytics/satisfaction',
    QUEUE: '/analytics/queue',
    EXPORT: '/analytics/export',
    CUSTOM: '/analytics/custom',
    CUSTOM_QUERIES: {
      CREATE: '/analytics/custom-queries',
      GET_ALL: '/analytics/custom-queries',
    },
  },
  
  // Reports Endpoints
  REPORTS: {
    BASE: '/reports',
    APPOINTMENTS: '/reports/appointments',
    PATIENTS: '/reports/patients',
    REVENUE: '/reports/revenue',
    DOCTORS_PERFORMANCE: '/reports/doctors/performance',
    CLINICS_SUMMARY: '/reports/clinics/summary',
    HISTORY: '/reports/history',
    DOWNLOAD: (reportId: string) => `/reports/${reportId}/download`,
    DELETE: (reportId: string) => `/reports/${reportId}`,
  },
  
  // Clinic Communication Endpoints
  CLINIC_COMMUNICATION: {
    BASE: (clinicId: string) => `/clinics/${clinicId}/communication`,
    GET: (clinicId: string) => `/clinics/${clinicId}/communication`,
    CREATE: (clinicId: string) => `/clinics/${clinicId}/communication`,
    UPDATE: (clinicId: string, id: string) => `/clinics/${clinicId}/communication/${id}`,
    DELETE: (clinicId: string, id: string) => `/clinics/${clinicId}/communication/${id}`,
    TEST: (clinicId: string) => `/clinics/${clinicId}/communication/test`,
  },
} as const;

// ============================================================================
// HTTP STATUS CODES & ERROR CODES
// ============================================================================
// Re-exported from constants.ts for convenience
// You can import from either '@/lib/config/config' or '@/lib/config/constants'

export { HTTP_STATUS, ERROR_CODES } from './constants';

// ============================================================================
// ERROR MESSAGES (User-Facing)
// ============================================================================
// Re-exported from error-messages.ts for convenience

export { ERROR_MESSAGES } from './error-messages';

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
  // ⚠️ SECURITY: In production, all URLs must be set via environment variables
  // No hardcoded URLs allowed to prevent security issues
  // Note: NEXT_PUBLIC_API_VERSION has a default value ('v1') in the schema, so it's not required
  const requiredVars: string[] = ['NEXT_PUBLIC_API_URL'];
  
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  // In production, also require WebSocket URL (check both NEXT_PUBLIC_WEBSOCKET_URL and NEXT_PUBLIC_WS_URL)
  if (isProduction) {
    const hasWebSocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || process.env.NEXT_PUBLIC_WS_URL;
    if (!hasWebSocketUrl) {
      missingVars.push('NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL');
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `⚠️  Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Current environment: ${currentEnvironment}\n` +
      `Please check your .env file.`;
    
    if (isProduction) {
      // In production, throw error to prevent deployment with missing config
      throw new Error(errorMessage);
    } else {
      console.warn(errorMessage);
    }
  }

  // Validate API URL format
  // ⚠️ SECURITY: Only validate if URL is provided (not empty)
  const apiUrl = env.NEXT_PUBLIC_API_URL || APP_CONFIG.API.BASE_URL;
  if (apiUrl && apiUrl.trim() !== '') {
    try {
      new URL(apiUrl);
    } catch {
      const errorMessage = `❌ Invalid API URL format: ${apiUrl}\n` +
        `Please provide a valid URL via NEXT_PUBLIC_API_URL environment variable`;
      
      if (isProduction) {
        throw new Error(errorMessage);
      } else {
        console.error(errorMessage);
      }
    }
  } else if (isProduction) {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production environment');
  } else if (isDevelopment && !apiUrl) {
    // In development, warn but don't fail - allow localhost defaults
    console.warn('⚠️  NEXT_PUBLIC_API_URL not set. Using development defaults.');
  }

  // Validate WebSocket URL format in production
  if (isProduction) {
    const wsUrl = env.NEXT_PUBLIC_WEBSOCKET_URL || env.NEXT_PUBLIC_WS_URL || APP_CONFIG.WEBSOCKET.URL;
    if (wsUrl && wsUrl.trim() !== '') {
      try {
        new URL(wsUrl);
      } catch {
        throw new Error(
          `❌ Invalid WebSocket URL format: ${wsUrl}\n` +
          `Please provide a valid URL via NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL environment variable`
        );
      }
    } else {
      throw new Error('NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL must be set in production environment');
    }
  }
}

// ✅ Singleton flag to prevent multiple logs - use global to persist across module reloads
// Initialize the flag if it doesn't exist
if (typeof global !== 'undefined') {
  if (!(global as any).__hasLoggedEnvironment) {
    (global as any).__hasLoggedEnvironment = false;
  }
}

function logEnvironmentInfo(): void {
  // ✅ Only log once per process to prevent duplicate logs
  // Use global flag to persist across Next.js hot reloads and module re-executions
  if (typeof global === 'undefined') {
    return; // Can't log on client-side
  }
  
  if ((global as any).__hasLoggedEnvironment) {
    return; // Already logged
  }

  if (isProduction && !APP_CONFIG.FEATURES.DEBUG) {
    return; // Don't log in production unless debug is enabled
  }

  // Set flag BEFORE logging to prevent race conditions
  (global as any).__hasLoggedEnvironment = true;
  
  console.warn('🌍 Environment Configuration:', {
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
// ROUTING CONFIGURATION (Re-exported for convenience)
// ============================================================================
// ============================================================================
// WEBSOCKET EXPORTS
// ============================================================================
// ✅ WebSocket exports moved to @/lib/config/websocket to prevent circular dependencies
// Import directly: import { WebSocketManager } from '@/lib/config/websocket'

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default APP_CONFIG;
