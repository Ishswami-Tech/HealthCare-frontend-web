import { MetadataRoute } from 'next';
import { baseSEO } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = baseSEO.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/ayurveda',
          '/ayurveda/treatments',
          '/ayurveda/panchakarma',
          '/ayurveda/agnikarma',
          '/ayurveda/viddha-karma',
          '/ayurveda/team',
          '/ayurveda/about',
          '/ayurveda/contact',
          '/auth/login',
          '/auth/register',
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
          '/_next/',
          '/private/',
          '*.json',
          '/temp/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/ayurveda',
          '/ayurveda/*',
          '/auth/*',
        ],
        disallow: [
          '/dashboard/',
          '/api/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
