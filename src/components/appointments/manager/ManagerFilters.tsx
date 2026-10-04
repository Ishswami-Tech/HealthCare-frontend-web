"use client";

import { Calendar } from "lucide-react";
import { FilterChips, SearchBox } from "@/components/tbd";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDateInIST } from "@/lib/utils/appointmentUtils";
import type { ManagerDateRange, ManagerStatusFilter } from "./types";

export function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toDateString(date?: Date): string {
  if (!date) return "";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateValue(value: string, placeholder: string): string {
  const parsed = parseDateValue(value);
  return parsed ? formatDateInIST(parsed, { day: "2-digit", month: "short", year: "numeric" }) : placeholder;
}

/** A date button that opens a calendar. */
export function DateField({
  value,
  placeholder,
  ariaLabel,
  onChange,
  isDisabled,
  className,
}: {
  value: string;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  isDisabled?: (date: Date) => boolean;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="md"
          aria-label={value ? `${ariaLabel}: ${formatDateValue(value, placeholder)}` : ariaLabel}
          className={cn("justify-start font-semibold", !value && "text-ink-muted", className)}
        >
          <Calendar className="text-brand" aria-hidden="true" />
          <span className="truncate">{formatDateValue(value, placeholder)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border border-line bg-popover p-3 shadow-xl" align="start" sideOffset={8}>
        <CalendarPicker
          mode="single"
          selected={parseDateValue(value)}
          onSelect={(date) => onChange(toDateString(date))}
          {...(isDisabled ? { disabled: isDisabled } : {})}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

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
            value={dateRange.start}
            placeholder="From date"
            ariaLabel="From date"
            onChange={(start) => onDateRangeChange({ ...dateRange, start })}
            className="w-full @3xl:w-[168px]"
          />
          <DateField
            value={dateRange.end}
            placeholder="To date"
            ariaLabel="To date"
            onChange={(end) => onDateRangeChange({ ...dateRange, end })}
            isDisabled={(date) => {
              const start = parseDateValue(dateRange.start);
              return Boolean(start) && date < (start as Date);
            }}
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
