/**
 * ✅ Root Layout
 * Uses consolidated i18n from @/lib/i18n
 * Follows DRY, SOLID, KISS principles
 */

import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { PerformanceProvider } from "@/app/providers/PerformanceProvider";
import { Suspense } from "react";
import Script from "next/script";
import { APP_CONFIG } from "@/lib/config/config";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/config";
import { LoadingSpinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const BRAND_NAME = APP_CONFIG.CLINIC.APP_NAME;
const OG_IMAGE = "/assets/og/og-image.png";
const SITE_DESCRIPTION =
  "Experience authentic Ayurvedic care in Chinchwad, Pune with Panchakarma, Agnikarma, Viddha Karma, appointments, and secure patient workflows.";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: `${BRAND_NAME} | Authentic Ayurvedic Healing & Wellness`,
  description: SITE_DESCRIPTION,
  keywords: [
    "Ayurveda",
    "Ayurvedic clinic",
    "Panchakarma",
    "Agnikarma",
    "Viddha Karma",
    "Chinchwad",
    "Pimpri-Chinchwad",
    "Pune",
    "Ayurvedic treatment",
    "natural healing",
  ],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: APP_CONFIG.APP.URL && APP_CONFIG.APP.URL.trim() !== '' 
    ? new URL(APP_CONFIG.APP.URL) 
    : new URL('http://localhost:3000'),
  icons: {
    icon: "/assets/logo/logowithoutbackground.png",
    apple: "/assets/logo/logowithoutbackground.png",
    shortcut: "/assets/logo/logowithoutbackground.png",
  },
  openGraph: {
    title: `${BRAND_NAME} | Authentic Ayurvedic Healing & Wellness`,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: BRAND_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: BRAND_NAME,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} | Authentic Ayurvedic Healing & Wellness`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={DEFAULT_LANGUAGE}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Performance & Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </head>
      <body className={cn(inter.className, "antialiased")} suppressHydrationWarning>
        <PerformanceProvider
          enableWebVitals={true}
          enableResourceTracking={true}
          enableNavigationTracking={true}
        >
          <Suspense
            fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingSpinner size="lg" color="primary" text={`Preparing ${BRAND_NAME}...`} />
              </div>
            }
          >
            {/* AppProvider handles Language, Store, Query, WS, and Theme */}
            <AppProvider>{children}</AppProvider>
          </Suspense>
        </PerformanceProvider>
      </body>
    </html>
  );
}
