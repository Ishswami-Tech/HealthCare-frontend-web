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
import { APP_CONFIG } from "@/lib/config/config";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/config";
import { LoadingSpinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "Ishswami Healthcare - Your Health, Our Priority",
  description:
    "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
  keywords: [
    "healthcare",
    "medical",
    "appointments",
    "doctors",
    "telemedicine",
    "health records",
  ],
  authors: [{ name: "Ishswami Healthcare" }],
  creator: "Ishswami Healthcare",
  publisher: "Ishswami Healthcare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: APP_CONFIG.APP.URL && APP_CONFIG.APP.URL.trim() !== '' 
    ? new URL(APP_CONFIG.APP.URL) 
    : new URL('http://localhost:3000'),
  openGraph: {
    title: "Ishswami Healthcare - Your Health, Our Priority",
    description:
      "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
    url: "/",
    siteName: "Ishswami Healthcare",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ishswami Healthcare Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ishswami Healthcare - Your Health, Our Priority",
    description:
      "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
    images: ["/og-image.jpg"],
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
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <head>
        {/* Performance & Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        <script src="https://accounts.google.com/gsi/client" async defer></script>
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
                <LoadingSpinner size="lg" color="primary" text="Preparing Ishswami Healthcare..." />
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
