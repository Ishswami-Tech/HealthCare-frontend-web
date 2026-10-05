"use client";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHero, SearchBox, SegTabs, Surface } from "@/components/tbd";
import type { PharmacyBatchAuditEntry } from "@/types/pharmacy.types";
import { PharmacistCashPaymentDialog } from "../../dashboard/_components/PharmacistCashPaymentDialog";
import type { DeskQueueItem } from "../../dashboard/_components/pharmacist-dashboard.logic";
import { DispenseDialog, type DispenseDialogProps } from "./DispenseDialog";
import { PrescriptionsActiveTable } from "./PrescriptionsActiveTable";
import { PrescriptionsAuditTable } from "./PrescriptionsAuditTable";
import { PrescriptionsHistoryTable } from "./PrescriptionsHistoryTable";
import { ReverseDispenseDialog, type ReverseDispenseDialogProps } from "./ReverseDispenseDialog";
import { STATE_FILTERS, type PrescriptionRow, type PrescriptionsTab } from "./pharmacist-prescriptions.logic";

export interface PharmacistPrescriptionsViewProps {
  tab: PrescriptionsTab;
  onTabChange: (tab: PrescriptionsTab) => void;

  /** Open prescriptions after the search and state filter, newest first. */
  activePrescriptions: PrescriptionRow[];
  /** Dispensed and cancelled prescriptions after the search and state filter. */
  historyPrescriptions: PrescriptionRow[];
  /** Sizes of the two lists before any filter, for the tab counts. */
  activeCount: number;
  historyCount: number;
  listLoading?: boolean;
  listError?: string | null;
  onRetryList?: (() => void) | undefined;

  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  /** Prescription from the `?prescriptionId=` deep link, marked in its table. */
  highlightId?: string | null;

  onReviewDispense: (prescription: PrescriptionRow) => void;
  onCollectPayment: (prescription: PrescriptionRow) => void;
  onReverse: (prescription: PrescriptionRow) => void;

  /** Batch audit entries after the search box, newest first. */
  auditEntries: PharmacyBatchAuditEntry[];
  auditLoading?: boolean;
  auditError?: string | null;
  onRetryAudit?: (() => void) | undefined;
  auditSearchTerm: string;
  onAuditSearchTermChange: (value: string) => void;
  auditStartDate: string;
  onAuditStartDateChange: (value: string) => void;
  auditEndDate: string;
  onAuditEndDateChange: (value: string) => void;

  dispense: DispenseDialogProps;
  reverse: ReverseDispenseDialogProps;

  /** The prescription shown in the "Record cash payment" dialog; null = closed. */
  cashPaymentTarget: DeskQueueItem | null;
  isRecordingCashPayment?: boolean;
  cashPaymentError?: string | null;
  onConfirmCashPayment: (item: DeskQueueItem) => void;
  onCloseCashPayment: () => void;
}

function DateField({
  id,
  label,
  value,
  max,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string | undefined;
  max?: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 min-w-0 basis-full items-center gap-2 rounded-xl border border-line bg-card px-3 text-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 @md:flex-1 @md:basis-0 @2xl:flex-none @2xl:basis-auto"
    >
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent font-semibold text-ink outline-hidden dark:[color-scheme:dark]"
      />
    </label>
  );
}

/** Prescriptions screen layout. Props only — data and mutations live in `PharmacistPrescriptionsContent`. */
export function PharmacistPrescriptionsView({
  tab,
  onTabChange,
  activePrescriptions,
  historyPrescriptions,
  activeCount,
  historyCount,
  listLoading = false,
  listError = null,
  onRetryList,
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  highlightId = null,
  onReviewDispense,
  onCollectPayment,
  onReverse,
  auditEntries,
  auditLoading = false,
  auditError = null,
  onRetryAudit,
  auditSearchTerm,
  onAuditSearchTermChange,
  auditStartDate,
  onAuditStartDateChange,
  auditEndDate,
  onAuditEndDateChange,
  dispense,
  reverse,
  cashPaymentTarget,
  isRecordingCashPayment = false,
  cashPaymentError = null,
  onConfirmCashPayment,
  onCloseCashPayment,
}: PharmacistPrescriptionsViewProps) {
  const listTab = tab === "audit" ? "active" : tab;
  const listFiltered = searchTerm.trim().length > 0 || statusFilter !== "all";
  const listResetKey = `${searchTerm}|${statusFilter}`;
  // No counts while the list loads or when it could not be loaded.
  const showCounts = !listLoading && !(listError && activeCount + historyCount === 0);

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Pharmacy"
        title="Prescription Management"
        description="Medicines are handed over once the prescription is paid for."
      />

      <Surface flush as="section" className="@container" aria-label="Prescriptions">
        <div className="flex flex-col gap-3 border-b border-hair px-5 py-4 @4xl:flex-row @4xl:items-center">
          <SegTabs<PrescriptionsTab>
            ariaLabel="Prescription lists"
            value={tab}
            onChange={onTabChange}
            className="shrink-0"
            options={[
              { value: "active", label: "Active", count: showCounts ? activeCount : undefined },
              { value: "history", label: "History", count: showCounts ? historyCount : undefined },
              { value: "audit", label: "Batch audit" },
            ]}
          />

          {tab === "audit" ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 @4xl:justify-end">
              <SearchBox
                value={auditSearchTerm}
                onChange={onAuditSearchTermChange}
                placeholder="Search patient, medicine, batch..."
                ariaLabel="Search the batch audit"
                className="basis-full @2xl:max-w-[330px] @2xl:flex-1 @2xl:basis-0"
              />
              <DateField
                id="audit-start-date"
                label="From"
                value={auditStartDate}
                max={auditEndDate || undefined}
                onChange={onAuditStartDateChange}
              />
              <DateField
                id="audit-end-date"
                label="To"
                value={auditEndDate}
                min={auditStartDate || undefined}
                onChange={onAuditEndDateChange}
              />
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-3 @2xl:flex-row @2xl:items-center @4xl:justify-end">
              <SearchBox
                value={searchTerm}
                onChange={onSearchTermChange}
                placeholder="Search patient, doctor, medicine or prescription no."
                ariaLabel="Search prescriptions"
                className="@2xl:max-w-[470px] @2xl:flex-1"
              />
              <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger aria-label="Filter by state" className="w-full @2xl:w-[170px]">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  {STATE_FILTERS[listTab].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {tab === "active" ? (
          <PrescriptionsActiveTable
            prescriptions={activePrescriptions}
            filtered={listFiltered}
            resetKey={listResetKey}
            highlightId={highlightId}
            loading={listLoading}
            errorMessage={activeCount === 0 ? listError : null}
            onRetry={onRetryList}
            onReviewDispense={onReviewDispense}
            dispensePending={dispense.isDispensing}
            onCollectPayment={onCollectPayment}
            collectPending={isRecordingCashPayment}
          />
        ) : null}

        {tab === "history" ? (
          <PrescriptionsHistoryTable
            prescriptions={historyPrescriptions}
            filtered={listFiltered}
            resetKey={listResetKey}
            highlightId={highlightId}
            loading={listLoading}
            errorMessage={historyCount === 0 ? listError : null}
            onRetry={onRetryList}
            onReverse={onReverse}
            reversePending={reverse.isReversing}
          />
        ) : null}

        {tab === "audit" ? (
          <PrescriptionsAuditTable
            entries={auditEntries}
            filtered={auditSearchTerm.trim().length > 0 || Boolean(auditStartDate) || Boolean(auditEndDate)}
            resetKey={`${auditSearchTerm}|${auditStartDate}|${auditEndDate}`}
            loading={auditLoading}
            errorMessage={auditEntries.length === 0 ? auditError : null}
            onRetry={onRetryAudit}
          />
        ) : null}
      </Surface>

      <DispenseDialog {...dispense} />
      <ReverseDispenseDialog {...reverse} />
      <PharmacistCashPaymentDialog
        item={cashPaymentTarget}
        isRecording={isRecordingCashPayment}
        errorMessage={cashPaymentError}
        onConfirm={onConfirmCashPayment}
        onClose={onCloseCashPayment}
      />
    </DashboardPageShell>
  );
}
