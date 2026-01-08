/**
 * Granular Suspense Boundaries
 * For better loading states and streaming
 */

"use client";

import { Suspense, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

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
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {name && (
              <span className="ml-2 text-sm text-muted-foreground">
                Loading {name}...
              </span>
            )}
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
          <Loader2 className="h-4 w-4 animate-spin" />
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
      fallback={<Loader2 className="h-4 w-4 animate-spin inline-block" />}
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
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading page...</p>
          </div>
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
            <Loader2 className="h-5 w-5 animate-spin" />
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
            <Loader2 className="h-4 w-4 animate-spin inline-block" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </td>
        </tr>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}

