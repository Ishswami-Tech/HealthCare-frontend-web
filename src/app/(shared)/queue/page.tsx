"use client";

import { useMemo, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
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
import { usePauseQueue, useQueue, useQueueStats, useTransferQueueEntry } from "@/hooks/query/useQueue";
import { useDoctors } from "@/hooks/query/useDoctors";
import { useReassignAppointmentDoctor } from "@/hooks/query/useAppointments";
import { useClinicContext, useActiveLocations } from "@/hooks/query/useClinics";
import { Role } from "@/types/auth.types";
import { QueueCategory, type CanonicalQueueEntry } from "@/types/queue.types";
import { getQueueStatusLabel, normalizeQueueEntry, resolveQueueDisplayLabel } from "@/lib/queue/queue-adapter";
import { Permission } from "@/types/rbac.types";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { PageLoading, Skeleton } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import {
  useOptimisticUpdateQueueStatus,
  useOptimisticCallNextPatient,
} from "@/hooks/utils/useOptimisticQueue";
import { bulkCancelQueueEntries } from "@/lib/actions/queue.server";

import {
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  SkipForward,
  UserCheck,
  Stethoscope,
  Users,
  Timer,
  Activity,
  ArrowRightLeft,
  ChevronDown,
  Loader2,
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

const TERMINAL_QUEUE_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'NO_SHOW']);

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

function extractQueueDisplayItems(queueData: unknown): QueueDisplayItem[] {
  const qData = queueData as Record<string, unknown> | unknown[] | null | undefined;
  let raw: any[] = [];

  if (Array.isArray(qData)) {
    raw = qData;
  } else if (qData && typeof qData === "object") {
    if (Array.isArray((qData as Record<string, unknown>).data)) {
      raw = (qData as Record<string, unknown>).data as any[];
    } else if (Array.isArray((qData as Record<string, unknown>).queue)) {
      raw = (qData as Record<string, unknown>).queue as any[];
    } else if (Array.isArray((qData as Record<string, unknown>).items)) {
      raw = (qData as Record<string, unknown>).items as any[];
    } else {
      for (const key of Object.keys(qData as Record<string, unknown>)) {
        const candidate = (qData as Record<string, unknown>)[key];
        if (Array.isArray(candidate)) {
          raw = candidate as any[];
          break;
        }
      }
    }
  }

  return raw.map((item: any) => normalizeQueueDisplayItem(item));
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
        token.includes("BASTI") ||
        token === normalizeQueueToken(QueueCategory.THERAPY_PROCEDURE)
    );
  }

  // Fallback match: if section name is contained in any of the tokens
  return tokens.some((token) => 
    token === normalizedSection || 
    token.includes(normalizedSection) ||
    normalizedSection.includes(token) && token.length > 3
  );
}

export default function QueuePage() {
  const { session } = useAuth();
  const userRole = (session?.user?.role as Role) || Role.SUPER_ADMIN;
  const doctorId = session?.user?.id;
  const [activeQueue, setActiveQueue] = useState("consultations");
  const [activeTherapyLane, setActiveTherapyLane] = useState("agnikarma");

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

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []) as string;
  
  const queueFilters: {
    enabled: boolean;
    doctorId?: string;
    date: string;
  } = {
    enabled: queuePermissions.canViewQueue,
    date: todayStr,
  };
  if (queueDoctorId) {
    queueFilters.doctorId = queueDoctorId;
  }

  // State to track historical/stale entries that should be cleaned up
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // Fetch queue data with proper permissions - now strictly bound to today
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
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });

  const assignableDoctors = useMemo(() => {
    const normalize = (users: any[]) =>
      users
        .map((user) => {
          const role = String(user.role || user.doctor?.user?.role || "").toUpperCase();
          return {
            id: user.doctor?.id || user.id,
            name:
              user.name ||
              user.doctor?.user?.name ||
              `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              "Unknown Doctor",
            role,
          };
        })
        .filter((doctor) => doctor.id && (doctor.role === "DOCTOR" || doctor.role === "ASSISTANT_DOCTOR"));

    if (Array.isArray(doctorsData)) return normalize(doctorsData);
    if (Array.isArray((doctorsData as any)?.data?.doctors)) return normalize((doctorsData as any).data.doctors);
    return normalize((doctorsData as any)?.doctors || []);
  }, [doctorsData]);


  const rawQueueEntries = useMemo(() => extractQueueDisplayItems(queueData), [queueData]);

  const queueEntries = rawQueueEntries.filter(
    (item) => !TERMINAL_QUEUE_STATUSES.has(String(item.status || '').toUpperCase())
  );

  const rawQueueById = useMemo(
    () => new Map(rawQueueEntries.map((item) => [item.id, item])),
    [rawQueueEntries]
  );

  const scopedQueueEntries = useMemo(() => {
    return queueEntries.filter((item: QueueDisplayItem) => {
      // 1. Strict Date filtering: only show today's items in the live scoped lists
      if (item.scheduledDate && item.scheduledDate !== todayStr) return false;
      
      // 2. Role-based filtering
      if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
        return [item.assignedDoctorId, item.primaryDoctorId, item.queueOwnerId].some(
          (value) => value && String(value) === String(doctorId)
        );
      }

      return true;
    });
  }, [doctorId, queueEntries, userRole, todayStr]);

  // Identify stale entries (active items from past dates) present in raw data
  const staleEntries = useMemo(() => {
    return queueEntries.filter(item => {
      if (!item.scheduledDate || !todayStr) return false;
      return item.scheduledDate < todayStr && item.status !== QUEUE_STATUS.COMPLETED;
    });
  }, [queueEntries, todayStr]);

  const handleBulkCleanup = async () => {
    if (staleEntries.length === 0) return;
    
    setIsCleaningUp(true);
    try {
      const ids = staleEntries.map(e => e.id);
      await bulkCancelQueueEntries(ids);
      await refetchQueue();
      showSuccessToast(`Successfully cancelled ${ids.length} stale entries.`, { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch (err) {
      showErrorToast(err, { id: TOAST_IDS.GLOBAL.ERROR });
    } finally {
      setIsCleaningUp(false);
    }
  };



  const queueStatsSummary = useMemo(() => {
    const useApiQueueStats =
      userRole !== Role.DOCTOR && userRole !== Role.ASSISTANT_DOCTOR;
    const apiQueueStats = queueStats as any;
    const totalInQueue = scopedQueueEntries.length;
    const totalWaitMinutes = scopedQueueEntries.reduce((sum: number, item: QueueDisplayItem) => {
      const rawWait = item.estimatedWaitTime ?? item.waitTime ?? 0;
      const waitValue = typeof rawWait === 'number' ? rawWait : parseInt(String(rawWait), 10) || 0;
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
      return queueClinicId ? "Reception Queue" : "All clinics";
    }

    if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
      return "Assigned doctor queue";
    }

    if (userRole === Role.CLINIC_ADMIN || userRole === Role.RECEPTIONIST) {
      return "Reception Queue";
    }

    return "Live queue";
  }, [queueClinicId, userRole]);

  // Mutation hooks for queue actions with React 19 useOptimistic
  const updateQueueStatusOptimistic = useOptimisticUpdateQueueStatus(clinicId);
  const pauseQueueMutation = usePauseQueue();
  const transferQueueEntryMutation = useTransferQueueEntry();
  const reassignAppointmentMutation = useReassignAppointmentDoctor();

  // Transfer patient between logical queues (receptionist/clinic-admin only)
  const [transferringId, setTransferringId] = useState<string | null>(null);
  const [assigningQueueItem, setAssigningQueueItem] = useState<QueueDisplayItem | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [assignDoctorError, setAssignDoctorError] = useState<string>("");
  const canTransfer =
    userRole === Role.RECEPTIONIST ||
    userRole === Role.CLINIC_ADMIN ||
    userRole === Role.SUPER_ADMIN;
  const canAssignDoctor = canTransfer;

  const isUnassignedQueueItem = useCallback((item: QueueDisplayItem) => {
    const doctorToken = String(item.doctorName || "").trim().toLowerCase();
    const hasDoctorId = Boolean(item.assignedDoctorId || item.primaryDoctorId || item.queueOwnerId);
    return !hasDoctorId || !doctorToken || doctorToken === "unassigned";
  }, []);

  const hasReliableAppointmentReference = useCallback((item: QueueDisplayItem) => {
    const rawItem = rawQueueById.get(item.id) as Record<string, unknown> | undefined;
    const rawAppointmentId =
      (typeof rawItem?.appointmentId === "string" && rawItem.appointmentId) ||
      (typeof (rawItem?.appointment as Record<string, unknown> | undefined)?.id === "string"
        ? String((rawItem?.appointment as Record<string, unknown>).id)
        : "") ||
      (typeof (rawItem?.metadata as Record<string, unknown> | undefined)?.appointmentId === "string"
        ? String((rawItem?.metadata as Record<string, unknown>).appointmentId)
        : "");

    if (rawAppointmentId) return true;
    if (!item.appointmentId) return false;
    return item.appointmentId !== item.id;
  }, [rawQueueById]);

  const handleTransfer = useCallback(
    async (entryId: string, targetQueue: string, treatmentType: string, label: string) => {
      setTransferringId(entryId);
      try {
        await transferQueueEntryMutation.mutateAsync({ entryId, targetQueue, treatmentType });
        let transferSynced = false;
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const response = await refetchQueue();
          const currentEntries = extractQueueDisplayItems((response as { data?: unknown })?.data);
          const movedEntry = currentEntries.find((item) => item.id === entryId);
          if (movedEntry) {
            const queueMatch =
              normalizeQueueToken(movedEntry.queueCategory) === normalizeQueueToken(targetQueue) ||
              matchesQueueSection(movedEntry, treatmentType);
            if (queueMatch) {
              transferSynced = true;
              break;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        if (!transferSynced) {
          throw new Error("Transfer request was accepted but backend queue sync is still pending.");
        }

        setActiveQueue(treatmentType === "CONSULTATION" ? "consultations" : "therapies");
        if (treatmentType !== "CONSULTATION") {
          setActiveTherapyLane(treatmentType.toLowerCase());
        }
        showSuccessToast(`Moved to ${label}`, { id: TOAST_IDS.GLOBAL.SUCCESS });
      } catch (error) {
        showErrorToast(error, { id: TOAST_IDS.GLOBAL.ERROR });
      } finally {
        setTransferringId(null);
      }
    },
    [refetchQueue, transferQueueEntryMutation]
  );

  const openAssignDoctorDialog = useCallback((item: QueueDisplayItem) => {
    setAssignDoctorError("");
    setAssigningQueueItem(item);
    const defaultDoctorId = String(item.assignedDoctorId || item.primaryDoctorId || "").trim();
    setSelectedDoctorId(defaultDoctorId);
  }, []);

  const handleAssignDoctor = useCallback(async () => {
    setAssignDoctorError("");
    if (!assigningQueueItem?.appointmentId) {
      setAssignDoctorError("No linked appointment found for this queue entry.");
      return;
    }
    if (!selectedDoctorId) {
      setAssignDoctorError("Please select a doctor to assign.");
      return;
    }

    try {
      await reassignAppointmentMutation.mutateAsync({
        appointmentId: assigningQueueItem.appointmentId,
        doctorId: selectedDoctorId,
        reason: "Queue doctor assignment by reception",
      });
      let reassignmentSynced = false;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const response = await refetchQueue();
        const currentEntries = extractQueueDisplayItems((response as { data?: unknown })?.data);
        const queueEntry = currentEntries.find((item) => item.id === assigningQueueItem.id);
        if (queueEntry) {
          const backendDoctorIds = [
            queueEntry.assignedDoctorId,
            queueEntry.primaryDoctorId,
            queueEntry.queueOwnerId,
          ]
            .filter(Boolean)
            .map((value) => String(value));
          if (backendDoctorIds.includes(String(selectedDoctorId))) {
            reassignmentSynced = true;
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (!reassignmentSynced) {
        throw new Error("Reassignment request succeeded but backend queue sync is still pending.");
      }

      showSuccessToast("Doctor assigned successfully", { id: TOAST_IDS.GLOBAL.SUCCESS });
      setAssigningQueueItem(null);
      setSelectedDoctorId("");
    } catch (error) {
      setAssignDoctorError(sanitizeErrorMessage(error));
      showErrorToast(error, {
        id: TOAST_IDS.APPOINTMENT.REASSIGN,
        duration: 5000,
      });
    }
  }, [assigningQueueItem, selectedDoctorId, reassignAppointmentMutation, refetchQueue]);

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
      await pauseQueueMutation.mutateAsync({ doctorId: rowDoctorId });
      await refetchQueue();
      showSuccessToast("Queue paused", { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.GLOBAL.ERROR });
    }
  }, [pauseQueueMutation, refetchQueue]);

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

  // Catch-all: items that didn't match any bucket
  const uncategorizedQueue = useMemo(() => {
    const matchedIds = new Set([
      ...consultationQueue.map(i => i.id),
      ...agnikarmaQueue.map(i => i.id),
      ...panchakarmaQueue.map(i => i.id),
      ...shirodharaQueue.map(i => i.id),
      ...vidhakarmaQueue.map(i => i.id),
      ...nasyaQueue.map(i => i.id),
      ...bastiQueue.map(i => i.id),
    ]);
    return scopedQueueEntries.filter((item: QueueDisplayItem) => !matchedIds.has(item.id));
  }, [scopedQueueEntries, consultationQueue, agnikarmaQueue, panchakarmaQueue, shirodharaQueue, vidhakarmaQueue, nasyaQueue, bastiQueue]);

  function QueueRowActions({ item }: { item: QueueDisplayItem }) {
    const rowDoctorId = item.assignedDoctorId || item.primaryDoctorId || item.queueOwnerId || "";
    const rowCallNext = useOptimisticCallNextPatient(clinicId, rowDoctorId);
    const canStartFromRow =
      userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR;
    const normalizedStatus = String(item.status || "").toUpperCase();
    const canAssignForStatus = !TERMINAL_QUEUE_STATUSES.has(normalizedStatus);
    const canAssignForReference = hasReliableAppointmentReference(item);

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canStartFromRow && item.status === QUEUE_STATUS.WAITING && (
          <QueueProtectedComponent action="update-status">
            <Button
              size="sm"
              className="h-8"
              onClick={() => handleUpdateQueueStatus(item.id, QUEUE_STATUS.IN_PROGRESS)}
              disabled={updateQueueStatusOptimistic.isPending}
            >
              <Play className="mr-1 h-3 w-3" />
              Start
            </Button>
          </QueueProtectedComponent>
        )}

        {canStartFromRow && item.status === QUEUE_STATUS.IN_PROGRESS && (
          <>
            <QueueProtectedComponent action="update-status">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => void handlePauseQueue(rowDoctorId)}
                disabled={updateQueueStatusOptimistic.isPending}
              >
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </Button>
            </QueueProtectedComponent>
            <QueueProtectedComponent action="update-status">
              <Button
                size="sm"
                className="h-8"
                onClick={() => handleUpdateQueueStatus(item.id, QUEUE_STATUS.COMPLETED)}
                disabled={updateQueueStatusOptimistic.isPending}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Complete
              </Button>
            </QueueProtectedComponent>
          </>
        )}

        {item.status === QUEUE_STATUS.CONFIRMED && (
          <QueueProtectedComponent action="call-next">
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() =>
                rowCallNext.mutation.mutate(
                  { appointmentId: item.appointmentId },
                  {
                    onSuccess: () => {
                      refetchQueue();
                      showSuccessToast("Next patient called", { id: TOAST_IDS.GLOBAL.SUCCESS });
                    },
                    onError: (err: Error) => {
                      showErrorToast(err.message || "Failed", { id: TOAST_IDS.GLOBAL.ERROR });
                    },
                  }
                )
              }
              disabled={rowCallNext.isPending || !item.appointmentId}
            >
              <SkipForward className="mr-1 h-3 w-3" />
              {rowCallNext.isPending ? "Calling..." : "Call Next"}
            </Button>
          </QueueProtectedComponent>
        )}

        {canAssignDoctor && isUnassignedQueueItem(item) && canAssignForStatus && canAssignForReference && (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => openAssignDoctorDialog(item)}
            disabled={!item.appointmentId || reassignAppointmentMutation.isPending}
          >
            Assign Doctor
          </Button>
        )}

        {canTransfer && item.status !== QUEUE_STATUS.COMPLETED && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-border/70 text-xs hover:bg-muted"
                disabled={transferringId === item.id}
              >
                <ArrowRightLeft className="mr-1 h-3 w-3" />
                {transferringId === item.id ? "Moving..." : "Move to"}
                <ChevronDown className="ml-1 h-3 w-3" />
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
    );
  }

  const baseQueueColumns = useMemo<ColumnDef<QueueDisplayItem>[]>(
    () => [
      {
        accessorKey: "patientName",
        header: "Patient",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.patientName || "Unknown Patient"}
          </span>
        ),
      },
      {
        accessorKey: "doctorName",
        header: "Doctor",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.doctorName || "Unassigned"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={`${getStatusColor(
              row.original.status
            )} flex w-max items-center justify-center gap-1 whitespace-nowrap border px-2 py-0.5 text-[10px] font-semibold`}
          >
            {getStatusIcon(row.original.status)}
            {getQueueStatusLabel(row.original)}
          </Badge>
        ),
      },
      {
        id: "waitTime",
        header: "Wait Time",
        cell: ({ row }) => {
          const waitValue = row.original.estimatedWaitTime || row.original.waitTime;
          if (!waitValue) return <span className="text-muted-foreground">-</span>;
          return (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {waitValue}m
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <QueueRowActions item={row.original} />,
      },
    ],
    [
      canTransfer,
      canAssignDoctor,
      transferringId,
      isUnassignedQueueItem,
      handleTransfer,
      openAssignDoctorDialog,
      reassignAppointmentMutation.isPending,
      updateQueueStatusOptimistic.isPending,
      handlePauseQueue,
      refetchQueue,
      clinicId,
    ]
  );

  const laneColumns = useMemo<ColumnDef<QueueDisplayItem>[]>(
    () => [
      ...baseQueueColumns.slice(0, 2),
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {resolveQueueDisplayLabel(row.original)}
          </span>
        ),
      },
      ...baseQueueColumns.slice(2),
    ],
    [baseQueueColumns]
  );

  const therapyQueueSections = useMemo(
    () => [
      { key: "agnikarma", title: "Agnikarma", items: agnikarmaQueue },
      { key: "panchakarma", title: "Panchakarma", items: panchakarmaQueue },
      { key: "shirodhara", title: "Shirodhara", items: shirodharaQueue },
      { key: "vidhakarma", title: "Vidhakarma", items: vidhakarmaQueue },
      { key: "nasya", title: "Nasya", items: nasyaQueue },
      { key: "basti", title: "Basti", items: bastiQueue },
    ],
    [agnikarmaQueue, panchakarmaQueue, shirodharaQueue, vidhakarmaQueue, nasyaQueue, bastiQueue]
  );

  const activeTherapySection = useMemo(() => {
    return (
      therapyQueueSections.find((section) => section.key === activeTherapyLane) ??
      therapyQueueSections[0]
    );
  }, [therapyQueueSections, activeTherapyLane]);

  // Keep returns after all hooks to avoid hook-order mismatch.
  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Queue Management</h1>
            <p className="text-gray-600">Synchronizing live queue...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-[104px] w-full rounded-xl" />
          <Skeleton className="h-[104px] w-full rounded-xl" />
          <Skeleton className="h-[104px] w-full rounded-xl" />
          <Skeleton className="h-[104px] w-full rounded-xl" />
        </div>
        <div className="mt-24">
          <PageLoading text="Loading active queue flow..." />
        </div>
      </div>
    );
  }

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



  function getStatusColor(status: string) {
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
  }

  function getStatusIcon(status: string) {
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
  }

  return (
    <div className="p-6 space-y-6">
      {/* Real-time Status Indicator - clean UI for dashboard */}
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
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 text-emerald-700 rounded-full border border-emerald-200/60 shadow-sm backdrop-blur-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wide uppercase">Live Sync</span>
        </div>
      </div>

      {/* Stale Data Cleanup Banner */}
      {staleEntries.length > 0 && (userRole === Role.RECEPTIONIST || userRole === Role.CLINIC_ADMIN) && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200/50 bg-amber-50/10 backdrop-blur-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Stale Queue Entries Detected</h3>
              <p className="text-xs text-amber-400/80">
                There are {staleEntries.length} items from previous days that are still marked as active.
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleBulkCleanup}
            disabled={isCleaningUp}
            className="border-amber-500/50 bg-amber-50/10 text-amber-200 hover:bg-amber-500/20"
          >
            {isCleaningUp ? "Cleaning up..." : "Cancel All Stale Entries"}
          </Button>
        </div>
      )}

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
          {uncategorizedQueue.length > 0 && (
            <TabsTrigger value="uncategorized" className="text-red-600">
              Uncategorized ({uncategorizedQueue.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card className="border-border/60 bg-background/90 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Consultation Queue
                <Badge variant="secondary">{consultationQueue.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={laneColumns}
                data={consultationQueue}
                pageSize={10}
                emptyMessage="No patients in consultation queue."
                className="[&_table]:min-w-[980px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapies" className="space-y-6">
          <Card className="border-border/60 bg-background/90 backdrop-blur-sm shadow-sm">
            <CardHeader className="pb-2 space-y-3">
              <CardTitle className="flex items-center gap-2">
                Therapy Queues
                <Badge variant="secondary">
                  {therapyQueueSections.reduce((total, section) => total + section.items.length, 0)}
                </Badge>
              </CardTitle>
              <div className="overflow-x-auto">
                <div className="flex min-w-max items-center gap-2">
                  {therapyQueueSections.map((section) => (
                    <Button
                      key={section.key}
                      variant={activeTherapyLane === section.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTherapyLane(section.key)}
                      className="h-8"
                    >
                      {section.title}
                      <Badge variant="secondary" className="ml-2">
                        {section.items.length}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <DataTable
                columns={laneColumns}
                data={activeTherapySection?.items ?? []}
                pageSize={10}
                emptyMessage={`No patients in ${(activeTherapySection?.title || "selected").toLowerCase()} queue.`}
                className="[&_table]:min-w-[980px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {uncategorizedQueue.length > 0 && (
          <TabsContent value="uncategorized" className="space-y-4">
            <Card className="border-border/60 bg-background/90 backdrop-blur-sm shadow-sm">
              <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Uncategorized Items
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    {uncategorizedQueue.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  These items matched your clinic scope but couldn&apos;t be sorted into specific therapy/consultation lanes.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <DataTable
                  columns={laneColumns}
                  data={uncategorizedQueue}
                  pageSize={10}
                  emptyMessage="No uncategorized queue items."
                  className="[&_table]:min-w-[980px]"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={Boolean(assigningQueueItem)}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningQueueItem(null);
            setSelectedDoctorId("");
            setAssignDoctorError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Doctor</DialogTitle>
            <DialogDescription>
              Assign a doctor to this active queue appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {assigningQueueItem?.patientName || "Patient"} is currently unassigned. Select a doctor.
            </p>
            {assignDoctorError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {assignDoctorError}
              </div>
            ) : null}
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {assignableDoctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssigningQueueItem(null);
                setSelectedDoctorId("");
                setAssignDoctorError("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleAssignDoctor()} disabled={reassignAppointmentMutation.isPending || !selectedDoctorId}>
              {reassignAppointmentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Doctor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



