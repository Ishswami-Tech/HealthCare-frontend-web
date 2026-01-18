"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useWebSocketIntegration } from "@/hooks/realtime/useWebSocketIntegration";
import { useAppStore } from "@/stores";
import { WebSocketErrorBoundary } from "@/components/common/ErrorBoundary";
import { websocketManager } from "@/lib/config/websocket";

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: string;
  error: string | null;
  isRealTimeEnabled: boolean;
  reconnect: () => void;
  emit: (event: string, data: Record<string, unknown>) => void;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  enableRetry?: boolean;
  enableErrorBoundary?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
  enableErrorBoundary = true,
}: WebSocketProviderProps) {
  const { user, currentClinic } = useAppStore();

  // Real-time WebSocket enabled - using Docker backend
  const shouldConnect = autoConnect;

  // Initialize WebSocket integration (disabled in mock mode)
  const webSocketIntegration = useWebSocketIntegration({
    autoConnect: shouldConnect,
    subscribeToQueues: shouldConnect,
    subscribeToAppointments: shouldConnect,
    tenantId: currentClinic?.id || undefined,
    userId: user?.id || undefined,
  });

  // ✅ Retry logic is handled by useWebSocketIntegration hook

  // Initialize WebSocket manager
  useEffect(() => {
    if (shouldConnect && user) {
      const initializeWebSocket = async () => {
        try {
          // Use environment-aware WebSocket URL
          const { APP_CONFIG } = await import("@/lib/config/config");
          websocketManager.initialize({
            url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || APP_CONFIG.WEBSOCKET.URL || '',
            autoConnect: false, // We handle connection through the integration hook
          });
        } catch (error) {
          console.error("Failed to initialize WebSocket manager:", error);
        }
      };

      initializeWebSocket();
    }

    // Cleanup on unmount
    return () => {
      websocketManager.destroy();
    };
  }, [shouldConnect, user]);

  // Context value
  const contextValue: WebSocketContextType = {
    ...webSocketIntegration,
    isRealTimeEnabled: webSocketIntegration.isReady,
  };

  const content = (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );

  // Wrap with error boundary if enabled
  if (enableErrorBoundary) {
    return (
      <WebSocketErrorBoundary
        onError={(error, errorInfo) => {
          console.error("WebSocket Error Boundary:", error, errorInfo);
          // Report to monitoring service in production
          if (process.env.NODE_ENV === "production") {
            // Send to error reporting service
          }
        }}
      >
        {content}
      </WebSocketErrorBoundary>
    );
  }

  return content;
}

// Higher-order component for components that require WebSocket
export function withWebSocket<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const WithWebSocketComponent = (props: P) => {
    const webSocketContext = useWebSocketContext();

    return <WrappedComponent {...props} webSocket={webSocketContext} />;
  };

  WithWebSocketComponent.displayName = `withWebSocket(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return WithWebSocketComponent;
}

// Hook for components that need WebSocket connection status
export function useWebSocketStatus() {
  const { isConnected, connectionStatus, error, isRealTimeEnabled } =
    useWebSocketContext();

  return {
    isConnected,
    connectionStatus,
    error,
    isRealTimeEnabled,
    isOnline: isConnected && !error,
    isOffline: !isConnected || !!error,
  };
}

// Hook for emitting WebSocket events with error handling
export function useWebSocketEmit() {
  const { emit, isConnected } = useWebSocketContext();
  const { addNotification } = useAppStore();

  return React.useCallback(
    (
      event: string,
      data: Record<string, unknown>,
      options?: {
        showSuccess?: boolean;
        showError?: boolean;
        successMessage?: string;
        errorMessage?: string;
      }
    ) => {
      const {
        showSuccess = false,
        showError = true,
        successMessage = "Event sent successfully",
        errorMessage = "Failed to send event - not connected to server",
      } = options || {};

      try {
        if (!isConnected) {
          if (showError) {
            addNotification({
              type: "warning",
              title: "Connection Required",
              message: errorMessage,
              read: false,
            });
          }
          return false;
        }

        emit(event, data);

        if (showSuccess) {
          addNotification({
            type: "success",
            title: "Success",
            message: successMessage,
            read: false,
          });
        }

        return true;
      } catch (error) {
        if (showError) {
          addNotification({
            type: "error",
            title: "Error",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
            read: false,
          });
        }
        return false;
      }
    },
    [emit, isConnected, addNotification]
  );
}

// Hook for subscribing to WebSocket events with automatic cleanup
export function useWebSocketSubscription(
  event: string,
  callback: (data: unknown) => void,
  deps: React.DependencyList = []
) {
  const { subscribe, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(event, callback);

    return () => {
      unsubscribe();
    };
  }, [event, isConnected, subscribe, ...deps]);
}

// Utility component for showing WebSocket status
export function WebSocketStatusBar() {
  const { isConnected, connectionStatus, error } = useWebSocketStatus();
  const { reconnect } = useWebSocketContext();

  if (!isConnected || error) {
    return (
      <div className="bg-primary/10 border-b border-primary/20 p-2 text-sm text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span>
            {connectionStatus === "connecting"
              ? "Connecting to real-time updates..."
              : "Real-time updates unavailable"}
          </span>
          {error && (
            <button
              onClick={reconnect}
              className="ml-2 text-yellow-700 hover:text-yellow-900 underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default WebSocketProvider;
