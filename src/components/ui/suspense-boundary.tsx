/**
 * ✅ Granular Suspense Boundaries
 * For better loading states and streaming
 * Uses consolidated loading components
 */

"use client";

import { Suspense, ReactNode } from 'react';
import { InlineLoader, LoadingSpinner } from '@/components/ui/loading';

export interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
  name?: string;
}

/**
 * Standard Suspense boundary with loading fallback
 */
export function SuspenseBoundary({
  children,
  fallback,
  name,
}: SuspenseBoundaryProps) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner size="md" color="primary" text={name ? `Loading ${name}...` : ""} />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Compact loading fallback for small components
 */
export function CompactSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={
        <div className="flex items-center gap-2 p-2">
          <InlineLoader size="sm" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

/**
 * Inline loading fallback for inline content
 */
export function InlineSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={<InlineLoader size="sm" className="inline-block" />}
    >
      {children}
    </SuspenseBoundary>
  );
}

/**
 * Full page loading fallback
 */
export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" color="primary" text="Loading page..." />
        </div>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

/**
 * Card loading fallback
 */
export function CardSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={
        <div className="p-6 border rounded-lg">
          <div className="flex items-center gap-2">
            <InlineLoader size="md" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

/**
 * Table row loading fallback
 */
export function TableRowSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={
        <tr>
          <td colSpan={100} className="p-4 text-center">
            <InlineLoader size="sm" className="inline-block" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </td>
        </tr>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

