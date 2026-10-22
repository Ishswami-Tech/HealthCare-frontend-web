import { useQueryData } from '../core/useQueryData';
import { useHealthRealtime } from '../realtime/useHealthRealtime';
import { useHealthStore } from '@/stores';
import { useEffect } from 'react';
import { getDetailedHealthStatus as getDetailedHealthStatusServerAction } from '@/lib/actions/health.server';
import { nextHealthFailureStreak } from '@/lib/utils/health-status';

/** HTTP /health poll interval for visitors without the admin health socket. */
const HEALTH_HTTP_POLL_INTERVAL_MS = 60_000;
/** Re-check sooner after a failing poll, so a blip clears (or an outage is confirmed) quickly. */
const HEALTH_HTTP_RECHECK_INTERVAL_MS = 15_000;

// Detailed health check response type matching backend structure
export interface DetailedHealthStatus {
  /** Set when the health probe itself failed (timeout / network / bad response). */
  probeFailed?: boolean;
  /** Consecutive failing HTTP polls up to this one (absent on live socket snapshots). */
  failureStreak?: number;
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
  return useDetailedHealthStatus();
};

/**
 * Comprehensive health check hook using Socket.IO real-time updates
 * Uses Zustand store for state management
 * Uses React Query with server action for initial fetch
 */
/** Consecutive failing HTTP health polls (module scope: shared by every consumer of the query). */
let httpFailureStreak = 0;

export const useDetailedHealthStatus = () => {
  // Initialize Socket.IO connection (updates Zustand store)
  const { socket, reconnect, subscribe } = useHealthRealtime({ enabled: true });

  // Get state from Zustand store
  const healthStatus = useHealthStore((state) => state.healthStatus);
  const isConnected = useHealthStore((state) => state.isConnected);
  const connectionStatus = useHealthStore((state) => state.connectionStatus);
  const lastUpdate = useHealthStore((state) => state.lastUpdate);
  const error = useHealthStore((state) => state.error);

  // Strategy: only SUPER_ADMIN / CLINIC_ADMIN open the /health socket (see useHealthRealtime).
  // Everyone else - and admins whose socket is not connected (yet) - poll HTTP /health.
  // React Query pauses refetchInterval while the tab is hidden (refetchIntervalInBackground: false).
  const isSocketLive = connectionStatus === 'connected';
  const shouldUseRestFallback = !isSocketLive;

  const queryResult = useQueryData<DetailedHealthStatus>(
    ['detailedHealthStatus'],
    async () => {
      const status = await getDetailedHealthStatusServerAction();
      // One streak per fetch (the queryFn runs once per poll, whatever the number of consumers).
      httpFailureStreak = nextHealthFailureStreak(httpFailureStreak, status);
      return { ...status, failureStreak: httpFailureStreak };
    },
    {
      refetchInterval: shouldUseRestFallback
        ? (query) =>
            (query.state.data?.failureStreak ?? 0) > 0
              ? HEALTH_HTTP_RECHECK_INTERVAL_MS
              : HEALTH_HTTP_POLL_INTERVAL_MS
        : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: shouldUseRestFallback,
      refetchOnReconnect: true,
      enabled: shouldUseRestFallback,
    }
  );

  // Subscribe to Socket.IO on mount
  useEffect(() => {
    if (socket?.connected) {
      subscribe();
    }
  }, [socket, subscribe]);

  // Prefer live Socket.IO data, otherwise the HTTP poll result
  const data = (isSocketLive ? healthStatus : null) || queryResult.data || healthStatus || null;
  const isPending = !data && (connectionStatus === 'connecting' || (queryResult.isPending && shouldUseRestFallback));
  
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

