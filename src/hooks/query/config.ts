// ✅ React Query Configuration for 10M+ Users
// Optimized cache settings, pagination, and performance tuning

import { QueryClientConfig } from '@tanstack/react-query';

// ✅ Default Pagination Settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  LARGE_LIST_PAGE_SIZE: 50,
  SMALL_LIST_PAGE_SIZE: 10,
} as const;

// ✅ Cache Time Configuration (Optimized for 10M users)
export const CACHE_TIMES = {
  // Short-lived data (frequently changing)
  SHORT: 30 * 1000, // 30 seconds
  // Medium-lived data (moderately changing)
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  // Long-lived data (rarely changing)
  LONG: 30 * 60 * 1000, // 30 minutes
  // Very long-lived data (static or rarely changing)
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  // Static data (almost never changes)
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ✅ Garbage Collection Times (when to remove unused cache)
export const GC_TIMES = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
  VERY_LONG: 4 * 60 * 60 * 1000, // 4 hours
  STATIC: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ✅ React Query Default Configuration for 10M+ Users
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Cache data for longer to reduce API calls
      staleTime: CACHE_TIMES.MEDIUM, // 5 minutes default
      gcTime: GC_TIMES.MEDIUM, // 15 minutes default (was cacheTime)
      
      // ✅ CRITICAL: Disable automatic refetches to prevent blocking navigation
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: false, // ✅ Don't refetch on mount - prevents blocking navigation
      refetchOnReconnect: true, // Refetch on reconnect
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false;
        }
        // Retry up to 2 times for network/server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network mode
      networkMode: 'online', // Only fetch when online
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
};

// ✅ Query Key Factories (for consistent cache keys)
export const queryKeys = {
  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => 
      [...queryKeys.appointments.lists(), filters] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    stats: (clinicId: string) => 
      [...queryKeys.appointments.all, 'stats', clinicId] as const,
  },
  
  // Billing
  billing: {
    all: ['billing'] as const,
    plans: (clinicId?: string) => 
      [...queryKeys.billing.all, 'plans', clinicId] as const,
    subscriptions: (userId: string) => 
      [...queryKeys.billing.all, 'subscriptions', userId] as const,
    invoices: (userId: string) => 
      [...queryKeys.billing.all, 'invoices', userId] as const,
    payments: (userId: string) => 
      [...queryKeys.billing.all, 'payments', userId] as const,
    analytics: (clinicId: string) => 
      [...queryKeys.billing.all, 'analytics', clinicId] as const,
  },
  
  // EHR
  ehr: {
    all: ['ehr'] as const,
    comprehensive: (userId: string) => 
      [...queryKeys.ehr.all, 'comprehensive', userId] as const,
    medicalHistory: (userId: string) => 
      [...queryKeys.ehr.all, 'medical-history', userId] as const,
    labReports: (userId: string) => 
      [...queryKeys.ehr.all, 'lab-reports', userId] as const,
    vitals: (userId: string) => 
      [...queryKeys.ehr.all, 'vitals', userId] as const,
  },
  
  // Video
  video: {
    all: ['video'] as const,
    appointments: (filters?: Record<string, unknown>) => 
      [...queryKeys.video.all, 'appointments', filters] as const,
    appointment: (id: string) => 
      [...queryKeys.video.all, 'appointment', id] as const,
  },
  
  // Queue
  queue: {
    all: ['queue'] as const,
    status: (clinicId: string, queueType?: string) => 
      [...queryKeys.queue.all, 'status', clinicId, queueType] as const,
    stats: (clinicId: string) => 
      [...queryKeys.queue.all, 'stats', clinicId] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    profile: (userId: string) => 
      [...queryKeys.users.all, 'profile', userId] as const,
    list: (filters?: Record<string, unknown>) => 
      [...queryKeys.users.all, 'list', filters] as const,
  },
} as const;

// ✅ Request Batching Configuration
export const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 50, // Maximum requests per batch
  BATCH_DELAY: 100, // Delay before batching (ms)
  MAX_WAIT_TIME: 500, // Maximum wait time for batching (ms)
} as const;

// ✅ Debounce Configuration
export const DEBOUNCE_CONFIG = {
  SEARCH: 300, // 300ms for search inputs
  FILTER: 500, // 500ms for filter changes
  SCROLL: 100, // 100ms for scroll events
} as const;

// ✅ Virtual Scroll Configuration
export const VIRTUAL_SCROLL_CONFIG = {
  DEFAULT_ITEM_HEIGHT: 80, // Default item height in pixels
  OVERSCAN: 5, // Number of items to render outside viewport
  CONTAINER_HEIGHT: 600, // Default container height
} as const;
