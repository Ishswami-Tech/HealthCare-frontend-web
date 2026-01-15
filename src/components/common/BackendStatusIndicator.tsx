"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { cn } from "@/lib/utils";
import {
  Server,
  Database,
  Wifi,
  Activity,
  RefreshCw,
  Zap,
  HardDrive,
  Video,
} from "lucide-react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { StatusIndicator, StatusType, StatusDot } from "./StatusIndicator";
import { APP_CONFIG } from "@/lib/config/config";
import { useHealthStore } from "@/stores";
import { useHealthRealtime } from "@/hooks/realtime/useHealthRealtime";

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
  cache: BackendService;
  video: BackendService;
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
  const healthStatusFromWebSocket = useHealthStore(
    (state) => state.healthStatus
  );
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
    cache: {
      name: "Cache Service",
      endpoint: "/health", // Use main health endpoint and parse cache info
      icon: HardDrive,
      status: "loading",
      lastChecked: null,
      responseTime: null,
      error: null,
    },
    video: {
      name: "Video Service",
      endpoint: "/health", // Use main health endpoint and parse video info
      icon: Video,
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
          // Debug logging (development only)
          console.debug(
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
            ...(typeof window !== "undefined" &&
              (() => {
                const token = localStorage.getItem("access_token");
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
            const mapBackendStatus = (
              status: string | undefined
            ): StatusType => {
              if (!status) return "error";
              // Backend service status: "up" or "healthy" = active (green), "down" or "unhealthy" = error (red), "degraded" = warning (yellow)
              if (status === "up" || status === "healthy") return "active"; // ✅ Green
              if (status === "down" || status === "unhealthy") return "error"; // ❌ Red
              if (status === "degraded") return "warning"; // ⚠️ Yellow
              return "error"; // Default to error if unknown
            };

            // Main API health check
            if (service.name === "API Server") {
              // Check services.api.status first, fallback to overall status
              const apiService = healthData.services?.api;
              if (apiService) {
                serviceStatus = mapBackendStatus(apiService.status);
                errorMessage =
                  apiService.error ||
                  apiService.message ||
                  apiService.details ||
                  null;
              } else {
                // Fallback to overall status
                const overallStatus = healthData.status;
                serviceStatus =
                  overallStatus === "healthy"
                    ? "active"
                    : overallStatus === "degraded"
                    ? "warning"
                    : "error";
              }
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

            // WebSocket health check (parse from services.communication.socket or services.socket)
            else if (service.name === "WebSocket Service") {
              const communicationService = healthData.services?.communication;
              const socketService =
                communicationService?.socket || healthData.services?.socket;

              if (socketService) {
                // Services use "up", "down", "degraded", or check connected property
                if (
                  typeof socketService === "object" &&
                  "connected" in socketService
                ) {
                  serviceStatus = socketService.connected ? "active" : "error";
                } else {
                  serviceStatus = mapBackendStatus(socketService.status);
                }
                errorMessage =
                  socketService.error || socketService.message || null;
              } else if (communicationService) {
                // Check communication service status
                serviceStatus = mapBackendStatus(communicationService.status);
                errorMessage =
                  communicationService.error ||
                  communicationService.message ||
                  null;
              } else {
                // If socket service not in response, check overall status
                serviceStatus = mapBackendStatus(healthData.status);
              }
            }

            // Cache health check (parse from services.cache)
            else if (service.name === "Cache Service") {
              const cacheService = healthData.services?.cache;
              if (cacheService) {
                serviceStatus = mapBackendStatus(cacheService.status);
                errorMessage =
                  cacheService.error ||
                  cacheService.message ||
                  cacheService.details ||
                  null;
              } else {
                serviceStatus = mapBackendStatus(healthData.status);
              }
            }

            // Video health check (parse from services.video)
            else if (service.name === "Video Service") {
              const videoService = healthData.services?.video;
              if (videoService) {
                serviceStatus = mapBackendStatus(videoService.status);
                errorMessage =
                  videoService.error ||
                  videoService.message ||
                  videoService.details ||
                  null;
              } else {
                serviceStatus = mapBackendStatus(healthData.status);
              }
            }

            // Real-time services health check (parse from services.queue, cache, socket)
            else if (service.name === "Real-time Services") {
              // Backend uses: queue, cache (not queues/redis), socket
              const queueService = healthData.services?.queue;
              const cacheService = healthData.services?.cache;
              const socketService = healthData.services?.socket;

              const services = [
                queueService,
                cacheService,
                socketService,
              ].filter(Boolean);
              const allHealthy =
                services.length > 0 &&
                services.every(
                  (s) => s?.status === "up" || s?.status === "healthy"
                );

              serviceStatus = allHealthy ? "active" : "warning";

              if (!allHealthy) {
                const issues = [];
                if (
                  queueService &&
                  queueService.status !== "up" &&
                  queueService.status !== "healthy"
                )
                  issues.push("Queue");
                if (
                  cacheService &&
                  cacheService.status !== "up" &&
                  cacheService.status !== "healthy"
                )
                  issues.push("Cache");
                if (
                  socketService &&
                  socketService.status !== "up" &&
                  socketService.status !== "healthy"
                )
                  issues.push("WebSocket");
                errorMessage =
                  issues.length > 0
                    ? `Issues with: ${issues.join(", ")}`
                    : null;
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

      // ✅ FIX: Check health namespace connection status (not main WebSocket)
      // Health monitoring uses separate Socket.IO connection to /health namespace
      const healthStore = useHealthStore.getState();
      const healthError = healthStore.error;
      const healthConnectionStatus = healthStore.connectionStatus;

      // First check the health namespace connection status
      if (healthError) {
        console.error(`🔴 Health Namespace Error:`, healthError);
        return {
          ...backendStatus.websocket,
          status: "error",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: `Health namespace error: ${healthError instanceof Error ? healthError.message : String(healthError)}`,
        };
      }

      if (
        healthConnectionStatus === "connecting" ||
        (healthConnectionStatus as string) === "reconnecting"
      ) {
        // Log health namespace status for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          // Debug logging (development only)
          console.debug(`🟡 Health Namespace Status: ${healthConnectionStatus}`);
        }
        return {
          ...backendStatus.websocket,
          status: "loading",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: `Health namespace is ${healthConnectionStatus}...`,
        };
      }

      // ✅ Check if health namespace is connected
      if (isWebSocketConnected) {
        // Log health namespace connection for debugging (development only)
        if (process.env.NODE_ENV === "development") {
          // Debug logging (development only)
          console.debug(`✅ Health namespace is connected and active`);
        }
        return {
          ...backendStatus.websocket,
          status: "active",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: null,
        };
      }

      // If health namespace not connected, also check main WebSocket as fallback
      if (isConnected) {
        if (process.env.NODE_ENV === "development") {
          // Debug logging (development only)
          console.debug(`✅ Main WebSocket is connected (health namespace not connected)`);
        }
        return {
          ...backendStatus.websocket,
          status: "warning",
          lastChecked: currentTime,
          responseTime: Date.now() - startTime,
          error: "Main WebSocket connected but health namespace not connected",
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
      isWebSocketConnected,
      wsConnectionStatus,
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
    if (
      healthDataCache.current &&
      now - healthDataCache.current.timestamp < CACHE_DURATION
    ) {
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

      // Fetch health data directly
      let parsedHealthData: Record<string, unknown> | null = null;
      let healthCheckResponseTime: number | null = null;

      try {
        const healthEndpoint = `${apiBaseUrl}/health`;
        const controller = new AbortController();
        // ✅ Reduced timeout from 10s to 5s to prevent long blocking
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const startTime = Date.now();

        const response = await fetch(healthEndpoint, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(typeof window !== "undefined" &&
              (() => {
                const token = localStorage.getItem("access_token");
                return token ? { Authorization: `Bearer ${token}` } : {};
              })()),
          },
          credentials: "include",
          mode: "cors",
        });

        clearTimeout(timeoutId);
        healthCheckResponseTime = Date.now() - startTime;

        if (response.ok) {
          parsedHealthData = await response.json();

          // Cache the health data
          healthDataCache.current = {
            data: parsedHealthData,
            timestamp: now,
          };
        } else {
          console.error(
            `Health check failed: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to fetch health data:", errorMessage);

        // Try to use cached data if available
        if (healthDataCache.current?.data) {
          parsedHealthData = healthDataCache.current.data as Record<
            string,
            unknown
          >;
        }
      }

      // Get WebSocket status separately (it uses connection status, not health endpoint)
      const wsResult = await checkWebSocketService();

      // Helper to extract service status from health data
      const extractServiceStatus = (
        serviceName: string,
        healthData: Record<string, unknown> | null
      ): BackendService => {
        const baseService = Object.values(backendStatus).find(
          (s) => s.name === serviceName
        ) as BackendService;

        if (!baseService) {
          return {
            name: serviceName,
            endpoint: "/health",
            icon: Server,
            status: "error",
            lastChecked: new Date(),
            responseTime: null,
            error: "Service not found",
          };
        }

        if (!healthData) {
          return {
            ...baseService,
            status: "warning",
            lastChecked: new Date(),
            responseTime: null,
            error: "Health data not available",
          };
        }

        let serviceStatus: StatusType = "active";
        let errorMessage: string | null = null;

        if (serviceName === "API Server") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const apiService = services?.api as
            | {
                status?: string;
                error?: string;
                message?: string;
                details?: string;
              }
            | undefined;
          if (apiService) {
            const mapStatus = (status?: string): StatusType => {
              if (status === "up" || status === "healthy") return "active";
              if (status === "down" || status === "unhealthy") return "error";
              if (status === "degraded") return "warning";
              return "error";
            };
            serviceStatus = mapStatus(apiService.status);
            errorMessage =
              apiService.error ||
              apiService.message ||
              apiService.details ||
              null;
          } else {
            // Fallback to overall status
            const overallStatus = healthData.status as string;
            serviceStatus =
              overallStatus === "healthy"
                ? "active"
                : overallStatus === "degraded"
                ? "warning"
                : "error";
          }
        } else if (serviceName === "Database") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const dbService = services?.database as
            | {
                status?: string;
                error?: string;
                message?: string;
              }
            | undefined;
          if (dbService) {
            const mapStatus = (status?: string): StatusType => {
              if (status === "up" || status === "healthy") return "active";
              if (status === "down" || status === "unhealthy") return "error";
              if (status === "degraded") return "warning";
              return "error";
            };
            serviceStatus = mapStatus(dbService.status);
            errorMessage = dbService.error || dbService.message || null;
          } else {
            serviceStatus = "error";
            errorMessage = "Database service not found in health response";
          }
        } else if (serviceName === "Cache Service") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const cacheService = services?.cache as
            | {
                status?: string;
                error?: string;
                message?: string;
              }
            | undefined;
          if (cacheService) {
            const mapStatus = (status?: string): StatusType => {
              if (status === "up" || status === "healthy") return "active";
              if (status === "down" || status === "unhealthy") return "error";
              if (status === "degraded") return "warning";
              return "error";
            };
            serviceStatus = mapStatus(cacheService.status);
            errorMessage = cacheService.error || cacheService.message || null;
          } else {
            serviceStatus = "error";
            errorMessage = "Cache service not found in health response";
          }
        } else if (serviceName === "Video Service") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const videoService = services?.video as
            | {
                status?: string;
                error?: string;
                message?: string;
              }
            | undefined;
          if (videoService) {
            const mapStatus = (status?: string): StatusType => {
              if (status === "up" || status === "healthy") return "active";
              if (status === "down" || status === "unhealthy") return "error";
              if (status === "degraded") return "warning";
              return "error";
            };
            serviceStatus = mapStatus(videoService.status);
            errorMessage = videoService.error || videoService.message || null;
          } else {
            serviceStatus = "error";
            errorMessage = "Video service not found in health response";
          }
        } else if (serviceName === "WebSocket Service") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const communicationService = services?.communication as
            | {
                status?: string;
                communicationHealth?: {
                  socket?: { connected?: boolean };
                };
                error?: string;
                message?: string;
              }
            | undefined;

          if (communicationService) {
            // Check socket connection status
            const socketHealth =
              communicationService.communicationHealth?.socket;
            if (
              socketHealth &&
              typeof socketHealth === "object" &&
              "connected" in socketHealth
            ) {
              serviceStatus = socketHealth.connected ? "active" : "error";
            } else {
              // Fallback to communication service status
              const mapStatus = (status?: string): StatusType => {
                if (status === "up" || status === "healthy") return "active";
                if (status === "down" || status === "unhealthy") return "error";
                if (status === "degraded") return "warning";
                return "error";
              };
              serviceStatus = mapStatus(communicationService.status);
            }
            errorMessage =
              communicationService.error ||
              communicationService.message ||
              null;
          } else {
            // Fallback: check if socket service exists directly
            const socketService = services?.socket as
              | { status?: string }
              | undefined;
            if (socketService) {
              const mapStatus = (status?: string): StatusType => {
                if (status === "up" || status === "healthy") return "active";
                if (status === "down" || status === "unhealthy") return "error";
                if (status === "degraded") return "warning";
                return "error";
              };
              serviceStatus = mapStatus(socketService.status);
            } else {
              // If no socket info, check overall status
              const overallStatus = healthData.status as string;
              serviceStatus =
                overallStatus === "healthy"
                  ? "active"
                  : overallStatus === "degraded"
                  ? "warning"
                  : "error";
            }
          }
        } else if (serviceName === "Real-time Services") {
          const services = healthData.services as
            | Record<string, unknown>
            | undefined;
          const queueService = services?.queue as
            | { status?: string }
            | undefined;
          const cacheService = services?.cache as
            | { status?: string }
            | undefined;
          const communicationService = services?.communication as
            | {
                communicationHealth?: {
                  socket?: { connected?: boolean };
                };
              }
            | undefined;
          const socketService =
            communicationService?.communicationHealth?.socket ||
            (services?.socket as
              | { status?: string; connected?: boolean }
              | undefined);

          // Check if all services are healthy
          const queueHealthy =
            queueService &&
            (queueService.status === "up" || queueService.status === "healthy");
          const cacheHealthy =
            cacheService &&
            (cacheService.status === "up" || cacheService.status === "healthy");
          const socketHealthy =
            socketService &&
            (("connected" in socketService && socketService.connected) ||
              ("status" in socketService &&
                (socketService.status === "up" ||
                  socketService.status === "healthy")));

          const allHealthy =
            [queueHealthy, cacheHealthy, socketHealthy].filter(Boolean)
              .length >= 2;

          serviceStatus = allHealthy ? "active" : "warning";

          if (!allHealthy) {
            const issues: string[] = [];
            if (queueService && !queueHealthy) {
              issues.push("Queue");
            }
            if (cacheService && !cacheHealthy) {
              issues.push("Cache");
            }
            if (socketService && !socketHealthy) {
              issues.push("WebSocket");
            }
            errorMessage =
              issues.length > 0 ? `Issues with: ${issues.join(", ")}` : null;
          }
        }

        return {
          ...baseService,
          status: serviceStatus,
          lastChecked: new Date(),
          responseTime: healthCheckResponseTime, // Use the health check response time
          error: errorMessage,
        };
      };

      const apiService = extractServiceStatus("API Server", parsedHealthData);
      const dbService = extractServiceStatus("Database", parsedHealthData);
      const cacheService = extractServiceStatus(
        "Cache Service",
        parsedHealthData
      );
      const videoService = extractServiceStatus(
        "Video Service",
        parsedHealthData
      );
      const realtimeService = extractServiceStatus(
        "Real-time Services",
        parsedHealthData
      );

      const newStatus = {
        ...backendStatus,
        api: apiService,
        database: dbService,
        cache: cacheService,
        video: videoService,
        realtime: realtimeService,
        websocket: wsResult,
        lastGlobalCheck: new Date(),
        isChecking: false,
      };

      // Log overall health summary
      const services = [
        newStatus.api,
        newStatus.database,
        newStatus.cache,
        newStatus.video,
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
          // Debug logging (development only)
          if (process.env.NODE_ENV === 'development') {
            console.debug(
              `${statusIcon} ${service.name}: ${service.status} (${service.responseTime}ms)`
            );
            if (service.error) {
              // eslint-disable-next-line no-console
              console.log(`  └── Error: ${service.error}`);
            }
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
  const convertWebSocketToBackendStatus = useCallback(
    (wsData: typeof healthStatusFromWebSocket): BackendStatusState | null => {
      if (!wsData) return null;

      // Helper to map status from WebSocket format
      const mapStatus = (
        status: string | undefined,
        isHealthy: boolean | undefined
      ): StatusType => {
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
          status: mapStatus(
            wsData.database?.status,
            wsData.database?.isHealthy
          ),
          lastChecked: wsData.database?.lastHealthCheck
            ? new Date(wsData.database.lastHealthCheck)
            : now,
          responseTime: wsData.database?.avgResponseTime || null,
          error: wsData.database?.errors?.[0] || null,
        },
        database: {
          name: "Database",
          endpoint: "/health",
          icon: Database,
          status: mapStatus(
            wsData.database?.status,
            wsData.database?.isHealthy
          ),
          lastChecked: wsData.database?.lastHealthCheck
            ? new Date(wsData.database.lastHealthCheck)
            : now,
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
            wsData.communication?.socket?.connected ??
              wsData.communication?.healthy
          ),
          lastChecked: now,
          responseTime: wsData.communication?.socket?.latency || null,
          error:
            wsData.communication?.issues?.[0] ||
            (wsData.communication?.healthy === false
              ? "WebSocket service unavailable"
              : null),
        },
        cache: {
          name: "Cache Service",
          endpoint: "/health",
          icon: HardDrive,
          status: mapStatus(wsData.cache?.status, wsData.cache?.healthy),
          lastChecked: now,
          responseTime: wsData.cache?.latency || null,
          error: (wsData.cache as any)?.errors?.[0] || null,
        },
        video: {
          name: "Video Service",
          endpoint: "/health",
          icon: Video,
          status: mapStatus(wsData.video?.status, wsData.video?.isHealthy),
          lastChecked: now,
          responseTime: null,
          error: wsData.video?.error || null,
        },
        realtime: {
          name: "Real-time Services",
          endpoint: "/health?detailed=true",
          icon: Zap,
          // Real-time = queue + cache + communication
          status:
            wsData.queue?.healthy !== false &&
            wsData.cache?.healthy !== false &&
            wsData.communication?.healthy !== false
              ? "active"
              : "warning",
          lastChecked: now,
          responseTime:
            wsData.queue?.connection?.latency ||
            wsData.cache?.latency ||
            wsData.communication?.socket?.latency ||
            null,
          error:
            [
              wsData.queue?.status === "down" && "Queue",
              wsData.cache?.status === "down" && "Cache",
              wsData.communication?.healthy === false && "Communication",
            ]
              .filter(Boolean)
              .join(", ") || null,
        },
        lastGlobalCheck: now,
        isChecking: false,
      };
    },
    []
  );

  // Sync WebSocket health data to local state when available
  useEffect(() => {
    if (healthStatusFromWebSocket && isWebSocketConnected) {
      // WebSocket provides real-time updates, convert and update local state
      const convertedStatus = convertWebSocketToBackendStatus(
        healthStatusFromWebSocket
      );
      if (convertedStatus) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "📡 Updating UI from WebSocket health data (real-time)",
            convertedStatus
          );
        }
        setBackendStatus(convertedStatus);
      }
    }
  }, [
    healthStatusFromWebSocket,
    isWebSocketConnected,
    convertWebSocketToBackendStatus,
  ]);

  // Initial check and periodic updates with smart checking
  // ⚠️ OPTIMIZED: Reduced frequency to minimize server load
  // ⚠️ POLLING FALLBACK: Only poll when WebSocket is disconnected
  useEffect(() => {
    // If WebSocket is connected, skip polling (WebSocket handles updates)
    if (isWebSocketConnected && wsConnectionStatus === "connected") {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🔌 WebSocket connected - using real-time updates, skipping polling"
        );
      }
      return; // Don't set up polling when WebSocket is active
    }

    // ✅ Initial check after a longer delay to prevent blocking page load
    // Only when WebSocket is not available
    // Use requestIdleCallback if available, otherwise setTimeout with longer delay
    const initialTimeout = typeof window !== 'undefined' && 'requestIdleCallback' in window
      ? requestIdleCallback(() => {
          checkAllServices().catch(() => {
            // Silently fail - don't block page load
          });
        }, { timeout: 5000 })
      : setTimeout(() => {
          checkAllServices().catch(() => {
            // Silently fail - don't block page load
          });
        }, 5000); // Increased from 2000ms to 5000ms

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
      // ✅ Cleanup timeouts and intervals properly
      if (typeof initialTimeout === 'number') {
        clearTimeout(initialTimeout);
      } else if (typeof initialTimeout === 'object' && 'cancel' in initialTimeout) {
        // Handle requestIdleCallback return value
        (initialTimeout as { cancel: () => void }).cancel();
      }
      if (healthCheckInterval) clearInterval(healthCheckInterval);
      if (wsCheckInterval) clearInterval(wsCheckInterval);
      clearTimeout(intervalUpdateTimeout);
    };
  }, [
    checkAllServices,
    checkWebSocketService,
    consecutiveHealthyChecks,
    isWebSocketConnected,
    wsConnectionStatus,
  ]);

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
      backendStatus.cache,
      backendStatus.video,
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
      backendStatus.cache,
      backendStatus.video,
      backendStatus.websocket,
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
      backendStatus.cache,
      backendStatus.video,
      backendStatus.websocket,
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
            backendStatus.cache,
            backendStatus.video,
            backendStatus.websocket,
            backendStatus.realtime,
          ].map((service) => {
            // Status-based text color
            const statusColor =
              {
                active: "text-green-600", // Green for active/healthy services
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
                  {service.responseTime !== null &&
                    service.responseTime !== undefined && (
                      <span
                        className={cn(
                          "text-xs",
                          service.status === "active"
                            ? "text-green-600" // Green for active services
                            : service.status === "warning"
                            ? "text-yellow-600"
                            : service.status === "error"
                            ? "text-red-600"
                            : "text-gray-500"
                        )}
                      >
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
    import("@/components/admin/GlobalHealthStatusModal").then((m) => ({
      default: m.GlobalHealthStatusModal,
    }))
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
          <GlobalHealthStatusModal
            open={showModal}
            onOpenChange={setShowModal}
          />
        </React.Suspense>
      )}
    </>
  );
}
