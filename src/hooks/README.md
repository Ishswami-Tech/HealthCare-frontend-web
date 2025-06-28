# Healthcare App Hooks

This directory contains all the React hooks for the Healthcare App frontend. These hooks provide a clean, type-safe interface for interacting with the backend API.

## Overview

The hooks are organized into several categories:

- **Base Hooks**: Core query and mutation hooks
- **Auth Hooks**: Authentication and session management
- **Appointment Hooks**: Appointment management and queue operations
- **Clinic Hooks**: Clinic and location management
- **User Hooks**: User profile and management
- **Utility Hooks**: Common utility functions

## Quick Start

```tsx
import { useAuth, useClinics, useAppointments } from '@/hooks';

function MyComponent() {
  const { session, isLoading } = useAuth();
  const { data: clinics, isPending } = useClinics();
  const { data: appointments } = useAppointments();

  if (isLoading || isPending) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {session?.user.firstName}</h1>
      <p>You have {clinics?.length} clinics</p>
      <p>You have {appointments?.length} appointments</p>
    </div>
  );
}
```

## Base Hooks

### useQueryData
A wrapper around TanStack Query's `useQuery` hook for data fetching.

```tsx
import { useQueryData } from '@/hooks';

const { data, isPending, isFetching, refetch } = useQueryData(
  ['users'],
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
);
```

### useMutationData
A wrapper around TanStack Query's `useMutation` hook for data mutations.

```tsx
import { useMutationData } from '@/hooks';

const { mutate, isPending } = useMutationData(
  ['createUser'],
  async (userData) => {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  },
  'users' // Query key to invalidate after mutation
);
```

### useZodForm
A hook that combines React Hook Form with Zod validation.

```tsx
import { useZodForm } from '@/hooks';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function LoginForm() {
  const form = useZodForm(schema, loginMutation);
  
  return (
    <form onSubmit={form.onFormSubmit}>
      <input {...form.register('email')} />
      <input {...form.register('password')} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Auth Hooks

### useAuth
Main authentication hook that manages user session and provides auth methods.

```tsx
import { useAuth } from '@/hooks';

function App() {
  const { 
    session, 
    isLoading, 
    login, 
    logout, 
    register,
    refreshSession 
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!session) {
    return <LoginForm />;
  }

  return (
    <div>
      <h1>Welcome, {session.user.firstName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Appointment Hooks

### Basic CRUD Operations

```tsx
import { 
  useAppointments, 
  useCreateAppointment, 
  useUpdateAppointment,
  useCancelAppointment 
} from '@/hooks';

function AppointmentsList() {
  const { data: appointments, isPending } = useAppointments();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();

  const handleCreate = (data) => {
    createAppointment.mutate(data);
  };

  const handleUpdate = (id, data) => {
    updateAppointment.mutate({ id, data });
  };

  const handleCancel = (id) => {
    cancelAppointment.mutate(id);
  };

  return (
    <div>
      {appointments?.map(appointment => (
        <div key={appointment.id}>
          <h3>{appointment.title}</h3>
          <button onClick={() => handleCancel(appointment.id)}>
            Cancel
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Doctor Availability

```tsx
import { useDoctorAvailability } from '@/hooks';

function DoctorSchedule({ doctorId, date }) {
  const { data: availability, isPending } = useDoctorAvailability(doctorId, date);

  if (isPending) return <div>Loading availability...</div>;

  return (
    <div>
      <h3>Available Slots</h3>
      {availability?.slots?.map(slot => (
        <div key={slot.time}>{slot.time}</div>
      ))}
    </div>
  );
}
```

### Queue Management

```tsx
import { 
  useDoctorQueue, 
  useProcessCheckIn, 
  useQueuePosition 
} from '@/hooks';

function DoctorQueue({ doctorId, date }) {
  const { data: queue } = useDoctorQueue(doctorId, date);
  const processCheckIn = useProcessCheckIn();

  const handleCheckIn = (appointmentId) => {
    processCheckIn.mutate({ appointmentId });
  };

  return (
    <div>
      <h3>Current Queue</h3>
      {queue?.appointments?.map(appointment => (
        <div key={appointment.id}>
          <span>{appointment.patientName}</span>
          <button onClick={() => handleCheckIn(appointment.id)}>
            Check In
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Clinic Hooks

### Clinic Management

```tsx
import { 
  useClinics, 
  useCreateClinic, 
  useUpdateClinic,
  useDeleteClinic 
} from '@/hooks';

function ClinicsList() {
  const { data: clinics, isPending } = useClinics();
  const createClinic = useCreateClinic();
  const updateClinic = useUpdateClinic();
  const deleteClinic = useDeleteClinic();

  return (
    <div>
      {clinics?.map(clinic => (
        <div key={clinic.id}>
          <h3>{clinic.name}</h3>
          <button onClick={() => deleteClinic.mutate(clinic.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Location Management

```tsx
import { 
  useClinicLocations, 
  useCreateClinicLocation,
  useGenerateLocationQR 
} from '@/hooks';

function ClinicLocations({ clinicId }) {
  const { data: locations } = useClinicLocations(clinicId);
  const createLocation = useCreateClinicLocation();
  const generateQR = useGenerateLocationQR();

  const handleCreateLocation = (locationData) => {
    createLocation.mutate({ clinicId, data: locationData });
  };

  const handleGenerateQR = (locationId) => {
    generateQR.mutate({ clinicId, locationId });
  };

  return (
    <div>
      {locations?.map(location => (
        <div key={location.id}>
          <h4>{location.name}</h4>
          <button onClick={() => handleGenerateQR(location.id)}>
            Generate QR
          </button>
        </div>
      ))}
    </div>
  );
}
```

### User Management

```tsx
import { 
  useClinicDoctors, 
  useClinicPatients,
  useAssignClinicAdmin 
} from '@/hooks';

function ClinicUsers({ clinicId }) {
  const { data: doctors } = useClinicDoctors(clinicId);
  const { data: patients } = useClinicPatients(clinicId);
  const assignAdmin = useAssignClinicAdmin();

  const handleAssignAdmin = (userId) => {
    assignAdmin.mutate({ clinicId, userId, role: 'CLINIC_ADMIN' });
  };

  return (
    <div>
      <h3>Doctors ({doctors?.length})</h3>
      {doctors?.map(doctor => (
        <div key={doctor.id}>{doctor.name}</div>
      ))}
      
      <h3>Patients ({patients?.length})</h3>
      {patients?.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
}
```

## User Hooks

### Profile Management

```tsx
import { 
  useUserProfile, 
  useUpdateUserProfile,
  useIsProfileComplete 
} from '@/hooks';

function UserProfile() {
  const { data: profile, isPending } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const isProfileComplete = useIsProfileComplete();

  const handleUpdate = (profileData) => {
    updateProfile.mutate(profileData);
  };

  if (isPending) return <div>Loading profile...</div>;

  return (
    <div>
      <h2>Profile</h2>
      {!isProfileComplete(profile) && (
        <div className="warning">Please complete your profile</div>
      )}
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        handleUpdate(Object.fromEntries(formData));
      }}>
        <input name="firstName" defaultValue={profile?.firstName} />
        <input name="lastName" defaultValue={profile?.lastName} />
        <button type="submit">Update Profile</button>
      </form>
    </div>
  );
}
```

### User Management

```tsx
import { 
  useUsers, 
  usePatients, 
  useDoctors,
  useUpdateUser,
  useDeleteUser 
} from '@/hooks';

function UsersList() {
  const { data: users } = useUsers();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleUpdateUser = (id, data) => {
    updateUser.mutate({ id, data });
  };

  const handleDeleteUser = (id) => {
    deleteUser.mutate(id);
  };

  return (
    <div>
      <h3>All Users ({users?.length})</h3>
      <h3>Patients ({patients?.length})</h3>
      <h3>Doctors ({doctors?.length})</h3>
    </div>
  );
}
```

## Utility Hooks

### useToast
Display toast notifications.

```tsx
import { useToast } from '@/hooks';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  );
}
```

### useIsMobile
Detect if the current viewport is mobile.

```tsx
import { useIsMobile } from '@/hooks';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

## Error Handling

All hooks include built-in error handling. Errors are automatically displayed as toast notifications unless you provide a custom `onSuccess` or `onError` handler.

```tsx
const { mutate, isPending } = useCreateAppointment();

// Custom error handling
const handleCreate = (data) => {
  mutate(data, {
    onSuccess: (result) => {
      console.log('Appointment created:', result);
      // Custom success handling
    },
    onError: (error) => {
      console.error('Failed to create appointment:', error);
      // Custom error handling
    }
  });
};
```

## Loading States

All hooks provide loading states that you can use to show loading indicators:

```tsx
function MyComponent() {
  const { data, isPending, isFetching } = useAppointments();

  if (isPending) {
    return <div>Loading appointments...</div>;
  }

  return (
    <div>
      {isFetching && <div>Refreshing...</div>}
      {data?.map(appointment => (
        <div key={appointment.id}>{appointment.title}</div>
      ))}
    </div>
  );
}
```

## Query Invalidation

Mutations automatically invalidate related queries to keep the UI in sync:

```tsx
const createAppointment = useCreateAppointment(); // Invalidates 'appointments'
const updateAppointment = useUpdateAppointment(); // Invalidates 'appointments'
const deleteAppointment = useCancelAppointment(); // Invalidates 'appointments'
```

## TypeScript Support

All hooks are fully typed with TypeScript. The types are automatically inferred from the server actions and API responses.

```tsx
import { AppointmentWithRelations } from '@/types/appointment.types';

const { data: appointments } = useAppointments();
// appointments is typed as AppointmentWithRelations[] | undefined
```

## Best Practices

1. **Always check loading states** before rendering data
2. **Use error boundaries** for unexpected errors
3. **Provide fallback UI** for empty states
4. **Use optimistic updates** for better UX when appropriate
5. **Cache queries** appropriately using the query key system
6. **Handle authentication errors** gracefully
7. **Use the index file** for clean imports

## Examples

See the component files in the app directory for real-world usage examples of these hooks. 