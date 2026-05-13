"use client";

// import React from 'react';
import { cn } from '@/lib/utils';
import { 
  StatusSummary, 
  LiveActivityIndicator,
  SystemStatusIndicator,
  UserStatusIndicator,
  SessionStatusIndicator 
} from '@/components/common/StatusIndicator';
import { BackendStatusWidget, CompactBackendStatus } from '@/components/common/BackendStatusIndicator';
import { useAppStore } from '@/stores';
import { useWebSocketStatus } from '@/app/providers/WebSocketProvider';

interface DashboardStatusBarProps {
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  position?: 'top' | 'bottom' | 'floating';
}

export function DashboardStatusBar({ 
  className, 
  variant = 'full',
  position = 'top'
}: DashboardStatusBarProps) {
  const { user, currentClinic } = useAppStore();
  useWebSocketStatus();

  const positionClasses = {
    top: 'border-b border-border/70 bg-background/85 backdrop-blur-xl',
    bottom: 'border-t border-border/70 bg-background/85 backdrop-blur-xl',
    floating: 'rounded-2xl border border-border/80 bg-card/95 shadow-lg ring-1 ring-border/25 backdrop-blur-xl'
  };

  if (variant === 'minimal') {
    return (
      <div className={cn(
        'px-4 py-2 flex items-center justify-between text-xs',
        positionClasses[position],
        className
      )}>
        <LiveActivityIndicator showLabel={false} />
        <div className="flex items-center gap-2">
          <CompactBackendStatus />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'px-4 py-3 flex items-center justify-between',
        positionClasses[position],
        className
      )}>
        <div className="flex items-center gap-3">
          <LiveActivityIndicator />
          <div className="text-sm text-muted-foreground">
            {(user as any)?.firstName || user?.name || 'User'} • {currentClinic?.name || 'No Clinic'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <BackendStatusWidget />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'px-6 py-4 flex items-center justify-between',
      positionClasses[position],
      className
    )}>
      <div className="flex items-center gap-4">
        <LiveActivityIndicator />
        
        <div className="flex items-center gap-3">
          <SystemStatusIndicator />
          <UserStatusIndicator />
          <SessionStatusIndicator />
        </div>

        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{(user as any)?.firstName || user?.name || 'User'} {(user as any)?.lastName || ''}</span>
          {currentClinic && (
            <>
              <span className="mx-2">•</span>
              <span>{currentClinic.name}</span>
            </>
          )}
          <span className="mx-2">•</span>
          <span className="capitalize">{user?.role}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <StatusSummary />
        <BackendStatusWidget />
      </div>
    </div>
  );
}

// Header component for dashboard pages
export function DashboardHeader({ 
  title, 
  subtitle, 
  children,
  showStatusBar = true,
  statusBarVariant = 'compact',
  className 
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  showStatusBar?: boolean;
  statusBarVariant?: 'full' | 'compact' | 'minimal';
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {showStatusBar && (
        <DashboardStatusBar variant={statusBarVariant} position="top" />
      )}
      
      {(title || subtitle || children) && (
        <div className="border-b border-border/70 bg-muted/25 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children && (
              <div className="flex items-center gap-2">
                {children}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Floating status widget for dashboard pages
export function FloatingStatusWidget({ className }: { className?: string }) {
  const { isRealTimeEnabled, isConnected } = useWebSocketStatus();

  // Only show if there are any issues
  if (isRealTimeEnabled && isConnected) {
    return null;
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50',
      className
    )}>
      <DashboardStatusBar variant="compact" position="floating" />
    </div>
  );
}

// Footer status bar
export function DashboardFooter({ className }: { className?: string }) {
  return (
    <DashboardStatusBar 
      variant="minimal" 
      position="bottom"
      className={cn('mt-auto', className)}
    />
  );
}
