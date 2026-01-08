"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "@/lib/config/config";

export interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  error: string | null;
  lastActivity: Date | null;
  connectionMetrics: {
    totalConnections: number;
    reconnectionAttempts: number;
    messagesReceived: number;
    messagesSent: number;
  };
  
  // Actions
  connect: (url: string, options?: Record<string, unknown>) => void;
  disconnect: () => void;
  emit: (event: string, data: Record<string, unknown>) => void;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  clearError: () => void;
  reconnect: () => void;
}


export interface ConnectionOptions {
  tenantId?: string;
  userId?: string;
  token?: string;
  namespace?: string;
  autoReconnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      socket: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      lastActivity: null,
      connectionMetrics: {
        totalConnections: 0,
        reconnectionAttempts: 0,
        messagesReceived: 0,
        messagesSent: 0,
      },

      connect: (url: string, options: ConnectionOptions & Record<string, unknown> = {}) => {
        const {
          tenantId,
          userId,
          token,
          namespace = '',
          autoReconnect = true,
          reconnectionAttempts = 5,
          reconnectionDelay = 1000,
        } = options;

        // Disconnect existing connection if any
        const currentSocket = get().socket;
        if (currentSocket?.connected) {
          currentSocket.disconnect();
        }

        set({ connectionStatus: 'connecting', error: null });

        try {
          const fullUrl = namespace ? `${url}${namespace}` : url;
          
          const socket = io(fullUrl, {
            auth: {
              token,
              tenantId,
              userId,
            },
            query: {
              tenantId,
              userId,
            },
            autoConnect: true,
            reconnection: autoReconnect,
            reconnectionAttempts,
            reconnectionDelay,
            reconnectionDelayMax: 5000,
            maxReconnectionAttempts: reconnectionAttempts,
            timeout: 20000,
            forceNew: true,
          });

          // Connection event handlers
          socket.on('connect', () => {
            // WebSocket connected successfully
            set((state) => ({
              isConnected: true,
              connectionStatus: 'connected',
              error: null,
              lastActivity: new Date(),
              connectionMetrics: {
                ...state.connectionMetrics,
                totalConnections: state.connectionMetrics.totalConnections + 1,
              },
            }));
          });

          socket.on('disconnect', (reason) => {
            // WebSocket disconnected
            set({
              isConnected: false,
              connectionStatus: reason === 'io client disconnect' ? 'disconnected' : 'reconnecting',
              lastActivity: new Date(),
            });
          });

          socket.on('connect_error', (error) => {
            console.error('🔥 WebSocket connection error:', error);
            set((state) => ({
              connectionStatus: 'error',
              error: error.message || 'Connection failed',
              connectionMetrics: {
                ...state.connectionMetrics,
                reconnectionAttempts: state.connectionMetrics.reconnectionAttempts + 1,
              },
            }));
          });

          socket.on('reconnect', (attemptNumber) => {
            // WebSocket reconnected successfully
            set((state) => ({
              isConnected: true,
              connectionStatus: 'connected',
              error: null,
              lastActivity: new Date(),
              connectionMetrics: {
                ...state.connectionMetrics,
                reconnectionAttempts: state.connectionMetrics.reconnectionAttempts + attemptNumber,
              },
            }));
          });

          socket.on('reconnect_attempt', (attemptNumber) => {
            // WebSocket reconnection attempt
            set({
              connectionStatus: 'reconnecting',
              error: null,
            });
          });

          socket.on('reconnect_error', (error) => {
            console.error('🔥 WebSocket reconnection error:', error);
            set({
              connectionStatus: 'error',
              error: `Reconnection failed: ${error.message}`,
            });
          });

          socket.on('reconnect_failed', () => {
            console.error('💀 WebSocket reconnection failed completely');
            set({
              connectionStatus: 'error',
              error: 'Failed to reconnect after maximum attempts',
            });
          });

          // Message tracking
          socket.onAny(() => {
            set((state) => ({
              connectionMetrics: {
                ...state.connectionMetrics,
                messagesReceived: state.connectionMetrics.messagesReceived + 1,
              },
              lastActivity: new Date(),
            }));
          });

          set({ socket });

        } catch (error) {
          console.error('🔥 Failed to create WebSocket connection:', error);
          set({
            connectionStatus: 'error',
            error: error instanceof Error ? error.message : 'Failed to create connection',
          });
        }
      },

      disconnect: () => {
        const socket = get().socket;
        if (socket) {
          socket.disconnect();
          set({
            socket: null,
            isConnected: false,
            connectionStatus: 'disconnected',
            error: null,
          });
          // WebSocket disconnected manually
        }
      },

      emit: (event: string, data: Record<string, unknown>) => {
        const socket = get().socket;
        if (socket && socket.connected) {
          socket.emit(event, data);
          set((state) => ({
            connectionMetrics: {
              ...state.connectionMetrics,
              messagesSent: state.connectionMetrics.messagesSent + 1,
            },
            lastActivity: new Date(),
          }));
          // Event emitted successfully
        } else {
          console.warn('⚠️ Cannot emit event: WebSocket not connected');
          set({
            error: 'Cannot emit event: WebSocket not connected',
          });
        }
      },

      subscribe: (event: string, callback: (data: unknown) => void) => {
        const socket = get().socket;
        if (socket) {
          socket.on(event, callback);
          // Subscribed to WebSocket event
          
          // Return unsubscribe function
          return () => {
            socket.off(event, callback);
            // Unsubscribed from WebSocket event
          };
        } else {
          console.warn('⚠️ Cannot subscribe to event: WebSocket not connected');
          return () => {};
        }
      },

      clearError: () => {
        set({ error: null });
      },

      reconnect: () => {
        const socket = get().socket;
        if (socket) {
          socket.connect();
          set({ connectionStatus: 'connecting', error: null });
          // Manual reconnection initiated
        }
      },
    }),
    {
      name: 'websocket-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Convenience hooks for specific WebSocket namespaces
export const useQueueWebSocket = () => {
  const store = useWebSocketStore();
  
  const connectToQueue = (options: ConnectionOptions) => {
    // ⚠️ SECURITY: Use APP_CONFIG instead of hardcoded URLs
    const url = APP_CONFIG.WEBSOCKET.URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL must be set in environment variables');
    }
    store.connect(url, {
      ...options,
      namespace: '/queue-status',
    });
  };

  return {
    ...store,
    connectToQueue,
  };
};

export const useAppointmentWebSocket = () => {
  const store = useWebSocketStore();
  
  const connectToAppointments = (options: ConnectionOptions) => {
    // ⚠️ SECURITY: Use APP_CONFIG instead of hardcoded URLs
    const url = APP_CONFIG.WEBSOCKET.URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_WEBSOCKET_URL or NEXT_PUBLIC_WS_URL must be set in environment variables');
    }
    store.connect(url, {
      ...options,
      namespace: '/appointments',
    });
  };

  return {
    ...store,
    connectToAppointments,
  };
};

// Export types
export type { ConnectionOptions };