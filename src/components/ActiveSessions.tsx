"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";

export default function ActiveSessions() {
  const queryClient = useQueryClient();
  const { sessions, isLoading, error, refetch } = useSession();

  // Mutation for terminating a session
  const { mutate: handleTerminateSession, isPending: isTerminating } =
    useMutation({
      mutationFn: async (sessionId: string) => {
        await queryClient.cancelQueries({ queryKey: ["sessions"] });
        return sessionId;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["sessions"] });
        toast.success("Session terminated successfully");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to terminate session"
        );
      },
    });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading sessions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Failed to load sessions"}
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="mx-auto"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const activeSessions = sessions || [];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Active Sessions</h2>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          className="text-gray-600"
        >
          Refresh
        </Button>
      </div>

      {activeSessions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No active sessions found.
        </p>
      ) : (
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div
              key={session.sessionId}
              className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {session.deviceInfo.browser} on {session.deviceInfo.os}
                </p>
                <p className="text-sm text-gray-500">
                  IP: {session.ipAddress} • Last active{" "}
                  {formatDistanceToNow(new Date(session.lastActivityAt), {
                    addSuffix: true,
                  })}
                </p>
                {session.isCurrentSession && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Current Session
                  </span>
                )}
              </div>
              {!session.isCurrentSession && (
                <Button
                  onClick={() => handleTerminateSession(session.sessionId)}
                  disabled={isTerminating}
                  variant="destructive"
                  size="sm"
                >
                  {isTerminating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    "Revoke"
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
