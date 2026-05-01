"use client";
import { nowIso } from '@/lib/utils/date-time';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '@/lib/config/config';
import { useHealthStore } from '@/stores';
import { useAuthStore } from '@/stores/auth.store';
import { refreshToken } from '@/lib/actions/auth.server';
import { DetailedHealthStatus } from '../query/useHealth';

// Realtime health status types matching backend format
// Realtime health status types matching backend format (supporting both compressed and verbose)
export interface RealtimeHealthStatus {
  t?: string; // timestamp (ISO 8601) - compressed
  timestamp?: string; // verbose
  o?: 'healthy' | 'degraded' | 'unhealthy'; // overall status - compressed
  overall?: 'healthy' | 'degraded' | 'unhealthy'; // verbose
  s?: { // services - compressed
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      responseTime?: number;
      error?: string;
      details?: string | { message: string };
    };
  };
  services?: { // services - verbose
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      responseTime?: number;
      error?: string;
      details?: string | { message: string };
    };
  };
  sys?: { // system - compressed
    cpu: number;
    memory: number;
    activeConnections: number;
    requestRate: number;
    errorRate: number;
  };
  system?: { // system - verbose
    cpu: number;
    memory: number | { heapTotal: number; heapUsed: number; rss: number; [key: string]: any }; // Handle complex memory object if needed
    activeConnections: number;
    requestRate: number;
    errorRate: number;
  };
  u?: number; // uptime - compressed
  uptime?: number; // uptime - verbose
}

export interface HealthUpdate {
  t: string; // timestamp
  ty: 'service' | 'system'; // type
  id: string; // service ID
  st: 'healthy' | 'degraded' | 'unhealthy'; // status
  rt?: number; // response time
}

export interface HealthHeartbeat {
  t: string; // timestamp
  o: 'healthy' | 'degraded' | 'unhealthy'; // overall status
}

// Convert realtime format to DetailedHealthStatus format
function convertRealtimeToDetailed(realtime: RealtimeHealthStatus): DetailedHealthStatus {
  // Support both compressed ('s') and verbose ('services') keys
  const services = realtime.s || realtime.services || {};
  const result: DetailedHealthStatus = {};
  
  // Helper to safely get timestamp
  const getTimestamp = (ts: string | undefined) => ts || nowIso();

  // Database
  if (services.database) {
    result.database = {
      status: services.database.status === 'healthy' ? 'up' : 'down',
      isHealthy: services.database.status === 'healthy',
      lastHealthCheck: getTimestamp(services.database.timestamp),
    };
    if (services.database.responseTime !== undefined) {
      result.database.avgResponseTime = services.database.responseTime;
    }
    if (services.database.error) {
      result.database.errors = [services.database.error];
    }
  }
  
  // Cache
  if (services.cache) {
    const cacheConnection: {
      connected: boolean;
      latency?: number;
      provider: string;
      providerStatus: string;
    } = {
      connected: services.cache.status === 'healthy',
      provider: 'dragonfly',
      providerStatus: services.cache.status === 'healthy' ? 'connected' : 'disconnected',
    };
    
    if (services.cache.responseTime !== undefined) {
      cacheConnection.latency = services.cache.responseTime;
    }
    
    result.cache = {
      status: services.cache.status === 'healthy' ? 'up' : 'down',
      healthy: services.cache.status === 'healthy',
      connection: cacheConnection,
      provider: 'dragonfly',
    };
    
    if (services.cache.responseTime !== undefined) {
      result.cache.latency = services.cache.responseTime;
    }
  }
  
  // Queue
  if (services.queue) {
    const queueConnection: any = {
      connected: services.queue.status === 'healthy',
      provider: 'bullmq',
    };
    
    if (services.queue.responseTime !== undefined) {
      queueConnection.latency = services.queue.responseTime;
    }
    
    result.queue = {
      status: services.queue.status === 'healthy' ? 'up' : 'down',
      healthy: services.queue.status === 'healthy',
      connection: queueConnection,
    };
  }
  
  // Communication
  if (services.communication || services.socket) {
    const commStatus = services.communication?.status || services.socket?.status;
    const isHealthy = commStatus === 'healthy';
    
    result.communication = {
      status: isHealthy ? 'up' : 'down',
      healthy: isHealthy,
    };
    
    if (commStatus === 'degraded') {
      result.communication.degraded = true;
    }
    
    if (services.socket) {
      result.communication.socket = {
        connected: services.socket.status === 'healthy',
        connectedClients: 0,
      };
      if (services.socket.responseTime !== undefined) {
        result.communication.socket.latency = services.socket.responseTime;
      }
    }
    
    if (services.email) {
      result.communication.email = {
        connected: services.email.status === 'healthy',
      };
      if (services.email.responseTime !== undefined) {
        result.communication.email.latency = services.email.responseTime;
      }
    }
    
    if (services.whatsapp) {
      result.communication.whatsapp = {
        connected: services.whatsapp.status === 'healthy',
      };
    }
    
    if (services.push) {
      result.communication.push = {
        connected: services.push.status === 'healthy',
      };
    }
  }
  
  // Video
  if (services.video) {
    result.video = {
      status: services.video.status === 'healthy' ? 'up' : 'down',
      primaryProvider: 'openvidu',
    };
    if (services.video.status === 'healthy') {
      result.video.isHealthy = true;
    }
    if (services.video.error) {
      result.video.error = services.video.error;
    }
  }
  
  // Logging
  if (services.logger || services.logging) {
    const srv = services.logger || services.logging;
    if (srv) {
        const isHealthy = srv.status === 'healthy';
        
        const loggingService: any = {
          available: isHealthy,
          serviceName: "LoggingService",
        };

        if (srv.responseTime !== undefined) {
          loggingService.latency = srv.responseTime;
        }

        const loggingUpdate: any = {
          status: isHealthy ? "up" : "down",
          service: loggingService,
          healthy: isHealthy,
        };

        if (srv.error) {
          loggingUpdate.error = srv.error;
        }

        result.logging = loggingUpdate;
    }
  }

  // System Metrics & Uptime
  if (realtime.u !== undefined) result.uptime = realtime.u;
  if (realtime.uptime !== undefined) result.uptime = realtime.uptime;
  
  const sys = realtime.sys || realtime.system;
  if (sys) {
    // Basic mapping
    result.system = {
        cpu: typeof sys.cpu === 'number' ? sys.cpu : 0,
        memory: typeof sys.memory === 'number' ? sys.memory : 0,
        activeConnections: sys.activeConnections || 0,
        requestRate: sys.requestRate || 0,
        errorRate: sys.errorRate || 0
    };
  }
  
  return result;
}

const HEALTH_NAMESPACE_ROOM = 'health:all';
const healthSocketBound = new WeakSet<Socket>();
let sharedHealthSocket: Socket | null = null;
let sharedHealthRefCount = 0;
let sharedHealthDisconnectTimer: number | null = null;
let sharedHealthAuthRefreshInFlight = false;

function emitInitialHealthSnapshot() {
  if (!sharedHealthSocket?.connected) return;

  sharedHealthSocket.emit(
    'health:subscribe',
    { room: HEALTH_NAMESPACE_ROOM },
    (response: { success: boolean; status?: RealtimeHealthStatus }) => {
      if (response.success && response.status) {
        const converted = convertRealtimeToDetailed(response.status);
        useHealthStore.getState().setHealthStatus(converted);
        if (response.status.t) {
          useHealthStore.getState().setLastUpdate(new Date(response.status.t));
        }
      }
    }
  );
}

function bindSharedHealthSocket(socket: Socket) {
  if (healthSocketBound.has(socket)) return;

  healthSocketBound.add(socket);

  socket.on('connect', () => {
    useHealthStore.getState().setIsConnected(true);
    useHealthStore.getState().setConnectionStatus('connected');
    useHealthStore.getState().setError(null);
    emitInitialHealthSnapshot();
  });

  socket.on('disconnect', () => {
    useHealthStore.getState().setIsConnected(false);
    useHealthStore.getState().setConnectionStatus('disconnected');
  });

  socket.on('connect_error', (err: Error & { type?: string; description?: string; context?: unknown }) => {
    const message = String(err?.message || '');
    const isAuthError = /jwt expired|authentication required|no token or session/i.test(message);

    if (isAuthError) {
      socket.disconnect();

      if (!sharedHealthAuthRefreshInFlight) {
        sharedHealthAuthRefreshInFlight = true;
        void (async () => {
          try {
            const refreshedSession = await refreshToken();
            if (!refreshedSession?.access_token) {
              useHealthStore.getState().setConnectionStatus('error');
              useHealthStore.getState().setError(err);
              return;
            }

            useAuthStore.getState().setSession(refreshedSession);
            socket.auth = { token: refreshedSession.access_token };
            socket.connect();
          } catch {
            useHealthStore.getState().setConnectionStatus('error');
            useHealthStore.getState().setError(err);
          } finally {
            sharedHealthAuthRefreshInFlight = false;
          }
        })();
        return;
      }

      return;
    }

    useHealthStore.getState().setConnectionStatus('error');
    useHealthStore.getState().setError(err);
  });

  socket.on('health:status', (data: RealtimeHealthStatus) => {
    try {
      const converted = convertRealtimeToDetailed(data);
      useHealthStore.getState().setHealthStatus(converted);
      if (data.t) {
        useHealthStore.getState().setLastUpdate(new Date(data.t));
      }
      useHealthStore.getState().setError(null);
    } catch (err) {
      useHealthStore.getState().setError(err instanceof Error ? err : new Error('Invalid health data'));
    }
  });

  socket.on('health:service:update', (update: HealthUpdate) => {
    const currentStatus = useHealthStore.getState().healthStatus;
    if (!currentStatus) return;

    const updated = { ...currentStatus };

    if (update.id === 'database' && updated.database) {
      updated.database = {
        ...updated.database,
        status: update.st === 'healthy' ? 'up' : 'down',
        isHealthy: update.st === 'healthy',
        ...(update.rt !== undefined && { avgResponseTime: update.rt }),
        lastHealthCheck: update.t,
      };
    } else if (update.id === 'cache' && updated.cache) {
      updated.cache = {
        ...updated.cache,
        status: update.st === 'healthy' ? 'up' : 'down',
        healthy: update.st === 'healthy',
        ...(update.rt !== undefined && { latency: update.rt }),
        connection: updated.cache.connection
          ? {
              ...updated.cache.connection,
              connected: update.st === 'healthy',
              ...(update.rt !== undefined && { latency: update.rt }),
            }
          : {
              connected: update.st === 'healthy',
              ...(update.rt !== undefined && { latency: update.rt }),
              provider: 'dragonfly',
            },
      };
    } else if (update.id === 'queue' && updated.queue) {
      updated.queue = {
        ...updated.queue,
        status: update.st === 'healthy' ? 'up' : 'down',
        healthy: update.st === 'healthy',
        connection: updated.queue.connection
          ? {
              ...updated.queue.connection,
              connected: update.st === 'healthy',
              ...(update.rt !== undefined && { latency: update.rt }),
            }
          : {
              connected: update.st === 'healthy',
              ...(update.rt !== undefined && { latency: update.rt }),
              provider: 'bullmq',
            },
      };
    } else if (update.id === 'communication' || update.id === 'socket') {
      if (updated.communication) {
        const commUpdate: typeof updated.communication = {
          ...updated.communication,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
        };

        if (update.st === 'degraded') {
          commUpdate.degraded = true;
        }

        if (updated.communication.socket) {
          commUpdate.socket = {
            ...updated.communication.socket,
            connected: update.st === 'healthy',
          };
          if (update.rt !== undefined) {
            commUpdate.socket.latency = update.rt;
          }
        }

        updated.communication = commUpdate;
      }
    } else if (update.id === 'video' && updated.video) {
      updated.video = {
        ...updated.video,
        status: update.st === 'healthy' ? 'up' : 'down',
        ...(update.st === 'healthy' && { isHealthy: true }),
      };
    } else if ((update.id === 'logger' || update.id === 'logging') && updated.logging) {
      const loggingUpdate: typeof updated.logging = {
        ...updated.logging,
        status: update.st === 'healthy' ? 'up' : 'down',
      };

      if (update.st === 'healthy') {
        loggingUpdate.healthy = true;
      }

      if (updated.logging.service) {
        loggingUpdate.service = {
          ...updated.logging.service,
          available: update.st === 'healthy',
        };
        if (update.rt !== undefined) {
          loggingUpdate.service.latency = update.rt;
        }
      }

      updated.logging = loggingUpdate;
    }

    useHealthStore.getState().setHealthStatus(updated);
    useHealthStore.getState().setLastUpdate(new Date(update.t));
  });

  socket.on('health:heartbeat', (heartbeat: HealthHeartbeat) => {
    useHealthStore.getState().setLastUpdate(new Date(heartbeat.t));
  });
}

export interface UseHealthRealtimeOptions {
  enabled?: boolean;
}

export interface UseHealthRealtimeReturn {
  socket: Socket | null;
  reconnect: () => void;
  subscribe: () => void;
  unsubscribe: () => void;
}

/**
 * Hook for real-time health monitoring via Socket.IO
 * Uses Zustand store for state management
 */
export function useHealthRealtime(
  options: UseHealthRealtimeOptions = {}
): UseHealthRealtimeReturn {
  const {
    enabled = true,
  } = options;
  const currentToken = useAuthStore((state) => state.session?.access_token);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!enabled) return;

    if (sharedHealthDisconnectTimer !== null) {
      window.clearTimeout(sharedHealthDisconnectTimer);
      sharedHealthDisconnectTimer = null;
    }

    if (!currentToken) {
      if (sharedHealthSocket) {
        sharedHealthSocket.disconnect();
        sharedHealthSocket = null;
      }
      sharedHealthRefCount = 0;
      useHealthStore.getState().setIsConnected(false);
      useHealthStore.getState().setConnectionStatus('disconnected');
      useHealthStore.getState().setError(null);
      return;
    }

    sharedHealthRefCount += 1;

    if (!sharedHealthSocket) {
      // ✅ FIX: Use WebSocket URL, not API URL (API URL has /api/v1 prefix)
      // Socket.IO health namespace is at base WebSocket URL + /health
      const WEBSOCKET_URL = APP_CONFIG.WEBSOCKET.URL || '';

      let baseUrl = (WEBSOCKET_URL || '').trim();
      try {
        const normalizedBase = /^[a-z]+:\/\//i.test(baseUrl)
          ? baseUrl
          : /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(baseUrl)
            ? `http://${baseUrl}`
            : `https://${baseUrl}`;
        const parsedBase = new URL(normalizedBase);
        baseUrl = `${parsedBase.protocol}//${parsedBase.host}`;
      } catch {
        const cleaned = baseUrl.replace(/\/+$/, '');
        baseUrl = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?(\/.*)?$/i.test(cleaned)
          ? `http://${cleaned}`
          : cleaned;
      }

      const healthSocketUrl = `${baseUrl}/health`;
      sharedHealthSocket = io(healthSocketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 20000,
        forceNew: false,
        ...(currentToken ? { auth: { token: currentToken } } : {}),
      });
      bindSharedHealthSocket(sharedHealthSocket);
      useHealthStore.getState().setConnectionStatus('connecting');
    } else if (currentToken) {
      const socketAuth = sharedHealthSocket.auth as { token?: string } | undefined;

      if (socketAuth?.token !== currentToken) {
        sharedHealthSocket.auth = { token: currentToken } as { token: string };
      }

      if (!sharedHealthSocket.connected) {
        sharedHealthSocket.connect();
      }
    }

    return () => {
      sharedHealthRefCount = Math.max(0, sharedHealthRefCount - 1);
      if (sharedHealthRefCount > 0) {
        return;
      }

      if (sharedHealthDisconnectTimer !== null) {
        window.clearTimeout(sharedHealthDisconnectTimer);
      }

      sharedHealthDisconnectTimer = window.setTimeout(() => {
        sharedHealthSocket?.disconnect();
        sharedHealthSocket = null;
        sharedHealthAuthRefreshInFlight = false;
      }, 250);
    };
  }, [enabled, currentToken]);

  const reconnect = useCallback(() => {
    if (sharedHealthSocket) {
      if (sharedHealthDisconnectTimer !== null) {
        window.clearTimeout(sharedHealthDisconnectTimer);
        sharedHealthDisconnectTimer = null;
      }
      sharedHealthSocket.connect();
    }
  }, []);

  const subscribe = useCallback(() => {
    if (sharedHealthSocket && sharedHealthSocket.connected) {
      emitInitialHealthSnapshot();
    }
  }, []);

  const unsubscribe = useCallback(() => {
    if (sharedHealthSocket && sharedHealthSocket.connected) {
      sharedHealthSocket.emit('health:unsubscribe', () => {});
    }
  }, []);

  return {
    socket: sharedHealthSocket,
    reconnect,
    subscribe,
    unsubscribe,
  };
}



