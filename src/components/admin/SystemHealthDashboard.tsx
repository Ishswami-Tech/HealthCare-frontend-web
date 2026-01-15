"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Activity,

  Wifi,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { BackendStatusIndicator } from '@/components/common/BackendStatusIndicator';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';
import { useAppStore } from '@/stores';
import { StatusDot, StatusType } from '@/components/common/StatusIndicator';

export function SystemHealthDashboard({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();
  const { isConnected, connectionStatus, error: wsError } = useWebSocketStatus();
  const { notifications } = useAppStore();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Calculate system metrics
  const services = [
    backend.services.api,
    backend.services.database,
    backend.services.websocket,
    backend.services.cache,
  ];

  const healthyServices = services.filter(s => s.status === 'active').length;
  const totalServices = services.length;
  // const systemUptime = Math.floor((Date.now() - (backend.services.api.lastChecked?.getTime() || Date.now())) / 1000);
  const averageResponseTime = services
    .filter(s => s.responseTime !== null)
    .reduce((acc, s) => acc + (s.responseTime || 0), 0) / services.filter(s => s.responseTime !== null).length || 0;

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'loading': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };



  return (
    <div className={cn('space-y-6', className)}>
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((healthyServices / totalServices) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {healthyServices}/{totalServices} services healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(averageResponseTime)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WebSocket</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', 
              isConnected ? 'text-green-600' : 'text-red-600'
            )}>
              {isConnected ? 'Connected' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {connectionStatus}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backend.services.lastGlobalCheck 
                ? new Date(backend.services.lastGlobalCheck).toLocaleTimeString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-refresh: {autoRefresh ? 'On' : 'Off'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Service Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backend Services Status</CardTitle>
              <CardDescription>
                Real-time health monitoring of all backend services
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => backend.refresh(true)}
                disabled={backend.isChecking}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', backend.isChecking && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <service.icon className="h-4 w-4" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(service.status)}>
                      <StatusDot status={service.status} size="sm" className="mr-2" />
                      {service.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {service.responseTime !== null ? (
                      <span className={cn(
                        service.responseTime > 1000 ? 'text-red-600' :
                        service.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'
                      )}>
                        {service.responseTime}ms
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.lastChecked ? (
                      <span className="text-sm text-gray-500">
                        {service.lastChecked.toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.error ? (
                      <div className="text-sm text-red-600 max-w-xs truncate" title={service.error}>
                        {service.error}
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Healthy
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* WebSocket Details */}
      {wsError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              WebSocket Connection Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-700">
              <p className="font-medium">Error: {wsError}</p>
              <p className="text-sm mt-2">
                Real-time features may not work properly. The system will attempt to reconnect automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Notifications */}
      {notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent System Notifications
            </CardTitle>
            <CardDescription>
              Latest notifications and system alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 rounded-lg border text-sm',
                    notification.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
                    notification.type === 'warning' ? 'border-yellow-200 bg-yellow-50 text-yellow-800' :
                    notification.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
                    'border-blue-200 bg-blue-50 text-blue-800'
                  )}
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs opacity-80 mt-1">{notification.message}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for embedding in other dashboards
export function CompactSystemHealth({ className }: { className?: string }) {
  const backend = BackendStatusIndicator();
  const { isConnected } = useWebSocketStatus();
  
  const services = [
    backend.services.api,
    backend.services.database, 
    backend.services.websocket,
    backend.services.cache,
  ];
  
  const healthyServices = services.filter(s => s.status === 'active').length;
  const totalServices = services.length;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Status</span>
          <Badge variant={healthyServices === totalServices ? 'default' : 'destructive'}>
            {healthyServices}/{totalServices} Healthy
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">WebSocket</span>
          <StatusDot 
            status={isConnected ? 'active' : 'error'} 
            size="sm"
            title={isConnected ? 'Connected' : 'Disconnected'}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Check</span>
          <span className="text-xs text-gray-500">
            {backend.services.lastGlobalCheck 
              ? new Date(backend.services.lastGlobalCheck).toLocaleTimeString()
              : 'Never'
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}