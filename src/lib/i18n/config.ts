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
