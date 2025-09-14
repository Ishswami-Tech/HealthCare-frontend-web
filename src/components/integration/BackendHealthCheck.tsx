"use client";

import React from 'react';
import { useHealthStatus } from '@/hooks/useHealth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface BackendHealthCheckProps {
  showDetails?: boolean;
  className?: string;
}

export const BackendHealthCheck: React.FC<BackendHealthCheckProps> = ({ 
  showDetails = false,
  className 
}) => {
  const { data: health, isPending, error, refetch, isFetching } = useHealthStatus();

  const getStatusColor = () => {
    if (isPending || isFetching) return 'secondary';
    if (error) return 'destructive';
    return health?.status === 'healthy' ? 'default' : 'destructive';
  };

  const getStatusIcon = () => {
    if (isPending || isFetching) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (error) return <WifiOff className="w-4 h-4" />;
    return health?.status === 'healthy' ? 
      <CheckCircle className="w-4 h-4" /> : 
      <XCircle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isPending) return 'Checking...';
    if (isFetching) return 'Refreshing...';
    if (error) return 'Connection Error';
    return health?.status === 'healthy' ? 'Backend Connected' : 'Backend Error';
  };

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <Badge variant={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  // Detailed health check card
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Backend Integration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge variant={getStatusColor()}>
            {health?.status || 'Unknown'}
          </Badge>
        </div>

        {/* Connection Details */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div>
            <strong>API Endpoint:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
          </div>
          <div>
            <strong>Clinic ID:</strong> {process.env.NEXT_PUBLIC_CLINIC_ID || 'Not configured'}
          </div>
          {(health?.details as any) && (
            <div>
              <strong>Details:</strong> {JSON.stringify(health?.details as any, null, 2)}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : 'Unknown error occurred'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full"
        >
          {isFetching ? (
            <LoadingSpinner size="sm" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isFetching ? 'Checking...' : 'Check Connection'}
        </Button>

        {/* Integration Checklist */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Integration Checklist:</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Server Actions Configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>React Query Hooks Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>RBAC System Integrated</span>
            </div>
            <div className="flex items-center gap-2">
              {health?.status === 'healthy' ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span>Backend API Connected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};