// ✅ Clinic Hooks - Backend Integration
// This file provides hooks that integrate with the backend clinic app

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useRBAC } from './useRBAC';
import { useToast } from './use-toast';
import { Permission } from '@/types/rbac.types';
import {
  createClinic,
  getClinics,
  getClinicById,
  getClinicByAppName,
  updateClinic,
  deleteClinic,
  createClinicLocation,
  getClinicLocations,
  updateClinicLocation,
  deleteClinicLocation,
  getHealthStatus,
  getHealthReady,
  getHealthLive
} from '@/lib/actions/clinic.server';
import type { 
  Clinic, 
  ClinicLocation, 
  CreateClinicData, 
  UpdateClinicData
} from '@/types/clinic.types';

// ✅ Pagination Types (if not available in clinic.types)
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// ✅ Current Clinic ID Hook (separate to avoid circular imports)
export const useCurrentClinicId = () => {
  const { session } = useAuth();
  
  // Try to get clinic ID from user session
  const clinicId = (session?.user as any)?.clinicId || (session?.user as any)?.clinic?.id;
  
  return clinicId;
};

// ✅ Current Clinic Hook
export const useCurrentClinic = () => {
  const clinicId = useCurrentClinicId();
  
  return useQuery({
    queryKey: ['current-clinic', clinicId],
    queryFn: async () => {
      if (!clinicId) {
        throw new Error('No clinic ID available');
      }
      
      const result = await getClinicById(clinicId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ✅ Clinic Management Hooks

/**
 * Hook for fetching all clinics with pagination
 */
export const useClinics = (params?: PaginationParams) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['clinics', params],
    queryFn: async () => {
      const result = await getClinics(params);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    enabled: hasPermission(Permission.VIEW_CLINICS),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a specific clinic by ID
 */
export const useClinic = (clinicId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => {
      const result = await getClinicById(clinicId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    enabled: !!clinicId && hasPermission(Permission.VIEW_CLINICS),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied') || error.message.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a clinic by app name (subdomain)
 */
export const useClinicByAppName = (appName: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['clinic-by-app', appName],
    queryFn: async () => {
      const result = await getClinicByAppName(appName);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    enabled: !!appName && hasPermission(Permission.VIEW_CLINICS),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied') || error.message.includes('not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a new clinic
 */
export const useCreateClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (data: CreateClinicData) => {
      if (!hasPermission(Permission.CREATE_CLINICS)) {
        throw new Error('Insufficient permissions to create clinic');
      }
      
      const result = await createClinic(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    onSuccess: (clinic) => {
      // Invalidate and refetch clinics list
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      
      // Add the new clinic to the cache
      if (clinic) {
        queryClient.setQueryData(['clinic', clinic.id], clinic);
        
        toast({
          title: 'Success',
          description: `Clinic "${clinic.name}" created successfully`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create clinic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create clinic',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating a clinic
 */
export const useUpdateClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClinicData }) => {
      if (!hasPermission(Permission.UPDATE_CLINICS)) {
        throw new Error('Insufficient permissions to update clinic');
      }
      
      const result = await updateClinic(id, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.clinic;
    },
    onSuccess: (clinic) => {
      // Update clinic in cache
      if (clinic) {
        queryClient.setQueryData(['clinic', clinic.id], clinic);
        
        // Invalidate clinics list
        queryClient.invalidateQueries({ queryKey: ['clinics'] });
        
        toast({
          title: 'Success',
          description: `Clinic "${clinic.name}" updated successfully`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to update clinic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update clinic',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for deleting a clinic
 */
export const useDeleteClinic = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async (clinicId: string) => {
      if (!hasPermission(Permission.DELETE_CLINICS)) {
        throw new Error('Insufficient permissions to delete clinic');
      }
      
      const result = await deleteClinic(clinicId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return clinicId;
    },
    onSuccess: (clinicId) => {
      // Remove clinic from cache
      queryClient.removeQueries({ queryKey: ['clinic', clinicId] });
      
      // Invalidate clinics list
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      
      toast({
        title: 'Success',
        description: 'Clinic deleted successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete clinic:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete clinic',
        variant: 'destructive',
      });
    },
  });
};

// ✅ Clinic Location Hooks

/**
 * Hook for fetching clinic locations
 */
export const useClinicLocations = (clinicId: string) => {
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: ['clinic-locations', clinicId],
    queryFn: async () => {
      const result = await getClinicLocations(clinicId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.locations;
    },
    enabled: !!clinicId && hasPermission(Permission.VIEW_CLINICS),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a clinic location
 */
export const useCreateClinicLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ clinicId, data }: { clinicId: string; data: any }) => {
      if (!hasPermission(Permission.UPDATE_CLINICS)) {
        throw new Error('Insufficient permissions to create clinic location');
      }
      
      const result = await createClinicLocation(clinicId, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.location;
    },
    onSuccess: (location, { clinicId }) => {
      // Invalidate clinic locations
      queryClient.invalidateQueries({ queryKey: ['clinic-locations', clinicId] });
      
      if (location) {
        toast({
          title: 'Success',
          description: `Location "${location.name}" created successfully`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to create clinic location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create clinic location',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for updating a clinic location
 */
export const useUpdateClinicLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ clinicId, locationId, data }: { clinicId: string; locationId: string; data: Partial<ClinicLocation> }) => {
      if (!hasPermission(Permission.UPDATE_CLINICS)) {
        throw new Error('Insufficient permissions to update clinic location');
      }
      
      const result = await updateClinicLocation(clinicId, locationId, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.location;
    },
    onSuccess: (location, { clinicId }) => {
      // Invalidate clinic locations
      queryClient.invalidateQueries({ queryKey: ['clinic-locations', clinicId] });
      
      if (location) {
        toast({
          title: 'Success',
          description: `Location "${location.name}" updated successfully`,
        });
      }
    },
    onError: (error: Error) => {
      console.error('Failed to update clinic location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update clinic location',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook for deleting a clinic location
 */
export const useDeleteClinicLocation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasPermission } = useRBAC();
  
  return useMutation({
    mutationFn: async ({ clinicId, locationId }: { clinicId: string; locationId: string }) => {
      if (!hasPermission(Permission.DELETE_CLINICS)) {
        throw new Error('Insufficient permissions to delete clinic location');
      }
      
      const result = await deleteClinicLocation(clinicId, locationId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { clinicId, locationId };
    },
    onSuccess: ({ clinicId }) => {
      // Invalidate clinic locations
      queryClient.invalidateQueries({ queryKey: ['clinic-locations', clinicId] });
      
      toast({
        title: 'Success',
        description: 'Clinic location deleted successfully',
      });
    },
    onError: (error: Error) => {
      console.error('Failed to delete clinic location:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete clinic location',
        variant: 'destructive',
      });
    },
  });
};

// ✅ Health Check Hooks

/**
 * Hook for checking health status
 */
export const useHealthStatus = () => {
  return useQuery({
    queryKey: ['health-status'],
    queryFn: async () => {
      const result = await getHealthStatus();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
};

/**
 * Hook for checking health ready status
 */
export const useHealthReady = () => {
  return useQuery({
    queryKey: ['health-ready'],
    queryFn: async () => {
      const result = await getHealthReady();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
};

/**
 * Hook for checking health live status
 */
export const useHealthLive = () => {
  return useQuery({
    queryKey: ['health-live'],
    queryFn: async () => {
      const result = await getHealthLive();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.status;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      return failureCount < 3;
    },
  });
};

// ✅ Utility Hooks

/**
 * Hook for clinic-aware queries
 */
export const useClinicAwareQuery = <T>(
  queryKey: string[],
  queryFn: (clinicId: string) => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return useQuery({
    queryKey: [...queryKey, clinicId],
    queryFn: () => queryFn(clinicId),
    enabled: !!clinicId && hasPermission(Permission.VIEW_CLINICS) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval || false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message.includes('Access denied')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for checking if user has clinic access
 */
export const useHasClinicAccess = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    hasAccess: !!clinicId && hasPermission(Permission.VIEW_CLINICS),
    clinicId,
    isLoading: false, // This could be enhanced with actual loading state
  };
};

/**
 * Hook for clinic context
 */
export const useClinicContext = () => {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = useRBAC();
  
  return {
    clinicId,
    hasPermission,
    isAuthenticated: !!clinicId,
    canRead: hasPermission(Permission.VIEW_CLINICS),
    canCreate: hasPermission(Permission.CREATE_CLINICS),
    canUpdate: hasPermission(Permission.UPDATE_CLINICS),
    canDelete: hasPermission(Permission.DELETE_CLINICS),
  };
};
