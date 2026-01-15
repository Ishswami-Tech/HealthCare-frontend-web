"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/index";
import {
  Activity,
  RefreshCw,
} from "lucide-react";
import { StatusIndicator, StatusType, StatusDot } from "./StatusIndicator";
import { useBackendHealth } from "@/hooks/utils/useBackendHealth";

// Re-export specific components/functions if they were exported before?
// The file exported: BackendStatusIndicator, CompactBackendStatus, DetailedBackendStatus, BackendStatusWidget

export function BackendStatusIndicator() {
  const { backendStatus, checkAllServices } = useBackendHealth();

  const getOverallStatus = (): StatusType => {
      // Use the computed global status from the hook
      if (backendStatus.globalStatus === 'operational') return "active";
      if (backendStatus.globalStatus === 'degraded') return "warning";
      return "error";
  };

  const getOverallLabel = () => {
    return `${backendStatus.healthPercentage}% Operational`;
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
            onClick={() => checkAllServices(true)}
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
            backendStatus.build,
            backendStatus.cicd,
          ].map((service) => {
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
                  {service.responseTime !== null &&
                    service.responseTime !== undefined &&
                    service.responseTime > 0 && (
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
