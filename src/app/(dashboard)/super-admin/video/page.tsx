"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VideoAppointmentsList } from "@/components/video/VideoAppointmentsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Activity,
  RefreshCw,
  ShieldAlert,
  Users,
  Video,
  XCircle,
  Loader2,
} from "lucide-react";
import { useQueryData, useMutationOperation } from "@/hooks/core";
import { listAllVideoSessions, terminateVideoSession } from "@/lib/actions/video.server";
import type { VideoSession } from "@/types/video.types";
import { format } from "date-fns";

const TOAST_TERMINATE = "admin-terminate-session";

// ─────────────────────────────────────────────────────────────
// Active Sessions Monitor Component
// ─────────────────────────────────────────────────────────────
function ActiveSessionsMonitor() {
  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [confirmTerminate, setConfirmTerminate] = useState<{
    id: string;
    appointmentId: string;
  } | null>(null);

  const {
    data,
    isPending: isLoading,
    refetch,
    isFetching,
  } = useQueryData(["admin-video-sessions"], () => listAllVideoSessions(), {
    refetchInterval: 30_000,
  });

  const terminateMutation = useMutationOperation<
    { success: boolean; message?: string },
    string
  >(
    async (sessionId: string) => {
      const result = await terminateVideoSession(
        sessionId,
        "Terminated by Super Admin"
      );
      if (!result.success) throw new Error("Failed to terminate session");
      return result;
    },
    {
      toastId: TOAST_TERMINATE,
      loadingMessage: "Terminating session…",
      successMessage: "Session terminated successfully",
      invalidateQueries: [["admin-video-sessions"]],
      onSuccess: () => {
        setConfirmTerminate(null);
        setTerminatingId(null);
      },
      onError: (_error: Error, _variables: string) => {
        setTerminatingId(null);
      },
    }
  );

  const handleTerminate = (id: string, appointmentId: string) => {
    setConfirmTerminate({ id, appointmentId });
  };

  const confirmTermination = () => {
    if (!confirmTerminate) return;
    setTerminatingId(confirmTerminate.id);
    terminateMutation.mutate(confirmTerminate.id);
  };

  const sessions: VideoSession[] =
    ((data as { sessions?: VideoSession[] } | null)?.sessions) ?? [];

  const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length;
  const totalParticipants = sessions.reduce(
    (acc, s) => acc + (s.participants?.length ?? 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParticipants}</p>
                <p className="text-xs text-muted-foreground">
                  Active Participants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm">Live Sessions</CardTitle>
          <Button
            id="btn-refresh-sessions"
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No active sessions at this time.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={
                        session.status === 'ACTIVE' ? 'default' : 'secondary'
                      }
                      className={
                        session.status === 'ACTIVE'
                          ? 'bg-green-500 hover:bg-green-600'
                          : ''
                      }
                    >
                      {session.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        Appointment{" "}
                        <span className="font-mono text-xs">
                          {session.appointmentId?.slice(0, 8) ?? "N/A"}…
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.participants?.length ?? 0} participant(s) ·{" "}
                        {session.provider} ·{" "}
                        {session.startTime
                          ? `Started ${format(new Date(session.startTime), "HH:mm")}`
                          : "Pending"}
                      </p>
                    </div>
                  </div>
                  {session.status === 'ACTIVE' && (
                    <Button
                      id={`btn-terminate-${session.id}`}
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={
                        terminatingId === session.id ||
                        terminateMutation.isPending
                      }
                      onClick={() =>
                        handleTerminate(session.id, session.appointmentId)
                      }
                    >
                      {terminatingId === session.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Terminate
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!confirmTerminate}
        onOpenChange={(open) => !open && setConfirmTerminate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Terminate Video Session
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to forcefully terminate the session for
              appointment{" "}
              <span className="font-mono font-medium">
                {confirmTerminate?.appointmentId?.slice(0, 8)}…
              </span>
              ? All participants will be disconnected immediately. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel id="btn-cancel-terminate">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              id="btn-confirm-terminate"
              onClick={confirmTermination}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, terminate session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function SuperAdminVideoPage() {
  return (
    <DashboardLayout title="Video Consultations Management">
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live" className="gap-2">
            <Activity className="h-4 w-4" />
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Video className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <ActiveSessionsMonitor />
        </TabsContent>

        <TabsContent value="history">
          <VideoAppointmentsList
            title="All Video Consultations"
            description="Full history across all clinics"
            showStatistics={true}
            showClinicFilter={true}
            showJoinButton={false}
            showEndButton={true}
            showDownloadButton={true}
            limit={200}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
