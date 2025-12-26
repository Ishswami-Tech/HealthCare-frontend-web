/**
 * @deprecated Use APP_CONFIG from '@/lib/config/config' instead
 * This file is kept for backward compatibility and re-exports from central config
 */

// Re-export everything from central config
export {
  APP_CONFIG,
  currentEnvironment,
  isDevelopment,
  isStaging,
  isProduction,
  type Environment,
} from './config';

// Legacy exports for backward compatibility
import { APP_CONFIG, currentEnvironment, isDevelopment, isStaging, isProduction } from './config';

// Legacy envConfig for backward compatibility
export const envConfig = {
  development: {
    apiUrl: APP_CONFIG.API.BASE_URL,
    websocketUrl: APP_CONFIG.WEBSOCKET.URL,
    enableDebug: APP_CONFIG.FEATURES.DEBUG,
    enableAnalytics: APP_CONFIG.FEATURES.ANALYTICS,
    logLevel: APP_CONFIG.LOGGING.LEVEL,
  },
  staging: {
    apiUrl: APP_CONFIG.API.BASE_URL,
    websocketUrl: APP_CONFIG.WEBSOCKET.URL,
    enableDebug: APP_CONFIG.FEATURES.DEBUG,
    enableAnalytics: APP_CONFIG.FEATURES.ANALYTICS,
    logLevel: APP_CONFIG.LOGGING.LEVEL,
  },
  production: {
    apiUrl: APP_CONFIG.API.BASE_URL,
    websocketUrl: APP_CONFIG.WEBSOCKET.URL,
    enableDebug: APP_CONFIG.FEATURES.DEBUG,
    enableAnalytics: APP_CONFIG.FEATURES.ANALYTICS,
    logLevel: APP_CONFIG.LOGGING.LEVEL,
  },
} as const;

export const currentEnvConfig = envConfig[currentEnvironment];

// Legacy functions for backward compatibility
export function getEnvironment() {
  return currentEnvironment;
}

export function validateEnvironment(): void {
  // Validation is handled in central config
}

export function logEnvironmentInfo(): void {
  // Logging is handled in central config
}
