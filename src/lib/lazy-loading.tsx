import React, { lazy, Suspense } from 'react';

export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));

  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <div>Loading…</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
