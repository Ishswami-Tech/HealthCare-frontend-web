"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { APP_CONFIG } from "@/lib/config/config";

export interface WebSocketState {
  socket: Socket | null;
  connectionKey: string | null;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  error: string | null;
  lastActivity: Date | null;
  connectionMetrics: {
    totalConnections: number;
    reconnectionAttempts: number;
    messagesReceived: number;
    messagesSent: number;
    lastDisconnectReason?: 'auth_expired' | 'io_server_disconnect' | 'transport_close' | 'client_disconnect' | 'unknown';
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
  forceReconnect?: boolean;
  onAuthError?: (error: Error) => void;
  onConnect?: () => void;
}

function normalizeSocketUrl(url: string, namespace = '') {
  let normalizedUrl = url.trim();

  if (!/^[a-z]+:\/\//i.test(normalizedUrl)) {
    normalizedUrl = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(normalizedUrl)
      ? `http://${normalizedUrl}`
      : `https://${normalizedUrl}`;
  }

  normalizedUrl = normalizedUrl.replace(/\/socket\.io\/?$/, '');
  normalizedUrl = normalizedUrl.replace(/^ws:\/\//, 'http://');
  normalizedUrl = normalizedUrl.replace(/^wss:\/\//, 'https://');

  return namespace ? `${normalizedUrl}${namespace}` : normalizedUrl;
}

function buildConnectionKey(args: {
  fullUrl: string;
  tenantId?: string;
  userId?: string;
}) {
  return [
    args.fullUrl,
    args.tenantId?.trim() || '',
    args.userId?.trim() || '',
  ].join('|');
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      socket: null,
      connectionKey: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      error: null,
      lastActivity: null,
      connectionMetrics: {
        totalConnections: 0,
        reconnectionAttempts: 0,
        messagesReceived: 0,
        messagesSent: 0,
        lastDisconnectReason: undefined,
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
          forceReconnect = false,
          onAuthError,
        } = options;

        const fullUrl = normalizeSocketUrl(url, namespace);
        const connectionKey = buildConnectionKey({ fullUrl, tenantId, userId });
        const currentSocket = get().socket;
        const currentState = get();
        const isSameConnection = currentState.connectionKey === connectionKey;
        const isActiveOrConnecting =
          currentSocket?.connected ||
          currentState.connectionStatus === 'connecting' ||
          currentState.connectionStatus === 'reconnecting';

        if (currentSocket && isSameConnection && isActiveOrConnecting && !forceReconnect) {
          if (currentSocket.connected && typeof options.onConnect === 'function') {
            options.onConnect();
          }
          return;
        }

        if (currentSocket) {
          try {
            currentSocket.removeAllListeners();
          } catch {
            // Ignore listener cleanup failures during reconnect teardown.
          }
          currentSocket.disconnect();
          set({ socket: null, connectionKey: null, isConnected: false });
        }

        set({ connectionStatus: 'connecting', error: null });

        try {
          // ✅ FIX: Normalize Socket.IO URL
          // Socket.IO expects base HTTP/HTTPS URL, not ws:// or wss://
          // It automatically handles protocol upgrade and /socket.io path
          const auth: Record<string, string> = {};
          if (typeof token === 'string' && token.trim().length > 0) {
            auth.token = token;
          }
          if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
            auth.tenantId = tenantId;
          }
          if (typeof userId === 'string' && userId.trim().length > 0) {
            auth.userId = userId;
          }

          const query: Record<string, string> = {};
          if (typeof tenantId === 'string' && tenantId.trim().length > 0) {
            query.tenantId = tenantId;
          }
          if (typeof userId === 'string' && userId.trim().length > 0) {
            query.userId = userId;
          }
          
          const socket = io(fullUrl, {
            withCredentials: true,
            ...(Object.keys(auth).length ? { auth } : {}),
            ...(Object.keys(query).length ? { query } : {}),
            autoConnect: true,
            reconnection: autoReconnect,
            reconnectionAttempts,
            reconnectionDelay,
            reconnectionDelayMax: 5000,
            timeout: 20000,
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
            if (typeof options.onConnect === 'function') {
              options.onConnect();
            }
          });

          socket.on('disconnect', (reason) => {
            // WebSocket disconnected
            set((state) => ({
              isConnected: false,
              connectionStatus: reason === 'io client disconnect' ? 'disconnected' : 'reconnecting',
              lastActivity: new Date(),
              connectionMetrics: {
                ...state.connectionMetrics,
                lastDisconnectReason:
                  reason === 'io client disconnect' ? 'client_disconnect' :
                  reason === 'io server disconnect' ? 'io_server_disconnect' :
                  'transport_close',
              },
            }));
          });

          socket.on('connect_error', (error: Error & { type?: string; description?: string; context?: unknown }) => {
            const message = String(error?.message || '');
            const isAuthError = /jwt expired|token has expired|access token has expired|please refresh|authentication required|no token or session/i.test(message);
            if (isAuthError) {
              try {
                socket.disconnect();
              } catch {
                // Ignore disconnect errors during auth recovery.
              }
              if (onAuthError) {
                onAuthError(error);
              }
              set({
                isConnected: false,
                connectionStatus: 'error',
                error: message || 'Authentication failed',
                connectionMetrics: {
                  ...get().connectionMetrics,
                  lastDisconnectReason: 'auth_expired',
                },
              });
              return;
            }

            set((state) => ({
              isConnected: false,
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
                // Clear the stale disconnect reason so consumers don't keep
                // showing "session expired" after the socket recovered.
                lastDisconnectReason: undefined,
              },
            }));
          });

          socket.on('reconnect_attempt', (_attemptNumber) => {
            // WebSocket reconnection attempt
            set({
              connectionStatus: 'reconnecting',
              error: null,
            });
          });

          socket.on('reconnect_error', (error) => {
            set({
              isConnected: false,
              connectionStatus: 'error',
              error: `Reconnection failed: ${error.message}`,
            });
          });

          socket.on('reconnect_failed', () => {
            set({
              isConnected: false,
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

          set({ socket, connectionKey });

        } catch (error) {
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
    const url =
      APP_CONFIG.WEBSOCKET.URL ||
      APP_CONFIG.API.RAW_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
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
    const url =
      APP_CONFIG.WEBSOCKET.URL ||
      APP_CONFIG.API.RAW_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
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

// ConnectionOptions is already exported above, no need to re-export
