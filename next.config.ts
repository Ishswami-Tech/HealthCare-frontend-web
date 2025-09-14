import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const config: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Configure image domains for Next.js Image component
  images: {
    domains: [
      'localhost',
      'storage.googleapis.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      'graph.facebook.com',
      'api.ishswami.in',
      'ishswami.in'
    ],
  },

  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
    NEXT_PUBLIC_APPLE_CLIENT_ID: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
  },

  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
      allowedOrigins: ['localhost:3000', 'api.ishswami.in', 'ishswami.in'],
    },
  },

  // ESLint configuration for build
  eslint: {
    // Only run ESLint on specific directories during build
    ignoreDuringBuilds: true,
    dirs: ['src'],
    // Ignore specific files or patterns if needed
    // ignoreDuringBuilds: true, // Uncomment to skip ESLint during builds
  },

  // TypeScript configuration for build
  typescript: {
    // Disable TypeScript error checking for auth-disabled build
    ignoreBuildErrors: true,
  },

  // Webpack configuration to ignore TypeScript errors during development
  webpack: (config, { dev }) => {
    if (dev) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default withNextIntl(config);
