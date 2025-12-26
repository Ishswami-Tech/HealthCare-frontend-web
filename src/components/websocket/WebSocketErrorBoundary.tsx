"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useWebSocketStore } from "@/stores/websocket.store";
import { useAppStore } from "@/stores/app.store";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class WebSocketErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "WebSocket Error Boundary caught an error:",
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service
    this.reportError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to Sentry, LogRocket, etc.
      console.error("Production error report:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState((prevState) => ({
        retryCount: prevState.retryCount + 1,
      }));

      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, this.state.retryCount);

      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
      }, delay);
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              WebSocket Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Failed</AlertTitle>
              <AlertDescription>
                {this.state.error?.message ||
                  "An unexpected error occurred with the real-time connection."}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  asChild={false}
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </span>
                  </span>
                </Button>
              )}

              <Button
                onClick={this.handleReset}
                size="sm"
                className="flex items-center gap-2"
                asChild={false}
              >
                <span>Reset Connection</span>
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook-based WebSocket Status Indicator
export function WebSocketStatusIndicator() {
  const { connectionStatus, error, reconnect, clearError } =
    useWebSocketStore();
  const { addNotification } = useAppStore();

  React.useEffect(() => {
    // Notify user of connection status changes
    if (connectionStatus === "connected" && !error) {
      addNotification({
        type: "success",
        title: "Connected",
        message: "Real-time updates are active",
        read: false,
      });
    } else if (connectionStatus === "error" && error) {
      addNotification({
        type: "error",
        title: "Connection Error",
        message: error,
        persistent: true,
        read: false,
      });
    }
  }, [connectionStatus, error, addNotification]);

  const handleReconnect = React.useCallback(() => {
    clearError();
    reconnect();
  }, [clearError, reconnect]);

  if (connectionStatus === "connected") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Wifi className="h-4 w-4" />
        <span>Real-time connected</span>
      </div>
    );
  }

  if (
    connectionStatus === "connecting" ||
    connectionStatus === "reconnecting"
  ) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Connection error</span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReconnect}
          className="h-6 px-2 text-xs"
          asChild={false}
        >
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-600 text-sm">
      <WifiOff className="h-4 w-4" />
      <span>Offline mode</span>
    </div>
  );
}

// Global WebSocket Error Handler Component
export function WebSocketGlobalErrorHandler() {
  const { error, connectionStatus, clearError } = useWebSocketStore();
  const { addNotification } = useAppStore();

  React.useEffect(() => {
    // Handle global WebSocket errors
    if (error && connectionStatus === "error") {
      addNotification({
        type: "error",
        title: "Real-time Connection Lost",
        message:
          "Some features may not update automatically. The app will continue to work normally.",
        persistent: false,
        read: false,
      });
    }

    // Auto-clear errors after a delay
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 10000); // Clear after 10 seconds

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [error, connectionStatus, addNotification, clearError]);

  return null; // This component doesn't render anything
}

// Retry Logic Hook
export function useWebSocketRetry() {
  const { connectionStatus, error, reconnect } = useWebSocketStore();
  const [retryCount, setRetryCount] = React.useState(0);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const maxRetries = 5;
  const baseDelay = 1000; // 1 second

  const retryConnection = React.useCallback(async () => {
    if (retryCount >= maxRetries || isRetrying) {
      return false;
    }

    setIsRetrying(true);

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 1000;

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      reconnect();
      setRetryCount((prev) => prev + 1);
      return true;
    } catch (err) {
      console.error("Retry attempt failed:", err);
      return false;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, isRetrying, baseDelay, reconnect]);

  // Auto-retry on connection errors
  React.useEffect(() => {
    if (
      connectionStatus === "error" &&
      error &&
      retryCount < maxRetries &&
      !isRetrying
    ) {
      const timer = setTimeout(() => {
        retryConnection();
      }, 1000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [
    connectionStatus,
    error,
    retryCount,
    maxRetries,
    isRetrying,
    retryConnection,
  ]);

  // Reset retry count on successful connection
  React.useEffect(() => {
    if (connectionStatus === "connected") {
      setRetryCount(0);
      setIsRetrying(false);
    }
  }, [connectionStatus]);

  return {
    retryCount,
    maxRetries,
    isRetrying,
    canRetry: retryCount < maxRetries,
    retryConnection,
  };
}

export default WebSocketErrorBoundary;
