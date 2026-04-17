"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Database,
  HardDrive,
  MessageSquare,
  Video,
  FileText,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Mail,
  Smartphone,
  Bell,
  Wifi,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useDetailedHealthStatus,
  DetailedHealthStatus,
} from "@/hooks/query/useHealth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ServiceCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "up" | "down" | "degraded";
  children?: React.ReactNode;
  className?: string;
}

function ServiceCard({
  title,
  icon: Icon,
  status,
  children,
  className,
}: ServiceCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const statusColors = {
    up: "border-green-200 bg-green-50",
    down: "border-red-200 bg-red-50",
    degraded: "border-yellow-200 bg-yellow-50",
  };

  const statusIcons = {
    up: <CheckCircle className="h-5 w-5 text-green-600" />,
    down: <AlertTriangle className="h-5 w-5 text-red-600" />,
    degraded: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  };

  return (
    <Card className={cn("transition-all", statusColors[status], className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-opacity-80 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {statusIcons[status]}
                    <Badge
                      variant="outline"
                      className={cn(
                        status === "up" && "border-green-600 text-green-700",
                        status === "down" && "border-red-600 text-red-700",
                        status === "degraded" &&
                          "border-yellow-600 text-yellow-700"
                      )}
                    >
                      {status === "up"
                        ? "Healthy"
                        : status === "down"
                        ? "Down"
                        : "Degraded"}
                    </Badge>
                  </div>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === undefined || value === null) return null;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ComprehensiveHealthDashboard({
  className,
}: {
  className?: string;
}) {
  const {
    data: healthData,
    isPending,
    isFetching,
    error,
    refetch,
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect,
  } = useDetailedHealthStatus();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleRefresh = async () => {
    reconnect();
    await refetch();
    setLastRefresh(new Date());
  };



  if (isPending && !healthData) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading health status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            {error instanceof Error
              ? error.message
              : "Failed to fetch health status"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const health = (healthData || {}) as DetailedHealthStatus;

  // Calculate overall health
  const services = [
    { name: "Database", status: health.database?.status || "unknown" },
    { name: "Cache", status: health.cache?.status || "unknown" },
    { name: "Queue", status: health.queue?.status || "unknown" },
    {
      name: "Communication",
      status: health.communication?.status || "unknown",
    },
    { name: "Video", status: health.video?.status || "unknown" },
    { name: "Logging", status: health.logging?.status || "unknown" },
  ];

  const healthyCount = services.filter((s) => s.status === "up").length;
  const totalCount = services.length;
  const overallHealth =
    healthyCount === totalCount
      ? "up"
      : healthyCount === 0
      ? "down"
      : "degraded";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with overall status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8" />
            System Health Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600">
              Real-time monitoring of all backend services
            </p>
            <Badge
              variant={
                isConnected
                  ? "default"
                  : connectionStatus === "connecting"
                  ? "secondary"
                  : "destructive"
              }
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <>
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Socket.IO Connected
                </>
              ) : connectionStatus === "connecting" ? (
                <>
                  <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <div className="h-2 w-2 bg-red-500 rounded-full" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">Last Updated</div>
            <div className="text-sm font-medium">
              {lastUpdate
                ? lastUpdate.toLocaleTimeString()
                : lastRefresh.toLocaleTimeString()}
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Summary */}
      <Card
        className={cn(
          overallHealth === "up" && "border-green-200 bg-green-50",
          overallHealth === "down" && "border-red-200 bg-red-50",
          overallHealth === "degraded" && "border-yellow-200 bg-yellow-50"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Overall System Health</CardTitle>
              <CardDescription>
                {healthyCount} of {totalCount} services are healthy
              </CardDescription>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "text-4xl font-bold",
                  overallHealth === "up" && "text-green-600",
                  overallHealth === "down" && "text-red-600",
                  overallHealth === "degraded" && "text-yellow-600"
                )}
              >
                {Math.round((healthyCount / totalCount) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Health Score</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Database Service */}
      <ServiceCard
        title="Database"
        icon={Database}
        status={health.database?.status === "up" ? "up" : "down"}
      >
        <div className="space-y-2">
          <MetricRow
            label="Connection Count"
            value={health.database?.connectionCount}
            icon={Users}
          />
          <MetricRow
            label="Active Queries"
            value={health.database?.activeQueries}
            icon={Activity}
          />
          <MetricRow
            label="Avg Response Time"
            value={
              health.database?.avgResponseTime
                ? `${health.database.avgResponseTime}ms`
                : undefined
            }
            icon={TrendingUp}
          />
          <MetricRow
            label="Last Health Check"
            value={
              health.database?.lastHealthCheck
                ? new Date(health.database.lastHealthCheck).toLocaleString()
                : undefined
            }
            icon={Clock}
          />
          {health.database?.errors && health.database.errors.length > 0 && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Errors:</strong> {health.database.errors.join(", ")}
            </div>
          )}
        </div>
      </ServiceCard>

      {/* Cache Service */}
      <ServiceCard
        title="Cache"
        icon={HardDrive}
        status={health.cache?.status === "up" ? "up" : "down"}
      >
        <div className="space-y-2">
          <MetricRow
            label="Provider"
            value={health.cache?.provider}
            icon={HardDrive}
          />
          <MetricRow
            label="Latency"
            value={
              health.cache?.latency ? `${health.cache.latency}ms` : undefined
            }
            icon={TrendingUp}
          />
          <MetricRow
            label="Connection Status"
            value={
              health.cache?.connection?.connected ? "Connected" : "Disconnected"
            }
            icon={
              health.cache?.connection?.connected ? CheckCircle : AlertTriangle
            }
          />
          {health.cache?.connection?.providerStatus && (
            <MetricRow
              label="Provider Status"
              value={health.cache.connection.providerStatus}
            />
          )}
        </div>
      </ServiceCard>

      {/* Queue Service */}
      <ServiceCard
        title="Queue"
        icon={Zap}
        status={health.queue?.status === "up" ? "up" : "down"}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 text-sm">Connection</h4>
            <div className="space-y-2">
              <MetricRow
                label="Status"
                value={
                  health.queue?.connection?.connected
                    ? "Connected"
                    : "Disconnected"
                }
                icon={
                  health.queue?.connection?.connected
                    ? CheckCircle
                    : AlertTriangle
                }
              />
              <MetricRow
                label="Provider"
                value={health.queue?.connection?.provider}
              />
              <MetricRow
                label="Latency"
                value={
                  health.queue?.connection?.latency
                    ? `${health.queue.connection.latency}ms`
                    : undefined
                }
                icon={TrendingUp}
              />
            </div>
          </div>
          {health.queue?.metrics && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Metrics</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Total Jobs"
                  value={health.queue.metrics.totalJobs}
                />
                <MetricRow
                  label="Active Jobs"
                  value={health.queue.metrics.activeJobs}
                />
                <MetricRow
                  label="Waiting Jobs"
                  value={health.queue.metrics.waitingJobs}
                />
                <MetricRow
                  label="Failed Jobs"
                  value={health.queue.metrics.failedJobs}
                />
                <MetricRow
                  label="Completed Jobs"
                  value={health.queue.metrics.completedJobs}
                />
                <MetricRow
                  label="Error Rate"
                  value={
                    health.queue.metrics.errorRate
                      ? `${health.queue.metrics.errorRate}%`
                      : undefined
                  }
                />
              </div>
            </div>
          )}
          {health.queue?.performance && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Performance</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Avg Processing Time"
                  value={
                    health.queue.performance.averageProcessingTime
                      ? `${health.queue.performance.averageProcessingTime}ms`
                      : undefined
                  }
                  icon={TrendingUp}
                />
                <MetricRow
                  label="Throughput"
                  value={
                    health.queue.performance.throughputPerMinute
                      ? `${health.queue.performance.throughputPerMinute}/min`
                      : undefined
                  }
                />
              </div>
            </div>
          )}
        </div>
      </ServiceCard>

      {/* Communication Service */}
      <ServiceCard
        title="Communication"
        icon={MessageSquare}
        status={
          health.communication?.status === "up" && health.communication?.healthy
            ? "up"
            : health.communication?.degraded
            ? "degraded"
            : "down"
        }
      >
        <div className="space-y-4">
          {health.communication?.socket && (
            <div>
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                WebSocket
              </h4>
              <div className="space-y-2">
                <MetricRow
                  label="Connected"
                  value={health.communication.socket.connected ? "Yes" : "No"}
                  icon={
                    health.communication.socket.connected
                      ? CheckCircle
                      : AlertTriangle
                  }
                />
                <MetricRow
                  label="Connected Clients"
                  value={health.communication.socket.connectedClients}
                />
                <MetricRow
                  label="Latency"
                  value={
                    health.communication.socket.latency
                      ? `${health.communication.socket.latency}ms`
                      : undefined
                  }
                  icon={TrendingUp}
                />
              </div>
            </div>
          )}
          <div>
            <h4 className="font-medium mb-2 text-sm">Channels</h4>
            <div className="space-y-2">
              <MetricRow
                label="Email"
                value={
                  health.communication?.email?.connected
                    ? "Connected"
                    : "Disconnected"
                }
                icon={
                  health.communication?.email?.connected ? Mail : AlertTriangle
                }
              />
              {health.communication?.email?.latency !== undefined && (
                <MetricRow
                  label="Email Latency"
                  value={`${health.communication.email.latency}ms`}
                  icon={TrendingUp}
                />
              )}
              <MetricRow
                label="WhatsApp"
                value={
                  health.communication?.whatsapp?.connected
                    ? "Connected"
                    : "Disconnected"
                }
                icon={
                  health.communication?.whatsapp?.connected
                    ? Smartphone
                    : AlertTriangle
                }
              />
              <MetricRow
                label="Push Notifications"
                value={
                  health.communication?.push?.connected
                    ? "Connected"
                    : "Disconnected"
                }
                icon={
                  health.communication?.push?.connected ? Bell : AlertTriangle
                }
              />
            </div>
          </div>
          {health.communication?.metrics && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Metrics</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Socket Connections"
                  value={health.communication.metrics.socketConnections}
                />
                <MetricRow
                  label="Email Queue Size"
                  value={health.communication.metrics.emailQueueSize}
                />
              </div>
            </div>
          )}
          {health.communication?.circuitBreakerOpen && (
            <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-700">
              <strong>Circuit Breaker:</strong> Open (service protection active)
            </div>
          )}
          {health.communication?.issues &&
            health.communication.issues.length > 0 && (
              <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
                <strong>Issues:</strong>
                <ul className="list-disc list-inside mt-1">
                  {health.communication.issues.map((issue: string, idx: number) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      </ServiceCard>

      {/* Video Service */}
      <ServiceCard
        title="Video"
        icon={Video}
        status={
          health.video?.status === "up" && health.video?.isHealthy
            ? "up"
            : "down"
        }
      >
        <div className="space-y-2">
          <MetricRow
            label="Primary Provider"
            value={health.video?.primaryProvider}
            icon={Video}
          />
          <MetricRow
            label="Fallback Provider"
            value={health.video?.fallbackProvider}
          />
          {health.video?.error && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Error:</strong> {health.video.error}
            </div>
          )}
        </div>
      </ServiceCard>

      {/* Logging Service */}
      <ServiceCard
        title="Logging"
        icon={FileText}
        status={
          health.logging?.status === "up" && health.logging?.healthy
            ? "up"
            : "down"
        }
      >
        <div className="space-y-4">
          {health.logging?.service && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Service</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Available"
                  value={health.logging.service.available ? "Yes" : "No"}
                  icon={
                    health.logging.service.available
                      ? CheckCircle
                      : AlertTriangle
                  }
                />
                <MetricRow
                  label="Service Name"
                  value={health.logging.service.serviceName}
                />
                <MetricRow
                  label="Latency"
                  value={
                    health.logging.service.latency
                      ? `${health.logging.service.latency}ms`
                      : undefined
                  }
                  icon={TrendingUp}
                />
              </div>
            </div>
          )}
          {health.logging?.endpoint && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Endpoint</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Accessible"
                  value={health.logging.endpoint.accessible ? "Yes" : "No"}
                  icon={
                    health.logging.endpoint.accessible
                      ? CheckCircle
                      : AlertTriangle
                  }
                />
                <MetricRow label="URL" value={health.logging.endpoint.url} />
                <MetricRow label="Port" value={health.logging.endpoint.port} />
                <MetricRow
                  label="Status Code"
                  value={health.logging.endpoint.statusCode}
                />
                <MetricRow
                  label="Latency"
                  value={
                    health.logging.endpoint.latency
                      ? `${health.logging.endpoint.latency}ms`
                      : undefined
                  }
                  icon={TrendingUp}
                />
              </div>
            </div>
          )}
          {health.logging?.metrics && (
            <div>
              <h4 className="font-medium mb-2 text-sm">Metrics</h4>
              <div className="space-y-2">
                <MetricRow
                  label="Total Logs"
                  value={health.logging.metrics.totalLogs}
                />
                <MetricRow
                  label="Error Rate"
                  value={
                    health.logging.metrics.errorRate
                      ? `${health.logging.metrics.errorRate}%`
                      : undefined
                  }
                />
                <MetricRow
                  label="Avg Response Time"
                  value={
                    health.logging.metrics.averageResponseTime
                      ? `${health.logging.metrics.averageResponseTime}ms`
                      : undefined
                  }
                  icon={TrendingUp}
                />
              </div>
            </div>
          )}
          {health.logging?.error && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
              <strong>Error:</strong> {health.logging.error}
            </div>
          )}
        </div>
      </ServiceCard>

      {/* Connection status indicator */}
      <Card
        className={cn(
          isConnected
            ? "border-green-200 bg-green-50"
            : connectionStatus === "connecting"
            ? "border-yellow-200 bg-yellow-50"
            : "border-red-200 bg-red-50"
        )}
      >
        <CardContent className="pt-6">
          <div
            className={cn(
              "flex items-center justify-center gap-2 text-sm",
              isConnected
                ? "text-green-700"
                : connectionStatus === "connecting"
                ? "text-yellow-700"
                : "text-red-700"
            )}
          >
            {isConnected ? (
              <>
                <Activity className="h-4 w-4 animate-pulse" />
                <span>Real-time updates via Socket.IO</span>
              </>
            ) : connectionStatus === "connecting" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Connecting to Socket.IO...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Disconnected - attempting to reconnect...</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
