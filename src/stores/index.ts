// Main app store
export { useAppStore } from './useAppStore';

// Domain-specific stores
export { 
  useNotificationStore, 
  useNotificationSelectors, 
  useNotificationActions, 
  useNotificationPanel, 
  useNotificationSettings 
} from './useNotificationStore';

export { 
  useAppointmentStore, 
  useAppointmentSelectors, 
  useAppointmentActions, 
  useAppointmentQueue, 
  useAppointmentFilters 
} from './useAppointmentStore';

export {
  useMedicalRecordsStore,
  useMedicalRecordsSelectors,
  useMedicalRecordsActions
} from './useMedicalRecordsStore';

export {
  usePharmacyStore,
  usePharmacyActions,
} from './usePharmacyStore';

// Type exports
export type { Theme, LoadingOverlayVariant } from './useAppStore';
export type { Notification, NotificationSettings } from './useNotificationStore';
export type { Appointment, AppointmentFilters } from './useAppointmentStore';
export type { MedicalRecord, Prescription, Medicine } from './useMedicalRecordsStore';
