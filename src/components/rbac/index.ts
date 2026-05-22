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
} from './ProtectedComponent';

// Protected Routes
export {
  ProtectedRoute,
  UnauthorizedAccess,
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

export {
  withPermission,
  useConditionalRender,
} from './protected-helpers';

export {
  withRoleProtection,
  withPermissionProtection,
} from './protected-route-helpers';

// Specialized Components - These components don't exist in SpecializedComponents.tsx
// They can be created using ProtectedComponent with role checks if needed
