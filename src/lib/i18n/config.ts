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
    noCharges: string;
    freeConsultation: string;
    theme: string;
    lightTheme: string;
    darkTheme: string;
    systemTheme: string;
  };
  navigation: {
    logo: string;
    clinicName: string;
    clinicSubtitle: string;
    livePatients: string;
    livesTransformed: string;
    rating: string;
    phoneNumber: string;
    language: string;
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
    title1: string;
    title2: string;
    subtitle: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    benefits: {
      yearsExperience: string;
      patientsHealed: string;
      governmentCertified: string;
    };
    trustIndicators: {
      governmentCertified: string;
      iso9001: string;
      rating: string;
      liveActivity: string;
      highDemand: string;
      peopleViewing: string;
      bookingsIncreased: string;
    };
    testimonials: string[];
    features: {
      title: string;
      description: string;
      watchJourneys: string;
      virtualTour: string;
      healthAssessment: string;
      todayOnly: string;
      ayurvedicWisdom: string;
      wisdomDescription: string;
    };
    schedule: string;
    emergency: string;
    imageAlt: string;
    floatingCards: {
      rating: string;
      patientsTreated: string;
    };
  };
  heroSection: {
    completeHealing: string;
    transformYourLife: string;
    authenticTreatments: string;
    yearsExperience: string;
    patientsHealed: string;
    governmentCertified: string;
    liveActivity: string;
    highDemand: string;
    peopleViewing: string;
    bookingsIncreased: string;
    bookFreeConsultation: string;
    callNow: string;
    watchHealingJourneys: string;
    virtualClinicTour: string;
    freeHealthAssessment: string;
    todayOnly: string;
  };
  stats: {
    livesTransformed: string;
    patientsSuccessfullyTreated: string;
    yearsLegacy: string;
    authenticAyurvedicPractice: string;
    patientRating: string;
    basedOnReviews: string;
    successRate: string;
    chronicConditions: string;
    recognizedExcellence: string;
    trustedCertified: string;
    currentlyTreating: string;
    bookingIncrease: string;
    featuredChannels: string;
    peopleViewing: string;
    certifications: {
      governmentCertified: {
        title: string;
        description: string;
      };
      iso9001: {
        title: string;
        description: string;
      };
      nabhAccredited: {
        title: string;
        description: string;
      };
      teachingHospital: {
        title: string;
        description: string;
      };
    };
  };
  whyChooseUs: {
    title: string;
    subtitle: string;
    description: string;
    stats: {
      livesTransformed: string;
      yearsLegacy: string;
      successRate: string;
      patientRating: string;
    };
    features: {
      governmentCertified: {
        title: string;
        description: string;
      };
      authenticAyurveda: {
        title: string;
        description: string;
      };
      personalizedCare: {
        title: string;
        description: string;
      };
      naturalTreatment: {
        title: string;
        description: string;
      };
      provenResults: {
        title: string;
        description: string;
      };
      expertTeam: {
        title: string;
        description: string;
      };
    };
    verifiedExcellence: string;
    cta: {
      title: string;
      subtitle: string;
      description: string;
      button: string;
    };
  };
  homepage: {
    specializations: {
      title: string;
      subtitle: string;
      panchakarma: {
        title: string;
        description: string;
      };
      agnikarma: {
        title: string;
        description: string;
      };
      viddhakarma: {
        title: string;
        description: string;
      };
    };
  };
  trustBuilding: {
    title: string;
    subtitle: string;
    description: string;
    faqs: {
      title: string;
      question1: string;
      question2: string;
      question3: string;
      question4: string;
      question5: string;
    };
    guarantees: {
      title: string;
      subtitle: string;
      description: string;
      conditions: {
        chronicPain: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        neurological: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        stress: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        digestive: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        sleep: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        energy: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        immunity: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        wellness: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
      };
      instantResults: {
        title: string;
        description: string;
        features: string[];
      };
    };
    certifications: {
      title: string;
      subtitle: string;
      description: string;
      items: {
        governmentCertified: {
          title: string;
          description: string;
        };
        isoAccredited: {
          title: string;
          description: string;
        };
        excellenceAward: {
          title: string;
          description: string;
        };
        safetyCertified: {
          title: string;
          description: string;
        };
      };
      stats: {
        treatments: string;
        satisfaction: string;
        publications: string;
        support: string;
      };
    };
    trust: {
      title: string;
      faq: {
        title: string;
        subtitle: string;
        questions: {
          different: string;
          results: string;
          safe: string;
          guarantees: string;
          certifications: string;
        };
        answers: {
          different: string;
          results: string;
          safe: string;
          guarantees: string;
          certifications: string;
        };
      };
      guarantees: {
        title: string;
        subtitle: string;
        description: string;
        table: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        conditions: {
          chronicPain: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          neurological: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          stress: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          digestive: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          sleep: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          energy: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          immunity: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
          wellness: {
            condition: string;
            guarantee: string;
            timeframe: string;
            measurement: string;
            successRate: string;
          };
        };
      };
      instantResults: {
        title: string;
        description: string;
        features: string[];
      };
    };
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
  header: {
    clinicName: string;
    clinicTagline: string;
    bookAppointment: string;
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
    description: string;
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

  testimonials: {
    title: string;
    subtitle: string;
    description: string;
    viewVideo: string;
    nextTestimonial: string;
    previousTestimonial: string;
    age: string;
    conditionTreated: string;
    treatmentReceived: string;
    resultAchieved: string;
    watchVideo: string;
    verifiedPatient: string;
    stats: {
      patientReviews: string;
      averageRating: string;
      successRate: string;
      verifiedStories: string;
    };
    cta: {
      title: string;
      bookConsultation: string;
      viewStories: string;
    };
    patients: {
      rekha: {
        name: string;
        location: string;
        condition: string;
        treatment: string;
        quote: string;
        result: string;
      };
      suresh: {
        name: string;
        location: string;
        condition: string;
        treatment: string;
        quote: string;
        result: string;
      };
      priya: {
        name: string;
        location: string;
        condition: string;
        treatment: string;
        quote: string;
        result: string;
      };
      rajesh: {
        name: string;
        location: string;
        condition: string;
        treatment: string;
        quote: string;
        result: string;
      };
      sunita: {
        name: string;
        location: string;
        condition: string;
        treatment: string;
        quote: string;
        result: string;
      };
    };
  };
  treatments: {
    title: string;
    subtitle: string;
    description: string;
    panchakarma: {
      name: string;
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
      features: string[];
      conditions: string[];
      duration: string;
      successRate: string;
      suitableFor: string[];
    };
    viddhakarma: {
      name: string;
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
      features: string[];
      conditions: string[];
      duration: string;
      successRate: string;
      suitableFor: string[];
    };
    agnikarma: {
      name: string;
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
      features: string[];
      conditions: string[];
      duration: string;
      successRate: string;
      suitableFor: string[];
    };
    labels: {
      treats: string;
      more: string;
      successRate: string;
      duration: string;
      learnMore: string;
      bookConsultation: string;
      keyBenefits: string;
    };
    cta: {
      title: string;
      subtitle: string;
      assessmentButton: string;
      expertButton: string;
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
    logo: string;
    clinicName: string;
    tagline: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    ourServices: string;
    medicalDisclaimer: string;
    quickLinks: {
      title: string;
      home: string;
      about: string;
      treatments: string;
      contact: string;
    };
    services: {
      title: string;
      panchakarma: string;
      agnikarma: string;
      viddhakarma: string;
      fertility: string;
    };
    conditions: {
      title: string;
      chronicPain: string;
      diabetes: string;
      arthritis: string;
      stress: string;
      digestive: string;
      skin: string;
    };
    contact: {
      title: string;
      address: string;
      phone: string;
      emergency: string;
      email: string;
      hours: string;
    };
    emergency: {
      title: string;
      button: string;
    };
    copyright: string;
    privacy: string;
    privacyPolicy: string;
    terms: string;
    termsOfService: string;
    disclaimer: string;
    sitemap: string;
    footerServices: {
      panchakarma: string;
      viddhakarma: string;
      agnikarma: string;
      neurological: string;
      jointBone: string;
    };
  };
  healthAssessment: {
    main: {
      title: string;
      subtitle: string;
      step: string;
      of: string;
      complete: string;
      minutesRemaining: string;
      getResults: string;
      nextQuestion: string;
      interactiveAssessment: string;
    };
    questions: {
      physical: {
        title: string;
        question: string;
        options: {
          headNeck: string;
          shoulders: string;
          back: string;
          joints: string;
          digestive: string;
          noIssues: string;
        };
      };
      energy: {
        title: string;
        question: string;
        options: {
          morning: string;
          afternoon: string;
          evening: string;
          night: string;
          variesDaily: string;
        };
      };
      digestion: {
        title: string;
        question: string;
        options: {
          strongRegular: string;
          variable: string;
          weak: string;
          irregular: string;
          problematic: string;
        };
      };
      mental: {
        title: string;
        question: string;
        options: {
          veryLow: string;
          low: string;
          moderate: string;
          high: string;
          veryHigh: string;
        };
      };
      goals: {
        title: string;
        question: string;
        options: {
          painRelief: string;
          detoxification: string;
          weightManagement: string;
          stressRelief: string;
          overallWellness: string;
        };
      };
    };
    results: {
      title: string;
      subtitle: string;
      assessmentComplete: string;
      cardTitle: string;
      primaryDosha: string;
      currentImbalance: string;
      recommendedTreatment: string;
      supportingTherapies: string;
      expectedTimeline: string;
      timelineText: string;
      successProbability: string;
      basedOnCases: string;
      bookConsultation: string;
      downloadReport: string;
      imbalance: string;
      treatment: string;
      timeline: string;
    };
    trustIndicators: {
      usedByPatients: string;
      scientificallyValidated: string;
      accuracyRate: string;
    };
  };
  comprehensiveCTA: {
    engagementLevels: {
      urgent: {
        title: string;
        subtitle: string;
        description: string;
        features: {
          helpline: string;
          consultation: string;
          video: string;
          whatsapp: string;
        };
      };
      moderate: {
        title: string;
        subtitle: string;
        description: string;
        features: {
          consultation: string;
          assessment: string;
          planning: string;
          followup: string;
        };
      };
      preventive: {
        title: string;
        subtitle: string;
        description: string;
        features: {
          consultation: string;
          guidance: string;
          checkups: string;
          resources: string;
        };
      };
    };
    contactChannels: {
      title: string;
      subtitle: string;
      description: string;
      channels: {
        whatsapp: {
          title: string;
          number: string;
          description: string;
          button: string;
        };
        helpline: {
          title: string;
          number: string;
          description: string;
          button: string;
        };
        emergency: {
          title: string;
          number: string;
          description: string;
          button: string;
        };
        video: {
          title: string;
          action: string;
          description: string;
          button: string;
        };
      };
      responseTimes: {
        phone: string;
        chat: string;
        email: string;
        callback: string;
        confirmation: string;
      };
    };
    guarantees: {
      title: string;
      subtitle: string;
      description: string;
      features: string[];
    };
    strategy: {
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
    };
    transformLife: {
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
    };
    imagineLife: {
      title: string;
      subtitle: string;
      description: string;
      benefits: string[];
    };
    benefits: {
      satisfaction: string;
      expertCare: string;
      safety: string;
      partnership: string;
      results: string;
    };
    finalMessage: {
      title: string;
      subtitle: string;
      button: string;
    };
    startJourney: {
      title: string;
      subtitle: string;
      button: string;
    };
    freeConsultation: {
      title: string;
      subtitle: string;
      button: string;
    };
    joinThousands: {
      title: string;
      subtitle: string;
      button: string;
    };
    newsletter: {
      title: string;
      subtitle: string;
      description: string;
      placeholder: string;
      button: string;
      privacy: string;
    };
  };
  doshas: {
    vata: {
      name: string;
      element: string;
      qualities: string;
    };
    pitta: {
      name: string;
      element: string;
      qualities: string;
    };
    kapha: {
      name: string;
      element: string;
      qualities: string;
    };
    level: string;
    dominant: string;
    constitutionAnalysis: string;
    dominantConstitution: string;
    balancedConstitution: string;
  };
  prakritiVikriti: {
    title: string;
    assessmentDate: string;
    constitutionAnalysis: string;
    balanceOverview: string;
    prakriti: string;
    vikriti: string;
    prakritNatural: string;
    vikritiCurrent: string;
    prakritDescription: string;
    vikritiDescription: string;
    keyObservations: string;
    elevated: string;
    reduced: string;
    by: string;
    recommendations: string;
    balanced: string;
    mildImbalance: string;
    significantImbalance: string;
  };
  mediaShowcase: {
    title: string;
    subtitle: string;
    description: string;
    youtube: {
      title: string;
      viewChannel: string;
      videos: {
        viddhakarmaAutism: {
          title: string;
          description: string;
        };
        viddhakarmaCP: {
          title: string;
          description: string;
        };
        panchakarmaDemo: {
          title: string;
          description: string;
        };
        agnikarmaTreatment: {
          title: string;
          description: string;
        };
      };
    };
    instagram: {
      title: string;
      followUs: string;
      altText: string;
      posts: {
        post1: string;
        post2: string;
        post3: string;
        post4: string;
      };
    };
    cta: {
      title: string;
      description: string;
      followJourney: string;
    };
  };
  therapyBadge: {
    agnikarma: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    viddhakarma: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    panchakarma: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    shirodhara: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    consultation: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    nadiPariksha: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    abhyanga: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    swedana: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    virechana: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
    basti: {
      name: string;
      description: string;
      duration: string;
      category: string;
    };
  };
  trust: {
    title: string;
    faq: {
      title: string;
      subtitle: string;
      questions: {
        different: string;
        results: string;
        safe: string;
        guarantees: string;
        certifications: string;
      };
      answers: {
        different: string;
        results: string;
        safe: string;
        guarantees: string;
        certifications: string;
      };
    };
    guarantees: {
      title: string;
      subtitle: string;
      description: string;
      table: {
        condition: string;
        guarantee: string;
        timeframe: string;
        measurement: string;
        successRate: string;
      };
      conditions: {
        chronicPain: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        neurological: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        stress: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        digestive: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        sleep: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        energy: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        immunity: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
        wellness: {
          condition: string;
          guarantee: string;
          timeframe: string;
          measurement: string;
          successRate: string;
        };
      };
    };
    instantResults: {
      title: string;
      description: string;
      features: string[];
    };
    certifications: {
      title: string;
      subtitle: string;
      description: string;
      items: {
        governmentCertified: {
          title: string;
          description: string;
        };
        isoAccredited: {
          title: string;
          description: string;
        };
        excellenceAward: {
          title: string;
          description: string;
        };
        safetyCertified: {
          title: string;
          description: string;
        };
      };
      stats: {
        treatments: string;
        satisfaction: string;
        publications: string;
        support: string;
      };
    };
  };
}
