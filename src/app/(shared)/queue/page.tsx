"use client";

import { useMemo, useState, useCallback } from "react";
import { pauseQueue, transferQueueEntry } from "@/lib/actions/queue.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueuePermissions } from "@/hooks/utils/useRBAC";
import { QueueProtectedComponent, ProtectedComponent } from "@/components/rbac";
import { useQueue, useQueueStats } from "@/hooks/query/useQueue";
import { useClinicContext, useActiveLocations } from "@/hooks/query/useClinics";
import { Role } from "@/types/auth.types";
import { QueueCategory, type CanonicalQueueEntry } from "@/types/queue.types";
import { getQueueStatusLabel, normalizeQueueEntry, resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";
import { Permission } from "@/types/rbac.types";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  useOptimisticUpdateQueueStatus,
  useOptimisticCallNextPatient,
} from "@/hooks/utils/useOptimisticQueue";

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
  ArrowRightLeft,
  ChevronDown,
  Syringe,
  Wind,
} from "lucide-react";

// ─── Logical queue options the receptionist can move patients between ─────────
const QUEUE_TRANSFER_OPTIONS = [
  { label: "Consultation",  value: "DOCTOR_CONSULTATION",  treatmentType: "CONSULTATION",  icon: "stethoscope" },
  { label: "Agnikarma",     value: "THERAPY_PROCEDURE",    treatmentType: "AGNIKARMA",     icon: "flame" },
  { label: "Panchakarma",   value: "THERAPY_PROCEDURE",    treatmentType: "PANCHAKARMA",   icon: "droplets" },
  { label: "Shirodhara",    value: "THERAPY_PROCEDURE",    treatmentType: "SHIRODHARA",    icon: "leaf" },
  { label: "Vidhakarma",    value: "THERAPY_PROCEDURE",    treatmentType: "VIDHAKARMA",    icon: "syringe" },
  { label: "Nasya",         value: "THERAPY_PROCEDURE",    treatmentType: "NASYA",         icon: "wind" },
  { label: "Basti",         value: "THERAPY_PROCEDURE",    treatmentType: "BASTI",         icon: "droplets" },
  { label: "Medicine Desk", value: "MEDICINE_DESK",        treatmentType: "MEDICINE_DESK", icon: "stethoscope" },
] as const;

// Queue status constants - must match backend enum values
const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

type QueueDisplayItem = CanonicalQueueEntry & {
  id: string;
  type?: string;
  queueType?: string;
  queueLane?: string;
  appointmentTime?: string;
  checkedInAt?: string;
  confirmedAt?: string;
  updatedAt?: string;
  estimatedWait?: string | number;
  estimatedDuration?: string | number;
  tokenNumber?: string | number;
  serviceType?: string;
  waitTime?: string | number;
};

function normalizeQueueToken(value?: string | null): string {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function normalizeQueueDisplayItem(raw: any): QueueDisplayItem {
  const entry = normalizeQueueEntry(raw);

  return {
    ...entry,
    id: entry.entryId || raw?.id || "",
    type: raw?.type,
    queueType: raw?.queueType,
    queueLane: raw?.queueLane,
    appointmentTime: raw?.appointmentTime || raw?.time || raw?.startedAt || "",
    checkedInAt: raw?.checkedInAt,
    confirmedAt: raw?.confirmedAt,
    updatedAt: raw?.updatedAt,
    estimatedWait: raw?.estimatedWait,
    estimatedDuration: raw?.estimatedDuration,
    tokenNumber: raw?.tokenNumber,
    serviceType: raw?.serviceType,
    waitTime: raw?.waitTime,
  };
}

function matchesQueueSection(item: QueueDisplayItem, section: string): boolean {
  const normalizedSection = normalizeQueueToken(section);
  const tokens = [
    item.queueCategory,
    item.queueType,
    item.queueLane,
    item.serviceBucket,
    item.treatmentType,
    resolveQueueDisplayLabel(item),
  ].map(normalizeQueueToken);

  if (normalizedSection === "CONSULTATION" || normalizedSection === "CONSULTATIONS") {
    return tokens.some((token) => token.includes("CONSULTATION") || token === normalizeQueueToken(QueueCategory.DOCTOR_CONSULTATION));
  }

  if (normalizedSection === "THERAPY" || normalizedSection === "THERAPIES") {
    return tokens.some(
      (token) =>
        token.includes("THERAPY") ||
        token.includes("AGNIKARMA") ||
        token.includes("PANCHAKARMA") ||
        token.includes("SHIRODHARA") ||
        token.includes("VIDHAKARMA") ||
        token.includes("NASYA") ||
        token.includes("BASTI")
    );
  }

  return tokens.some((token) => token === normalizedSection || token.includes(normalizedSection));
}

export default function QueuePage() {
  const { session } = useAuth();
  const userRole = (session?.user?.role as Role) || Role.SUPER_ADMIN;
  const doctorId = session?.user?.id;
  const [activeQueue, setActiveQueue] = useState("consultations");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // RBAC permissions
  const queuePermissions = useQueuePermissions();

  // Clinic context
  const { clinicId } = useClinicContext();
  const { data: locations = [] } = useActiveLocations(clinicId || "");
  const locationId = locations[0]?.id || "";
  const queueClinicId = clinicId || undefined;
  const queueDoctorId =
    userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR ? doctorId : undefined;

  const queueFilters: {
    enabled: boolean;
    doctorId?: string;
  } = {
    enabled: queuePermissions.canViewQueue,
  };
  if (queueDoctorId) {
    queueFilters.doctorId = queueDoctorId;
  }

  // Fetch queue data with proper permissions
  const {
    data: queueData,
    isPending: isLoading,
    error,
    refetch: refetchQueue,
  } = useQueue(
    queueClinicId,
    queueFilters
  );

  const { data: queueStats } = useQueueStats(locationId);


  const queueEntries = useMemo(() => {
    const raw: any[] = Array.isArray(queueData)
      ? queueData
      : Array.isArray((queueData as any)?.data)
      ? (queueData as any).data
      : Array.isArray((queueData as any)?.data?.queue)
      ? (queueData as any).data.queue
      : Array.isArray((queueData as any)?.queue)
      ? (queueData as any).queue
      : [];

    return raw.map((item: any) => normalizeQueueDisplayItem(item));
  }, [queueData]);

  const scopedQueueEntries = useMemo(() => {
    return queueEntries.filter((item: QueueDisplayItem) => {
      if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
        return [item.assignedDoctorId, item.primaryDoctorId, item.queueOwnerId].some(
          (value) => value && String(value) === String(doctorId)
        );
      }

      if (userRole === Role.CLINIC_ADMIN || userRole === Role.RECEPTIONIST) {
        return !queueClinicId || !item.clinicId || String(item.clinicId) === String(queueClinicId);
      }

      return true;
    });
  }, [clinicId, doctorId, queueClinicId, queueEntries, userRole]);

  const queueStatsSummary = useMemo(() => {
    const useApiQueueStats =
      userRole !== Role.DOCTOR && userRole !== Role.ASSISTANT_DOCTOR;
    const apiQueueStats = queueStats as any;
    const totalInQueue = scopedQueueEntries.length;
    const totalWaitMinutes = scopedQueueEntries.reduce((sum: number, item: QueueDisplayItem) => {
      const waitValue =
        typeof item.estimatedWaitTime === "number"
          ? item.estimatedWaitTime
          : typeof item.waitTime === "number"
          ? item.waitTime
          : 0;
      return sum + waitValue;
    }, 0);

    const averageWaitTime =
      (useApiQueueStats && typeof apiQueueStats?.averageWaitTime === "number"
        ? apiQueueStats.averageWaitTime
        : undefined) ??
      (totalInQueue > 0 ? Math.round(totalWaitMinutes / totalInQueue) : 0);

    return {
      totalInQueue:
        useApiQueueStats && typeof apiQueueStats?.totalInQueue === "number"
          ? apiQueueStats.totalInQueue
          : totalInQueue,
      averageWaitTime,
      inProgress:
        useApiQueueStats && typeof apiQueueStats?.inProgress === "number"
          ? apiQueueStats.inProgress
          : scopedQueueEntries.filter((item: QueueDisplayItem) => item.status === QUEUE_STATUS.IN_PROGRESS).length,
      completedToday:
        useApiQueueStats && typeof apiQueueStats?.completedToday === "number"
          ? apiQueueStats.completedToday
          : scopedQueueEntries.filter((item: QueueDisplayItem) => item.status === QUEUE_STATUS.COMPLETED).length,
    };
  }, [queueStats, scopedQueueEntries, userRole]);

  const queueScopeLabel = useMemo(() => {
    if (userRole === Role.SUPER_ADMIN) {
      return queueClinicId ? "Clinic queue" : "All clinics";
    }

    if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
      return "Assigned doctor queue";
    }

    if (userRole === Role.CLINIC_ADMIN || userRole === Role.RECEPTIONIST) {
      return "Clinic queue";
    }

    return "Live queue";
  }, [queueClinicId, userRole]);

  // Mutation hooks for queue actions with React 19 useOptimistic
  const updateQueueStatusOptimistic = useOptimisticUpdateQueueStatus(clinicId);

  // Transfer patient between logical queues (receptionist/clinic-admin only)
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const canTransfer =
    userRole === Role.RECEPTIONIST ||
    userRole === Role.CLINIC_ADMIN ||
    userRole === Role.SUPER_ADMIN;

  const handleTransfer = useCallback(
    async (entryId: string, targetQueue: string, treatmentType: string, label: string) => {
      setTransferringId(entryId);
      try {
        await transferQueueEntry(entryId, targetQueue, treatmentType);
        await refetchQueue();
        showSuccessToast(`Moved to ${label}`, { id: TOAST_IDS.GLOBAL.SUCCESS });
      } catch {
        showErrorToast(`Failed to move patient`, { id: TOAST_IDS.GLOBAL.ERROR });
      } finally {
        setTransferringId(null);
      }
    },
    [refetchQueue]
  );

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

  // Pause uses the dedicated backend endpoint, not a generic status update
  const handlePauseQueue = useCallback(async (rowDoctorId: string) => {
    try {
      await pauseQueue(rowDoctorId);
      refetchQueue();
      showSuccessToast("Queue paused", { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch {
      showErrorToast("Failed to pause queue", { id: TOAST_IDS.GLOBAL.ERROR });
    }
  }, [refetchQueue]);

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

  // Real-time queue data from API - filter by queue section
  const getQueueByType = (type: string) => {
    return scopedQueueEntries.filter((item: QueueDisplayItem) => matchesQueueSection(item, type));
  };

  const consultationQueue = getQueueByType("consultation");
  const agnikarmaQueue = getQueueByType("agnikarma");
  const panchakarmaQueue = getQueueByType("panchakarma");
  const shirodharaQueue = getQueueByType("shirodhara");
  const vidhakarmaQueue = getQueueByType("vidhakarma");
  const nasyaQueue = getQueueByType("nasya");
  const bastiQueue = getQueueByType("basti");



  const getStatusColor = (status: string) => {
    switch (status) {
      case QUEUE_STATUS.WAITING:
        return "bg-yellow-100 text-yellow-800";
      case QUEUE_STATUS.IN_PROGRESS:
        return "bg-blue-100 text-blue-800";
      case QUEUE_STATUS.CONFIRMED:
        return "bg-green-100 text-green-800";
      case QUEUE_STATUS.COMPLETED:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case QUEUE_STATUS.WAITING:
        return <Clock className="w-4 h-4" />;
      case QUEUE_STATUS.IN_PROGRESS:
        return <Play className="w-4 h-4" />;
      case QUEUE_STATUS.CONFIRMED:
        return <UserCheck className="w-4 h-4" />;
      case QUEUE_STATUS.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const QueueCard = ({
    item,
    showActions = true,
  }: {
    item: QueueDisplayItem;
    showActions?: boolean;
  }) => {
    // Each card resolves its own doctorId so actions are properly row-scoped
    const rowDoctorId = item.assignedDoctorId || item.primaryDoctorId || item.queueOwnerId || "";
    // Note: useOptimisticCallNextPatient already handles the mutation lifecycle
    const rowCallNext = useOptimisticCallNextPatient(clinicId, rowDoctorId);
    return (
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
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {resolveQueueDisplayLabel(item)}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  Appointment: {item.appointmentTime || item.checkedInAt || item.confirmedAt || item.updatedAt || "Now"}
                </span>
                <span className="text-xs text-gray-500">
                  Confirmed: {item.checkedInAt || item.confirmedAt || item.updatedAt}
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
                {getQueueStatusLabel(item)}
              </Badge>
              {item.estimatedWaitTime || item.waitTime ? (
                <p className="text-xs text-gray-500 mt-1">
                  Est. wait: {item.estimatedWaitTime || item.waitTime}
                </p>
              ) : null}
              {item.estimatedDuration && (
                <p className="text-xs text-gray-500 mt-1">
                  Duration: {item.estimatedDuration}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex flex-col gap-1">
                {/* Start button - for users who can update queue status */}
                {item.status === QUEUE_STATUS.WAITING && (
                  <QueueProtectedComponent action="update-status">
                    <Button
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() =>
                        handleUpdateQueueStatus(item.id, QUEUE_STATUS.IN_PROGRESS)
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
                {item.status === QUEUE_STATUS.IN_PROGRESS && (
                  <>
                    {/* Pause uses dedicated backend endpoint with row's doctorId */}
                    <QueueProtectedComponent action="update-status">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => void handlePauseQueue(rowDoctorId)}
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
                          handleUpdateQueueStatus(item.id, QUEUE_STATUS.COMPLETED)
                        }
                        disabled={updateQueueStatusOptimistic.isPending}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </Button>
                    </QueueProtectedComponent>
                  </>
                )}

                {/* Call next patient — row-scoped to item's doctorId and appointmentId */}
                {item.status === QUEUE_STATUS.CONFIRMED && (
                  <QueueProtectedComponent action="call-next">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => rowCallNext.mutation.mutate({
                        appointmentId: item.appointmentId
                      }, {
                        onSuccess: () => {
                          refetchQueue();
                          showSuccessToast("Next patient called", { id: TOAST_IDS.GLOBAL.SUCCESS });
                        },
                        onError: (err: Error) => {
                          showErrorToast(err.message || "Failed", { id: TOAST_IDS.GLOBAL.ERROR });
                        },
                      })}
                      disabled={rowCallNext.isPending}
                    >
                      <SkipForward className="w-3 h-3" />
                      {rowCallNext.isPending ? "Calling..." : "Call Next"}
                    </Button>
                  </QueueProtectedComponent>
                )}

                {/* Move to Queue — receptionist/clinic-admin only */}
                {canTransfer && item.status !== QUEUE_STATUS.COMPLETED && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1"
                        disabled={transferringId === item.id}
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        {transferringId === item.id ? "Moving..." : "Move to"}
                        <ChevronDown className="w-3 h-3 ml-0.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Transfer to queue
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {QUEUE_TRANSFER_OPTIONS.filter(
                        (opt) => opt.treatmentType !== (item.treatmentType?.toUpperCase() ?? "")
                      ).map((opt) => (
                        <DropdownMenuItem
                          key={opt.treatmentType}
                          onSelect={() =>
                            void handleTransfer(item.id, opt.value, opt.treatmentType, opt.label)
                          }
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );};

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
              : "View patient queue status"}{" "}
            • {queueScopeLabel}
          </p>
        </div>
        <WebSocketStatusIndicator />
      </div>

      {/* Queue Statistics for authorized users */}
      <ProtectedComponent
        permission={Permission.MANAGE_QUEUE}
        showFallback={false}
      >
        {queueStatsSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total in Queue
                    </p>
                    <p className="text-2xl font-bold">
                      {queueStatsSummary.totalInQueue}
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
                      {queueStatsSummary.averageWaitTime}m
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
                      {queueStatsSummary.inProgress}
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
                      {queueStatsSummary.completedToday}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </ProtectedComponent>

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
            <TherapyQueueSection
              title="Vidhakarma"
              items={vidhakarmaQueue}
              icon={<Syringe className="w-5 h-5 text-purple-600" />}
            />
            <TherapyQueueSection
              title="Nasya"
              items={nasyaQueue}
              icon={<Wind className="w-5 h-5 text-cyan-600" />}
            />
            <TherapyQueueSection
              title="Basti"
              items={bastiQueue}
              icon={<Droplets className="w-5 h-5 text-teal-600" />}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
