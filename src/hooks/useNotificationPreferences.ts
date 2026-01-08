/**
 * Notification Preferences Hooks
 * Dedicated hooks for managing notification preferences
 */

import { useQueryData } from './useQueryData';
import { useMutationData } from './useMutationData';
import {
  getNotificationSettings,
  updateNotificationSettings,
} from '@/lib/actions/notifications.server';
import { authenticatedApi } from '@/lib/actions/auth.server';
import { API_ENDPOINTS } from '@/lib/config/config';

/**
 * Hook to get notification preferences (current user)
 */
export const useNotificationPreferences = () => {
  return useQueryData(
    ['notificationPreferences', 'me'],
    async () => {
      const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_MY, {
        method: 'GET',
      });
      return data;
    }
  );
};

/**
 * Hook to get notification preferences for a user
 */
export const useUserNotificationPreferences = (userId: string) => {
  return useQueryData(
    ['notificationPreferences', userId],
    async () => {
      const { data } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.GET_BY_USER(userId), {
        method: 'GET',
      });
      return data;
    },
    { enabled: !!userId }
  );
};

/**
 * Hook to create notification preferences
 */
export const useCreateNotificationPreferences = () => {
  return useMutationData(
    ['createNotificationPreferences'],
    async (data: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      whatsapp?: boolean;
      types?: {
        appointments?: boolean;
        prescriptions?: boolean;
        reminders?: boolean;
        marketing?: boolean;
      };
    }) => {
      const { data: response } = await authenticatedApi(API_ENDPOINTS.NOTIFICATION_PREFERENCES.CREATE, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    },
    ['notificationPreferences']
  );
};

/**
 * Hook to update notification preferences
 */
export const useUpdateNotificationPreferences = () => {
  return useMutationData(
    ['updateNotificationPreferences'],
    async (data: {
      userId?: string;
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      whatsapp?: boolean;
      types?: {
        appointments?: boolean;
        prescriptions?: boolean;
        reminders?: boolean;
        marketing?: boolean;
      };
    }) => {
      const userId = data.userId;
      const updateData = { ...data };
      delete updateData.userId;
      
      const endpoint = userId
        ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE(userId)
        : API_ENDPOINTS.NOTIFICATION_PREFERENCES.UPDATE('me');
      
      const { data: response } = await authenticatedApi(endpoint, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response;
    },
    ['notificationPreferences']
  );
};

/**
 * Hook to delete notification preferences
 */
export const useDeleteNotificationPreferences = () => {
  return useMutationData(
    ['deleteNotificationPreferences'],
    async (userId?: string) => {
      const endpoint = userId
        ? API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE(userId)
        : API_ENDPOINTS.NOTIFICATION_PREFERENCES.DELETE('me');
      
      const { data } = await authenticatedApi(endpoint, {
        method: 'DELETE',
      });
      return data;
    },
    ['notificationPreferences']
  );
};



