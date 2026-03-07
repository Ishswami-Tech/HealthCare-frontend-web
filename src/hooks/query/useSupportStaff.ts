import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getSupportRequests,
  createSupportRequest,
  updateSupportRequest,
  deleteSupportRequest,
} from '@/lib/actions/support-staff.server';
import type { SupportRequest } from '@/types/medical-records.types';

/**
 * Hook to get all support requests
 */
export const useSupportStaffRequests = (staffId?: string, filters?: {
  status?: string;
  priority?: string;
  type?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQueryData(
    ['supportStaffRequests', staffId, filters],
    async () => await getSupportRequests(staffId, filters),
    {
      enabled: !!staffId,
    }
  );
};

/**
 * Hook to create a new support request
 */
export const useCreateSupportRequest = () => {
  return useMutationOperation(
    async (requestData: SupportRequest) => {
      return await createSupportRequest(requestData);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Creating request...',
      successMessage: 'Request created successfully',
      invalidateQueries: [['supportStaffRequests']],
    }
  );
};

/**
 * Hook to update a support request
 */
export const useUpdateSupportRequest = () => {
  return useMutationOperation(
    async ({ requestId, updates }: { requestId: string; updates: Partial<SupportRequest> }) => {
      return await updateSupportRequest(requestId, updates);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Updating request...',
      successMessage: 'Request updated successfully',
      invalidateQueries: [['supportStaffRequests']],
    }
  );
};

/**
 * Hook to delete a support request
 */
export const useDeleteSupportRequest = () => {
  return useMutationOperation(
    async (requestId: string) => {
      return await deleteSupportRequest(requestId);
    },
    {
      toastId: TOAST_IDS.QUEUE.UPDATE,
      loadingMessage: 'Deleting request...',
      successMessage: 'Request deleted successfully',
      invalidateQueries: [['supportStaffRequests']],
    }
  );
};
