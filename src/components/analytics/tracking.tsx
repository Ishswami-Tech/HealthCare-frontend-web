"use client";

import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ============================================================================
// GOOGLE ANALYTICS 4 INTEGRATION
// ============================================================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

interface GAProps {
  measurementId: string;
}

export const GoogleAnalytics: React.FC<GAProps> = ({ measurementId }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    // ✅ SECURITY: Use textContent for safe script injection (innerHTML is safe here but textContent is better practice)
    const scriptContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', {
        page_title: document.title,
        page_location: window.location.href,
      });
    `;
    script2.textContent = scriptContent;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, [measurementId]);

  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', measurementId, {
        page_path: pathname + searchParams.toString(),
        page_title: document.title,
        page_location: window.location.href,
      });
    }
  }, [pathname, searchParams, measurementId]);

  return null;
};

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, {
      event_category: 'engagement',
      event_label: parameters?.label || '',
      value: parameters?.value || 0,
      ...parameters,
    });
  }
};

export const trackConversion = (conversionType: string, value?: number) => {
  trackEvent('conversion', {
    event_category: 'conversion',
    event_label: conversionType,
    value: value || 0,
  });
};

// ============================================================================
// HEAT MAPPING & USER BEHAVIOR TRACKING
// ============================================================================

interface HeatmapProps {
  siteId: string;
}

export const Hotjar: React.FC<HeatmapProps> = ({ siteId }) => {
  useEffect(() => {
    const script = document.createElement('script');
    // ✅ SECURITY: Use textContent for safe script injection
    const scriptContent = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${siteId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    script.textContent = scriptContent;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [siteId]);

  return null;
};

// ============================================================================
// SCROLL DEPTH TRACKING
// ============================================================================

export const ScrollDepthTracker: React.FC = () => {
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    const tracked = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          trackEvent('scroll_depth', {
            event_category: 'engagement',
            event_label: `${milestone}%`,
            value: milestone,
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
};

// ============================================================================
// FORM TRACKING
// ============================================================================

interface FormTrackerProps {
  formId: string;
  formName: string;
}

export const FormTracker: React.FC<FormTrackerProps> = ({ formId, formName }) => {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const handleSubmit = (_e: Event) => {
      trackEvent('form_submit', {
        event_category: 'form',
        event_label: formName,
        form_id: formId,
      });
    };

    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      trackEvent('form_start', {
        event_category: 'form',
        event_label: formName,
        form_id: formId,
        field_name: target.getAttribute('name') || target.id,
      });
    };

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('focusin', handleFocus, { once: true });

    return () => {
      form.removeEventListener('submit', handleSubmit);
      form.removeEventListener('focusin', handleFocus);
    };
  }, [formId, formName]);

  return null;
};

// ============================================================================
// CLICK TRACKING
// ============================================================================

export const ClickTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trackableElement = target.closest('[data-track]');
      
      if (trackableElement) {
        const trackingData = trackableElement.getAttribute('data-track');
        const [eventName, category, label] = trackingData?.split('|') || [];
        
        trackEvent(eventName || 'click', {
          event_category: category || 'interaction',
          event_label: label || target.textContent?.trim() || 'unknown',
          element_type: target.tagName.toLowerCase(),
          element_classes: target.className,
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return <>{children}</>;
};

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

export const PerformanceTracker: React.FC = () => {
  useEffect(() => {
    // Track Core Web Vitals
    const trackWebVitals = () => {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          trackEvent('web_vitals', {
            event_category: 'performance',
            event_label: 'LCP',
            value: Math.round(lastEntry.startTime),
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          trackEvent('web_vitals', {
            event_category: 'performance',
            event_label: 'FID',
            value: Math.round(entry.processingStart - entry.startTime),
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        trackEvent('web_vitals', {
          event_category: 'performance',
          event_label: 'CLS',
          value: Math.round(clsValue * 1000),
        });
      }).observe({ entryTypes: ['layout-shift'] });
    };

    // Track page load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      trackEvent('page_load_time', {
        event_category: 'performance',
        event_label: 'load_time',
        value: Math.round(loadTime),
      });
    });

    trackWebVitals();
  }, []);

  return null;
};

// ============================================================================
// COMPREHENSIVE ANALYTICS PROVIDER
// ============================================================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
  config: {
    googleAnalyticsId?: string;
    hotjarId?: string;
    enableScrollTracking?: boolean;
    enablePerformanceTracking?: boolean;
    enableClickTracking?: boolean;
  };
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  config,
}) => {
  return (
    <>
      {config.googleAnalyticsId && (
        <GoogleAnalytics measurementId={config.googleAnalyticsId} />
      )}
      {config.hotjarId && <Hotjar siteId={config.hotjarId} />}
      {config.enableScrollTracking && <ScrollDepthTracker />}
      {config.enablePerformanceTracking && <PerformanceTracker />}
      {config.enableClickTracking ? (
        <ClickTracker>{children}</ClickTracker>
      ) : (
        children
      )}
    </>
  );
};
