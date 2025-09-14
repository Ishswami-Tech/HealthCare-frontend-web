"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RefreshCw, WifiOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

// Skeleton Components
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, animate = true }) => {
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

const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("p-6", className)}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <Skeleton className="h-8 w-[60px]" />
      <Skeleton className="h-3 w-[120px]" />
    </div>
  </Card>
);

const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
  rows = 5, 
  cols = 4, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 5, 
  className 
}) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
        <Skeleton className="h-8 w-[60px]" />
      </div>
    ))}
  </div>
);

// Loading Spinner Components
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className,
  label = "Loading..." 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {label && <p className="text-sm text-muted-foreground">{label}</p>}
      </div>
    </div>
  );
};

// Pulse Loading Animation
const PulseLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("flex space-x-1", className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 bg-primary rounded-full animate-pulse"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

// Progress Indicator
interface ProgressIndicatorProps {
  progress: number;
  total: number;
  label?: string;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  progress, 
  total, 
  label,
  className 
}) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span>{progress}/{total} ({percentage}%)</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Error States
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  icon,
  className,
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
    <div className="mb-4 text-destructive">
      {icon || <AlertCircle className="w-12 h-12" />}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        {retryLabel}
      </Button>
    )}
  </div>
);

// Network Error State
const NetworkErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({ 
  onRetry, 
  className 
}) => (
  <ErrorState
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
    icon={<WifiOff className="w-12 h-12" />}
    {...(onRetry && { onRetry })}
    retryLabel="Reconnect"
    {...(className && { className })}
  />
);

// Empty State
interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data found",
  message = "There's no data to display at the moment.",
  action,
  icon,
  className,
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
    <div className="mb-4 text-muted-foreground">
      {icon || <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">📋</div>}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
    {action && (
      <Button onClick={action.onClick} className="gap-2">
        {action.icon}
        {action.label}
      </Button>
    )}
  </div>
);

// Loading Overlay
interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = "Loading...",
  className 
}) => {
  if (!visible) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

// Toast Notifications
interface ToastProps {
  variant?: "default" | "success" | "warning" | "error";
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  variant = "default",
  title,
  message,
  duration = 5000,
  onClose,
  className,
}) => {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  if (!visible) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-background border-border text-foreground";
    }
  };

  const getIcon = () => {
    switch (variant) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm w-full p-4 border rounded-lg shadow-lg",
      getVariantStyles(),
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium">{title}</p>}
          <p className={cn("text-sm", title && "mt-1")}>{message}</p>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Connection Status Indicator
const ConnectionStatus: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 text-center z-50",
      className
    )}>
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">No internet connection</span>
      </div>
    </div>
  );
};

// Form Submission State
interface FormSubmissionStateProps {
  state: "idle" | "submitting" | "success" | "error";
  successMessage?: string;
  errorMessage?: string;
  className?: string;
}

const FormSubmissionState: React.FC<FormSubmissionStateProps> = ({
  state,
  successMessage = "Form submitted successfully!",
  errorMessage = "Failed to submit form. Please try again.",
  className,
}) => {
  if (state === "idle") return null;

  return (
    <div className={cn("flex items-center space-x-2 text-sm", className)}>
      {state === "submitting" && (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Submitting...</span>
        </>
      )}
      {state === "success" && (
        <>
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-600">{successMessage}</span>
        </>
      )}
      {state === "error" && (
        <>
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-red-600">{errorMessage}</span>
        </>
      )}
    </div>
  );
};

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  LoadingSpinner,
  PulseLoader,
  ProgressIndicator,
  ErrorState,
  NetworkErrorState,
  EmptyState,
  LoadingOverlay,
  Toast,
  ConnectionStatus,
  FormSubmissionState,
};

export type {
  SkeletonProps,
  LoadingSpinnerProps,
  ProgressIndicatorProps,
  ErrorStateProps,
  EmptyStateProps,
  LoadingOverlayProps,
  ToastProps,
  FormSubmissionStateProps,
};