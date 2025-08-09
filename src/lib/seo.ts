/**
 * SEO optimization utilities and configurations
 * Comprehensive SEO setup for maximum search visibility
 */

import { Metadata } from 'next';

// ============================================================================
// BASE SEO CONFIGURATION
// ============================================================================

export const baseSEO = {
  siteName: 'Shri Vishwamurthi Ayurvedalay',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://vishwamurthiayurveda.com',
  defaultTitle: 'Shri Vishwamurthi Ayurvedalay - Authentic Ayurvedic Healing & Wellness Center',
  defaultDescription: 'Experience authentic Ayurvedic healing with 20+ years of expertise. Panchakarma, Agnikarma, Viddha Karma treatments. 5000+ lives transformed. Government certified. Book consultation today.',
  keywords: [
    'Ayurveda',
    'Ayurvedic treatment',
    'Panchakarma',
    'Agnikarma',
    'Viddha Karma',
    'Ayurvedic doctor',
    'Ayurvedic hospital',
    'natural healing',
    'holistic medicine',
    'traditional medicine',
    'chronic pain relief',
    'detoxification',
    'wellness center',
    'Mumbai Ayurveda',
    'best Ayurvedic treatment',
  ],
  author: 'Dr. Vishwamurthi',
  language: 'en',
  region: 'IN',
  robots: 'index, follow',
} as const;

// ============================================================================
// METADATA GENERATION FUNCTIONS
// ============================================================================

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  canonical?: string;
}

export function generateMetadata({
  title,
  description = baseSEO.defaultDescription,
  keywords = [],
  image = '/images/og-default.jpg',
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = baseSEO.author,
  section,
  tags = [],
  noIndex = false,
  canonical,
}: SEOProps = {}): Metadata {
  const fullTitle = title 
    ? `${title} | ${baseSEO.siteName}`
    : baseSEO.defaultTitle;
  
  const fullUrl = url 
    ? `${baseSEO.siteUrl}${url}`
    : baseSEO.siteUrl;
  
  const imageUrl = image.startsWith('http') 
    ? image 
    : `${baseSEO.siteUrl}${image}`;

  const allKeywords = [...baseSEO.keywords, ...keywords, ...tags].join(', ');

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: author }],
    creator: author,
    publisher: baseSEO.siteName,
    robots: noIndex ? 'noindex, nofollow' : baseSEO.robots,
    
    // Open Graph
    openGraph: {
      type,
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: baseSEO.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || baseSEO.defaultTitle,
        },
      ],
      locale: 'en_IN',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@vishwamurthiayurveda',
      site: '@vishwamurthiayurveda',
    },

    // Additional metadata
    alternates: {
      canonical: canonical || fullUrl,
      languages: {
        'en-IN': fullUrl,
        'hi-IN': `${fullUrl}?lang=hi`,
      },
    },

    // Verification
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
      other: {
        'msvalidate.01': process.env.BING_VERIFICATION || '',
      },
    },

    // App-specific
    applicationName: baseSEO.siteName,
    category: 'Healthcare',
    classification: 'Healthcare, Ayurveda, Wellness',
    
    // Geo-targeting
    other: {
      'geo.region': 'IN-MH',
      'geo.placename': 'Mumbai',
      'geo.position': '19.0760;72.8777',
      'ICBM': '19.0760, 72.8777',
    },
  };
}

// ============================================================================
// PAGE-SPECIFIC SEO CONFIGURATIONS
// ============================================================================

export const pageSEO = {
  home: {
    title: 'Authentic Ayurvedic Healing & Wellness Center',
    description: 'Experience authentic Ayurvedic healing with 20+ years of expertise. Panchakarma, Agnikarma, Viddha Karma treatments. 5000+ lives transformed. Government certified.',
    keywords: ['best Ayurvedic treatment Mumbai', 'authentic Panchakarma', 'Ayurvedic doctor near me'],
  },
  
  treatments: {
    title: 'Ayurvedic Treatments - Panchakarma, Agnikarma, Viddha Karma',
    description: 'Comprehensive Ayurvedic treatments including Panchakarma detoxification, Agnikarma pain relief, and Viddha Karma therapy. 95% success rate with proven results.',
    keywords: ['Ayurvedic treatments', 'Panchakarma therapy', 'Agnikarma treatment', 'Viddha Karma'],
  },
  
  panchakarma: {
    title: 'Panchakarma Treatment - Complete 21-Day Detoxification Program',
    description: '21-day authentic Panchakarma detoxification program. Complete body-mind-soul purification with 95% success rate. Government certified Ayurvedic hospital.',
    keywords: ['Panchakarma treatment', '21 day detox', 'Ayurvedic detoxification', 'Panchakarma Mumbai'],
  },
  
  agnikarma: {
    title: 'Agnikarma Treatment - Instant Pain Relief Therapy',
    description: 'Agnikarma therapeutic heat healing for instant pain relief. 92% success rate for chronic knee pain, sciatica, frozen shoulder. Zero side effects.',
    keywords: ['Agnikarma treatment', 'chronic pain relief', 'therapeutic heat therapy', 'instant pain relief'],
  },
  
  viddhakarma: {
    title: 'Viddha Karma - Precision Needling Therapy for Complete Healing',
    description: 'Viddha Karma precision needling therapy targeting 107 marma points. 89% success rate for neurological disorders, joint pain, stress relief.',
    keywords: ['Viddha Karma', 'marma point therapy', 'Ayurvedic needling', 'neurological treatment'],
  },
  
  team: {
    title: 'Expert Ayurvedic Doctors - World-Class Medical Team',
    description: 'Meet our expert Ayurvedic doctors with 150+ years combined experience. Government certified practitioners, published researchers, international speakers.',
    keywords: ['Ayurvedic doctors', 'expert Ayurvedic practitioners', 'certified Ayurvedic physicians'],
  },
  
  about: {
    title: 'About Us - 20+ Years of Authentic Ayurvedic Excellence',
    description: '20+ years of authentic Ayurvedic healing excellence. 5000+ lives transformed, government certified, ISO accredited. Our journey of healing and transformation.',
    keywords: ['Ayurvedic hospital Mumbai', 'authentic Ayurveda', 'government certified Ayurveda'],
  },
  
  contact: {
    title: 'Contact Us - Book Ayurvedic Consultation & Treatment',
    description: 'Book your Ayurvedic consultation today. 24/7 support, multiple contact options, emergency consultation available. Start your healing journey now.',
    keywords: ['book Ayurvedic consultation', 'Ayurvedic appointment', 'contact Ayurvedic doctor'],
  },
} as const;

// ============================================================================
// STRUCTURED DATA SCHEMAS
// ============================================================================

export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  name: baseSEO.siteName,
  url: baseSEO.siteUrl,
  logo: `${baseSEO.siteUrl}/images/logo.png`,
  description: baseSEO.defaultDescription,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Ayurveda Street',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400001',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXX-XXXX',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi', 'Marathi'],
  },
  sameAs: [
    'https://www.facebook.com/vishwamurthiayurveda',
    'https://www.instagram.com/vishwamurthiayurveda',
    'https://www.youtube.com/vishwamurthiayurveda',
    'https://www.linkedin.com/company/vishwamurthiayurveda',
  ],
  medicalSpecialty: 'Ayurveda',
  availableService: [
    {
      '@type': 'MedicalTherapy',
      name: 'Panchakarma',
      description: 'Complete detoxification and rejuvenation therapy',
    },
    {
      '@type': 'MedicalTherapy',
      name: 'Agnikarma',
      description: 'Therapeutic heat healing for pain relief',
    },
    {
      '@type': 'MedicalTherapy',
      name: 'Viddha Karma',
      description: 'Precision needling therapy for complete healing',
    },
  ],
});

export const generateLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${baseSEO.siteUrl}/#organization`,
  name: baseSEO.siteName,
  image: `${baseSEO.siteUrl}/images/clinic-exterior.jpg`,
  telephone: '+91-XXXX-XXXX',
  email: 'info@vishwamurthiayurveda.com',
  url: baseSEO.siteUrl,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '123 Ayurveda Street',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400001',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 19.0760,
    longitude: 72.8777,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '08:00',
      closes: '20:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '09:00',
      closes: '17:00',
    },
  ],
  priceRange: '₹₹₹',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '4200',
    bestRating: '5',
    worstRating: '1',
  },
});

export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: baseSEO.siteName,
  url: baseSEO.siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${baseSEO.siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${baseSEO.siteUrl}${item.url}`,
  })),
});

export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});
