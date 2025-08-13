# Architecture Rules - Healthcare Frontend

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
│   │   └── LoadingOverlayContext.tsx
│   ├── globals.css
│   ├── layout.tsx                # Root layout
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

const AppointmentCalendar = dynamic(() => import('@/components/appointments/AppointmentCalendar'), {
  loading: () => <CalendarSkeleton />
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

#### **Appointment Workflow**
```
1. Appointment Request → Patient/Receptionist
2. Availability Check → Doctor Schedule
3. Booking Confirmation → Notification System
4. Check-in Process → Queue Management
5. Consultation → EHR Integration
6. Follow-up → Automated Reminders
```

#### **Queue Management**
```
1. Patient Check-in → QR Code/Manual
2. Queue Assignment → Priority-based
3. Real-time Updates → WebSocket/Polling
4. Doctor Notification → Next Patient Alert
5. Consultation Start → Timer Tracking
6. Completion → Next Patient Auto-call
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

This architecture ensures a robust, secure, and scalable healthcare application that meets medical industry standards while providing excellent user experience.
