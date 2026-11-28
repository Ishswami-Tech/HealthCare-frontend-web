"use client";

import { UserX } from "lucide-react";
import { ConfirmDialog } from "@/components/tbd";
import { getQueuePatientDisplayName } from "@/lib/queue/queue-adapter";
import { QueueMoveToDialog } from "./QueueMoveToDialog";
import { QueuePatientSummary } from "./QueuePatientSummary";
import { QueuePriorityDialog } from "./QueuePriorityDialog";
import { QueueErrorView, QueueLoadingView, QueueView } from "./QueueView";
import { useQueuePageData } from "./useQueuePageData";

/**
 * Thin container for `/queue`: reads the data hook and hands plain props to the views.
 * One screen for every role; what a row offers follows the role (see `queue-roles.logic.ts`):
 * doctor calls / starts / completes, assistant drafts Rx / dispenses, front desk sets priority
 * and marks no-shows, clinic admin also sees every location at a glance.
 */
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
        online={data.isOnline}
        onRetry={() => void data.refetchQueue()}
        roleNote={data.roleNote}
        overview={data.queueOverview}
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
          variant: data.queueVariant,
          canMoveTo: data.canMoveTo,
          canSetPriority: data.canSetPriority,
          canMarkNoShow: data.canMarkNoShow,
          transferringId: data.transferringId,
          startingId: data.startingId,
          callingId: data.callingId,
          onStart: (item) => void data.handleStartConsultation(item),
          onCall: (item) => void data.handleCallPatient(item),
          onMoveTo: data.setTransferringQueueItem,
          onSetPriority: data.openPriorityDialog,
          onMarkNoShow: data.setNoShowItem,
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

      <QueuePriorityDialog
        item={data.priorityItem}
        isPending={data.isPriorityPending}
        error={data.priorityError}
        onSubmit={(item, priority, reason) => void data.handleSetPriority(item, priority, reason)}
        onClose={data.closePriorityDialog}
      />

      <ConfirmDialog
        open={!!data.noShowItem}
        onClose={() => data.setNoShowItem(null)}
        title="Mark no-show"
        description={`${data.noShowItem ? getQueuePatientDisplayName(data.noShowItem) : "This patient"} leaves the queue. You can undo this for 5 seconds.`}
        confirmLabel="Mark no-show"
        busyLabel="Marking…"
        confirmIcon={<UserX />}
        tone="danger"
        busy={data.isNoShowPending}
        onConfirm={() => void data.handleConfirmNoShow()}
      >
        {data.noShowItem ? <QueuePatientSummary item={data.noShowItem} /> : null}
      </ConfirmDialog>
    </>
  );
}
