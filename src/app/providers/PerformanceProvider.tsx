"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { fetchWithAbort } from "@/lib/utils/fetch-with-abort";
import { APP_CONFIG } from "@/lib/config/config";

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  label: "web-vital" | "custom";
  startTime?: number;
  delta?: number;
}

export function WebVitalsTracker() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    switch (metric.name) {
      case "FCP":
        trackWebVital("First Contentful Paint", metric.value);
        break;
      case "LCP":
        trackWebVital("Largest Contentful Paint", metric.value);
        break;
      case "CLS":
        trackWebVital("Cumulative Layout Shift", metric.value);
        break;
      case "FID":
        trackWebVital("First Input Delay", metric.value);
        break;
      case "TTFB":
        trackWebVital("Time to First Byte", metric.value);
        break;
      case "INP":
        trackWebVital("Interaction to Next Paint", metric.value);
        break;
      default:
        trackCustomMetric(metric.name, metric.value);
    }
  });

  return null;
}

function trackWebVital(name: string, value: number) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "web_vitals", {
      event_category: "Web Vitals",
      event_label: name,
      value: Math.round(value),
      non_interaction: true,
    });
  }

  if (process.env.NODE_ENV === "production" && APP_CONFIG.FEATURES.ANALYTICS) {
    void fetchWithAbort("/api/analytics/web-vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        value,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      timeout: 3000,
      cache: "no-store",
      credentials: "same-origin",
    }).catch(console.error);
  }
}

function trackCustomMetric(name: string, value: number) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "custom_metric", {
      event_category: "Performance",
      event_label: name,
      value: Math.round(value),
      non_interaction: true,
    });
  }
}

export function ResourcePerformanceTracker() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "resource") {
          const resourceEntry = entry as PerformanceResourceTiming;

          if (resourceEntry.duration > 1000) {
            trackCustomMetric(
              `slow_resource_${resourceEntry.initiatorType}`,
              resourceEntry.duration
            );
          }

          if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
            trackCustomMetric(`failed_resource_${resourceEntry.initiatorType}`, 1);
          }
        }
      });
    });

    observer.observe({ entryTypes: ["resource"] });

    return () => observer.disconnect();
  }, []);

  return null;
}

export function NavigationPerformanceTracker() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "navigation") {
          const navEntry = entry as PerformanceNavigationTiming;

          trackCustomMetric(
            "dns_lookup_time",
            navEntry.domainLookupEnd - navEntry.domainLookupStart
          );
          trackCustomMetric(
            "tcp_connect_time",
            navEntry.connectEnd - navEntry.connectStart
          );
          trackCustomMetric(
            "server_response_time",
            navEntry.responseEnd - navEntry.requestStart
          );
          trackCustomMetric(
            "dom_processing_time",
            navEntry.domComplete - (navEntry as any).domLoading
          );
          trackCustomMetric(
            "page_load_time",
            navEntry.loadEventEnd - navEntry.loadEventStart
          );
        }
      });
    });

    observer.observe({ entryTypes: ["navigation"] });

    return () => observer.disconnect();
  }, []);

  return null;
}

export function MemoryPerformanceTracker() {
  useEffect(() => {
    if ("memory" in performance) {
      const memoryInfo = (performance as any).memory;

      const trackMemory = () => {
        trackCustomMetric("js_heap_used", memoryInfo.usedJSHeapSize);
        trackCustomMetric("js_heap_total", memoryInfo.totalJSHeapSize);
        trackCustomMetric("js_heap_limit", memoryInfo.jsHeapSizeLimit);
      };

      trackMemory();

      const interval = setInterval(trackMemory, 30000);

      return () => clearInterval(interval);
    }

    return () => {};
  }, []);

  return null;
}

interface PerformanceProviderProps {
  children: React.ReactNode;
  tracking?: {
    enableWebVitals?: boolean;
    enableResourceTracking?: boolean;
    enableNavigationTracking?: boolean;
    enableMemoryTracking?: boolean;
  };
}

type PerformanceTrackingOptions = NonNullable<PerformanceProviderProps["tracking"]>;

const EMPTY_PERFORMANCE_TRACKING: PerformanceTrackingOptions = {};

export function PerformanceProvider({
  children,
  tracking = EMPTY_PERFORMANCE_TRACKING,
}: PerformanceProviderProps) {
  const resolvedTracking: PerformanceTrackingOptions = tracking ?? EMPTY_PERFORMANCE_TRACKING;
  const {
    enableWebVitals = true,
    enableResourceTracking = true,
    enableNavigationTracking = true,
    enableMemoryTracking = false,
  } = resolvedTracking;

  return (
    <div style={{ display: "contents" }}>
      {enableWebVitals && <WebVitalsTracker />}
      {enableResourceTracking && <ResourcePerformanceTracker />}
      {enableNavigationTracking && <NavigationPerformanceTracker />}
      {enableMemoryTracking && <MemoryPerformanceTracker />}
      {children}
    </div>
  );
}

interface PerformanceBudget {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  ttfb: number;
}

const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1800,
  lcp: 2500,
  cls: 0.1,
  fid: 100,
  ttfb: 800,
};

export function PerformanceBudgetMonitor(budget: Partial<PerformanceBudget> = {}) {
  const fullBudget = { ...DEFAULT_BUDGET, ...budget };

  useReportWebVitals((metric: WebVitalsMetric) => {
    let budgetValue: number;
    let exceeded = false;

    switch (metric.name) {
      case "FCP":
        budgetValue = fullBudget.fcp;
        exceeded = metric.value > budgetValue;
        break;
      case "LCP":
        budgetValue = fullBudget.lcp;
        exceeded = metric.value > budgetValue;
        break;
      case "CLS":
        budgetValue = fullBudget.cls;
        exceeded = metric.value > budgetValue;
        break;
      case "FID":
        budgetValue = fullBudget.fid;
        exceeded = metric.value > budgetValue;
        break;
      case "TTFB":
        budgetValue = fullBudget.ttfb;
        exceeded = metric.value > budgetValue;
        break;
      default:
        return;
    }

    if (exceeded) {
      console.warn(
        `Performance budget exceeded for ${metric.name}: ${metric.value}ms > ${budgetValue}ms`
      );
      trackCustomMetric(`budget_exceeded_${metric.name.toLowerCase()}`, metric.value - budgetValue);
    }
  });

  return null;
}

export function PerformanceDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        console.debug(`[Performance] ${entry.name}: ${entry.duration}ms`);
      });
    });

    observer.observe({ entryTypes: ["measure", "navigation", "resource"] });

    return () => observer.disconnect();
  }, []);

  return null;
}
