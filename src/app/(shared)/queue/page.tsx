"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueuePermissions } from "@/hooks/utils/useRBAC";
import { QueueProtectedComponent, ProtectedComponent } from "@/components/rbac";
import { useQueue, useQueueStats } from "@/hooks/query/useQueue";
// ✅ Removed: useUpdateQueueStatus, useCallNextPatient - using optimistic hooks instead
import { useClinicContext } from "@/hooks/query/useClinics";
import { Permission } from "@/types/rbac.types";
import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  useOptimisticUpdateQueueStatus,
  useOptimisticCallNextPatient,
} from "@/hooks/utils/useOptimisticQueue";

// Real-time queue data interface
import {
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  UserCheck,
  Stethoscope,
  Flame,
  Droplets,
  Leaf,
  Users,
  Timer,
  Activity,
} from "lucide-react";

export default function QueuePage() {
  useAuth();
  const [activeQueue, setActiveQueue] = useState("consultations");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // RBAC permissions
  const queuePermissions = useQueuePermissions();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Fetch queue data with proper permissions
  const {
    data: _queueData,
    isPending: isLoading,
    error,
    refetch: refetchQueue,
  } = useQueue(clinicId || "", {
    type: activeQueue,
    enabled: !!clinicId && queuePermissions.canViewQueue,
  });

  // Real-time queue status with WebSocket updates
  const realTimeQueueStatus = useRealTimeQueueStatus(activeQueue);

  // Use real-time data if available
  const queueData =
    realTimeQueueStatus.isRealTimeEnabled && realTimeQueueStatus.data
      ? realTimeQueueStatus.data
      : _queueData;

  // Fetch queue statistics for authorized users
  const { data: queueStats } = useQueueStats({
    enabled: queuePermissions.canManageQueue,
  });

  // Mutation hooks for queue actions with React 19 useOptimistic
  const updateQueueStatusOptimistic = useOptimisticUpdateQueueStatus(clinicId);
  const callNextPatientOptimistic = useOptimisticCallNextPatient(clinicId);

  // ✅ Use optimistic hooks (React 19) - no legacy hooks needed

  // Handle queue actions with optimistic updates
  const handleUpdateQueueStatus = (patientId: string, status: string) => {
    updateQueueStatusOptimistic.mutation.mutate(
      { patientId, status },
      {
        onSuccess: () => {
          refetchQueue();
        },
      }
    );
  };

  const handleCallNextPatient = (_queueType: string) => {
    callNextPatientOptimistic.mutation.mutate(
      undefined,
      {
        onSuccess: () => {
          refetchQueue();
          showSuccessToast("Next patient called successfully", {
            id: TOAST_IDS.GLOBAL.SUCCESS,
          });
        },
        onError: (error: Error) => {
          showErrorToast(error?.message || "Failed to call next patient", {
            id: TOAST_IDS.GLOBAL.ERROR,
          });
        },
      }
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading queue...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading queue: {error.message}</p>
          <Button onClick={() => refetchQueue()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Real-time queue data from API - filter by queue type
  const getQueueByType = (type: string) => {
    if (!queueData) return [];
    const data = Array.isArray((queueData as any)?.data)
      ? (queueData as any).data
      : Array.isArray(queueData)
      ? queueData
      : [];
    return data.filter(
      (item: any) =>
        item.type?.toLowerCase() === type.toLowerCase() ||
        item.queueType?.toLowerCase() === type.toLowerCase()
    );
  };

  const consultationQueue = getQueueByType("consultations");
  const agnikarmaQueue = getQueueByType("agnikarma");
  const panchakarmaQueue = getQueueByType("panchakarma");
  const shirodharaQueue = getQueueByType("shirodhara");



  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "checked-in":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "waiting":
        return <Clock className="w-4 h-4" />;
      case "in-progress":
        return <Play className="w-4 h-4" />;
      case "checked-in":
        return <UserCheck className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const QueueCard = ({
    item,
    showActions = true,
  }: {
    item: any; // Real queue item from API
    showActions?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item.patientName}</h3>
              <p className="text-sm text-gray-600">{item.doctorName}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  Appointment: {item.appointmentTime}
                </span>
                <span className="text-xs text-gray-500">
                  Checked in: {item.checkedInAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge
                className={`${getStatusColor(
                  item.status
                )} flex items-center gap-1`}
              >
                {getStatusIcon(item.status)}
                {item.status.replace("-", " ")}
              </Badge>
              {item.estimatedWait && (
                <p className="text-xs text-gray-500 mt-1">
                  Est. wait: {item.estimatedWait}
                </p>
              )}
              {item.estimatedDuration && (
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {item.estimatedDuration}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex flex-col gap-1">
                {/* Start button - for users who can update queue status */}
                {item.status === "waiting" && (
                  <QueueProtectedComponent action="update-status">
                    <Button
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() =>
                        handleUpdateQueueStatus(item.id, "IN_PROGRESS")
                      }
                      disabled={updateQueueStatusOptimistic.isPending}
                    >
                      <Play className="w-3 h-3" />
                      {updateQueueStatusOptimistic.isPending
                        ? "Starting..."
                        : "Start"}
                    </Button>
                  </QueueProtectedComponent>
                )}

                {/* In-progress actions */}
                {item.status === "in-progress" && (
                  <>
                    <QueueProtectedComponent action="update-status">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() =>
                          handleUpdateQueueStatus(item.id, "WAITING")
                        }
                        disabled={updateQueueStatusOptimistic.isPending}
                      >
                        <Pause className="w-3 h-3" />
                        Pause
                      </Button>
                    </QueueProtectedComponent>

                    <QueueProtectedComponent action="update-status">
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() =>
                          handleUpdateQueueStatus(item.id, "COMPLETED")
                        }
                        disabled={updateQueueStatusOptimistic.isPending}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </Button>
                    </QueueProtectedComponent>
                  </>
                )}

                {/* Call next patient - for users who can call next patient */}
                {item.status === "checked-in" && (
                  <QueueProtectedComponent action="call-next">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => handleCallNextPatient(activeQueue)}
                      disabled={callNextPatientOptimistic.isPending}
                    >
                      <SkipForward className="w-3 h-3" />
                      {callNextPatientOptimistic.isPending
                        ? "Calling..."
                        : "Call Next"}
                    </Button>
                  </QueueProtectedComponent>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TherapyQueueSection = ({
    title,
    items,
    icon,
  }: {
    title: string;
    items: any[]; // Real queue items from API
    icon: React.ReactNode;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item: any) => (
            <QueueCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-2">{icon}</div>
            <p className="text-gray-500">
              No patients in {title.toLowerCase()} queue
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Real-time WebSocket Status Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-gray-600">
            {queuePermissions.canManageQueue
              ? "Monitor and manage patient queues"
              : "View patient queue status"}
          </p>
        </div>
        <WebSocketStatusIndicator />
      </div>

      {/* Queue Statistics for authorized users */}
      <ProtectedComponent
        permission={Permission.MANAGE_QUEUE}
        showFallback={false}
      >
        {queueStats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total in Queue
                    </p>
                    <p className="text-2xl font-bold">
                      {(queueStats as any)?.totalInQueue || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Average Wait
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {(queueStats as any)?.averageWaitTime || 0}m
                    </p>
                  </div>
                  <Timer className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      In Progress
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {(queueStats as any)?.inProgress || 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Completed Today
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(queueStats as any)?.completedToday || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </ProtectedComponent>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Queue Management</h1>
          <p className="text-gray-600">
            {queuePermissions.canManageQueue
              ? "Monitor and manage patient queues"
              : "View patient queue status"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Live Updates
          </Badge>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Waiting</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Play className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold">18m</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Tabs */}
      <Tabs
        value={activeQueue}
        onValueChange={setActiveQueue}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="therapies">Therapies</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Consultation Queue
                <Badge variant="secondary">{consultationQueue.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {consultationQueue.map((item: any) => (
                <QueueCard key={item.id} item={item} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TherapyQueueSection
              title="Agnikarma"
              items={agnikarmaQueue}
              icon={<Flame className="w-5 h-5 text-orange-600" />}
            />
            <TherapyQueueSection
              title="Panchakarma"
              items={panchakarmaQueue}
              icon={<Droplets className="w-5 h-5 text-blue-600" />}
            />
            <TherapyQueueSection
              title="Shirodhara"
              items={shirodharaQueue}
              icon={<Leaf className="w-5 h-5 text-green-600" />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
