# Security Rules - Healthcare Frontend
# Version: 2.1.0 | Next.js 16 + React 19 + TypeScript 5
# HIPAA-Compliant Enterprise Security Standards

## 🎯 **Core Principles (SOLID, DRY, KISS)**

### **SOLID Principles in Security**
- **Single Responsibility**: Each security module handles one concern (auth, encryption, audit)
- **Open/Closed**: Extend security via plugins, not modification
- **Liskov Substitution**: Security interfaces ensure consistent behavior
- **Interface Segregation**: Role-specific security policies
- **Dependency Inversion**: Depend on security abstractions, not implementations

### **DRY (Don't Repeat Yourself)**
- Centralized security utilities
- Reusable validation functions
- Common encryption patterns
- Unified audit logging
- Shared permission checks

### **KISS (Keep It Simple, Stupid)**
- Clear security policies
- Straightforward encryption
- Direct permission checks
- Simple audit logging

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

## 🔐 **Core Security Principles**

### **Healthcare Data Protection**
- **HIPAA Compliance**: All patient data handling must meet HIPAA requirements
- **Data Minimization**: Collect and process only necessary medical information
- **Encryption**: End-to-end encryption for all sensitive data
- **Audit Trails**: Complete logging of all data access and modifications
- **Access Controls**: Strict role-based permissions for medical data

### **Authentication & Authorization**

#### **Multi-Factor Authentication (MFA)**
```typescript
// MFA Implementation Pattern
interface MFAConfig {
  required: boolean;
  methods: ('sms' | 'email' | 'authenticator')[];
  backupCodes: boolean;
  sessionTimeout: number; // minutes
}

// Role-based MFA requirements
const mfaRequirements: Record<Role, MFAConfig> = {
  SUPER_ADMIN: {
    required: true,
    methods: ['authenticator', 'sms'],
    backupCodes: true,
    sessionTimeout: 30
  },
  CLINIC_ADMIN: {
    required: true,
    methods: ['sms', 'email'],
    backupCodes: true,
    sessionTimeout: 60
  },
  DOCTOR: {
    required: true,
    methods: ['sms', 'authenticator'],
    backupCodes: false,
    sessionTimeout: 120
  },
  NURSE: {
    required: false,
    methods: ['sms'],
    backupCodes: false,
    sessionTimeout: 60
  },
  RECEPTIONIST: {
    required: false,
    methods: ['sms'],
    backupCodes: false,
    sessionTimeout: 240
  },
  PATIENT: {
    required: false,
    methods: ['sms', 'email'],
    backupCodes: false,
    sessionTimeout: 480
  }
};
```

#### **Session Management**
```typescript
// Secure Session Pattern
interface SecureSession {
  accessToken: string;        // JWT with 5-hour expiry
  refreshToken: string;       // 30-day expiry
  sessionId: string;          // Unique session identifier
  deviceFingerprint: string;  // Device identification
  ipAddress: string;          // Client IP for tracking
  userAgent: string;          // Browser/device info
  lastActivity: Date;         // Activity tracking
  clinicId: string;           // Tenant isolation
  permissions: string[];      // Cached permissions
}

// Session Validation
const validateSession = async (sessionId: string): Promise<boolean> => {
  // 1. Check session exists and is active
  // 2. Validate IP address consistency
  // 3. Check device fingerprint
  // 4. Verify token expiry
  // 5. Confirm clinic access
  // 6. Update last activity
};
```

#### **JWT Token Security**
```typescript
// JWT Claims Structure
interface JWTClaims {
  sub: string;              // User ID
  email: string;            // User email
  role: Role;               // User role
  clinicId: string;         // Clinic association
  permissions: string[];    // User permissions
  sessionId: string;        // Session identifier
  deviceId: string;         // Device identifier
  iat: number;              // Issued at
  exp: number;              // Expiry time
  jti: string;              // JWT ID for revocation
}

// Token Validation Rules
const tokenValidation = {
  algorithm: 'RS256',         // RSA with SHA-256
  issuer: 'healthcare-app',   // Token issuer
  audience: 'clinic-users',   // Token audience
  maxAge: '5h',               // Access token max age
  refreshMaxAge: '30d',       // Refresh token max age
  blacklistCheck: true,       // Check token revocation
  deviceValidation: true      // Validate device binding
};
```

### **Data Encryption**

#### **At-Rest Encryption**
```typescript
// Database Encryption Configuration
const encryptionConfig = {
  algorithm: 'AES-256-GCM',
  keyRotation: '90d',           // Rotate keys every 90 days
  fields: {
    // Patient Data
    firstName: 'ENCRYPT',
    lastName: 'ENCRYPT',
    dateOfBirth: 'ENCRYPT',
    ssn: 'ENCRYPT',
    address: 'ENCRYPT',
    phone: 'ENCRYPT',
    email: 'HASH',              // One-way hash for lookup
    
    // Medical Data
    medicalHistory: 'ENCRYPT',
    prescriptions: 'ENCRYPT',
    labResults: 'ENCRYPT',
    diagnosis: 'ENCRYPT',
    notes: 'ENCRYPT',
    
    // Financial Data
    insuranceInfo: 'ENCRYPT',
    paymentDetails: 'ENCRYPT'
  }
};
```

#### **In-Transit Encryption**
```typescript
// TLS Configuration
const tlsConfig = {
  version: 'TLSv1.3',          // Latest TLS version
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ],
  certificateTransparency: true,
  hsts: {
    maxAge: 31536000,          // 1 year
    includeSubDomains: true,
    preload: true
  }
};

// API Request Encryption
const secureApiCall = async (endpoint: string, data: any) => {
  const encryptedPayload = await encrypt(JSON.stringify(data));
  
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Encryption': 'AES-256-GCM',
      'Authorization': `Bearer ${accessToken}`,
      'X-Session-ID': sessionId,
      'X-Clinic-ID': clinicId
    },
    body: encryptedPayload
  });
};
```

### **Input Validation & Sanitization**

#### **Zod Schema Validation**
```typescript
// Medical Data Validation
const medicalRecordSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  type: z.enum(['LAB_TEST', 'XRAY', 'MRI', 'PRESCRIPTION', 'DIAGNOSIS_REPORT']),
  title: z.string()
    .min(3, 'Title too short')
    .max(200, 'Title too long')
    .regex(/^[a-zA-Z0-9\s\-.,()]+$/, 'Invalid characters in title'),
  content: z.string()
    .min(10, 'Content too short')
    .max(5000, 'Content too long')
    .transform(sanitizeHtml), // Remove potentially harmful HTML
  doctorId: z.string().uuid('Invalid doctor ID'),
  appointmentId: z.string().uuid().optional(),
  attachments: z.array(
    z.object({
      filename: z.string().regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename'),
      mimetype: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
      size: z.number().max(10 * 1024 * 1024, 'File too large (max 10MB)')
    })
  ).max(5, 'Too many attachments')
});

// Patient Data Validation
const patientSchema = z.object({
  firstName: z.string()
    .min(2, 'First name too short')
    .max(50, 'First name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Invalid characters in name'),
  lastName: z.string()
    .min(2, 'Last name too short')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Invalid characters in name'),
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .transform(normalizeEmail),
  phone: z.string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format'),
  dateOfBirth: z.string()
    .datetime('Invalid date format')
    .refine(date => {
      const age = new Date().getFullYear() - new Date(date).getFullYear();
      return age >= 0 && age <= 150;
    }, 'Invalid age'),
  ssn: z.string()
    .regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN format')
    .transform(normalizeSsn)
    .optional(),
  address: z.object({
    street: z.string().max(100),
    city: z.string().max(50),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
  })
});
```

#### **Content Security Policy (CSP)**
```typescript
// CSP Configuration
const cspConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Only for specific trusted scripts
    'https://trusted-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For Tailwind CSS
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://trusted-image-cdn.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.healthcare-app.com',
    'wss://realtime.healthcare-app.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
  'report-uri': '/api/csp-report'
};
```

### **RBAC Security Implementation**

#### **Permission-Based Security**
```typescript
// Permission Validation
export function useSecurePermissions() {
  const { user } = useAuth();
  const clinicId = useCurrentClinicId();
  
  const hasPermission = useCallback(async (permission: string): Promise<boolean> => {
    // 1. Validate user session
    if (!user || !clinicId) return false;
    
    // 2. Check permission cache
    const cachedPermissions = getPermissionCache(user.id, clinicId);
    if (cachedPermissions) {
      return validatePermission(cachedPermissions, permission);
    }
    
    // 3. Fetch fresh permissions
    const permissions = await fetchUserPermissions(user.id, clinicId);
    
    // 4. Cache permissions with TTL
    cachePermissions(user.id, clinicId, permissions, 300); // 5 minutes
    
    return validatePermission(permissions, permission);
  }, [user, clinicId]);
  
  const requirePermission = useCallback(async (permission: string) => {
    const hasAccess = await hasPermission(permission);
    if (!hasAccess) {
      logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        userId: user?.id,
        clinicId,
        permission,
        timestamp: new Date(),
        ipAddress: getClientIP(),
        userAgent: navigator.userAgent
      });
      throw new SecurityError('Access denied: Insufficient permissions');
    }
  }, [hasPermission]);
  
  return { hasPermission, requirePermission };
}
```

#### **Clinic Data Isolation**
```typescript
// Multi-Tenant Security
export async function validateClinicAccess(
  userId: string, 
  clinicId: string,
  action: string
): Promise<boolean> {
  try {
    // 1. Verify user-clinic association
    const userClinic = await getUserClinicAssociation(userId, clinicId);
    if (!userClinic || !userClinic.isActive) {
      await logSecurityEvent('CLINIC_ACCESS_DENIED', {
        userId,
        clinicId,
        action,
        reason: 'No valid clinic association'
      });
      return false;
    }
    
    // 2. Check role permissions for action
    const rolePermissions = await getRolePermissions(userClinic.role);
    const hasPermission = validateActionPermission(rolePermissions, action);
    
    if (!hasPermission) {
      await logSecurityEvent('INSUFFICIENT_PERMISSIONS', {
        userId,
        clinicId,
        action,
        role: userClinic.role
      });
      return false;
    }
    
    // 3. Log successful access
    await logSecurityEvent('CLINIC_ACCESS_GRANTED', {
      userId,
      clinicId,
      action,
      role: userClinic.role
    });
    
    return true;
  } catch (error) {
    await logSecurityEvent('CLINIC_ACCESS_ERROR', {
      userId,
      clinicId,
      action,
      error: error.message
    });
    return false;
  }
}
```

### **Audit Logging & Monitoring**

#### **Comprehensive Audit Trails**
```typescript
// Audit Log Structure
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  clinicId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  result: 'SUCCESS' | 'FAILURE' | 'UNAUTHORIZED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, any>;
}

// Audit Logging Implementation
export async function auditLog(event: Omit<AuditLog, 'id' | 'timestamp'>) {
  const log: AuditLog = {
    id: generateUUID(),
    timestamp: new Date(),
    ...event
  };
  
  // 1. Store in secure audit database
  await storeAuditLog(log);
  
  // 2. Send to SIEM if high risk
  if (log.riskLevel === 'HIGH' || log.riskLevel === 'CRITICAL') {
    await sendToSIEM(log);
  }
  
  // 3. Trigger alerts for critical events
  if (log.riskLevel === 'CRITICAL') {
    await triggerSecurityAlert(log);
  }
  
  // 4. Update security metrics
  await updateSecurityMetrics(log);
}
```

#### **Real-time Security Monitoring**
```typescript
// Security Event Detection
const securityRules = {
  // Failed login attempts
  FAILED_LOGIN: {
    threshold: 5,
    timeWindow: 300, // 5 minutes
    action: 'LOCK_ACCOUNT',
    alertLevel: 'HIGH'
  },
  
  // Unusual access patterns
  UNUSUAL_ACCESS: {
    threshold: 10,
    timeWindow: 3600, // 1 hour
    action: 'REQUIRE_MFA',
    alertLevel: 'MEDIUM'
  },
  
  // Data export attempts
  DATA_EXPORT: {
    threshold: 3,
    timeWindow: 86400, // 24 hours
    action: 'ADMIN_APPROVAL',
    alertLevel: 'HIGH'
  },
  
  // Privilege escalation
  PRIVILEGE_ESCALATION: {
    threshold: 1,
    timeWindow: 0,
    action: 'IMMEDIATE_LOCK',
    alertLevel: 'CRITICAL'
  }
};

// Security Event Handler
export async function handleSecurityEvent(event: SecurityEvent) {
  const rule = securityRules[event.type];
  if (!rule) return;
  
  // Check if threshold exceeded
  const recentEvents = await getRecentEvents(
    event.type, 
    event.userId, 
    rule.timeWindow
  );
  
  if (recentEvents.length >= rule.threshold) {
    // Execute security action
    await executeSecurityAction(rule.action, event);
    
    // Send alert
    await sendSecurityAlert({
      level: rule.alertLevel,
      event,
      recentEvents,
      action: rule.action
    });
  }
}
```

### **File Upload Security**

#### **Secure File Handling**
```typescript
// File Upload Validation
export const fileUploadSecurity = {
  // Allowed file types for medical records
  allowedMimeTypes: [
    'image/jpeg',
    'image/png', 
    'image/tiff',
    'application/pdf',
    'application/dicom' // Medical imaging
  ],
  
  // File size limits
  maxFileSize: 50 * 1024 * 1024, // 50MB
  
  // Virus scanning
  virusScanRequired: true,
  
  // File naming
  sanitizeFilenames: true,
  
  // Storage encryption
  encryptAtRest: true
};

// File Upload Handler
export async function secureFileUpload(
  file: File,
  userId: string,
  clinicId: string,
  recordId: string
): Promise<string> {
  // 1. Validate file type
  if (!fileUploadSecurity.allowedMimeTypes.includes(file.type)) {
    throw new SecurityError('File type not allowed');
  }
  
  // 2. Check file size
  if (file.size > fileUploadSecurity.maxFileSize) {
    throw new SecurityError('File too large');
  }
  
  // 3. Sanitize filename
  const sanitizedName = sanitizeFilename(file.name);
  
  // 4. Scan for viruses
  const scanResult = await scanFileForViruses(file);
  if (!scanResult.clean) {
    await auditLog({
      userId,
      clinicId,
      action: 'FILE_UPLOAD_BLOCKED',
      resource: 'FILE',
      resourceId: sanitizedName,
      result: 'FAILURE',
      riskLevel: 'HIGH',
      metadata: { reason: 'Virus detected', scanResult }
    });
    throw new SecurityError('File failed security scan');
  }
  
  // 5. Encrypt and store
  const encryptedFile = await encryptFile(file);
  const storageKey = await storeEncryptedFile(encryptedFile, {
    userId,
    clinicId,
    recordId,
    originalName: sanitizedName,
    mimeType: file.type
  });
  
  // 6. Audit log
  await auditLog({
    userId,
    clinicId,
    action: 'FILE_UPLOADED',
    resource: 'FILE',
    resourceId: storageKey,
    result: 'SUCCESS',
    riskLevel: 'LOW',
    metadata: { 
      originalName: sanitizedName,
      size: file.size,
      mimeType: file.type
    }
  });
  
  return storageKey;
}
```

### **API Security**

#### **Rate Limiting**
```typescript
// Rate Limiting Configuration
const rateLimits = {
  // Authentication endpoints
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                    // 5 attempts per window
    message: 'Too many login attempts'
  },
  
  // Password reset
  '/api/auth/forgot-password': {
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3,                    // 3 attempts per hour
    message: 'Too many password reset requests'
  },
  
  // Data export
  '/api/export/*': {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5,                        // 5 exports per day
    message: 'Daily export limit exceeded'
  },
  
  // General API
  '/api/*': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 1000,                 // 1000 requests per window
    message: 'API rate limit exceeded'
  }
};

// Rate Limiting Middleware
export function createRateLimit(endpoint: string) {
  const config = rateLimits[endpoint] || rateLimits['/api/*'];
  
  return rateLimit({
    ...config,
    keyGenerator: (req) => {
      // Use IP + User ID for authenticated routes
      const userId = req.user?.id;
      const ip = getClientIP(req);
      return userId ? `${userId}:${ip}` : ip;
    },
    handler: async (req, res) => {
      await auditLog({
        userId: req.user?.id || 'anonymous',
        clinicId: req.user?.clinicId || '',
        action: 'RATE_LIMIT_EXCEEDED',
        resource: 'API',
        resourceId: endpoint,
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || '',
        sessionId: req.sessionId || ''
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: config.windowMs
      });
    }
  });
}
```

### **Environment Security**

#### **Environment Variables**
```typescript
// Secure Environment Configuration
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_CLINIC_ID',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'DATABASE_URL',
  'REDIS_URL'
] as const;

// Environment Validation
export function validateEnvironment() {
  const missing = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secret strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  // Validate encryption key
  const encryptionKey = process.env.ENCRYPTION_KEY!;
  if (encryptionKey.length !== 64) { // 32 bytes in hex
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
}
```

### **HIPAA Compliance Checklist**

#### **Technical Safeguards**
- [x] **Access Control**: Unique user identification, automatic logoff, encryption
- [x] **Audit Controls**: Hardware, software, and procedural mechanisms
- [x] **Integrity**: PHI alteration or destruction protection
- [x] **Person or Entity Authentication**: Verify user identity
- [x] **Transmission Security**: End-to-end encryption for data in transit

#### **Administrative Safeguards**
- [x] **Security Officer**: Designated security responsibility
- [x] **Workforce Training**: Regular security awareness training
- [x] **Information Access Management**: Procedures for granting access
- [x] **Security Awareness**: Ongoing security education program
- [x] **Incident Procedures**: Response and reporting procedures

#### **Physical Safeguards**
- [x] **Facility Access Controls**: Physical access to systems
- [x] **Workstation Use**: Proper workstation access controls
- [x] **Device and Media Controls**: Receipt and removal of hardware/media

## 📋 **Enterprise Security Checklist**

### **Before Implementing Security**
- [ ] **SOLID Principles**: Security modules follow Single Responsibility
- [ ] **DRY Compliance**: Security utilities centralized and reused
- [ ] **KISS Principle**: Security policies are clear and simple
- [ ] **HIPAA Compliance**: All requirements reviewed
- [ ] **MFA Configuration**: Role-based MFA requirements defined
- [ ] **Encryption**: At-rest and in-transit encryption planned
- [ ] **Session Management**: Secure session handling implemented
- [ ] **Audit Logging**: Comprehensive logging strategy defined
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **RBAC**: Permission system properly implemented

### **Security Review Items**
- [ ] **Authentication**: MFA implemented for required roles
- [ ] **Authorization**: RBAC properly enforced
- [ ] **Data Encryption**: All sensitive data encrypted
- [ ] **Session Security**: Secure session management
- [ ] **Input Validation**: All inputs validated with Zod
- [ ] **Audit Trails**: All access logged
- [ ] **File Uploads**: Secure file handling
- [ ] **API Security**: Rate limiting and validation
- [ ] **Environment Security**: Secrets properly managed
- [ ] **CSP Headers**: Content Security Policy configured

### **SOLID Principles Checklist**
- [ ] **Single Responsibility**: Each security module has one purpose
- [ ] **Open/Closed**: Security extensible via plugins
- [ ] **Liskov Substitution**: Security interfaces consistent
- [ ] **Interface Segregation**: Role-specific security policies
- [ ] **Dependency Inversion**: Depend on security abstractions

### **DRY Compliance Checklist**
- [ ] **Security Utilities**: Centralized security functions
- [ ] **Validation**: Reusable validation schemas
- [ ] **Encryption**: Common encryption patterns
- [ ] **Audit Logging**: Unified logging system
- [ ] **Permission Checks**: Shared permission utilities

### **KISS Principle Checklist**
- [ ] **Clear Policies**: Security policies are understandable
- [ ] **Simple Encryption**: Straightforward encryption usage
- [ ] **Direct Checks**: Simple permission validation
- [ ] **Clear Logging**: Easy-to-understand audit logs

This comprehensive security framework ensures HIPAA compliance while maintaining usability for healthcare professionals.
