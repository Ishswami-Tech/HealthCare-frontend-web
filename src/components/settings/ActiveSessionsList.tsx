'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CircleAlert, Loader2, Monitor, RefreshCw, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EmptyBlock, IconBox, Note, Pill } from '@/components/tbd';
import { useActiveSessions, useRevokeSession, type ActiveSession } from '@/hooks/query/useSessions';

function isPhone(deviceInfo: string) {
  const lower = deviceInfo.toLowerCase();
  return lower.includes('mobile') || lower.includes('android') || lower.includes('iphone');
}

/** "Last active about 2 hours ago"; empty when the server sent no usable time. */
function lastActiveLabel(lastActivity: string) {
  const date = new Date(lastActivity);
  if (!lastActivity || Number.isNaN(date.getTime())) return '';
  return `Last active ${formatDistanceToNow(date, { addSuffix: true })}`;
}

export interface ActiveSessionsViewProps {
  sessions: ActiveSession[];
  isLoading?: boolean;
  /** Message of the failed request; null when the list loaded. */
  errorMessage?: string | null;
  onRetry?: () => void;
  /** The session being signed out right now. */
  revokingId?: string | null;
  onRevoke: (sessionId: string) => void;
}

/** The list of signed-in devices. Everything it shows and does comes in through props. */
export function ActiveSessionsView({
  sessions,
  isLoading = false,
  errorMessage = null,
  onRetry,
  revokingId = null,
  onRevoke,
}: ActiveSessionsViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <span className="sr-only" role="status">
          Loading sessions…
        </span>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="flex items-center gap-3.5 border-b border-hair py-3.5 last:border-b-0"
            aria-hidden="true"
          >
            <span className="size-[42px] shrink-0 animate-pulse rounded-[13px] bg-well" />
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="h-3.5 w-40 max-w-full animate-pulse rounded bg-well" />
              <span className="h-3 w-56 max-w-full animate-pulse rounded bg-well" />
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Note tone="rose" icon={CircleAlert} className="mt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span role="alert">{errorMessage}</span>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Try again
            </Button>
          ) : null}
        </div>
      </Note>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyBlock
        icon={CheckCircle}
        title="No active sessions"
        description="You're not logged in on any devices"
        className="py-8"
      />
    );
  }

  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {sessions.map((session) => {
        const lastActive = lastActiveLabel(session.lastActivity);
        const details = [session.ipAddress ? `IP: ${session.ipAddress}` : '', lastActive]
          .filter(Boolean)
          .join(' • ');
        const revoking = revokingId === session.id;
        return (
          <li
            key={session.id}
            className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-hair py-3.5 last:border-b-0 last:pb-0"
          >
            <IconBox icon={isPhone(session.deviceInfo) ? Smartphone : Monitor} tone="slate" size={42} />
            <span className="flex min-w-0 flex-1 basis-[180px] flex-col gap-0.5">
              <span className="text-sm font-bold text-ink">{session.deviceInfo || 'Unknown device'}</span>
              {details ? (
                <span className="text-xs text-ink-muted" suppressHydrationWarning>
                  {details}
                </span>
              ) : null}
            </span>
            {session.isCurrent ? (
              <Pill tone="green" dot>
                Current session
              </Pill>
            ) : (
              <Button
                variant="danger"
                onClick={() => onRevoke(session.id)}
                disabled={revoking}
                aria-label={`Sign out ${session.deviceInfo || 'this device'}`}
              >
                {revoking ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Signing out…
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ActiveSessionsList() {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const { data: sessions = [], isPending: loading, error, refetch } = useActiveSessions();
  const revokeSessionMutation = useRevokeSession();

  async function handleRevoke(sessionId: string) {
    try {
      setRevokingId(sessionId);
      await revokeSessionMutation.mutateAsync(sessionId);
    } catch {
      // The mutation already shows the failure as a toast.
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <ActiveSessionsView
      sessions={sessions}
      isLoading={loading}
      errorMessage={error ? error.message || 'Could not load your sessions.' : null}
      onRetry={() => void refetch()}
      revokingId={revokingId}
      onRevoke={(sessionId) => void handleRevoke(sessionId)}
    />
  );
}
