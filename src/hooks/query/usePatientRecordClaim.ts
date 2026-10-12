'use client';

import { useMutation } from '@tanstack/react-query';
import { useQueryData } from '@/hooks/core/useQueryData';
import { clinicApiClient } from '@/lib/api/client';

const CLAIM_PATH = '/auth/claim-record';

export interface ClaimRecordInput {
  fullName: string;
  /** The UHID, or the old patient number, printed on the clinic receipt or card. */
  uhid?: string;
  legacyRegistration?: string;
}

const UHID_SHAPE = /^[A-Za-z0-9]{2,8}-\d{9}$/;

/**
 * What is wrong with the typed details, in words the patient can act on, or null when they look
 * usable. Catches the usual slips before they cost an attempt (the server allows only a few):
 * the word "UHID" typed instead of the number, or digits and symbols typed into the name.
 */
export function describeClaimEntryProblem(fullName: string, receiptNumber: string): string | null {
  const name = fullName.trim();
  const number = receiptNumber.trim();
  if (name.length > 0 && !/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) {
    return "Use letters only in the name, as the clinic has it.";
  }
  if (number.length > 0 && !/\d/.test(number)) {
    return "Type the number printed on your receipt or card (for example CL0002-000012345), not the word UHID.";
  }
  return null;
}

/** Sends the typed receipt number as a UHID when it looks like one, else as the old patient number. */
export function toClaimInput(fullName: string, receiptNumber: string): ClaimRecordInput {
  const number = receiptNumber.trim();
  return UHID_SHAPE.test(number)
    ? { fullName: fullName.trim(), uhid: number.toUpperCase() }
    : { fullName: fullName.trim(), legacyRegistration: number };
}

/**
 * How many earlier clinic records (imported from the old register) are held under the patient's
 * verified mobile number. Only a number: the page shows the claim card when it is above zero.
 */
export function useClaimableRecords(userId: string, enabled: boolean) {
  return useQueryData<{ available: number }>(
    ['claimableRecords', userId],
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
