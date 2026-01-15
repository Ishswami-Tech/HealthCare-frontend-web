/**
 * React 19 use() Hook Integration
 * For handling async data in components
 */

import React, { Suspense } from 'react';

/**
 * Hook wrapper for React 19's use() hook
 * Handles promises and context values
 * 
 * Note: React 19's use() hook is not yet stable, using useState/useEffect fallback
 * 
 * @example
 * ```tsx
 * function Component() {
 *   const data = useAsyncData(fetchData());
 *   return <div>{data.name}</div>;
 * }
 * ```
 */
export function useAsyncData<T>(promise: Promise<T>): T {
  // React 19's use() hook is not yet available in stable React
  // Using useState/useEffect as fallback for now
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    promise
      .then(setData)
      .catch(setError);
  }, [promise]);
  
  if (error) throw error;
  if (data === null) throw promise; // Suspense will catch this
  return data;
}

/**
 * Component wrapper for async data with Suspense
 * 
 * @example
 * ```tsx
 * <AsyncDataWrapper
 *   promise={fetchData()}
 *   fallback={<Loading />}
 * >
 *   {(data) => <div>{data.name}</div>}
 * </AsyncDataWrapper>
 * ```
 */
export function AsyncDataWrapper<T>({
  promise,
  fallback,
  children,
}: {
  promise: Promise<T>;
  fallback?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  const defaultFallback = React.createElement('div', null, 'Loading...');
  return React.createElement(
    Suspense,
    { fallback: fallback || defaultFallback },
    React.createElement(AsyncDataContent, { promise, children: children as (data: unknown) => React.ReactNode }, null)
  );
}

function AsyncDataContent<T>({
  promise,
  children,
}: {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
}) {
  const data = useAsyncData(promise);
  return React.createElement(React.Fragment, null, children(data));
}

/**
 * Hook for using context with React 19's use() hook
 * Note: Using React.useContext as fallback until use() is stable
 */
export function useContextValue<T>(context: React.Context<T>): T {
  return React.useContext(context);
}

