# 🏥 Healthcare Frontend - Backend Integration Guide

## 📋 Overview

This guide explains how the Healthcare Frontend integrates with the comprehensive backend system that includes both clinic and fashion apps. The integration follows strict healthcare compliance standards, HIPAA requirements, and modern development patterns.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Healthcare Frontend                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Next.js 15+   │  │  TypeScript     │  │  TanStack    │ │
│  │   App Router    │  │  Strict Mode    │  │  Query       │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Server Actions │  │  API Client     │  │  Middleware  │ │
│  │  (Mutations)    │  │  (Config)       │  │  (Auth)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend System                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Clinic App    │  │  Fashion App    │  │  Shared      │ │
│  │   (Port 4001)   │  │  (Port 4002)    │  │  Libraries   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Integration Components

### 1. API Configuration (`/src/lib/api/config.ts`)

**Purpose**: Centralized configuration for all API endpoints and settings.

**Key Features**:
- Environment-based configuration with Zod validation
- Comprehensive endpoint mapping for all backend services
- Error handling and status code definitions
- Rate limiting and retry configuration
- Feature flags for different capabilities

**Usage**:
```typescript
import { API_CONFIG, API_ENDPOINTS } from '@/lib/api/config';

// Access configuration
const baseUrl = API_CONFIG.CLINIC_API_URL;
const authEndpoint = API_ENDPOINTS.AUTH.LOGIN;
```

### 2. API Client (`/src/lib/api/client.ts`)

**Purpose**: Robust HTTP client with authentication, retry logic, and error handling.

**Key Features**:
- Automatic authentication header management
- Retry logic with exponential backoff
- Comprehensive error handling with custom error classes
- Request/response interceptors
- File upload support
- Pagination helpers

**Usage**:
```typescript
import { clinicApiClient } from '@/lib/api/client';

// Make authenticated requests
const response = await clinicApiClient.get('/clinics');
const appointment = await clinicApiClient.createAppointment(data);
```

### 3. Server Actions (`/src/lib/actions/`)

**Purpose**: Server-side mutations that integrate with the backend API.

**Key Features**:
- Input validation with Zod schemas
- Permission-based access control
- Comprehensive audit logging
- Error handling and user feedback
- Cache invalidation and revalidation

**Usage**:
```typescript
import { createClinic, getClinics } from '@/lib/actions/clinic.server';

// Server-side mutations
const result = await createClinic(clinicData);
const clinics = await getClinics({ page: 1, limit: 10 });
```

### 4. React Hooks (`/src/hooks/`)

**Purpose**: Client-side data fetching and state management with TanStack Query.

**Key Features**:
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling with toast notifications
- Permission-based query enabling
- Real-time data synchronization

**Usage**:
```typescript
import { useClinics, useCreateClinic } from '@/hooks/useClinic';

// Client-side data fetching
const { data: clinics, isLoading } = useClinics();
const createClinicMutation = useCreateClinic();
```

## 🔐 Security & Compliance

### Authentication Flow

1. **Login Process**:
   ```typescript
   // 1. User submits credentials
   const result = await clinicApiClient.login({
     email: 'doctor@clinic.com',
     password: 'securePassword',
     clinicId: 'clinic-123'
   });

   // 2. Backend validates and returns tokens
   // 3. Frontend stores tokens in secure cookies
   // 4. Subsequent requests include auth headers
   ```

2. **Session Management**:
   - JWT tokens stored in HTTP-only cookies
   - Automatic token refresh
   - Session timeout handling
   - Multi-device session management

### Permission System

**RBAC (Role-Based Access Control)**:
```typescript
// Permission checks in server actions
const hasAccess = await validateClinicAccess(userId, 'clinics.create');
if (!hasAccess) {
  await auditLog({
    userId,
    action: 'CREATE_CLINIC_DENIED',
    resource: 'CLINIC',
    result: 'FAILURE',
    riskLevel: 'MEDIUM'
  });
  return { success: false, error: 'Access denied' };
}
```

**Permission Levels**:
- `clinics.read` - View clinic information
- `clinics.create` - Create new clinics
- `clinics.update` - Modify clinic data
- `clinics.delete` - Delete clinics
- `appointments.*` - Appointment management
- `queue.*` - Queue management

### Audit Logging

**Comprehensive Audit Trail**:
```typescript
await auditLog({
  userId,
  action: 'CLINIC_CREATED',
  resource: 'CLINIC',
  resourceId: clinic.id,
  result: 'SUCCESS',
  riskLevel: 'LOW',
  ipAddress: await getClientIP(),
  userAgent: await getUserAgent(),
  sessionId,
  metadata: {
    clinicName: clinic.name,
    clinicSubdomain: clinic.subdomain
  }
});
```

## 📊 Data Flow Patterns

### 1. Server-Side Data Fetching

```typescript
// Server Component
export default async function ClinicDashboard() {
  const clinics = await getClinics({ page: 1, limit: 10 });
  
  return (
    <div>
      {clinics.appointments?.map(clinic => (
        <ClinicCard key={clinic.id} clinic={clinic} />
      ))}
    </div>
  );
}
```

### 2. Client-Side Data Fetching

```typescript
// Client Component
'use client';

export default function AppointmentsList() {
  const { data: appointments, isLoading } = useAppointments({
    status: 'SCHEDULED',
    date: '2024-01-15'
  });

  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      {appointments?.map(appointment => (
        <AppointmentCard key={appointment.id} appointment={appointment} />
      ))}
    </div>
  );
}
```

### 3. Optimistic Updates

```typescript
const updateAppointmentMutation = useUpdateAppointment();

const handleStatusChange = (appointmentId: string, newStatus: string) => {
  updateAppointmentMutation.mutate(
    { id: appointmentId, data: { status: newStatus } },
    {
      onSuccess: (updatedAppointment) => {
        // Cache is automatically updated
        toast.success('Appointment updated successfully');
      },
      onError: (error) => {
        // Cache is automatically reverted
        toast.error('Failed to update appointment');
      }
    }
  );
};
```

## 🔄 Real-Time Features

### WebSocket Integration

```typescript
// Real-time appointment updates
const useRealTimeAppointments = (clinicId: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:4001/appointments/${clinicId}`);
    
    socket.onmessage = (event) => {
      const update = JSON.parse(event.data);
      
      // Update cache optimistically
      queryClient.setQueryData(
        ['appointments', clinicId],
        (old: any) => updateAppointments(old, update)
      );
    };
    
    return () => socket.close();
  }, [clinicId, queryClient]);
};
```

### Queue Management

```typescript
// Real-time queue updates
const useQueue = (queueType: string) => {
  return useQuery({
    queryKey: ['queue', queueType],
    queryFn: () => getQueue(queueType),
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
  });
};
```

## 🧪 Testing Strategy

### 1. Unit Tests

```typescript
// Test server actions
describe('createClinic', () => {
  it('should create clinic with valid data', async () => {
    const mockData = {
      name: 'Test Clinic',
      address: '123 Test St',
      // ... other required fields
    };
    
    const result = await createClinic(mockData);
    
    expect(result.success).toBe(true);
    expect(result.clinic).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// Test API client
describe('ClinicApiClient', () => {
  it('should handle authentication correctly', async () => {
    const client = new ClinicApiClient();
    
    const response = await client.login({
      email: 'test@example.com',
      password: 'password'
    });
    
    expect(response.success).toBe(true);
  });
});
```

### 3. E2E Tests

```typescript
// Test complete user flows
describe('Clinic Management', () => {
  it('should allow admin to create and manage clinics', async () => {
    await page.goto('/dashboard/clinics');
    await page.click('[data-testid="create-clinic-btn"]');
    // ... complete flow
  });
});
```

## 🚀 Deployment & Environment

### Environment Variables

```bash
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
NEXT_PUBLIC_CLINIC_API_URL=http://localhost:4001/api/v1
NEXT_PUBLIC_FASHION_API_URL=http://localhost:4002/api/v1

# Authentication
NEXT_PUBLIC_AUTH_ENDPOINT=/auth
NEXT_PUBLIC_SESSION_ENDPOINT=/session

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_VIDEO_CALLS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Security
NEXT_PUBLIC_ENABLE_HTTPS=false
NEXT_PUBLIC_ENABLE_CORS=true
```

### Docker Integration

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

## 📈 Performance Optimization

### 1. Caching Strategy

```typescript
// Optimized cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error.message.includes('Access denied')) return false;
        return failureCount < 3;
      },
    },
  },
});
```

### 2. Code Splitting

```typescript
// Lazy load components
const ClinicDashboard = lazy(() => import('./ClinicDashboard'));
const AppointmentForm = lazy(() => import('./AppointmentForm'));

// Route-based code splitting
const routes = [
  {
    path: '/dashboard/clinics',
    component: lazy(() => import('./pages/ClinicsPage'))
  }
];
```

### 3. Bundle Optimization

```typescript
// Tree shaking and optimization
import { 
  useClinics, 
  useCreateClinic 
} from '@/hooks/useClinic'; // Only import what you need

// Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

## 🔧 Development Workflow

### 1. Local Development

```bash
# Start backend services
cd HealthCareBackend
npm run dev

# Start frontend
cd HealthcareFrontend/healthcarefrontend-web
npm run dev
```

### 2. API Testing

```bash
# Test API endpoints
npm run test:api

# Test server actions
npm run test:actions

# Test hooks
npm run test:hooks
```

### 3. Code Quality

```bash
# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check

# Security audit
npm audit
```

## 📚 Best Practices

### 1. Error Handling

```typescript
// Consistent error handling
try {
  const result = await createClinic(data);
  if (!result.success) {
    throw new Error(result.error);
  }
  return result.clinic;
} catch (error) {
  console.error('Failed to create clinic:', error);
  throw new ApiError(
    error.message || 'An unexpected error occurred',
    500,
    'SYSTEM_ERROR'
  );
}
```

### 2. Type Safety

```typescript
// Strict TypeScript configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3. Security Headers

```typescript
// Security middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}
```

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Check token expiration
   - Verify session cookies
   - Ensure proper CORS configuration

2. **API Connection Issues**:
   - Verify backend services are running
   - Check network connectivity
   - Review API endpoint configuration

3. **Permission Denied**:
   - Verify user roles and permissions
   - Check RBAC configuration
   - Review audit logs for details

### Debug Tools

```typescript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('API Request:', { url, method, headers });
  console.log('API Response:', response);
}
```

## 📞 Support

For integration issues or questions:

1. Check the audit logs for detailed error information
2. Review the API documentation in the backend repository
3. Consult the healthcare compliance guidelines
4. Contact the development team with specific error details

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Compliance**: HIPAA, GDPR, SOC 2
