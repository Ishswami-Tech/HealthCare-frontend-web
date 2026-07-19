import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { TOAST_IDS } from '../utils/use-toast';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';

export const useNotificationPreferences = () => {
  return useQueryData(
    ['notificationPreferences', 'me'],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_MY);
    }
  );
};

export const useUserNotificationPreferences = (userId: string) => {
  return useQueryData(
    ['notificationPreferences', userId],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_BY_USER(userId));
    },
    { enabled: !!userId }
  );
};

export const useCreateNotificationPreferences = () => {
  return useMutationOperation(
    async (data: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      whatsappEnabled?: boolean;
      socketEnabled?: boolean;
      appointmentEnabled?: boolean;
      ehrEnabled?: boolean;
      billingEnabled?: boolean;
      systemEnabled?: boolean;
    }) => {
      return await clinicApiClient.post(API_ENDPOINTS.NOTIFICATION_PREFERENCES.BASE, data);
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.PREFERENCE_CREATE,
      loadingMessage: 'Creating notification preferences...',
      successMessage: 'Notification preferences created successfully',
      invalidateQueries: [['notificationPreferences']],
    }
  );
};

export const useUpdateNotificationPreferences = () => {
  return useMutationOperation(
    async (data: {
      userId?: string;
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      whatsappEnabled?: boolean;
      socketEnabled?: boolean;
      appointmentEnabled?: boolean;
      ehrEnabled?: boolean;
      billingEnabled?: boolean;
      systemEnabled?: boolean;
    }) => {
      const { userId, ...payload } = data;
      const endpoint = userId
        ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE(userId)
        : API_ENDPOINTS.NOTIFICATION_PREFERENCES.BASE;
      return await clinicApiClient.put(endpoint, payload);
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.PREFERENCE_UPDATE,
      loadingMessage: 'Updating notification preferences...',
      successMessage: 'Notification preferences updated successfully',
      invalidateQueries: [['notificationPreferences']],
    }
  );
};

export const useDeleteNotificationPreferences = () => {
  return useMutationOperation(
    async (userId?: string) => {
      const endpoint = userId
        ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE(userId)
        : API_ENDPOINTS.NOTIFICATION_PREFERENCES.BASE;
      return await clinicApiClient.delete(endpoint);
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.PREFERENCE_DELETE,
      loadingMessage: 'Deleting notification preferences...',
      successMessage: 'Notification preferences deleted successfully',
      invalidateQueries: [['notificationPreferences']],
    }
  );
};
