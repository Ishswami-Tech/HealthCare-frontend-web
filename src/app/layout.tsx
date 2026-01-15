/**
 * ✅ Root Layout
 * Uses consolidated i18n from @/lib/i18n
 * Follows DRY, SOLID, KISS principles
 */

import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { LanguageProvider } from "@/lib/i18n/context";
import { PerformanceProvider } from "@/app/providers/PerformanceProvider";
// ThemeProvider is handled by AppProvider (next-themes)
import { Suspense } from "react";
import { APP_CONFIG } from "@/lib/config/config";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/config";
import { LoadingSpinner } from "@/components/ui/loading";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
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
  // ⚠️ SECURITY: Only create URL if APP.URL is set (not empty)
  // Prevents "Invalid URL" error during SSR when env vars aren't loaded
  metadataBase: APP_CONFIG.APP.URL && APP_CONFIG.APP.URL.trim() !== '' 
    ? new URL(APP_CONFIG.APP.URL) 
    : new URL('http://localhost:3000'), // Development fallback
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
  // ✅ Use consolidated i18n - language is managed client-side via LanguageProvider
  // Server-side locale detection can be added if needed via cookies/headers

  return (
    <html lang={DEFAULT_LANGUAGE} suppressHydrationWarning>
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <PerformanceProvider
          enableWebVitals={true}
          enableResourceTracking={true}
          enableNavigationTracking={true}
        >
          <LanguageProvider>
            <Suspense
              fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                  <LoadingSpinner size="lg" color="primary" text="Loading..." />
                </div>
              }
            >
              <AppProvider>{children}</AppProvider>
            </Suspense>
          </LanguageProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
