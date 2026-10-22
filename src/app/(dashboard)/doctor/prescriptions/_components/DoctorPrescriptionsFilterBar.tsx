"use client";

import type { Ref } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChoiceChip, DateField, SearchBox, SegTabs, TBD_SURFACE, type TbdOption } from "@/components/tbd";
import { cn } from "@/lib/utils";
import {
  DATE_PRESET_OPTIONS,
  SORT_OPTIONS,
  STAGE_OPTIONS,
  type SortFilter,
  type StageFilter,
  type StatusFilter,
} from "./doctor-prescriptions.filters";
import type { DoctorRxFilterState } from "./useDoctorPrescriptionFilters";

export interface DoctorPrescriptionsFilterBarProps {
  filterState: DoctorRxFilterState;
  filtersActive: boolean;
  /** Shows the Drafts tab (the doctor has drafts waiting). */
  showDrafts: boolean;
  /** Today's IST day key, the latest day the custom range may end on. */
  todayKey: string;
  /** The view measures the bar to stick the table header right under it. */
  ref?: Ref<HTMLDivElement>;
}

const SELECT_TRIGGER =
  "h-9 rounded-[10px] px-3 text-[13px] font-semibold text-ink data-[size=sm]:h-9 md:w-auto";

/**
 * Search, date presets, status, pharmacy stage and sort. Sticks to the top of the page's
 * scroll area from md up (under the app header, never over the navigation).
 */
export function DoctorPrescriptionsFilterBar({
  filterState,
  filtersActive,
  showDrafts,
  todayKey,
  ref,
}: DoctorPrescriptionsFilterBarProps) {
  const { filters, searchInput, setSearchInput, update, clear } = filterState;

  const statusOptions: TbdOption<StatusFilter>[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    ...(showDrafts || filters.status === "draft" ? [{ value: "draft" as const, label: "Drafts" }] : []),
  ];

  return (
    <div
      ref={ref}
      role="search"
      aria-label="Filter prescriptions"
      className={cn(TBD_SURFACE, "z-20 flex flex-col gap-2.5 p-3 md:sticky md:top-0")}
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <SearchBox
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search patient, phone, UHID, Rx no, medicine or diagnosis…"
          ariaLabel="Search prescriptions"
          className="min-h-10 lg:flex-1"
        />
        <SegTabs
          options={statusOptions}
          value={filters.status}
          onChange={(status) => update({ status })}
          ariaLabel="Filter by status"
          className="[&>button]:min-h-8 [&>button]:px-3 [&>button]:text-[13px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Date" className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESET_OPTIONS.map((option) => (
            <ChoiceChip
              key={option.value}
              size="sm"
              active={filters.date === option.value}
              onClick={() =>
                update(
                  option.value === "custom" && !filters.from && !filters.to && todayKey
                    ? { date: "custom", from: todayKey, to: todayKey }
                    : { date: option.value },
                )
              }
            >
              {option.label}
            </ChoiceChip>
          ))}
        </div>

        {filters.date === "custom" ? (
          <div className="flex items-center gap-1.5">
            <DateField
              id="rx-date-from"
              variant="inline"
              label="From"
              value={filters.from}
              max={filters.to || todayKey || undefined}
              onChange={(from) => update({ from })}
              className="min-h-9 [&_input]:text-[13px]"
            />
            <DateField
              id="rx-date-to"
              variant="inline"
              label="To"
              value={filters.to}
              min={filters.from || undefined}
              max={todayKey || undefined}
              onChange={(to) => update({ to })}
              className="min-h-9 [&_input]:text-[13px]"
            />
          </div>
        ) : null}

        <div className="flex w-full flex-wrap items-center gap-2 md:ml-auto md:w-auto">
          <Select value={filters.stage} onValueChange={(stage) => update({ stage: stage as StageFilter })}>
            <SelectTrigger size="sm" aria-label="Pharmacy stage" className={cn(SELECT_TRIGGER, "min-w-[150px] flex-1")}>
              <SelectValue placeholder="Pharmacy stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={(sort) => update({ sort: sort as SortFilter })}>
            <SelectTrigger size="sm" aria-label="Sort" className={cn(SELECT_TRIGGER, "min-w-[130px] flex-1")}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              <X aria-hidden="true" />
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
