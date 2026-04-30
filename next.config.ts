import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const appOrigin = (() => {
  if (!appUrl) return '';
  try {
    return new URL(appUrl).host;
  } catch {
    return '';
  }
})();

const configuredServerActionOrigins = (
  process.env.NEXT_SERVER_ACTION_ALLOWED_ORIGINS || ''
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const serverActionOrigins = [...new Set([appOrigin, 'localhost:3000', ...configuredServerActionOrigins])];

const nextConfig: NextConfig = {
  /* =====================================================
   * Core
   * ===================================================== */
  reactStrictMode: true,
  compress: true,
  output: 'standalone',

  /* =====================================================
   * Turbopack (disabled for Tailwind CSS v4 compatibility)
   * ===================================================== */
  turbopack: {
    resolveAlias: {
      uuid: './src/lib/shims/uuid.ts',
    },
  },

  /* =====================================================
   * Experimental (safe + useful)
   * ===================================================== */
  experimental: {
    optimizePackageImports: [
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'sonner',
    ],
    serverActions: {
      allowedOrigins: serverActionOrigins,
    },
  },

  /* =====================================================
   * Images (unchanged functionality)
   * ===================================================== */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: 'api.Viddhakarma.in' },
      { protocol: 'https', hostname: 'backend-service-v1.Viddhakarma.in' },
      { protocol: 'https', hostname: 'Viddhakarma.in' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  /* =====================================================
   * Environment Variables (build-time only)
   * ===================================================== */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    NEXT_PUBLIC_APPLE_CLIENT_ID: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
  },

  /* =====================================================
   * Security Headers (frontend-appropriate)
   * ===================================================== */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "form-action 'self' https://*.cashfree.com https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://payments-test.cashfree.com;"
          }
        ].filter((header) => header.key !== 'Strict-Transport-Security' || isProduction),
      },
    ];
  },

  /* =====================================================
   * API Rewrite (proxy only, no CORS)
   * ===================================================== */
  async rewrites() {
    return [];
  },

  /* =====================================================
   * TypeScript (do NOT hide errors)
   * ===================================================== */
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
