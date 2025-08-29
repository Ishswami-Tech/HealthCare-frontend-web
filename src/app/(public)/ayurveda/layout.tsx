import React from "react";
import { Inter, Playfair_Display } from "next/font/google";

import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema,
} from "@/lib/seo";

import { LanguageProvider } from "@/lib/i18n/context";
import { AccessibilityProvider } from "@/components/ui/accessibility";
import AyurvedaLayoutContent from "./AyurvedaLayoutContent";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

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
      <AccessibilityProvider>
        <>
          {/* SEO Schema Markup */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                organizationSchema,
                localBusinessSchema,
                websiteSchema,
              ]),
            }}
          />

          <AyurvedaLayoutContent
            inter={inter.variable}
            playfair={playfair.variable}
          >
            {children}
          </AyurvedaLayoutContent>
        </>
      </AccessibilityProvider>
    </LanguageProvider>
  );
}
