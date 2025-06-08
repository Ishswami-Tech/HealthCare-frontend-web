import { MutationKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ApiResponse<T> {
  status: number;
  data: T;
}

export const useMutationData = <TData = unknown, TVariables = unknown>(
  mutationKey: MutationKey,
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  queryKey?: string,
  onSuccess?: (data: ApiResponse<TData>) => void
) => {
  const client = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationKey,
    mutationFn,
    onSuccess(data: ApiResponse<TData>) {
      if (onSuccess) onSuccess(data);
      return toast(data.status === 200 ? 'Success' : 'Error', {
        description: String(data.data),
      });
    },
    onSettled: async () => {
      if (queryKey) {
        return await client.invalidateQueries({ queryKey: [queryKey] });
      }
    },
  });

  return { mutate, isPending };
};