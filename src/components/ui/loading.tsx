/**
 * ✅ Enterprise Loading Components
 * Uses shadcn Spinner as single source of truth
 * Follows DRY, SOLID, KISS principles
 * 
 * Pattern: Component-first, no blocking overlays
 * Integration: Zustand (useAppStore) for global state
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { WifiOff, RefreshCw, Inbox, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// LOADING SPINNER
// ============================================================================

export interface LoadingSpinnerProps {
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Color variant */
  color?: "primary" | "secondary" | "muted" | "destructive";
  /** Optional loading text */
  text?: string;
  /** Center in parent container */
  center?: boolean;
  /** Additional classes */
  className?: string;
}

const SPINNER_SIZES = {
  xs: "size-3",
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-12",
} as const;

const SPINNER_COLORS = {
  primary: "text-primary",
  secondary: "text-secondary-foreground",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
} as const;

/**
 * ✅ LoadingSpinner - Primary loading indicator
 * Uses shadcn Spinner underneath
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  text,
  center = false,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn("flex items-center gap-2", className)}>
      <Spinner className={cn(SPINNER_SIZES[size], SPINNER_COLORS[color])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );

  if (center) {
    return <div className="flex items-center justify-center w-full h-full min-h-[100px]">{content}</div>;
  }

  return content;
}

// ============================================================================
// PAGE LOADING - For Next.js Suspense boundaries
// ============================================================================

export interface PageLoadingProps {
  text?: string;
  className?: string;
}

/**
 * ✅ PageLoading - Full page loading state (non-blocking)
 * Use in loading.tsx or Suspense fallbacks
 */
export function PageLoading({ text = "Loading...", className }: PageLoadingProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[50vh] gap-4",
      className
    )}>
      <Spinner className="size-10 text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

// ============================================================================
// INLINE LOADER - For buttons and form elements
// ============================================================================

export interface InlineLoaderProps {
  size?: "sm" | "md";
  className?: string;
}

/**
 * ✅ InlineLoader - Compact spinner for buttons/inputs
 */
export function InlineLoader({ size = "sm", className }: InlineLoaderProps) {
  return <Spinner className={cn(size === "sm" ? "size-4" : "size-5", className)} />;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return <div className={cn("bg-muted rounded-md", animate && "animate-pulse", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-4" />)}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, col) => <Skeleton key={col} className="h-8" />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// STATE COMPONENTS - Error, Empty, Network states
// ============================================================================

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="size-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <XCircle className="size-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="size-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function NetworkErrorState({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="size-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
        <WifiOff className="size-8 text-orange-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Unable to connect. Please check your internet connection.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="size-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data",
  description = "There's nothing here yet.",
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ============================================================================
// CONNECTION STATUS INDICATOR
// ============================================================================

export interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "connecting" | "error";
  label?: string;
  showLabel?: boolean;
  className?: string;
}

const CONNECTION_CONFIG = {
  connected: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20", text: "Connected" },
  disconnected: { icon: WifiOff, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800", text: "Disconnected" },
  connecting: { icon: Spinner, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "Connecting..." },
  error: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20", text: "Error" },
} as const;

export function ConnectionStatus({ status, label, showLabel = true, className }: ConnectionStatusProps) {
  const config = CONNECTION_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("p-1.5 rounded-full", config.bg)}>
        <Icon className={cn("size-3.5", config.color)} />
      </div>
      {showLabel && <span className={cn("text-xs font-medium", config.color)}>{label || config.text}</span>}
    </div>
  );
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

export interface ProgressIndicatorProps {
  progress?: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressIndicator({
  progress = 0,
  label,
  showPercentage = true,
  size = "md",
  className,
}: ProgressIndicatorProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && <span className="text-muted-foreground font-medium">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", height)}>
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON WITH LOADING STATE
// ============================================================================

export interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
}

/**
 * ✅ Button with built-in loading state
 */
export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? (
        <>
          <Spinner className="size-4 mr-2" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
