// Enhanced logging utility for healthcare application
import { nowIso } from '@/lib/utils/date-time';
import { APP_CONFIG } from '@/lib/config/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN =
  /token|authorization|cookie|password|secret|session|jwt|credential|api[-_]?key/i;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function redactString(value: string): string {
  return value.replace(JWT_PATTERN, REDACTED);
}

function redactValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.stringify(redactValue(JSON.parse(trimmed)));
      } catch {
        return redactString(value);
      }
    }
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryValue, entryKey),
      ])
    );
  }

  return value;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = APP_CONFIG.IS_DEVELOPMENT;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = nowIso();
    const contextStr = context ? ` [${JSON.stringify(redactValue(context))}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error };
    
    console.error(this.formatMessage('error', message, errorContext));
  }

  // Healthcare-specific logging methods
  appointment(action: string, appointmentId: string, context?: LogContext): void {
    this.info(`Appointment ${action}`, { 
      ...context, 
      component: 'appointments', 
      appointmentId 
    });
  }

  patient(action: string, patientId: string, context?: LogContext): void {
    this.info(`Patient ${action}`, { 
      ...context, 
      component: 'patients', 
      patientId 
    });
  }

  auth(action: string, context?: LogContext): void {
    this.info(`Authentication ${action}`, { 
      ...context, 
      component: 'auth' 
    });
  }

  api(method: string, endpoint: string, status?: number, context?: LogContext): void {
    const level = status && status >= 400 ? 'error' : 'info';
    this[level](`API ${method} ${endpoint}`, { 
      ...context, 
      component: 'api', 
      method, 
      endpoint, 
      status 
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in components
export type { LogLevel };
