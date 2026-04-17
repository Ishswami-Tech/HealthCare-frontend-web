'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Monitor, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useActiveSessions, useRevokeSession } from '@/hooks/query/useSessions';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}

export function ActiveSessionsList() {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const { data: sessions = [], isPending: loading, error } = useActiveSessions();
  const revokeSessionMutation = useRevokeSession();

  async function handleRevoke(sessionId: string) {
    try {
      setRevokingId(sessionId);
      await revokeSessionMutation.mutateAsync(sessionId);
    } finally {
      setRevokingId(null);
    }
  }

  function getDeviceIcon(deviceInfo: string) {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading sessions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-lg font-medium">No active sessions</p>
            <p className="text-sm text-muted-foreground">
              You're not logged in on any devices
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="mt-1">{getDeviceIcon(session.deviceInfo)}</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{session.deviceInfo}</CardTitle>
                    {session.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current Session
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    IP: {session.ipAddress} • Last active{' '}
                    {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true })}
                  </CardDescription>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revokingId === session.id}
                >
                  {revokingId === session.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    'Sign Out'
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
