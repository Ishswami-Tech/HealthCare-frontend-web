"use client";

import { Calendar, CircleAlert, FileText, Pill as PillIcon, Plus, RefreshCw, User } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Kpi, PageHero, SearchBox, SectionTitle, SegTabs, Surface } from "@/components/tbd";
import { DoctorPrescriptionCard } from "./DoctorPrescriptionCard";
import { DoctorPrescriptionDialog } from "./DoctorPrescriptionDialog";
import {
  prescriptionsCountLabel,
  type DoctorPrescriptionEditForm,
  type DoctorPrescriptionFilter,
  type DoctorPrescriptionRow,
  type DoctorPrescriptionStats,
} from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionsViewProps {
  /** First load, nothing to show yet. */
  isLoading: boolean;
  /** The first load failed and there is nothing to show. */
  loadFailed?: boolean;
  onRetry?: () => void;
  /** Rows after search and filter. */
  prescriptions: DoctorPrescriptionRow[];
  /** True when the doctor has prescriptions but the search / filter hides them all. */
  hasAnyPrescription: boolean;
  stats: DoctorPrescriptionStats;
  searchQuery: string;
  filterStatus: DoctorPrescriptionFilter;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: DoctorPrescriptionFilter) => void;
  editDisabled?: boolean;
  onCreate: () => void;
  onEdit: (prescription: DoctorPrescriptionRow) => void;
  onDownload: (prescription: DoctorPrescriptionRow) => void;
  dialogOpen: boolean;
  form: DoctorPrescriptionEditForm;
  isSaving?: boolean;
  onFormChange: (value: Partial<DoctorPrescriptionEditForm>) => void;
  onSave: () => void;
  onDialogOpenChange: (open: boolean) => void;

}

const FILTER_OPTIONS: Array<{ value: DoctorPrescriptionFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const PAGE_DESCRIPTION =
  "Review prescribed medicines and clinical notes. Medicine payment, packing, and dispatch stay with the medicine desk.";

/** Tighter stat cards on a phone so "Prescriptions" fits beside the icon. */
const KPI_PHONE = "max-sm:gap-2.5 max-sm:px-3.5";

/** Lets a long stat label wrap on a phone instead of being cut off. */
function StatLabel({ children }: { children: string }) {
  return <span className="block whitespace-normal leading-tight [overflow-wrap:anywhere]">{children}</span>;
}

function LoadingBlocks() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-3.5 rounded-[18px] bg-card px-[18px] py-4 shadow-card dark:border dark:border-border/70">
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="h-3 w-24 max-w-full animate-pulse rounded bg-well" />
              <span className="h-7 w-10 animate-pulse rounded bg-well" />
            </span>
            <span className="size-11 shrink-0 animate-pulse rounded-[14px] bg-well" />
          </div>
        ))}
      </div>
      <Surface aria-hidden="true">
        <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-well" />
          <div className="h-[46px] w-[250px] max-w-full animate-pulse rounded-[13px] bg-well" />
        </div>
      </Surface>
      <Surface>
        <span className="sr-only" role="status">
          Loading prescriptions…
        </span>
        <div className="h-5 w-40 animate-pulse rounded bg-well" aria-hidden="true" />
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex flex-col gap-3.5 rounded-2xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className="size-[42px] shrink-0 animate-pulse rounded-full bg-well" />
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="h-4 w-44 max-w-full animate-pulse rounded bg-well" />
                  <span className="h-3 w-64 max-w-full animate-pulse rounded bg-well" />
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:pl-[54px]">
                <span className="h-3.5 w-56 max-w-full animate-pulse rounded bg-well" />
                <span className="h-7 w-72 max-w-full animate-pulse rounded-[10px] bg-well" />
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </>
  );
}

/** The doctor's prescriptions screen. Everything it shows and does comes in through props. */
export function DoctorPrescriptionsView({
  isLoading,
  loadFailed = false,
  onRetry,
  prescriptions,
  hasAnyPrescription,
  stats,
  searchQuery,
  filterStatus,
  onSearchChange,
  onFilterChange,
  editDisabled = false,
  onCreate,
  onEdit,
  onDownload,
  dialogOpen,
  form,
  isSaving = false,
  onFormChange,
  onSave,
  onDialogOpenChange,
}: DoctorPrescriptionsViewProps) {
  const filtersActive = searchQuery.trim() !== "" || filterStatus !== "all";

  return (
    <DashboardPageShell>
      <PageHero
        eyebrow="Doctor Prescriptions"
        title="Prescriptions"
        description={PAGE_DESCRIPTION}
        actions={
          <Button size="md" onClick={onCreate} disabled={isLoading}>
            <Plus aria-hidden="true" />
            New Prescription
          </Button>
        }
      />

      {isLoading ? (
        <LoadingBlocks />
      ) : loadFailed ? (
        <Surface>
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="Could not load prescriptions"
            description="Check your connection and try again."
            action={
              onRetry ? (
                <Button size="md" variant="outline" onClick={onRetry}>
                  <RefreshCw aria-hidden="true" />
                  Try again
                </Button>
              ) : undefined
            }
          />
        </Surface>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Kpi
              label={<StatLabel>Total Prescriptions</StatLabel>}
              value={stats.total}
              icon={FileText}
              tone="blue"
              className={KPI_PHONE}
            />
            <Kpi
              label={<StatLabel>Active Prescriptions</StatLabel>}
              value={stats.active}
              icon={PillIcon}
              tone="mint"
              className={KPI_PHONE}
            />
            <Kpi
              label={<StatLabel>Unique Patients</StatLabel>}
              value={stats.patients}
              icon={User}
              tone="aqua"
              className={KPI_PHONE}
            />
            <Kpi
              label={<StatLabel>Today&apos;s Prescriptions</StatLabel>}
              value={<span suppressHydrationWarning>{stats.today}</span>}
              icon={Calendar}
              tone="amber"
              className={KPI_PHONE}
            />
          </div>

          <Surface>
            <div className="flex flex-col gap-3.5 md:flex-row md:items-center">
              <SearchBox
                value={searchQuery}
                onChange={onSearchChange}
                placeholder="Search by patient, medicine, or diagnosis…"
                ariaLabel="Search prescriptions"
                className="md:flex-1"
              />
              <SegTabs
                options={FILTER_OPTIONS}
                value={filterStatus}
                onChange={onFilterChange}
                ariaLabel="Filter prescriptions by status"
                className="md:self-center"
              />
            </div>
          </Surface>

          <Surface as="section" aria-label="Prescriptions list">
            <SectionTitle
              icon={FileText}
              title="Prescriptions List"
              action={
                <span className="text-[13px] text-ink-muted" aria-live="polite">
                  {prescriptionsCountLabel(prescriptions.length)}
                </span>
              }
            />
            {prescriptions.length === 0 ? (
              hasAnyPrescription ? (
                <EmptyBlock
                  icon={FileText}
                  title="No prescriptions found"
                  description="Try adjusting your search or filters."
                  action={
                    filtersActive ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          onSearchChange("");
                          onFilterChange("all");
                        }}
                      >
                        Clear search and filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <EmptyBlock
                  icon={FileText}
                  title="No prescriptions yet"
                  description="Prescriptions you write for your patients show up here."
                />
              )
            ) : (
              <div className="flex min-w-0 flex-col gap-3">
                {prescriptions.map((prescription) => (
                  <DoctorPrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    editDisabled={editDisabled}
                    onDownload={onDownload}
                    onEdit={onEdit}
                  />
                ))}
              </div>
            )}
          </Surface>
        </>
      )}

      <DoctorPrescriptionDialog
        open={dialogOpen}
        form={form}
        isSaving={isSaving}
        onFormChange={onFormChange}
        onSave={onSave}
        onOpenChange={onDialogOpenChange}
      />

    </DashboardPageShell>
  );
}
