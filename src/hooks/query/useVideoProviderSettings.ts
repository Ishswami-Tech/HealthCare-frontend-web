import { useMutationOperation, useQueryData } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  getGlobalVideoProviderSetting,
  updateGlobalVideoProviderSetting,
} from '@/lib/actions/video.server';
import type { VideoProviderSettingResponse, VideoProviderType } from '@/types/video.types';

export const useGlobalVideoProviderSetting = () => {
  return useQueryData<VideoProviderSettingResponse>(
    ['video', 'admin', 'provider-settings'],
    async () => {
      return await getGlobalVideoProviderSetting();
    }
  );
};

export const useUpdateGlobalVideoProviderSetting = () => {
  return useMutationOperation<VideoProviderSettingResponse, VideoProviderType>(
    async (provider) => {
      return await updateGlobalVideoProviderSetting(provider);
    },
    {
      toastId: TOAST_IDS.VIDEO.PROVIDER_SETTINGS,
      loadingMessage: 'Saving global video provider...',
      successMessage: 'Global video provider updated successfully',
      invalidateQueries: [['video', 'admin', 'provider-settings']],
    }
  );
};
