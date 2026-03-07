# Architecture Rules - Healthcare Frontend
# Version: 2.1.0 | Next.js 16 + React 19 + TypeScript 5
# Enterprise-Grade Multi-Tenant Healthcare Architecture

## 🎯 **Core Principles (SOLID, DRY, KISS)**

### **SOLID Principles in Architecture**
- **Single Responsibility**: Each module handles one concern (auth, patients, appointments)
- **Open/Closed**: Extend via composition, not modification
- **Liskov Substitution**: Interfaces ensure consistent behavior
- **Interface Segregation**: Role-specific interfaces (Doctor, Patient, Admin)
- **Dependency Inversion**: Depend on abstractions (hooks, stores), not implementations

### **DRY (Don't Repeat Yourself)**
- Shared components for common UI patterns
- Reusable hooks for data fetching
- Centralized configuration (`APP_CONFIG`)
- Unified query key factory (`queryKeys`)
- Common validation schemas
- Shared error handling

### **KISS (Keep It Simple, Stupid)**
- Clear, readable code over clever solutions
- Straightforward data flow
- Minimal abstraction layers
- Direct API patterns

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

## 🏗️ **Core Architecture Principles**

### **Multi-Tenant Healthcare System**
- **Clinic-Centric Design**: All data operations must be scoped to clinic context
- **Data Isolation**: Strict tenant separation for patient data security
- **RBAC Integration**: Role-based access control embedded at architecture level
- **Scalable Design**: Support multiple clinics with independent configurations

### **Next.js 14 App Router Architecture**
```
src/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Route groups for authentication
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-otp/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── clinic-admin/         # Clinic administrator features
│   │   ├── doctor/               # Doctor-specific features
│   │   ├── patient/              # Patient portal
│   │   ├── pharmacist/           # Pharmacy management
│   │   ├── receptionist/         # Reception desk features
│   │   └── super-admin/          # Super admin controls
│   ├── (public)/                 # Public pages
│   │   └── ayurveda/             # Public Ayurveda information
│   ├── (shared)/                 # Shared features across roles
│   │   ├── analytics/
│   │   ├── appointments/
│   │   ├── ehr/
│   │   ├── pharmacy/
│   │   └── queue/
│   ├── api/                      # API routes
│   ├── providers/                # Context providers
│   │   ├── AppProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   ├── LoadingOverlayContext.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── error.tsx
```

### **Component Architecture**
```
components/
├── ui/                           # Base UI components (shadcn/ui)
├── global/                       # Global reusable components
│   ├── form-generator/
│   ├── forms/
│   └── GlobalSidebar/
├── dashboard/                    # Dashboard-specific components
├── auth/                         # Authentication components
├── ayurveda/                     # Ayurveda-specific components
├── clinic/                       # Clinic management
├── contact/                      # Contact features
├── rbac/                         # RBAC components
├── analytics/                    # Analytics components
├── appointments/                 # Appointment management
├── queue/                        # Queue management
├── services/                     # Service components
├── theme/                        # Theme components
├── i18n/                         # Internationalization
├── language/                     # Language components
├── media/                        # Media components
├── maps/                         # Map integration
├── performance/                  # Performance monitoring
└── ErrorBoundary.tsx
```

### **State Management Architecture**

#### **Server State (TanStack Query)**
```typescript
// Query Key Structure
const queryKeys = {
  // Clinic-scoped queries
  patients: (clinicId: string, filters?: PatientFilters) =>
    ['patients', clinicId, filters],
  appointments: (clinicId: string, filters?: AppointmentFilters) =>
    ['appointments', clinicId, filters],
  doctors: (clinicId: string, filters?: DoctorFilters) =>
    ['doctors', clinicId, filters],

  // User-specific queries
  myAppointments: (userId: string) => ['my-appointments', userId],
  userProfile: (userId: string) => ['user-profile', userId],

  // Global queries
  clinics: () => ['clinics'],
  analytics: (clinicId: string, period: string) =>
    ['analytics', clinicId, period],
};
```

#### **Client State (Zustand Stores)**
```typescript
// Store Structure
stores/
├── useAppStore.ts            # Main app state (theme, sidebar, etc.)
├── useAppointmentStore.ts    # Appointment-specific client state
├── useMedicalRecordsStore.ts # Medical records state
├── useNotificationStore.ts   # Notification state
└── usePharmacyStore.ts       # Pharmacy state
```

### **Data Flow Architecture**

#### **Authentication Flow**
```
1. User Login → Server Action (auth.server.ts)
2. JWT Token → Secure HTTP-only Cookies
3. Session Validation → Middleware
4. Role-based Redirect → Dashboard
5. Permission Loading → RBAC Hook
```

#### **Data Fetching Flow**
```
1. Component → Custom Hook (usePatients)
2. Hook → TanStack Query
3. Query → Server Action
4. Server Action → API Call
5. API Response → Cache Update
6. Cache → Component Re-render
```

#### **Clinic Context Flow**
```
1. User Authentication → Clinic Association
2. Clinic ID → React Context
3. All Queries → Include Clinic ID
4. Data Isolation → Tenant Security
```

### **Security Architecture**

#### **Multi-Tenant Security**
- **Data Isolation**: All queries scoped by clinicId
- **Permission Validation**: Server-side and client-side checks
- **Session Management**: Secure token handling
- **Audit Logging**: Track all data access

#### **RBAC Architecture**
```typescript
// Permission Structure
permissions: {
  patients: ['read', 'create', 'update', 'delete'],
  appointments: ['read', 'create', 'update', 'cancel'],
  medical_records: ['read', 'create', 'update'],
  pharmacy: ['read', 'dispense', 'manage'],
  analytics: ['view_basic', 'view_detailed', 'export'],
  clinic: ['manage_settings', 'manage_users', 'view_reports']
}

// Role-Permission Mapping
roles: {
  SUPER_ADMIN: ['*'], // All permissions
  CLINIC_ADMIN: ['clinic.*', 'users.manage', 'analytics.view_detailed'],
  DOCTOR: ['patients.*', 'appointments.*', 'medical_records.*'],
  NURSE: ['patients.read', 'appointments.read', 'medical_records.read'],
  RECEPTIONIST: ['appointments.*', 'patients.read', 'queue.*'],
  PHARMACIST: ['pharmacy.*', 'prescriptions.*'],
  PATIENT: ['my_appointments.*', 'my_records.read']
}
```

### **API Architecture**

#### **Server Actions Pattern**
```typescript
// Server Action Structure
lib/actions/
├── auth.server.ts           # Authentication
├── clinic.server.ts         # Clinic management
├── patients.server.ts       # Patient CRUD
├── doctors.server.ts        # Doctor management
├── appointments.server.ts   # Appointment management
├── pharmacy.server.ts       # Pharmacy operations
├── queue.server.ts          # Queue management
├── medical-records.server.ts # Medical records
├── notifications.server.ts  # Notifications
├── analytics.server.ts      # Analytics
└── users.server.ts          # User management
```

#### **API Call Pattern**
```typescript
// Authenticated API Call
export async function authenticatedApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const sessionId = cookieStore.get('session_id')?.value;
  const clinicId = process.env.NEXT_PUBLIC_CLINIC_ID;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'X-Session-ID': sessionId,
    'X-Clinic-ID': clinicId,
    ...options.headers,
  };

  // Rest of implementation...
}
```

### **Performance Architecture**

#### **Caching Strategy**
- **Server-Side**: Next.js caching with revalidation
- **Client-Side**: TanStack Query with stale-while-revalidate
- **Static Assets**: CDN with proper cache headers
- **Database**: Connection pooling and query optimization

#### **Code Splitting**
```typescript
// Dynamic Imports for Large Components
const PatientManagement = dynamic(() => import('@/components/patients/PatientManagement'), {
  loading: () => <PatientManagementSkeleton />,
  ssr: false
});
```

### **Error Handling Architecture**

#### **Error Boundary Strategy**
```
1. Global Error Boundary → app/error.tsx
2. Route-level Error Boundaries → Per major section
3. Component-level Error Boundaries → Complex components
4. Hook-level Error Handling → Custom hooks
```

#### **Error Types**
```typescript
interface AppError {
  type: 'AUTHENTICATION' | 'AUTHORIZATION' | 'VALIDATION' | 'NETWORK' | 'SERVER';
  message: string;
  code?: string;
  details?: unknown;
  timestamp: Date;
}
```

### **Internationalization Architecture**

#### **i18n Structure**
```
lib/i18n/
├── config.ts              # i18n configuration
├── context.tsx            # Language context
├── messages/              # Translation files
│   ├── en.json
│   ├── hi.json
│   └── mr.json
├── translations/          # TypeScript translations
│   ├── index.ts
│   ├── en.ts
│   ├── hi.ts
│   └── mr.ts
└── utils.ts               # i18n utilities
```

#### **Language Support**
- **English**: Primary language
- **Hindi**: Secondary language with Devanagari script
- **Marathi**: Regional language support

### **Healthcare-Specific Architecture**

#### **Medical Data Flow**
```
1. Medical Record Creation → Doctor/Nurse Input
2. Data Validation → Zod Schema + FHIR Standards
3. Encryption → At-rest and in-transit
4. Storage → Clinic-scoped database
5. Audit Trail → All access logged
6. Compliance → HIPAA validation
```

#### **Queue Management**
```
1. Patient Check-in → QR Code/Manual
2. Queue Assignment → Priority-based
3. Real-time Updates → WebSocket/Polling
4. Doctor Notification → Next Patient Alert
5. Consultation Start → Timer Tracking
6. Completion → Next Patient Auto-call
7. Consultation → EHR Integration
```

#### **Status Constants Pattern**
```typescript
// ✅ All status values MUST use constants (see coding-standards.md)
// This ensures type safety and prevents string literal comparisons
//
// Queue service integration
const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;
```

#### **Check-in to Queue Integration**
```typescript
// ✅ Complete check-in workflow implementation
//
// 1. Frontend Reception Check-in
//    ├─ POST /appointments/:id/check-in or /appointments/check-in/scan-qr
//    └─ Backend: AppointmentsController → CheckInService.processCheckIn()
//       └─ Queue: Creates queue record, updates appointment status
//
// 2. Patient QR Check-in
//    ├─ POST /appointments/check-in/scan-qr
//    └─ Backend: AppointmentsController → CheckInService.processCheckIn()
//       └─ Queue: Same integration as receptionist
//
// 3. Queue Service Operations
//    ├─ GET /queue/stats?locationId=xxx  → Returns queue statistics
//    ├─ POST /queue/call-next        → Advances queue position
//    ├─ POST /queue/reorder           → Reorders queue priority
//    ├─ POST /queue/pause            → Pauses queue for doctor
//    └─ POST /queue/resume           → Resumes paused queue
//
// Required data flow
//    1. Check-in → Appointment status: SCHEDULED → CHECKED_IN
//    2. Queue record → Created with WAITING status, position, estimatedWaitTime
//    3. Cache invalidation → All cache tags properly cleared
//
// ❌ INCORRECT: Stub check-in (no queue integration)
// async processCheckIn() {
//   return { success: true }; // No queue record created
// }
//
```

### **Compliance Architecture**

#### **HIPAA Compliance**
- **Access Controls**: Role-based permissions
- **Audit Trails**: Complete access logging
- **Data Encryption**: End-to-end protection
- **Secure Communication**: HTTPS/TLS
- **User Authentication**: Multi-factor where required

#### **Data Retention**
- **Medical Records**: Long-term storage (7+ years)
- **Appointment History**: Medium-term (3 years)
- **Session Logs**: Short-term (90 days)
- **Audit Logs**: Compliance period retention

### **Deployment Architecture**

#### **Environment Structure**
```
environments/
├── development/     # Local development
├── staging/         # Pre-production testing
├── production/      # Live environment
└── disaster-recovery/ # Backup environment
```

#### **Security Measures**
- **Environment Variables**: Secure secret management
- **API Rate Limiting**: Prevent abuse
- **DDoS Protection**: Traffic filtering
- **SSL Certificates**: End-to-end encryption
- **Database Security**: Connection encryption

### **Enterprise Architecture Checklist**

### **Before Implementing Architecture**
- [ ] **SOLID Principles**: All modules follow Single Responsibility
- [ ] **DRY Compliance**: No code duplication, shared utilities used
- [ ] **KISS Principle**: Architecture is simple and understandable
- [ ] **Multi-Tenant Design**: Clinic context properly scoped
- [ ] **RBAC Integration**: Permission system embedded at architecture level
- [ ] **State Management**: TanStack Query + Zustand properly configured
- [ ] **Error Handling**: Comprehensive error boundaries planned
- [ ] **Performance**: Caching and code splitting strategies defined
- [ ] **Security**: HIPAA compliance architecture reviewed
- [ ] **Scalability**: Architecture supports 10M+ users
- [ ] **Internationalization**: Multi-language support architecture
- [ ] **Real-time**: WebSocket integration properly designed
- [ ] **Compliance**: Audit trails configured (if applicable)
- [ ] **Performance**: Caching strategies optimized
- [ ] **Security**: All security measures implemented
- [ ] **Query Keys**: Uses `queryKeys` factory for consistent cache keys
- [ ] **Component Structure**: Clear separation of concerns
- [ ] **Error Boundaries**: Comprehensive error handling
- [ ] **Performance**: Caching strategies optimized
- [ ] **Security**: All security measures implemented
- [ ] **Internationalization**: Multi-language support implemented
- [ ] **Real-time**: WebSocket integration properly designed

### **SOLID Principles Checklist**
- [ ] **Single Responsibility**: Each module has one clear purpose
- [ ] **Open/Closed**: Extensible via composition, not modification
- [ ] **Liskov Substitution**: Interfaces ensure consistent behavior
- [ ] **Interface Segregation**: Role-specific interfaces defined
- [ ] **Dependency Inversion**: Depend on abstractions, not implementations

### **DRY Compliance Checklist**
- [ ] **Shared Components**: Common UI patterns reused
- [ ] **Reusable Hooks**: Data fetching hooks centralized
- [ ] **Configuration**: APP_CONFIG used for all settings
- [ ] **Query Keys**: queryKeys factory implemented
- [ ] **Validation**: Common schemas reused
- [ ] **Error Handling**: Centralized error utilities
- [ ] **Code Clarity**: Code is readable and understandable
- [ ] **Data Flow**: Clear, straightforward data flow
- [ ] **API Patterns**: Direct, simple API calls
- [ ] **Abstraction**: Minimal, necessary abstraction layers
- [ ] **Documentation**: Architecture clearly documented

### **KISS Principle Checklist**
- [ ] **Code Simplicity**: Code is readable and understandable
- [ ] **Data Flow**: Clear, straightforward data flow
- [ ] **API Patterns**: Direct, simple API calls
- [ ] **Abstraction**: Minimal, necessary abstraction layers
- [ ] **Documentation**: Architecture clearly documented

This comprehensive coding standards document ensures consistent, maintainable, and high-quality code across the healthcare frontend application.
