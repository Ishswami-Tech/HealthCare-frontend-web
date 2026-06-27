import React, { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";

export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner size="sm" center />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
