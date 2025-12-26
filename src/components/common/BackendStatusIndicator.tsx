"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

  // Get environment-aware API URL
  const apiBaseUrl = useMemo(() => APP_CONFIG.API.BASE_URL, []);
  const [backendStatus, setBackendStatus] = useState<BackendStatusState>({
    api: {
      name: "API Server",
      endpoint: "/health", // Main API health endpoint (matches backend)
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
      endpoint: "/health/detailed", // Use detailed health endpoint for more info
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
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout to reduce server load

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
            // Add authentication token if available
            ...(typeof window !== "undefined" &&
              localStorage.getItem("token") && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
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
          let serviceStatus: StatusType = "active";
          let errorMessage: string | null = null;

          if (healthData) {
            // Main API health check
            if (service.name === "API Server") {
              serviceStatus =
                healthData.status === "healthy" ? "active" : "warning";
            }

            // Database health check (parse from services.database)
            else if (service.name === "Database") {
              const dbService = healthData.services?.database;
              if (dbService) {
                serviceStatus =
                  dbService.status === "healthy" ? "active" : "error";
                errorMessage = dbService.error || null;
              }
            }

            // WebSocket health check (parse from services.socket)
            else if (service.name === "WebSocket Service") {
              const socketService = healthData.services?.socket;
              if (socketService) {
                serviceStatus =
                  socketService.status === "healthy" ? "active" : "error";
                errorMessage = socketService.error || null;
              }
            }

            // Auth health check (check if API is healthy as auth is integrated)
            else if (service.name === "Authentication Service") {
              serviceStatus =
                healthData.status === "healthy" ? "active" : "warning";
            }

            // Real-time services health check (parse from services.queues, redis, etc.)
            else if (service.name === "Real-time Services") {
              const queueService = healthData.services?.queues;
              const redisService = healthData.services?.redis;
              const socketService = healthData.services?.socket;

              const allHealthy = [
                queueService,
                redisService,
                socketService,
              ].every((s) => s?.status === "healthy");

              serviceStatus = allHealthy ? "active" : "warning";

              if (!allHealthy) {
                const issues = [];
                if (queueService?.status !== "healthy") issues.push("Queue");
                if (redisService?.status !== "healthy") issues.push("Redis");
                if (socketService?.status !== "healthy")
                  issues.push("WebSocket");
                errorMessage = `Issues with: ${issues.join(", ")}`;
              }
            }
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
          endpoint: "/health", // Use the existing health endpoint
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
    // Log health check start for debugging (development only)
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("🔄 Starting comprehensive backend health check...");
    }
    setBackendStatus((prev) => ({ ...prev, isChecking: true }));

    try {
      // Get health data once and parse it for all services (more efficient)
      const healthData = await checkService(backendStatus.api);
      const detailedHealthData = await checkService(backendStatus.realtime);
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

  // Initial check and periodic updates with smart checking
  // This reduces server load by checking less frequently when services are healthy
  useEffect(() => {
    // Initial check immediately
    checkAllServices();

    // Smart checking: reduce frequency when services are consistently healthy
    const getHealthCheckInterval = () => {
      if (consecutiveHealthyChecks >= 5) {
        return 300000; // 5 minutes when consistently healthy
      } else if (consecutiveHealthyChecks >= 2) {
        return 180000; // 3 minutes when mostly healthy
      } else {
        return 120000; // 2 minutes when there are issues
      }
    };

    const getWebSocketCheckInterval = () => {
      if (consecutiveHealthyChecks >= 3) {
        return 60000; // 1 minute when healthy
      } else {
        return 30000; // 30 seconds when there are issues
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
      clearInterval(healthCheckInterval);
      clearInterval(wsCheckInterval);
      clearTimeout(intervalUpdateTimeout);
    };
  }, [checkAllServices, checkWebSocketService, consecutiveHealthyChecks]);

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

    if (activeServices.length === services.length) {
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
          {Object.values(backendStatus)
            .slice(0, 5)
            .map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <service.icon className="h-3 w-3" />
                  <span>{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {service.responseTime && (
                    <span className="text-gray-500">
                      {service.responseTime}ms
                    </span>
                  )}
                  <StatusDot status={service.status} size="sm" />
                </div>
              </div>
            ))}
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

  return (
    <div className={cn("relative", className)}>
      <div
        className="cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowDetails(!showDetails);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Toggle backend status details"
      >
        {backend.indicator}
      </div>

      {showDetails && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg border shadow-lg p-4 min-w-80">
          {backend.detailed}
        </div>
      )}
    </div>
  );
}
