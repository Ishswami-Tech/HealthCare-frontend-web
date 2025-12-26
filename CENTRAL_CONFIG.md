# 🎯 Central Configuration - Single Source of Truth

## Overview

All application configuration is now centralized in **`src/lib/config/config.ts`**. This is the **ONLY** configuration file used throughout the entire application.

## Usage

### Import the Central Config

```typescript
import { APP_CONFIG } from '@/lib/config/config';
```

### Access Configuration

```typescript
// API Configuration
const apiUrl = APP_CONFIG.API.BASE_URL;
const clinicUrl = APP_CONFIG.API.CLINIC_URL;
const apiVersion = APP_CONFIG.API.VERSION;

// WebSocket Configuration
const wsUrl = APP_CONFIG.WEBSOCKET.URL;
const wsTimeout = APP_CONFIG.WEBSOCKET.TIMEOUT;
const maxReconnectAttempts = APP_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS;

// Authentication
const googleClientId = APP_CONFIG.AUTH.GOOGLE_CLIENT_ID;
const facebookAppId = APP_CONFIG.AUTH.FACEBOOK_APP_ID;

// Clinic Configuration
const clinicId = APP_CONFIG.CLINIC.ID;
const appName = APP_CONFIG.CLINIC.APP_NAME;

// App Configuration
const appUrl = APP_CONFIG.APP.URL;
const appVersion = APP_CONFIG.APP.VERSION;

// Third-party Services
const googleMapsKey = APP_CONFIG.SERVICES.GOOGLE_MAPS_API_KEY;
const razorpayKey = APP_CONFIG.SERVICES.RAZORPAY_KEY;

// Environment Checks
if (APP_CONFIG.IS_DEVELOPMENT) {
  // Development-specific code
}

if (APP_CONFIG.IS_STAGING) {
  // Staging-specific code
}

if (APP_CONFIG.IS_PRODUCTION) {
  // Production-specific code
}

// Feature Flags
if (APP_CONFIG.FEATURES.REAL_TIME) {
  // Real-time features enabled
}

if (APP_CONFIG.FEATURES.DEBUG) {
  console.log('Debug mode enabled');
}

// Logging
const logLevel = APP_CONFIG.LOGGING.LEVEL;
const enableConsole = APP_CONFIG.LOGGING.ENABLE_CONSOLE;
```

## Configuration Structure

### `APP_CONFIG` Object

```typescript
APP_CONFIG = {
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production',
  IS_DEVELOPMENT: boolean,
  IS_STAGING: boolean,
  IS_PRODUCTION: boolean,
  
  // API Configuration
  API: {
    BASE_URL: string,
    CLINIC_URL: string,
    FASHION_URL: string,
    VERSION: string,
    TIMEOUT: { REQUEST, UPLOAD, DOWNLOAD },
    RETRY: { MAX_ATTEMPTS, DELAY, BACKOFF_MULTIPLIER },
    RATE_LIMIT: { REQUESTS_PER_MINUTE, REQUESTS_PER_HOUR, CONCURRENT_REQUESTS },
    CACHE: { TTL, STALE_TIME, MAX_AGE, MAX_SIZE },
    PAGINATION: { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, LARGE_LIST_PAGE_SIZE },
    BATCHING: { ENABLED, MAX_BATCH_SIZE, BATCH_DELAY, MAX_WAIT_TIME },
  },
  
  // WebSocket Configuration
  WEBSOCKET: {
    URL: string,
    TIMEOUT: number,
    MAX_RECONNECT_ATTEMPTS: number,
  },
  
  // Authentication
  AUTH: {
    ENABLED: boolean,
    GOOGLE_CLIENT_ID: string,
    FACEBOOK_APP_ID: string,
    APPLE_CLIENT_ID: string,
  },
  
  // Clinic Configuration
  CLINIC: {
    ID: string,
    APP_NAME: string,
  },
  
  // App Configuration
  APP: {
    URL: string,
    VERSION: string,
  },
  
  // Third-party Services
  SERVICES: {
    GOOGLE_MAPS_API_KEY: string,
    RAZORPAY_KEY: string,
  },
  
  // Feature Flags
  FEATURES: {
    REAL_TIME: boolean,
    VIDEO_CALLS: boolean,
    NOTIFICATIONS: boolean,
    ANALYTICS: boolean,
    HTTPS: boolean,
    CORS: boolean,
    DEBUG: boolean,
  },
  
  // Debug & Monitoring
  DEBUG: {
    BACKEND_STATUS: boolean,
    HEALTH_CHECK_INTERVAL: number,
    BACKEND_URL: string,
  },
  
  // Logging
  LOGGING: {
    LEVEL: 'debug' | 'info' | 'warn' | 'error',
    ENABLE_CONSOLE: boolean,
  },
}
```

## Additional Exports

### API Endpoints

```typescript
import { API_ENDPOINTS } from '@/lib/config/config';

// Usage
const loginUrl = API_ENDPOINTS.AUTH.LOGIN;
const appointmentUrl = API_ENDPOINTS.APPOINTMENTS.GET_BY_ID('123');
```

### HTTP Status Codes

```typescript
import { HTTP_STATUS } from '@/lib/config/config';

if (response.status === HTTP_STATUS.OK) {
  // Handle success
}
```

### Error Codes

```typescript
import { ERROR_CODES } from '@/lib/config/config';

if (error.code === ERROR_CODES.AUTH_TOKEN_EXPIRED) {
  // Handle token expiration
}
```

### Environment Utilities

```typescript
import { 
  currentEnvironment,
  isDevelopment,
  isStaging,
  isProduction 
} from '@/lib/config/config';
```

## Backward Compatibility

The following files are kept for backward compatibility but **re-export from central config**:

- `src/lib/api/config.ts` - Re-exports `APP_CONFIG`, `API_ENDPOINTS`, `API_CONFIG` (legacy)
- `src/lib/config/env.ts` - Re-exports environment utilities

**Note**: New code should import directly from `@/lib/config/config`.

## Migration Guide

### Old Way (Deprecated)

```typescript
// ❌ Don't use this anymore
import { API_CONFIG } from '@/lib/api/config';
import { currentEnvConfig } from '@/lib/config/env';

const apiUrl = API_CONFIG.BASE_URL;
const wsUrl = API_CONFIG.WEBSOCKET_URL;
```

### New Way (Recommended)

```typescript
// ✅ Use this
import { APP_CONFIG } from '@/lib/config/config';

const apiUrl = APP_CONFIG.API.BASE_URL;
const wsUrl = APP_CONFIG.WEBSOCKET.URL;
```

## Files Updated

All files have been updated to use `APP_CONFIG`:

- ✅ `src/components/common/BackendStatusIndicator.tsx`
- ✅ `src/components/integration/BackendHealthCheck.tsx`
- ✅ `src/components/appointments/AppointmentManager.tsx`
- ✅ `src/components/auth/social-login.tsx`
- ✅ `src/components/maps/google-maps.tsx`
- ✅ `src/components/payments/RazorpayPaymentButton.tsx`
- ✅ `src/components/websocket/WebSocketProvider.tsx`
- ✅ `src/lib/api/client.ts`
- ✅ `src/lib/actions/auth.server.ts`
- ✅ `src/lib/websocket/websocket-client.ts`
- ✅ `src/lib/websocket/websocket-manager.ts`
- ✅ `src/app/layout.tsx`

## Environment Variables

All environment variables are defined in:
- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env.example` - Template for all variables

The central config automatically detects the environment and uses the appropriate values.
