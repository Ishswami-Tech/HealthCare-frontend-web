/**
 * ✅ Consolidated Loading Components
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for all loading states
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Loader2,
  WifiOff,
  RefreshCw,
  Inbox,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ============================================================================
// LOADING SPINNER
// ============================================================================

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default "h-12 w-12"
   */
  size?: "sm" | "md" | "lg" | string;

  /**
   * Color variant
   * @default "text-blue-600 border-blue-600"
   */
  color?: "primary" | "secondary" | "muted" | string;

  /**
   * Show full screen overlay
   * @default false
   */
  fullScreen?: boolean;

  /**
   * Custom className
   */
  className?: string;

  /**
   * Loading text
   */
  text?: string;
}

/**
 * ✅ Unified Loading Spinner Component
 * Replaces LoadingSpinner.tsx and inline spinners
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" color="primary" text="Loading..." />
 * ```
 */
export function LoadingSpinner({
  size = "md",
  color = "primary",
  fullScreen = false,
  className,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const colorClasses = {
    primary: "text-blue-600 border-blue-600",
    secondary: "text-gray-600 border-gray-600",
    muted: "text-muted-foreground border-muted-foreground",
  };

  const spinnerSize =
    typeof size === "string" && sizeClasses[size as keyof typeof sizeClasses]
      ? sizeClasses[size as keyof typeof sizeClasses]
      : size;

  const spinnerColor =
    typeof color === "string" &&
    colorClasses[color as keyof typeof colorClasses]
      ? colorClasses[color as keyof typeof colorClasses]
      : color;

  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2",
        className
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-t-2 border-b-2",
          spinnerSize,
          spinnerColor
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

export interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

/**
 * ✅ Base Skeleton Component
 * Used for loading placeholders
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  animate = true,
}) => {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        animate && "animate-pulse",
        className
      )}
    />
  );
};

/**
 * ✅ Skeleton Card Component
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("p-6 border rounded-lg", className)}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-[60px]" />
      <Skeleton className="h-3 w-[120px]" />
    </div>
  </div>
);

/**
 * ✅ Skeleton Table Component
 */
export const SkeletonTable: React.FC<{
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("space-y-4", className)}>
    {/* Header */}
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div
        key={rowIndex}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * ✅ Skeleton List Component
 */
export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 5, className }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================================================
// LOADING OVERLAY
// ============================================================================

export interface LoadingOverlayProps {
  /**
   * Show overlay
   */
  show: boolean;

  /**
   * Loading text
   */
  text?: string;

  /**
   * Custom className
   */
  className?: string;
}

/**
 * ✅ Loading Overlay Component
 * Shows loading state over content
 * Used by LoadingOverlayProvider for global overlays
 */
export function LoadingOverlay({
  show,
  text = "Loading...",
  className,
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-background/80 backdrop-blur-sm dark:bg-background/90",
        className
      )}
      // ✅ Block all pointer events when overlay is shown to prevent interaction
      style={{ pointerEvents: "auto" }}
    >
      {/* ✅ Spinner centered and always visible */}
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" text={text} />
        {/* ✅ Add a transparent click trap to prevent accidental interactions */}
        <div 
          className="absolute inset-0" 
          style={{ pointerEvents: "auto" }}
          aria-label="Loading overlay"
          role="status"
        />
      </div>
    </div>
  );
}

// ============================================================================
// INLINE LOADER (for buttons, etc.)
// ============================================================================

export interface InlineLoaderProps {
  size?: "sm" | "md";
  className?: string;
}

/**
 * ✅ Inline Loader Component
 * For use in buttons and inline contexts
 */
export function InlineLoader({ size = "sm", className }: InlineLoaderProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return <Loader2 className={cn("animate-spin", sizeClass, className)} />;
}

// ============================================================================
// PULSE LOADER
// ============================================================================

export interface PulseLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * ✅ Pulse Loader Component
 * Animated pulse effect for loading states
 */
export function PulseLoader({ size = "md", className }: PulseLoaderProps) {
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "rounded-full bg-primary animate-pulse",
            sizeClasses[size]
          )}
          style={{ animationDelay: `${i * 150}ms` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ============================================================================
// PROGRESS INDICATOR
// ============================================================================

export interface ProgressIndicatorProps {
  progress?: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * ✅ Progress Indicator Component
 * Shows progress with optional percentage
 */
export function ProgressIndicator({
  progress = 0,
  label,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="text-muted-foreground">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATES
// ============================================================================

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: (() => void) | undefined;
  retryLabel?: string;
  className?: string;
}

/**
 * ✅ Error State Component
 * Displays error message with optional retry action
 */
export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <XCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * ✅ Network Error State Component
 * Specialized error state for network issues
 */
export function NetworkErrorState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Retry Connection"
      {...(className ? { className } : {})}
    />
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

/**
 * ✅ Empty State Component
 * Displays when there's no data to show
 */
export function EmptyState({
  title = "No data available",
  description = "There's nothing to display here yet.",
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================================
// CONNECTION STATUS
// ============================================================================

export interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "connecting" | "error";
  label?: string;
  className?: string;
}

/**
 * ✅ Connection Status Component
 * Shows connection status indicator
 */
export function ConnectionStatus({
  status,
  label,
  className,
}: ConnectionStatusProps) {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      text: "Connected",
    },
    disconnected: {
      icon: WifiOff,
      color: "text-gray-600",
      bg: "bg-gray-100",
      text: "Disconnected",
    },
    connecting: {
      icon: Loader2,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      text: "Connecting...",
    },
    error: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-100",
      text: "Connection Error",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  const displayText = label || config.text;

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className={cn("p-1.5 rounded-full", config.bg)}>
        <Icon
          className={cn(
            "w-4 h-4",
            config.color,
            status === "connecting" && "animate-spin"
          )}
        />
      </div>
      {displayText && (
        <span className={cn("text-sm font-medium", config.color)}>
          {displayText}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// FORM SUBMISSION STATE
// ============================================================================

export interface FormSubmissionStateProps {
  isSubmitting?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
}

/**
 * ✅ Form Submission State Component
 * Shows form submission status (loading, success, error)
 */
export function FormSubmissionState({
  isSubmitting = false,
  isSuccess = false,
  isError = false,
  successMessage = "Form submitted successfully!",
  errorMessage = "Failed to submit form. Please try again.",
  className,
}: FormSubmissionStateProps) {
  if (!isSubmitting && !isSuccess && !isError) return null;

  return (
    <div className={cn("mt-4", className)}>
      {isSubmitting && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Submitting...</AlertTitle>
          <AlertDescription>
            Please wait while we process your request.
          </AlertDescription>
        </Alert>
      )}

      {isSuccess && (
        <Alert
          variant="default"
          className="border-green-200 bg-green-50 dark:bg-green-950/20"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-400">
            Success
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {isError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Types are already exported as interfaces above - no need to re-export
