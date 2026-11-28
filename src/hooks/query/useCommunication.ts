/**
 * ✅ Communication & Notification Sending Hooks
 * 
 * Hooks for sending notifications and communications (not reading)
 * - Sending push notifications and emails
 * - Communication statistics
 * 
 * Note: For reading notifications, use @/hooks/query/useNotifications
 */

import { useQueryData } from '../core/useQueryData';
import { useMutationOperation } from '../core/useMutationOperation';
import { clinicApiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/config/config';
import {
  submitContactForm,
  submitConsultationBooking,
} from '@/lib/utils/communication-public';
import { TOAST_IDS } from '@/hooks/utils/use-toast';


// ===== UNIFIED COMMUNICATION HOOKS =====

/**
 * Hook to send unified communication
 */
export const useSendUnifiedCommunication = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.SEND, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.SEND,
      loadingMessage: 'Sending communication...',
      successMessage: 'Communication sent successfully',
      invalidateQueries: [['communication']],
    }
  );
};

/**
 * Hook to send appointment reminder
 */
export const useSendAppointmentReminder = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.APPOINTMENT_REMINDER, data),
    {
      toastId: TOAST_IDS.APPOINTMENT.REMINDER,
      loadingMessage: 'Sending reminder...',
      successMessage: 'Reminder sent successfully',
      invalidateQueries: [['communication']],
    }
  );
};

// ===== PUSH NOTIFICATION HOOKS =====

/**
 * Hook to send push notification
 */
export const useSendPushNotification = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.PUSH.SEND, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.PUSH,
      loadingMessage: 'Sending push notification...',
      successMessage: 'Push notification sent successfully',
      invalidateQueries: [['communication', 'push']],
    }
  );
};

/**
 * Hook to send multiple push notifications
 */
export const useSendMultiplePushNotifications = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.PUSH.SEND_MULTIPLE, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.PUSH_BULK,
      loadingMessage: 'Sending push notifications...',
      successMessage: 'Push notifications sent successfully',
      invalidateQueries: [['communication', 'push']],
    }
  );
};

/**
 * Hook to send topic-based push notification
 */
export const useSendTopicPushNotification = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.PUSH.SEND_TOPIC, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.PUSH_TOPIC,
      loadingMessage: 'Sending topic notification...',
      successMessage: 'Topic notification sent successfully',
      invalidateQueries: [['communication', 'push']],
    }
  );
};

/**
 * Hook to subscribe to topic
 */
export const useSubscribeToTopic = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.PUSH.SUBSCRIBE, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.TOPIC_SUB,
      loadingMessage: 'Subscribing to topic...',
      successMessage: 'Subscribed to topic successfully',
      invalidateQueries: [['communication', 'push']],
    }
  );
};

/**
 * Hook to unsubscribe from topic
 */
export const useUnsubscribeFromTopic = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.PUSH.UNSUBSCRIBE, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.TOPIC_UNSUB,
      loadingMessage: 'Unsubscribing from topic...',
      successMessage: 'Unsubscribed from topic successfully',
      invalidateQueries: [['communication', 'push']],
    }
  );
};

// ===== EMAIL HOOKS =====

/**
 * Hook to send email
 */
export const useSendEmail = () => {
  return useMutationOperation(
    async (emailData: {
      to: string | string[];
      subject: string;
      content: string;
      templateId?: string;
      variables?: Record<string, string>;
      attachments?: Array<{
        filename: string;
        content: string;
        contentType: string;
      }>;
    }) => {
      return await clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.EMAIL.SEND, emailData);
    },
    {
      toastId: TOAST_IDS.COMMUNICATION.EMAIL,
      loadingMessage: 'Sending email...',
      successMessage: 'Email sent successfully',
      invalidateQueries: [['communication']],
    }
  );
};

// ===== CHAT HOOKS =====

/**
 * Hook to backup chat messages
 */
export const useBackupChat = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.CHAT.BACKUP, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.CHAT_BACKUP,
      loadingMessage: 'Backing up chat...',
      successMessage: 'Chat backed up successfully',
      invalidateQueries: [['communication', 'chat']],
    }
  );
};

/**
 * Hook to get chat history
 */
export const useChatHistory = (
  userId: string,
  filters?: any
) => {
  return useQueryData(
    ['communication', 'chat', 'history', userId, filters],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.COMMUNICATION.CHAT.HISTORY(userId), filters);
    },
    { enabled: !!userId }
  );
};

/**
 * Hook to get chat statistics
 */
export const useChatStats = (filters?: any) => {
  return useQueryData(
    ['communication', 'chat', 'stats', filters],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.COMMUNICATION.CHAT.STATS, filters);
    }
  );
};

// ===== STATS & HEALTH HOOKS =====

/**
 * Hook to get communication statistics
 */
export const useCommunicationStats = (
  filters?: any
) => {
  return useQueryData(
    ['communication', 'stats', filters],
    async () => {
      return await clinicApiClient.get(API_ENDPOINTS.COMMUNICATION.STATS, filters);
    }
  );
};

/**
 * Hook to get communication health status
 */
export const useCommunicationHealth = () => {
  return useQueryData(['communication', 'health'], async () => {
    return await clinicApiClient.get(API_ENDPOINTS.COMMUNICATION.HEALTH);
  });
};

/**
 * Hook to test communication service
 */
export const useTestCommunication = () => {
  return useMutationOperation(
    async (data: any) => clinicApiClient.post(API_ENDPOINTS.COMMUNICATION.TEST, data),
    {
      toastId: TOAST_IDS.COMMUNICATION.TEST,
      loadingMessage: 'Testing communication...',
      successMessage: 'Communication test successful',
      invalidateQueries: [['communication']],
    }
  );
};

// ===== NOTIFICATION HOOKS =====
// Note: Notification reading/actions are in @/hooks/query/useNotifications
// These hooks are for sending notifications only (admin/testing)

// No /messaging/* routes exist on the backend (SMS / WhatsApp / templates / scheduling are
// server-side only), so there are no messaging hooks here.

// ===== CONTACT FORM HOOKS =====

/**
 * Hook to submit contact form
 */
export const useSubmitContactForm = () => {
  return useMutationOperation(
    async (data: Parameters<typeof submitContactForm>[0]) => {
      const result = await submitContactForm(data);
      return result;
    },
    {
      toastId: TOAST_IDS.CONTACT.SUBMIT,
      loadingMessage: 'Preparing message...',
      successMessage: 'Message draft opened successfully',
    }
  );
};

/**
 * Hook to submit consultation booking
 */
export const useSubmitConsultationBooking = () => {
  return useMutationOperation(
    async (data: Parameters<typeof submitConsultationBooking>[0]) => {
      const result = await submitConsultationBooking(data);
      return result;
    },
    {
      toastId: TOAST_IDS.APPOINTMENT.BOOKING,
      loadingMessage: 'Preparing consultation message...',
      successMessage: 'Consultation draft opened successfully',
    }
  );
};
