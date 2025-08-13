// Protected Components
export {
  ProtectedComponent,
  ProtectedButton,
  ProtectedLink,
  AppointmentProtectedComponent,
  PatientProtectedComponent,
  QueueProtectedComponent,
  withPermission,
  useConditionalRender,
} from './ProtectedComponent';

// Protected Routes
export {
  ProtectedRoute,
  UnauthorizedAccess,
  withRoleProtection,
  withPermissionProtection,
  AppointmentRouteProtection,
  PatientRouteProtection,
  QueueRouteProtection,
  AnalyticsRouteProtection,
  PharmacyRouteProtection,
  MedicalRecordsRouteProtection,
  AdminRouteProtection,
  DoctorRouteProtection,
  StaffRouteProtection,
} from './ProtectedRoute';
