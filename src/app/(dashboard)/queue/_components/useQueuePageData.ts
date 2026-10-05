"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHashTab } from "@/hooks/navigation/useHashTab";
import { useReassignAppointmentDoctor, useStartAppointment } from "@/hooks/query/useAppointments";
import { useActiveLocations, useClinicContext } from "@/hooks/query/useClinics";
import { useCurrentDoctorEntityId, useDoctors } from "@/hooks/query/useDoctors";
import { usePauseQueue, useQueue, useQueueFilters, useTransferQueueEntry } from "@/hooks/query/useQueue";
import { useRealTimeQueueStatus, useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { useQueueWebSocketIntegration } from "@/hooks/realtime/useWebSocketIntegration";
import { useOptimisticUpdateQueueStatus } from "@/hooks/utils/useOptimisticQueue";
import { useQueuePermissions, useRBAC } from "@/hooks/utils/useRBAC";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { bulkCancelQueueEntries } from "@/lib/actions/queue.server";
import { hasQueuePatientIdentity } from "@/lib/queue/queue-adapter";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import type { QueueFilterGroup, QueueFilterOption } from "@/types/api.types";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import {
  CONSULTATION_QUEUE_FILTERS,
  CONSULTATION_QUEUE_FILTER_KEYS,
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
  type AssignableDoctor,
  type QueueDisplayItem,
  type QueuePrimaryAction,
  type QueueSection,
  type QueueStatsSummary,
  type QueueTabKey,
} from "./queue.logic";

type DoctorRow = {
  id?: unknown;
  name?: unknown;
  role?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  doctor?: { id?: unknown; user?: { name?: unknown; role?: unknown } };
};

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function normalizeAssignableDoctors(users: DoctorRow[]): AssignableDoctor[] {
  return users.reduce<AssignableDoctor[]>((acc, user) => {
    const role = (text(user.role) || text(user.doctor?.user?.role)).toUpperCase();
    const id = text(user.doctor?.id) || text(user.id);
    if (!id || (role !== "DOCTOR" && role !== "ASSISTANT_DOCTOR")) {
      return acc;
    }

    acc.push({
      id,
      name:
        text(user.name) ||
        text(user.doctor?.user?.name) ||
        `${text(user.firstName)} ${text(user.lastName)}`.trim() ||
        "Unknown Doctor",
      role,
    });
    return acc;
  }, []);
}

/** The doctors list comes back as an array, `{ doctors }` or `{ data: { doctors } }`. */
function extractDoctorRows(doctorsData: unknown): DoctorRow[] {
  if (Array.isArray(doctorsData)) return doctorsData as DoctorRow[];
  const record = (doctorsData ?? {}) as { data?: { doctors?: unknown }; doctors?: unknown };
  if (Array.isArray(record.data?.doctors)) return record.data.doctors as DoctorRow[];
  return Array.isArray(record.doctors) ? (record.doctors as DoctorRow[]) : [];
}

/**
 * Data container for the shared `/queue` screen (doctor, receptionist, clinic admin, nurse, ...).
 * Every fetch, mutation and role rule lives here; the views only get props.
 */
export function useQueuePageData() {
  const { session } = useAuth();
  const userRole = (session?.user?.role as Role) || Role.SUPER_ADMIN;
  const doctorId = session?.user?.id;
  const isDoctorRole = userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR;
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
      assigningQueueItem,
      selectedDoctorId,
      assignDoctorError,
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
  const setSelectedDoctorId = useCallback((value: string) => dispatch({ type: "setSelectedDoctorId", value }), []);

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
  const { data: locations = [] } = useActiveLocations(clinicId || "");
  const locationId = locations[0]?.id || "";
  const queueClinicId = clinicId || undefined;
  const { subscribeToQueue: subscribeClinicQueue, unsubscribeFromQueue: unsubscribeClinicQueue } =
    useQueueWebSocketIntegration("healthcare-queue");

  // Fetch queue data with proper permissions - strictly bound to today
  const {
    data: queueData,
    isPending: isLoading,
    error,
    refetch: refetchQueue,
  } = useQueue(queueClinicId, { enabled: queuePermissions.canViewQueue });

  const { data: queueStats } = useRealTimeQueueStatus(undefined, locationId || undefined);
  const { data: doctorsData } = useDoctors(clinicId || "", { limit: 200 });
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

  const assignableDoctors = useMemo(() => normalizeAssignableDoctors(extractDoctorRows(doctorsData)), [doctorsData]);

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
          hasQueuePatientIdentity(item) && !TERMINAL_QUEUE_STATUSES.has(String(item.status || "").toUpperCase()),
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
      ...options,
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
      await bulkCancelQueueEntries(ids);
      await refetchQueue();
      showSuccessToast(`Successfully cancelled ${ids.length} stale entries.`, { id: TOAST_IDS.GLOBAL.SUCCESS });
    } catch (err) {
      showErrorToast(err, { id: TOAST_IDS.GLOBAL.ERROR });
    } finally {
      dispatch({ type: "setIsCleaningUp", value: false });
    }
  }, [refetchQueue, staleEntries]);

  const queueStatsSummary = useMemo<QueueStatsSummary>(() => {
    const useApiQueueStats = resolvedActiveTreatmentFilter === "ALL" && !isDoctorRole;
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
  }, [isDoctorRole, queueStats, resolvedActiveTreatmentFilter, scopedQueueEntries]);

  const queueScopeLabel = useMemo(() => {
    if (userRole === Role.SUPER_ADMIN) {
      return queueClinicId ? "Reception Queue" : "All clinics";
    }

    if (isDoctorRole) {
      return "Clinic Queue";
    }

    if (userRole === Role.CLINIC_ADMIN) {
      return "Clinic Operations Queue";
    }

    if (userRole === Role.RECEPTIONIST) {
      return "Reception Queue";
    }

    return "Live queue";
  }, [isDoctorRole, queueClinicId, userRole]);

  // Mutation hooks for queue actions
  const updateQueueStatusOptimistic = useOptimisticUpdateQueueStatus(clinicId);
  const pauseQueueMutation = usePauseQueue();
  const transferQueueEntryMutation = useTransferQueueEntry();
  const reassignAppointmentMutation = useReassignAppointmentDoctor();
  const startAppointmentMutation = useStartAppointment();

  const handleTransfer = useCallback(
    async (entryId: string, targetQueue: string, treatmentType: string, label: string) => {
      dispatch({ type: "setTransferringId", value: entryId });
      try {
        await transferQueueEntryMutation.mutateAsync({ entryId, targetQueue, treatmentType });
        const transferSynced = await pollQueueSync(refetchQueue, 8, 400, (entries) =>
          entries.some((item) => {
            if (item.id !== entryId) return false;

            return (
              normalizeQueueToken(item.queueCategory) === normalizeQueueToken(targetQueue) ||
              matchesQueueSection(item, treatmentType)
            );
          }),
        );

        if (!transferSynced) {
          throw new Error("Transfer request was accepted but backend queue sync is still pending.");
        }

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
        showSuccessToast(`Moved to ${label}`, { id: TOAST_IDS.GLOBAL.SUCCESS });
      } catch (transferError) {
        showErrorToast(transferError, { id: TOAST_IDS.GLOBAL.ERROR });
      } finally {
        dispatch({ type: "setTransferringId", value: null });
      }
    },
    [refetchQueue, setActiveConsultationLane, setActiveQueue, setActiveTherapyLane, transferQueueEntryMutation],
  );

  const openAssignDoctorDialog = useCallback((item: QueueDisplayItem) => {
    dispatch({ type: "setAssignDoctorError", value: "" });
    dispatch({ type: "setSelectedDoctorId", value: "" });
    dispatch({ type: "setAssigningQueueItem", value: item });
  }, []);

  const closeAssignDoctorDialog = useCallback(() => {
    dispatch({ type: "setAssigningQueueItem", value: null });
    dispatch({ type: "setSelectedDoctorId", value: "" });
    dispatch({ type: "setAssignDoctorError", value: "" });
  }, []);

  const handleAssignDoctor = useCallback(async () => {
    dispatch({ type: "setAssignDoctorError", value: "" });
    if (!assigningQueueItem?.appointmentId) {
      dispatch({ type: "setAssignDoctorError", value: "No linked appointment found for this queue entry." });
      return;
    }
    if (!selectedDoctorId) {
      dispatch({ type: "setAssignDoctorError", value: "Please select a doctor to assign." });
      return;
    }

    try {
      await reassignAppointmentMutation.mutateAsync({
        appointmentId: assigningQueueItem.appointmentId,
        doctorId: selectedDoctorId,
        reason: "Queue doctor assignment by reception",
      });
      const selectedDoctorIdValue = String(selectedDoctorId);
      const reassignmentSynced = await pollQueueSync(refetchQueue, 8, 400, (entries) =>
        entries.some((item) => {
          if (item.id !== assigningQueueItem.id) return false;

          return [item.assignedDoctorId, item.primaryDoctorId, item.queueOwnerId]
            .filter(Boolean)
            .some((value) => String(value) === selectedDoctorIdValue);
        }),
      );

      if (!reassignmentSynced) {
        throw new Error("Reassignment request succeeded but backend queue sync is still pending.");
      }

      showSuccessToast("Doctor assigned successfully", { id: TOAST_IDS.GLOBAL.SUCCESS });
      dispatch({ type: "setAssigningQueueItem", value: null });
      dispatch({ type: "setSelectedDoctorId", value: "" });
    } catch (assignError) {
      dispatch({ type: "setAssignDoctorError", value: sanitizeErrorMessage(assignError) });
      showErrorToast(assignError, {
        id: TOAST_IDS.APPOINTMENT.REASSIGN,
        duration: 5000,
      });
    }
  }, [assigningQueueItem, selectedDoctorId, reassignAppointmentMutation, refetchQueue]);

  // Status updates and pause keep their existing wiring; no control on this screen calls them yet.
  const handleUpdateQueueStatus = useCallback(
    (patientId: string, status: string) => {
      updateQueueStatusOptimistic.mutation.mutate(
        { patientId, status },
        {
          onSuccess: () => {
            void refetchQueue();
          },
        },
      );
    },
    [refetchQueue, updateQueueStatusOptimistic.mutation],
  );

  // Pause uses the dedicated backend endpoint, not a generic status update
  const handlePauseQueue = useCallback(
    async (rowDoctorId: string) => {
      try {
        await pauseQueueMutation.mutateAsync({ doctorId: rowDoctorId });
        await refetchQueue();
        showSuccessToast("Queue paused", { id: TOAST_IDS.GLOBAL.SUCCESS });
      } catch (pauseError) {
        showErrorToast(pauseError, { id: TOAST_IDS.GLOBAL.ERROR });
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

  // Real-time queue data from API - filter by queue section
  const getQueueByType = useCallback(
    (type: string) => scopedQueueEntries.filter((item) => matchesQueueSection(item, type)),
    [scopedQueueEntries],
  );

  const consultationQueueSections = useMemo<QueueSection[]>(
    () =>
      consultationQueueFilters.map((option) => ({
        key: normalizeQueueToken(option.value),
        title: option.label,
        items: getQueueByType(option.value),
      })),
    [consultationQueueFilters, getQueueByType],
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

  const procedureQueueSections = useMemo<QueueSection[]>(
    () =>
      procedureQueueFilters.map((option) => ({
        key: normalizeQueueToken(option.value),
        title: option.label,
        items: getQueueByType(option.value),
      })),
    [procedureQueueFilters, getQueueByType],
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

    // row actions
    isDoctorRole,
    canAssignDoctor: canUpdateAppointments,
    isAssignPending: reassignAppointmentMutation.isPending,
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

    // "Assign doctor" dialog
    assigningQueueItem,
    assignableDoctors,
    selectedDoctorId,
    assignDoctorError,
    setSelectedDoctorId,
    openAssignDoctorDialog,
    closeAssignDoctorDialog,
    handleAssignDoctor,
  };
}
