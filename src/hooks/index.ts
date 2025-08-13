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
  useFormatAppointmentDateTime,
  useAppointmentStatusColor,
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
  useClinicDoctors,
  useClinicPatients,
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
  usePatients,
  useDoctors,
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
  usePrescription,
  useCreatePrescription,
  useUpdatePrescription,
  useGeneratePrescriptionPDF,
  useMedicines,
  useSearchMedicines,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
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
} from './useQueue';

// Doctors hooks
export {
  useDoctors,
  useDoctor,
  useDoctorSchedule,
  useDoctorAvailability,
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
  useMedicines,
  useMedicine,
  useMedicineCategories,
  useSearchMedicines,
  usePrescriptions,
  usePrescription,
  useInventory,
  usePharmacyOrders,
  usePharmacySales,
  usePharmacyStats,
  useSuppliers,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
  useCreatePrescription,
  useUpdatePrescriptionStatus,
  useDispensePrescription,
  useUpdateInventory,
  useCreatePharmacyOrder,
  useExportPharmacyData,
} from './usePharmacy';

// Clinic hooks
export {
  useCurrentClinicId,
  useCurrentClinic,
  useHasClinicAccess,
  useClinicAwareQuery,
  useClinicPatients,
  useClinicDoctors,
  useClinicMedicines,
  useClinicAppointments,
  useClinicContext,
} from './useClinic';

// Queue hooks
export {
  useQueue,
  useQueueStats,
  useUpdateQueueStatus,
  useCallNextPatient,
  useAddToQueue,
  useTransferQueueItem,
  useQueueConfiguration,
  useQueueNotifications,
  useQueueAnalytics,
} from './useQueue';

// Medical Records hooks
export {
  usePatientMedicalRecords,
  useMedicalRecord,
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
  useMedicalRecordTemplates,
  useCreateMedicalRecordTemplate,
  usePatientVitalSigns,
  useAddVitalSigns,
  usePatientLabResults,
  useAddLabResult,
  usePulseDiagnosis,
  useDoshaAnalysis,
  usePanchakarmaTreatments,
} from './useMedicalRecords';

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

// Utility hooks
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile';