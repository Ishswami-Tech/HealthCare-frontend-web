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
} from './useUsers';

// Utility hooks
export { useToast } from './use-toast';
export { useIsMobile } from './use-mobile'; 