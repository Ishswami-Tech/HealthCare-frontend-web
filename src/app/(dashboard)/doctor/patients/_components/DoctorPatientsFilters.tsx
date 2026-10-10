"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { DateField, parseDateValue } from "@/components/appointments/manager/ManagerFilters";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBox, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { PatientDirectoryFacets } from "@/types/patient-directory.types";
import {
  AGE_BANDS,
  SORT_OPTIONS,
  countActiveFilters,
  hasAnyFilter,
  wholeYearOf,
  yearRange,
  type AgeBand,
  type DirectoryFilterState,
  type DirectoryGender,
  type MinVisits,
  type TriState,
} from "./directoryFilters";

const ALL = "__all__";
const TRIGGER = "h-10 w-full rounded-xl border-line text-[13px] font-semibold";

interface FieldSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  allLabel: string;
}

/** A labelled dropdown whose first entry means "no filter". */
function FieldSelect({ label, value, onChange, options, allLabel }: FieldSelectProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-extrabold uppercase tracking-[0.5px] text-ink-muted">{label}</span>
      <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)}>
        <SelectTrigger className={TRIGGER} aria-label={label}>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const withCount = (values: ReadonlyArray<{ value: string; count: number }> | undefined) =>
  (values ?? []).map((entry) => ({
    value: entry.value,
    label: `${entry.value} (${entry.count.toLocaleString("en-IN")})`,
  }));

export interface DoctorPatientsFiltersProps {
  filters: DirectoryFilterState;
  facets: PatientDirectoryFacets | undefined;
  onChange: (patch: Partial<DirectoryFilterState>) => void;
  onClear: () => void;
}

/**
 * Search box and filters of the patient list. The common ones are always visible; the rest sit under
 * "More filters" (a badge shows how many are on) so the page stays usable on a phone.
 */
export function DoctorPatientsFilters({ filters, facets, onChange, onClear }: DoctorPatientsFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeCount = countActiveFilters(filters);
  const sortValue = `${filters.sort}-${filters.order}`;
  const caseYear = wholeYearOf(filters.caseDateFrom, filters.caseDateTo);

  return (
    <Surface as="section" aria-label="Filter patients" className="!p-3.5 sm:!p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <SearchBox
            value={filters.search}
            onChange={(search) => onChange({ search })}
            placeholder="Search name, phone, UHID, OPD or register number…"
            ariaLabel="Search patients by name, phone, UHID, OPD number or register number"
            className="lg:min-w-0 lg:flex-1"
          />
          <div className="grid grid-cols-2 gap-2.5 lg:flex lg:items-center">
            <DateField
              value={filters.caseDateFrom}
              placeholder="Case date from"
              ariaLabel="Case date from"
              onChange={(caseDateFrom) => onChange({ caseDateFrom })}
              className="h-10 w-full rounded-xl lg:w-[158px]"
            />
            <DateField
              value={filters.caseDateTo}
              placeholder="Case date to"
              ariaLabel="Case date to"
              onChange={(caseDateTo) => onChange({ caseDateTo })}
              isDisabled={(date) => {
                const start = parseDateValue(filters.caseDateFrom);
                return Boolean(start) && date < (start as Date);
              }}
              className="h-10 w-full rounded-xl lg:w-[158px]"
            />
          </div>
          <Select
            value={sortValue}
            onValueChange={(value) => {
              const option = SORT_OPTIONS.find((entry) => entry.value === value);
              if (option) onChange({ sort: option.sort, order: option.order });
            }}
          >
            <SelectTrigger className={cn(TRIGGER, "lg:w-[176px]")} aria-label="Sort patients">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={filters.gender} onValueChange={(gender) => onChange({ gender: gender as DirectoryGender })}>
            <SelectTrigger className={cn(TRIGGER, "w-[140px]")} aria-label="Filter by gender">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.ageBand} onValueChange={(ageBand) => onChange({ ageBand: ageBand as AgeBand })}>
            <SelectTrigger className={cn(TRIGGER, "w-[140px]")} aria-label="Filter by age">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGE_BANDS.map((band) => (
                <SelectItem key={band.value} value={band.value}>
                  {band.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="md"
            className="h-10 rounded-xl"
            aria-expanded={moreOpen}
            aria-controls="patient-more-filters"
            onClick={() => setMoreOpen((open) => !open)}
          >
            <SlidersHorizontal />
            More filters
            {activeCount > 0 ? (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-extrabold text-white">
                {activeCount}
              </span>
            ) : null}
            <ChevronDown className={cn("transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
          </Button>
          {hasAnyFilter(filters) ? (
            <Button variant="ghost" size="md" className="h-10 rounded-xl" onClick={onClear}>
              <X />
              Clear all
            </Button>
          ) : null}
        </div>

        {moreOpen ? (
          <div
            id="patient-more-filters"
            className="grid grid-cols-1 gap-3 border-t border-hair pt-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <FieldSelect
              label="City"
              value={filters.city}
              onChange={(city) => onChange({ city })}
              options={withCount(facets?.cities)}
              allLabel="All cities"
            />
            <FieldSelect
              label="State"
              value={filters.state}
              onChange={(state) => onChange({ state })}
              options={withCount(facets?.states)}
              allLabel="All states"
            />
            <FieldSelect
              label="How they found us"
              value={filters.referenceSource}
              onChange={(referenceSource) => onChange({ referenceSource })}
              options={withCount(facets?.referenceSources)}
              allLabel="Any source"
            />
            <FieldSelect
              label="Case year"
              value={caseYear}
              onChange={(year) => {
                const range = year ? yearRange(year) : { from: "", to: "" };
                onChange({ caseDateFrom: range.from, caseDateTo: range.to });
              }}
              options={withCount(facets?.caseYears)}
              allLabel="Any year"
            />
            <FieldSelect
              label="Mobile number"
              value={filters.hasMobile === "all" ? "" : filters.hasMobile}
              onChange={(value) => onChange({ hasMobile: (value || "all") as TriState })}
              options={[
                { value: "yes", label: "Has a mobile number" },
                { value: "no", label: "No mobile number" },
              ]}
              allLabel="Any"
            />
            <FieldSelect
              label="Diagnosis"
              value={filters.hasDiagnosis === "all" ? "" : filters.hasDiagnosis}
              onChange={(value) => onChange({ hasDiagnosis: (value || "all") as TriState })}
              options={[
                { value: "yes", label: "Has a diagnosis" },
                { value: "no", label: "No diagnosis" },
              ]}
              allLabel="Any"
            />
            <FieldSelect
              label="Visits"
              value={filters.minVisits === "any" ? "" : filters.minVisits}
              onChange={(value) => onChange({ minVisits: (value || "any") as MinVisits })}
              options={[
                { value: "2", label: "2 or more visits" },
                { value: "5", label: "5 or more visits" },
              ]}
              allLabel="Any"
            />
          </div>
        ) : null}
      </div>
    </Surface>
  );
}
