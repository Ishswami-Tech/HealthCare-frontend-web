/** The staff patient list (GET /patient-directory): rows, paging and the filter values on offer. */

export const PATIENT_DIRECTORY_PAGE_SIZES = [10, 50, 200, 500] as const;
export type PatientDirectoryPageSize = (typeof PATIENT_DIRECTORY_PAGE_SIZES)[number];
export const PATIENT_DIRECTORY_DEFAULT_PAGE_SIZE: PatientDirectoryPageSize = 50;

export type PatientDirectorySortField = 'name' | 'registered' | 'lastVisit' | 'firstVisit' | 'visits';
export type PatientDirectorySortOrder = 'asc' | 'desc';
export type PatientDirectoryGender = 'MALE' | 'FEMALE' | 'OTHER';

/** What the server is asked for; every field is optional and empty ones are not sent. */
export interface PatientDirectoryParams {
  search?: string;
  gender?: PatientDirectoryGender;
  ageMin?: number;
  ageMax?: number;
  city?: string;
  state?: string;
  referenceSource?: string;
  /** First and last day (YYYY-MM-DD) of the case date range. */
  caseDateFrom?: string;
  caseDateTo?: string;
  hasMobile?: boolean;
  hasDiagnosis?: boolean;
  minVisits?: number;
  sort?: PatientDirectorySortField;
  order?: PatientDirectorySortOrder;
  page?: number;
  pageSize?: PatientDirectoryPageSize;
}

export interface PatientDirectoryRow {
  patientId: string;
  userId: string;
  name: string;
  gender: string | null;
  age: number | null;
  dateOfBirth: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  uhid: string | null;
  legacyRegistration: string | null;
  totalVisits: number;
  firstVisit: string | null;
  lastVisit: string | null;
  referenceSource: string | null;
  registeredAt: string;
}

export interface PatientDirectoryPage {
  rows: PatientDirectoryRow[];
  total: number;
  page: number;
  pageSize: PatientDirectoryPageSize;
  totalPages: number;
}

export interface PatientDirectoryFacetValue {
  value: string;
  count: number;
}

export interface PatientDirectoryFacets {
  cities: PatientDirectoryFacetValue[];
  states: PatientDirectoryFacetValue[];
  referenceSources: PatientDirectoryFacetValue[];
  caseYears: PatientDirectoryFacetValue[];
}
