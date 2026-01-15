/**
 * ✅ Server Action Wrapper Utility
 * Wraps server actions with consistent error handling and logging
 * Follows SOLID, DRY, KISS principles
 */

import { logger } from '@/lib/utils/logger';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';

export interface ServerActionWrapperOptions {
  /** Operation name for logging */
  operationName: string;
  /** Additional context for logging */
  context?: Record<string, any>;
  /** Whether to log success (default: true) */
  logSuccess?: boolean;
  /** Whether to log debug info (default: true in development) */
  logDebug?: boolean;
}

/**
 * ✅ Wraps a server action with consistent error handling and logging
 * 
 * @example
 * ```typescript
 * export const getUserProfile = wrapServerAction(
 *   async () => {
 *     const { data } = await authenticatedApi(API_ENDPOINTS.USERS.PROFILE);
 *     return data;
 *   },
 *   { operationName: 'getUserProfile' }
 * );
 * ```
 */
export function wrapServerAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: ServerActionWrapperOptions
): T {
  const { operationName, context = {}, logSuccess = true, logDebug = true } = options;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      if (logDebug) {
        logger.debug(`[${operationName}] Starting`, { ...context, argsCount: args.length });
      }

      const result = await action(...args);

      if (logSuccess) {
        logger.info(`[${operationName}] Success`, { ...context });
      }

      return result;
    } catch (error) {
      const errorMessage = sanitizeErrorMessage(error);
      logger.error(`[${operationName}] Failed`, { 
        ...context, 
        error: errorMessage,
        originalError: error instanceof Error ? error.message : String(error)
      });
      throw new Error(errorMessage);
    }
  }) as T;
}
