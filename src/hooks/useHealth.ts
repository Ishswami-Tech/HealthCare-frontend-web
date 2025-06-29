import { useQueryData } from './useQueryData';
import { getHealthStatus } from '@/lib/actions/health.server';

export const useHealthStatus = () => {
  return useQueryData<{ status: string; details?: any }>(
    ['healthStatus'],
    getHealthStatus,
    { refetchInterval: 60 * 1000 } // Poll every 60 seconds
  );
}; 