# Coding Standards - Healthcare Frontend
# Version: 2.1.0 | Next.js 16 + React 19 + TypeScript 5
# Enterprise-Grade Healthcare Coding Standards

## 🎯 **Core Principles (SOLID, DRY, KISS)**

### **SOLID Principles**
- **Single Responsibility**: Each component/hook handles one concern
- **Open/Closed**: Extend via variants and composition, not modification
- **Liskov Substitution**: Interfaces ensure consistent behavior
- **Interface Segregation**: Role-specific interfaces
- **Dependency Inversion**: Depend on abstractions (hooks, stores), not implementations

### **DRY (Don't Repeat Yourself)**
- Reusable schemas, hooks, and component patterns
- Centralized configuration (`APP_CONFIG`)
- Unified query key factory (`queryKeys`)
- Common validation utilities
- Shared error handling

### **KISS (Keep It Simple, Stupid)**
- Simple, readable code over clever solutions
- Clear data flow
- Direct API patterns
- Minimal abstraction layers

### **Technology Stack**
- **Framework**: Next.js 16.1.1 with App Router + Turbopack
- **React**: 19.2.x with Server Components
- **TypeScript**: 5.x with strict mode
- **State Management**: TanStack Query v5.90+ | Zustand v5.0.9 with immer
- **Forms**: React Hook Form v7.70 + Zod v4.3.5
- **UI Components**: shadcn/ui + Radix UI + Tailwind CSS v4
- **Internationalization**: next-intl v4.7
- **Real-time**: Socket.IO v4.8.3 + Firebase v12.7
- **Video**: OpenVidu Browser v2.32.1
- **Toast**: Sonner v2.0.7
- **Animations**: Framer Motion v12.24

## 💻 **Core Coding Principles**

### **TypeScript Standards**

#### **Strict TypeScript Configuration**
```typescript
// tsconfig.json - Recommended settings
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,                    // Enable all strict checks
    "noImplicitAny": true,             // No implicit any types
    "noImplicitReturns": true,         // Functions must return values
    "noImplicitThis": true,            // No implicit this bindings
    "noUnusedLocals": true,            // No unused local variables
    "noUnusedParameters": true,        // No unused parameters
    "exactOptionalPropertyTypes": true, // Strict optional properties
    "noUncheckedIndexedAccess": true,  // Check indexed access
    "noImplicitOverride": true,        // Explicit override keywords
    "allowUnusedLabels": false,        // No unused labels
    "allowUnreachableCode": false      // No unreachable code
  }
}
```

#### **Type Definitions**
```typescript
// ✅ Always define explicit types for healthcare data
interface Patient {
  readonly id: string;               // Use readonly for IDs
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER'; // Use literal types
  clinicId: string;
  medicalRecordNumber: string;
  emergencyContact: EmergencyContact;
  insuranceInfo?: InsuranceInfo;     // Optional with ?
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Use branded types for sensitive data
type PatientId = string & { readonly __brand: 'PatientId' };
type MedicalRecordId = string & { readonly __brand: 'MedicalRecordId' };
type ClinicId = string & { readonly __brand: 'ClinicId' };

// ✅ Define union types for status enums
type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'CONFIRMED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

// ✅ Use generic types for API responses
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  errors?: ValidationError[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

// ✅ Comprehensive error types
interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  context?: Record<string, unknown>;
}
```

#### **Required Import Pattern (MANDATORY)**
```typescript
// ✅ MANDATORY import structure for ALL components
// React & Next.js (ALWAYS FIRST)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// External libraries (SECOND)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Internal components & hooks (THIRD)
import { Button } from '@/components/ui/button';
import { useCurrentClinicId } from '@/hooks/useClinic';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/useRBAC';

// Types & schemas (LAST)
import type { User, Clinic, Patient } from '@/types';
import { createPatientSchema } from '@/lib/schema/patient';
```

#### **Export Standards**
```typescript
// ✅ Named exports (preferred over default exports)
export const PatientManagement = () => {
  // Component implementation
};

export const usePatientManagement = () => {
  // Hook implementation
};

export type { Patient, CreatePatientData };
```

### **React Component Standards**

#### **Component Structure**
```typescript
// ✅ Complete component template
'use client'; // Only when client interactivity is needed

import { useState, useCallback, useMemo } from 'react';
import { useCurrentClinicId } from '@/hooks/useClinic';
import { usePermissions } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Patient } from '@/types/patient.types';

// ✅ Props interface with JSDoc
interface PatientCardProps {
  /** Patient data to display */
  patient: Patient;
  /** Callback when patient is edited */
  onEdit?: (patient: Patient) => void;
  /** Callback when patient is deleted */
  onDelete?: (patientId: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Custom variant for the card */
  variant?: 'default' | 'compact' | 'detailed';
}

// ✅ Component with proper error handling and accessibility
export function PatientCard({
  patient,
  onEdit,
  onDelete,
  className,
  isLoading = false,
  variant = 'default'
}: PatientCardProps) {
  // ✅ Hooks at the top
  const clinicId = useCurrentClinicId();
  const { hasPermission } = usePermissions();
  
  // ✅ Local state
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // ✅ Computed values with useMemo
  const displayName = useMemo(() => 
    `${patient.firstName} ${patient.lastName}`.trim(),
    [patient.firstName, patient.lastName]
  );
  
  const canEdit = useMemo(() => 
    hasPermission('patients.update'),
    [hasPermission]
  );
  
  const canDelete = useMemo(() => 
    hasPermission('patients.delete'),
    [hasPermission]
  );
  
  // ✅ Event handlers with useCallback
  const handleEdit = useCallback(async () => {
    if (!canEdit || isActionLoading) return;
    
    try {
      setIsActionLoading(true);
      await onEdit?.(patient);
    } catch (error) {
      console.error('Failed to edit patient:', error);
      // Show error toast or notification
    } finally {
      setIsActionLoading(false);
    }
  }, [patient, onEdit, canEdit, isActionLoading]);
  
  const handleDelete = useCallback(async () => {
    if (!canDelete || isActionLoading) return;
    
    // Show confirmation dialog
    const confirmed = await showConfirmDialog({
      title: 'Delete Patient',
      message: `Are you sure you want to delete ${displayName}?`,
      type: 'destructive'
    });
    
    if (!confirmed) return;
    
    try {
      setIsActionLoading(true);
      await onDelete?.(patient.id);
    } catch (error) {
      console.error('Failed to delete patient:', error);
      // Show error toast
    } finally {
      setIsActionLoading(false);
    }
  }, [patient.id, onDelete, canDelete, displayName, isActionLoading]);
  
  // ✅ Early returns for permission checks
  if (!hasPermission('patients.read')) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          Access denied
        </div>
      </Card>
    );
  }
  
  // ✅ Loading state
  if (isLoading) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center space-x-4">
          <LoadingSpinner size="sm" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }
  
  // ✅ Main render with proper accessibility
  return (
    <Card 
      className={`p-4 transition-shadow hover:shadow-md ${className}`}
      role="article"
      aria-labelledby={`patient-${patient.id}-name`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 
            id={`patient-${patient.id}-name`}
            className="text-lg font-semibold truncate"
          >
            {displayName}
          </h3>
          
          {patient.email && (
            <p className="text-sm text-muted-foreground truncate">
              {patient.email}
            </p>
          )}
          
          {variant === 'detailed' && (
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="font-medium">DOB:</span>{' '}
                {format(new Date(patient.dateOfBirth), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm">
                <span className="font-medium">Gender:</span>{' '}
                {patient.gender}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isActionLoading}
              aria-label={`Edit ${displayName}`}
            >
              {isActionLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Edit'
              )}
            </Button>
          )}
          
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isActionLoading}
              aria-label={`Delete ${displayName}`}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ✅ Add display name for better debugging
PatientCard.displayName = 'PatientCard';
```

#### **Custom Hook Standards**
```typescript
// ✅ Comprehensive hook implementation
import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentClinicId } from './useClinic';
import { usePermissions } from './useRBAC';
import { getPatients, createPatient, updatePatient, deletePatient } from '@/lib/actions/patients.server';
import type { Patient, CreatePatientData, UpdatePatientData, PatientFilters } from '@/types/patient.types';

// ✅ Hook options interface
interface UsePatientManagementOptions {
  initialFilters?: PatientFilters;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

// ✅ Hook return type
interface UsePatientManagementReturn {
  // Data
  patients: Patient[];
  selectedPatients: Patient[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: Error | null;
  
  // Actions
  createPatient: (data: CreatePatientData) => Promise<Patient>;
  updatePatient: (id: string, data: UpdatePatientData) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  bulkDeletePatients: (ids: string[]) => Promise<void>;
  
  // Selection
  selectPatient: (patient: Patient) => void;
  deselectPatient: (patientId: string) => void;
  selectAllPatients: () => void;
  clearSelection: () => void;
  
  // Filtering
  filters: PatientFilters;
  setFilters: (filters: PatientFilters) => void;
  clearFilters: () => void;
  
  // Refresh
  refetch: () => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  setPage: (page: number) => void;
}

// ✅ Custom hook with comprehensive functionality
export function usePatientManagement(
  options: UsePatientManagementOptions = {}
): UsePatientManagementReturn {
  const {
    initialFilters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    onError,
    onSuccess
  } = options;
  
  // ✅ Dependencies
  const clinicId = useCurrentClinicId();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  
  // ✅ State management
  const [filters, setFilters] = useState<PatientFilters>(initialFilters);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  // ✅ Refs for stable references
  const errorCallbackRef = useRef(onError);
  const successCallbackRef = useRef(onSuccess);
  
  // ✅ Update refs when callbacks change
  useEffect(() => {
    errorCallbackRef.current = onError;
    successCallbackRef.current = onSuccess;
  }, [onError, onSuccess]);
  
  // ✅ Query with proper error handling
  const {
    data: patientsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['patients', clinicId, filters, currentPage],
    queryFn: () => getPatients(clinicId, { ...filters, page: currentPage }),
    enabled: !!clinicId && hasPermission('patients.read'),
    staleTime: autoRefresh ? 0 : 5 * 60 * 1000, // 5 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: (failureCount, error) => {
      // Don't retry on permission errors
      if (error.message.includes('403') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 3;
    },
    onError: (error: Error) => {
      console.error('Failed to fetch patients:', error);
      errorCallbackRef.current?.(error);
    }
  });
  
  // ✅ Mutations with optimistic updates
  const createMutation = useMutation({
    mutationFn: (data: CreatePatientData) => createPatient(data),
    onMutate: async (newPatient) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['patients', clinicId] });
      
      // Snapshot previous value
      const previousPatients = queryClient.getQueryData(['patients', clinicId, filters, currentPage]);
      
      // Optimistically update
      queryClient.setQueryData(['patients', clinicId, filters, currentPage], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          patients: [{ ...newPatient, id: 'temp-id' }, ...old.patients]
        };
      });
      
      return { previousPatients };
    },
    onError: (error, newPatient, context) => {
      // Rollback optimistic update
      if (context?.previousPatients) {
        queryClient.setQueryData(['patients', clinicId, filters, currentPage], context.previousPatients);
      }
      errorCallbackRef.current?.(error as Error);
    },
    onSuccess: (patient) => {
      successCallbackRef.current?.(`Patient ${patient.firstName} ${patient.lastName} created successfully`);
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['patients', clinicId] });
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePatientData }) =>
      updatePatient(id, data),
    onSuccess: (patient) => {
      // Update cache
      queryClient.setQueryData(['patients', clinicId, filters, currentPage], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          patients: old.patients.map((p: Patient) => 
            p.id === patient.id ? patient : p
          )
        };
      });
      successCallbackRef.current?.(`Patient ${patient.firstName} ${patient.lastName} updated successfully`);
    },
    onError: (error) => {
      errorCallbackRef.current?.(error as Error);
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['patients', clinicId, filters, currentPage], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          patients: old.patients.filter((p: Patient) => p.id !== deletedId)
        };
      });
      
      // Remove from selection
      setSelectedPatients(prev => prev.filter(p => p.id !== deletedId));
      
      successCallbackRef.current?.('Patient deleted successfully');
    },
    onError: (error) => {
      errorCallbackRef.current?.(error as Error);
    }
  });
  
  // ✅ Action handlers
  const handleCreatePatient = useCallback(async (data: CreatePatientData): Promise<Patient> => {
    if (!hasPermission('patients.create')) {
      throw new Error('Insufficient permissions to create patient');
    }
    return createMutation.mutateAsync(data);
  }, [createMutation, hasPermission]);
  
  const handleUpdatePatient = useCallback(async (id: string, data: UpdatePatientData): Promise<Patient> => {
    if (!hasPermission('patients.update')) {
      throw new Error('Insufficient permissions to update patient');
    }
    return updateMutation.mutateAsync({ id, data });
  }, [updateMutation, hasPermission]);
  
  const handleDeletePatient = useCallback(async (id: string): Promise<void> => {
    if (!hasPermission('patients.delete')) {
      throw new Error('Insufficient permissions to delete patient');
    }
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation, hasPermission]);
  
  const handleBulkDeletePatients = useCallback(async (ids: string[]): Promise<void> => {
    if (!hasPermission('patients.delete')) {
      throw new Error('Insufficient permissions to delete patients');
    }
    
    await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
    setSelectedPatients([]);
  }, [deleteMutation, hasPermission]);
  
  // ✅ Selection handlers
  const selectPatient = useCallback((patient: Patient) => {
    setSelectedPatients(prev => {
      const exists = prev.find(p => p.id === patient.id);
      return exists ? prev : [...prev, patient];
    });
  }, []);
  
  const deselectPatient = useCallback((patientId: string) => {
    setSelectedPatients(prev => prev.filter(p => p.id !== patientId));
  }, []);
  
  const selectAllPatients = useCallback(() => {
    if (patientsData?.patients) {
      setSelectedPatients(patientsData.patients);
    }
  }, [patientsData?.patients]);
  
  const clearSelection = useCallback(() => {
    setSelectedPatients([]);
  }, []);
  
  // ✅ Filter handlers
  const handleSetFilters = useCallback((newFilters: PatientFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  }, []);
  
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);
  
  // ✅ Pagination handlers
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  // ✅ Return all functionality
  return {
    // Data
    patients: patientsData?.patients || [],
    selectedPatients,
    
    // Loading states
    isLoading,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Error state
    error,
    
    // Actions
    createPatient: handleCreatePatient,
    updatePatient: handleUpdatePatient,
    deletePatient: handleDeletePatient,
    bulkDeletePatients: handleBulkDeletePatients,
    
    // Selection
    selectPatient,
    deselectPatient,
    selectAllPatients,
    clearSelection,
    
    // Filtering
    filters,
    setFilters: handleSetFilters,
    clearFilters,
    
    // Refresh
    refetch,
    
    // Pagination
    currentPage,
    totalPages: patientsData?.totalPages || 1,
    setPage
  };
}
```

### **Form Handling Standards**

#### **React Hook Form + Zod Pattern**
```typescript
// ✅ Complete form implementation
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreatePatient } from '@/hooks/usePatients';

// ✅ Comprehensive validation schema
const createPatientSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Invalid characters in first name'),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Invalid characters in last name'),
  
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid phone number'),
  
  dateOfBirth: z.string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 0 && age <= 150;
    }, 'Please enter a valid date of birth'),
  
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select a gender',
  }),
  
  address: z.object({
    street: z.string()
      .min(5, 'Street address must be at least 5 characters')
      .max(100, 'Street address must be less than 100 characters'),
    city: z.string()
      .min(2, 'City must be at least 2 characters')
      .max(50, 'City must be less than 50 characters'),
    state: z.string()
      .min(2, 'State must be at least 2 characters')
      .max(50, 'State must be less than 50 characters'),
    zipCode: z.string()
      .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
  }),
  
  emergencyContact: z.object({
    name: z.string()
      .min(2, 'Emergency contact name must be at least 2 characters')
      .max(100, 'Emergency contact name must be less than 100 characters'),
    relationship: z.string()
      .min(2, 'Relationship must be at least 2 characters')
      .max(50, 'Relationship must be less than 50 characters'),
    phone: z.string()
      .regex(/^\+?[1-9]\d{9,14}$/, 'Please enter a valid emergency contact phone number'),
  }),
  
  medicalHistory: z.string()
    .max(2000, 'Medical history must be less than 2000 characters')
    .optional(),
  
  insuranceInfo: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    groupNumber: z.string().optional(),
  }).optional(),
});

type CreatePatientFormData = z.infer<typeof createPatientSchema>;

interface CreatePatientFormProps {
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
  defaultValues?: Partial<CreatePatientFormData>;
}

export function CreatePatientForm({
  onSuccess,
  onCancel,
  defaultValues
}: CreatePatientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { createPatient, isCreating } = useCreatePatient();
  
  // ✅ Form setup with proper validation
  const form = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: undefined,
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      medicalHistory: '',
      insuranceInfo: {
        provider: '',
        policyNumber: '',
        groupNumber: '',
      },
      ...defaultValues,
    },
    mode: 'onChange', // Validate on change
  });
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid, isDirty, isSubmitting },
    reset,
    setError,
  } = form;
  
  // ✅ Form submission with comprehensive error handling
  const onSubmit = async (data: CreatePatientFormData) => {
    try {
      const patient = await createPatient(data);
      
      toast({
        title: 'Success',
        description: `Patient ${patient.firstName} ${patient.lastName} created successfully`,
      });
      
      reset();
      onSuccess?.(patient);
      router.push(`/dashboard/patients/${patient.id}`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      
      // Handle specific validation errors
      if (error instanceof Error && error.message.includes('duplicate')) {
        setError('phone', {
          type: 'manual',
          message: 'A patient with this phone number already exists',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create patient. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  // ✅ Comprehensive form render
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter the patient's basic personal information.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter first name"
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="text-sm text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          
          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter last name"
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="text-sm text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="patient@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
          
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="+1 (555) 123-4567"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <p id="phone-error" className="text-sm text-destructive">
                {errors.phone.message}
              </p>
            )}
          </div>
          
          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? 'dateOfBirth-error' : undefined}
            />
            {errors.dateOfBirth && (
              <p id="dateOfBirth-error" className="text-sm text-destructive">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>
          
          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger 
                    aria-invalid={!!errors.gender}
                    aria-describedby={errors.gender ? 'gender-error' : undefined}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p id="gender-error" className="text-sm text-destructive">
                {errors.gender.message}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Address Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Address Information</h3>
          <p className="text-sm text-muted-foreground">
            Enter the patient's residential address.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="address.street">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address.street"
              {...register('address.street')}
              placeholder="123 Main Street"
              aria-invalid={!!errors.address?.street}
              aria-describedby={errors.address?.street ? 'street-error' : undefined}
            />
            {errors.address?.street && (
              <p id="street-error" className="text-sm text-destructive">
                {errors.address.street.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address.city"
                {...register('address.city')}
                placeholder="New York"
                aria-invalid={!!errors.address?.city}
                aria-describedby={errors.address?.city ? 'city-error' : undefined}
              />
              {errors.address?.city && (
                <p id="city-error" className="text-sm text-destructive">
                  {errors.address.city.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address.state">
                State <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address.state"
                {...register('address.state')}
                placeholder="NY"
                aria-invalid={!!errors.address?.state}
                aria-describedby={errors.address?.state ? 'state-error' : undefined}
              />
              {errors.address?.state && (
                <p id="state-error" className="text-sm text-destructive">
                  {errors.address.state.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address.zipCode">
                ZIP Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address.zipCode"
                {...register('address.zipCode')}
                placeholder="12345"
                aria-invalid={!!errors.address?.zipCode}
                aria-describedby={errors.address?.zipCode ? 'zipCode-error' : undefined}
              />
              {errors.address?.zipCode && (
                <p id="zipCode-error" className="text-sm text-destructive">
                  {errors.address.zipCode.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            onCancel?.();
          }}
          disabled={isSubmitting || isCreating}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={!isValid || isSubmitting || isCreating}
          className="min-w-[120px]"
        >
          {isSubmitting || isCreating ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Creating...
            </>
          ) : (
            'Create Patient'
          )}
        </Button>
      </div>
    </form>
  );
}
```

## 🎨 **Component Patterns**

### **Input Component with CVA Variants**

The `Input` component uses CVA (Class Variance Authority) for type-safe variant management, providing multiple variants optimized for different healthcare use cases.

```typescript
// ✅ Input component with CVA variants (from src/components/ui/input.tsx)
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 border bg-transparent text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border-input dark:bg-input/30 rounded-md px-3 py-1 h-9",
        medical: "form-medical border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl px-4 py-3 h-12 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
        floating: "form-floating border-border/50 dark:border-border/60 rounded-xl px-3 pt-6 pb-2 h-auto focus-visible:border-primary",
        mobile: "mobile-touch-target rounded-xl px-4 py-4 h-12 text-base border-border/50 dark:border-border/60",
      },
      inputSize: {
        sm: "h-8 px-2 py-1 text-sm",
        default: "h-9 px-3 py-1",
        lg: "h-10 px-4 py-2",
        xl: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {
  variant?: "default" | "medical" | "floating" | "mobile";
  inputSize?: "sm" | "default" | "lg" | "xl";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
```

**Usage Examples:**
```typescript
// ✅ Default input
<Input placeholder="Enter text" />

// ✅ Medical variant (for patient forms)
<Input variant="medical" inputSize="lg" placeholder="Patient name" />

// ✅ Floating label variant
<Input variant="floating" placeholder="Email address" />

// ✅ Mobile-optimized variant
<Input variant="mobile" placeholder="Phone number" />
```

### **useZodForm Hook Pattern**

The `useZodForm` hook integrates Zod schemas with React Hook Form and TanStack Query mutations, providing a streamlined form handling pattern.

```typescript
// ✅ useZodForm hook (from src/hooks/utils/useZodForm.ts)
import { UseMutateFunction } from "@tanstack/react-query";
import { useForm, DefaultValues, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const useZodForm = <T extends z.ZodType<any, any, any>>(
  schema: T,
  mutation: UseMutateFunction<unknown, unknown, z.infer<T>>,
  defaultValues?: DefaultValues<z.infer<T>>
): UseFormReturn<z.infer<T>> & {
  onFormSubmit: () => Promise<void>;
} => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema) as any,
    ...(defaultValues ? { defaultValues } : {}),
    mode: "onChange" as const,
  });

  const onFormSubmit = form.handleSubmit(async (values) => {
    try {
      await Promise.resolve(mutation(values as z.infer<T>));
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  });

  return {
    ...form,
    onFormSubmit,
  } as UseFormReturn<z.infer<T>> & {
    onFormSubmit: () => Promise<void>;
  };
};

export default useZodForm;
```

**Usage Example:**
```typescript
// ✅ Define schema
const patientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

// ✅ Use in component
function PatientForm() {
  const createPatientMutation = useMutation({
    mutationFn: createPatientAction,
  });

  const { register, formState: { errors }, onFormSubmit } = useZodForm(
    patientSchema,
    createPatientMutation.mutate,
    { firstName: '', lastName: '', email: '' }
  );
  
  return (
    <form onSubmit={onFormSubmit}>
      <Input {...register('firstName')} />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      {/* ... other fields */}
    </form>
  );
}
```

## 🔧 **Utility Patterns**

### **Healthcare-Specific Logger Methods**

The `logger` utility provides healthcare-specific logging methods for better observability and debugging.

```typescript
// ✅ Logger utility (from src/lib/utils/logger.ts)
import { APP_CONFIG } from '@/lib/config/config';

export const logger = {
  // Standard methods
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => {
    const errorContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error };
    console.error(`[ERROR] ${message}`, errorContext);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, context);
  },
  info: (message: string, context?: Record<string, unknown>) => {
    if (APP_CONFIG.IS_DEVELOPMENT) {
      console.info(`[INFO] ${message}`, context);
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    if (APP_CONFIG.IS_DEVELOPMENT) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  },
  
  // ✅ Healthcare-specific methods
  appointment: (action: string, appointmentId: string, context?: Record<string, unknown>) => {
    logger.info(`Appointment ${action}`, { 
      ...context, 
      component: 'appointments', 
      appointmentId 
    });
  },
  patient: (action: string, patientId: string, context?: Record<string, unknown>) => {
    logger.info(`Patient ${action}`, { 
      ...context, 
      component: 'patients', 
      patientId 
    });
  },
  auth: (action: string, context?: Record<string, unknown>) => {
    logger.info(`Authentication ${action}`, { 
      ...context, 
      component: 'auth' 
    });
  },
  api: (method: string, endpoint: string, status?: number, context?: Record<string, unknown>) => {
    const level = status && status >= 400 ? 'error' : 'info';
    logger[level](`API ${method} ${endpoint}`, { 
      ...context, 
      component: 'api', 
      method, 
      endpoint, 
      status 
    });
  },
};
```

**Usage Examples:**
```typescript
// ✅ Standard logging
logger.error('Failed to create appointment', error, { component: 'useAppointments' });
logger.warn('Token expiring soon', { userId, expiresIn: '5min' });

// ✅ Healthcare-specific logging
logger.appointment('created', appointmentId, { userId: user.id, clinicId });
logger.patient('updated', patientId, { userId, changes: ['email', 'phone'] });
logger.auth('login-success', { userId, method: 'email' });
logger.api('POST', '/api/appointments', 201, { duration: '120ms' });
```

### **APP_CONFIG Central Configuration**

The `APP_CONFIG` object serves as a single source of truth for all application configuration, including environment, API, WebSocket, feature flags, and logging settings.

```typescript
// ✅ APP_CONFIG usage (from src/lib/config/config.ts)
import { APP_CONFIG } from '@/lib/config/config';

// ✅ API Configuration
const apiTimeout = APP_CONFIG.API.TIMEOUT.REQUEST; // 30000
const defaultPageSize = APP_CONFIG.API.PAGINATION.DEFAULT_PAGE_SIZE; // 20
const apiBaseUrl = APP_CONFIG.API.BASE_URL;

// ✅ WebSocket Configuration
const wsUrl = APP_CONFIG.WEBSOCKET.URL;
const wsTimeout = APP_CONFIG.WEBSOCKET.TIMEOUT;
const wsMaxReconnectAttempts = APP_CONFIG.WEBSOCKET.MAX_RECONNECT_ATTEMPTS;

// ✅ Feature Flags
if (APP_CONFIG.FEATURES.VIDEO_CALLS) {
  // Enable video call functionality
}
if (APP_CONFIG.FEATURES.NOTIFICATIONS) {
  // Enable push notifications
}
if (APP_CONFIG.FEATURES.REAL_TIME) {
  // Enable real-time features
}

// ✅ Environment Checks
if (APP_CONFIG.IS_DEVELOPMENT) {
  // Development-only code
  logger.debug('Debug mode enabled');
}
if (APP_CONFIG.IS_PRODUCTION) {
  // Production-only code
  // Enable analytics, error tracking, etc.
}

// ✅ Authentication Configuration
const isAuthEnabled = APP_CONFIG.AUTH.ENABLED;
const googleClientId = APP_CONFIG.AUTH.GOOGLE_CLIENT_ID;

// ✅ App Configuration
const appUrl = APP_CONFIG.APP.URL;
const appVersion = APP_CONFIG.APP.VERSION;
```

**Key Benefits:**
- Single source of truth for all configuration
- Type-safe configuration access
- Environment-aware defaults
- Centralized feature flag management
- Easy testing with mock configurations

### **Complete Query Keys Factory**

The `queryKeys` factory provides type-safe, hierarchical query keys for all domains, ensuring consistent cache key management across the application.

```typescript
// ✅ Query Keys Factory (from src/hooks/query/config.ts)
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
  
  // Patients
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (clinicId: string, filters?: Record<string, unknown>) => 
      [...queryKeys.patients.lists(), clinicId, filters] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
  },
} as const;
```

**Usage Examples:**
```typescript
// ✅ Use in queries
const { data } = useQuery({
  queryKey: queryKeys.appointments.list({ clinicId, status: 'scheduled' }),
  queryFn: () => getAppointments({ clinicId, status: 'scheduled' }),
});

// ✅ Use in mutations for cache invalidation
const mutation = useMutation({
  mutationFn: createAppointment,
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.appointments.all 
    });
  },
});

// ✅ Use for specific cache updates
queryClient.setQueryData(
  queryKeys.appointments.detail(appointmentId),
  updatedAppointment
);
```

### **Error Handling Standards**

#### **Error Boundary Implementation**
```typescript
// ✅ Comprehensive error boundary
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  eventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      eventId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to external error reporting service
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  private logErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Log to your error reporting service (e.g., Sentry, LogRocket, etc.)
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
      };

      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  };

  private getCurrentUserId = (): string | null => {
    // Get current user ID from your auth system
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData).id : null;
    } catch {
      return null;
    }
  };

  private getSessionId = (): string | null => {
    // Get session ID from cookies or storage
    try {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith('session_id='))
        ?.split('=')[1] || null;
    } catch {
      return null;
    }
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        eventId: undefined,
      });
    }, 100);
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
    // Optionally reload the page for critical errors
    if (this.state.error?.message.includes('ChunkLoadError')) {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.resetErrorBoundary();
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Oops! Something went wrong</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-muted p-4 rounded-md">
                  <summary className="cursor-pointer font-medium text-sm mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-xs space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                    {this.state.eventId && (
                      <div>
                        <strong>Event ID:</strong> {this.state.eventId}
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>
              
              <p className="text-center text-xs text-muted-foreground">
                If this problem persists, please contact support.
                {this.state.eventId && (
                  <>
                    <br />
                    Reference ID: {this.state.eventId}
                  </>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ HOC for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
```

### **Testing Standards**

#### **Component Testing with React Testing Library**
```typescript
// ✅ Comprehensive component test
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PatientCard } from '@/components/patients/PatientCard';
import { usePermissions } from '@/hooks/useRBAC';
import { useCurrentClinicId } from '@/hooks/useClinic';
import type { Patient } from '@/types/patient.types';

// ✅ Mock external dependencies
jest.mock('@/hooks/useRBAC');
jest.mock('@/hooks/useClinic');
jest.mock('@/hooks/use-toast');

const mockUsePermissions = usePermissions as jest.MockedFunction<typeof usePermissions>;
const mockUseCurrentClinicId = useCurrentClinicId as jest.MockedFunction<typeof useCurrentClinicId>;

// ✅ Test data setup
const mockPatient: Patient = {
  id: 'patient-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'MALE',
  clinicId: 'clinic-1',
  medicalRecordNumber: 'MRN-001',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001'
  },
  emergencyContact: {
    name: 'Jane Doe',
    relationship: 'Spouse',
    phone: '+1234567891'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ✅ Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const renderPatientCard = (props: Partial<React.ComponentProps<typeof PatientCard>> = {}) => {
  const defaultProps = {
    patient: mockPatient,
    ...props,
  };

  return render(<PatientCard {...defaultProps} />, {
    wrapper: createWrapper(),
  });
};

// ✅ Test suite
describe('PatientCard', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseCurrentClinicId.mockReturnValue('clinic-1');
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
      permissions: ['patients.read', 'patients.update', 'patients.delete'],
      isLoading: false,
    });
  });

  describe('Rendering', () => {
    it('renders patient information correctly', () => {
      renderPatientCard();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    });

    it('renders with detailed variant', () => {
      renderPatientCard({ variant: 'detailed' });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/DOB:/)).toBeInTheDocument();
      expect(screen.getByText(/Gender:/)).toBeInTheDocument();
      expect(screen.getByText('Jan 01, 1990')).toBeInTheDocument();
      expect(screen.getByText('MALE')).toBeInTheDocument();
    });

    it('renders loading state correctly', () => {
      renderPatientCard({ isLoading: true });
      
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('shows edit and delete buttons when user has permissions', () => {
      renderPatientCard();
      
      expect(screen.getByRole('button', { name: /edit john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete john doe/i })).toBeInTheDocument();
    });

    it('hides edit button when user lacks update permission', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockImplementation((permission) => permission !== 'patients.update'),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
        permissions: ['patients.read', 'patients.delete'],
        isLoading: false,
      });

      renderPatientCard();
      
      expect(screen.queryByRole('button', { name: /edit john doe/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete john doe/i })).toBeInTheDocument();
    });

    it('hides delete button when user lacks delete permission', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockImplementation((permission) => permission !== 'patients.delete'),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
        permissions: ['patients.read', 'patients.update'],
        isLoading: false,
      });

      renderPatientCard();
      
      expect(screen.getByRole('button', { name: /edit john doe/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete john doe/i })).not.toBeInTheDocument();
    });

    it('shows access denied when user lacks read permission', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: jest.fn().mockReturnValue(false),
        hasAnyPermission: jest.fn(),
        hasAllPermissions: jest.fn(),
        permissions: [],
        isLoading: false,
      });

      renderPatientCard();
      
      expect(screen.getByText('Access denied')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onEdit when edit button is clicked', async () => {
      const onEdit = jest.fn();
      renderPatientCard({ onEdit });
      
      const editButton = screen.getByRole('button', { name: /edit john doe/i });
      await userEvent.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockPatient);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const onDelete = jest.fn();
      renderPatientCard({ onDelete });
      
      const deleteButton = screen.getByRole('button', { name: /delete john doe/i });
      await userEvent.click(deleteButton);
      
      expect(onDelete).toHaveBeenCalledWith('patient-1');
    });

    it('disables buttons when loading', () => {
      renderPatientCard({ isLoading: false });
      
      // Simulate loading state by clicking edit button
      const editButton = screen.getByRole('button', { name: /edit john doe/i });
      fireEvent.click(editButton);
      
      // Note: This test would need the component to actually manage loading state
      // The component would need to be updated to handle this case
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderPatientCard();
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-labelledby', 'patient-patient-1-name');
      
      const heading = screen.getByRole('heading', { name: 'John Doe' });
      expect(heading).toHaveAttribute('id', 'patient-patient-1-name');
    });

    it('has proper button labels', () => {
      renderPatientCard();
      
      expect(screen.getByRole('button', { name: /edit john doe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete john doe/i })).toBeInTheDocument();
    });

    it('handles keyboard navigation', async () => {
      renderPatientCard({ onEdit: jest.fn() });
      
      const editButton = screen.getByRole('button', { name: /edit john doe/i });
      
      // Tab to the button
      await userEvent.tab();
      expect(editButton).toHaveFocus();
      
      // Press Enter to activate
      await userEvent.keyboard('{Enter}');
      // The onEdit function should be called
    });
  });

  describe('Error Handling', () => {
    it('handles missing email gracefully', () => {
      const patientWithoutEmail = { ...mockPatient, email: undefined };
      renderPatientCard({ patient: patientWithoutEmail });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('@')).not.toBeInTheDocument();
    });

    it('handles empty name gracefully', () => {
      const patientWithEmptyName = { ...mockPatient, firstName: '', lastName: '' };
      renderPatientCard({ patient: patientWithEmptyName });
      
      // Should still render the card but with empty name
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('');
    });
  });
});
```

## 📁 **Detailed Directory Structure**

### **Complete Project Structure**
```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Route groups for auth
│   ├── (dashboard)/              # Route groups for dashboard
│   ├── (public)/                 # Route groups for public pages
│   ├── (shared)/                 # Route groups for shared pages
│   ├── api/                      # API routes
│   ├── providers/                # React context providers
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # Reusable UI components (shadcn/ui)
│   ├── global/                   # Global components
│   ├── dashboard/                # Dashboard-specific components
│   ├── auth/                     # Authentication components
│   ├── ayurveda/                 # Ayurveda-specific components
│   ├── clinic/                   # Clinic management components
│   ├── rbac/                     # RBAC components
│   └── [feature]/                # Feature-specific components
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hooks
│   ├── useClinic.ts              # Clinic context hooks
│   ├── usePatients.ts            # Patient management hooks
│   ├── useDoctors.ts             # Doctor management hooks
│   ├── useAppointments.ts        # Appointment hooks
│   ├── usePharmacy.ts            # Pharmacy hooks
│   ├── useQueue.ts               # Queue management hooks
│   ├── useMedicalRecords.ts      # Medical records hooks
│   ├── useNotifications.ts       # Notification hooks
│   ├── useAnalytics.ts           # Analytics hooks
│   ├── useRBAC.ts                # RBAC hooks
│   └── useUsers.ts               # User management hooks
├── lib/                          # Utility functions and configurations
│   ├── actions/                  # Server actions
│   │   ├── auth.server.ts        # Authentication actions
│   │   ├── clinic.server.ts      # Clinic management actions
│   │   ├── patients.server.ts    # Patient actions
│   │   ├── doctors.server.ts     # Doctor actions
│   │   ├── appointments.server.ts # Appointment actions
│   │   ├── pharmacy.server.ts    # Pharmacy actions
│   │   ├── queue.server.ts       # Queue actions
│   │   ├── medical-records.server.ts # Medical records actions
│   │   ├── notifications.server.ts # Notification actions
│   │   ├── analytics.server.ts   # Analytics actions
│   │   └── users.server.ts       # User management actions
│   ├── i18n/                     # Internationalization
│   ├── schema/                   # Zod validation schemas
│   ├── constants/                # Application constants
│   ├── utils/                    # Utility functions
│   └── profile/                  # Profile completion utilities
├── stores/                       # Zustand stores
│   ├── useAppStore.ts            # Main app store
│   ├── useAppointmentStore.ts    # Appointment store
│   ├── useMedicalRecordsStore.ts # Medical records store
│   ├── useNotificationStore.ts   # Notification store
│   └── usePharmacyStore.ts       # Pharmacy store
├── types/                        # TypeScript type definitions
│   ├── auth.types.ts             # Authentication types
│   ├── clinic.types.ts           # Clinic types
│   ├── patient.types.ts          # Patient types
│   ├── doctor.types.ts           # Doctor types
│   ├── appointment.types.ts      # Appointment types
│   ├── pharmacy.types.ts         # Pharmacy types
│   ├── queue.types.ts            # Queue types
│   ├── medical-records.types.ts  # Medical records types
│   ├── notification.types.ts     # Notification types
│   ├── analytics.types.ts        # Analytics types
│   ├── rbac.types.ts             # RBAC types
│   └── form.ts                   # Form types
└── config/                       # Configuration files
    ├── routes.ts                 # Route configurations
    └── sidebarLinks.tsx          # Sidebar navigation
```

## 🌐 **Internationalization Standards**

### **Translation Structure**
```typescript
// ✅ Structured translation interface
export interface Translation {
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
  };
  navigation: {
    home: string;
    dashboard: string;
    patients: string;
    appointments: string;
    doctors: string;
    pharmacy: string;
    reports: string;
    settings: string;
  };
  patients: {
    title: string;
    create: string;
    list: string;
    details: string;
    medicalHistory: string;
    emergencyContact: string;
  };
  appointments: {
    schedule: string;
    upcoming: string;
    completed: string;
    cancelled: string;
    reschedule: string;
  };
  medical: {
    diagnosis: string;
    prescription: string;
    vitals: string;
    allergies: string;
    conditions: string;
  };
}
```

## 🎨 **UI/UX Standards**

### **Design System**
```typescript
// ✅ Consistent design tokens
export const designTokens = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
  },
  typography: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
  },
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a',
    },
    // Healthcare-specific colors
    medical: {
      emergency: '#dc2626',
      warning: '#f59e0b',
      success: '#10b981',
      info: '#3b82f6',
    }
  }
};
```

### **Accessibility Standards**
```typescript
// ✅ Accessibility helper functions
export const a11y = {
  // Minimum contrast ratio for healthcare apps
  contrastRatio: 4.5,
  
  // Touch target size (especially important for medical professionals)
  minTouchTarget: 44, // 44px minimum
  
  // Focus management
  focusManagement: {
    trapFocus: true,
    returnFocus: true,
    skipLinks: true,
  },
  
  // Screen reader support
  screenReader: {
    announcements: true,
    landmarks: true,
    skipNavigation: true,
  }
};
```

## 🔐 **Healthcare-Specific Security Patterns**

### **Data Protection**
```typescript
// ✅ Healthcare data handling patterns
export const healthcareDataPatterns = {
  // Always validate clinic context
  validateClinicContext: (clinicId: string, operation: string) => {
    if (!clinicId) {
      throw new Error(`Clinic context required for ${operation}`);
    }
  },
  
  // Audit trail for all medical data operations
  auditMedicalOperation: async (operation: AuditOperation) => {
    await auditLog({
      ...operation,
      timestamp: new Date(),
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
    });
  },
  
  // Sensitive data handling
  sanitizeSensitiveData: (data: any) => {
    // Remove or mask sensitive fields for client-side
    const { ssn, ...sanitized } = data;
    return {
      ...sanitized,
      ssn: ssn ? '***-**-' + ssn.slice(-4) : undefined,
    };
  }
};
```

## 📊 **Performance Optimization Patterns**

### **Healthcare-Optimized Performance**
```typescript
// ✅ Performance patterns for medical apps
export const performancePatterns = {
  // Preload critical medical data
  preloadCriticalData: async (patientId: string) => {
    await Promise.all([
      queryClient.prefetchQuery(['patient', patientId]),
      queryClient.prefetchQuery(['allergies', patientId]),
      queryClient.prefetchQuery(['medications', patientId]),
    ]);
  },
  
  // Optimize medical image loading
  optimizeImageLoading: {
    priority: ['emergency', 'critical', 'routine'],
    formats: ['webp', 'jpeg'],
    sizes: [400, 800, 1200],
    quality: 85,
  },
  
  // Cache strategies for different data types
  cacheStrategies: {
    patientData: { staleTime: 5 * 60 * 1000 }, // 5 minutes
    medicalRecords: { staleTime: 10 * 60 * 1000 }, // 10 minutes
    appointments: { staleTime: 2 * 60 * 1000 }, // 2 minutes
    analytics: { staleTime: 30 * 60 * 1000 }, // 30 minutes
  }
};
```

## 🔄 **Complete State Management Patterns**

### **TanStack Query Patterns**
```typescript
// ✅ Complete TanStack Query implementation
export function usePatients(clinicId: string, filters?: PatientFilters) {
  return useQuery({
    queryKey: ['patients', clinicId, filters],
    queryFn: () => getPatients(clinicId, filters),
    enabled: !!clinicId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 403/404 errors
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// ✅ Mutation with optimistic updates
export function useCreatePatient() {
  const queryClient = useQueryClient();
  const clinicId = useCurrentClinicId();

  return useMutation({
    mutationFn: (data: CreatePatientData) => 
      createPatient(clinicId, data),
    onSuccess: (newPatient) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({
        queryKey: ['patients', clinicId]
      });
      
      // Optimistically update cache
      queryClient.setQueryData(['patients', clinicId], (old: Patient[]) =>
        old ? [newPatient, ...old] : [newPatient]
      );
    },
    onError: (error) => {
      console.error('Failed to create patient:', error);
      // Show error toast
    },
  });
}
```

### **Complete Zustand Store Pattern**
```typescript
// ✅ Complete Zustand implementation
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  currentView: 'list' | 'grid' | 'calendar';
  
  // User Preferences
  defaultPageSize: number;
  language: 'en' | 'hi' | 'mr';
  
  // Temporary State
  selectedPatients: string[];
  searchQuery: string;
  filters: Record<string, any>;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrentView: (view: 'list' | 'grid' | 'calendar') => void;
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
  setSelectedPatients: (ids: string[]) => void;
  addSelectedPatient: (id: string) => void;
  removeSelectedPatient: (id: string) => void;
  clearSelectedPatients: () => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      theme: 'system',
      currentView: 'list',
      defaultPageSize: 20,
      language: 'en',
      selectedPatients: [],
      searchQuery: '',
      filters: {},
      
      // Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setCurrentView: (view) => set({ currentView: view }),
      setLanguage: (lang) => set({ language: lang }),
      setSelectedPatients: (ids) => set({ selectedPatients: ids }),
      addSelectedPatient: (id) => set((state) => ({
        selectedPatients: [...state.selectedPatients, id]
      })),
      removeSelectedPatient: (id) => set((state) => ({
        selectedPatients: state.selectedPatients.filter(pid => pid !== id)
      })),
      clearSelectedPatients: () => set({ selectedPatients: [] }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        defaultPageSize: state.defaultPageSize,
        currentView: state.currentView,
      }),
    }
  )
);
```

## 📋 **Extended Code Review Checklist**

### **Healthcare-Specific Review Items**
- [ ] **Medical Data Privacy**: All PHI properly handled and encrypted
- [ ] **Audit Trails**: Medical data access and modifications logged
- [ ] **HIPAA Compliance**: All requirements met for patient data
- [ ] **Emergency Access**: Critical patient data accessible during emergencies
- [ ] **Data Backup**: Patient data backup strategies implemented
- [ ] **User Permissions**: Role-appropriate access to medical information
- [ ] **Medical Terminology**: Correct and consistent medical term usage
- [ ] **Clinical Workflows**: Efficient healthcare professional workflows
- [ ] **Patient Safety**: Error handling that ensures patient safety
- [ ] **Regulatory Compliance**: All healthcare regulations followed

### **Technical Review Items**
- [ ] **Clinic Context**: All operations properly scoped to clinic
- [ ] **Permission Checks**: RBAC validation in all components
- [ ] **Error Boundaries**: Comprehensive error handling implemented
- [ ] **Loading States**: All async operations have loading indicators
- [ ] **Accessibility**: WCAG 2.1 AA compliance achieved
- [ ] **Internationalization**: Multi-language support implemented
- [ ] **Performance**: Optimized for healthcare data volumes
- [ ] **Caching**: Appropriate cache strategies for medical data
- [ ] **Security**: All security measures properly implemented
- [ ] **Query Keys**: Uses `queryKeys` factory for consistent cache keys
- [ ] **Toast IDs**: Uses `TOAST_IDS` constants for toast management
- [ ] **Error Messages**: Uses `sanitizeErrorMessage()` for user-facing errors
- [ ] **Logger**: Uses `logger` utility with healthcare-specific methods
- [ ] **APP_CONFIG**: Uses `APP_CONFIG` for all configuration needs
- [ ] **Forms**: Uses `useZodForm` hook for form integration
- [ ] **Input Variants**: Uses appropriate `Input` component variants (medical, floating, mobile)

## 🚨 **ANTI-PATTERNS (NEVER DO)**

### **❌ Critical Anti-Patterns**
```typescript
// ❌ Don't use any type
const handleSubmit = (data: any) => {
  // This loses type safety
};

// ❌ Don't forget error handling
const { data } = useQuery({
  queryKey: ['patients'],
  queryFn: getPatients
  // Missing error handling
});

// ❌ Don't skip loading states
function PatientList() {
  const { data } = usePatients();
  
  return (
    <div>
      {data?.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}

// ❌ Don't forget clinic context
const patients = await getPatients(); // Missing clinicId

// ❌ Don't use inline styles
<div style={{color: 'red', fontSize: '16px'}}>
  
// ❌ Don't forget accessibility
<button onClick={handleClick}>
  <X /> {/* Missing aria-label */}
</button>

// ❌ Don't skip permission checks
function DeleteButton({ patientId }: { patientId: string }) {
  return <Button onClick={() => deletePatient(patientId)}>Delete</Button>;
}
```

### **✅ Correct Patterns**
```typescript
// ✅ Use proper TypeScript types
interface HandleSubmitProps {
  name: string;
  email: string;
}
const handleSubmit = (data: HandleSubmitProps) => {
  // Type safe
};

// ✅ Handle all query states
function PatientList() {
  const { data, isLoading, error } = usePatients(clinicId);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;
  
  return (
    <div>
      {data.map(patient => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  );
}

// ✅ Include clinic context
const clinicId = useCurrentClinicId();
const patients = await getPatients(clinicId);

// ✅ Use Tailwind classes
<div className="text-red-500 text-base">

// ✅ Include accessibility
<Button onClick={handleClick} aria-label="Close dialog">
  <X aria-hidden="true" />
</Button>

// ✅ Check permissions
function DeleteButton({ patientId }: { patientId: string }) {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('patients.delete')) {
    return null;
  }
  
  return (
    <Button 
      onClick={() => deletePatient(patientId)}
      variant="destructive"
      aria-label="Delete patient"
    >
      Delete
    </Button>
  );
}
```

## 📋 **MANDATORY CHECKLIST**

### **Before Writing ANY Frontend Code:**
- [ ] Uses Next.js 14 with App Router (NOT Pages Router)
- [ ] Uses TypeScript strict mode with proper types
- [ ] Implements TanStack Query for server state
- [ ] Uses Zustand for client state management
- [ ] Uses React Hook Form + Zod for forms
- [ ] Uses shadcn/ui components with Tailwind CSS
- [ ] Includes clinic context validation
- [ ] Implements RBAC permission checks
- [ ] Handles loading, error, and empty states
- [ ] Includes proper accessibility features
- [ ] Uses proper error boundaries
- [ ] Implements responsive design
- [ ] Follows naming conventions
- [ ] Includes proper TypeScript types
- [ ] Uses server actions for mutations
- [ ] Uses `queryKeys` factory for query cache keys
- [ ] Uses `TOAST_IDS` constants for toast notifications
- [ ] Uses `sanitizeErrorMessage()` for error handling
- [ ] Uses `logger` utility for logging (with healthcare-specific methods)
- [ ] Uses `APP_CONFIG` for configuration
- [ ] Uses `useZodForm` hook for form integration
- [ ] Uses appropriate `Input` component variants
- [ ] Implements proper caching strategies

### **Healthcare-Specific Requirements:**
- [ ] Medical data privacy measures implemented
- [ ] Audit trails configured (if applicable)
- [ ] Healthcare regulations compliance checked
- [ ] Patient data is clinic-isolated
- [ ] Medical records are properly secured
- [ ] HIPAA compliance measures in place
- [ ] Emergency access procedures documented
- [ ] Data backup strategies implemented
- [ ] User permissions are role-appropriate
- [ ] Medical terminology is used correctly

### **Performance Requirements:**
- [ ] No unnecessary re-renders
- [ ] Proper caching is implemented
- [ ] Bundle size is optimized
- [ ] Images are optimized
- [ ] Code splitting is used appropriately
- [ ] API calls are clinic-scoped
- [ ] Sensitive data is properly encrypted
- [ ] Session management is secure

## 🎯 **PROJECT PRIORITY**

This is a **PROFESSIONAL HEALTHCARE APPLICATION** requiring:
- **Maximum security** and data protection
- **Excellent user experience** for healthcare professionals
- **Reliable error handling** and loading states
- **Proper accessibility** for all users
- **Multi-tenant data isolation** with clinic context
- **Role-based access control** throughout the app
- **Internationalization support** for multiple languages
- **High performance** and responsive design

**ALWAYS prioritize user experience, security, and accessibility in all frontend solutions.**

This comprehensive coding standards document ensures consistent, maintainable, and high-quality code across the healthcare frontend application.
