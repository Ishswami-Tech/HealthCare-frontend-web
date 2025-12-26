/**
 * @deprecated Use APP_CONFIG from '@/lib/config/config' instead
 * This file is kept for backward compatibility and re-exports from central config
 */

// Re-export everything from central config
export {
  APP_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
  currentEnvironment,
  isDevelopment,
  isStaging,
  isProduction,
  env,
  type Environment,
  type ApiResponse,
  type PaginationParams,
  type PaginatedResponse,
  type ErrorResponse,
  type RequestHeaders,
  type ApiClientConfig,
} from '../config/config';

// Legacy API_CONFIG for backward compatibility - maps to APP_CONFIG
import { APP_CONFIG } from '../config/config';

export const API_CONFIG = {
  ENVIRONMENT: APP_CONFIG.ENVIRONMENT,
  IS_DEVELOPMENT: APP_CONFIG.IS_DEVELOPMENT,
  IS_STAGING: APP_CONFIG.IS_STAGING,
  IS_PRODUCTION: APP_CONFIG.IS_PRODUCTION,
  MOCK_MODE: false,
  BASE_URL: APP_CONFIG.API.BASE_URL,
  CLINIC_API_URL: APP_CONFIG.API.CLINIC_URL,
  FASHION_API_URL: APP_CONFIG.API.FASHION_URL,
  VERSION: APP_CONFIG.API.VERSION,
  TIMEOUTS: APP_CONFIG.API.TIMEOUT,
  RETRY: APP_CONFIG.API.RETRY,
  RATE_LIMIT: APP_CONFIG.API.RATE_LIMIT,
  CACHE: APP_CONFIG.API.CACHE,
  PAGINATION: APP_CONFIG.API.PAGINATION,
  BATCHING: APP_CONFIG.API.BATCHING,
  WEBSOCKET_URL: APP_CONFIG.WEBSOCKET.URL,
  FEATURES: APP_CONFIG.FEATURES,
  LOGGING: APP_CONFIG.LOGGING,
} as const;

// ✅ Export all configurations (legacy)
const config = {
  env,
  API_ENDPOINTS,
  API_CONFIG,
  HTTP_STATUS,
  ERROR_CODES,
};

export default config;
