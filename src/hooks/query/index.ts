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
  // Queue functions from appointments (keep for backward compatibility)
  useQueue as useAppointmentQueue,
  useAddToQueue as useAddToAppointmentQueue,
  useCallNextPatient as useCallNextAppointmentPatient,
  useQueueStats as useAppointmentQueueStats,
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
  useDoctors as useClinicDoctors,
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
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
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
  usePatients as useUserPatients,
  useDoctors as useUserDoctors,
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
  useMedicines as usePharmacyMedicines,
  useMedicine,
  useMedicine as usePharmacyMedicine,
  useSearchMedicines,
  useSearchMedicines as usePharmacySearchMedicines,
  useCreateMedicine,
  useCreateMedicine as usePharmacyCreateMedicine,
  useUpdateMedicine,
  useUpdateMedicine as usePharmacyUpdateMedicine,
  useDeleteMedicine,
  useDeleteMedicine as usePharmacyDeleteMedicine,
  usePrescriptions,
  usePrescriptions as usePharmacyPrescriptions,
  usePrescription,
  usePrescription as usePharmacyPrescription,
  useCreatePrescription,
  useCreatePrescription as usePharmacyCreatePrescription,
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
  useQueueStats as useQueueManagementStats,
  useCallNextPatient as useQueueCallNextPatient,
  useAddToQueue as useQueueAddToQueue,
  useQueueHistory,
  useQueueAnalytics as useQueueManagementAnalytics,
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

// Communication (sending emails, SMS, WhatsApp, chat)
export * from './useCommunication';
