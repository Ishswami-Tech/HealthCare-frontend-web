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
  GLOBAL: {
    ERROR: 'global-error',
    SUCCESS: 'global-success',
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
