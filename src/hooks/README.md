# Hooks Organization

This directory contains all React hooks organized by category for maintainability and discoverability.

## Folder Structure

```text
hooks/
|-- core/            # Base infrastructure hooks
|   |-- useQueryData.ts
|   |-- useMutationOperation.ts   # Primary mutation hook
|   |-- useOptimisticMutation.ts  # For list operations
|   `-- useAsyncData.ts
|
|-- auth/            # Authentication hooks
|   `-- useAuth.ts   # Includes useAuth and useAuthForm
|
|-- query/           # Domain-specific query and mutation hooks
|   |-- useAppointments.ts
|   |-- useClinics.ts
|   |-- usePatients.ts
|   |-- useDoctors.ts
|   |-- useUsers.ts
|   |-- useMedicalRecords.ts
|   |-- usePharmacy.ts
|   |-- useBilling.ts
|   |-- useQueue.ts
|   |-- useAnalytics.ts
|   |-- useEHRClinic.ts
|   |-- useHealth.ts
|   |-- useVideoAppointments.ts
|   |-- useNotifications.ts
|   `-- useNotificationPreferences.ts
|
|-- mutation/        # Mutation-only hooks (reserved for future use)
|   `-- index.ts
|
|-- realtime/        # Real-time hooks (WebSocket, FCM)
|   |-- useWebSocketIntegration.ts
|   |-- useFCM.ts
|   |-- useRealTimeQueries.ts
|   |-- useRealTimeIntegration.ts
|   |-- useHealthRealtime.ts
|   `-- useVideoAppointmentSocketIO.ts
|
|-- utils/           # Utility hooks
|   |-- use-toast.ts
|   |-- useZodForm.ts
|   |-- use-mobile.ts
|   |-- useGlobalLoading.ts
|   |-- useRBAC.ts
|   `-- useOptimisticQueue.ts
|
`-- index.ts         # Main barrel export
```

## Integration with Query Config

The hooks are integrated with `@/hooks/query/config`:

- `useQueryData` automatically uses `queryClientConfig` defaults
- `useMutationOperation` provides consistent toast, loading, and error handling
- `useOptimisticMutation` supports list operations with optimistic updates
- All hooks use the QueryClient from `QueryProvider` via `useQueryClient()`
- Query keys are defined in `@/hooks/query/config.ts` for consistency
- Cache times, retry logic, and related settings are centralized

## Usage

### Import from main index

```typescript
import { useAuth, useAppointments, useClinics } from '@/hooks';
```

### Import from specific folders

```typescript
import { useAuth } from '@/hooks/auth';
import { useAppointments } from '@/hooks/query';
import { useFCM } from '@/hooks/realtime';
import { useToast } from '@/hooks/utils';
```

### Import core hooks

```typescript
import { useQueryData, useMutationOperation, useOptimisticMutation } from '@/hooks/core';
```

## Benefits

1. Clear organization by purpose
2. Easier discovery by domain
3. Better tree-shaking when importing from specific folders
4. Consistent query and mutation configuration
5. Better co-location of related hook logic

## Notes

- All hooks maintain backward compatibility through the main `index.ts` export
- Query config lives in `@/hooks/query/config.ts`
- Mutation hooks are still colocated with query hooks where that improves domain cohesion
