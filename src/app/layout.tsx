/**
 * ✅ Root Layout
 * Uses consolidated i18n from @/lib/i18n
 * Follows DRY, SOLID, KISS principles
 */

import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { PerformanceProvider } from "@/app/providers/PerformanceProvider";
import Script from "next/script";
import { APP_CONFIG } from "@/lib/config/config";
import { baseSEO } from "@/lib/config/seo";
import { DEFAULT_LANGUAGE } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const BRAND_NAME = baseSEO.siteName;
const BRAND_TITLE = "Dr Chandrakumar Deshmukh";
const OG_IMAGE = "/assets/og/og-image.png";
const SITE_DESCRIPTION =
  "Experience authentic Ayurvedic care in Chinchwad, Pune with Panchakarma, Agnikarma, Viddha Karma, appointments, and secure patient workflows.";

function getMetadataBaseUrl(): URL {
  const rawUrl = APP_CONFIG.APP.URL?.trim();
  if (!rawUrl) {
    return new URL("http://localhost:3000");
  }

  try {
    return new URL(rawUrl);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata = {
  title: BRAND_TITLE,
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
  metadataBase: getMetadataBaseUrl(),
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: BRAND_TITLE,
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
    title: BRAND_TITLE,
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
      style={{ ["--font-inter" as any]: "system-ui, sans-serif" }}
    >
      <head>
        {/* Performance & Resource Hints */}
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=IBM+Plex+Mono:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Poppins:wght@500;600;700&display=swap"
        />
        <style>{`:root{--font-care-head:"Poppins",ui-sans-serif,system-ui,sans-serif;--font-care-body:"DM Sans",ui-sans-serif,system-ui,sans-serif;--font-care-script:"Caveat",ui-serif,cursive}`}</style>

        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </head>
      <body className={cn("font-sans antialiased")} suppressHydrationWarning>
        <PerformanceProvider
          tracking={{
            enableWebVitals: true,
            enableResourceTracking: true,
            enableNavigationTracking: true,
          }}
        >
          {/* AppProvider handles Language, Store, Query, WS, and Theme */}
          <AppProvider>{children}</AppProvider>
        </PerformanceProvider>
      </body>
    </html>
  );
}
