"use client";

import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { APP_CONFIG } from '@/lib/config/config';
import { useHealthStore } from '@/stores/health.store';
import { DetailedHealthStatus } from './useHealth';

// Realtime health status types matching backend format
export interface RealtimeHealthStatus {
  t: string; // timestamp (ISO 8601)
  o: 'healthy' | 'degraded' | 'unhealthy'; // overall status
  s: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      timestamp: string;
      responseTime?: number;
      error?: string;
      details?: string;
    };
  };
  sys?: {
    cpu: number;
    memory: number;
    activeConnections: number;
    requestRate: number;
    errorRate: number;
  };
  u: number; // uptime in seconds
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
  const services = realtime.s;
  
  return {
    database: services.database ? {
      status: services.database.status === 'healthy' ? 'up' : 'down',
      isHealthy: services.database.status === 'healthy',
      avgResponseTime: services.database.responseTime,
      lastHealthCheck: services.database.timestamp,
      errors: services.database.error ? [services.database.error] : [],
    } : undefined,
    cache: services.cache ? {
      status: services.cache.status === 'healthy' ? 'up' : 'down',
      healthy: services.cache.status === 'healthy',
      connection: {
        connected: services.cache.status === 'healthy',
        latency: services.cache.responseTime,
        provider: 'dragonfly',
        providerStatus: services.cache.status === 'healthy' ? 'connected' : 'disconnected',
      },
      latency: services.cache.responseTime,
      provider: 'dragonfly',
    } : undefined,
    queue: services.queue ? {
      status: services.queue.status === 'healthy' ? 'up' : 'down',
      healthy: services.queue.status === 'healthy',
      connection: {
        connected: services.queue.status === 'healthy',
        latency: services.queue.responseTime,
        provider: 'bullmq',
      },
    } : undefined,
    communication: services.communication || services.socket ? {
      status: (services.communication?.status || services.socket?.status) === 'healthy' ? 'up' : 'down',
      healthy: (services.communication?.status || services.socket?.status) === 'healthy',
      degraded: (services.communication?.status || services.socket?.status) === 'degraded',
      socket: services.socket ? {
        connected: services.socket.status === 'healthy',
        latency: services.socket.responseTime,
        connectedClients: 0,
      } : undefined,
      email: services.email ? {
        connected: services.email.status === 'healthy',
        latency: services.email.responseTime,
      } : undefined,
      whatsapp: services.whatsapp ? {
        connected: services.whatsapp.status === 'healthy',
      } : undefined,
      push: services.push ? {
        connected: services.push.status === 'healthy',
      } : undefined,
    } : undefined,
    video: services.video ? {
      status: services.video.status === 'healthy' ? 'up' : 'down',
      isHealthy: services.video.status === 'healthy',
      primaryProvider: 'openvidu',
      error: services.video.error,
    } : undefined,
    logging: services.logger || services.logging ? {
      status: (services.logger?.status || services.logging?.status) === 'healthy' ? 'up' : 'down',
      healthy: (services.logger?.status || services.logging?.status) === 'healthy',
      service: {
        available: (services.logger?.status || services.logging?.status) === 'healthy',
        latency: services.logger?.responseTime || services.logging?.responseTime,
        serviceName: 'LoggingService',
      },
      error: services.logger?.error || services.logging?.error,
    } : undefined,
  };
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

  // Get store actions
  const setHealthStatus = useHealthStore((state) => state.setHealthStatus);
  const setConnectionStatus = useHealthStore((state) => state.setConnectionStatus);
  const setIsConnected = useHealthStore((state) => state.setIsConnected);
  const setLastUpdate = useHealthStore((state) => state.setLastUpdate);
  const setError = useHealthStore((state) => state.setError);

  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!enabled) return;

    const API_URL = APP_CONFIG.API.BASE_URL;
    const healthSocket = io(`${API_URL}/health`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
      forceNew: false,
    });

    socketRef.current = healthSocket;

    // Connection events
    healthSocket.on('connect', () => {
      console.log('✅ Health monitoring connected via Socket.IO');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    healthSocket.on('disconnect', (reason) => {
      console.log('❌ Health monitoring disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    healthSocket.on('connect_error', (err) => {
      console.error('❌ Health monitoring connection error:', err);
      setConnectionStatus('error');
      setError(err);
    });

    // Health status events
    healthSocket.on('health:status', (data: RealtimeHealthStatus) => {
      try {
        const converted = convertRealtimeToDetailed(data);
        setHealthStatus(converted);
        setLastUpdate(new Date(data.t));
        setError(null);
      } catch (err) {
        console.error('Error converting health status:', err);
        setError(err instanceof Error ? err : new Error('Invalid health data'));
      }
    });

    healthSocket.on('health:service:update', (update: HealthUpdate) => {
      // Update service status in Zustand store
      const currentStatus = useHealthStore.getState().healthStatus;
      if (!currentStatus) return;

      const updated = { ...currentStatus };
      
      // Map service IDs to our format
      if (update.id === 'database' && updated.database) {
        updated.database = {
          ...updated.database,
          status: update.st === 'healthy' ? 'up' : 'down',
          isHealthy: update.st === 'healthy',
          avgResponseTime: update.rt,
          lastHealthCheck: update.t,
        };
      } else if (update.id === 'cache' && updated.cache) {
        updated.cache = {
          ...updated.cache,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
          latency: update.rt,
          connection: {
            ...updated.cache.connection,
            connected: update.st === 'healthy',
            latency: update.rt,
          },
        };
      } else if (update.id === 'queue' && updated.queue) {
        updated.queue = {
          ...updated.queue,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
          connection: {
            ...updated.queue.connection,
            connected: update.st === 'healthy',
            latency: update.rt,
          },
        };
      } else if (update.id === 'communication' || update.id === 'socket') {
        if (updated.communication) {
          updated.communication = {
            ...updated.communication,
            status: update.st === 'healthy' ? 'up' : 'down',
            healthy: update.st === 'healthy',
            degraded: update.st === 'degraded',
            socket: updated.communication.socket ? {
              ...updated.communication.socket,
              connected: update.st === 'healthy',
              latency: update.rt,
            } : undefined,
          };
        }
      } else if (update.id === 'video' && updated.video) {
        updated.video = {
          ...updated.video,
          status: update.st === 'healthy' ? 'up' : 'down',
          isHealthy: update.st === 'healthy',
        };
      } else if ((update.id === 'logger' || update.id === 'logging') && updated.logging) {
        updated.logging = {
          ...updated.logging,
          status: update.st === 'healthy' ? 'up' : 'down',
          healthy: update.st === 'healthy',
          service: updated.logging.service ? {
            ...updated.logging.service,
            available: update.st === 'healthy',
            latency: update.rt,
          } : undefined,
        };
      }
      
      setHealthStatus(updated);
      setLastUpdate(new Date(update.t));
    });

    healthSocket.on('health:heartbeat', (heartbeat: HealthHeartbeat) => {
      setLastUpdate(new Date(heartbeat.t));
    });

    setConnectionStatus('connecting');

    // Cleanup
    return () => {
      healthSocket.disconnect();
    };
  }, [enabled, setHealthStatus, setConnectionStatus, setIsConnected, setLastUpdate, setError]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  const subscribe = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('health:subscribe', { room: 'health:all' }, (response: { success: boolean; status?: RealtimeHealthStatus }) => {
        if (response.success && response.status) {
          const converted = convertRealtimeToDetailed(response.status);
          setHealthStatus(converted);
          setLastUpdate(new Date(response.status.t));
        }
      });
    }
  }, [setHealthStatus, setLastUpdate]);

  const unsubscribe = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('health:unsubscribe', () => {});
    }
  }, []);

  return {
    socket: socketRef.current,
    reconnect,
    subscribe,
    unsubscribe,
  };
}
