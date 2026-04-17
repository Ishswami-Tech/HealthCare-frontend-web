# User-Specific Rules - Healthcare Professionals
# Version: 2.1.0 | Next.js 16 + React 19 + TypeScript 5
# Enterprise-Grade Role-Based Healthcare Workflows

## 🎯 **Core Principles (SOLID, DRY, KISS)**

### **SOLID Principles in User Experience**
- **Single Responsibility**: Each role dashboard handles one user type
- **Open/Closed**: Extend workflows via composition, not modification
- **Liskov Substitution**: Consistent role interfaces
- **Interface Segregation**: Role-specific UI components
- **Dependency Inversion**: Depend on role abstractions, not hardcoded checks

### **DRY (Don't Repeat Yourself)**
- Shared UI components across roles
- Reusable workflow patterns
- Common accessibility features
- Unified internationalization
- Centralized role permissions

### **KISS (Keep It Simple, Stupid)**
- Clear role-specific workflows
- Straightforward navigation
- Direct user actions
- Simple permission checks

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

## 👥 **Role-Based Development Guidelines**

### **Healthcare Professional Workflows**

#### **Doctor-Specific Features**
```typescript
// ✅ Doctor dashboard requirements
interface DoctorDashboardRequirements {
  // Critical Information Display
  todaysSchedule: {
    upcomingAppointments: Appointment[];
    emergencyNotifications: EmergencyAlert[];
    patientWaitingList: Patient[];
    averageWaitTime: number;
  };
  
  // Quick Actions
  quickActions: {
    addDiagnosis: () => void;
    prescribeMedication: () => void;
    scheduleFollowUp: () => void;
    requestLabTests: () => void;
    emergencyConsultation: () => void;
  };
  
  // Performance Metrics
  metrics: {
    todaysPatients: number;
    avgConsultationTime: number;
    pendingReports: number;
    satisfactionScore: number;
  };
}

// ✅ Doctor workflow components
export function DoctorWorkflow() {
  return (
    <div className="space-y-6">
      {/* Emergency alerts at top */}
      <EmergencyAlerts />
      
      {/* Current patient panel */}
      <CurrentPatientPanel />
      
      {/* Quick action toolbar */}
      <QuickActionToolbar role="DOCTOR" />
      
      {/* Today's schedule */}
      <TodaysSchedule />
      
      {/* Patient queue with priority */}
      <PatientQueue showPriority showWaitTime />
    </div>
  );
}
```

#### **Patient-Specific Features**
```typescript
// ✅ Patient portal requirements
interface PatientPortalRequirements {
  // Essential Information
  healthSummary: {
    recentVisits: Appointment[];
    currentMedications: Medication[];
    upcomingAppointments: Appointment[];
    testResults: LabResult[];
    vitalSigns: VitalSigns;
  };
  
  // Self-Service Actions
  selfService: {
    bookAppointment: () => void;
    rescheduleAppointment: () => void;
    requestPrescriptionRefill: () => void;
    messageDoctor: () => void;
    downloadReports: () => void;
    payBills: () => void;
  };
  
  // Educational Content
  education: {
    healthTips: HealthTip[];
    medicationInstructions: MedicationGuide[];
    preventiveCare: PreventiveCareReminder[];
  };
}

// ✅ Patient-friendly UI patterns
export function PatientDashboard({ patient }: { patient: Patient }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Welcome section with next appointment */}
      <WelcomeSection patient={patient} />
      
      {/* Health summary cards */}
      <HealthSummaryCards patient={patient} />
      
      {/* Appointment management */}
      <AppointmentSection simplified />
      
      {/* Health records (read-only for patients) */}
      <HealthRecordsSection readonly />
      
      {/* Educational content */}
      <EducationalContent patient={patient} />
    </div>
  );
}
```

#### **Nurse-Specific Features**
```typescript
// ✅ Nurse workflow requirements
interface NurseWorkflowRequirements {
  // Patient Care Management
  patientCare: {
    vitalSigns: VitalSignEntry[];
    medicationAdministration: MedicationLog[];
    patientAssessment: Assessment[];
    careNotes: CareNote[];
  };
  
  // Workflow Actions
  nursingActions: {
    recordVitals: () => void;
    administerMedication: () => void;
    updateCareplan: () => void;
    patientEducation: () => void;
    assistWithProcedures: () => void;
  };
  
  // Communication
  communication: {
    nurseToNurse: Message[];
    nurseToDoctor: ConsultNote[];
    familyCommunication: FamilyUpdate[];
  };
}

// ✅ Nurse-optimized interface
export function NurseWorkstation() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Patient list with alerts */}
      <div className="lg:col-span-1">
        <PatientList 
          showVitalAlerts 
          showMedicationDue 
          priority="nursing"
        />
      </div>
      
      {/* Center: Active patient care */}
      <div className="lg:col-span-2">
        <ActivePatientCare />
        <VitalSignsEntry />
        <MedicationAdministration />
      </div>
    </div>
  );
}
```

#### **Receptionist-Specific Features**
```typescript
// ✅ Receptionist workflow requirements
interface ReceptionistWorkflowRequirements {
  // Front Desk Operations
  frontDesk: {
    patientCheckIn: PatientCheckIn[];
    appointmentScheduling: AppointmentSlot[];
    waitingRoomManagement: WaitingPatient[];
    phoneCallLog: PhoneCall[];
  };
  
  // Administrative Tasks
  administrative: {
    insuranceVerification: () => void;
    patientRegistration: () => void;
    appointmentReminders: () => void;
    billingInquiries: () => void;
    documentManagement: () => void;
  };
  
  // Communication Hub
  communication: {
    internalMessages: Message[];
    patientCommunication: PatientMessage[];
    providerUpdates: ProviderUpdate[];
  };
}

// ✅ Receptionist-optimized dashboard
export function ReceptionistDashboard() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Today's appointments */}
      <div className="xl:col-span-2">
        <TodaysAppointments allowCheckIn allowReschedule />
      </div>
      
      {/* Waiting room management */}
      <div className="xl:col-span-1">
        <WaitingRoomPanel />
      </div>
      
      {/* Quick actions and messages */}
      <div className="xl:col-span-1">
        <QuickActions role="RECEPTIONIST" />
        <MessageCenter />
      </div>
    </div>
  );
}
```

#### **Pharmacist-Specific Features**
```typescript
// ✅ Pharmacist workflow requirements
interface PharmacistWorkflowRequirements {
  // Prescription Management
  prescriptions: {
    newPrescriptions: Prescription[];
    pendingRefills: RefillRequest[];
    drugInteractions: DrugInteraction[];
    dosageVerification: DosageCheck[];
  };
  
  // Inventory Management
  inventory: {
    stockLevels: InventoryItem[];
    expirationAlerts: ExpirationAlert[];
    orderManagement: Order[];
    supplierCommunication: SupplierMessage[];
  };
  
  // Clinical Services
  clinicalServices: {
    medicationTherapyManagement: MTMSession[];
    vaccinationServices: Vaccination[];
    healthScreenings: HealthScreening[];
    patientCounseling: CounselingSession[];
  };
}

// ✅ Pharmacy management interface
export function PharmacyDashboard() {
  return (
    <div className="space-y-6">
      {/* Critical alerts */}
      <CriticalAlerts />
      
      {/* Prescription queue */}
      <PrescriptionQueue priority />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active prescriptions */}
        <div>
          <ActivePrescriptions />
          <DrugInteractionAlerts />
        </div>
        
        {/* Right: Inventory management */}
        <div>
          <InventoryStatus />
          <ExpirationAlerts />
        </div>
      </div>
    </div>
  );
}
```

### **User Experience Guidelines**

#### **Accessibility Requirements**
```typescript
// ✅ Healthcare accessibility standards
interface HealthcareAccessibilityStandards {
  // Visual Accessibility
  visual: {
    minContrastRatio: 4.5; // WCAG AA standard
    fontSize: {
      minimum: 16; // Never below 16px
      preferred: 18; // For healthcare readability
    };
    colorCoding: {
      requireTextLabels: true; // Never rely on color alone
      colorBlindFriendly: true; // Support deuteranopia/protanopia
    };
  };
  
  // Motor Accessibility
  motor: {
    clickTargetSize: {
      minimum: 44; // 44px minimum (WCAG 2.1)
      preferred: 48; // Better for healthcare environments
    };
    keyboardNavigation: {
      required: true;
      tabOrder: 'logical';
      skipLinks: true;
    };
  };
  
  // Cognitive Accessibility
  cognitive: {
    language: 'plain'; // Plain language for medical terms
    instructions: 'clear'; // Step-by-step guidance
    errorMessages: 'helpful'; // Specific, actionable errors
    timeouts: 'generous'; // Extended time limits
  };
}

// ✅ Accessible component patterns
export function AccessibleFormField({
  label,
  required,
  error,
  help,
  children
}: AccessibleFormFieldProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = help ? `${fieldId}-help` : undefined;
  
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={fieldId}
        className="text-base font-medium" // Larger, clearer labels
      >
        {label}
        {required && (
          <span 
            className="text-destructive ml-1"
            aria-label="required"
          >
            *
          </span>
        )}
      </Label>
      
      {React.cloneElement(children, {
        id: fieldId,
        'aria-describedby': [helpId, errorId].filter(Boolean).join(' '),
        'aria-invalid': !!error,
        className: `${children.props.className} min-h-[44px]` // Ensure minimum touch target
      })}
      
      {help && (
        <p 
          id={helpId}
          className="text-sm text-muted-foreground"
        >
          {help}
        </p>
      )}
      
      {error && (
        <p 
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
```

#### **Mobile-First Design**
```typescript
// ✅ Mobile healthcare patterns
interface MobileHealthcarePatterns {
  // Touch-Friendly Design
  touchTargets: {
    minimumSize: 44; // 44px minimum
    spacing: 8; // 8px between targets
    thumbZone: true; // Bottom 1/3 of screen
  };
  
  // Emergency Access
  emergencyFeatures: {
    quickDial: {
      emergency: '911';
      clinic: string;
      poison: '1-800-222-1222';
    };
    criticalInfo: {
      allergies: Allergy[];
      medications: Medication[];
      emergencyContacts: Contact[];
    };
  };
  
  // Offline Capability
  offline: {
    essentialData: 'cached';
    syncOnReconnect: true;
    offlineIndicator: true;
  };
}

// ✅ Mobile-optimized navigation
export function MobileNavigation({ role }: { role: UserRole }) {
  const isMobile = useMobile();
  
  if (!isMobile) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="grid grid-cols-5 gap-1 p-2">
        {getMobileNavItems(role).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-muted"
            style={{ minHeight: '48px' }} // Ensure touch target
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs mt-1 text-center">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

#### **Internationalization for Healthcare**
```typescript
// ✅ Healthcare i18n patterns
interface HealthcareI18nRequirements {
  // Medical Terminology
  medicalTerms: {
    standardized: true; // Use ICD-10, SNOMED CT
    translated: true; // Professional medical translations
    glossary: true; // Patient-friendly definitions
  };
  
  // Cultural Considerations
  cultural: {
    dateFormats: 'localized'; // MM/DD/YYYY vs DD/MM/YYYY
    numberFormats: 'localized'; // Decimal separators
    addressFormats: 'countrySpecific';
    nameFormats: 'culturallyAppropriate';
  };
  
  // Emergency Information
  emergency: {
    criticalPhrases: {
      'en': ['Help', 'Emergency', 'Pain', 'Allergic'],
      'es': ['Ayuda', 'Emergencia', 'Dolor', 'Alérgico'],
      'hi': ['मदद', 'आपातकाल', 'दर्द', 'एलर्जी']
    };
  };
}

// ✅ Medical translation component
export function MedicalTermTranslation({
  term,
  showDefinition = false,
  audioPronunciation = false
}: MedicalTermProps) {
  const { locale, t } = useTranslation();
  const [showGlossary, setShowGlossary] = useState(false);
  
  return (
    <span className="relative">
      <button
        onClick={() => setShowGlossary(!showGlossary)}
        className="text-primary underline decoration-dotted"
        aria-describedby={`${term}-definition`}
      >
        {t(`medical.${term}`)}
      </button>
      
      {showGlossary && (
        <div 
          id={`${term}-definition`}
          className="absolute z-10 bg-popover border rounded-md p-3 mt-1 w-64 shadow-lg"
          role="tooltip"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t(`medical.${term}.definition`)}
            </p>
            
            {audioPronunciation && (
              <button
                onClick={() => speakText(t(`medical.${term}`), locale)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                🔊 Pronunciation
              </button>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
```

### **Workflow-Specific Components**

#### **Appointment Management**
```typescript
// ✅ Role-specific appointment views
export function AppointmentManager({ userRole }: { userRole: UserRole }) {
  const viewConfig = getAppointmentViewConfig(userRole);
  
  return (
    <div className="space-y-6">
      {/* Different views based on role */}
      {userRole === 'DOCTOR' && (
        <DoctorAppointmentView 
          showPatientNotes
          showMedicalHistory
          allowDiagnosisEntry
        />
      )}
      
      {userRole === 'PATIENT' && (
        <PatientAppointmentView
          showUpcoming
          allowReschedule
          showPreparationInstructions
        />
      )}
      
      {userRole === 'RECEPTIONIST' && (
        <ReceptionistAppointmentView
          showAllProviders
          allowScheduling
          showWaitingRoom
        />
      )}
      
      {userRole === 'NURSE' && (
        <NurseAppointmentView
          showVitalSigns
          showPrep
          allowNotes
        />
      )}
    </div>
  );
}

// ✅ Appointment view configurations
function getAppointmentViewConfig(role: UserRole): AppointmentViewConfig {
  const configs = {
    DOCTOR: {
      showFields: ['patient', 'time', 'type', 'notes', 'history'],
      allowActions: ['reschedule', 'cancel', 'addNotes', 'prescribe'],
      defaultView: 'detailed',
      showDuration: true
    },
    PATIENT: {
      showFields: ['doctor', 'time', 'type', 'preparation'],
      allowActions: ['reschedule', 'cancel'],
      defaultView: 'simple',
      showDuration: false
    },
    RECEPTIONIST: {
      showFields: ['patient', 'doctor', 'time', 'type', 'status', 'insurance'],
      allowActions: ['schedule', 'reschedule', 'cancel', 'checkIn'],
      defaultView: 'calendar',
      showDuration: true
    },
    NURSE: {
      showFields: ['patient', 'doctor', 'time', 'type', 'vitals', 'prep'],
      allowActions: ['addVitals', 'updatePrep', 'addNotes'],
      defaultView: 'list',
      showDuration: true
    }
  };
  
  return configs[role];
}
```

#### **Medical Records Access**
```typescript
// ✅ Role-based medical records access
export function MedicalRecords({ patientId, userRole }: MedicalRecordsProps) {
  const { permissions } = usePermissions();
  const { data: records } = useMedicalRecords(patientId);
  
  // Filter records based on role and permissions
  const visibleRecords = useMemo(() => {
    return records?.filter(record => {
      switch (userRole) {
        case 'DOCTOR':
          return true; // Doctors can see all records
        
        case 'NURSE':
          return ['VITALS', 'MEDICATION', 'CARE_NOTES'].includes(record.type);
        
        case 'PATIENT':
          return record.patientVisible && !record.sensitive;
        
        case 'RECEPTIONIST':
          return ['INSURANCE', 'CONTACT', 'DEMOGRAPHICS'].includes(record.type);
        
        default:
          return false;
      }
    });
  }, [records, userRole]);
  
  return (
    <div className="space-y-4">
      {visibleRecords?.map(record => (
        <MedicalRecordItem 
          key={record.id}
          record={record}
          userRole={userRole}
          permissions={permissions}
        />
      ))}
    </div>
  );
}

// ✅ Record-level permissions
function MedicalRecordItem({ 
  record, 
  userRole, 
  permissions 
}: MedicalRecordItemProps) {
  const canEdit = useMemo(() => {
    return permissions.includes(`medical_records.update`) &&
           (userRole === 'DOCTOR' || 
            (userRole === 'NURSE' && record.type === 'NURSING_NOTES'));
  }, [permissions, userRole, record.type]);
  
  const canView = useMemo(() => {
    if (record.sensitive && userRole === 'PATIENT') return false;
    if (record.confidential && !['DOCTOR', 'NURSE'].includes(userRole)) return false;
    return true;
  }, [record, userRole]);
  
  if (!canView) return null;
  
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">{record.title}</h4>
            <p className="text-sm text-muted-foreground">
              {formatDate(record.createdAt)} • {record.provider}
            </p>
          </div>
          
          {canEdit && (
            <Button variant="outline" size="sm">
              Edit
            </Button>
          )}
        </div>
        
        <div className="prose prose-sm max-w-none">
          {record.content}
        </div>
        
        {record.attachments?.length > 0 && (
          <div className="border-t pt-3">
            <AttachmentList attachments={record.attachments} />
          </div>
        )}
      </div>
    </Card>
  );
}
```

#### **Emergency Protocols**
```typescript
// ✅ Emergency response patterns
interface EmergencyProtocol {
  triggers: EmergencyTrigger[];
  notifications: NotificationRule[];
  escalation: EscalationPath[];
  documentation: DocumentationRequirement[];
}

export function EmergencyResponseSystem() {
  const [activeEmergencies, setActiveEmergencies] = useState<Emergency[]>([]);
  const { user } = useAuth();
  
  // Monitor for emergency conditions
  useEffect(() => {
    const checkEmergencyConditions = () => {
      // Check vital sign alerts
      // Check medication alerts
      // Check system alerts
    };
    
    const interval = setInterval(checkEmergencyConditions, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {activeEmergencies.map(emergency => (
        <EmergencyAlert
          key={emergency.id}
          emergency={emergency}
          userRole={user.role}
          onAcknowledge={(id) => acknowledgeEmergency(id)}
          onEscalate={(id) => escalateEmergency(id)}
        />
      ))}
    </div>
  );
}

// ✅ Emergency alert component
function EmergencyAlert({ 
  emergency, 
  userRole, 
  onAcknowledge, 
  onEscalate 
}: EmergencyAlertProps) {
  const alertLevel = emergency.severity;
  const canRespond = getEmergencyResponseCapability(userRole, emergency.type);
  
  return (
    <Alert 
      className={cn(
        "border-l-4 animate-pulse",
        alertLevel === 'CRITICAL' && "border-red-500 bg-red-50",
        alertLevel === 'HIGH' && "border-orange-500 bg-orange-50",
        alertLevel === 'MEDIUM' && "border-yellow-500 bg-yellow-50"
      )}
    >
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        {emergency.type} - {alertLevel} PRIORITY
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div>
          <p className="font-medium">Patient: {emergency.patient.name}</p>
          <p className="text-sm">Location: {emergency.location}</p>
          <p className="text-sm">Time: {formatTime(emergency.timestamp)}</p>
        </div>
        
        <p className="text-base">{emergency.description}</p>
        
        {canRespond && (
          <div className="flex gap-2">
            <Button 
              variant="destructive"
              onClick={() => onAcknowledge(emergency.id)}
            >
              Acknowledge & Respond
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onEscalate(emergency.id)}
            >
              Escalate
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### **User Training & Onboarding**

#### **Role-Specific Onboarding**
```typescript
// ✅ Healthcare onboarding flows
interface OnboardingFlow {
  role: UserRole;
  steps: OnboardingStep[];
  requiredTraining: TrainingModule[];
  competencyChecks: CompetencyCheck[];
}

export function HealthcareOnboarding({ user }: { user: User }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  
  const onboardingFlow = getOnboardingFlow(user.role);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome to HealthCare System
          </h1>
          <p className="text-muted-foreground">
            Complete your {user.role.toLowerCase()} onboarding
          </p>
        </div>
        
        <OnboardingProgress 
          current={currentStep}
          total={onboardingFlow.steps.length}
        />
        
        <OnboardingStep
          step={onboardingFlow.steps[currentStep]}
          onComplete={() => setCurrentStep(prev => prev + 1)}
          userRole={user.role}
        />
      </div>
    </div>
  );
}

// ✅ Role-specific training modules
function getOnboardingFlow(role: UserRole): OnboardingFlow {
  const commonSteps = [
    {
      id: 'hipaa-training',
      title: 'HIPAA Compliance Training',
      description: 'Understanding patient privacy and data protection',
      required: true,
      estimatedTime: '30 minutes'
    },
    {
      id: 'system-basics',
      title: 'System Navigation',
      description: 'Learn the basic interface and navigation',
      required: true,
      estimatedTime: '15 minutes'
    }
  ];
  
  const roleSpecificSteps = {
    DOCTOR: [
      ...commonSteps,
      {
        id: 'clinical-workflow',
        title: 'Clinical Workflow',
        description: 'Patient care workflows and documentation',
        required: true,
        estimatedTime: '45 minutes'
      },
      {
        id: 'prescription-system',
        title: 'E-Prescribing',
        description: 'Electronic prescription management',
        required: true,
        estimatedTime: '20 minutes'
      }
    ],
    
    NURSE: [
      ...commonSteps,
      {
        id: 'nursing-workflow',
        title: 'Nursing Documentation',
        description: 'Care plans, medication administration, vital signs',
        required: true,
        estimatedTime: '40 minutes'
      }
    ],
    
    PATIENT: [
      {
        id: 'patient-portal',
        title: 'Patient Portal Guide',
        description: 'Managing your health information online',
        required: false,
        estimatedTime: '10 minutes'
      }
    ]
  };
  
  return {
    role,
    steps: roleSpecificSteps[role] || commonSteps,
    requiredTraining: getRequiredTraining(role),
    competencyChecks: getCompetencyChecks(role)
  };
}
```

### **Performance Metrics by Role**

#### **Healthcare Professional KPIs**
```typescript
// ✅ Role-specific performance dashboards
interface PerformanceMetrics {
  doctor: {
    patientsSeen: number;
    avgConsultationTime: number;
    diagnosisAccuracy: number;
    patientSatisfaction: number;
    prescriptionCompliance: number;
  };
  
  nurse: {
    patientsManaged: number;
    medicationAccuracy: number;
    vitalSignsCompliance: number;
    careplanAdherence: number;
    patientEducationHours: number;
  };
  
  receptionist: {
    appointmentsScheduled: number;
    checkInEfficiency: number;
    phoneResponseTime: number;
    insuranceVerificationAccuracy: number;
    patientSatisfactionScore: number;
  };
  
  pharmacist: {
    prescriptionsDispensed: number;
    drugInteractionsCaught: number;
    inventoryAccuracy: number;
    patientCounselingHours: number;
    costSavingsAchieved: number;
  };
}

// ✅ Performance dashboard component
export function PerformanceDashboard({ userRole }: { userRole: UserRole }) {
  const { data: metrics } = usePerformanceMetrics(userRole);
  
  const kpis = getRoleKPIs(userRole);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <p className="text-muted-foreground">
          Your {userRole.toLowerCase()} performance metrics
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <MetricCard
            key={kpi.key}
            title={kpi.title}
            value={metrics?.[kpi.key]}
            target={kpi.target}
            format={kpi.format}
            trend={kpi.trend}
          />
        ))}
      </div>
      
      <PerformanceCharts userRole={userRole} metrics={metrics} />
    </div>
  );
}
```

## 📋 **Enterprise User Experience Checklist**

### **Before Implementing User Features**
- [ ] **SOLID Principles**: Role dashboards follow Single Responsibility
- [ ] **DRY Compliance**: Shared UI components reused across roles
- [ ] **KISS Principle**: Workflows are clear and straightforward
- [ ] **Role-Based Design**: Each role has optimized workflows
- [ ] **Accessibility**: WCAG 2.1 AA compliance for all roles
- [ ] **Mobile-First**: Responsive design for all devices
- [ ] **Internationalization**: Multi-language support implemented
- [ ] **Performance**: Role-specific performance optimizations
- [ ] **Emergency Protocols**: Critical workflows properly designed
- [ ] **User Testing**: Role-specific user acceptance testing

### **User Experience Review Items**
- [ ] **Role Dashboards**: Optimized for each healthcare role
- [ ] **Workflows**: Efficient, role-specific workflows
- [ ] **Permissions**: Proper RBAC implementation
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Mobile Design**: Responsive and touch-friendly
- [ ] **Internationalization**: All text properly translated
- [ ] **Performance**: Role-specific metrics tracked
- [ ] **Emergency Access**: Critical features accessible
- [ ] **User Feedback**: Feedback mechanisms in place
- [ ] **Training**: Role-specific onboarding materials

### **SOLID Principles Checklist**
- [ ] **Single Responsibility**: Each role dashboard handles one user type
- [ ] **Open/Closed**: Workflows extensible via composition
- [ ] **Liskov Substitution**: Consistent role interfaces
- [ ] **Interface Segregation**: Role-specific UI components
- [ ] **Dependency Inversion**: Depend on role abstractions

### **DRY Compliance Checklist**
- [ ] **Shared Components**: Common UI reused across roles
- [ ] **Workflow Patterns**: Reusable workflow components
- [ ] **Accessibility**: Common a11y features centralized
- [ ] **Internationalization**: Unified i18n system
- [ ] **Permissions**: Centralized role permission checks

### **KISS Principle Checklist**
- [ ] **Clear Workflows**: Role-specific workflows are understandable
- [ ] **Simple Navigation**: Straightforward navigation patterns
- [ ] **Direct Actions**: Simple, direct user actions
- [ ] **Clear Permissions**: Easy-to-understand permission checks

This comprehensive user-specific guide ensures that each healthcare professional has optimized workflows, appropriate access levels, and role-specific features that enhance their effectiveness and patient care quality.
