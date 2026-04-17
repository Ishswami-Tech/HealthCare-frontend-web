# Healthcare Frontend AI Rules Index
# Version: 2.1.0 | Next.js 16 + React 19 + TypeScript 5
# Enterprise-Grade Healthcare Frontend Development Standards

## 📚 **Complete Guide Overview**

This comprehensive AI rules system provides detailed guidelines for developing a robust, secure, and HIPAA-compliant healthcare frontend application using **Next.js 16**, **React 19**, **TypeScript 5**, and modern React patterns following **SOLID**, **DRY**, and **KISS** principles.

### 🗂️ **Rules Structure**

```
.ai-rules/
├── index.md                # This overview and quick reference
├── architecture.md         # Multi-tenant RBAC healthcare architecture
├── security.md            # HIPAA compliance and security standards
├── coding-standards.md     # TypeScript, React, and healthcare coding patterns
├── nextjs-specific.md      # Next.js 14 App Router healthcare optimizations
└── user-rules.md          # Role-based healthcare professional workflows
```

---

## 🏥 **Healthcare Application Context**

### **Application Type**
- Multi-tenant healthcare management system
- HIPAA-compliant patient data handling
- Role-based access control (RBAC)
- Real-time clinical workflows
- Ayurveda and traditional medicine focus

### **Technology Stack**
- **Framework**: Next.js 16.1.1 with App Router + Turbopack
- **React**: 19.2.x with Server Components
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI
- **State Management**: TanStack Query v5.90+ | Zustand v5.0.9 with immer
- **Forms**: React Hook Form v7.70 + Zod v4.3.5
- **Internationalization**: next-intl v4.7 (English, Hindi, Marathi)
- **Real-time**: Socket.IO v4.8.3 + Firebase v12.7
- **Video**: OpenVidu Browser v2.32.1
- **Toast**: Sonner v2.0.7
- **Animations**: Framer Motion v12.24
- **Database**: Encrypted multi-tenant architecture

### **User Roles**
- **Super Admin**: System-wide management
- **Clinic Admin**: Clinic-level administration
- **Doctor**: Patient care and medical records
- **Nurse**: Patient care support and vital signs
- **Receptionist**: Appointment and patient check-in
- **Pharmacist**: Medication and inventory management
- **Patient**: Self-service portal access

---

## 🚀 **Quick Start Guide**

### **Essential Patterns**

#### **1. Component Creation**
```typescript
// ✅ Standard healthcare component pattern
'use client'; // Only when client interactivity needed

import { useState, useCallback } from 'react';
import { useCurrentClinicId } from '@/hooks/useClinic';
import { usePermissions } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/types/patient.types';

interface PatientCardProps {
  patient: Patient;
  onEdit?: (patient: Patient) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export function PatientCard({ patient, onEdit, variant = 'default' }: PatientCardProps) {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = usePermissions();
  
  // Permission check
  if (!hasPermission('patients.read')) {
    return <AccessDenied />;
  }
  
  // Component logic...
}
```

#### **2. Server Action Pattern**
```typescript
// ✅ HIPAA-compliant server action
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auditLog } from '@/lib/audit';
import { validateClinicAccess } from '@/lib/auth/permissions';

const patientSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  // Additional validation...
});

export async function createPatient(formData: FormData) {
  // 1. Validate input
  const data = patientSchema.parse(Object.fromEntries(formData));
  
  // 2. Authenticate & authorize
  const { userId, clinicId } = await getSession();
  await validateClinicAccess(userId, clinicId, 'patients.create');
  
  // 3. Create patient
  const patient = await createPatientInDatabase(data);
  
  // 4. Audit log
  await auditLog({
    userId,
    clinicId,
    action: 'PATIENT_CREATED',
    resourceId: patient.id,
    result: 'SUCCESS'
  });
  
  // 5. Revalidate cache
  revalidatePath('/dashboard/patients');
  
  return { success: true, patient };
}
```

#### **3. Permission-Based Hook**
```typescript
// ✅ RBAC-aware custom hook
export function usePatientManagement() {
  const clinicId = useCurrentClinicId();
  const { hasPermission } = usePermissions();
  
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', clinicId],
    queryFn: () => getPatients(clinicId),
    enabled: !!clinicId && hasPermission('patients.read')
  });
  
  const createPatient = useMutation({
    mutationFn: createPatientAction,
    onSuccess: () => {
      queryClient.invalidateQueries(['patients', clinicId]);
    }
  });
  
  return {
    patients,
    isLoading,
    createPatient: hasPermission('patients.create') ? createPatient.mutate : undefined,
    canCreate: hasPermission('patients.create')
  };
}
```

---

## 📖 **Detailed Rule Categories**

### **🏗️ [Architecture](./architecture.md)**
**Multi-tenant healthcare system design**
- Clinic-centric data isolation
- RBAC permission system
- Server-client component patterns
- State management architecture
- API design patterns
- Healthcare workflow integration

**Key Concepts:**
- Clinic context in all operations
- Permission-based component rendering
- Audit trail implementation
- Multi-language support architecture

### **🔐 [Security](./security.md)**
**HIPAA-compliant security implementation**
- Patient data encryption (at-rest and in-transit)
- Multi-factor authentication by role
- Session management and validation
- Audit logging and monitoring
- Rate limiting and abuse prevention
- File upload security for medical documents

**Key Concepts:**
- Zero-trust security model
- PHI (Protected Health Information) handling
- Emergency access protocols
- Security incident response

### **💻 [Coding Standards](./coding-standards.md)**
**TypeScript and React best practices**
- Strict TypeScript configuration
- Component architecture patterns
- Custom hook implementation
- Form handling with validation (`useZodForm` hook)
- Input component with CVA variants (medical, floating, mobile)
- Error boundary patterns
- Testing strategies for healthcare
- Healthcare-specific logger methods
- APP_CONFIG central configuration
- Query keys factory pattern

**Key Concepts:**
- Type safety for medical data
- Comprehensive error handling
- Accessibility for healthcare users
- Performance optimization patterns
- Centralized configuration management
- Consistent query cache key management

### **⚡ [Next.js Specific](./nextjs-specific.md)**
**Next.js 14 App Router optimization**
- Server vs Client component patterns
- Server actions for healthcare data
- Caching strategies for medical records
- Image optimization for medical imaging
- Performance monitoring
- SEO and metadata for healthcare

**Key Concepts:**
- Healthcare-optimized configurations
- Medical file upload handling
- Real-time data with Server-Sent Events
- Offline capability for critical features

### **👥 [User Rules](./user-rules.md)**
**Role-specific healthcare workflows**
- Doctor dashboard and clinical workflows
- Patient portal self-service features
- Nurse care management interfaces
- Receptionist appointment scheduling
- Pharmacist inventory and prescription management
- Accessibility and mobile-first design

**Key Concepts:**
- Role-based UI customization
- Emergency response protocols
- Healthcare professional onboarding
- Performance metrics by role

---

## 🎯 **Critical Healthcare Requirements**

### **HIPAA Compliance Checklist**
- [x] **Administrative Safeguards**: Security officer, workforce training, access management
- [x] **Physical Safeguards**: Facility access controls, workstation use, device controls
- [x] **Technical Safeguards**: Access control, audit controls, integrity, transmission security

### **Medical Data Security**
- [x] **Encryption**: AES-256-GCM for data at rest, TLS 1.3 for data in transit
- [x] **Access Controls**: Role-based permissions with principle of least privilege
- [x] **Audit Trails**: Complete logging of all PHI access and modifications
- [x] **Data Retention**: Compliant retention periods with secure deletion

### **Clinical Workflow Requirements**
- [x] **Emergency Protocols**: Rapid response for critical patient conditions
- [x] **Medication Safety**: Drug interaction checking and allergy alerts
- [x] **Care Continuity**: Seamless handoffs between healthcare providers
- [x] **Documentation**: Complete and accurate medical record keeping

---

## 🛠️ **Development Workflow**

### **Before Starting Development**
1. **Review Role Requirements**: Check user-rules.md for specific role needs
2. **Security Assessment**: Ensure security.md compliance for data handling
3. **Architecture Review**: Verify architecture.md patterns for multi-tenancy
4. **Coding Standards**: Follow coding-standards.md for implementation

### **During Development**
1. **Permission Checks**: Every component must validate user permissions
2. **Clinic Context**: All data operations must include clinic ID
3. **Audit Logging**: Log all significant user actions
4. **Error Handling**: Implement comprehensive error boundaries
5. **Testing**: Include security and permission testing

### **Before Deployment**
1. **Security Review**: Penetration testing and vulnerability assessment
2. **Performance Testing**: Load testing with healthcare data volumes
3. **Compliance Audit**: HIPAA compliance verification
4. **User Acceptance**: Healthcare professional workflow validation

---

## 📋 **Quick Reference Commands**

### **Required Technology Stack (MANDATORY)**
- **Framework**: Next.js 16.1.1 with App Router + Turbopack (NOT Pages Router)
- **React**: 19.2.x with Server Components
- **Language**: TypeScript 5.x (strict mode)
- **State Management**: TanStack Query v5.90+ | Zustand v5.0.9 with immer
- **Forms**: React Hook Form v7.70 + Zod v4.3.5
- **Components**: shadcn/ui + Radix UI + Tailwind CSS v4
- **Internationalization**: next-intl v4.7 (English, Hindi, Marathi)
- **Real-time**: Socket.IO v4.8.3 + Firebase v12.7
- **Video**: OpenVidu Browser v2.32.1
- **Toast**: Sonner v2.0.7
- **Animations**: Framer Motion v12.24

### **Import Order (MANDATORY)**
```typescript
// 1. React & Next.js (ALWAYS FIRST)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries (SECOND)  
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 3. Internal components & hooks (THIRD)
import { Button } from '@/components/ui/button';
import { useCurrentClinicId } from '@/hooks/useClinic';
import { usePermissions } from '@/hooks/useRBAC';

// 4. Types & schemas (LAST)
import type { Patient } from '@/types/patient.types';
```

### **Component Generation**
```bash
# Create new healthcare component
npx create-component PatientCard --type healthcare --role doctor
```

### **Permission Testing**
```typescript
// Test permission in component
const canAccess = hasPermission('patients.read');
if (!canAccess) return <AccessDenied />;
```

### **Clinic Context Usage**
```typescript
// Always include clinic context
const clinicId = useCurrentClinicId();
const { data } = useQuery(['patients', clinicId], () => getPatients(clinicId));
```

### **Audit Logging**
```typescript
// Log significant actions
await auditLog({
  userId,
  clinicId,
  action: 'PATIENT_VIEWED',
  resourceId: patient.id,
  result: 'SUCCESS',
  riskLevel: 'LOW'
});
```

---

## 🚨 **Common Anti-Patterns to Avoid**

### **❌ Security Anti-Patterns**
```typescript
// ❌ Don't skip permission checks
function PatientList() {
  const { data } = usePatients(); // Missing permission check
  return <div>{data?.map(...)}</div>;
}

// ❌ Don't expose sensitive data in client components
'use client';
const PatientSSN = ({ ssn }) => <span>{ssn}</span>; // Sensitive data on client

// ❌ Don't forget audit logging
async function deletePatient(id) {
  await api.delete(`/patients/${id}`); // Missing audit log
}
```

### **❌ Architecture Anti-Patterns**
```typescript
// ❌ Don't bypass clinic context
const allPatients = await getPatients(); // Missing clinic scoping

// ❌ Don't use hard-coded role checks
if (user.role === 'DOCTOR') { // Use permission system instead
  return <AdminPanel />;
}

// ❌ Don't skip error boundaries
function App() {
  return <PatientManagement />; // Missing error boundary
}
```

---

## 🔧 **Troubleshooting Guide**

### **Permission Issues**
- Check user role assignments in database
- Verify clinic association for user
- Confirm permission cache is not stale
- Review RBAC configuration

### **Performance Issues**
- Check query optimization with clinic scoping
- Verify TanStack Query cache configuration
- Review image optimization for medical files
- Monitor bundle size for role-specific code

### **Security Issues**
- Audit log review for suspicious activity
- Session validation and timeout configuration
- Rate limiting configuration review
- File upload security validation

---

## 📞 **Support and Resources**

### **Documentation Links**
- [Architecture Details](./architecture.md) - Complete system design
- [Security Implementation](./security.md) - HIPAA compliance guide
- [Coding Standards](./coding-standards.md) - Implementation patterns
- [Next.js Optimization](./nextjs-specific.md) - Framework-specific rules
- [User Workflows](./user-rules.md) - Role-based requirements

### **External Resources**
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [React Security Best Practices](https://reactjs.org/docs/security.html)
- [TanStack Query v5 Guide](https://tanstack.com/query/latest)
- [Zustand v5 Documentation](https://docs.pmnd.rs/zustand)
- [Zod v4 Documentation](https://zod.dev)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**🎯 Remember**: Every line of code in a healthcare application impacts patient safety and data security. Follow these rules diligently to ensure compliance, security, and optimal user experience for healthcare professionals and patients.
