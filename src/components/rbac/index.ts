// ✅ RBAC Components - Role-Based Access Control components
// Barrel export for all RBAC components

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

// Specialized Components - These components don't exist in SpecializedComponents.tsx
// They can be created using ProtectedComponent with role checks if needed
