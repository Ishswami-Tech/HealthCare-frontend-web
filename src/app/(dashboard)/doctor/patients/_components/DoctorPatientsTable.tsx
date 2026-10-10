"use client";

import Link from "next/link";
import { FileText, Pill as PillIcon, SearchX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CellTitle, EmptyBlock, InitialsAvatar, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { PATIENT_DIRECTORY_PAGE_SIZES } from "@/types/patient-directory.types";
import {
  lastVisitLabel,
  patientSummaryLine,
  visitsLabel,
  type DoctorPatientRow,
} from "./doctorPatients.logic";

/**
 * Wide card: one line per patient (patient, contact, visits, actions).
 * Narrow card: the name first, contact and visits side by side, then the buttons.
 * `@3xl` is a container width, so the layout follows the card, not the window.
 */
const ROW_GRID =
  "grid grid-cols-2 gap-x-4 px-5 @3xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_250px] @3xl:items-center";
const FULL_ROW = "col-span-2 @3xl:col-span-1";

interface DoctorPatientsTableProps {
  rows: DoctorPatientRow[];
  loading: boolean;
  /** Server paging: the current page (starting at 1) and the totals the API reported. */
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Rows per page: 10, 50, 200 or 500. */
  onPageSizeChange: (pageSize: number) => void;
  /** A search text or a filter is on: the empty state offers to clear them. */
  hasFilters: boolean;
  onClearFilters: () => void;
  onPrescribe: (row: DoctorPatientRow) => void;
}

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={cn(ROW_GRID, "gap-y-3 border-b border-hair py-3.5 last:border-b-0 @3xl:min-h-[60px] @3xl:py-2")}
        >
          <div className={cn(FULL_ROW, "flex items-center gap-3")}>
            <Skeleton className="size-[38px] rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28 max-w-full rounded" />
            <Skeleton className="h-3 w-36 max-w-full rounded" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3 w-24 max-w-full rounded" />
          </div>
          <div className={cn(FULL_ROW, "flex gap-2")}>
            <Skeleton className="h-9 w-[104px] rounded-xl" />
            <Skeleton className="h-9 w-[104px] rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DoctorPatientsTable({
  rows,
  loading,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  hasFilters,
  onClearFilters,
  onPrescribe,
}: DoctorPatientsTableProps) {
  const pageCount = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = rows.length === 0 ? 0 : rangeStart + rows.length - 1;
  const shownTotal = Math.max(total, rangeEnd);

  return (
    <Surface flush as="section" className="@container" aria-label="Patients">
      <div role="table" aria-label="Patients" aria-busy={loading}>
        <div
          role="row"
          className={cn(
            ROW_GRID,
            "hidden border-b border-hair py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted @3xl:grid",
          )}
        >
          <span role="columnheader">Patient</span>
          <span role="columnheader">Contact</span>
          <span role="columnheader">Visits</span>
          <span role="columnheader">Actions</span>
        </div>

        {loading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div role="row">
            <div role="cell">
              {hasFilters ? (
                <EmptyBlock
                  icon={SearchX}
                  title="No patients found"
                  description="No patient matches this search or these filters."
                  action={
                    <Button variant="outline" size="md" onClick={onClearFilters}>
                      Clear search and filters
                    </Button>
                  }
                />
              ) : (
                <EmptyBlock
                  icon={Users}
                  title="No patients yet"
                  description="Patients you see or register show here. Use “Register Patient” to add the first one."
                />
              )}
            </div>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              role="row"
              className={cn(
                ROW_GRID,
                "gap-y-3 border-b border-hair py-3.5 text-sm last:border-b-0 @3xl:min-h-[60px] @3xl:py-2",
              )}
            >
              <div role="cell" className={cn(FULL_ROW, "min-w-0")}>
                <CellTitle
                  left={<InitialsAvatar name={row.name} size={38} />}
                  title={
                    row.id ? (
                      <Link
                        href={`/doctor/patients/${encodeURIComponent(row.id)}`}
                        className="text-ink transition-colors hover:text-brand hover:underline focus-visible:text-brand focus-visible:underline focus-visible:outline-hidden"
                        aria-label={`Open EHR for ${row.name}`}
                        title="Open patient EHR"
                      >
                        {row.name}
                      </Link>
                    ) : (
                      row.name
                    )
                  }
                  description={[patientSummaryLine(row), row.uhid].filter(Boolean).join(" · ")}
                />
              </div>
              <div role="cell" className="min-w-0">
                <CellTitle title={row.phone || "No phone"} description={row.email || row.city || "No email"} />
              </div>
              <div role="cell" className="min-w-0">
                <CellTitle title={visitsLabel(row)} description={lastVisitLabel(row)} />
              </div>
              <div role="cell" className={cn(FULL_ROW, "flex min-w-0 flex-wrap items-center gap-2 @3xl:flex-nowrap")}>
                <Button asChild variant="outline">
                  <Link href={`/doctor/patients/${encodeURIComponent(row.id)}`} aria-label={`View EHR of ${row.name}`}>
                    <FileText />
                    View EHR
                  </Link>
                </Button>
                <Button variant="soft" onClick={() => onPrescribe(row)} aria-label={`Prescribe for ${row.name}`}>
                  <PillIcon />
                  Prescribe
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {loading || rows.length === 0 ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair px-5 py-3 text-[13px] text-ink-muted">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              Showing {rangeStart.toLocaleString("en-IN")}–{rangeEnd.toLocaleString("en-IN")} of{" "}
              {shownTotal.toLocaleString("en-IN")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span id="patients-page-size-label">Show</span>
              <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
                <SelectTrigger
                  className="h-[34px] w-[84px] rounded-xl border-line text-[13px] font-semibold"
                  aria-labelledby="patients-page-size-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATIENT_DIRECTORY_PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
            </span>
          </span>
          <nav aria-label="Pages" className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="whitespace-nowrap" aria-live="polite">
              Page {currentPage} of {pageCount}
            </span>
            <Button
              variant="outline"
              className="h-[34px]"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pageCount}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </Surface>
  );
}
