/**
 * ✅ Centralized Toast Hook
 * Wraps Sonner toast with duplicate prevention and error sanitization
 * Follows DRY principle - single source of truth for all toast operations
 * Uses Sonner (already configured in AppProvider via @/components/ui/sonner)
 */

"use client"

import { toast as sonnerToast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/config/config';
import { sanitizeErrorMessage } from '@/lib/utils/error-handler';

// Toast ID constants to prevent duplicates
export const TOAST_IDS = {
  AUTH: {
    LOGIN: 'auth-login',
    REGISTER: 'auth-register',
    LOGOUT: 'auth-logout',
    FORGOT_PASSWORD: 'auth-forgot-password',
    RESET_PASSWORD: 'auth-reset-password',
    OTP: 'auth-otp',
    SOCIAL_LOGIN: 'auth-social-login',
  },
  SESSION: {
    TERMINATE: 'session-terminate',
    TERMINATE_ALL: 'session-terminate-all',
    REFRESH: 'session-refresh',
  },
  VERIFICATION: {
    EMAIL: 'verification-email',
    OTP: 'verification-otp',
    PHONE: 'verification-phone',
  },
  PROFILE: {
    UPDATE: 'profile-update',
    COMPLETE: 'profile-complete',
  },
  APPOINTMENT: {
    CREATE: 'appointment-create',
    UPDATE: 'appointment-update',
    DELETE: 'appointment-delete',
    BULK_UPDATE: 'appointment-bulk-update',
    START: 'appointment-start',
    COMPLETE: 'appointment-complete',
    CANCEL: 'appointment-cancel',
    REMINDER: 'appointment-reminder',
    BOOKING: 'consultation-booking',
  },
  COMMUNICATION: {
    SEND: 'communication-send',
    PRESCRIPTION: 'prescription-ready',
    PUSH: 'push-notification',
    PUSH_BULK: 'push-notification-bulk',
    PUSH_TOPIC: 'push-notification-topic',
    TOPIC_SUB: 'topic-subscribe',
    TOPIC_UNSUB: 'topic-unsubscribe',
    EMAIL: 'email-send',
    SMS: 'sms-send',
    WHATSAPP: 'whatsapp-send',
    CHAT_BACKUP: 'chat-backup',
    TEST: 'communication-test',
    TEMPLATE_CREATE: 'template-create',
    TEMPLATE_UPDATE: 'template-update',
    TEMPLATE_DELETE: 'template-delete',
    SCHEDULE: 'message-schedule',
    CANCEL_SCHEDULE: 'message-cancel',
    CONSULTATION: 'consultation-booking',
  },
  VIDEO: {
    JOIN: 'video-join',
    END: 'video-end',
    ERROR: 'video-error',
    PERMISSION: 'video-permission',
  },
  PAYMENT: {
    SUCCESS: 'payment-success',
    ERROR: 'payment-error',
    CANCELLED: 'payment-cancelled',
    PROCESSING: 'payment-processing',
  },
  PATIENT: {
    CREATE: 'patient-create',
    UPDATE: 'patient-update',
    DELETE: 'patient-delete',
  },
  CLINIC: {
    CREATE: 'clinic-create',
    UPDATE: 'clinic-update',
    DELETE: 'clinic-delete',
  },
  LOCATION: {
    CREATE: 'location-create',
    UPDATE: 'location-update',
    DELETE: 'location-delete',
  },
  USER: {
    CREATE: 'user-create',
    UPDATE: 'user-update',
    DELETE: 'user-delete',
  },
  CONTACT: {
    SUBMIT: 'contact-submit',
  },
  NOTIFICATION: {
    PREFERENCE_UPDATE: 'notification-preference-update',
    PREFERENCE_CREATE: 'notification-preference-create',
    PREFERENCE_DELETE: 'notification-preference-delete',
    FCM_ERROR: 'notification-fcm-error',
    PERMISSION_DENIED: 'notification-permission-denied',
    NEW: 'notification-new',
  },
  MEDICAL_RECORD: {
    CREATE: 'medical-record-create',
    UPDATE: 'medical-record-update',
    DELETE: 'medical-record-delete',
    UPLOAD: 'medical-record-upload',
    TEMPLATE_CREATE: 'medical-record-template-create',
  },
  EHR: {
    HISTORY_CREATE: 'ehr-history-create',
    HISTORY_UPDATE: 'ehr-history-update',
    HISTORY_DELETE: 'ehr-history-delete',
    LAB_CREATE: 'ehr-lab-create',
    LAB_UPDATE: 'ehr-lab-update',
    LAB_DELETE: 'ehr-lab-delete',
    RADIOLOGY_CREATE: 'ehr-radiology-create',
    RADIOLOGY_UPDATE: 'ehr-radiology-update',
    RADIOLOGY_DELETE: 'ehr-radiology-delete',
    SURGICAL_CREATE: 'ehr-surgical-create',
    SURGICAL_UPDATE: 'ehr-surgical-update',
    SURGICAL_DELETE: 'ehr-surgical-delete',
    VITAL_CREATE: 'ehr-vital-create',
    VITAL_UPDATE: 'ehr-vital-update',
    VITAL_DELETE: 'ehr-vital-delete',
    ALLERGY_CREATE: 'ehr-allergy-create',
    ALLERGY_UPDATE: 'ehr-allergy-update',
    ALLERGY_DELETE: 'ehr-allergy-delete',
    MEDICATION_CREATE: 'ehr-medication-create',
    MEDICATION_UPDATE: 'ehr-medication-update',
    MEDICATION_DELETE: 'ehr-medication-delete',
    IMMUNIZATION_CREATE: 'ehr-immunization-create',
    IMMUNIZATION_UPDATE: 'ehr-immunization-update',
    IMMUNIZATION_DELETE: 'ehr-immunization-delete',
  },
  PRESCRIPTION: {
    CREATE: 'prescription-create',
    UPDATE: 'prescription-update',
    PDF: 'prescription-pdf',
  },
  MEDICINE: {
    CREATE: 'medicine-create',
    UPDATE: 'medicine-update',
    DELETE: 'medicine-delete',
    SEARCH: 'medicine-search',
    INTERACTIONS: 'medicine-interactions',
    INVENTORY_UPDATE: 'medicine-inventory-update',
  },
  ANALYTICS: {
    REPORT_GENERATE: 'analytics-report-generate',
    REPORT_DOWNLOAD: 'analytics-report-download',
  },
  PHARMACY: {
    ORDER_CREATE: 'pharmacy-order-create',
    PRESCRIPTION_UPDATE: 'pharmacy-prescription-update',
    INVENTORY_UPDATE: 'pharmacy-inventory-update',
  },
  DOCTOR: {
    CREATE: 'doctor-create',
    UPDATE: 'doctor-update',
    DELETE: 'doctor-delete',
  },
  QUEUE: {
    UPDATE: 'queue-update',
    CALL_NEXT: 'queue-call-next',
  },
  GLOBAL: {
    ERROR: 'global-error',
    SUCCESS: 'global-success',
    INFO: 'global-info',
    WARNING: 'global-warning',
  },
} as const;

// Track active toasts to prevent duplicates
const activeToasts = new Map<string, string>();

/**
 * Toast function compatible with Radix UI Toast API but uses Sonner
 * Prevents duplicate toasts by ID
 * Follows DRY - single implementation for all toast operations
 */
function toast(options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  id?: string;
  duration?: number;
}) {
  const toastId = options.id || `toast-${Date.now()}-${Math.random()}`;
  
  // Dismiss existing toast with same ID to prevent duplicates
  if (activeToasts.has(toastId)) {
    sonnerToast.dismiss(activeToasts.get(toastId));
    activeToasts.delete(toastId);
  }
  
  // Build message from title and description
  // Sonner uses message as primary text, description as secondary
  const message = options.title || options.description || 'Notification';
  const description = options.title && options.description ? options.description : undefined;
  
  // Show toast based on variant
  let sonnerId: string | number;
  if (options.variant === 'destructive') {
    // ✅ Use centralized error handler for error messages
    const errorMessage = description || message;
    sonnerId = sonnerToast.error(errorMessage, {
      id: toastId,
      description: options.title && options.description ? options.title : undefined,
      duration: options.duration || 5000,
    });
  } else {
    sonnerId = sonnerToast.success(message, {
      id: toastId,
      description,
      duration: options.duration || 4000,
    });
  }
  
  // Track active toast
  activeToasts.set(toastId, String(sonnerId));
  
  return {
    id: toastId,
    dismiss: () => {
      sonnerToast.dismiss(sonnerId);
      activeToasts.delete(toastId);
    },
    update: (newOptions: typeof options) => {
      sonnerToast.dismiss(sonnerId);
      activeToasts.delete(toastId);
      return toast({ ...options, ...newOptions, id: toastId });
    },
  };
}

/**
 * Hook to access toast functions
 * Compatible with existing useToast() usage
 */
function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
        activeToasts.delete(toastId);
      } else {
        sonnerToast.dismiss();
        activeToasts.clear();
      }
    },
  };
}

/**
 * Show success toast with duplicate prevention
 */
export function showSuccessToast(
  message: string,
  options?: {
    id?: string;
    description?: string;
    duration?: number;
  }
) {
  const toastId = options?.id || TOAST_IDS.GLOBAL.SUCCESS;
  sonnerToast.dismiss(toastId);
  sonnerToast.success(message, {
    id: toastId,
    description: options?.description,
    duration: options?.duration || 4000,
  });
}

/**
 * Show error toast with duplicate prevention and error sanitization
 */
export function showErrorToast(
  error: Error | string | unknown,
  options?: {
    id?: string;
    description?: string;
    duration?: number;
    skipSanitization?: boolean;
  }
) {
  const toastId = options?.id || TOAST_IDS.GLOBAL.ERROR;
  sonnerToast.dismiss(toastId);
  
  const errorMessage = options?.skipSanitization
    ? (typeof error === 'string' ? error : error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR)
    : sanitizeErrorMessage(error);
  
  sonnerToast.error(errorMessage, {
    id: toastId,
    description: options?.description,
    duration: options?.duration || 5000,
  });
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string, id: string) {
  sonnerToast.loading(message, { id });
}

/**
 * Show info toast with duplicate prevention
 */
export function showInfoToast(
  message: string,
  options?: {
    id?: string;
    description?: string;
    duration?: number;
  }
) {
  const toastId = options?.id || TOAST_IDS.GLOBAL.INFO;
  sonnerToast.dismiss(toastId);
  sonnerToast.info(message, {
    id: toastId,
    description: options?.description,
    duration: options?.duration || 4000,
  });
}

/**
 * Show warning toast with duplicate prevention
 */
export function showWarningToast(
  message: string,
  options?: {
    id?: string;
    description?: string;
    duration?: number;
  }
) {
  const toastId = options?.id || TOAST_IDS.GLOBAL.WARNING;
  sonnerToast.dismiss(toastId);
  sonnerToast.warning(message, {
    id: toastId,
    description: options?.description,
    duration: options?.duration || 5000,
  });
}

/**
 * Dismiss toast by ID
 */
export function dismissToast(id: string) {
  sonnerToast.dismiss(id);
  activeToasts.delete(id);
}

/**
 * Check if an error should be handled globally or by component
 */
export function shouldHandleErrorGlobally(error: Error | unknown): boolean {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  const componentHandledErrors = [
    'register', 'registration', 'login', 'logout', 'profile',
    'appointment', 'contact', 'password', 'otp',
  ];
  
  return !componentHandledErrors.some(keyword => errorMessage.includes(keyword));
}

export { useToast, toast };
