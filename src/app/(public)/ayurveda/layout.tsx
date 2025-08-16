import React from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";
import Navigation from "@/components/ayurveda/Navigation";
import Footer from "@/components/ayurveda/Footer";
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema,
} from "@/lib/seo";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import { AccessibilityToolbar } from "@/components/ui/accessibility";
import { LanguageProvider } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

// This is now a Server Component for better SEO and performance
export default function AyurvedaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate structured data for SEO (runs on server)
  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <LanguageProvider initialLanguage="en">
      <>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />

        {/* Resource Hints for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />

        <div
          className={cn(
            "min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
            inter.variable,
            playfair.variable
          )}
        >
          {/* Skip Navigation for Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Skip to main content
          </a>

          <Navigation />
          <main id="main-content" role="main">
            {children}
          </main>
          <Footer />

          {/* WhatsApp Button - Available on all Ayurveda pages */}
          <WhatsAppButton
            phoneNumber="9860370961"
            variant="floating"
            position="bottom-right"
          />

          {/* Accessibility Toolbar */}
          <AccessibilityToolbar />
        </div>
      </>
    </LanguageProvider>
  );
}
