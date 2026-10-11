import {
  PATIENT_DIRECTORY_DEFAULT_PAGE_SIZE,
  type PatientDirectoryPageSize,
  type PatientDirectoryParams,
  type PatientDirectorySortField,
  type PatientDirectorySortOrder,
} from "@/types/patient-directory.types";

/** Fewer characters than this would match most of the clinic, so they are not sent. */
export const MIN_SEARCH_LENGTH = 2;

export type AgeBand = "all" | "child" | "young" | "adult" | "middle" | "senior";

export const AGE_BANDS: ReadonlyArray<{ value: AgeBand; label: string; min?: number; max?: number }> = [
  { value: "all", label: "All ages" },
  { value: "child", label: "Under 18", max: 17 },
  { value: "young", label: "18–30", min: 18, max: 30 },
  { value: "adult", label: "31–45", min: 31, max: 45 },
  { value: "middle", label: "46–60", min: 46, max: 60 },
  { value: "senior", label: "Over 60", min: 61 },
];

export type TriState = "all" | "yes" | "no";
export type MinVisits = "any" | "2" | "5";
export type DirectoryGender = "all" | "MALE" | "FEMALE";

/** Everything the filter bar can set. Strings are "" (or "all"/"any") when a filter is off. */
export interface DirectoryFilterState {
  search: string;
  gender: DirectoryGender;
  ageBand: AgeBand;
  city: string;
  state: string;
  referenceSource: string;
  caseDateFrom: string;
  caseDateTo: string;
  hasMobile: TriState;
  hasDiagnosis: TriState;
  minVisits: MinVisits;
  sort: PatientDirectorySortField;
  order: PatientDirectorySortOrder;
  page: number;
  pageSize: PatientDirectoryPageSize;
}

export const initialDirectoryFilters: DirectoryFilterState = {
  search: "",
  gender: "all",
  ageBand: "all",
  city: "",
  state: "",
  referenceSource: "",
  caseDateFrom: "",
  caseDateTo: "",
  hasMobile: "all",
  hasDiagnosis: "all",
  minVisits: "any",
  sort: "registered",
  order: "desc",
  page: 1,
  pageSize: PATIENT_DIRECTORY_DEFAULT_PAGE_SIZE,
};

export const SORT_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
  sort: PatientDirectorySortField;
  order: PatientDirectorySortOrder;
}> = [
  { value: "registered-desc", label: "Newest registered", sort: "registered", order: "desc" },
  { value: "registered-asc", label: "Oldest registered", sort: "registered", order: "asc" },
  { value: "lastVisit-desc", label: "Last visit (newest)", sort: "lastVisit", order: "desc" },
  { value: "lastVisit-asc", label: "Last visit (oldest)", sort: "lastVisit", order: "asc" },
  { value: "name-asc", label: "Name A–Z", sort: "name", order: "asc" },
  { value: "name-desc", label: "Name Z–A", sort: "name", order: "desc" },
  { value: "visits-desc", label: "Most visits", sort: "visits", order: "desc" },
];

/** The request for a filter state; `search` is the debounced text, sent only when long enough. */
export function toDirectoryParams(state: DirectoryFilterState, search: string): PatientDirectoryParams {
  const band = AGE_BANDS.find((entry) => entry.value === state.ageBand);
  const text = search.trim();
  return {
    ...(text.length >= MIN_SEARCH_LENGTH ? { search: text } : {}),
    ...(state.gender !== "all" ? { gender: state.gender } : {}),
    ...(band?.min !== undefined ? { ageMin: band.min } : {}),
    ...(band?.max !== undefined ? { ageMax: band.max } : {}),
    ...(state.city ? { city: state.city } : {}),
    ...(state.state ? { state: state.state } : {}),
    ...(state.referenceSource ? { referenceSource: state.referenceSource } : {}),
    ...(state.caseDateFrom ? { caseDateFrom: state.caseDateFrom } : {}),
    ...(state.caseDateTo ? { caseDateTo: state.caseDateTo } : {}),
    ...(state.hasMobile !== "all" ? { hasMobile: state.hasMobile === "yes" } : {}),
    ...(state.hasDiagnosis !== "all" ? { hasDiagnosis: state.hasDiagnosis === "yes" } : {}),
    ...(state.minVisits !== "any" ? { minVisits: Number(state.minVisits) } : {}),
    sort: state.sort,
    order: state.order,
    page: state.page,
    pageSize: state.pageSize,
  };
}

/** How many filters (not counting search and sort) are on, for the "More filters" badge. */
export function countActiveFilters(state: DirectoryFilterState): number {
  return [
    state.gender !== "all",
    state.ageBand !== "all",
    Boolean(state.city),
    Boolean(state.state),
    Boolean(state.referenceSource),
    Boolean(state.caseDateFrom || state.caseDateTo),
    state.hasMobile !== "all",
    state.hasDiagnosis !== "all",
    state.minVisits !== "any",
  ].filter(Boolean).length;
}

/** Any search text or filter is on (the empty state then offers to clear them). */
export function hasAnyFilter(state: DirectoryFilterState): boolean {
  return state.search.trim().length > 0 || countActiveFilters(state) > 0;
}

/** First and last day of a calendar year, for the "Case year" quick filter. */
export function yearRange(year: string): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** The year when the range is exactly one whole calendar year, else "". */
export function wholeYearOf(from: string, to: string): string {
  const match = /^(\d{4})-01-01$/.exec(from);
  return match && to === `${match[1]}-12-31` ? (match[1] as string) : "";
}
