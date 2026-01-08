/**
 * React 19 use() Hook Integration
 * For handling async data in components
 */

import { use, Suspense } from 'react';

/**
 * Hook wrapper for React 19's use() hook
 * Handles promises and context values
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
  return use(promise);
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
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <AsyncDataContent promise={promise}>{children}</AsyncDataContent>
    </Suspense>
  );
}

function AsyncDataContent<T>({
  promise,
  children,
}: {
  promise: Promise<T>;
  children: (data: T) => React.ReactNode;
}) {
  const data = use(promise);
  return <>{children(data)}</>;
}

/**
 * Hook for using context with React 19's use() hook
 */
export function useContextValue<T>(context: React.Context<T>): T {
  return use(context);
}

