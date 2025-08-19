# Healthcare Frontend API Testing Documentation

## Table of Contents

1. [API Inventory](#api-inventory)
2. [Environment Configuration](#environment-configuration)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Categories Overview](#api-categories-overview)
5. [Comprehensive Test Plans](#comprehensive-test-plans)
6. [Test Implementation Strategy](#test-implementation-strategy)
7. [CI/CD Integration](#cicd-integration)
8. [Appendices](#appendices)

---

## API Inventory

### Server Actions

This application uses Next.js Server Actions as the primary API layer. All API functions are located in `src/lib/actions/` and follow a consistent pattern.

#### 1. Authentication APIs (`auth.server.ts`)

**Core Functions:**
- `getServerSession()` - Get current user session
- `setSession(data)` - Set session cookies
- `clearSession()` - Clear authentication cookies
- `login(data)` - Email/password login
- `register(data)` - User registration
- `requestOTP(identifier)` - Request OTP for login
- `verifyOTP(data)` - Verify OTP
- `socialLogin({provider, token})` - Social media login
- `googleLogin(token)` - Google OAuth login
- `facebookLogin(token)` - Facebook OAuth login
- `appleLogin(token)` - Apple OAuth login
- `forgotPassword(email)` - Password reset request
- `resetPassword(data)` - Reset password with token
- `changePassword(formData)` - Change user password
- `refreshToken()` - Refresh access token
- `logout()` - User logout
- `terminateAllSessions()` - Logout from all devices
- `requireAuth()` - Authentication middleware
- `requireRole(roles)` - Role-based access control
- `checkAuth()` - Check authentication status
- `verifyEmail(token)` - Email verification
- `authenticatedApi(endpoint, options)` - Utility for authenticated API calls

**Input/Output Types:**
```typescript
interface LoginData {
  email: string;
  password?: string;
  otp?: string;
  rememberMe?: boolean;
}

interface RegisterFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  clinicId?: string;
}

interface Session {
  user: {
    id: string;
    email: string;
    role: Role;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    dateOfBirth?: string | null;
    gender?: string;
    address?: string;
    isVerified?: boolean;
    profileComplete?: boolean;
  };
  access_token: string;
  session_id: string;
  isAuthenticated: boolean;
}
```

#### 2. User Management APIs (`users.server.ts`)

**Core Functions:**
- `getUserProfile()` - Get current user profile
- `updateUserProfile(data)` - Update user profile
- `getUserById(id)` - Get user by ID
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user
- `getAllUsers()` - Get all users
- `getPatients()` - Get patients
- `getDoctors()` - Get doctors
- `getReceptionists()` - Get receptionists
- `getClinicAdmins()` - Get clinic admins
- `createUser(userData)` - Create new user
- `updateUserRole(userId, role)` - Update user role
- `getUsersByRole(role)` - Get users by role
- `getUsersByClinic(clinicId)` - Get clinic users
- `searchUsers(query, filters)` - Search users
- `getUserStats()` - Get user statistics
- `bulkUpdateUsers(userIds, updates)` - Bulk update users
- `exportUsers(format, filters)` - Export user data
- `changeUserPassword(userId, password)` - Admin change password
- `toggleUserVerification(userId, isVerified)` - Toggle verification
- `getUserActivityLogs(userId, limit)` - Get activity logs
- `getUserSessions(userId)` - Get user sessions
- `terminateUserSession(userId, sessionId)` - Terminate session

#### 3. Appointment Management APIs (`appointments.server.ts`)

**Core Functions:**
- `createAppointment(data)` - Create appointment
- `getAppointments(tenantId, filters)` - Get appointments with filters
- `getAppointmentById(id)` - Get appointment by ID
- `updateAppointment(id, data)` - Update appointment
- `cancelAppointment(id)` - Cancel appointment
- `getDoctorAvailability(doctorId, date)` - Get doctor availability
- `getUserUpcomingAppointments(userId)` - Get upcoming appointments
- `getMyAppointments()` - Get current user appointments
- `processCheckIn(data)` - Process patient check-in
- `getPatientQueuePosition(appointmentId)` - Get queue position
- `reorderQueue(data)` - Reorder appointment queue
- `getDoctorQueue(doctorId, date)` - Get doctor queue
- `confirmAppointment(appointmentId)` - Confirm appointment
- `startConsultation(appointmentId, data)` - Start consultation
- `generateConfirmationQR(appointmentId)` - Generate QR code
- `verifyAppointmentQR(data)` - Verify QR code
- `markAppointmentCompleted(appointmentId, data)` - Mark as completed
- `getAppointmentStats(tenantId, filters)` - Get appointment statistics
- `getAppointmentAnalytics(period)` - Get analytics
- `bulkUpdateAppointments(ids, updates)` - Bulk update
- `exportAppointments(format, filters)` - Export appointments
- `sendAppointmentReminder(appointmentId, type)` - Send reminders
- `getAppointmentConflicts(data)` - Check conflicts
- `createRecurringAppointments(data)` - Create recurring appointments
- `getPatientAppointmentHistory(patientId, limit)` - Get history
- `getDoctorSchedule(doctorId, date)` - Get doctor schedule
- `updateDoctorAvailability(doctorId, availability)` - Update availability

#### 4. Patient Management APIs (`patients.server.ts`)

**Core Functions:**
- `getPatients(clinicId, filters)` - Get patients with filters
- `getPatientById(clinicId, patientId)` - Get patient by ID
- `createPatient(patientData)` - Create patient record
- `updatePatient(patientId, updates)` - Update patient
- `deletePatient(patientId)` - Delete patient
- `getPatientAppointments(patientId, filters)` - Get appointments
- `getPatientMedicalHistory(clinicId, patientId, filters)` - Get medical history
- `addPatientMedicalHistory(clinicId, patientId, data)` - Add medical history
- `getPatientVitalSigns(patientId, filters)` - Get vital signs
- `addPatientVitalSigns(patientId, data)` - Add vital signs
- `getPatientLabResults(patientId, filters)` - Get lab results
- `addPatientLabResult(patientId, data)` - Add lab result
- `getPatientStats(patientId)` - Get patient statistics
- `searchPatients(query, filters)` - Search patients
- `getPatientTimeline(patientId, filters)` - Get patient timeline
- `exportPatientData(filters)` - Export patient data
- `getPatientCarePlan(patientId)` - Get care plan
- `updatePatientCarePlan(patientId, data)` - Update care plan

#### 5. Doctor Management APIs (`doctors.server.ts`)

**Core Functions:**
- `getDoctors(clinicId, filters)` - Get doctors with filters
- `getDoctorById(doctorId)` - Get doctor by ID
- `createDoctor(doctorData)` - Create doctor record
- `updateDoctor(doctorId, updates)` - Update doctor
- `deleteDoctor(doctorId)` - Delete doctor
- `getDoctorSchedule(clinicId, doctorId, date)` - Get schedule
- `updateDoctorSchedule(doctorId, schedule)` - Update schedule
- `getDoctorAvailability(doctorId, date)` - Get availability
- `updateDoctorAvailability(doctorId, data)` - Update availability
- `getDoctorAppointments(doctorId, filters)` - Get appointments
- `getDoctorPatients(clinicId, doctorId, filters)` - Get patients
- `getDoctorStats(doctorId, period)` - Get statistics
- `getDoctorReviews(doctorId, limit)` - Get reviews
- `addDoctorReview(doctorId, data)` - Add review
- `getDoctorSpecializations()` - Get specializations
- `searchDoctors(query, filters)` - Search doctors
- `getDoctorPerformanceMetrics(doctorId, filters)` - Get performance
- `updateDoctorProfile(doctorId, data)` - Update profile
- `getDoctorEarnings(doctorId, filters)` - Get earnings
- `exportDoctorData(filters)` - Export doctor data

#### 6. Clinic Management APIs (`clinic.server.ts`)

**Core Functions:**
- `createClinic(data)` - Create clinic
- `getAllClinics()` - Get all clinics
- `getClinicById(id)` - Get clinic by ID
- `getMyClinic()` - Get current user's clinic
- `getClinicByAppName(appName)` - Get clinic by app name
- `updateClinic(id, data)` - Update clinic
- `deleteClinic(id)` - Delete clinic
- `createClinicLocation(data)` - Create location
- `getClinicLocations()` - Get locations
- `getClinicLocationById(locationId)` - Get location by ID
- `updateClinicLocation(locationId, data)` - Update location
- `deleteClinicLocation(locationId)` - Delete location
- `generateLocationQR(locationId)` - Generate QR code
- `verifyLocationQR(qrData)` - Verify QR code
- `assignClinicAdmin(data)` - Assign admin
- `getClinicDoctors()` - Get clinic doctors
- `getClinicPatients()` - Get clinic patients
- `registerPatientToClinic(data)` - Register patient
- `getClinicUsersByRole(role)` - Get users by role
- `validateAppName(appName)` - Validate app name
- `associateUserWithClinic()` - Associate user
- `getClinicStats()` - Get statistics
- `getClinicSettings()` - Get settings
- `updateClinicSettings(settings)` - Update settings
- `getActiveLocations()` - Get active locations
- `generateClinicToken()` - Generate token
- `getClinicAnalytics(clinicId, period)` - Get analytics
- `getClinicPerformanceMetrics(clinicId, startDate, endDate)` - Get performance
- `getClinicInventory(clinicId)` - Get inventory
- `updateClinicInventory(clinicId, data)` - Update inventory
- `getClinicStaff(clinicId, role)` - Get staff
- `addClinicStaff(clinicId, data)` - Add staff
- `removeClinicStaff(clinicId, userId)` - Remove staff
- `updateStaffPermissions(clinicId, userId, permissions)` - Update permissions
- `getClinicDepartments(clinicId)` - Get departments
- `createClinicDepartment(clinicId, data)` - Create department
- `getClinicServices(clinicId)` - Get services
- `createClinicService(clinicId, data)` - Create service
- `updateClinicService(clinicId, serviceId, data)` - Update service
- `getClinicEquipment(clinicId)` - Get equipment
- `addClinicEquipment(clinicId, data)` - Add equipment
- `updateEquipmentStatus(clinicId, equipmentId, status)` - Update equipment status

#### 7. Pharmacy Management APIs (`pharmacy.server.ts`)

**Core Functions:**
- `getMedicines(clinicId, filters)` - Get medicines with filters
- `getMedicineById(medicineId)` - Get medicine by ID
- `createMedicine(clinicId, data)` - Create medicine
- `updateMedicine(clinicId, medicineId, updates)` - Update medicine
- `deleteMedicine(clinicId, medicineId)` - Delete medicine
- `getPrescriptions(clinicId, filters)` - Get prescriptions
- `getPrescriptionById(prescriptionId)` - Get prescription by ID
- `createPrescription(clinicId, data)` - Create prescription
- `updatePrescriptionStatus(prescriptionId, status, notes)` - Update status
- `dispensePrescription(prescriptionId, data)` - Dispense prescription
- `getInventory(clinicId, filters)` - Get inventory
- `updateInventory(clinicId, medicineId, data)` - Update inventory
- `getPharmacyOrders(clinicId, filters)` - Get orders
- `createPharmacyOrder(clinicId, data)` - Create order
- `getPharmacySales(clinicId, filters)` - Get sales
- `getPharmacyStats(clinicId, period)` - Get statistics
- `searchMedicines(clinicId, query, filters)` - Search medicines
- `getMedicineCategories()` - Get categories
- `getSuppliers()` - Get suppliers
- `exportPharmacyData(clinicId, filters)` - Export data

#### 8. Queue Management APIs (`queue.server.ts`)

**Core Functions:**
- `getQueue(filters)` - Get queue data
- `getQueueStats()` - Get queue statistics
- `updateQueueStatus(patientId, status)` - Update status
- `callNextPatient(queueType)` - Call next patient
- `addToQueue(data)` - Add patient to queue
- `removeFromQueue(queueId, reason)` - Remove from queue
- `reorderQueue(queueType, patientIds)` - Reorder queue
- `getQueueHistory(filters)` - Get queue history
- `getQueueAnalytics(period)` - Get analytics
- `updateQueuePosition(queueId, position)` - Update position
- `pauseQueue(queueType, reason)` - Pause queue
- `resumeQueue(queueType)` - Resume queue
- `getQueueConfig()` - Get configuration
- `updateQueueConfig(config)` - Update configuration
- `getQueueNotifications(userId)` - Get notifications
- `markQueueNotificationAsRead(notificationId)` - Mark as read
- `sendQueueNotification(data)` - Send notification
- `getQueueWaitTimes(queueType)` - Get wait times
- `estimateWaitTime(queueType, priority)` - Estimate wait time
- `getQueueCapacity(queueType)` - Get capacity
- `updateQueueCapacity(queueType, capacity)` - Update capacity
- `getQueuePerformanceMetrics(filters)` - Get performance metrics
- `exportQueueData(filters)` - Export queue data
- `getQueueAlerts()` - Get alerts
- `createQueueAlert(data)` - Create alert
- `updateQueueAlert(alertId, updates)` - Update alert
- `deleteQueueAlert(alertId)` - Delete alert

#### 9. Medical Records APIs (`medical-records.server.ts`)

**Core Functions:**
- `getPatientMedicalRecords(patientId, filters)` - Get medical records
- `createMedicalRecord(data)` - Create medical record
- `updateMedicalRecord(recordId, updates)` - Update record
- `deleteMedicalRecord(recordId)` - Delete record
- `getMedicalRecordById(recordId)` - Get record by ID
- `uploadMedicalRecordFile(recordId, file)` - Upload file
- `getMedicalRecordTemplates(type)` - Get templates
- `createMedicalRecordTemplate(data)` - Create template
- `getPatientPrescriptions(patientId, status)` - Get prescriptions
- `createPrescription(data)` - Create prescription
- `updatePrescription(prescriptionId, updates)` - Update prescription
- `getPrescriptionById(prescriptionId)` - Get prescription by ID
- `generatePrescriptionPDF(prescriptionId)` - Generate PDF
- `getMedicines(filters)` - Get medicines
- `createMedicine(data)` - Create medicine
- `updateMedicine(medicineId, updates)` - Update medicine
- `deleteMedicine(medicineId)` - Delete medicine
- `searchMedicines(query, limit)` - Search medicines
- `getMedicineInteractions(medicineIds)` - Get interactions
- `getMedicineInventory(clinicId)` - Get inventory
- `updateMedicineInventory(medicineId, data)` - Update inventory

#### 10. Analytics APIs (`analytics.server.ts`)

**Core Functions:**
- `getDashboardAnalytics(period, clinicId)` - Get dashboard analytics
- `getAppointmentAnalytics(filters)` - Get appointment analytics
- `getPatientAnalytics(filters)` - Get patient analytics
- `getRevenueAnalytics(filters)` - Get revenue analytics
- `getDoctorPerformanceAnalytics(doctorId, period)` - Get doctor performance
- `getClinicPerformanceAnalytics(clinicId, period)` - Get clinic performance
- `getServiceUtilizationAnalytics(filters)` - Get service utilization
- `getWaitTimeAnalytics(filters)` - Get wait time analytics
- `getPatientSatisfactionAnalytics(filters)` - Get satisfaction analytics
- `generateAppointmentReport(filters)` - Generate appointment report
- `generatePatientReport(filters)` - Generate patient report
- `generateRevenueReport(filters)` - Generate revenue report
- `generateDoctorPerformanceReport(filters)` - Generate doctor report
- `generateClinicSummaryReport(filters)` - Generate clinic report
- `getReportHistory(filters)` - Get report history
- `downloadReport(reportId)` - Download report
- `deleteReport(reportId)` - Delete report
- `getCustomAnalytics(query)` - Get custom analytics
- `saveCustomAnalyticsQuery(data)` - Save custom query
- `getSavedAnalyticsQueries()` - Get saved queries
- `getQueueAnalytics(filters)` - Get queue analytics
- `exportAnalyticsData(format, data)` - Export analytics

#### 11. Notifications APIs (`notifications.server.ts`)

**Core Functions:**
- `getUserNotifications(userId, filters)` - Get user notifications
- `createNotification(data)` - Create notification
- `markNotificationAsRead(notificationId)` - Mark as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(notificationId)` - Delete notification
- `getNotificationSettings(userId)` - Get settings
- `updateNotificationSettings(settings)` - Update settings
- `sendBulkNotifications(data)` - Send bulk notifications
- `sendSMS(data)` - Send SMS
- `sendEmail(data)` - Send email
- `sendWhatsAppMessage(data)` - Send WhatsApp message
- `getMessageTemplates(type)` - Get message templates
- `createMessageTemplate(data)` - Create template
- `updateMessageTemplate(templateId, updates)` - Update template
- `deleteMessageTemplate(templateId)` - Delete template
- `getMessageHistory(filters)` - Get message history
- `getMessagingStats(period)` - Get messaging statistics
- `scheduleMessage(data)` - Schedule message
- `cancelScheduledMessage(messageId)` - Cancel scheduled message
- `getScheduledMessages(filters)` - Get scheduled messages

#### 12. Health Check API (`health.server.ts`)

**Core Functions:**
- `getHealthStatus()` - Get API health status

### API Routes

#### 1. Hello API Route (`/app/api/hello/route.ts`)

**Endpoints:**
- `GET /api/hello` - Simple hello world endpoint

**Response Type:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

---

## Environment Configuration

### Required Environment Variables

Based on the analysis of environment files and configuration:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.ishswami.in

# Environment
NODE_ENV=development

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_CLINIC_ID=CL0002

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# App Configuration
NEXT_PUBLIC_APP_NAME=Healthcare
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Testing Environment Variables

For comprehensive testing, create a `.env.test` file:

```bash
# Test API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8088
NODE_ENV=test

# Test Authentication
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=test-google-client-id
NEXT_PUBLIC_CLINIC_ID=TEST_CLINIC

# Test Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Test App Configuration
NEXT_PUBLIC_APP_NAME=Healthcare Test
NEXT_PUBLIC_APP_VERSION=1.0.0-test
```

---

## Authentication & Authorization

### Authentication Flow

1. **Session Management**: Uses HTTP-only cookies for security
2. **Access Tokens**: JWT-based with 5-hour expiry
3. **Refresh Tokens**: 30-day expiry for token renewal
4. **Session IDs**: Unique identifiers for session tracking

### Role-Based Access Control (RBAC)

The application supports multiple user roles:

- **Super Admin**: Full system access
- **Clinic Admin**: Clinic-level management
- **Doctor**: Patient care and medical records
- **Receptionist**: Appointments and patient check-in
- **Pharmacist**: Pharmacy operations
- **Patient**: Personal health records and appointments

### Permission Levels

Each API endpoint requires specific authentication and permission levels:

1. **Public**: No authentication required
2. **Authenticated**: Valid session required
3. **Role-Based**: Specific roles required
4. **Resource-Based**: Ownership or clinic association required

---

## API Categories Overview

### 1. Core Healthcare APIs
- **Patient Management**: CRUD operations for patient records
- **Doctor Management**: Doctor profiles, schedules, and availability
- **Appointment Management**: Scheduling, check-in, and queue management
- **Medical Records**: Health records, prescriptions, and lab results

### 2. Clinic Operations APIs
- **Clinic Management**: Multi-location clinic administration
- **Staff Management**: User roles and permissions
- **Inventory Management**: Equipment and supplies tracking
- **Queue Management**: Patient flow and wait time optimization

### 3. Pharmacy APIs
- **Medicine Management**: Drug database and inventory
- **Prescription Management**: Digital prescriptions and dispensing
- **Sales Tracking**: Revenue and inventory analytics
- **Supplier Management**: Purchase orders and stock management

### 4. Analytics & Reporting APIs
- **Dashboard Analytics**: Real-time metrics and KPIs
- **Performance Analytics**: Doctor and clinic performance
- **Financial Analytics**: Revenue and cost analysis
- **Custom Reports**: Flexible reporting system

### 5. Communication APIs
- **Notifications**: In-app and push notifications
- **Messaging**: SMS, email, and WhatsApp integration
- **Templates**: Message templates and automation
- **Scheduling**: Automated reminder systems

### 6. System APIs
- **Authentication**: Login, registration, and session management
- **User Management**: Profile management and access control
- **Health Checks**: System monitoring and status
- **Configuration**: Application settings and feature flags

---

## Comprehensive Test Plans

### 1. Authentication Test Suite

#### Unit Tests
```typescript
describe('Authentication APIs', () => {
  describe('login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };
      const result = await login(loginData);
      expect(result.isAuthenticated).toBe(true);
      expect(result.user.email).toBe(loginData.email);
    });

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      await expect(login(loginData)).rejects.toThrow('Login failed');
    });

    it('should handle missing email', async () => {
      const loginData = {
        email: '',
        password: 'password123'
      };
      await expect(login(loginData)).rejects.toThrow('Email is required');
    });
  });

  describe('register', () => {
    it('should register new user with valid data', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890'
      };
      const result = await register(registerData);
      expect(result).toBeDefined();
    });

    it('should handle duplicate email registration', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };
      await expect(register(registerData)).rejects.toThrow();
    });
  });

  describe('OTP Authentication', () => {
    it('should request OTP successfully', async () => {
      const result = await requestOTP('test@example.com');
      expect(result).toBeDefined();
    });

    it('should verify OTP correctly', async () => {
      const otpData = {
        email: 'test@example.com',
        otp: '123456'
      };
      const result = await verifyOTP(otpData);
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('Social Login', () => {
    it('should handle Google login', async () => {
      const token = 'mock-google-token';
      const result = await googleLogin(token);
      expect(result.user).toBeDefined();
    });

    it('should handle Facebook login', async () => {
      const token = 'mock-facebook-token';
      const result = await facebookLogin(token);
      expect(result.user).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      const session = await getServerSession();
      expect(session?.isAuthenticated).toBe(true);
    });

    it('should refresh expired token', async () => {
      const newSession = await refreshToken();
      expect(newSession?.access_token).toBeDefined();
    });

    it('should logout successfully', async () => {
      await logout();
      const session = await getServerSession();
      expect(session).toBeNull();
    });
  });

  describe('Permission Checks', () => {
    it('should require authentication', async () => {
      const session = await requireAuth();
      expect(session.user).toBeDefined();
    });

    it('should check role permissions', async () => {
      const session = await requireRole(['DOCTOR', 'ADMIN']);
      expect(['DOCTOR', 'ADMIN']).toContain(session.user.role);
    });
  });
});
```

#### Integration Tests
```typescript
describe('Authentication Integration Tests', () => {
  it('should complete full login flow', async () => {
    // 1. Register new user
    const registerData = {
      email: 'integration@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
    await register(registerData);

    // 2. Login with credentials
    const loginResult = await login({
      email: registerData.email,
      password: registerData.password
    });
    expect(loginResult.isAuthenticated).toBe(true);

    // 3. Access protected resource
    const profile = await getUserProfile();
    expect(profile.email).toBe(registerData.email);

    // 4. Logout
    await logout();
    const session = await getServerSession();
    expect(session).toBeNull();
  });

  it('should handle password reset flow', async () => {
    // 1. Request password reset
    await forgotPassword('test@example.com');

    // 2. Reset password with token
    const resetData = {
      token: 'mock-reset-token',
      newPassword: 'newpassword123'
    };
    await resetPassword(resetData);

    // 3. Login with new password
    const loginResult = await login({
      email: 'test@example.com',
      password: resetData.newPassword
    });
    expect(loginResult.isAuthenticated).toBe(true);
  });
});
```

### 2. CRUD Operations Test Suite

#### User Management Tests
```typescript
describe('User Management CRUD', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createUser({
      email: 'crud@test.com',
      password: 'password123',
      firstName: 'CRUD',
      lastName: 'Test',
      role: 'PATIENT'
    });
  });

  afterEach(async () => {
    if (testUser?.id) {
      await deleteUser(testUser.id);
    }
  });

  it('should create user', () => {
    expect(testUser.id).toBeDefined();
    expect(testUser.email).toBe('crud@test.com');
  });

  it('should read user', async () => {
    const user = await getUserById(testUser.id);
    expect(user.email).toBe(testUser.email);
  });

  it('should update user', async () => {
    const updates = { firstName: 'Updated' };
    const updatedUser = await updateUser(testUser.id, updates);
    expect(updatedUser.firstName).toBe('Updated');
  });

  it('should delete user', async () => {
    await deleteUser(testUser.id);
    await expect(getUserById(testUser.id)).rejects.toThrow();
    testUser = null; // Prevent afterEach cleanup
  });

  it('should search users', async () => {
    const results = await searchUsers('CRUD');
    expect(results.some((u: any) => u.id === testUser.id)).toBe(true);
  });

  it('should get users by role', async () => {
    const patients = await getUsersByRole('PATIENT');
    expect(patients.some((u: any) => u.id === testUser.id)).toBe(true);
  });
});
```

#### Appointment Management Tests
```typescript
describe('Appointment Management CRUD', () => {
  let testAppointment: any;
  let testPatient: any;
  let testDoctor: any;

  beforeAll(async () => {
    testPatient = await createUser({
      email: 'patient@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Patient',
      role: 'PATIENT'
    });

    testDoctor = await createUser({
      email: 'doctor@test.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Doctor',
      role: 'DOCTOR'
    });
  });

  beforeEach(async () => {
    testAppointment = await createAppointment({
      patientId: testPatient.id,
      doctorId: testDoctor.id,
      startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), // +1 hour
      type: 'CONSULTATION',
      status: 'SCHEDULED'
    });
  });

  afterEach(async () => {
    if (testAppointment?.id) {
      await cancelAppointment(testAppointment.id);
    }
  });

  afterAll(async () => {
    if (testPatient?.id) await deleteUser(testPatient.id);
    if (testDoctor?.id) await deleteUser(testDoctor.id);
  });

  it('should create appointment', () => {
    expect(testAppointment.id).toBeDefined();
    expect(testAppointment.patientId).toBe(testPatient.id);
    expect(testAppointment.doctorId).toBe(testDoctor.id);
  });

  it('should get appointment by ID', async () => {
    const appointment = await getAppointmentById(testAppointment.id);
    expect(appointment.id).toBe(testAppointment.id);
  });

  it('should update appointment', async () => {
    const updates = { status: 'CONFIRMED' };
    const updated = await updateAppointment(testAppointment.id, updates);
    expect(updated.status).toBe('CONFIRMED');
  });

  it('should cancel appointment', async () => {
    const cancelled = await cancelAppointment(testAppointment.id);
    expect(cancelled.status).toBe('CANCELLED');
    testAppointment = null; // Prevent afterEach cleanup
  });

  it('should get doctor appointments', async () => {
    const appointments = await getDoctorAppointments(testDoctor.id);
    expect(appointments.some((a: any) => a.id === testAppointment.id)).toBe(true);
  });

  it('should get patient appointments', async () => {
    const appointments = await getPatientAppointments(testPatient.id);
    expect(appointments.some((a: any) => a.id === testAppointment.id)).toBe(true);
  });
});
```

### 3. Permission and Role-Based Tests

```typescript
describe('Role-Based Access Control', () => {
  const roles = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT'];
  
  describe.each(roles)('Role: %s', (role) => {
    let testUser: any;
    
    beforeAll(async () => {
      testUser = await createUser({
        email: `${role.toLowerCase()}@test.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: role,
        role: role
      });
      
      // Login as this user
      await login({
        email: testUser.email,
        password: 'password123'
      });
    });

    afterAll(async () => {
      await logout();
      if (testUser?.id) {
        await deleteUser(testUser.id);
      }
    });

    it('should access role-appropriate endpoints', async () => {
      switch (role) {
        case 'SUPER_ADMIN':
          await expect(getAllUsers()).resolves.toBeDefined();
          await expect(getAllClinics()).resolves.toBeDefined();
          break;
        case 'CLINIC_ADMIN':
          await expect(getMyClinic()).resolves.toBeDefined();
          await expect(getClinicStats()).resolves.toBeDefined();
          break;
        case 'DOCTOR':
          await expect(getDoctorAppointments(testUser.id)).resolves.toBeDefined();
          await expect(getDoctorPatients('clinic-id', testUser.id)).resolves.toBeDefined();
          break;
        case 'PATIENT':
          await expect(getMyAppointments()).resolves.toBeDefined();
          await expect(getUserProfile()).resolves.toBeDefined();
          break;
      }
    });

    it('should be denied access to restricted endpoints', async () => {
      if (role === 'PATIENT') {
        await expect(getAllUsers()).rejects.toThrow();
        await expect(deleteUser('any-id')).rejects.toThrow();
      }
      
      if (role !== 'SUPER_ADMIN') {
        await expect(deleteClinic('any-id')).rejects.toThrow();
      }
    });
  });
});
```

### 4. Error Handling Tests

```typescript
describe('Error Handling', () => {
  describe('Network Errors', () => {
    it('should handle API connection failures', async () => {
      // Mock network failure
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      
      await expect(getHealthStatus()).resolves.toEqual({
        status: 'unhealthy',
        details: 'Network error'
      });
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      jest.spyOn(global, 'fetch').mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );
      
      await expect(login({ email: 'test@test.com', password: 'test' }))
        .rejects.toThrow('Timeout');
    });
  });

  describe('Authentication Errors', () => {
    it('should handle unauthorized access', async () => {
      await clearSession(); // Ensure no session
      await expect(getUserProfile()).rejects.toThrow('Not authenticated');
    });

    it('should handle expired tokens', async () => {
      // Mock expired token scenario
      await expect(refreshToken()).rejects.toThrow('Failed to refresh token');
    });
  });

  describe('Validation Errors', () => {
    it('should handle invalid input data', async () => {
      await expect(createUser({
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
        role: 'INVALID_ROLE'
      })).rejects.toThrow();
    });

    it('should handle missing required fields', async () => {
      await expect(createAppointment({
        // Missing required fields
      } as any)).rejects.toThrow();
    });
  });

  describe('Business Logic Errors', () => {
    it('should handle appointment conflicts', async () => {
      const appointmentData = {
        patientId: 'patient-id',
        doctorId: 'doctor-id',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z'
      };
      
      await createAppointment(appointmentData);
      await expect(createAppointment(appointmentData))
        .rejects.toThrow('Appointment conflict');
    });

    it('should handle insufficient inventory', async () => {
      await expect(dispensePrescription('prescription-id', {
        pharmacistId: 'pharmacist-id',
        dispensedMedications: [{
          medicineId: 'medicine-id',
          quantityDispensed: 1000, // More than available
          batchNumber: 'BATCH001',
          expiryDate: '2025-12-31'
        }],
        totalAmount: 100
      })).rejects.toThrow('Insufficient inventory');
    });
  });
});
```

### 5. Integration Workflow Tests

```typescript
describe('End-to-End Workflows', () => {
  describe('Patient Registration and Appointment Booking', () => {
    it('should complete full patient journey', async () => {
      // 1. Patient registers
      const patientData = {
        email: 'patient@workflow.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Patient',
        phone: '+1234567890'
      };
      await register(patientData);

      // 2. Patient logs in
      const loginResult = await login({
        email: patientData.email,
        password: patientData.password
      });
      expect(loginResult.isAuthenticated).toBe(true);

      // 3. Patient updates profile
      await updateUserProfile({
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        address: '123 Test St'
      });

      // 4. Patient searches for doctors
      const doctors = await searchDoctors('cardiology');
      expect(doctors.length).toBeGreaterThan(0);

      // 5. Patient checks doctor availability
      const availability = await getDoctorAvailability(doctors[0].id, '2024-12-01');
      expect(availability.timeSlots).toBeDefined();

      // 6. Patient books appointment
      const appointment = await createAppointment({
        patientId: loginResult.user.id,
        doctorId: doctors[0].id,
        startTime: availability.timeSlots[0].startTime,
        endTime: availability.timeSlots[0].endTime,
        type: 'CONSULTATION'
      });
      expect(appointment.id).toBeDefined();

      // 7. Patient receives confirmation
      const qrCode = await generateConfirmationQR(appointment.id);
      expect(qrCode.qrCode).toBeDefined();

      // Cleanup
      await cancelAppointment(appointment.id);
      await logout();
    });
  });

  describe('Doctor Consultation Workflow', () => {
    it('should complete consultation process', async () => {
      // Setup: Create patient and appointment
      const { patient, doctor, appointment } = await setupConsultationScenario();

      // 1. Doctor logs in
      await login({ email: doctor.email, password: 'password123' });

      // 2. Doctor views today's appointments
      const appointments = await getDoctorAppointments(doctor.id, {
        date: new Date().toISOString().split('T')[0]
      });
      expect(appointments.some((a: any) => a.id === appointment.id)).toBe(true);

      // 3. Patient checks in
      await processCheckIn({
        appointmentId: appointment.id,
        checkInTime: new Date().toISOString()
      });

      // 4. Doctor starts consultation
      await startConsultation(appointment.id, {
        startTime: new Date().toISOString()
      });

      // 5. Doctor adds medical records
      const medicalRecord = await createMedicalRecord({
        patientId: patient.id,
        type: 'DIAGNOSIS_REPORT',
        title: 'Regular Checkup',
        content: 'Patient is in good health',
        doctorId: doctor.id,
        appointmentId: appointment.id
      });
      expect(medicalRecord.id).toBeDefined();

      // 6. Doctor creates prescription
      const prescription = await createPrescription({
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appointment.id,
        medicines: [{
          medicineId: 'medicine-id',
          dosage: '10mg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Take with food'
        }],
        notes: 'Continue medication as prescribed'
      });
      expect(prescription.id).toBeDefined();

      // 7. Doctor completes appointment
      await markAppointmentCompleted(appointment.id, {
        completionTime: new Date().toISOString(),
        notes: 'Consultation completed successfully'
      });

      // Cleanup
      await logout();
    });
  });

  describe('Pharmacy Dispensing Workflow', () => {
    it('should complete prescription dispensing', async () => {
      // Setup: Create prescription
      const { prescription, patient } = await setupPharmacyScenario();

      // 1. Pharmacist logs in
      const pharmacist = await createUser({
        email: 'pharmacist@workflow.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Pharmacist',
        role: 'PHARMACIST'
      });
      await login({ email: pharmacist.email, password: 'password123' });

      // 2. Pharmacist views pending prescriptions
      const prescriptions = await getPrescriptions('clinic-id', {
        status: 'PENDING'
      });
      expect(prescriptions.some((p: any) => p.id === prescription.id)).toBe(true);

      // 3. Pharmacist checks inventory
      const inventory = await getInventory('clinic-id');
      expect(inventory.length).toBeGreaterThan(0);

      // 4. Pharmacist dispenses prescription
      await dispensePrescription(prescription.id, {
        pharmacistId: pharmacist.id,
        dispensedMedications: prescription.medicines.map((med: any) => ({
          medicineId: med.medicineId,
          quantityDispensed: med.quantity,
          batchNumber: 'BATCH001',
          expiryDate: '2025-12-31'
        })),
        totalAmount: 50.00,
        paymentMethod: 'CASH'
      });

      // 5. Prescription status updated
      const updatedPrescription = await getPrescriptionById(prescription.id);
      expect(updatedPrescription.status).toBe('DISPENSED');

      // Cleanup
      await logout();
      await deleteUser(pharmacist.id);
    });
  });
});

// Helper functions for test setup
async function setupConsultationScenario() {
  const patient = await createUser({
    email: 'patient@consultation.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Patient',
    role: 'PATIENT'
  });

  const doctor = await createUser({
    email: 'doctor@consultation.com',
    password: 'password123',
    firstName: 'Dr. Jane',
    lastName: 'Doctor',
    role: 'DOCTOR'
  });

  const appointment = await createAppointment({
    patientId: patient.id,
    doctorId: doctor.id,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    type: 'CONSULTATION',
    status: 'CONFIRMED'
  });

  return { patient, doctor, appointment };
}

async function setupPharmacyScenario() {
  const patient = await createUser({
    email: 'patient@pharmacy.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Patient',
    role: 'PATIENT'
  });

  const prescription = await createPrescription('clinic-id', {
    patientId: patient.id,
    doctorId: 'doctor-id',
    medicines: [{
      medicineId: 'medicine-id',
      dosage: '10mg',
      frequency: 'Twice daily',
      duration: '7 days',
      instructions: 'Take with food',
      quantity: 14
    }],
    notes: 'Test prescription'
  });

  return { patient, prescription };
}
```

### 6. Performance Tests

```typescript
describe('Performance Tests', () => {
  describe('Load Testing', () => {
    it('should handle concurrent user registrations', async () => {
      const registrations = Array.from({ length: 10 }, (_, i) => 
        register({
          email: `load${i}@test.com`,
          password: 'password123',
          firstName: 'Load',
          lastName: `Test${i}`,
          role: 'PATIENT'
        })
      );

      const results = await Promise.allSettled(registrations);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(8); // Allow some failures
    });

    it('should handle concurrent appointment bookings', async () => {
      const appointments = Array.from({ length: 5 }, (_, i) =>
        createAppointment({
          patientId: `patient-${i}`,
          doctorId: 'doctor-id',
          startTime: new Date(Date.now() + i * 3600000).toISOString(),
          endTime: new Date(Date.now() + (i + 1) * 3600000).toISOString(),
          type: 'CONSULTATION'
        })
      );

      const results = await Promise.allSettled(appointments);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBe(5);
    });
  });

  describe('Response Time Tests', () => {
    it('should respond to login within 2 seconds', async () => {
      const start = Date.now();
      await login({ email: 'test@test.com', password: 'password123' });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it('should fetch appointments within 1 second', async () => {
      const start = Date.now();
      await getAppointments('clinic-id');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks in repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform repeated operations
      for (let i = 0; i < 100; i++) {
        await getHealthStatus();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });
});
```

---

## Test Implementation Strategy

### 1. Testing Framework Setup

#### Recommended Tech Stack
```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "msw": "^2.0.0",
    "supertest": "^6.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "jest-mock-extended": "^3.0.0"
  }
}
```

#### Jest Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setup.ts']
}

module.exports = createJestConfig(customJestConfig)
```

#### Test Setup (`jest.setup.js`)
```javascript
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn()
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams()
}))

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8088'
process.env.NEXT_PUBLIC_CLINIC_ID = 'TEST_CLINIC'

// Establish API mocking before all tests
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock global fetch
global.fetch = jest.fn()
```

### 2. Mock Service Worker Setup

#### MSW Server Setup (`src/mocks/server.ts`)
```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

#### API Handlers (`src/mocks/handlers.ts`)
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Authentication handlers
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json()
    
    if (body.email === 'test@test.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: {
          id: 'user-123',
          email: 'test@test.com',
          role: 'PATIENT',
          firstName: 'Test',
          lastName: 'User'
        },
        access_token: 'mock-access-token',
        session_id: 'mock-session-id',
        isAuthenticated: true
      })
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  http.post('/auth/register', async ({ request }) => {
    const body = await request.json()
    
    if (body.email === 'existing@test.com') {
      return HttpResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      )
    }
    
    return HttpResponse.json({
      id: 'new-user-id',
      email: body.email,
      role: body.role || 'PATIENT'
    })
  }),

  // User management handlers
  http.get('/user/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.includes('Bearer')) {
      return HttpResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return HttpResponse.json({
      id: 'user-123',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'PATIENT'
    })
  }),

  // Appointment handlers
  http.post('/appointments', async ({ request }) => {
    const body = await request.json()
    
    return HttpResponse.json({
      id: 'appointment-123',
      ...body,
      status: 'SCHEDULED',
      createdAt: new Date().toISOString()
    })
  }),

  http.get('/appointments/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      startTime: '2024-12-01T10:00:00Z',
      endTime: '2024-12-01T11:00:00Z',
      status: 'SCHEDULED'
    })
  }),

  // Health check handler
  http.get('/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  }),

  // Error simulation handlers
  http.get('/api/error/network', () => {
    return HttpResponse.error()
  }),

  http.get('/api/error/timeout', () => {
    return new Promise(() => {
      // Never resolves to simulate timeout
    })
  })
]
```

### 3. Test Utilities

#### Test Helper Functions (`tests/utils/testHelpers.ts`)
```typescript
import { login, register, logout } from '@/lib/actions/auth.server'
import { createUser, deleteUser } from '@/lib/actions/users.server'

export async function createTestUser(overrides = {}) {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'PATIENT',
    ...overrides
  }
  
  return await createUser(userData)
}

export async function loginAsRole(role: string) {
  const user = await createTestUser({ role })
  await login({ email: user.email, password: 'password123' })
  return user
}

export async function cleanupUser(userId: string) {
  try {
    await deleteUser(userId)
  } catch (error) {
    console.warn('Failed to cleanup user:', error)
  }
}

export function createMockAppointment(overrides = {}) {
  return {
    id: 'mock-appointment-id',
    patientId: 'mock-patient-id',
    doctorId: 'mock-doctor-id',
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(),
    type: 'CONSULTATION',
    status: 'SCHEDULED',
    ...overrides
  }
}

export async function waitFor(condition: () => boolean, timeout = 5000) {
  const start = Date.now()
  
  while (Date.now() - start < timeout) {
    if (condition()) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  throw new Error('Condition not met within timeout')
}

export function mockFetch(responses: Record<string, any>) {
  const originalFetch = global.fetch
  
  global.fetch = jest.fn((url: string) => {
    const response = responses[url] || responses['*']
    
    if (!response) {
      return Promise.reject(new Error(`No mock response for ${url}`))
    }
    
    return Promise.resolve({
      ok: response.status < 400,
      status: response.status || 200,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data))
    } as Response)
  })
  
  return () => {
    global.fetch = originalFetch
  }
}
```

#### Custom Test Matchers (`tests/utils/matchers.ts`)
```typescript
export const customMatchers = {
  toBeValidUser(received: any) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      received.email.includes('@') &&
      typeof received.role === 'string'
    
    return {
      message: () => `expected ${received} to be a valid user object`,
      pass
    }
  },

  toBeValidAppointment(received: any) {
    const pass = received &&
      typeof received.id === 'string' &&
      typeof received.patientId === 'string' &&
      typeof received.doctorId === 'string' &&
      typeof received.startTime === 'string' &&
      typeof received.endTime === 'string' &&
      ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(received.status)
    
    return {
      message: () => `expected ${received} to be a valid appointment object`,
      pass
    }
  },

  toBeAuthenticated(received: any) {
    const pass = received &&
      received.isAuthenticated === true &&
      received.user &&
      received.access_token &&
      received.session_id
    
    return {
      message: () => `expected ${received} to be an authenticated session`,
      pass
    }
  }
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R
      toBeValidAppointment(): R
      toBeAuthenticated(): R
    }
  }
}
```

### 4. Test Organization Structure

```
tests/
├── unit/
│   ├── auth/
│   │   ├── login.test.ts
│   │   ├── register.test.ts
│   │   ├── session.test.ts
│   │   └── permissions.test.ts
│   ├── users/
│   │   ├── crud.test.ts
│   │   ├── search.test.ts
│   │   └── roles.test.ts
│   ├── appointments/
│   │   ├── crud.test.ts
│   │   ├── scheduling.test.ts
│   │   └── queue.test.ts
│   └── ...
├── integration/
│   ├── workflows/
│   │   ├── patient-journey.test.ts
│   │   ├── doctor-consultation.test.ts
│   │   └── pharmacy-dispensing.test.ts
│   ├── api/
│   │   ├── error-handling.test.ts
│   │   ├── rate-limiting.test.ts
│   │   └── data-consistency.test.ts
│   └── ...
├── e2e/
│   ├── user-flows/
│   │   ├── registration-flow.test.ts
│   │   ├── appointment-booking.test.ts
│   │   └── prescription-management.test.ts
│   └── ...
├── performance/
│   ├── load-testing.test.ts
│   ├── stress-testing.test.ts
│   └── memory-testing.test.ts
├── security/
│   ├── authentication.test.ts
│   ├── authorization.test.ts
│   ├── input-validation.test.ts
│   └── data-protection.test.ts
├── utils/
│   ├── testHelpers.ts
│   ├── matchers.ts
│   ├── fixtures.ts
│   └── mocks.ts
└── setup.ts
```

### 5. Database Testing Strategy

#### Test Database Setup
```typescript
// tests/utils/database.ts
import { beforeAll, afterAll, beforeEach } from '@jest/globals'

export class TestDatabase {
  private static instance: TestDatabase
  
  static getInstance() {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase()
    }
    return TestDatabase.instance
  }
  
  async setup() {
    // Create test database
    // Migrate schema
    // Seed test data
  }
  
  async cleanup() {
    // Drop test database
  }
  
  async reset() {
    // Clear all tables
    // Reset sequences
    // Reseed basic data
  }
  
  async seed(fixtures: any[]) {
    // Insert test fixtures
  }
}

// Global test hooks
beforeAll(async () => {
  await TestDatabase.getInstance().setup()
})

afterAll(async () => {
  await TestDatabase.getInstance().cleanup()
})

beforeEach(async () => {
  await TestDatabase.getInstance().reset()
})
```

#### Test Fixtures (`tests/utils/fixtures.ts`)
```typescript
export const userFixtures = {
  patient: {
    email: 'patient@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Patient',
    role: 'PATIENT',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'MALE'
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'password123',
    firstName: 'Dr. Jane',
    lastName: 'Doctor',
    role: 'DOCTOR',
    specialization: 'Cardiology',
    licenseNumber: 'MED123456'
  },
  admin: {
    email: 'admin@test.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'CLINIC_ADMIN'
  }
}

export const appointmentFixtures = {
  scheduled: {
    type: 'CONSULTATION',
    status: 'SCHEDULED',
    startTime: '2024-12-01T10:00:00Z',
    endTime: '2024-12-01T11:00:00Z',
    notes: 'Regular checkup'
  },
  confirmed: {
    type: 'FOLLOW_UP',
    status: 'CONFIRMED',
    startTime: '2024-12-01T14:00:00Z',
    endTime: '2024-12-01T15:00:00Z',
    notes: 'Follow-up appointment'
  }
}

export const medicineFixtures = {
  paracetamol: {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'PharmaCorp',
    category: 'ANALGESIC',
    dosageForm: 'TABLET',
    strength: '500mg',
    prescriptionRequired: false
  },
  amoxicillin: {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    manufacturer: 'AntibioticCorp',
    category: 'ANTIBIOTIC',
    dosageForm: 'CAPSULE',
    strength: '250mg',
    prescriptionRequired: true
  }
}
```

---

## CI/CD Integration

### 1. GitHub Actions Workflow (`.github/workflows/test.yml`)

```yaml
name: API Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: healthcare_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test environment
      run: |
        cp .env.example .env.test
        echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare_test" >> .env.test
        echo "REDIS_URL=redis://localhost:6379" >> .env.test
    
    - name: Run database migrations
      run: npm run db:migrate:test
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Run performance tests
      run: npm run test:performance
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Run security tests
      run: npm run test:security
    
    - name: Lint code
      run: npm run lint
    
    - name: Type check
      run: npm run type-check
    
    - name: Build application
      run: npm run build

  api-compatibility:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run API compatibility tests
      run: npm run test:api-compatibility
    
    - name: Validate OpenAPI schema
      run: npm run validate:openapi

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Scan for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
    
    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'healthcare-frontend'
        path: '.'
        format: 'HTML'
```

### 2. Package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e",
    "test:performance": "jest tests/performance",
    "test:security": "jest tests/security",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:api-compatibility": "jest tests/api-compatibility",
    "validate:openapi": "swagger-codegen validate -i api-spec.yaml",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "db:migrate:test": "npm run db:migrate -- --env test"
  }
}
```

### 3. Test Environment Configuration

#### Environment-Specific Configs
```typescript
// config/test.ts
export const testConfig = {
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:8088',
    timeout: 30000,
    retries: 3
  },
  database: {
    url: process.env.TEST_DATABASE_URL,
    pool: {
      min: 0,
      max: 5
    }
  },
  auth: {
    sessionTimeout: 300000, // 5 minutes for tests
    tokenExpiry: 3600000 // 1 hour for tests
  },
  features: {
    enableMocking: true,
    enableLogging: process.env.TEST_DEBUG === 'true',
    enableMetrics: false
  }
}
```

#### Test Data Management
```typescript
// tests/utils/testData.ts
export class TestDataManager {
  private createdUsers: string[] = []
  private createdAppointments: string[] = []
  private createdClinics: string[] = []
  
  async createUser(userData: any) {
    const user = await createUser(userData)
    this.createdUsers.push(user.id)
    return user
  }
  
  async createAppointment(appointmentData: any) {
    const appointment = await createAppointment(appointmentData)
    this.createdAppointments.push(appointment.id)
    return appointment
  }
  
  async cleanup() {
    // Clean up in reverse order of dependencies
    for (const appointmentId of this.createdAppointments) {
      try {
        await cancelAppointment(appointmentId)
      } catch (error) {
        console.warn('Failed to cleanup appointment:', error)
      }
    }
    
    for (const userId of this.createdUsers) {
      try {
        await deleteUser(userId)
      } catch (error) {
        console.warn('Failed to cleanup user:', error)
      }
    }
    
    // Reset arrays
    this.createdUsers = []
    this.createdAppointments = []
    this.createdClinics = []
  }
}

// Global test data manager
let testDataManager: TestDataManager

beforeEach(() => {
  testDataManager = new TestDataManager()
})

afterEach(async () => {
  await testDataManager.cleanup()
})

export { testDataManager }
```

### 4. Continuous Monitoring

#### Test Metrics Dashboard
```typescript
// tests/utils/metrics.ts
export class TestMetrics {
  private static metrics: any[] = []
  
  static recordTestDuration(testName: string, duration: number) {
    this.metrics.push({
      type: 'duration',
      testName,
      duration,
      timestamp: new Date().toISOString()
    })
  }
  
  static recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.metrics.push({
      type: 'api_call',
      endpoint,
      duration,
      success,
      timestamp: new Date().toISOString()
    })
  }
  
  static generateReport() {
    const report = {
      totalTests: this.metrics.filter(m => m.type === 'duration').length,
      averageDuration: this.calculateAverageDuration(),
      slowestTests: this.getSlowestTests(),
      apiPerformance: this.getApiPerformance(),
      successRate: this.calculateSuccessRate()
    }
    
    return report
  }
  
  private static calculateAverageDuration() {
    const durations = this.metrics
      .filter(m => m.type === 'duration')
      .map(m => m.duration)
    
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }
  
  private static getSlowestTests() {
    return this.metrics
      .filter(m => m.type === 'duration')
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
  }
  
  private static getApiPerformance() {
    const apiCalls = this.metrics.filter(m => m.type === 'api_call')
    const groupedByEndpoint = apiCalls.reduce((acc, call) => {
      if (!acc[call.endpoint]) {
        acc[call.endpoint] = []
      }
      acc[call.endpoint].push(call)
      return acc
    }, {} as Record<string, any[]>)
    
    return Object.entries(groupedByEndpoint).map(([endpoint, calls]) => ({
      endpoint,
      averageDuration: calls.reduce((a, b) => a + b.duration, 0) / calls.length,
      successRate: calls.filter(c => c.success).length / calls.length,
      totalCalls: calls.length
    }))
  }
  
  private static calculateSuccessRate() {
    const apiCalls = this.metrics.filter(m => m.type === 'api_call')
    const successfulCalls = apiCalls.filter(m => m.success).length
    return successfulCalls / apiCalls.length
  }
}

// Jest reporter for metrics
export class MetricsReporter {
  onTestResult(test: any, testResult: any) {
    testResult.testResults.forEach((result: any) => {
      TestMetrics.recordTestDuration(
        result.fullName,
        result.duration || 0
      )
    })
  }
  
  onRunComplete() {
    const report = TestMetrics.generateReport()
    console.log('Test Metrics Report:', JSON.stringify(report, null, 2))
    
    // Send to monitoring service
    this.sendToMonitoring(report)
  }
  
  private sendToMonitoring(report: any) {
    // Implementation to send metrics to monitoring service
    // e.g., DataDog, New Relic, CloudWatch, etc.
  }
}
```

---

## Appendices

### A. Environment Variables Reference

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes | - | `https://api.ishswami.in` |
| `NEXT_PUBLIC_CLINIC_ID` | Default clinic ID | Yes | - | `CL0002` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional | - | `616510725595-...` |
| `NEXT_PUBLIC_AUTH_ENABLED` | Enable authentication | Optional | `true` | `true` |
| `NODE_ENV` | Environment mode | Optional | `development` | `production` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | Optional | `false` | `true` |

### B. API Response Status Codes

| Status Code | Description | Use Cases |
|-------------|-------------|-----------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limiting |
| 500 | Internal Server Error | Server-side errors |

### C. Common Error Response Format

```typescript
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
    timestamp: string
    requestId: string
  }
}
```

### D. Rate Limiting Guidelines

| Endpoint Category | Rate Limit | Window | Notes |
|-------------------|------------|--------|-------|
| Authentication | 5 requests | 1 minute | Login, register |
| User Management | 100 requests | 1 hour | CRUD operations |
| Appointments | 50 requests | 10 minutes | Booking, updates |
| Medical Records | 200 requests | 1 hour | Read-heavy operations |
| Analytics | 20 requests | 1 hour | Expensive queries |

### E. Data Privacy and Compliance

#### HIPAA Compliance Requirements
- All patient data must be encrypted in transit and at rest
- Audit logs must be maintained for all data access
- User sessions must timeout after inactivity
- Data retention policies must be enforced
- Access controls must follow principle of least privilege

#### GDPR Compliance Requirements
- User consent must be obtained for data processing
- Users must be able to request data deletion
- Data breach notifications must be implemented
- Privacy by design principles must be followed

### F. Performance Benchmarks

| Operation | Target Response Time | Acceptable Response Time | Notes |
|-----------|---------------------|-------------------------|--------|
| User Login | < 500ms | < 2s | Including token generation |
| Appointment Booking | < 1s | < 3s | Including conflict checking |
| Medical Record Retrieval | < 800ms | < 2s | Single record fetch |
| Patient Search | < 1s | < 3s | Up to 100 results |
| Dashboard Load | < 2s | < 5s | Including analytics |

### G. Security Testing Checklist

- [ ] SQL Injection testing
- [ ] XSS (Cross-Site Scripting) testing
- [ ] CSRF (Cross-Site Request Forgery) testing
- [ ] Authentication bypass testing
- [ ] Authorization testing
- [ ] Input validation testing
- [ ] Session management testing
- [ ] API rate limiting testing
- [ ] Data encryption testing
- [ ] Error handling testing

### H. Browser and Device Support Matrix

| Browser | Minimum Version | Testing Priority |
|---------|----------------|------------------|
| Chrome | 90+ | High |
| Firefox | 88+ | High |
| Safari | 14+ | Medium |
| Edge | 90+ | Medium |
| Mobile Safari | 14+ | High |
| Mobile Chrome | 90+ | High |

### I. Test Data Generation

```typescript
// tests/utils/generators.ts
export class DataGenerator {
  static generateUser(overrides = {}) {
    return {
      email: `user-${Date.now()}@test.com`,
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'PATIENT',
      ...overrides
    }
  }
  
  static generateAppointment(overrides = {}) {
    const start = new Date(Date.now() + 86400000) // Tomorrow
    const end = new Date(start.getTime() + 3600000) // +1 hour
    
    return {
      patientId: 'patient-id',
      doctorId: 'doctor-id',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: 'CONSULTATION',
      status: 'SCHEDULED',
      ...overrides
    }
  }
  
  static generateMedicine(overrides = {}) {
    return {
      name: `Medicine-${Date.now()}`,
      genericName: 'Generic Name',
      manufacturer: 'Test Pharma',
      category: 'ANALGESIC',
      dosageForm: 'TABLET',
      strength: '500mg',
      prescriptionRequired: false,
      ...overrides
    }
  }
}
```

---

## Summary

This comprehensive documentation provides:

1. **Complete API Inventory**: All 12 server action files with 200+ API functions cataloged
2. **Environment Configuration**: Required variables and test setup
3. **Authentication Strategy**: Session management and RBAC testing
4. **Comprehensive Test Plans**: Unit, integration, E2E, performance, and security tests
5. **Test Implementation**: Framework setup, mocking, utilities, and organization
6. **CI/CD Integration**: GitHub Actions workflows and monitoring
7. **Performance Benchmarks**: Response time targets and rate limits
8. **Security Guidelines**: HIPAA/GDPR compliance and security testing
9. **Appendices**: Reference materials and best practices

The testing strategy covers all aspects of the healthcare application's API layer, ensuring reliability, security, and compliance with healthcare industry standards.

To implement this testing strategy:

1. Set up the testing framework using the provided configurations
2. Create mock services using MSW for consistent testing
3. Implement test suites following the provided examples
4. Set up CI/CD pipelines for automated testing
5. Establish monitoring and metrics collection
6. Maintain test data and fixtures for consistent results

This approach will provide comprehensive coverage of all API functionality while ensuring the application meets healthcare industry standards for reliability, security, and compliance.