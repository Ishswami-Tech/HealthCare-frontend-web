/**
 * Queue mutations with cache-aware optimistic updates.
 *
 * The queue UI uses multiple filtered list queries, so optimistic updates must
 * patch all active queue list caches rather than one exact query key.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateQueueStatus, callNextPatient } from '@/lib/actions/queue.server';
import { nowIso } from '@/lib/utils/date-time';
import { dedupeRequest } from '@/hooks/core/requestDeduper';

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
    mutationFn: (variables: { patientId: string; status: string }) =>
      dedupeRequest('mutation', ['queueStatus', clinicId, variables], async () => {
        const result = await updateQueueStatus(variables.patientId, variables.status) as {
          success?: boolean;
          error?: string;
          data?: unknown;
        } | null;

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to update queue status');
        }

        return result.data;
      }),
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
              updatedAt: nowIso(),
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

  const dedupedMutation = {
    ...mutation,
    mutate: (variables: { patientId: string; status: string }, customOptions?: any) => {
      void dedupeRequest('mutation', ['queueStatus', clinicId, variables], () =>
        mutation.mutateAsync(variables, customOptions)
      );
    },
    mutateAsync: (variables: { patientId: string; status: string }, customOptions?: any) =>
      dedupeRequest('mutation', ['queueStatus', clinicId, variables], () =>
        mutation.mutateAsync(variables, customOptions)
      ),
  };

  return {
    mutation: dedupedMutation,
    isPending: mutation.isPending,
  };
}

/**
 * Hook for calling the next patient with optimistic removal from active queue lists.
 */
export function useOptimisticCallNextPatient(clinicId?: string, doctorId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (variables: { appointmentId: string }) =>
      dedupeRequest('mutation', ['callNextPatient', clinicId, doctorId, variables], async () => {
        if (!doctorId) throw new Error('Doctor ID is required');
        if (!variables.appointmentId) throw new Error('Appointment ID is required');

        const result = await callNextPatient(doctorId, variables.appointmentId) as {
          success?: boolean;
          error?: string;
          data?: unknown;
        } | null;

        if (!result?.success) {
          throw new Error(result?.error || 'Failed to call next patient');
        }

        return result.data;
      }),
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

  const dedupedMutation = {
    ...mutation,
    mutate: (variables: { appointmentId: string }, customOptions?: any) => {
      void dedupeRequest('mutation', ['callNextPatient', clinicId, doctorId, variables], () =>
        mutation.mutateAsync(variables, customOptions)
      );
    },
    mutateAsync: (variables: { appointmentId: string }, customOptions?: any) =>
      dedupeRequest('mutation', ['callNextPatient', clinicId, doctorId, variables], () =>
        mutation.mutateAsync(variables, customOptions)
      ),
  };

  return {
    mutation: dedupedMutation,
    isPending: mutation.isPending,
  };
}
