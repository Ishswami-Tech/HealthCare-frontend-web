'use client';

import { useEffect } from 'react';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import { useQueryData } from '@/hooks/core/useQueryData';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type {
  PatientDirectoryFacets,
  PatientDirectoryPage,
  PatientDirectoryParams,
  PatientDirectoryRow,
} from '@/types/patient-directory.types';

/** Query-string form of the filters: only the ones that are set. */
export function toDirectoryQuery(params: PatientDirectoryParams): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query[key] = String(value);
  }
  return query;
}

const DIRECTORY_STALE_MS = 30_000;

const fetchDirectoryPage = async (query: Record<string, string>): Promise<PatientDirectoryPage> => {
  const response = await clinicApiClient.get<PatientDirectoryPage>(
    API_ENDPOINTS.PATIENT_DIRECTORY.BASE,
    query
  );
  return response as unknown as PatientDirectoryPage;
};

/**
 * One page of the clinic's patients. Searching, filtering and paging happen on the server, so the
 * list stays fast with tens of thousands of patients.
 *
 * Caching: each page is kept for 30 seconds (going back or forward is instant), the previous page
 * stays on screen while the next one loads (typing does not flash the table empty), and the next page
 * is fetched in the background once the current one is shown.
 */
export function usePatientDirectory(
  clinicId: string,
  params: PatientDirectoryParams,
  options?: { enabled?: boolean }
) {
  const queryClient = useQueryClient();
  const query = toDirectoryQuery(params);
  const result = useQueryData<PatientDirectoryPage>(
    ['patientDirectory', clinicId, query],
    () => fetchDirectoryPage(query),
    {
      enabled: Boolean(clinicId) && (options?.enabled ?? true),
      placeholderData: keepPreviousData,
      staleTime: DIRECTORY_STALE_MS,
    }
  );

  const page = result.data;
  const nextPage = page && page.page < page.totalPages ? page.page + 1 : null;
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    if (!clinicId || nextPage === null) return;
    const nextQuery = { ...(JSON.parse(queryKey) as Record<string, string>), page: String(nextPage) };
    void queryClient.prefetchQuery({
      queryKey: ['patientDirectory', clinicId, nextQuery],
      queryFn: () => fetchDirectoryPage(nextQuery),
      staleTime: DIRECTORY_STALE_MS,
    });
  }, [clinicId, nextPage, queryKey, queryClient]);

  return result;
}

/** Cities, states, reference sources and case years to pick filters from. Rarely changes. */
export function usePatientDirectoryFacets(clinicId: string) {
  return useQueryData<PatientDirectoryFacets>(
    ['patientDirectoryFacets', clinicId],
    async () => {
      const response = await clinicApiClient.get<PatientDirectoryFacets>(
        API_ENDPOINTS.PATIENT_DIRECTORY.FACETS
      );
      return response as unknown as PatientDirectoryFacets;
    },
    { enabled: Boolean(clinicId), staleTime: 5 * 60_000 }
  );
}

/**
 * One patient's directory row: UHID, contact (including numbers kept outside the login), city and
 * visit summary. Used by the EHR header, and it works for any patient in the clinic (the list lookups
 * it replaces only covered the newest few hundred).
 */
export function usePatientDirectoryEntry(clinicId: string, patientId: string) {
  return useQueryData<PatientDirectoryRow>(
    ['patientDirectoryEntry', clinicId, patientId],
    async () => {
      const response = await clinicApiClient.get<PatientDirectoryRow>(
        `${API_ENDPOINTS.PATIENT_DIRECTORY.BASE}/${encodeURIComponent(patientId)}`
      );
      return response as unknown as PatientDirectoryRow;
    },
    { enabled: Boolean(clinicId && patientId), staleTime: 60_000, retry: false }
  );
}
