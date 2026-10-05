"use client";

import { QueueAssignDoctorDialog } from "./QueueAssignDoctorDialog";
import { QueueMoveToDialog } from "./QueueMoveToDialog";
import { QueueErrorView, QueueLoadingView, QueueView } from "./QueueView";
import { useQueuePageData } from "./useQueuePageData";

/** Thin container for `/queue`: reads the data hook and hands plain props to the views. */
export default function QueueContent() {
  const data = useQueuePageData();

  if (data.isLoading) {
    return <QueueLoadingView scopeLabel={data.queueScopeLabel} />;
  }

  if (data.error) {
    return (
      <QueueErrorView
        scopeLabel={data.queueScopeLabel}
        message={data.error instanceof Error ? data.error.message : String(data.error)}
        onRetry={() => void data.refetchQueue()}
      />
    );
  }

  return (
    <>
      <QueueView
        scopeLabel={data.queueScopeLabel}
        canManageQueue={data.canManageQueue}
        liveSync={data.isLiveSyncConnected}
        staleCount={data.staleCount}
        isCleaningUp={data.isCleaningUp}
        onCleanUpStale={() => void data.handleBulkCleanup()}
        treatmentFilters={data.treatmentFilterOptions}
        activeTreatmentFilter={data.resolvedActiveTreatmentFilter}
        onTreatmentFilterChange={data.setActiveTreatmentFilter}
        stats={data.queueStatsSummary}
        tabs={data.activeQueueTabs}
        activeTab={data.resolvedActiveQueue}
        onTabChange={data.setActiveQueue}
        consultation={{
          lanes: data.consultationQueueSections.map((section) => ({
            key: section.key,
            title: section.title,
            count: section.items.length,
          })),
          activeLane: data.resolvedActiveConsultationLane,
          activeLaneTitle: data.activeConsultationSection?.title || "selected",
          onLaneChange: data.setActiveConsultationLane,
          items: data.activeConsultationSection?.items ?? [],
          primaryActions: data.consultationPrimaryActions,
        }}
        procedure={{
          lanes: data.procedureQueueSections.map((section) => ({
            key: section.key,
            title: section.title,
            count: section.items.length,
          })),
          activeLane: data.resolvedActiveTherapyLane,
          activeLaneTitle: data.activeProcedureSection?.title || "selected",
          onLaneChange: data.setActiveTherapyLane,
          items: data.activeProcedureSection?.items ?? [],
          primaryActions: data.procedurePrimaryActions,
        }}
        rowActions={{
          hasMainAction: data.isDoctorRole,
          canAssignDoctor: data.canAssignDoctor,
          isAssignPending: data.isAssignPending,
          transferringId: data.transferringId,
          startingId: data.startingId,
          onStart: (item) => void data.handleStartConsultation(item),
          onAssignDoctor: data.openAssignDoctorDialog,
          onMoveTo: data.setTransferringQueueItem,
        }}
      />

      <QueueMoveToDialog
        item={data.transferringQueueItem}
        options={data.queueTransferOptions}
        onSelect={(item, option) => {
          void data.handleTransfer(item.id, option.value, option.value, option.label);
          data.setTransferringQueueItem(null);
        }}
        onClose={() => data.setTransferringQueueItem(null)}
      />

      <QueueAssignDoctorDialog
        item={data.assigningQueueItem}
        doctors={data.assignableDoctors}
        selectedDoctorId={data.selectedDoctorId}
        error={data.assignDoctorError}
        isPending={data.isAssignPending}
        onSelectDoctor={data.setSelectedDoctorId}
        onSubmit={() => void data.handleAssignDoctor()}
        onClose={data.closeAssignDoctorDialog}
      />
    </>
  );
}
