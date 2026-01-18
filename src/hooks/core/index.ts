// ✅ Core Hooks - Base infrastructure for data fetching and mutations
// These hooks provide the foundation for all data operations
// NO direct imports from @tanstack/react-query - all access through these hooks

export { useQueryData } from './useQueryData';
export { useMutationOperation } from './useMutationOperation';
export { useOptimisticMutation } from './useOptimisticMutation';
export { useAsyncData } from './useAsyncData';

// ⚠️ REMOVED: useMutationData has been removed. Use useMutationOperation instead.
// All code should be migrated to useMutationOperation or useOptimisticMutation.

// Re-export useQueryClient through a wrapper to maintain consistency
export { useQueryClient } from '@tanstack/react-query';
