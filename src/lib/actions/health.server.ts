'use server';

import { logger } from '@/lib/utils/logger';
import { fetchWithAbort, FetchTimeoutError } from '@/lib/utils/fetch-with-abort';
import { APP_CONFIG, API_ENDPOINTS } from '@/lib/config/config';
import type { DetailedHealthStatus } from '@/hooks/query/useHealth';

const hasBackendProtectionKey = () => Boolean(process.env.BACKEND_PROTECTION_KEY?.trim());

type HealthDebugDetails = {
  status?: number;
  contentType?: string;
};

const createUnavailableStatus = (
  error: string,
  url: string,
  details?: HealthDebugDetails
): DetailedHealthStatus => ({
  debug: {
    source: 'fallback',
    url,
    ok: false,
    error,
    backendProtectionHeaderAttached: hasBackendProtectionKey(),
    timestamp: new Date().toISOString(),
    ...(details || {}),
  },
  database: { status: 'unavailable', isHealthy: false },
  cache: { status: 'unavailable', healthy: false },
  queue: { status: 'unavailable', healthy: false },
  communication: { status: 'unavailable', healthy: false },
  video: { status: 'unavailable', isHealthy: false },
  logging: { status: 'unavailable', healthy: false },
});

export async function getDetailedHealthStatus(): Promise<DetailedHealthStatus> {
  const HEALTH_URL = `${APP_CONFIG.API.HEALTH_BASE_URL}${API_ENDPOINTS.HEALTH.DETAILED}`;

  try {
    logger.info('Health check request starting', {
      url: HEALTH_URL,
      method: 'GET',
      backendProtectionHeaderAttached: hasBackendProtectionKey(),
    });

    const response = await fetchWithAbort(HEALTH_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 5000,
      cache: 'no-store'
    });

    logger.info('Health check response received', {
      url: HEALTH_URL,
      status: response.status,
      contentType: response.headers.get('content-type') || '',
    });

    if (response.status >= 400) {
      return createUnavailableStatus(`Backend health returned HTTP ${response.status}`, HEALTH_URL, {
        status: response.status,
        contentType: response.headers.get('content-type') || '',
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      logger.error('Health check returned non-JSON response', {
        url: HEALTH_URL,
        status: response.status,
        contentType,
      });
      return createUnavailableStatus('Backend health returned non-JSON response', HEALTH_URL, {
        status: response.status,
        contentType,
      });
    }

    const data = await response.json();
    
    const backendData = data as Record<string, any>;

    // ✅ LOG RAW BACKEND DATA
    logger.info('Health check raw backend data', { data: backendData });

    const result: DetailedHealthStatus = {
      debug: {
        source: 'server-action-rest',
        url: HEALTH_URL,
        ok: true,
        status: response.status,
        contentType,
        backendProtectionHeaderAttached: hasBackendProtectionKey(),
        timestamp: new Date().toISOString(),
      },
      uptime: backendData.systemMetrics?.uptime || backendData.realtime?.uptime || 0,
      system: {
        cpu: backendData.realtime?.system?.cpu || 0,
        memory: backendData.realtime?.system?.memory || 0,
        activeConnections: backendData.realtime?.system?.activeConnections || 0,
        requestRate: backendData.realtime?.system?.requestRate || 0,
        errorRate: backendData.realtime?.system?.errorRate || 0,
      },
      database: {
        status: backendData.services?.database?.status === 'healthy' ? 'up' : 'down',
        isHealthy: backendData.services?.database?.status === 'healthy',
        avgResponseTime: backendData.services?.database?.responseTime || 0,
      },
      cache: {
        status: backendData.services?.cache?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.cache?.status === 'healthy',
        latency: backendData.services?.cache?.responseTime || 0,
      },
      queue: {
        status: backendData.services?.queue?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.queue?.status === 'healthy',
        connection: {
          connected: backendData.services?.queue?.status === 'healthy',
          latency: backendData.services?.queue?.responseTime || 0,
        },
      },
      communication: {
        status: backendData.services?.communication?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.communication?.status === 'healthy',
        socket: {
          connected: backendData.services?.communication?.status === 'healthy',
          latency: backendData.services?.communication?.responseTime || 0,
        },
      },
      video: {
        status: backendData.services?.video?.status === 'healthy' ? 'up' : 'down',
        isHealthy: backendData.services?.video?.status === 'healthy',
      },
      logging: {
        status: backendData.services?.logger?.status === 'healthy' ? 'up' : 'down',
        healthy: backendData.services?.logger?.status === 'healthy',
      }
    };

    // ✅ LOG FOR VERCEL OBSERVABILITY
    logger.info('[HealthCheck] Action Response', { response: result });

    return result;


  } catch (error: unknown) {
    if (error instanceof FetchTimeoutError) {
      logger.error('Health check timed out', { url: HEALTH_URL });
      return createUnavailableStatus('Backend health request timed out', HEALTH_URL);
    }

    logger.error('Health check failed', error instanceof Error ? error : new Error(String(error)));
    return createUnavailableStatus(
      error instanceof Error ? error.message : 'Backend health request failed',
      HEALTH_URL
    );
  }
}

export async function getFrontendSystemMetrics() {
  const os = await import('os');
  return {
    uptime: os.uptime(),
    platform: os.platform(),
    loadAvg: os.loadavg(),
  };
}
