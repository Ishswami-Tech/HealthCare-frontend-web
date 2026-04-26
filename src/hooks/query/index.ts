// ✅ Query Hooks - Domain-specific data fetching hooks
// Organized by domain: appointments, clinics, patients, doctors, etc.

// Query Configuration (moved from lib/config/query)
export * from './config';

// Appointments - export specific functions to avoid conflicts
export {
  useAppointments,
  useAppointment,
  useCreateAppointment,
  useUpdateAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useCheckInAppointment,
  useStartAppointment,
  useCompleteAppointment,
  useMyAppointments,
  useUserUpcomingAppointments,
  useTestAppointmentContext,
  useDoctorAvailability,
} from './useAppointments';

// Clinics - export specific, excluding useHealthStatus (exported from useHealth)
export {
  useClinics,
  useClinic,
  useCreateClinic,
  useUpdateClinic,
  useDeleteClinic,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
  useClinicLocations,
  useCurrentClinicId,
  useClinicStats,
  useClinicCommunicationConfig,
  useCreateClinicCommunicationConfig,
  useUpdateClinicCommunicationConfig,
  useDeleteClinicCommunicationConfig,
  useTestClinicCommunication,
} from './useClinics';

// Patients - export specific
export {
  usePatients,
  usePatients as useClinicPatients,
  usePatient,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  usePatientAppointments,
  usePatientMedicalHistory,
  useAddPatientMedicalHistory,
  usePatientVitalSigns,
  useAddPatientVitalSigns,
  usePatientLabResults,
  useAddPatientLabResult,
  usePatientStats,
  useSearchPatients,
  usePatientTimeline,
  useExportPatientData,
  usePatientCarePlan,
  useUpdatePatientCarePlan,
} from './usePatients';

// Doctors - export specific, excluding useDoctorAvailability (exported from useAppointments)
export {
  useDoctors,
  useDoctor,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useDoctorSchedule,
  useUpdateDoctorSchedule,
  useUpdateDoctorAvailability,
  useDoctorAppointments,
  useDoctorPatients,
  useDoctorStats,
  useDoctorReviews,
  useAddDoctorReview,
  useDoctorSpecializations,
  useSearchDoctors,
  useDoctorPerformanceMetrics,
  useUpdateDoctorProfile,
  useDoctorEarnings,
  useExportDoctorData,
} from './useDoctors';

// Users - export specific, excluding usePatients and useDoctors
export {
  useUserProfile,
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useUpdateUserProfile,
  useUpdateUserRole,
  useSetProfileComplete,
  useDeleteUser,
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

// Medical Records - export specific, excluding medicine/prescription functions (exported from usePharmacy)
export {
  useCreateMedicalRecord,
  useUpdateMedicalRecord,
  useDeleteMedicalRecord,
  useMedicalRecord,
  useUploadMedicalRecordFile,
  useMedicalRecordTemplates,
  useCreateMedicalRecordTemplate,
  useComprehensiveHealthRecord,
  usePatientPrescriptions,
  useMedicalHistory,
  useCreateMedicalHistory,
  useUpdateMedicalHistory,
  useDeleteMedicalHistory,
  useLabReports,
  useCreateLabReport,
  useUpdateLabReport,
  useDeleteLabReport,
  useRadiologyReports,
  useCreateRadiologyReport,
  useUpdateRadiologyReport,
  useDeleteRadiologyReport,
  useSurgicalRecords,
  useCreateSurgicalRecord,
  useUpdateSurgicalRecord,
  useDeleteSurgicalRecord,
  useVitals,
  useCreateVital,
  useUpdateVital,
  useDeleteVital,
  useAllergies,
  useCreateAllergy,
  useUpdateAllergy,
  useDeleteAllergy,
  useMedications,
  useCreateMedication,
  useUpdateMedication,
  useDeleteMedication,
  useImmunizations,
  useCreateImmunization,
  useUpdateImmunization,
  useDeleteImmunization,
  useHealthTrends,
  useMedicationAdherence,
} from './useMedicalRecords';

// Pharmacy - export specific, excluding medicine/prescription functions that conflict with useMedicalRecords
export {
  useMedicines,
  useMedicine,
  useSearchMedicines,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
  usePrescriptions,
  usePrescription,
  useCreatePrescription,
  useUpdatePrescriptionStatus,
  useDispensePrescription,
  useInventory,
  useUpdateInventory,
  usePharmacyOrders,
  useCreatePharmacyOrder,
  usePharmacySales,
  usePharmacyStats,
  useMedicineCategories,
  useSuppliers,
  useExportPharmacyData,
} from './usePharmacy';

// Billing
export * from './useBilling';

// Queue - export specific, excluding functions that conflict with useAppointments
export {
  useQueue as useQueueManagement,
  useQueueHistory,
  useQueueUtils,
  usePauseQueue,
  useQueueConfig,
  useQueueNotifications,
  useQueueWaitTimes,
  useQueueCapacity,
  useQueuePerformanceMetrics,
  useQueueAlerts,
} from './useQueue';

// Analytics - export specific, excluding useQueueAnalytics (exported from useQueue)
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
} from './useAnalytics';

// EHR
export * from './useEHRClinic';

// Health - export specific, excluding useHealthStatus (conflicts with useClinics)
export {
  useDetailedHealthStatus,
} from './useHealth';

// Video Appointments
export * from './useVideoAppointments';

// Notifications (reading, actions, settings)
export * from './useNotifications';
export * from './useNotificationPreferences';

// Communication (sending emails, SMS, WhatsApp, chat)
export * from './useCommunication';
