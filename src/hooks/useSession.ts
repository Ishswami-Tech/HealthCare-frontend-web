'use client';

import { useQuery } from '@tanstack/react-query';
import { getActiveSessions, terminateSession } from '@/lib/actions/auth.server';
import type { SessionInfo } from '@/types/auth.types';

export function useSession() {
  const {
    data: sessions,
    isLoading,
    error,
    refetch,
  } = useQuery<SessionInfo[]>({
    queryKey: ['sessions'],
    queryFn: getActiveSessions,
  });

  const currentSession = sessions?.find(session => session.isCurrentSession);
  const otherSessions = sessions?.filter(session => !session.isCurrentSession) || [];

  return {
    sessions,
    currentSession,
    otherSessions,
    isLoading,
    error,
    refetch,
    terminateSession,
  };
} 