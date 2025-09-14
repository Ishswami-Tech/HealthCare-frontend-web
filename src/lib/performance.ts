// Performance optimization utilities for 100K users
import { useCallback, useRef, useEffect, useMemo, useState } from 'react';

/**
 * Throttle function calls to improve performance under high load
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function calls to reduce API calls and improve performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * React hook for throttled callbacks
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, limit),
    [callback, limit]
  );
  
  return throttledCallback as T;
}

/**
 * React hook for debounced callbacks
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );
  
  return debouncedCallback as T;
}

/**
 * Virtual scrolling utilities for large lists
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  itemCount: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  itemCount,
  overscan = 5,
}: VirtualScrollOptions) {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = useMemo(
    () => Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    [scrollTop, itemHeight, overscan]
  );

  const endIndex = useMemo(
    () =>
      Math.min(
        itemCount - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
      ),
    [scrollTop, containerHeight, itemHeight, itemCount, overscan]
  );

  const visibleItems = useMemo(
    () => Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i),
    [startIndex, endIndex]
  );

  const offsetY = useMemo(() => startIndex * itemHeight, [startIndex, itemHeight]);

  const totalHeight = useMemo(() => itemCount * itemHeight, [itemCount, itemHeight]);

  const handleScroll = useThrottledCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  return {
    scrollElementRef,
    visibleItems,
    offsetY,
    totalHeight,
    handleScroll,
  };
}

/**
 * Memory-efficient className computation
 */
const classNameCache = new Map<string, string>();

export function memoizeClassName(
  baseClasses: string,
  conditionalClasses?: string | undefined | null
): string {
  const key = `${baseClasses}:${conditionalClasses || ''}`;
  
  if (classNameCache.has(key)) {
    return classNameCache.get(key)!;
  }
  
  const result = conditionalClasses 
    ? `${baseClasses} ${conditionalClasses}` 
    : baseClasses;
    
  // Limit cache size to prevent memory leaks
  if (classNameCache.size > 1000) {
    const firstKey = classNameCache.keys().next().value;
    classNameCache.delete(firstKey);
  }
  
  classNameCache.set(key, result);
  return result;
}

/**
 * Optimized intersection observer for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return { elementRef, isIntersecting };
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number[]>();

  static startMeasurement(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  static endMeasurement(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        const measurements = this.measurements.get(name) || [];
        measurements.push(measure.duration);
        
        // Keep only last 100 measurements
        if (measurements.length > 100) {
          measurements.shift();
        }
        
        this.measurements.set(name, measurements);
      }
      
      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
      performance.clearMeasures(name);
    }
  }

  static getAverageDuration(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  static logPerformanceReport() {
    if (process.env.NODE_ENV === 'development') {
      console.group('Performance Report');
      this.measurements.forEach((measurements, name) => {
        const avg = this.getAverageDuration(name);
        console.log(`${name}: ${avg.toFixed(2)}ms average (${measurements.length} samples)`);
      });
      console.groupEnd();
    }
  }
}

/**
 * Hook for performance measurement
 */
export function usePerformanceMeasurement(name: string) {
  useEffect(() => {
    PerformanceMonitor.startMeasurement(name);
    
    return () => {
      PerformanceMonitor.endMeasurement(name);
    };
  }, [name]);
}

/**
 * Optimized state updates for high-frequency changes
 */
export function useBatchedUpdates<T>(initialValue: T, batchDelay: number = 50) {
  const [value, setValue] = useState(initialValue);
  const pendingUpdate = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchedSetValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(pendingUpdate.current ?? value)
      : newValue;
    
    pendingUpdate.current = resolvedValue;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (pendingUpdate.current !== null) {
        setValue(pendingUpdate.current);
        pendingUpdate.current = null;
      }
      timeoutRef.current = null;
    }, batchDelay);
  }, [value, batchDelay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, batchedSetValue] as const;
}

