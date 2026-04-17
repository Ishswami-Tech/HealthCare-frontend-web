/**
 * Queue mutations with cache-aware optimistic updates.
 *
 * The queue UI uses multiple filtered list queries, so optimistic updates must
 * patch all active queue list caches rather than one exact query key.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQueueStatus, callNextPatient } from '@/lib/actions/queue.server';

type QueueListItem = {
  id?: string;
  entryId?: string;
  patientId?: string;
  appointmentId?: string;
  status?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type QueueSnapshot = Array<readonly [readonly unknown[], unknown]>;

function captureQueueSnapshots(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.getQueriesData({
    queryKey: ['queue'],
    exact: false,
  });
}

function restoreQueueSnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots?: QueueSnapshot
) {
  snapshots?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
}

function updateQueueLists(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (items: QueueListItem[]) => QueueListItem[]
) {
  queryClient.setQueriesData(
    { queryKey: ['queue'], exact: false },
    (oldData: unknown) => {
      if (!Array.isArray(oldData)) {
        return oldData;
      }

      return updater(oldData as QueueListItem[]);
    }
  );
}

function invalidateQueueViews(
  queryClient: ReturnType<typeof useQueryClient>,
  clinicId?: string
) {
  void queryClient.invalidateQueries({ queryKey: ['queue'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['queue-status'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['myAppointments'], exact: false });
  void queryClient.invalidateQueries({ queryKey: ['appointments'], exact: false });

  if (clinicId) {
    void queryClient.invalidateQueries({ queryKey: ['queue', clinicId], exact: false });
  }
}

/**
 * Hook for updating queue status with optimistic updates across all active queue lists.
 */
export function useOptimisticUpdateQueueStatus(clinicId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ patientId, status }: { patientId: string; status: string }) => {
      const result = await updateQueueStatus(patientId, status) as {
        success?: boolean;
        error?: string;
        data?: unknown;
      } | null;

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to update queue status');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['queue'], exact: false });

      const snapshots = captureQueueSnapshots(queryClient);

      updateQueueLists(queryClient, (items) =>
        items.map((item) => {
          const matches =
            item.patientId === variables.patientId ||
            item.id === variables.patientId ||
            item.entryId === variables.patientId;

          return matches
            ? {
                ...item,
                status: variables.status,
                updatedAt: new Date().toISOString(),
              }
            : item;
        })
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      restoreQueueSnapshots(queryClient, context?.snapshots);
    },
    onSettled: () => {
      invalidateQueueViews(queryClient, clinicId);
    },
  });

  return {
    mutation,
    isPending: mutation.isPending,
  };
}

/**
 * Hook for calling the next patient with optimistic removal from active queue lists.
 */
export function useOptimisticCallNextPatient(clinicId?: string, doctorId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => {
      if (!doctorId) throw new Error('Doctor ID is required');
      if (!appointmentId) throw new Error('Appointment ID is required');

      const result = await callNextPatient(doctorId, appointmentId) as {
        success?: boolean;
        error?: string;
        data?: unknown;
      } | null;

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to call next patient');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['queue'], exact: false });

      const snapshots = captureQueueSnapshots(queryClient);

      updateQueueLists(queryClient, (items) =>
        items.filter((item) => item.appointmentId !== variables.appointmentId)
      );

      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      restoreQueueSnapshots(queryClient, context?.snapshots);
    },
    onSettled: () => {
      invalidateQueueViews(queryClient, clinicId);
    },
  });

  return {
    mutation,
    isPending: mutation.isPending,
  };
}
