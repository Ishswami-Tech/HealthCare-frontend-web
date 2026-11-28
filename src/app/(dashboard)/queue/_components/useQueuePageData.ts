"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import {
  useMarkAppointmentNoShow,
  useStartAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
import { useInPersonDesk } from "@/hooks/query/useInPerson";
import { useCurrentDoctorEntityId } from "@/hooks/query/useDoctors";
import {
  useCallNextPatient,
  usePauseQueue,
  useQueue,
  useQueueFilters,
  useSetQueuePriority,
  useTransferQueueEntry,
} from "@/hooks/query/useQueue";
import { useRealTimeQueueStatus, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useQueueWebSocketIntegration } from "@/hooks/realtime/useWebSocketIntegration";
import { useOptimisticUpdateQueueStatus } from "@/hooks/utils/useOptimisticQueue";
import { useQueuePermissions, useRBAC } from "@/hooks/utils/useRBAC";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useOnlineStatus } from "@/hooks/utils/useOnlineStatus";
import { useUndoableAction } from "@/hooks/utils/useUndoableAction";
import { bulkCancelQueueEntries } from "@/lib/actions/queue.server";
import { getQueuePatientDisplayName, hasQueuePatientIdentity } from "@/lib/queue/queue-adapter";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import type { QueueFilterGroup, QueueFilterOption } from "@/types/api.types";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import {
  CONSULTATION_QUEUE_FILTERS,
  CONSULTATION_QUEUE_FILTER_KEYS,
  buildQueueLanes,
  dedupeQueueFilterOptions,
  QUEUE_STATUS,
  TERMINAL_QUEUE_STATUSES,
  extractRawQueueItems,
  getQueueWaitMinutes,
  getTreatmentFilterTokens,
  hasReliableAppointmentReference,
  initialQueuePageState,
  isVideoQueueEntry,
  matchesQueueSection,
  normalizeQueueDisplayItem,
  normalizeQueueToken,
  pollQueueSync,
  queuePageReducer,
  type QueueDisplayItem,
  type QueuePrimaryAction,
  type QueueSection,
  type QueueStatsSummary,
  type QueueTabKey,
} from "./queue.logic";
import {
  buildQueueOverview,
  isCheckedInQueueEntry,
  queueCapabilities,
  type QueuePriority,
} from "./queue-roles.logic";

/** Roles the backend allows on `PATCH /queue/:entryId/transfer`. Doctors are not among them. */
const QUEUE_TRANSFER_ROLES: ReadonlySet<Role> = new Set([
  Role.NURSE,
  Role.RECEPTIONIST,
  Role.CLINIC_ADMIN,
  Role.SUPER_ADMIN,
  Role.CLINIC_LOCATION_HEAD,
]);

/**
 * Data container for the shared `/queue` screen (doctor, receptionist, clinic admin, nurse, ...).
 * Every fetch, mutation and role rule lives here; the views only get props.
 */
export function useQueuePageData() {
  const { session } = useAuth();
  // The role as the session has it: the button gates below use this one, never a fallback.
  const sessionRole = session?.user?.role as Role | undefined;
  const userRole = sessionRole || Role.SUPER_ADMIN;
  const doctorId = session?.user?.id;
  const capabilities = useMemo(() => queueCapabilities(sessionRole), [sessionRole]);
  // Doctor and assistant see the clinic queue; only the doctor calls, starts and completes a visit.
  const isClinicalRole = capabilities.variant === "doctor" || capabilities.variant === "assistant";
  const isDoctorRole = capabilities.canRunVisit;
  const isOnline = useOnlineStatus();
  const { tab: activeQueue, setTab: setActiveQueue } = useHashTab({
    tabs: ["consultations", "therapies"] as const,
    defaultValue: "consultations",
  });
  const [
    {
      activeTreatmentFilter,
      activeConsultationLane,
      activeTherapyLane,
      isCleaningUp,
      transferringQueueItem,
      transferringId,
      startingId,
    },
    dispatch,
  ] = useReducer(queuePageReducer, initialQueuePageState);

  const setActiveTreatmentFilter = useCallback(
    (value: string) => dispatch({ type: "setActiveTreatmentFilter", value }),
    [],
  );
  const setActiveConsultationLane = useCallback(
    (value: string) => dispatch({ type: "setActiveConsultationLane", value }),
    [],
  );
  const setActiveTherapyLane = useCallback((value: string) => dispatch({ type: "setActiveTherapyLane", value }), []);
  const setTransferringQueueItem = useCallback(
    (value: QueueDisplayItem | null) => dispatch({ type: "setTransferringQueueItem", value }),
    [],
  );

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();
  const { isConnected: isLiveSyncConnected } = useWebSocketStatus();

  // RBAC permissions
  const rbac = useRBAC();
  const queuePermissions = useQueuePermissions();
  const canUpdateAppointments = rbac.hasPermission(Permission.UPDATE_APPOINTMENTS);
  const { data: queueFilterCatalogData } = useQueueFilters({ enabled: queuePermissions.canViewQueue });
  const queueFilterCatalog = useMemo<QueueFilterGroup[]>(
    () => (Array.isArray(queueFilterCatalogData) ? (queueFilterCatalogData as QueueFilterGroup[]) : []),
    [queueFilterCatalogData],
  );

  // Clinic context
  const { clinicId } = useClinicContext();
  // Every location (clinic admin overview only); never used to guess the viewer's location.
  const { data: locations = [] } = useActiveLocations(clinicId || "", { enabled: capabilities.showLocationOverview });
  // Reception works one location, given by the server (`GET /in-person/desk` answers for the
  // receptionist's allotted location). Other roles see the clinic queue the server scopes for them.
  const isReception = sessionRole === Role.RECEPTIONIST;
  const desk = useInPersonDesk({ date: formatISODateInIST(new Date()) }, isReception && Boolean(clinicId));
  const locationId = isReception ? desk.data?.locationId || "" : "";
  // A receptionist with no allotted location gets 403 from the desk: show that instead of spinning.
  const deskError = isReception && desk.error ? desk.error : null;
  const queueClinicId = clinicId || undefined;
  const { subscribeToQueue: subscribeClinicQueue, unsubscribeFromQueue: unsubscribeClinicQueue } =
    useQueueWebSocketIntegration("healthcare-queue");

  // Fetch queue data with proper permissions - strictly bound to today
  const {
    data: queueData,
    isPending: isQueuePending,
    error: queueError,
    refetch: refetchQueue,
  } = useQueue(queueClinicId, {
    ...(locationId ? { locationId } : {}),
    // Reception waits for its server-given location instead of loading the whole clinic.
    enabled: queuePermissions.canViewQueue && (!isReception || Boolean(locationId)),
  });
  const error = queueError ?? deskError;
  const isLoading = isQueuePending && !deskError;

  const { data: queueStats } = useRealTimeQueueStatus(undefined, locationId || undefined);
  // A queue entry may carry the doctor's user id or the Doctor record id; a doctor's own rows match either.
  const { doctorId: doctorEntityId } = useCurrentDoctorEntityId(isDoctorRole ? clinicId || "" : "");

  useEffect(() => {
    if (!clinicId) return;

    subscribeClinicQueue({
      clinicId,
      ...(locationId ? { locationId } : {}),
    });

    return () => {
      unsubscribeClinicQueue();
    };
  }, [clinicId, locationId, subscribeClinicQueue, unsubscribeClinicQueue]);

  const { rawQueueEntries, rawQueueById } = useMemo(() => {
    const index: Record<string, unknown> = {};
    const entries = extractRawQueueItems(queueData).map((raw) => {
      const item = normalizeQueueDisplayItem(raw);
      index[item.id] = raw;
      return item;
    });
    return { rawQueueEntries: entries, rawQueueById: index };
  }, [queueData]);

  const queueEntries = useMemo(
    () =>
      rawQueueEntries.filter(
        (item) =>
          hasQueuePatientIdentity(item) &&
          !TERMINAL_QUEUE_STATUSES.has(String(item.status || "").toUpperCase()) &&
          // V2: checked-in, in-clinic patients only (no booked-not-arrived rows, no video visits).
          isCheckedInQueueEntry(item),
      ),
    [rawQueueEntries],
  );

  const treatmentQueueFilters = useMemo<QueueFilterOption[]>(() => {
    const treatmentGroup = queueFilterCatalog.find((group) => normalizeQueueToken(group.key) === "TREATMENTS");
    return treatmentGroup?.filters ?? [];
  }, [queueFilterCatalog]);

  const treatmentTypeBarFilters = useMemo<QueueFilterOption[]>(() => {
    const options = treatmentQueueFilters.filter((option) => normalizeQueueToken(option.value));
    return [
      {
        value: "ALL",
        label: "All types",
        description: "Show every queue treatment type.",
      },
      ...dedupeQueueFilterOptions(options),
    ];
  }, [treatmentQueueFilters]);

  const queueTransferOptions = treatmentQueueFilters;
  const procedureQueueFilters = useMemo<QueueFilterOption[]>(
    () => [
      ...treatmentQueueFilters.filter(
        (filter) => !CONSULTATION_QUEUE_FILTER_KEYS.has(normalizeQueueToken(filter.value)),
      ),
      {
        value: "UNCATEGORIZED",
        label: "Uncategorized",
        description: "Queue entries without a treatment type or service label.",
      },
    ],
    [treatmentQueueFilters],
  );
  const consultationQueueFilters = useMemo<QueueFilterOption[]>(
    () =>
      CONSULTATION_QUEUE_FILTERS.map((filter) => ({
        value: filter.value,
        label: filter.label,
        description: filter.label,
      })),
    [],
  );

  const resolvedActiveTreatmentFilter = useMemo(() => {
    if (
      treatmentTypeBarFilters.length > 0 &&
      !treatmentTypeBarFilters.some((option) => normalizeQueueToken(option.value) === activeTreatmentFilter)
    ) {
      return "ALL";
    }

    return activeTreatmentFilter;
  }, [activeTreatmentFilter, treatmentTypeBarFilters]);

  const scopedQueueEntries = useMemo(() => {
    if (resolvedActiveTreatmentFilter === "ALL") return queueEntries;
    return queueEntries.filter((item) => getTreatmentFilterTokens(item).includes(resolvedActiveTreatmentFilter));
  }, [queueEntries, resolvedActiveTreatmentFilter]);

  const treatmentFilterOptions = useMemo(
    () =>
      treatmentTypeBarFilters.map((option) => {
        const normalizedFilter = normalizeQueueToken(option.value);
        return {
          value: normalizedFilter,
          label: option.label,
          count:
            normalizedFilter === "ALL"
              ? queueEntries.length
              : queueEntries.filter((item) => getTreatmentFilterTokens(item).includes(normalizedFilter)).length,
        };
      }),
    [queueEntries, treatmentTypeBarFilters],
  );

  // Identify stale entries (active items from past dates) present in raw data
  const staleEntries = useMemo(() => {
    const todayStr = formatISODateInIST(new Date());
    return queueEntries.filter((item) => {
      if (!item.scheduledDate) return false;
      return item.scheduledDate < todayStr && item.status !== QUEUE_STATUS.COMPLETED;
    });
  }, [queueEntries]);
  // Only the front desk and the clinic admin clean up yesterday's entries.
  const canCleanUpStaleEntries = userRole === Role.RECEPTIONIST || userRole === Role.CLINIC_ADMIN;

  const handleBulkCleanup = useCallback(async () => {
    if (staleEntries.length === 0) return;

    dispatch({ type: "setIsCleaningUp", value: true });
    try {
      const ids = staleEntries.map((entry) => entry.id);
      // `{ success, count }`: `count` is how many entries the server really removed.
      const result = await bulkCancelQueueEntries(ids);
      await refetchQueue();
      const cancelled = result.success ? (result.count ?? 0) : 0;
      if (!result.success || cancelled === 0) {
        showErrorToast((!result.success && result.error) || "The old entries could not be cancelled.", {
          id: TOAST_IDS.GLOBAL.ERROR,
        });
      } else if (cancelled < ids.length) {
        showErrorToast(`Cancelled ${cancelled} of ${ids.length} old entries. The rest could not be cancelled.`, {
          id: TOAST_IDS.GLOBAL.ERROR,
        });
      } else {
        showSuccessToast(`Cancelled ${cancelled} old ${cancelled === 1 ? "entry" : "entries"}.`, {
          id: TOAST_IDS.GLOBAL.SUCCESS,
        });
      }
    } catch (err) {
      showErrorToast(err, { id: TOAST_IDS.GLOBAL.ERROR });
    } finally {
      dispatch({ type: "setIsCleaningUp", value: false });
    }
  }, [refetchQueue, staleEntries]);

  const queueStatsSummary = useMemo<QueueStatsSummary>(() => {
    const useApiQueueStats = resolvedActiveTreatmentFilter === "ALL" && !isClinicalRole;
    const apiQueueStats = (queueStats ?? {}) as Partial<Record<keyof QueueStatsSummary, unknown>>;
    const totalInQueue = scopedQueueEntries.length;
    const totalWaitMinutes = scopedQueueEntries.reduce((sum, item) => sum + getQueueWaitMinutes(item), 0);
    const inProgressCount = scopedQueueEntries.filter((item) => item.status === QUEUE_STATUS.IN_PROGRESS).length;
    const completedTodayCount = scopedQueueEntries.filter((item) => item.status === QUEUE_STATUS.COMPLETED).length;
    const fromApi = (key: keyof QueueStatsSummary, fallback: number) => {
      const value = apiQueueStats[key];
      return useApiQueueStats && typeof value === "number" ? value : fallback;
    };

    return {
      totalInQueue: fromApi("totalInQueue", totalInQueue),
      averageWaitTime: fromApi(
        "averageWaitTime",
        totalInQueue > 0 ? Math.round(totalWaitMinutes / totalInQueue) : 0,
      ),
      inProgress: fromApi("inProgress", inProgressCount),
      completedToday: fromApi("completedToday", completedTodayCount),
    };
  }, [isClinicalRole, queueStats, resolvedActiveTreatmentFilter, scopedQueueEntries]);

  const queueScopeLabel = useMemo(() => {
    if (userRole === Role.SUPER_ADMIN) {
      return queueClinicId ? "Reception Queue" : "All clinics";
    }

    if (isClinicalRole) {
      return "Clinic Queue";
    }

    if (userRole === Role.CLINIC_ADMIN) {
      return "Clinic Operations Queue";
    }

    if (userRole === Role.RECEPTIONIST) {
      return "Reception Queue";
    }

    return "Live queue";
  }, [isClinicalRole, queueClinicId, userRole]);

  // Mutation hooks for queue actions
  const updateQueueStatusOptimistic = useOptimisticUpdateQueueStatus(clinicId);
  const pauseQueueMutation = usePauseQueue();
  const transferQueueEntryMutation = useTransferQueueEntry();
  const startAppointmentMutation = useStartAppointment();

  const handleTransfer = useCallback(
    async (entryId: string, targetQueue: string, treatmentType: string, label: string) => {
      dispatch({ type: "setTransferringId", value: entryId });
      try {
        try {
          await transferQueueEntryMutation.mutateAsync({ entryId, targetQueue, treatmentType });
        } catch {
          // The mutation hook has already shown why the move failed.
          return;
        }

        // The server accepted the move. Wait for the list to show it; a slow list is not a failure.
        await pollQueueSync(refetchQueue, 8, 400, (entries) =>
          entries.some((item) => {
            if (item.id !== entryId) return false;

            return (
              normalizeQueueToken(item.queueCategory) === normalizeQueueToken(targetQueue) ||
              matchesQueueSection(item, treatmentType)
            );
          }),
        ).catch(() => false);

        // Follow the patient to the lane they were moved to.
        const targetLane = normalizeQueueToken(treatmentType);
        if (treatmentType === "CONSULTATION" || CONSULTATION_QUEUE_FILTER_KEYS.has(targetLane)) {
          setActiveQueue("consultations");
          if (CONSULTATION_QUEUE_FILTER_KEYS.has(targetLane)) {
            setActiveConsultationLane(targetLane);
          }
        } else {
          setActiveQueue("therapies");
          setActiveTherapyLane(targetLane);
        }
        // Same toast id as the mutation hook, so this replaces its "moved" message instead of adding one.
        showSuccessToast(`Moved to ${label}`, { id: TOAST_IDS.QUEUE.UPDATE });
      } finally {
        dispatch({ type: "setTransferringId", value: null });
      }
    },
    [refetchQueue, setActiveConsultationLane, setActiveQueue, setActiveTherapyLane, transferQueueEntryMutation],
  );

  // Status updates and pause keep their existing wiring; no control on this screen calls them yet.
  // The status action answers `{ success, data }` or `{ success: false, error }`; the optimistic
  // hook turns a failure into a thrown error (and rolls the list back), so the toast follows it.
  const { mutateAsync: updateQueueStatus } = updateQueueStatusOptimistic.mutation;
  const handleUpdateQueueStatus = useCallback(
    async (patientId: string, status: string) => {
      try {
        await updateQueueStatus({ patientId, status });
        showSuccessToast("Queue status updated", { id: TOAST_IDS.QUEUE.UPDATE });
        void refetchQueue();
      } catch (statusError) {
        showErrorToast(statusError, { id: TOAST_IDS.QUEUE.UPDATE });
      }
    },
    [refetchQueue, updateQueueStatus],
  );

  // Pause uses the dedicated backend endpoint, not a generic status update
  const handlePauseQueue = useCallback(
    async (rowDoctorId: string) => {
      try {
        await pauseQueueMutation.mutateAsync({ doctorId: rowDoctorId });
        await refetchQueue();
      } catch {
        // The mutation hook shows the result either way ("Queue paused successfully", or the reason).
      }
    },
    [pauseQueueMutation, refetchQueue],
  );

  // A doctor starts their own next in-clinic patient from the row (same mutation as the dashboard).
  const handleStartConsultation = useCallback(
    async (item: QueueDisplayItem) => {
      if (!item.appointmentId) return;

      dispatch({ type: "setStartingId", value: item.id });
      try {
        const rowDoctorId = item.assignedDoctorId || item.primaryDoctorId;
        await startAppointmentMutation.mutateAsync({
          appointmentId: item.appointmentId,
          ...(rowDoctorId ? { doctorId: rowDoctorId } : {}),
        });
        await refetchQueue();
      } catch {
        // The mutation hook has already shown the reason.
      } finally {
        dispatch({ type: "setStartingId", value: null });
      }
    },
    [refetchQueue, startAppointmentMutation],
  );

  // The doctor calls the patient in (POST /queue/call-next, doctor only on the API).
  const callNextMutation = useCallNextPatient();
  const [callingId, setCallingId] = useState<string | null>(null);
  const handleCallPatient = useCallback(
    async (item: QueueDisplayItem) => {
      const rowDoctorId = item.assignedDoctorId || item.primaryDoctorId || doctorEntityId || doctorId;
      if (!item.appointmentId || !rowDoctorId) return;
      setCallingId(item.id);
      try {
        await callNextMutation.mutateAsync({ doctorId: String(rowDoctorId), appointmentId: item.appointmentId });
        await refetchQueue();
      } catch {
        // The mutation hook has already shown the reason (for example 409: not checked in).
      } finally {
        setCallingId(null);
      }
    },
    [callNextMutation, doctorEntityId, doctorId, refetchQueue],
  );

  // Set priority (front desk, clinic admin): audited and applied to the live queue by the API.
  const priorityMutation = useSetQueuePriority();
  const [priorityItem, setPriorityItem] = useState<QueueDisplayItem | null>(null);
  const [priorityError, setPriorityError] = useState<string | null>(null);
  const openPriorityDialog = useCallback((item: QueueDisplayItem) => {
    setPriorityError(null);
    setPriorityItem(item);
  }, []);
  const handleSetPriority = useCallback(
    async (item: QueueDisplayItem, priority: QueuePriority, reason: string) => {
      if (!item.appointmentId) return;
      setPriorityError(null);
      try {
        await priorityMutation.mutateAsync({ appointmentId: item.appointmentId, priority, ...(reason ? { reason } : {}) });
        setPriorityItem(null);
        void refetchQueue();
      } catch (priorityFailure) {
        setPriorityError(sanitizeErrorMessage(priorityFailure));
      }
    },
    [priorityMutation, refetchQueue],
  );

  // Mark no-show (front desk, clinic admin) with a 5 s undo that puts the visit back to CONFIRMED.
  const noShowMutation = useMarkAppointmentNoShow();
  const restoreStatusMutation = useUpdateAppointmentStatus();
  const runUndoable = useUndoableAction();
  const [noShowItem, setNoShowItem] = useState<QueueDisplayItem | null>(null);
  const handleConfirmNoShow = useCallback(async () => {
    const appointmentId = noShowItem?.appointmentId;
    if (!noShowItem || !appointmentId) return;
    try {
      await runUndoable({
        message: `${getQueuePatientDisplayName(noShowItem)} marked as no-show`,
        perform: () => noShowMutation.mutateAsync(appointmentId),
        undo: async () => {
          await restoreStatusMutation.mutateAsync({ appointmentId, status: QUEUE_STATUS.CONFIRMED });
          await refetchQueue();
        },
      });
      setNoShowItem(null);
      void refetchQueue();
    } catch {
      // The mutation hook has already shown the reason.
    }
  }, [noShowItem, noShowMutation, refetchQueue, restoreStatusMutation, runUndoable]);

  // Clinic admin: live numbers for every location (CaQueueOverview).
  const queueOverview = useMemo(
    () => (capabilities.showLocationOverview ? buildQueueOverview(queueEntries, locations) : null),
    [capabilities.showLocationOverview, locations, queueEntries],
  );
  const roleNote =
    capabilities.variant === "assistant"
      ? "Checked-in patients go straight to the doctor, who calls them in and completes the visit. Prepare an Rx draft or dispense for any of them."
      : capabilities.variant === "reception"
        ? "Only the doctor calls the next patient in. Set priority or mark a no-show from the row menu."
        : null;

  // A row with no (or an unknown) treatment type lands in General Consultation, never nowhere.
  const consultationQueueSections = useMemo<QueueSection[]>(
    () => buildQueueLanes(scopedQueueEntries, consultationQueueFilters, procedureQueueFilters),
    [consultationQueueFilters, procedureQueueFilters, scopedQueueEntries],
  );

  const resolvedActiveConsultationLane = useMemo(() => {
    if (
      consultationQueueSections.length > 0 &&
      !consultationQueueSections.some((section) => section.key === activeConsultationLane)
    ) {
      return consultationQueueSections[0]?.key || "GENERAL_CONSULTATION";
    }

    return activeConsultationLane;
  }, [activeConsultationLane, consultationQueueSections]);

  const activeConsultationSection = useMemo(
    () =>
      consultationQueueSections.find((section) => section.key === resolvedActiveConsultationLane) ??
      consultationQueueSections[0],
    [consultationQueueSections, resolvedActiveConsultationLane],
  );

  // One lane per key: several catalog treatments share AYURVEDIC_PROCEDURES (duplicate React keys).
  const procedureQueueSections = useMemo<QueueSection[]>(
    () => buildQueueLanes(scopedQueueEntries, procedureQueueFilters, [], "__none__"),
    [procedureQueueFilters, scopedQueueEntries],
  );

  const resolvedActiveTherapyLane = useMemo(() => {
    if (procedureQueueSections.length > 0 && !procedureQueueSections.some((section) => section.key === activeTherapyLane)) {
      return procedureQueueSections[0]?.key || "PROCEDURAL_CARE";
    }

    return activeTherapyLane;
  }, [activeTherapyLane, procedureQueueSections]);

  const activeProcedureSection = useMemo(
    () =>
      procedureQueueSections.find((section) => section.key === resolvedActiveTherapyLane) ?? procedureQueueSections[0],
    [procedureQueueSections, resolvedActiveTherapyLane],
  );

  const activeQueueTabs = useMemo<Array<{ key: QueueTabKey; label: string; count: number }>>(
    () => [
      {
        key: "consultations",
        label: "Consultations",
        count: consultationQueueSections.reduce((total, section) => total + section.items.length, 0),
      },
      {
        key: "therapies",
        label: "Procedures",
        count: procedureQueueSections.reduce((total, section) => total + section.items.length, 0),
      },
    ],
    [consultationQueueSections, procedureQueueSections],
  );

  const resolvedActiveQueue: QueueTabKey = activeQueueTabs.some((tab) => tab.key === activeQueue)
    ? activeQueue
    : "consultations";

  // The doctor's own next step on a row: "Case sheet" for the visit in progress, "Start" for
  // their next in-clinic patient in the lane. Other roles get no main button on a row.
  const getPrimaryActions = useCallback(
    (items: QueueDisplayItem[]): Record<string, QueuePrimaryAction> => {
      const actions: Record<string, QueuePrimaryAction> = {};
      if (!isDoctorRole) return actions;

      const ownIds = [doctorId, doctorEntityId].filter(Boolean).map(String);
      const ownItems = items.filter((item) =>
        [item.assignedDoctorId, item.primaryDoctorId, item.queueOwnerId]
          .filter(Boolean)
          .some((value) => ownIds.includes(String(value))),
      );

      ownItems.forEach((item) => {
        if (String(item.status || "").toUpperCase() === QUEUE_STATUS.IN_PROGRESS && item.patientId) {
          actions[item.id] = "case-sheet";
        }
      });

      if (canUpdateAppointments) {
        const nextPatient = ownItems
          .filter((item) => String(item.status || "").toUpperCase() !== QUEUE_STATUS.IN_PROGRESS)
          .toSorted((a, b) => (a.position > 0 ? a.position : Number.MAX_SAFE_INTEGER) - (b.position > 0 ? b.position : Number.MAX_SAFE_INTEGER))[0];
        const nextStatus = String(nextPatient?.status || "").toUpperCase();
        if (
          nextPatient &&
          (nextStatus === QUEUE_STATUS.CONFIRMED || nextStatus === QUEUE_STATUS.WAITING) &&
          !isVideoQueueEntry(nextPatient) &&
          hasReliableAppointmentReference(nextPatient, rawQueueById[nextPatient.id])
        ) {
          actions[nextPatient.id] = "start";
        }
      }

      return actions;
    },
    [canUpdateAppointments, doctorEntityId, doctorId, isDoctorRole, rawQueueById],
  );

  const consultationItems = activeConsultationSection?.items;
  const procedureItems = activeProcedureSection?.items;
  const consultationPrimaryActions = useMemo(
    () => getPrimaryActions(consultationItems ?? []),
    [consultationItems, getPrimaryActions],
  );
  const procedurePrimaryActions = useMemo(
    () => getPrimaryActions(procedureItems ?? []),
    [procedureItems, getPrimaryActions],
  );

  return {
    // state of the fetch
    isLoading,
    error,
    refetchQueue,
    isLiveSyncConnected,

    // banner
    queueScopeLabel,
    canManageQueue: queuePermissions.canManageQueue,

    // stale entries (front desk, clinic admin)
    staleCount: canCleanUpStaleEntries ? staleEntries.length : 0,
    isCleaningUp,
    handleBulkCleanup,

    // treatment type filter
    treatmentFilterOptions,
    resolvedActiveTreatmentFilter,
    setActiveTreatmentFilter,

    // statistics (people who manage the queue)
    queueStatsSummary: queuePermissions.canManageQueue ? queueStatsSummary : null,

    // tabs and lanes
    activeQueueTabs,
    resolvedActiveQueue,
    setActiveQueue,
    consultationQueueSections,
    resolvedActiveConsultationLane,
    activeConsultationSection,
    setActiveConsultationLane,
    consultationPrimaryActions,
    procedureQueueSections,
    resolvedActiveTherapyLane,
    activeProcedureSection,
    setActiveTherapyLane,
    procedurePrimaryActions,

    // banners (offline, role note, clinic admin overview)
    isOnline,
    roleNote,
    queueOverview,

    // row actions
    isDoctorRole,
    queueVariant: capabilities.variant,
    canSetPriority: capabilities.canSetPriority,
    canMarkNoShow: capabilities.canMarkNoShow,
    callingId,
    handleCallPatient,

    // "Set priority" dialog
    priorityItem,
    priorityError,
    isPriorityPending: priorityMutation.isPending,
    openPriorityDialog,
    closePriorityDialog: () => setPriorityItem(null),
    handleSetPriority,

    // "Mark no-show" confirmation
    noShowItem,
    isNoShowPending: noShowMutation.isPending,
    setNoShowItem,
    handleConfirmNoShow,
    canMoveTo: sessionRole !== undefined && QUEUE_TRANSFER_ROLES.has(sessionRole),
    transferringId,
    startingId,
    handleStartConsultation,
    handleUpdateQueueStatus,
    handlePauseQueue,

    // "Move to" dialog
    transferringQueueItem,
    setTransferringQueueItem,
    queueTransferOptions,
    handleTransfer,
  };
}
