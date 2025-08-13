export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    flag: '🇮🇳',
    dir: 'ltr'
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    dir: 'ltr'
  }
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const LANGUAGE_COOKIE_NAME = 'ayurveda-language';
export const LANGUAGE_STORAGE_KEY = 'ayurveda-preferred-language';

// Language detection priority
export const LANGUAGE_DETECTION_ORDER = [
  'cookie',
  'localStorage',
  'navigator',
  'default'
] as const;

// Common translation keys structure
export interface TranslationKeys {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    edit: string;
    delete: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    search: string;
    filter: string;
    clear: string;
    selectLanguage: string;
    phoneNumber: string;
    email: string;
    address: string;
    name: string;
    message: string;
    contactUs: string;
    bookAppointment: string;
    learnMore: string;
    readMore: string;
    viewAll: string;
    getDirections: string;
    callNow: string;
    whatsappMessage: string;
  };
  navigation: {
    home: string;
    about: string;
    services: string;
    treatments: string;
    contact: string;
    gallery: string;
    testimonials: string;
    blog: string;
    appointment: string;
    panchakarma: string;
    agnikarma: string;
    viddhakarma: string;
    ourTeam: string;
    liveChat: string;
    bookConsultation: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  };
  doctor: {
    name: string;
    title: string;
    specialization: string;
    experience: string;
    education: string;
    expertise: string;
    about: string;
  };
  clinic: {
    name: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    timings: string;
    mondayToFriday: string;
    weekends: string;
    closed: string;
    emergency: string;
  };
  services: {
    title: string;
    subtitle: string;
    panchakarma: string;
    viddhakarma: string;
    agnikarma: string;
    neurological: string;
    jointBone: string;
    respiratory: string;
    digestive: string;
    kidneyStones: string;
    skinDiseases: string;
    metabolic: string;
    gynecological: string;
    hairProblems: string;
    beautyAntiAging: string;
    wellnessRetreats: string;
    // Service descriptions
    neurologicalDesc: string;
    jointBoneDesc: string;
    respiratoryDesc: string;
    digestiveDesc: string;
    kidneyStonesDesc: string;
    skinDiseasesDesc: string;
    metabolicDesc: string;
    gynecologicalDesc: string;
    hairProblemsDesc: string;
    beautyAntiAgingDesc: string;
    wellnessRetreatsDesc: string;
  };

  // Landing Page Content
  landing: {
    // Header/Navigation
    brandName: string;
    welcome: string;
    loginButton: string;
    getStartedButton: string;
    goToDashboard: string;

    // Hero Section
    heroTitle: string;
    heroPriority: string;
    heroDescription: string;

    // Stats Section
    activeDoctors: string;
    happyPatients: string;
    specialties: string;
    userRating: string;

    // Features Section
    featuresTitle: string;
    featuresSubtitle: string;
    featuresDescription: string;

    // Feature Items
    onlineAppointments: string;
    onlineAppointmentsDesc: string;
    medicalRecords: string;
    medicalRecordsDesc: string;
    secureMessaging: string;
    secureMessagingDesc: string;
    prescriptionManagement: string;
    prescriptionManagementDesc: string;
    labResults: string;
    labResultsDesc: string;
    telemedicine: string;
    telemedicineDesc: string;

    // Testimonials Section
    testimonialsTitle: string;
    testimonialsSubtitle: string;

    // CTA Section
    ctaTitle: string;
    ctaDescription: string;

    // Footer
    companySection: string;
    servicesSection: string;
    legalSection: string;
    connectSection: string;
    about: string;
    careers: string;
    contact: string;
    appointments: string;
    telemedicineFooter: string;
    labTests: string;
    privacy: string;
    terms: string;
    security: string;
    twitter: string;
    facebook: string;
    linkedin: string;
    copyright: string;

    // Toast Messages
    loginRequired: string;
    invalidSession: string;
  };

  // Testimonials Data
  testimonials: {
    patient1Name: string;
    patient1Role: string;
    patient1Content: string;
    doctor1Name: string;
    doctor1Role: string;
    doctor1Content: string;
    manager1Name: string;
    manager1Role: string;
    manager1Content: string;
  };
  treatments: {
    [key: string]: {
      name: string;
      description: string;
      benefits: string[];
      duration: string;
      suitableFor: string[];
    };
  };
  contact: {
    title: string;
    subtitle: string;
    getInTouch: string;
    visitUs: string;
    callUs: string;
    messageUs: string;
    followUs: string;
    formTitle: string;
    formSubtitle: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    messageLabel: string;
    submitButton: string;
    successMessage: string;
    errorMessage: string;
  };
  footer: {
    about: string;
    quickLinks: string;
    services: string;
    contact: string;
    followUs: string;
    copyright: string;
    privacyPolicy: string;
    termsOfService: string;
    disclaimer: string;
  };
}
