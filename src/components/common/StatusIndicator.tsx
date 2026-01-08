"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Server, 
  Users, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useWebSocketStatus } from '@/components/websocket/WebSocketProvider';
import { useAppStore } from '@/stores/app.store';
import { useHealthStore } from '@/stores/health.store';

export type StatusType = 'active' | 'inactive' | 'warning' | 'error' | 'loading';

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  active: {
    color: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
    icon: CheckCircle,
    dot: 'bg-green-500',
  },
  inactive: {
    color: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    icon: XCircle,
    dot: 'bg-gray-400',
  },
  warning: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    border: 'border-yellow-200',
    icon: AlertTriangle,
    dot: 'bg-yellow-500',
  },
  error: {
    color: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
    icon: XCircle,
    dot: 'bg-red-500',
  },
  loading: {
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    icon: Clock,
    dot: 'bg-blue-500 animate-pulse',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3',
    dot: 'h-2 w-2',
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'h-4 w-4',
    dot: 'h-3 w-3',
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'h-5 w-5',
    dot: 'h-4 w-4',
  },
};

export function StatusIndicator({
  status,
  label,
  icon: CustomIcon,
  size = 'md',
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        config.color,
        config.bg,
        config.border,
        sizeStyle.container,
        className
      )}
    >
      <Icon className={cn(sizeStyle.icon)} />
      {showLabel && <span>{label}</span>}
      <div className={cn('rounded-full', config.dot, sizeStyle.dot)} />
    </div>
  );
}

// Dot-only status indicator for compact spaces
export function StatusDot({
  status,
  size = 'md',
  className,
  title,
}: {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}) {
  const config = statusConfig[status];
  const sizeStyle = sizeConfig[size];

  return (
    <div
      className={cn('rounded-full', config.dot, sizeStyle.dot, className)}
      title={title}
    />
  );
}

// System-specific status indicators
export function SystemStatusIndicator() {
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();
  // Check health store for actual backend health status
  const healthStatus = useHealthStore((state) => state.healthStatus);
  const isHealthConnected = useHealthStore((state) => state.isConnected);
  
  // Determine overall health from backend services
  const getSystemStatus = (): StatusType => {
    // Priority 1: Use actual backend health data if available
    if (healthStatus && isHealthConnected) {
      // Check if all critical services are healthy
      const dbHealthy = healthStatus.database?.isHealthy !== false && 
                        (healthStatus.database?.status === 'up' || healthStatus.database?.status === 'healthy');
      const cacheHealthy = healthStatus.cache?.healthy !== false && 
                           (healthStatus.cache?.status === 'up' || healthStatus.cache?.status === 'healthy');
      const queueHealthy = healthStatus.queue?.healthy !== false && 
                          (healthStatus.queue?.status === 'up' || healthStatus.queue?.status === 'healthy');
      const apiHealthy = dbHealthy; // API depends on DB
      
      // If all critical services are healthy, system is active (green)
      if (dbHealthy && cacheHealthy && queueHealthy && apiHealthy) {
        return 'active'; // ✅ Green - All services healthy
      }
      
      // If some services are down, show warning (yellow)
      if (dbHealthy || cacheHealthy || queueHealthy) {
        return 'warning'; // ⚠️ Yellow - Some services degraded
      }
      
      // If all critical services are down, show error (red)
      return 'error'; // ❌ Red - Critical services down
    }
    
    // Priority 2: Fallback to WebSocket connection status
    // If WebSocket is connected, assume system is at least partially online
    if (isRealTimeEnabled && isConnected) {
      return 'active'; // ✅ Green - Real-time connected
    }
    if (isConnected) {
      return 'warning'; // ⚠️ Yellow - Connected but no real-time
    }
    
    // Priority 3: No connection at all
    return 'error'; // ❌ Red - No connection
  };

  const getSystemLabel = () => {
    // Priority 1: Use backend health data
    if (healthStatus && isHealthConnected) {
      const dbHealthy = healthStatus.database?.isHealthy !== false && 
                        (healthStatus.database?.status === 'up' || healthStatus.database?.status === 'healthy');
      const cacheHealthy = healthStatus.cache?.healthy !== false && 
                           (healthStatus.cache?.status === 'up' || healthStatus.cache?.status === 'healthy');
      const queueHealthy = healthStatus.queue?.healthy !== false && 
                          (healthStatus.queue?.status === 'up' || healthStatus.queue?.status === 'healthy');
      const apiHealthy = dbHealthy;
      
      if (dbHealthy && cacheHealthy && queueHealthy && apiHealthy) {
        return 'System Active'; // ✅ All services healthy
      }
      if (dbHealthy || cacheHealthy || queueHealthy) {
        return 'System Degraded'; // ⚠️ Some services down
      }
      return 'System Offline'; // ❌ Critical services down
    }
    
    // Priority 2: Fallback to WebSocket connection
    if (isRealTimeEnabled && isConnected) {
      return 'System Active';
    }
    if (isConnected) {
      return 'System Online';
    }
    return 'System Offline';
  };

  return (
    <StatusIndicator
      status={getSystemStatus()}
      label={getSystemLabel()}
      icon={Server}
      size="sm"
    />
  );
}

export function ConnectionStatusIndicator() {
  const { isConnected, connectionStatus, error } = useWebSocketStatus();

  const getConnectionStatus = (): StatusType => {
    if (error) return 'error';
    if (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') return 'loading';
    if (isConnected) return 'active';
    return 'inactive';
  };

  const getConnectionLabel = () => {
    if (error) return 'Connection Error';
    if (connectionStatus === 'connecting') return 'Connecting...';
    if (connectionStatus === 'reconnecting') return 'Reconnecting...';
    if (isConnected) return 'Connected';
    return 'Offline';
  };

  return (
    <StatusIndicator
      status={getConnectionStatus()}
      label={getConnectionLabel()}
      icon={isConnected ? Wifi : WifiOff}
      size="sm"
    />
  );
}

export function UserStatusIndicator() {
  const { isAuthenticated, user } = useAppStore();

  const getUserStatus = (): StatusType => {
    if (isAuthenticated && user) return 'active';
    return 'inactive';
  };

  const getUserLabel = () => {
    if (isAuthenticated && user) return 'Logged In';
    return 'Not Logged In';
  };

  return (
    <StatusIndicator
      status={getUserStatus()}
      label={getUserLabel()}
      icon={Shield}
      size="sm"
    />
  );
}

export function SessionStatusIndicator() {
  const { isAuthenticated, user } = useAppStore();
  const { isRealTimeEnabled } = useWebSocketStatus();

  const getSessionStatus = (): StatusType => {
    if (isAuthenticated && user && isRealTimeEnabled) return 'active';
    if (isAuthenticated && user) return 'warning';
    return 'inactive';
  };

  const getSessionLabel = () => {
    if (isAuthenticated && user && isRealTimeEnabled) return 'Session Active';
    if (isAuthenticated && user) return 'Session Limited';
    return 'No Session';
  };

  return (
    <StatusIndicator
      status={getSessionStatus()}
      label={getSessionLabel()}
      icon={Activity}
      size="sm"
    />
  );
}

// Combined status bar component
export function SystemStatusBar({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <SystemStatusIndicator />
      <ConnectionStatusIndicator />
      <SessionStatusIndicator />
    </div>
  );
}

// Compact status bar with dots only
export function CompactStatusBar({ className }: { className?: string }) {
  const { isConnected, isRealTimeEnabled } = useWebSocketStatus();
  const { isAuthenticated, user } = useAppStore();

  const systemStatus: StatusType = isRealTimeEnabled && isConnected ? 'active' : isConnected ? 'warning' : 'error';
  const userStatus: StatusType = isAuthenticated && user ? 'active' : 'inactive';
  const sessionStatus: StatusType = isAuthenticated && user && isRealTimeEnabled ? 'active' : isAuthenticated && user ? 'warning' : 'inactive';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <StatusDot status={systemStatus} size="sm" title="System Status" />
      <StatusDot status={userStatus} size="sm" title="User Status" />
      <StatusDot status={sessionStatus} size="sm" title="Session Status" />
    </div>
  );
}

// Live activity indicator
export function LiveActivityIndicator({ 
  className,
  showLabel = true 
}: { 
  className?: string;
  showLabel?: boolean;
}) {
  const { isRealTimeEnabled, isConnected } = useWebSocketStatus();
  const { isAuthenticated } = useAppStore();

  const isLive = isAuthenticated && isConnected && isRealTimeEnabled;

  if (!isLive) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        {showLabel && <span className="text-xs font-medium text-red-600">LIVE</span>}
      </div>
    </div>
  );
}

// Status summary component for dashboard headers
export function StatusSummary({ className }: { className?: string }) {
  const { isConnected, isRealTimeEnabled, connectionStatus } = useWebSocketStatus();
  const { isAuthenticated, user, currentClinic } = useAppStore();

  const activeCount = [
    isAuthenticated && user,
    isConnected,
    isRealTimeEnabled,
    currentClinic
  ].filter(Boolean).length;

  const totalSystems = 4;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-gray-600" />
        <span className="font-medium">
          {activeCount}/{totalSystems} Systems Active
        </span>
      </div>
      <LiveActivityIndicator />
      <CompactStatusBar />
    </div>
  );
}