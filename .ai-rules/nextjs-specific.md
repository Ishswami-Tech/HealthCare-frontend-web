# Next.js 14 Specific Rules - Healthcare Frontend

## ⚡ **Next.js 14 App Router Standards**

### **Project Configuration**

#### **Next.js Configuration**
```typescript
// next.config.ts - Healthcare optimized configuration
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // App Router (default in Next.js 14)
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', process.env.NEXT_PUBLIC_DOMAIN],
      bodySizeLimit: '10mb' // For medical file uploads
    },
    optimizePackageImports: [
      '@/components/ui',
      'lucide-react',
      'date-fns'
    ]
  },

  // Image optimization for medical imaging
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_CDN_DOMAIN,
      'medical-storage.s3.amazonaws.com'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 3600 // 1 hour
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },

  // Redirects for legacy routes
  async redirects() {
    return [
      {
        source: '/patients/:id',
        destination: '/dashboard/patients/:id',
        permanent: true
      },
      {
        source: '/appointments/:id',
        destination: '/dashboard/appointments/:id',
        permanent: true
      }
    ];
  },

  // Webpack configuration for healthcare bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle for healthcare components
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks')
    };

    // Bundle analyzer for production
    if (!dev && !isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.BUILD_ID': JSON.stringify(buildId)
        })
      );
    }

    return config;
  }
};

export default nextConfig;
```

### **App Router Structure**

#### **Route Organization**
```
app/
├── (auth)/                     # Authentication route group
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-otp/page.tsx
│   └── layout.tsx              # Auth layout
├── (dashboard)/                # Protected dashboard routes
│   ├── doctor/
│   │   ├── appointments/page.tsx
│   │   ├── patients/page.tsx
│   │   ├── profile/page.tsx
│   │   └── dashboard/page.tsx
│   ├── patient/
│   │   ├── appointments/page.tsx
│   │   ├── medical-records/page.tsx
│   │   └── dashboard/page.tsx
│   ├── clinic-admin/
│   │   ├── staff/page.tsx
│   │   ├── settings/page.tsx
│   │   └── dashboard/page.tsx
│   └── layout.tsx              # Dashboard layout
├── (public)/                   # Public pages
│   ├── ayurveda/
│   │   ├── page.tsx
│   │   ├── treatments/page.tsx
│   │   └── about/page.tsx
│   └── layout.tsx              # Public layout
├── api/                        # API routes
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── refresh/route.ts
│   ├── patients/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── appointments/
│       ├── route.ts
│       └── [id]/route.ts
├── globals.css                 # Global styles
├── layout.tsx                  # Root layout
├── loading.tsx                 # Global loading UI
├── error.tsx                   # Global error boundary
├── not-found.tsx              # 404 page
└── page.tsx                   # Home page
```

### **Server Components vs Client Components**

#### **Server Component Patterns**
```typescript
// ✅ Server Component for data fetching
import { Suspense } from 'react';
import { getPatients } from '@/lib/actions/patients.server';
import { PatientList } from '@/components/patients/PatientList';
import { PatientListSkeleton } from '@/components/patients/PatientListSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface PatientsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
  };
}

// ✅ Server Component - fetches data on server
export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const status = searchParams.status;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        {/* Client component for interactivity */}
        <CreatePatientButton />
      </div>

      <ErrorBoundary>
        <Suspense fallback={<PatientListSkeleton />}>
          <PatientsData page={page} search={search} status={status} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// ✅ Separate server component for data fetching
async function PatientsData({ 
  page, 
  search, 
  status 
}: { 
  page: number; 
  search: string; 
  status?: string; 
}) {
  const patients = await getPatients({
    page,
    search,
    status,
    limit: 20
  });

  return <PatientList patients={patients} />;
}

// ✅ Add metadata for SEO
export const metadata = {
  title: 'Patients | Healthcare Dashboard',
  description: 'Manage and view patient records in your healthcare system',
};
```

#### **Client Component Patterns**
```typescript
// ✅ Client Component for interactivity
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreatePatientForm } from '@/components/patients/CreatePatientForm';
import { Plus } from 'lucide-react';

export function CreatePatientButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    // Refresh the server component data
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Patient
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <CreatePatientForm 
          onSuccess={handleSuccess}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### **Server Actions**

#### **Server Action Implementation**
```typescript
// ✅ Server Action with proper error handling and validation
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { authenticatedApi } from '@/lib/api';
import { validateClinicAccess } from '@/lib/auth/permissions';
import { auditLog } from '@/lib/audit';
import type { Patient, CreatePatientData } from '@/types/patient.types';

// ✅ Input validation schema
const createPatientSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  dateOfBirth: z.string().datetime(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.object({
    street: z.string().min(5).max(100),
    city: z.string().min(2).max(50),
    state: z.string().min(2).max(50),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/)
  }),
  emergencyContact: z.object({
    name: z.string().min(2).max(100),
    relationship: z.string().min(2).max(50),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/)
  }),
  medicalHistory: z.string().max(2000).optional(),
  insuranceInfo: z.object({
    provider: z.string().optional(),
    policyNumber: z.string().optional(),
    groupNumber: z.string().optional()
  }).optional()
});

export async function createPatient(
  formData: FormData | CreatePatientData
): Promise<{ success: boolean; patient?: Patient; error?: string }> {
  try {
    // ✅ Extract data from FormData or direct object
    const rawData = formData instanceof FormData 
      ? Object.fromEntries(formData.entries())
      : formData;

    // ✅ Validate input data
    const validatedData = createPatientSchema.parse(rawData);

    // ✅ Get session and validate authentication
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const userId = cookieStore.get('user_id')?.value;
    const clinicId = cookieStore.get('clinic_id')?.value;

    if (!sessionId || !userId || !clinicId) {
      return { success: false, error: 'Unauthorized: Please log in again' };
    }

    // ✅ Validate clinic access and permissions
    const hasAccess = await validateClinicAccess(userId, clinicId, 'patients.create');
    if (!hasAccess) {
      await auditLog({
        userId,
        clinicId,
        action: 'CREATE_PATIENT_DENIED',
        resource: 'PATIENT',
        resourceId: 'new',
        result: 'FAILURE',
        riskLevel: 'MEDIUM',
        ipAddress: await getClientIP(),
        userAgent: await getUserAgent(),
        sessionId
      });
      
      return { success: false, error: 'Access denied: Insufficient permissions' };
    }

    // ✅ Create patient via API
    const { data: patient, status } = await authenticatedApi<Patient>(
      '/api/patients',
      {
        method: 'POST',
        body: JSON.stringify({
          ...validatedData,
          clinicId
        })
      }
    );

    if (status !== 201) {
      return { success: false, error: 'Failed to create patient' };
    }

    // ✅ Audit log successful creation
    await auditLog({
      userId,
      clinicId,
      action: 'PATIENT_CREATED',
      resource: 'PATIENT',
      resourceId: patient.id,
      result: 'SUCCESS',
      riskLevel: 'LOW',
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
      sessionId,
      metadata: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientMRN: patient.medicalRecordNumber
      }
    });

    // ✅ Revalidate cache and redirect
    revalidatePath('/dashboard/patients');
    revalidateTag('patients');
    
    return { success: true, patient };
    
  } catch (error) {
    console.error('Failed to create patient:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: `Validation error: ${error.errors[0]?.message}` 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred while creating the patient' 
    };
  }
}

// ✅ Helper functions
async function getClientIP(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('x-forwarded-for') || 
         headersList.get('x-real-ip') || 
         'unknown';
}

async function getUserAgent(): Promise<string> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  return headersList.get('user-agent') || 'unknown';
}
```

#### **Form Integration with Server Actions**
```typescript
// ✅ Form component using server actions
'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPatient } from '@/lib/actions/patients.server';
import { createPatientSchema } from '@/lib/schema/patient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type CreatePatientFormData = z.infer<typeof createPatientSchema>;

export function CreatePatientForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  
  // ✅ Use server action with useActionState
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createPatient(formData);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `Patient ${result.patient?.firstName} ${result.patient?.lastName} created successfully`
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        });
      }
      
      return result;
    },
    { success: false }
  );

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
        zipCode: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      }
    }
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            name="firstName"
            {...form.register('firstName')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            name="lastName"
            {...form.register('lastName')}
            required
          />
        </div>
        
        {/* Additional form fields... */}
      </div>
      
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Creating Patient...' : 'Create Patient'}
      </Button>
    </form>
  );
}
```

### **Layout System**

#### **Root Layout**
```typescript
// ✅ Root layout with providers and metadata
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/app/providers/AppProvider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: {
    template: '%s | Healthcare Management System',
    default: 'Healthcare Management System'
  },
  description: 'Complete healthcare management solution for clinics and hospitals',
  keywords: ['healthcare', 'medical', 'clinic', 'hospital', 'patients', 'appointments'],
  authors: [{ name: 'Healthcare Team' }],
  creator: 'Healthcare Management System',
  publisher: 'Healthcare Team',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Healthcare Management System',
    description: 'Complete healthcare management solution for clinics and hospitals',
    siteName: 'Healthcare Management System',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Healthcare Management System',
    description: 'Complete healthcare management solution for clinics and hospitals',
  },
  robots: {
    index: false, // Healthcare apps should not be indexed
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom for healthcare precision
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### **Dashboard Layout**
```typescript
// ✅ Dashboard layout with authentication
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlobalSidebar } from '@/components/global/GlobalSidebar/GlobalSidebar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { validateSession } from '@/lib/auth/session';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    redirect('/auth/login');
  }

  // ✅ Validate session on server
  const isValid = await validateSession(sessionId);
  if (!isValid) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen flex">
      <Suspense fallback={<div className="w-64 bg-muted" />}>
        <GlobalSidebar />
      </Suspense>
      
      <main className="flex-1 overflow-hidden">
        <DashboardLayout>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </DashboardLayout>
      </main>
    </div>
  );
}
```

### **Data Fetching Patterns**

#### **Server-Side Data Fetching**
```typescript
// ✅ Server component with parallel data fetching
import { Suspense } from 'react';
import { getPatients } from '@/lib/actions/patients.server';
import { getAppointments } from '@/lib/actions/appointments.server';
import { getAnalytics } from '@/lib/actions/analytics.server';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentPatients } from '@/components/dashboard/RecentPatients';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';

export default async function DashboardPage() {
  // ✅ Parallel data fetching
  const [
    patientsData,
    appointmentsData,
    analyticsData
  ] = await Promise.all([
    getPatients({ limit: 5, recent: true }),
    getAppointments({ status: 'SCHEDULED', limit: 10 }),
    getAnalytics({ period: '30d' })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Section */}
      <DashboardStats analytics={analyticsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <Suspense fallback={<PatientsSkeleton />}>
          <RecentPatients patients={patientsData.patients} />
        </Suspense>

        {/* Upcoming Appointments */}
        <Suspense fallback={<AppointmentsSkeleton />}>
          <UpcomingAppointments appointments={appointmentsData.appointments} />
        </Suspense>
      </div>
    </div>
  );
}
```

#### **Cache Configuration**
```typescript
// ✅ Server action with cache configuration
import { unstable_cache } from 'next/cache';
import { cookies } from 'next/headers';

// ✅ Cached data fetching
export const getPatients = unstable_cache(
  async (clinicId: string, filters?: PatientFilters) => {
    // Fetch patients from API
    const response = await authenticatedApi<PatientsResponse>(
      `/api/patients?clinicId=${clinicId}&${new URLSearchParams(filters).toString()}`
    );
    
    return response.data;
  },
  ['patients'], // Cache key
  {
    revalidate: 300, // 5 minutes
    tags: ['patients'] // Tag for selective revalidation
  }
);

// ✅ Revalidate cache in mutations
export async function createPatient(data: CreatePatientData) {
  try {
    const patient = await api.createPatient(data);
    
    // Revalidate specific cache entries
    revalidateTag('patients');
    revalidatePath('/dashboard/patients');
    
    return { success: true, patient };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### **Error Handling**

#### **Error Pages**
```typescript
// ✅ Global error boundary
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to external service
    console.error('Application error:', error);
    
    // Send to error reporting service
    if (typeof window !== 'undefined') {
      // Client-side error reporting
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Something went wrong!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We're sorry, but something unexpected happened. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-muted p-4 rounded text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="mt-2">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </details>
          )}
          
          <Button onClick={reset} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Not Found Page**
```typescript
// ✅ Custom 404 page
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### **Loading UI**

#### **Loading Components**
```typescript
// ✅ Global loading page
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

#### **Skeleton Components**
```typescript
// ✅ Skeleton for patient list
export function PatientListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### **Middleware**

#### **Authentication Middleware**
```typescript
// ✅ Middleware for route protection
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth/session';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/api/patients',
  '/api/appointments',
  '/api/medical-records'
];

// Routes that redirect authenticated users
const authRoutes = [
  '/auth/login',
  '/auth/register'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get('session_id')?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth-related
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Validate session for protected routes
  if (isProtectedRoute) {
    if (!sessionId) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const isValidSession = await validateSession(sessionId);
    if (!isValidSession) {
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('session_id');
      response.cookies.delete('user_id');
      response.cookies.delete('clinic_id');
      return response;
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && sessionId) {
    const isValidSession = await validateSession(sessionId);
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

### **Performance Optimization**

#### **Dynamic Imports**
```typescript
// ✅ Dynamic imports for code splitting
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Heavy components loaded dynamically
const PatientChart = dynamic(
  () => import('@/components/patients/PatientChart'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false // Chart library doesn't support SSR
  }
);

const MedicalRecordViewer = dynamic(
  () => import('@/components/medical-records/MedicalRecordViewer'),
  {
    loading: () => <div className="h-96 bg-muted rounded animate-pulse" />,
  }
);

export function PatientDetails({ patient }: { patient: Patient }) {
  return (
    <div className="space-y-6">
      <PatientInfo patient={patient} />
      
      {/* Dynamically loaded heavy components */}
      <Suspense fallback={<ChartSkeleton />}>
        <PatientChart patientId={patient.id} />
      </Suspense>
      
      <Suspense fallback={<RecordsSkeleton />}>
        <MedicalRecordViewer patientId={patient.id} />
      </Suspense>
    </div>
  );
}
```

#### **Image Optimization**
```typescript
// ✅ Optimized image component
import Image from 'next/image';

export function PatientAvatar({ 
  patient, 
  size = 48 
}: { 
  patient: Patient; 
  size?: number; 
}) {
  return (
    <div className="relative">
      <Image
        src={patient.avatar || '/default-avatar.png'}
        alt={`${patient.firstName} ${patient.lastName}`}
        width={size}
        height={size}
        className="rounded-full object-cover"
        priority={size > 100} // Prioritize larger images
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
      
      {/* Online status indicator */}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
    </div>
  );
}
```

This comprehensive Next.js 14 guide ensures optimal performance, security, and maintainability for the healthcare frontend application.
