# Hooks Organization

This directory contains all React hooks organized by category for better maintainability and discoverability.

## 📁 Folder Structure

```
hooks/
├── core/           # Base infrastructure hooks
│   ├── useQueryData.ts
│   ├── useMutationData.ts
│   ├── useMutationOperation.ts
│   ├── useOptimisticMutation.ts
│   └── useAsyncData.ts
│
├── auth/           # Authentication hooks
│   └── useAuth.ts  # Includes useAuth and useAuthForm
│
├── query/          # Domain-specific query hooks
│   ├── useAppointments.ts
│   ├── useClinics.ts
│   ├── usePatients.ts
│   ├── useDoctors.ts
│   ├── useUsers.ts
│   ├── useMedicalRecords.ts
│   ├── usePharmacy.ts
│   ├── useBilling.ts
│   ├── useQueue.ts
│   ├── useAnalytics.ts
│   ├── useEHRClinic.ts
│   ├── useHealth.ts
│   ├── useVideoAppointments.ts
│   └── useNotifications.ts
│
├── mutation/        # Mutation-only hooks (reserved for future use)
│   └── index.ts
│
├── realtime/       # Real-time hooks (WebSocket, FCM)
│   ├── useWebSocketIntegration.ts
│   ├── useFCM.ts
│   ├── useRealTimeQueries.ts
│   ├── useRealTimeIntegration.ts
│   ├── useHealthRealtime.ts
│   └── useVideoAppointmentSocketIO.ts
│
├── utils/          # Utility hooks
│   ├── use-toast.ts
│   ├── useZodForm.ts
│   ├── use-mobile.ts
│   ├── useGlobalLoading.ts
│   ├── useRBAC.ts
│   ├── useOptimisticQueue.ts
│   └── useNotificationPreferences.ts
│
└── index.ts        # Main barrel export
```

## 🔗 Integration with Query Config

The hooks are integrated with `@/hooks/query/config` (moved from `@/lib/config/query`):
- **useQueryData** and **useMutationData** automatically use `queryClientConfig` defaults
- Query keys are defined in `@/hooks/query/config.ts` for consistency
- Cache times, retry logic, and other settings are centralized
- All query configuration is now co-located with query hooks for better organization

## 📦 Usage

### Import from main index (recommended)
```typescript
import { useAuth, useAppointments, useClinics } from '@/hooks';
```

### Import from specific folders (for tree-shaking)
```typescript
import { useAuth } from '@/hooks/auth';
import { useAppointments } from '@/hooks/query';
import { useFCM } from '@/hooks/realtime';
import { useToast } from '@/hooks/utils';
```

### Import core hooks
```typescript
import { useQueryData, useMutationData } from '@/hooks/core';
```

## 🎯 Benefits

1. **Clear Organization**: Hooks are grouped by purpose
2. **Easy Discovery**: Find hooks by domain (query/, auth/, etc.)
3. **Better Tree-shaking**: Import from specific folders when needed
4. **Consistent Configuration**: All hooks use centralized query config
5. **Maintainability**: Related hooks are co-located

## 📝 Notes

- All hooks maintain backward compatibility through the main `index.ts` export
- Query config is now in `@/hooks/query/config.ts` (moved from `@/lib/config/query`)
- Old imports from `@/lib/config/query` still work via re-export in `config.ts` (deprecated)
- Mutation hooks are currently mixed with query hooks but can be separated in the future
