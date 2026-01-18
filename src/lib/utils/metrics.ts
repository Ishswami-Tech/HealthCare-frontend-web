/**
 * ✅ Performance Metrics & Monitoring
 * Tracks API calls, response times, errors
 * Follows SOLID, DRY, KISS principles
 */

'use client';

import { logger } from './logger';

// ============================================================================
// Metrics Types
// ============================================================================

export interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface ApiMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  error?: string;
  requestSize?: number;
  responseSize?: number;
}

export interface CircuitBreakerState {
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number | null;
  successCount: number;
  halfOpenAttempts: number;
}

// ============================================================================
// Metrics Collector
// ============================================================================

class MetricsCollector {
  private metrics: MetricData[] = [];
  private apiMetrics: ApiMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly maxApiMetrics = 500; // Keep last 500 API metrics

  /**
   * Record a metric
   */
  record(metric: MetricData): void {
    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Metric recorded', { name: metric.name, value: metric.value, timestamp: metric.timestamp });
    }
  }

  /**
   * Record API metric
   */
  recordApi(metric: ApiMetric): void {
    this.apiMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now(),
    });

    // Keep only last N API metrics
    if (this.apiMetrics.length > this.maxApiMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxApiMetrics);
    }

    // Log slow requests
    if (metric.responseTime > 2000) {
      logger.warn('Slow API request', {
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
      });
    }

    // Log errors
    if (metric.statusCode >= 400) {
      logger.error('API error', {
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        error: metric.error,
      });
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    totalApiCalls: number;
    averageResponseTime: number;
    errorRate: number;
    slowRequests: number;
  } {
    const apiCalls = this.apiMetrics;
    const totalApiCalls = apiCalls.length;
    
    if (totalApiCalls === 0) {
      return {
        totalMetrics: this.metrics.length,
        totalApiCalls: 0,
        averageResponseTime: 0,
        errorRate: 0,
        slowRequests: 0,
      };
    }

    const totalResponseTime = apiCalls.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / totalApiCalls;
    
    const errorCount = apiCalls.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalApiCalls) * 100;
    
    const slowRequests = apiCalls.filter(m => m.responseTime > 2000).length;

    return {
      totalMetrics: this.metrics.length,
      totalApiCalls,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowRequests,
    };
  }

  /**
   * Get recent API metrics
   */
  getRecentApiMetrics(limit: number = 50): ApiMetric[] {
    return this.apiMetrics.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.apiMetrics = [];
  }
}

// Global metrics collector
export const metricsCollector = new MetricsCollector();

// ============================================================================
// Circuit Breaker
// ============================================================================

class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;
  private readonly halfOpenMaxAttempts: number;

  constructor(
    failureThreshold: number = 5,
    successThreshold: number = 2,
    timeout: number = 60000, // 1 minute
    halfOpenMaxAttempts: number = 3
  ) {
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
    this.halfOpenMaxAttempts = halfOpenMaxAttempts;
  }

  /**
   * Get state for endpoint
   */
  private getState(endpoint: string): CircuitBreakerState {
    if (!this.states.has(endpoint)) {
      this.states.set(endpoint, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0,
        halfOpenAttempts: 0,
      });
    }
    return this.states.get(endpoint)!;
  }

  /**
   * Check if circuit is open
   */
  isOpen(endpoint: string): boolean {
    const state = this.getState(endpoint);
    
    if (!state.isOpen) {
      return false;
    }

    // Check if timeout has passed
    if (state.lastFailureTime && Date.now() - state.lastFailureTime > this.timeout) {
      // Move to half-open state
      state.isOpen = false;
      state.halfOpenAttempts = 0;
      state.successCount = 0;
      return false;
    }

    return true;
  }

  /**
   * Record success
   */
  recordSuccess(endpoint: string): void {
    const state = this.getState(endpoint);
    
    if (state.isOpen) {
      // In half-open state, count successes
      state.successCount++;
      if (state.successCount >= this.successThreshold) {
        // Close circuit
        state.isOpen = false;
        state.failureCount = 0;
        state.successCount = 0;
        state.halfOpenAttempts = 0;
        logger.info('Circuit breaker closed', { endpoint });
      }
    } else {
      // Reset failure count on success
      state.failureCount = 0;
    }
  }

  /**
   * Record failure
   */
  recordFailure(endpoint: string): void {
    const state = this.getState(endpoint);
    
    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.isOpen) {
      // In half-open state, increment attempts
      state.halfOpenAttempts++;
      if (state.halfOpenAttempts >= this.halfOpenMaxAttempts) {
        // Re-open circuit
        state.halfOpenAttempts = 0;
        state.successCount = 0;
        logger.warn('Circuit breaker re-opened', { endpoint });
      }
    } else if (state.failureCount >= this.failureThreshold) {
      // Open circuit
      state.isOpen = true;
      state.halfOpenAttempts = 0;
      state.successCount = 0;
      logger.error('Circuit breaker opened', { endpoint, failureCount: state.failureCount });
    }
  }

  /**
   * Reset circuit breaker for endpoint
   */
  reset(endpoint: string): void {
    this.states.delete(endpoint);
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState(endpoint: string): CircuitBreakerState {
    if (!this.states.has(endpoint)) {
      this.states.set(endpoint, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: null,
        successCount: 0,
        halfOpenAttempts: 0,
      });
    }
    return this.states.get(endpoint)!;
  }
}

// Global circuit breaker
export const circuitBreaker = new CircuitBreaker();

// ============================================================================
// Performance Tracking
// ============================================================================

/**
 * Track API call performance
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  error?: string,
  requestSize?: number,
  responseSize?: number
): void {
  const metric: ApiMetric = {
    endpoint,
    method,
    statusCode,
    responseTime,
    timestamp: Date.now(),
  };
  if (error !== undefined) metric.error = error;
  if (requestSize !== undefined) metric.requestSize = requestSize;
  if (responseSize !== undefined) metric.responseSize = responseSize;
  
  metricsCollector.recordApi(metric);

  // Update circuit breaker
  if (statusCode >= 500 || error) {
    circuitBreaker.recordFailure(endpoint);
  } else {
    circuitBreaker.recordSuccess(endpoint);
  }
}

/**
 * Track custom metric
 */
export function trackMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
  metadata?: Record<string, any>
): void {
  const metric: MetricData = {
    name,
    value,
    timestamp: Date.now(),
  };
  if (tags !== undefined) metric.tags = tags;
  if (metadata !== undefined) metric.metadata = metadata;
  
  metricsCollector.record(metric);
}

/**
 * Check if endpoint is available (circuit breaker)
 */
export function isEndpointAvailable(endpoint: string): boolean {
  return !circuitBreaker.isOpen(endpoint);
}

/**
 * Get metrics summary
 */
export function getMetricsSummary() {
  return metricsCollector.getSummary();
}

/**
 * Get recent API metrics
 */
export function getRecentApiMetrics(limit: number = 50) {
  return metricsCollector.getRecentApiMetrics(limit);
}
