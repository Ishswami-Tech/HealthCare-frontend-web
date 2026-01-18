import { useQueryData } from '../core/useQueryData';
import { getDetailedHealthStatus } from '@/lib/actions/health.server';
import { useHealthRealtime } from '../realtime/useHealthRealtime';
import { useHealthStore } from '@/stores';
import { useEffect } from 'react';

// Detailed health check response type matching backend structure
export interface DetailedHealthStatus {
  database?: {
    status: string;
    isHealthy: boolean;
    connectionCount?: number;
    activeQueries?: number;
    avgResponseTime?: number;
    lastHealthCheck?: string;
    errors?: string[];
  };
  cache?: {
    status: string;
    healthy: boolean;
    connection?: {
      connected: boolean;
      latency?: number;
      provider?: string;
      providerStatus?: string;
    };
    latency?: number;
    provider?: string;
  };
  queue?: {
    status: string;
    healthy: boolean;
    connection?: {
      connected: boolean;
      latency?: number;
      provider?: string;
    };
    metrics?: {
      totalJobs?: number;
      activeJobs?: number;
      waitingJobs?: number;
      failedJobs?: number;
      completedJobs?: number;
      errorRate?: number;
    };
    performance?: {
      averageProcessingTime?: number;
      throughputPerMinute?: number;
    };
  };
  communication?: {
    status: string;
    healthy: boolean;
    degraded?: boolean;
    circuitBreakerOpen?: boolean;
    socket?: {
      connected: boolean;
      latency?: number;
      connectedClients?: number;
    };
    email?: {
      connected: boolean;
      latency?: number;
    };
    whatsapp?: {
      connected: boolean;
    };
    push?: {
      connected: boolean;
    };
    metrics?: {
      socketConnections?: number;
      emailQueueSize?: number;
    };
    issues?: string[];
  };
  video?: {
    status: string;
    primaryProvider?: string;
    fallbackProvider?: string;
    isHealthy?: boolean;
    error?: string;
  };
  logging?: {
    status: string;
    healthy?: boolean;
    service?: {
      available?: boolean;
      latency?: number;
      serviceName?: string;
    };
    endpoint?: {
      accessible?: boolean;
      latency?: number;
      url?: string;
      port?: number;
      statusCode?: number;
    };
    metrics?: {
      totalLogs?: number;
      errorRate?: number;
      averageResponseTime?: number;
    };
    error?: string;
  };
  uptime?: number;
  system?: {
    cpu?: number;
    memory?: number;
    activeConnections?: number;
    requestRate?: number;
    errorRate?: number;
  };
}

export const useHealthStatus = () => {
  return useQueryData<DetailedHealthStatus>(
    ['healthStatus'],
    async () => {
      const result = await getDetailedHealthStatus();
      return result;
    },
    { refetchInterval: false } // No polling - use Socket.IO only
  );
};

/**
 * Comprehensive health check hook using Socket.IO real-time updates
 * Uses Zustand store for state management
 * Uses React Query with server action for initial fetch
 */
export const useDetailedHealthStatus = () => {
  // Initialize Socket.IO connection (updates Zustand store)
  const { socket, reconnect, subscribe } = useHealthRealtime({ enabled: true });

  // Get state from Zustand store
  const healthStatus = useHealthStore((state) => state.healthStatus);
  const isConnected = useHealthStore((state) => state.isConnected);
  const connectionStatus = useHealthStore((state) => state.connectionStatus);
  const lastUpdate = useHealthStore((state) => state.lastUpdate);
  const error = useHealthStore((state) => state.error);

  // Strategy: Try Socket.IO first, fallback to REST polling if Socket.IO fails
  // Only enable REST API if Socket.IO connection has failed or is disconnected
  const shouldUseRestFallback = connectionStatus === 'disconnected' || connectionStatus === 'error';
  
  const queryResult = useQueryData<DetailedHealthStatus>(
    ['detailedHealthStatus'],
    getDetailedHealthStatus,
    { 
      // Only use REST polling as fallback when Socket.IO fails
      refetchInterval: shouldUseRestFallback ? 15000 : false, // Poll every 15s only if Socket.IO failed
      refetchOnWindowFocus: shouldUseRestFallback,
      refetchOnReconnect: true,
      enabled: shouldUseRestFallback, // Only fetch via REST if Socket.IO failed
    }
  );

  // Subscribe to Socket.IO on mount
  useEffect(() => {
    if (socket?.connected) {
      subscribe();
    }
  }, [socket, subscribe]);

  // Prefer Socket.IO data (real-time), fallback to REST API data
  const data = healthStatus || queryResult.data || null;
  const isPending = connectionStatus === 'connecting' || (queryResult.isPending && shouldUseRestFallback);
  
  return {
    data,
    isPending,
    isFetching: queryResult.isFetching,
    error: error || queryResult.error,
    refetch: async () => {
      reconnect();
      return queryResult.refetch();
    },
    // Socket.IO connection info
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect,
  };
}; 