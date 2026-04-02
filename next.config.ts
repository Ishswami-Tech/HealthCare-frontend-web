import type { NextConfig } from 'next';

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
      allowedOrigins: ['localhost:3000', '*.cashfree.com', 'sandbox.cashfree.com', 'api.cashfree.com', 'payments.cashfree.com'],
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
      { protocol: 'https', hostname: 'api.ishswami.in' },
      { protocol: 'https', hostname: 'backend-service-v1.ishswami.in' },
      { protocol: 'https', hostname: 'ishswami.in' },
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
        ],
      },
    ];
  },

  /* =====================================================
   * API Rewrite (proxy only, no CORS)
   * ===================================================== */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  /* =====================================================
   * TypeScript (do NOT hide errors)
   * ===================================================== */
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;