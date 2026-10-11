'use client';

import { useMutation } from '@tanstack/react-query';
import { useQueryData } from '@/hooks/core/useQueryData';
import { clinicApiClient } from '@/lib/api/client';

const CLAIM_PATH = '/auth/claim-record';

export interface ClaimRecordInput {
  fullName: string;
  uhid?: string;
  legacyRegistration?: string;
}

/**
 * How many earlier clinic records (imported from the old register) are held under the patient's
 * verified mobile number. Only a number: the page shows the claim card when it is above zero.
 */
export function useClaimableRecords(enabled: boolean) {
  return useQueryData<{ available: number }>(
    ['claimableRecords'],
    async () => {
      const response = await clinicApiClient.get<{ available: number }>(`${CLAIM_PATH}/available`);
      return response as unknown as { available: number };
    },
    { enabled, staleTime: 5 * 60_000, retry: false }
  );
}

/** Links the earlier record to this sign-in. The server ends this session; the patient signs in again. */
export function useClaimRecord() {
  return useMutation({
    mutationFn: async (input: ClaimRecordInput) => {
      const response = await clinicApiClient.post<{ claimed: boolean; requiresSignIn: boolean }>(CLAIM_PATH, input);
      if ((response as { error?: string }).error) {
        throw new Error((response as { error?: string }).error);
      }
      return response as unknown as { claimed: boolean; requiresSignIn: boolean };
    },
  });
}
