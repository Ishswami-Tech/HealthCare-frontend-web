"use client";

import React, { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_FALLBACK = (
  <div className="flex items-center justify-center py-20">
    <div className="w-full max-w-md space-y-3">
      <Skeleton className="mx-auto h-4 w-40 rounded-full" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  </div>
);

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * Lazy loading wrapper for sections with intersection observer
 * Improves performance by loading content only when needed
 */
export const LazySection: React.FC<LazySectionProps> = ({
  children,
  fallback,
  className,
  threshold = 0.1,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const hasLoadedRef = React.useRef(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const observerOptions = React.useMemo(() => ({ threshold }), [threshold]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasLoadedRef.current) {
          setIsVisible(true);
          hasLoadedRef.current = true;
          observer.disconnect();
        }
      },
      observerOptions
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [observerOptions]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? (
        <Suspense fallback={fallback || DEFAULT_FALLBACK}>
          {children}
        </Suspense>
      ) : (
        <div className="py-20">
          {fallback || DEFAULT_FALLBACK}
        </div>
      )}
    </div>
  );
};

/**
 * Preload component for critical resources
 */
interface PreloadProps {
  href: string;
  as: "script" | "style" | "font" | "image";
  type?: string;
  crossOrigin?: "anonymous" | "use-credentials";
}

export const Preload: React.FC<PreloadProps> = ({ href, as, type, crossOrigin }) => {
  React.useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [href, as, type, crossOrigin]);

  return null;
};

/**
 * Critical CSS inliner for above-the-fold content
 */
interface CriticalCSSProps {
  css: string;
}

export const CriticalCSS: React.FC<CriticalCSSProps> = ({ css }) => {
  return <style data-critical="true">{css}</style>;
};

/**
 * Resource hints for performance optimization
 */
export const ResourceHints: React.FC = () => {
  React.useEffect(() => {
    const dnsPrefetchDomains = ["fonts.googleapis.com", "fonts.gstatic.com", "www.google-analytics.com"];

    dnsPrefetchDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }, []);

  return null;
};
