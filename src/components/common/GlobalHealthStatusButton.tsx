"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDetailedHealthStatus } from '@/hooks/query/useHealth';
import { Badge } from '@/components/ui/badge';

// Dynamically import to avoid SSR issues and circular dependencies
const GlobalHealthStatusModal = React.lazy(
  () => import('@/components/admin/GlobalHealthStatusModal').then(m => ({ default: m.GlobalHealthStatusModal }))
);

interface GlobalHealthStatusButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export function GlobalHealthStatusButton({
  className,
  variant = 'floating',
  position = 'bottom-right',
}: GlobalHealthStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    data: healthData, 
    isConnected,
    connectionStatus,
  } = useDetailedHealthStatus();

  // Calculate overall health
  const services = [
    { name: 'Database', status: (healthData as any)?.database?.status || 'unknown' },
    { name: 'Cache', status: (healthData as any)?.cache?.status || 'unknown' },
    { name: 'Queue', status: (healthData as any)?.queue?.status || 'unknown' },
    { name: 'Communication', status: (healthData as any)?.communication?.status || 'unknown' },
    { name: 'Video', status: (healthData as any)?.video?.status || 'unknown' },
    { name: 'Logging', status: (healthData as any)?.logging?.status || 'unknown' },
  ];

  const healthyCount = services.filter(s => s.status === 'up').length;
  const totalCount = services.length;
  const overallHealth = healthyCount === totalCount ? 'healthy' : healthyCount === 0 ? 'critical' : 'degraded';

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4', // Positioned above WhatsApp button (which is at bottom-4)
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const healthColors = {
    healthy: 'bg-green-500 hover:bg-green-600',
    degraded: 'bg-yellow-500 hover:bg-yellow-600',
    critical: 'bg-red-500 hover:bg-red-600',
  };

  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed z-40 shadow-lg rounded-full h-14 w-14 p-0 relative',
            positionClasses[position],
            healthColors[overallHealth],
            className
          )}
          title={`View System Health Status${isConnected ? ' (Real-time)' : connectionStatus === 'connecting' ? ' (Connecting...)' : ' (Offline)'}`}
        >
          <Activity className="h-6 w-6 text-white" />
          {overallHealth !== 'healthy' && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              !
            </Badge>
          )}
          {/* Connection status indicator */}
          <div className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white',
            isConnected ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500',
            (isConnected || connectionStatus === 'connecting') && 'animate-pulse'
          )} />
        </Button>
        {isOpen && (
          <React.Suspense fallback={null}>
            <GlobalHealthStatusModal open={isOpen} onOpenChange={setIsOpen} />
          </React.Suspense>
        )}
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={cn('flex items-center gap-2', className)}
      >
        <Activity className="h-4 w-4" />
        <span>System Health</span>
        {overallHealth !== 'healthy' && (
          <Badge
            variant={overallHealth === 'critical' ? 'destructive' : 'secondary'}
            className="ml-1"
          >
            {healthyCount}/{totalCount}
          </Badge>
        )}
      </Button>
      {isOpen && (
        <React.Suspense fallback={null}>
          <GlobalHealthStatusModal open={isOpen} onOpenChange={setIsOpen} />
        </React.Suspense>
      )}
    </>
  );
}

