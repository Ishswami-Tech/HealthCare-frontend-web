import { useQueryData, useMutationOperation } from '../core';
import { TOAST_IDS } from '../utils/use-toast';
import {
  createNotificationPreferences,
  deleteNotificationPreferences,
  getMyNotificationPreferences,
  getUserNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/actions/notifications.server';

export const useNotificationPreferences = () => {
  return useQueryData(
    ['notificationPreferences', 'me'],
    async () => {
      return await getMyNotificationPreferences();
    }
  );
};

export const useUserNotificationPreferences = (userId: string) => {
  return useQueryData(
    ['notificationPreferences', userId],
    async () => {
      return await getUserNotificationPreferences(userId);
    },
    { enabled: !!userId }
  );
};

export const useCreateNotificationPreferences = () => {
  return useMutationOperation(
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
      return await createNotificationPreferences(data);
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
      return await updateNotificationPreferences(data);
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
      return await deleteNotificationPreferences(userId);
    },
    {
      toastId: TOAST_IDS.NOTIFICATION.PREFERENCE_DELETE,
      loadingMessage: 'Deleting notification preferences...',
      successMessage: 'Notification preferences deleted successfully',
      invalidateQueries: [['notificationPreferences']],
    }
  );
};
