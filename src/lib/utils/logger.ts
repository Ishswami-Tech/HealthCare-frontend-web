// Enhanced logging utility for healthcare application
import { APP_CONFIG } from '@/lib/config/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = APP_CONFIG.IS_DEVELOPMENT;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
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
