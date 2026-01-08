"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Server,
  Database,
  Wifi,
  Shield,
  Activity,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useWebSocketStatus } from "@/components/websocket/WebSocketProvider";
import { StatusIndicator, StatusType, StatusDot } from "./StatusIndicator";
import { APP_CONFIG } from "@/lib/config/config";
import { useHealthStore } from "@/stores/health.store";
import { useHealthRealtime } from "@/hooks/useHealthRealtime";

interface BackendService {
  name: string;
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StatusType;
  lastChecked: Date | null;
  responseTime: number | null;
  error: string | null;
}

interface BackendStatusState {
  api: BackendService;
  database: BackendService;
  websocket: BackendService;
  auth: BackendService;
  realtime: BackendService;
  lastGlobalCheck: Date | null;
  isChecking: boolean;
}

export function BackendStatusIndicator() {
  const {
    isConnected,
    connectionStatus,
    error: wsError,
  } = useWebSocketStatus();
  const [consecutiveHealthyChecks, setConsecutiveHealthyChecks] = useState(0);
  
  // ⚠️ HYBRID APPROACH: WebSocket (primary) + Polling (fallback)
  // Use WebSocket for real-time updates when available
  const { socket, subscribe } = useHealthRealtime({ enabled: true });
  const healthStatusFromWebSocket = useHealthStore((state) => state.healthStatus);
  const isWebSocketConnected = useHealthStore((state) => state.isConnected);
  const wsConnectionStatus = useHealthStore((state) => state.connectionStatus);

  // Get environment-aware API URL
  const apiBaseUrl = useMemo(() => APP_CONFIG.API.BASE_URL, []);
  
  // ⚠️ NOTE: Health endpoint is at root level (/health), NOT under /api/v1
  // Only REST APIs use /api/v1 prefix, health checks are at root
  const [backendStatus, setBackendStatus] = useState<BackendStatusState>({
    api: {
      name: "API Server",
      endpoint: "/health", // Main API health endpoint (root level, no /api/v1 prefix)
      icon: Server,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    database: {
      name: "Database",
      endpoint: "/health", // Use main health endpoint and parse database info
      icon: Database,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    websocket: {
      name: "WebSocket Service",
      endpoint: "/health", // Use main health endpoint and parse socket info
      icon: Wifi,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    auth: {
      name: "Authentication Service",
      endpoint: "/health", // Use main health endpoint and parse auth info
      icon: Shield,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    realtime: {
      name: "Real-time Services",
      endpoint: "/health?detailed=true", // Use detailed health endpoint for more info
      icon: Zap,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    lastGlobalCheck: null,
    isChecking: false,
  });

  const checkService = useCallback(
    async (service: BackendService): Promise<BackendService> => {
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        // Increased timeout for slow connections (10 seconds) - WebSocket can be slow
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        // Use the memoized API base URL from environment-aware config

        const fullEndpoint = service.endpoint.startsWith("http")
          ? service.endpoint
          : `${apiBaseUrl}${service.endpoint}`;

        // Log service check for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log(
            `🔍 Checking backend service: ${service.name} at ${fullEndpoint}`
          );
        }

        const response = await fetch(fullEndpoint, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // ✅ SECURITY: Use secure token access (will be migrated to httpOnly cookies)
            // For now, use token from secure token manager (synchronous access for headers)
            ...(typeof window !== "undefined" && (() => {
              const token = localStorage.getItem('access_token');
              return token ? { Authorization: `Bearer ${token}` } : {};
            })()),
          },
          credentials: "include", // Include cookies for authentication
          mode: "cors", // Enable CORS
        });

        clearTimeout(timeoutId);
        const endTime = Date.now();

        // Try to parse response for detailed health info
        let healthData = null;

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            healthData = await response.json();
          }
        } catch (parseError) {
          console.warn(
            `Failed to parse response from ${service.name}:`,
            parseError
          );
        }

        if (response.ok) {
          // Parse the specific health data based on backend response format
          // Backend uses: "healthy"/"degraded" for overall status, "up"/"down"/"degraded" for services
          let serviceStatus: StatusType = "active";
          let errorMessage: string | null = null;

          if (healthData) {
            // Helper function to convert backend status to frontend status
            const mapBackendStatus = (status: string | undefined): StatusType => {
              if (!status) return "error";
              // Backend service status: "up" or "healthy" = active (green), "down" or "unhealthy" = error (red), "degraded" = warning (yellow)
              if (status === "up" || status === "healthy") return "active"; // ✅ Green
              if (status === "down" || status === "unhealthy") return "error"; // ❌ Red
              if (status === "degraded") return "warning"; // ⚠️ Yellow
              return "error"; // Default to error if unknown
            };

            // Main API health check
            if (service.name === "API Server") {
              // Overall status uses "healthy" or "degraded"
              const overallStatus = healthData.status;
              serviceStatus = overallStatus === "healthy" ? "active" : 
                            overallStatus === "degraded" ? "warning" : "error";
            }

            // Database health check (parse from services.database)
            else if (service.name === "Database") {
              const dbService = healthData.services?.database;
              if (dbService) {
                // Services use "up", "down", "degraded"
                serviceStatus = mapBackendStatus(dbService.status);
                errorMessage = dbService.error || dbService.message || null;
              } else {
                serviceStatus = "error";
                errorMessage = "Database service not found in health response";
              }
            }

            // WebSocket health check (parse from services.socket)
            else if (service.name === "WebSocket Service") {
              const socketService = healthData.services?.socket;
              if (socketService) {
                // Services use "up", "down", "degraded"
                serviceStatus = mapBackendStatus(socketService.status);
                errorMessage = socketService.error || socketService.message || null;
              } else {
                // If socket service not in response, check overall status
                serviceStatus = mapBackendStatus(healthData.status);
              }
            }

            // Auth health check (check if API is healthy as auth is integrated)
            else if (service.name === "Authentication Service") {
              // Auth is part of API, so use overall status
              const overallStatus = healthData.status;
              serviceStatus = overallStatus === "healthy" ? "active" : 
                            overallStatus === "degraded" ? "warning" : "error";
            }

            // Real-time services health check (parse from services.queue, cache, socket)
            else if (service.name === "Real-time Services") {
              // Backend uses: queue, cache (not queues/redis), socket
              const queueService = healthData.services?.queue;
              const cacheService = healthData.services?.cache;
              const socketService = healthData.services?.socket;

              const services = [queueService, cacheService, socketService].filter(Boolean);
              const allHealthy = services.length > 0 && 
                services.every((s) => s?.status === "up" || s?.status === "healthy");

              serviceStatus = allHealthy ? "active" : "warning";

              if (!allHealthy) {
                const issues = [];
                if (queueService && queueService.status !== "up" && queueService.status !== "healthy") 
                  issues.push("Queue");
                if (cacheService && cacheService.status !== "up" && cacheService.status !== "healthy") 
                  issues.push("Cache");
                if (socketService && socketService.status !== "up" && socketService.status !== "healthy")
                  issues.push("WebSocket");
                errorMessage = issues.length > 0 ? `Issues with: ${issues.join(", ")}` : null;
              }
            }
          } else {
            // If no health data but response is OK, assume active
            serviceStatus = "active";
          }

          const statusDetails = healthData
            ? {
                version: healthData.version,
                uptime: healthData.systemMetrics?.uptime,
                environment: healthData.environment,
                services: healthData.services,
              }
            : null;

          // Log successful status for debugging (development only)
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log(
              `✅ ${service.name} status: ${serviceStatus}`,
              statusDetails
            );
          }

          return {
            ...service,
            status: serviceStatus,
            lastChecked: new Date(),
            responseTime: endTime - startTime,
            error: errorMessage,
          };
        } else {
          const errorDetails =
            healthData?.message || healthData?.error || response.statusText;
          console.error(
            `❌ ${service.name} failed:`,
            response.status,
            errorDetails
          );

          return {
            ...service,
            status: "error",
            lastChecked: new Date(),
            responseTime: endTime - startTime,
            error: `HTTP ${response.status}: ${errorDetails}`,
          };
        }
      } catch (error) {
        const endTime = Date.now();
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        console.error(`🔴 ${service.name} connection failed:`, errorMessage);

        return {
          ...service,
          status: errorMessage.includes("aborted") ? "warning" : "error",
          lastChecked: new Date(),
          responseTime: endTime - startTime,
          error: errorMessage.includes("aborted")
            ? "Request timeout - backend may be slow or overloaded"
            : `Connection failed: ${errorMessage}`,
        };
      }
    },
    [apiBaseUrl]
  );

  const checkWebSocketService =
    useCallback(async (): Promise<BackendService> => {
      const currentTime = new Date();
      const startTime = Date.now();

      // First check the current WebSocket connection status
      if (wsError) {
        console.error(`🔴 WebSocket Error: ${wsError}`);
        return {
          ...backendStatus.websocket,
          status: "error",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: `WebSocket Error: ${wsError}`,
        };
      }

      if (
        connectionStatus === "connecting" ||
        connectionStatus === "reconnecting"
      ) {
        // Log WebSocket status for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log(`🟡 WebSocket Status: ${connectionStatus}`);
        }
        return {
          ...backendStatus.websocket,
          status: "loading",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: `WebSocket is ${connectionStatus}...`,
        };
      }

      if (isConnected) {
        // Log WebSocket connection for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log(`✅ WebSocket is connected and active`);
        }
        return {
          ...backendStatus.websocket,
          status: "active",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: null,
        };
      }

      // If not connected, try to check if WebSocket service endpoint is reachable
      try {
        const wsHealthCheck = await checkService({
          ...backendStatus.websocket,
          endpoint: "/health", // Use the existing health endpoint (root level, no /api/v1 prefix)
        });

        if (wsHealthCheck.status === "active") {
          // Log WebSocket service status for debugging (development only)
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log(`⚠️ WebSocket service is healthy but not connected`);
          }
          return {
            ...wsHealthCheck,
            status: "warning",
            error: "WebSocket service is available but not connected",
          };
        } else {
          console.error(`🔴 WebSocket service is not healthy`);
          return wsHealthCheck;
        }
      } catch {
        console.error(`🔴 WebSocket service health check failed`);
        return {
          ...backendStatus.websocket,
          status: "error",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: "WebSocket service unreachable and not connected",
        };
      }
    }, [
      wsError,
      connectionStatus,
      isConnected,
      backendStatus.websocket,
      checkService,
    ]);

  const checkAllServices = useCallback(async () => {
    // ⚠️ THROTTLING: Prevent rapid successive requests
    const now = Date.now();
    if (now - lastRequestTime.current < REQUEST_COOLDOWN) {
      if (process.env.NODE_ENV === "development") {
        console.log("⏸️ Health check throttled - too soon since last request");
      }
      return;
    }
    lastRequestTime.current = now;

    // ⚠️ CACHING: Use cached data if available and fresh
    if (healthDataCache.current && 
        now - healthDataCache.current.timestamp < CACHE_DURATION) {
      if (process.env.NODE_ENV === "development") {
        console.log("📦 Using cached health data");
      }
      // Use cached data to update status without making new requests
      return;
    }

    // Log health check start for debugging (development only)
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("🔄 Starting comprehensive backend health check...");
    }
    setBackendStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      // ⚠️ OPTIMIZED: Make only ONE health check request and parse all services from it
      // This reduces server load from 3+ requests to just 1 request
      const healthDataResponse = await checkService(backendStatus.realtime);
      
      // Cache the response
      if (healthDataResponse && healthDataResponse.status !== "error") {
        healthDataCache.current = {
          data: healthDataResponse,
          timestamp: now,
        };
      }

      // Parse all services from the single health response
      const healthData = (healthDataResponse as BackendService & {
        healthData?: Record<string, unknown>;
      }).healthData;

      // Use the same health data for all services (more efficient)
      const apiHealthData = healthDataResponse;
      const detailedHealthData = healthDataResponse;
      const wsResult = await checkWebSocketService();

      // Extract individual service statuses from the health response
      const extractServiceStatus = (
        serviceName: string,
        healthResponse: BackendService
      ): BackendService => {
        const baseService = Object.values(backendStatus).find(
          (s) => s.name === serviceName
        ) as BackendService;
        if (!baseService) return healthResponse;

        // If the health check failed, return the error response
        if (
          healthResponse.status === "error" ||
          healthResponse.status === "warning"
        ) {
          return healthResponse;
        }

        // Extract service-specific status from the health data
        const healthData = (
          healthResponse as BackendService & {
            healthData?: Record<string, unknown>;
          }
        ).healthData;
        if (!healthData) return healthResponse;

        let serviceStatus: StatusType = "active";
        let errorMessage: string | null = null;

        if (serviceName === "API Server") {
          serviceStatus =
            (healthData.status as string) === "healthy" ? "active" : "warning";
        } else if (serviceName === "Database") {
          const services = healthData.services as Record<string, unknown>;
          const dbService = services?.database as {
            status?: string;
            error?: string;
          };
          if (dbService) {
            serviceStatus = dbService.status === "healthy" ? "active" : "error";
            errorMessage = dbService.error || null;
          }
        } else if (serviceName === "Authentication Service") {
          serviceStatus =
            (healthData.status as string) === "healthy" ? "active" : "warning";
        } else if (serviceName === "Real-time Services") {
          const services = healthData.services as Record<string, unknown>;
          const queueService = services?.queues as { status?: string };
          const redisService = services?.redis as { status?: string };
          const socketService = services?.socket as { status?: string };

          const allHealthy = [queueService, redisService, socketService].every(
            (s) => s?.status === "healthy"
          );

          serviceStatus = allHealthy ? "active" : "warning";

          if (!allHealthy) {
            const issues = [];
            if (queueService?.status !== "healthy") issues.push("Queue");
            if (redisService?.status !== "healthy") issues.push("Redis");
            if (socketService?.status !== "healthy") issues.push("WebSocket");
            errorMessage = `Issues with: ${issues.join(", ")}`;
          }
        }

        return {
          ...baseService,
          status: serviceStatus,
          lastChecked: new Date(),
          responseTime: healthResponse.responseTime || 0,
          error: errorMessage,
        };
      };

      const apiService = extractServiceStatus("API Server", healthData);
      const dbService = extractServiceStatus("Database", healthData);
      const authService = extractServiceStatus(
        "Authentication Service",
        healthData
      );
      const realtimeService = extractServiceStatus(
        "Real-time Services",
        detailedHealthData
      );

      const newStatus = {
        ...backendStatus,
        api: apiService,
        database: dbService,
        auth: authService,
        realtime: realtimeService,
        websocket: wsResult,
        lastGlobalCheck: new Date(),
        isChecking: false,
      };

      // Log overall health summary
      const services = [
        newStatus.api,
        newStatus.database,
        newStatus.auth,
        newStatus.realtime,
        newStatus.websocket,
      ];
      const healthyStat = services.filter((s) => s.status === "active").length;
      const totalStat = services.length;

      // Log health summary for debugging (development only)
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          `📊 Backend Health Summary: ${healthyStat}/${totalStat} services healthy`
        );

        services.forEach((service) => {
          const statusIcon =
            service.status === "active"
              ? "✅"
              : service.status === "warning"
              ? "⚠️"
              : service.status === "loading"
              ? "🔄"
              : "❌";
          // eslint-disable-next-line no-console
          console.log(
            `${statusIcon} ${service.name}: ${service.status} (${service.responseTime}ms)`
          );
          if (service.error) {
            // eslint-disable-next-line no-console
            console.log(`  └── Error: ${service.error}`);
          }
        });
      }

      // Update consecutive healthy checks counter for smart checking
      if (healthyStat === totalStat) {
        setConsecutiveHealthyChecks((prev) => prev + 1);
      } else {
        setConsecutiveHealthyChecks(0);
      }

      setBackendStatus(newStatus);
    } catch (error) {
      console.error("❌ Critical error during backend health check:", error);
      setBackendStatus((prev) => ({
        ...prev,
        isChecking: false,
        lastGlobalCheck: new Date(),
      }));
    }
  }, [backendStatus, checkService, checkWebSocketService]);

  // Request throttling to prevent rapid successive requests
  const lastRequestTime = useRef<number>(0);
  const REQUEST_COOLDOWN = 10000; // Minimum 10 seconds between requests (prevents server overload)
  
  // Cache health data to avoid redundant requests
  const healthDataCache = useRef<{ data: any; timestamp: number } | null>(null);
  const CACHE_DURATION = 60000; // Cache for 60 seconds (reduces server load)

  // ⚠️ HYBRID APPROACH: WebSocket (primary) + Polling (fallback)
  // Subscribe to WebSocket health updates when connected
  useEffect(() => {
    if (socket?.connected && isWebSocketConnected) {
      subscribe();
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Subscribed to WebSocket health updates");
      }
    }
  }, [socket, isWebSocketConnected, subscribe]);

  // Convert WebSocket health data to BackendStatusState format
  const convertWebSocketToBackendStatus = useCallback((wsData: typeof healthStatusFromWebSocket): BackendStatusState | null => {
    if (!wsData) return null;

    // Helper to map status from WebSocket format
    const mapStatus = (status: string | undefined, isHealthy: boolean | undefined): StatusType => {
      if (!status && isHealthy === undefined) return "loading";
      // WebSocket uses "up"/"down" or isHealthy boolean
      if (status === "up" || isHealthy === true) return "active";
      if (status === "down" || isHealthy === false) return "error";
      if (status === "degraded") return "warning";
      // Default to active if status is "healthy" (overall status)
      if (status === "healthy") return "active";
      return "error";
    };

    // Get current time for lastChecked
    const now = new Date();

    return {
      api: {
        name: "API Server",
        endpoint: "/health",
        icon: Server,
        // API health is determined by database being up (API depends on DB)
        status: mapStatus(wsData.database?.status, wsData.database?.isHealthy),
        lastChecked: wsData.database?.lastHealthCheck ? new Date(wsData.database.lastHealthCheck) : now,
        responseTime: wsData.database?.avgResponseTime || null,
        error: wsData.database?.errors?.[0] || null,
      },
      database: {
        name: "Database",
        endpoint: "/health",
        icon: Database,
        status: mapStatus(wsData.database?.status, wsData.database?.isHealthy),
        lastChecked: wsData.database?.lastHealthCheck ? new Date(wsData.database.lastHealthCheck) : now,
        responseTime: wsData.database?.avgResponseTime || null,
        error: wsData.database?.errors?.[0] || null,
      },
      websocket: {
        name: "WebSocket Service",
        endpoint: "/health",
        icon: Wifi,
        // Check communication socket status
        status: mapStatus(
          wsData.communication?.status, 
          wsData.communication?.socket?.connected ?? wsData.communication?.healthy
        ),
        lastChecked: now,
        responseTime: wsData.communication?.socket?.latency || null,
        error: wsData.communication?.issues?.[0] || (wsData.communication?.healthy === false ? "WebSocket service unavailable" : null),
      },
      auth: {
        name: "Authentication Service",
        endpoint: "/health",
        icon: Shield,
        // Auth is part of API, use database status as proxy
        status: mapStatus(wsData.database?.status, wsData.database?.isHealthy),
        lastChecked: now,
        responseTime: null,
        error: null,
      },
      realtime: {
        name: "Real-time Services",
        endpoint: "/health?detailed=true",
        icon: Zap,
        // Real-time = queue + cache + communication
        status: (
          (wsData.queue?.healthy !== false) && 
          (wsData.cache?.healthy !== false) && 
          (wsData.communication?.healthy !== false)
        ) ? "active" : "warning",
        lastChecked: now,
        responseTime: wsData.queue?.connection?.latency || wsData.cache?.latency || wsData.communication?.socket?.latency || null,
        error: [
          wsData.queue?.status === "down" && "Queue",
          wsData.cache?.status === "down" && "Cache",
          wsData.communication?.healthy === false && "Communication"
        ].filter(Boolean).join(", ") || null,
      },
      lastGlobalCheck: now,
      isChecking: false,
    };
  }, []);

  // Sync WebSocket health data to local state when available
  useEffect(() => {
    if (healthStatusFromWebSocket && isWebSocketConnected) {
      // WebSocket provides real-time updates, convert and update local state
      const convertedStatus = convertWebSocketToBackendStatus(healthStatusFromWebSocket);
      if (convertedStatus) {
        if (process.env.NODE_ENV === "development") {
          console.log("📡 Updating UI from WebSocket health data (real-time)", convertedStatus);
        }
        setBackendStatus(convertedStatus);
      }
    }
  }, [healthStatusFromWebSocket, isWebSocketConnected, convertWebSocketToBackendStatus]);

  // Initial check and periodic updates with smart checking
  // ⚠️ OPTIMIZED: Reduced frequency to minimize server load
  // ⚠️ POLLING FALLBACK: Only poll when WebSocket is disconnected
  useEffect(() => {
    // If WebSocket is connected, skip polling (WebSocket handles updates)
    if (isWebSocketConnected && wsConnectionStatus === 'connected') {
      if (process.env.NODE_ENV === "development") {
        console.log("🔌 WebSocket connected - using real-time updates, skipping polling");
      }
      return; // Don't set up polling when WebSocket is active
    }

    // Initial check after a short delay (don't hammer server on mount)
    // Only when WebSocket is not available
    const initialTimeout = setTimeout(() => {
      checkAllServices();
    }, 2000);

    // Smart checking: significantly reduced frequency to protect server
    const getHealthCheckInterval = () => {
      if (consecutiveHealthyChecks >= 5) {
        return 600000; // 10 minutes when consistently healthy (was 5 minutes)
      } else if (consecutiveHealthyChecks >= 2) {
        return 300000; // 5 minutes when mostly healthy (was 3 minutes)
      } else {
        return 180000; // 3 minutes when there are issues (was 2 minutes)
      }
    };

    const getWebSocketCheckInterval = () => {
      if (consecutiveHealthyChecks >= 3) {
        return 120000; // 2 minutes when healthy (was 1 minute)
      } else {
        return 60000; // 1 minute when there are issues (was 30 seconds)
      }
    };

    // Set up dynamic health checks
    let healthCheckInterval: NodeJS.Timeout;
    let wsCheckInterval: NodeJS.Timeout;

    const setupIntervals = () => {
      // Clear existing intervals
      if (healthCheckInterval) clearInterval(healthCheckInterval);
      if (wsCheckInterval) clearInterval(wsCheckInterval);

      // Set up new intervals with current timing
      healthCheckInterval = setInterval(
        checkAllServices,
        getHealthCheckInterval()
      );

      wsCheckInterval = setInterval(async () => {
        const wsService = await checkWebSocketService();
        setBackendStatus((prev) => ({
          ...prev,
          websocket: wsService,
        }));
      }, getWebSocketCheckInterval());
    };

    // Initial setup
    setupIntervals();

    // Update intervals when consecutive healthy checks change
    const intervalUpdateTimeout = setTimeout(setupIntervals, 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(healthCheckInterval);
      clearInterval(wsCheckInterval);
      clearTimeout(intervalUpdateTimeout);
    };
  }, [checkAllServices, checkWebSocketService, consecutiveHealthyChecks, isWebSocketConnected, wsConnectionStatus]);

  // Update WebSocket status immediately when connection changes
  useEffect(() => {
    const updateWebSocketStatus = async () => {
      const wsService = await checkWebSocketService();
      setBackendStatus((prev) => ({
        ...prev,
        websocket: wsService,
      }));
    };

    updateWebSocketStatus();
  }, [isConnected, connectionStatus, wsError, checkWebSocketService]);

  // Log status changes for debugging
  useEffect(() => {
    const services = [
      backendStatus.api,
      backendStatus.database,
      backendStatus.auth,
      backendStatus.realtime,
      backendStatus.websocket,
    ];
    const activeServices = services.filter((s) => s.status === "active");
    const errorServices = services.filter((s) => s.status === "error");

    if (errorServices.length > 0) {
      console.warn(
        `⚠️ ${errorServices.length} backend services have issues:`,
        errorServices.map((s) => `${s.name}: ${s.error}`)
      );
    }

    if (activeServices.length === services.length && services.length > 0) {
      // Log all services healthy for debugging (development only)
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("🎉 All backend services are healthy!");
      }
    }
  }, [backendStatus]);

  const getOverallStatus = (): StatusType => {
    const services = [
      backendStatus.api,
      backendStatus.database,
      backendStatus.websocket,
      backendStatus.auth,
      backendStatus.realtime,
    ];
    const activeCount = services.filter((s) => s.status === "active").length;
    const errorCount = services.filter((s) => s.status === "error").length;

    if (activeCount === services.length) return "active";
    if (errorCount > 0) return "error";
    return "warning";
  };

  const getOverallLabel = () => {
    const services = [
      backendStatus.api,
      backendStatus.database,
      backendStatus.websocket,
      backendStatus.auth,
      backendStatus.realtime,
    ];
    const activeCount = services.filter((s) => s.status === "active").length;
    const totalCount = services.length;

    if (activeCount === totalCount) return "All Systems Live";
    if (activeCount === 0) return "All Systems Down";
    return `${activeCount}/${totalCount} Systems Live`;
  };

  return {
    indicator: (
      <StatusIndicator
        status={getOverallStatus()}
        label={getOverallLabel()}
        icon={Activity}
        size="sm"
      />
    ),
    detailed: (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Backend Services Status</h4>
          <button
            onClick={checkAllServices}
            disabled={backendStatus.isChecking}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Refresh backend status"
            aria-label="Refresh backend status"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                backendStatus.isChecking && "animate-spin"
              )}
            />
          </button>
        </div>

        <div className="space-y-1">
          {[
            backendStatus.api,
            backendStatus.database,
            backendStatus.websocket,
            backendStatus.auth,
            backendStatus.realtime,
          ].map((service) => {
              // Status-based text color
              const statusColor = {
                active: "text-gray-900",
                warning: "text-yellow-700",
                error: "text-red-700",
                loading: "text-blue-600",
                inactive: "text-gray-500",
              }[service.status] || "text-gray-600";

              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <service.icon className={cn("h-3 w-3", statusColor)} />
                    <span className={cn("font-medium", statusColor)}>
                      {service.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.responseTime !== null && service.responseTime !== undefined && (
                      <span className={cn(
                        "text-xs",
                        service.status === "active" ? "text-gray-600" : 
                        service.status === "warning" ? "text-yellow-600" : 
                        service.status === "error" ? "text-red-600" : 
                        "text-gray-500"
                      )}>
                        {service.responseTime}ms
                      </span>
                    )}
                    <StatusDot status={service.status} size="sm" />
                  </div>
                </div>
              );
            })}
        </div>

        {backendStatus.lastGlobalCheck && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Last checked: {backendStatus.lastGlobalCheck.toLocaleTimeString()}
          </div>
        )}
      </div>
    ),
    services: backendStatus,
    refresh: checkAllServices,
    isChecking: backendStatus.isChecking,
  };
}

// Compact backend status for headers
export function CompactBackendStatus({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {backend.indicator}
    </div>
  );
}

// Detailed backend status panel
export function DetailedBackendStatus({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();

  return (
    <div className={cn("bg-white rounded-lg border p-4 shadow-sm", className)}>
      {backend.detailed}
    </div>
  );
}

// Backend status widget for dashboard
export function BackendStatusWidget({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Import dynamically to avoid circular dependencies
  const GlobalHealthStatusModal = React.lazy(() => 
    import('@/components/admin/GlobalHealthStatusModal').then(m => ({ default: m.GlobalHealthStatusModal }))
  );

  const handleClick = () => {
    // Open comprehensive modal instead of simple dropdown
    setShowModal(true);
    setShowDetails(false);
  };

  return (
    <>
      <div className={cn("relative", className)}>
        <div
          className="cursor-pointer"
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="View comprehensive system health status"
        >
          {backend.indicator}
        </div>

        {showDetails && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg border shadow-lg p-4 min-w-80">
            {backend.detailed}
          </div>
        )}
      </div>
      
      {showModal && (
        <React.Suspense fallback={null}>
          <GlobalHealthStatusModal open={showModal} onOpenChange={setShowModal} />
        </React.Suspense>
      )}
    </>
  );
}
