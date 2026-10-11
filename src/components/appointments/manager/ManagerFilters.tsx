"use client";

import { DateField, FilterChips, SearchBox } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import type { ManagerDateRange, ManagerStatusFilter } from "./types";

/** Search, date range and (where a tab has more than one status) status chips. */
export function ManagerFilters({
  id,
  search,
  onSearchChange,
  searchPlaceholder,
  dateRange,
  onDateRangeChange,
  statusOptions,
  status,
  onStatusChange,
  hasActiveFilters,
  onClear,
}: {
  id: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  dateRange: ManagerDateRange;
  onDateRangeChange: (range: ManagerDateRange) => void;
  statusOptions: Array<{ value: ManagerStatusFilter; label: string }>;
  status: ManagerStatusFilter;
  onStatusChange: (value: ManagerStatusFilter) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div id={id} className="flex flex-col gap-3" role="search" aria-label="Filter appointments">
      <div className="flex flex-col gap-2.5 @3xl:flex-row @3xl:items-center">
        <SearchBox
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="@3xl:max-w-[360px]"
        />
        <div className="grid grid-cols-2 gap-2.5 @3xl:flex">
          <DateField
            variant="placeholder"
            id={`${id}-from`}
            label="From date"
            value={dateRange.start}
            max={dateRange.end || undefined}
            onChange={(start) => onDateRangeChange({ ...dateRange, start })}
            className="w-full @3xl:w-[168px]"
          />
          <DateField
            variant="placeholder"
            id={`${id}-to`}
            label="To date"
            value={dateRange.end}
            min={dateRange.start || undefined}
            onChange={(end) => onDateRangeChange({ ...dateRange, end })}
            className="w-full @3xl:w-[168px]"
          />
        </div>
        {hasActiveFilters ? (
          <Button variant="ghost" size="md" onClick={onClear} className="text-brand @3xl:ml-auto">
            Clear filters
          </Button>
        ) : null}
      </div>
      {statusOptions.length > 0 ? (
        <FilterChips options={statusOptions} value={status} onChange={onStatusChange} ariaLabel="Status" />
      ) : null}
    </div>
  );
}
