"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/index";
import {
  Activity,
  RefreshCw,
  Server,
  Database,
  Wifi,
  HardDrive,
  Video,
  Zap,
} from "lucide-react";
import { StatusIndicator, StatusType, StatusDot } from "./StatusIndicator";
import { useDetailedHealthStatus } from "@/hooks/query/useHealth";

// Helper to map status string to StatusType
const mapStatus = (status?: string, healthy?: boolean): StatusType => {
  if (status === 'up' || healthy === true) return "active";
  if (status === 'degraded') return "warning";
  if (status === 'down' || healthy === false) return "error";
  return "loading";
};

export function BackendStatusIndicator() {
  const { data: healthStatus, refetch, isFetching, lastUpdate, isConnected } = useDetailedHealthStatus();

  const getOverallStatus = (): StatusType => {
    if (!healthStatus) return "loading";
    
    // Simple logic: if any critical service is down, global is error
    // If any service is degraded, global is warning
    const services = [
      healthStatus.database,
      healthStatus.cache,
      healthStatus.queue,
      healthStatus.communication,
      healthStatus.video
    ];

    const isUnhealthy = (s: any) => {
      if (!s) return false;
      if (s.status === 'down') return true;
      if ('healthy' in s && s.healthy === false) return true;
      if ('isHealthy' in s && s.isHealthy === false) return true;
      return false;
    };

    const isDegraded = (s: any) => {
      if (!s) return false;
      if (s.status === 'degraded') return true;
      if ('degraded' in s && s.degraded === true) return true;
      return false;
    };

    if (services.some(isUnhealthy)) return "error";
    if (services.some(isDegraded)) return "warning";
    
    return "active";
  };

  const getOverallLabel = () => {
    if (!healthStatus) return "Connecting...";
    const status = getOverallStatus();
    if (status === "active") return "100% Operational";
    if (status === "warning") return "Services Degraded";
    return "Partial Outage";
  };

  // Helper to construct service objects for display
  const services = [
    {
      name: "API Server",
      icon: Server,
      status: mapStatus(healthStatus ? 'up' : undefined, !!healthStatus), // API is up if we have data
      responseTime: healthStatus?.system?.requestRate ? Math.round(1000 / (healthStatus.system.requestRate || 1)) : 1, // Estimate from rate
    },
    {
      name: "Database",
      icon: Database,
      status: mapStatus(healthStatus?.database?.status, healthStatus?.database?.isHealthy),
      responseTime: healthStatus?.database?.avgResponseTime,
    },
    {
      name: "Cache Service",
      icon: HardDrive,
      status: mapStatus(healthStatus?.cache?.status, healthStatus?.cache?.healthy),
      responseTime: healthStatus?.cache?.latency,
    },
    {
      name: "Queue System",
      icon: Zap,
      status: mapStatus(healthStatus?.queue?.status, healthStatus?.queue?.healthy),
      responseTime: healthStatus?.queue?.connection?.latency,
    },
    {
      name: "Communication",
      icon: Wifi,
      status: mapStatus(healthStatus?.communication?.status, healthStatus?.communication?.healthy),
      responseTime: healthStatus?.communication?.socket?.latency,
    },
    {
      name: "Video Service",
      icon: Video,
      status: mapStatus(healthStatus?.video?.status, healthStatus?.video?.isHealthy),
      responseTime: undefined,
    },
    {
      name: "Logger Service",
      icon: HardDrive,
      status: mapStatus(healthStatus?.logging?.status, healthStatus?.logging?.healthy),
      responseTime: healthStatus?.logging?.service?.latency,
    },
  ];

  const indicator = (
    <StatusIndicator
      status={getOverallStatus()}
      label={getOverallLabel()}
      icon={Activity}
      size="sm"
    />
  );

  const detailed = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Backend Services Status</h4>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Refresh backend status"
          aria-label="Refresh backend status"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              isFetching && "animate-spin"
            )}
          />
        </button>
      </div>

      <div className="space-y-1">
        {services.map((service) => {
          const statusColor =
            {
              active: "text-green-600",
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
                {service.responseTime !== undefined &&
                  service.responseTime !== null && (
                    <span
                      className={cn(
                        "text-xs",
                        service.status === "active"
                          ? "text-green-600"
                          : service.status === "warning"
                          ? "text-yellow-600"
                          : service.status === "error"
                          ? "text-red-600"
                          : "text-gray-500"
                      )}
                    >
                      {Math.round(service.responseTime)}ms
                    </span>
                  )}
                <StatusDot status={service.status} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center border-t pt-2">
         {lastUpdate && (
          <div className="text-xs text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
        <div className="text-xs text-gray-500">
           {isConnected ? 'Realtime Connected' : 'Updates Paused'}
        </div>
      </div>
    </div>
  );

  return {
    indicator,
    detailed,
    refresh: refetch,
    isChecking: isFetching
  };
}

export function CompactBackendStatus({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {backend.indicator}
    </div>
  );
}

export function DetailedBackendStatus({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();

  return (
    <div className={cn("bg-white rounded-lg border p-4 shadow-sm", className)}>
      {backend.detailed}
    </div>
  );
}

export function BackendStatusWidget({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const GlobalHealthStatusModal = React.lazy(() =>
    import("@/components/admin/GlobalHealthStatusModal").then((m) => ({
      default: m.GlobalHealthStatusModal,
    }))
  );

  const handleClick = () => {
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
