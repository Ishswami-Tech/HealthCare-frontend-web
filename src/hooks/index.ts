// ✅ Hooks - Organized by Category
// Main barrel export for all hooks

// ============================================================================
// CORE HOOKS - Base infrastructure
// ============================================================================
export * from './core';

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================
export * from './auth';

// ============================================================================
// QUERY HOOKS - Domain-specific data fetching
// ============================================================================
export * from './query';

// ============================================================================
// REALTIME HOOKS - WebSocket, FCM, real-time updates
// ============================================================================
export * from './realtime';

// ============================================================================
// UTILITY HOOKS - General-purpose utilities
// ============================================================================
export * from './utils';

// ============================================================================
// LEGACY EXPORTS - For backward compatibility
// ============================================================================
// Re-export commonly used hooks at root level for convenience
export { useAuth, useAuthForm } from './auth';
export { useQueryData, useMutationData } from './core';
export { useToast, TOAST_IDS } from './utils';
export { 
  useRBAC,
  useAppointmentPermissions,
  usePatientPermissions,
  useQueuePermissions,
  usePharmacyPermissions,
} from './utils';
export { useFCM } from './realtime';
export { useWebSocketIntegration } from './realtime';

// ✅ Consolidated: useTranslation is exported from @/lib/i18n/context
// Re-export for convenience
export { useTranslation } from '@/lib/i18n/context';
