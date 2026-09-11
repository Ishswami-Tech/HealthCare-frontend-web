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

// ✅ Consolidated: useTranslation is exported from @/lib/i18n/context
// Re-export for convenience
export { useTranslation } from '@/lib/i18n/context';
