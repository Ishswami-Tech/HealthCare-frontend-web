// ✅ Utility Hooks
// General-purpose hooks for UI, forms, permissions, and state management

export { useToast, showSuccessToast, showErrorToast, showLoadingToast, dismissToast, TOAST_IDS } from './use-toast';
export { default as useZodForm } from './useZodForm';
export { useIsMobile } from './use-mobile';
export { useGlobalLoading, useIsLoading, useLoadingMessage } from './useGlobalLoading';
export { 
  useRBAC,
  useAppointmentPermissions,
  usePatientPermissions,
  useDoctorPermissions,
  useClinicPermissions,
  useAnalyticsPermissions,
  usePharmacyPermissions,
  useQueuePermissions,
  useRoleBasedNavigation,
  useContextualPermissions,
} from './useRBAC';
export { useOptimisticUpdateQueueStatus, useOptimisticCallNextPatient } from './useOptimisticQueue';
export { 
  useNotificationPreferences,
  useUserNotificationPreferences,
  useCreateNotificationPreferences,
  useUpdateNotificationPreferences,
  useDeleteNotificationPreferences
} from './useNotificationPreferences';
