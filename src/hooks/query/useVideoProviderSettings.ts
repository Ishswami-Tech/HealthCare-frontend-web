import { useMutationOperation } from '../core/useMutationOperation';
import { useQueryData } from '../core/useQueryData';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import type { VideoProviderSettingResponse, VideoProviderType } from '@/types/video.types';

export const useGlobalVideoProviderSetting = () => {
  return useQueryData<VideoProviderSettingResponse>(
    ['video', 'admin', 'provider-settings'],
    async () => {
      const result = await clinicApiClient.get(API_ENDPOINTS.VIDEO.ADMIN.GET_PROVIDER_SETTINGS);
      return (result.data ?? result) as VideoProviderSettingResponse;
    }
  );
};

export const useUpdateGlobalVideoProviderSetting = () => {
  return useMutationOperation<VideoProviderSettingResponse, VideoProviderType>(
    async (provider) => {
      const result = await clinicApiClient.put(API_ENDPOINTS.VIDEO.ADMIN.UPDATE_PROVIDER_SETTINGS, { provider });
      return (result.data ?? result) as VideoProviderSettingResponse;
    },
    {
      toastId: TOAST_IDS.VIDEO.PROVIDER_SETTINGS,
      loadingMessage: 'Saving global video provider...',
      successMessage: 'Global video provider updated successfully',
      invalidateQueries: [['video', 'admin', 'provider-settings']],
    }
  );
};
