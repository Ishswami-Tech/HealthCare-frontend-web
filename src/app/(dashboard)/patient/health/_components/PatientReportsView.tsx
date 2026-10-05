"use client";

import { useState } from "react";
import { CircleAlert, FileText, FlaskConical, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, FilterChips, Note, PageHead, Pill, Surface, type TbdOption } from "@/components/tbd";
import { ReportsTable } from "./ReportsTable";
import { filterReports, type ReportFilter, type ReportRow } from "./patient-health.logic";

const EMPTY_COPY: Record<ReportFilter, string> = {
  all: "No reports yet",
  lab: "No lab reports yet",
  imaging: "No imaging reports yet",
  rx: "No prescriptions yet",
  other: "No other documents yet",
};

export interface PatientReportsViewProps {
  /** Lab reports, imaging, prescriptions and uploaded files, newest first. Never sample data. */
  rows: ReportRow[];
  isLoading?: boolean;
  /** Nothing could be loaded. */
  failed?: boolean;
  /** Some lists loaded and some did not. */
  partlyFailed?: boolean;
  onRetry: () => void;
  /** Opens the upload dialog. */
  onUpload: () => void;
  /** First filter to show. Used by the preview; the app starts on "All". */
  initialFilter?: ReportFilter;
}

export function PatientReportsView({
  rows,
  isLoading = false,
  failed = false,
  partlyFailed = false,
  onRetry,
  onUpload,
  initialFilter = "all",
}: PatientReportsViewProps) {
  const [filter, setFilter] = useState<ReportFilter>(initialFilter);
  const shown = filterReports(rows, filter);

  const options: TbdOption<ReportFilter>[] = [
    { value: "all", label: "All" },
    { value: "lab", label: "Lab" },
    { value: "imaging", label: "Imaging" },
    { value: "rx", label: "Rx" },
    // Only offered when the patient has a file that is none of the above.
    ...(rows.some((row) => row.kind === "other") ? [{ value: "other" as const, label: "Other" }] : []),
  ];

  return (
    <>
      <PageHead
        backHref="/patient/health"
        title="Reports & Lab"
        actions={
          <Button size="md" onClick={onUpload}>
            <Upload aria-hidden="true" />
            Upload report
          </Button>
        }
      />

      {/* The backend has no home lab booking yet: the card says so instead of offering it. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[20px] bg-[#fdf0e1] px-5 py-4 dark:bg-orange-500/10">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#ea8a1b] dark:bg-white/10 dark:text-orange-300"
          aria-hidden="true"
        >
          <FlaskConical className="size-6" strokeWidth={2.2} />
        </span>
        <div className="flex min-w-[12rem] flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-bold text-ink">Lab tests at home</span>
          <span className="text-[13px] text-[#7c4a03] dark:text-orange-200">
            Home sample pickup cannot be booked here yet. Reports from your clinic show below.
          </span>
        </div>
        <Pill tone="amber">Not available yet</Pill>
      </div>

      <Surface as="section" aria-label="Your reports" className="gap-[18px] pb-2">
        <FilterChips
          options={options}
          value={filter}
          onChange={setFilter}
          ariaLabel="Report type"
          className="[&>button]:min-w-[76px] [&>button]:justify-center"
        />

        {partlyFailed && !failed ? (
          <Note tone="amber" icon={CircleAlert}>
            Some reports could not be loaded.{" "}
            <button type="button" onClick={onRetry} className="font-bold underline underline-offset-2">
              Try again
            </button>
          </Note>
        ) : null}

        {failed ? (
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="We could not load your reports"
            description="Please check your connection and try again."
            action={
              <Button variant="outline" size="md" onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        ) : isLoading ? (
          <div className="flex flex-col pb-3" aria-busy="true" aria-label="Loading your reports">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="flex items-center gap-3.5 border-b border-hair py-3 last:border-b-0">
                <Skeleton className="size-11 shrink-0 rounded-xl" />
                <Skeleton className="h-4 w-48 max-w-[40%] rounded-md" />
                <Skeleton className="ml-auto h-4 w-24 rounded-md" />
                <Skeleton className="h-9 w-[104px] rounded-xl" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <EmptyBlock
            icon={FileText}
            title={EMPTY_COPY[filter]}
            description={
              rows.length === 0
                ? "Reports from your clinic and the files you upload show here."
                : "Choose another type to see your other reports."
            }
            action={
              rows.length === 0 ? (
                <Button variant="soft" size="md" onClick={onUpload}>
                  <Upload aria-hidden="true" />
                  Upload report
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ReportsTable key={filter} rows={shown} />
        )}
      </Surface>
    </>
  );
}
