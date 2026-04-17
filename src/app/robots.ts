import { MetadataRoute } from 'next';
import { baseSEO } from '@/lib/config/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = baseSEO.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/treatments',
          '/treatments/panchakarma',
          '/treatments/agnikarma',
          '/treatments/viddha-karma',
          '/team',
          '/about',
          '/contact',
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
          '/*',
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
