// Base hooks
export { useQueryData } from './useQueryData';
export { useMutationData } from './useMutationData';
export { default as useZodForm } from './useZodForm';

// Auth hooks
export { useAuth } from './useAuth';

// Appointment hooks
export {
  useCreateAppointment,
  useAppointments,
  useAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useDoctorAvailability,
  useUserUpcomingAppointments,
  useCanCancelAppointment,
} from './useAppointments';

// Clinic hooks
export {
  useCreateClinic,
  useClinics,
  useClinic,
  useClinicByAppName,
  useUpdateClinic,
  useDeleteClinic,
  useCreateClinicLocation,
  useClinicLocations,
  useClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
  useGenerateLocationQR,
  useVerifyLocationQR,
  useAssignClinicAdmin,
  useRegisterPatientToClinic,
  useClinicUsersByRole,
  useValidateAppName,
  useAssociateUserWithClinic,
  useClinicStats,
  useClinicSettings,
  useUpdateClinicSettings,
  useActiveLocations,
  useGenerateClinicToken,
  useHasClinicPermission,
  useFormatClinicAddress,
  useClinicStatusColor,
  useClinicTypeDisplayName,
} from './useClinics';

// User hooks
export {
  useUserProfile,
  useUpdateUserProfile,
  useUser,
  useUpdateUser,
  useDeleteUser,
  useUsers,
  useReceptionists,
  useClinicAdmins,
  useFormatUserName,
  useUserRoleDisplayName,
  useUserStatusColor,
  useIsProfileComplete,
  useUserAvatar,
  // Enhanced user management hooks
  useCreateUser,
  useUpdateUserRole,
  useUsersByRole,
  useUsersByClinic,
  useSearchUsers,
  useUserStats,
  useBulkUpdateUsers,
  useExportUsers,
  useChangeUserPassword,
  useToggleUserVerification,
  useUserActivityLogs,
  useUserSessions,
  useTerminateUserSession,
} from './useUsers';

// Medical Records hooks
export {
  usePatientMedicalRecords,
  useMedicalRecord,
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
  useUploadMedicalRecordFile,
  useMedicalRecordTemplates,
  useCreateMedicalRecordTemplate,
  usePatientPrescriptions,
  usePrescription as useMedicalRecordPrescription,
  useCreatePrescription as useCreateMedicalRecordPrescription,
  useUpdatePrescription as useUpdateMedicalRecordPrescription,
  useGeneratePrescriptionPDF,
  useMedicines as useMedicalRecordMedicines,
  useSearchMedicines as useSearchMedicalRecordMedicines,
  useCreateMedicine as useCreateMedicalRecordMedicine,
  useUpdateMedicine as useUpdateMedicalRecordMedicine,
  useDeleteMedicine as useDeleteMedicalRecordMedicine,
  useMedicineInteractions,
  useMedicineInventory,
  useUpdateMedicineInventory,
} from './useMedicalRecords';

// Notifications hooks
export {
  useUserNotifications,
  useCreateNotification,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useNotificationSettings,
  useUpdateNotificationSettings,
  useSendBulkNotifications,
  useSendSMS,
  useSendEmail,
  useSendWhatsAppMessage,
  useMessageTemplates,
  useCreateMessageTemplate,
  useUpdateMessageTemplate,
  useDeleteMessageTemplate,
  useMessageHistory,
  useMessagingStats,
  useScheduleMessage,
  useCancelScheduledMessage,
  useScheduledMessages,
  useSubmitContactForm,
  useSubmitConsultationBooking,
} from './useNotifications';

// Analytics hooks
export {
  useDashboardAnalytics,
  useAppointmentAnalytics,
  usePatientAnalytics,
  useRevenueAnalytics,
  useDoctorPerformanceAnalytics,
  useClinicPerformanceAnalytics,
  useServiceUtilizationAnalytics,
  useWaitTimeAnalytics,
  usePatientSatisfactionAnalytics,
  useGenerateAppointmentReport,
  useGeneratePatientReport,
  useGenerateRevenueReport,
  useGenerateDoctorPerformanceReport,
  useGenerateClinicSummaryReport,
  useReportHistory,
  useDownloadReport,
  useDeleteReport,
  useCustomAnalytics,
  useSaveCustomAnalyticsQuery,
  useSavedAnalyticsQueries,
  useFormatChartData,
  useCalculatePercentageChange,
  useFormatCurrency,
  useFormatPercentage,
} from './useAnalytics';

// Queue hooks
export {
  useQueue,
  useQueueStats,
  useUpdateQueueStatus,
  useCallNextPatient,
  useAddToQueue,
  useRemoveFromQueue,
  useReorderQueue,
  useQueueHistory,
  useQueueAnalytics,
  useConsultationQueue,
  usePanchkarmaQueue,
  useAgnikarmaQueue,
  useNadiParikshaQueue,
  useQueueUtils,
  useRealTimeQueue,
  useQueueNotifications,
  useUpdateQueuePosition,
  usePauseQueue,
  useResumeQueue,
  useQueueConfig,
  useUpdateQueueConfig,
  useMarkQueueNotificationAsRead,
  useSendQueueNotification,
  useQueueWaitTimes,
  useEstimateWaitTime,
  useQueueCapacity,
  useUpdateQueueCapacity,
  useQueuePerformanceMetrics,
  useExportQueueData,
  useQueueAlerts,
  useCreateQueueAlert,
  useUpdateQueueAlert,
  useDeleteQueueAlert,
} from './useQueue';

// Doctors hooks
export {
  useDoctors,
  useDoctor,
  useDoctorSchedule,
  useDoctorAppointments,
  useDoctorPatients,
  useDoctorStats,
  useDoctorReviews,
  useDoctorSpecializations,
  useDoctorPerformanceMetrics,
  useDoctorEarnings,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useUpdateDoctorSchedule,
  useUpdateDoctorAvailability,
  useAddDoctorReview,
  useSearchDoctors,
  useUpdateDoctorProfile,
  useExportDoctorData,
} from './useDoctors';

// Patients hooks
export {
  usePatients,
  usePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  usePatientVitalSigns,
  usePatientLabResults,
  usePatientStats,
  usePatientTimeline,
  usePatientCarePlan,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useAddPatientMedicalHistory,
  useAddPatientVitalSigns,
  useAddPatientLabResult,
  useSearchPatients,
  useExportPatientData,
  useUpdatePatientCarePlan,
} from './usePatients';

// Pharmacy hooks
export {
  useMedicines as usePharmacyMedicines,
  useMedicine,
  useMedicineCategories,
  useSearchMedicines as useSearchPharmacyMedicines,
  usePrescriptions,
  usePrescription,
  useInventory,
  usePharmacyOrders,
  usePharmacySales,
  usePharmacyStats,
  useSuppliers,
  useCreateMedicine as useCreatePharmacyMedicine,
  useUpdateMedicine as useUpdatePharmacyMedicine,
  useDeleteMedicine as useDeletePharmacyMedicine,
  useCreatePrescription as useCreatePharmacyPrescription,
  useUpdatePrescriptionStatus,
  useDispensePrescription,
  useUpdateInventory,
  useCreatePharmacyOrder,
  useExportPharmacyData,
} from './usePharmacy';

// Clinic context hooks
export {
  useCurrentClinicId,
  useCurrentClinic,
  useHasClinicAccess,
  useClinicAwareQuery,
  useClinicPatients,
  useClinicContext,
} from './useClinic';

// RBAC hooks
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

// Firebase Cloud Messaging hooks
export { useFCM } from './useFCM';

// Utility hooks
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';