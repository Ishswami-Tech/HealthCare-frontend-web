/**
 * Granular Suspense Boundaries
 * For better loading states and streaming
 * Uses consolidated loading components
 */

"use client";

import { ReactNode, Suspense } from "react";
import { InlineLoader, LoadingSpinner, Skeleton } from "@/components/ui/loading";

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
}: SuspenseBoundaryProps) {
  return <Suspense fallback={fallback || <div className="flex items-center justify-center p-8"><LoadingSpinner size="md" color="primary" /></div>}>{children}</Suspense>;
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
  return <SuspenseBoundary fallback={<InlineLoader size="sm" className="inline-block" />}>{children}</SuspenseBoundary>;
}

/**
 * Full page loading fallback
 */
export function PageSuspense({ children }: { children: ReactNode }) {
  return (
    <SuspenseBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" color="primary" />
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
        <div className="p-6 border rounded-lg space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
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
          <td colSpan={100} className="p-4">
            <div className="mx-auto h-4 w-32 rounded bg-muted animate-pulse" />
          </td>
        </tr>
      }
    >
      {children}
    </SuspenseBoundary>
  );
}
