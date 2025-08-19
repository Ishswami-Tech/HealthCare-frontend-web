"use client";

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

// ============================================================================
// WEB VITALS TRACKING WITH NEXT.JS 15
// ============================================================================

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
  startTime?: number;
  delta?: number;
}

// Enhanced Web Vitals tracking for Next.js 15
export function WebVitalsTracker() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Track Core Web Vitals
    switch (metric.name) {
      case 'FCP': // First Contentful Paint
        trackWebVital('First Contentful Paint', metric.value);
        break;
      case 'LCP': // Largest Contentful Paint
        trackWebVital('Largest Contentful Paint', metric.value);
        break;
      case 'CLS': // Cumulative Layout Shift
        trackWebVital('Cumulative Layout Shift', metric.value);
        break;
      case 'FID': // First Input Delay
        trackWebVital('First Input Delay', metric.value);
        break;
      case 'TTFB': // Time to First Byte
        trackWebVital('Time to First Byte', metric.value);
        break;
      case 'INP': // Interaction to Next Paint (new in 2024)
        trackWebVital('Interaction to Next Paint', metric.value);
        break;
      default:
        // Custom metrics
        trackCustomMetric(metric.name, metric.value);
    }
  });

  return null;
}

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

function trackWebVital(name: string, value: number) {
  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: name,
      value: Math.round(value),
      non_interaction: true,
    });
  }

  // Send to custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }
}

function trackCustomMetric(name: string, value: number) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'custom_metric', {
      event_category: 'Performance',
      event_label: name,
      value: Math.round(value),
      non_interaction: true,
    });
  }
}

// ============================================================================
// RESOURCE LOADING PERFORMANCE
// ============================================================================

export function ResourcePerformanceTracker() {
  useEffect(() => {
    // Track resource loading performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Track slow resources
          if (resourceEntry.duration > 1000) {
            trackCustomMetric(`slow_resource_${resourceEntry.initiatorType}`, resourceEntry.duration);
          }
          
          // Track failed resources
          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
            trackCustomMetric(`failed_resource_${resourceEntry.initiatorType}`, 1);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return null;
}

// ============================================================================
// NAVIGATION PERFORMANCE
// ============================================================================

export function NavigationPerformanceTracker() {
  useEffect(() => {
    // Track navigation timing
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          // Track key navigation metrics
          trackCustomMetric('dns_lookup_time', navEntry.domainLookupEnd - navEntry.domainLookupStart);
          trackCustomMetric('tcp_connect_time', navEntry.connectEnd - navEntry.connectStart);
          trackCustomMetric('server_response_time', navEntry.responseEnd - navEntry.requestStart);
          trackCustomMetric('dom_processing_time', navEntry.domComplete - (navEntry as any).domLoading);
          trackCustomMetric('page_load_time', navEntry.loadEventEnd - navEntry.loadEventStart);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  return null;
}

// ============================================================================
// MEMORY PERFORMANCE TRACKING
// ============================================================================

export function MemoryPerformanceTracker() {
  useEffect(() => {
    // Track memory usage (if supported)
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      
      const trackMemory = () => {
        trackCustomMetric('js_heap_used', memoryInfo.usedJSHeapSize);
        trackCustomMetric('js_heap_total', memoryInfo.totalJSHeapSize);
        trackCustomMetric('js_heap_limit', memoryInfo.jsHeapSizeLimit);
      };

      // Track memory on page load
      trackMemory();

      // Track memory periodically
      const interval = setInterval(trackMemory, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
    return () => {}; // Return empty cleanup function if memory is not supported
  }, []);

  return null;
}

// ============================================================================
// COMPREHENSIVE PERFORMANCE PROVIDER
// ============================================================================

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableWebVitals?: boolean;
  enableResourceTracking?: boolean;
  enableNavigationTracking?: boolean;
  enableMemoryTracking?: boolean;
}

export function PerformanceProvider({
  children,
  enableWebVitals = true,
  enableResourceTracking = true,
  enableNavigationTracking = true,
  enableMemoryTracking = false, // Disabled by default as it's experimental
}: PerformanceProviderProps) {
  return (
    <>
      {enableWebVitals && <WebVitalsTracker />}
      {enableResourceTracking && <ResourcePerformanceTracker />}
      {enableNavigationTracking && <NavigationPerformanceTracker />}
      {enableMemoryTracking && <MemoryPerformanceTracker />}
      {children}
    </>
  );
}

// ============================================================================
// PERFORMANCE BUDGET MONITORING
// ============================================================================

interface PerformanceBudget {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay (ms)
  ttfb: number; // Time to First Byte (ms)
}

const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800,  // 1.8s
  lcp: 2500,  // 2.5s
  cls: 0.1,   // 0.1
  fid: 100,   // 100ms
  ttfb: 800,  // 800ms
};

export function PerformanceBudgetMonitor(budget: Partial<PerformanceBudget> = {}) {
  const fullBudget = { ...DEFAULT_BUDGET, ...budget };

  useReportWebVitals((metric: WebVitalsMetric) => {
    let budgetValue: number;
    let exceeded = false;

    switch (metric.name) {
      case 'FCP':
        budgetValue = fullBudget.fcp;
        exceeded = metric.value > budgetValue;
        break;
      case 'LCP':
        budgetValue = fullBudget.lcp;
        exceeded = metric.value > budgetValue;
        break;
      case 'CLS':
        budgetValue = fullBudget.cls;
        exceeded = metric.value > budgetValue;
        break;
      case 'FID':
        budgetValue = fullBudget.fid;
        exceeded = metric.value > budgetValue;
        break;
      case 'TTFB':
        budgetValue = fullBudget.ttfb;
        exceeded = metric.value > budgetValue;
        break;
      default:
        return;
    }

    if (exceeded) {
      // Alert about budget exceeded
      console.warn(`Performance budget exceeded for ${metric.name}: ${metric.value}ms > ${budgetValue}ms`);
      
      // Track budget violations
      trackCustomMetric(`budget_exceeded_${metric.name.toLowerCase()}`, metric.value - budgetValue);
    }
  });

  return null;
}

// ============================================================================
// PERFORMANCE DEBUGGING (Development Only)
// ============================================================================

export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Log performance entries to console
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.log(`[Performance] ${entry.name}: ${entry.duration}ms`);
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    return () => observer.disconnect();
  }, []);

  return null;
}
