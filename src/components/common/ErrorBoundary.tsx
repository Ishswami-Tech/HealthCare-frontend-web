/**
 * ✅ Consolidated Error Boundary System
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for error handling
 * Replaces ErrorBoundary.tsx, WebSocketErrorBoundary.tsx, and error.tsx patterns
 */

"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, WifiOff, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ERROR_MESSAGES } from "@/lib/config/config";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";


// ============================================================================
// TYPES
// ============================================================================

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Error boundary variant
   * @default "default"
   */
  variant?: "default" | "websocket" | "api" | "minimal";
  /**
   * Show error details in development
   * @default true
   */
  showDetails?: boolean;
  /**
   * Custom error message
   */
  customMessage?: string;
}

export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  variant?: ErrorBoundaryProps["variant"] | undefined;
  showDetails?: boolean | undefined;
  customMessage?: string | undefined;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// ERROR FALLBACK COMPONENTS
// ============================================================================

/**
 * ✅ Default Error Fallback
 */
function DefaultErrorFallback({
  error,
  resetErrorBoundary,
  showDetails = true,
  customMessage,
}: ErrorFallbackProps) {
  const errorMessage = customMessage || 
    (error ? sanitizeErrorMessage(error) : ERROR_MESSAGES.UNKNOWN_ERROR);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/20 dark:via-background dark:to-orange-950/20 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Application Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {errorMessage}
          </p>
          
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          {process.env.NODE_ENV === "development" && showDetails && error && (
            <div className="mt-6 p-4 bg-muted rounded-lg text-left">
              <h3 className="font-semibold text-sm mb-2">
                Error Details:
              </h3>
              <pre className="text-xs text-muted-foreground overflow-auto whitespace-pre-wrap">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ✅ WebSocket Error Fallback
 */
function WebSocketErrorFallback({
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-orange-950/20 dark:via-background dark:to-yellow-950/20 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Unable to establish WebSocket connection. Please check your internet connection and try again.
          </p>
          
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ✅ API Error Fallback
 */
function APIErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            API Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {error ? sanitizeErrorMessage(error) : "An error occurred while communicating with the server."}
          </p>
          
          <Button 
            onClick={resetErrorBoundary} 
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ✅ Minimal Error Fallback
 */
function MinimalErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 gap-2">
      <AlertTriangle className="w-6 h-6 text-destructive" />
      <p className="text-sm text-muted-foreground text-center">
        {error ? sanitizeErrorMessage(error) : "Something went wrong"}
      </p>
      <Button 
        onClick={resetErrorBoundary} 
        size="sm"
        variant="outline"
      >
        Retry
      </Button>
    </div>
  );
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * ✅ Consolidated Error Boundary
 * Handles all error boundary needs with variants
 * 
 * @example
 * ```tsx
 * // Default error boundary
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * // WebSocket error boundary
 * <ErrorBoundary variant="websocket">
 *   <WebSocketComponent />
 * </ErrorBoundary>
 * 
 * // Custom fallback
 * <ErrorBoundary fallback={CustomFallback}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: error || new Error('Unknown error'),
      errorInfo: null,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    this.setState({
      error: error || new Error('Unknown error'),
      errorInfo: errorInfo || null,
    });
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || 
        (this.props.variant === "websocket" ? WebSocketErrorFallback :
         this.props.variant === "api" ? APIErrorFallback :
         this.props.variant === "minimal" ? MinimalErrorFallback :
         DefaultErrorFallback);
      
      return (
        <FallbackComponent
          error={this.state.error || new Error('Unknown error')}
          resetErrorBoundary={this.resetErrorBoundary}
          variant={this.props.variant}
          showDetails={this.props.showDetails}
          customMessage={this.props.customMessage}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SPECIALIZED ERROR BOUNDARIES (for convenience)
// ============================================================================

/**
 * ✅ WebSocket Error Boundary
 * Specialized for WebSocket errors
 */
export function WebSocketErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, "variant">) {
  return (
    <ErrorBoundary variant="websocket" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * ✅ API Error Boundary
 * Specialized for API errors
 */
export function APIErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, "variant">) {
  return (
    <ErrorBoundary variant="api" {...props}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * ✅ Minimal Error Boundary
 * For inline error boundaries
 */
export function MinimalErrorBoundary({
  children,
  ...props
}: Omit<ErrorBoundaryProps, "variant">) {
  return (
    <ErrorBoundary variant="minimal" {...props}>
      {children}
    </ErrorBoundary>
  );
}
