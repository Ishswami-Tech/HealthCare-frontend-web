"use client";

import React from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema,
} from "@/lib/config/seo";

import { LanguageProvider } from "@/lib/i18n/context";
// ThemeProvider is handled by AppProvider (next-themes)
import { AppProvider } from "@/app/providers/AppProvider";
import Navigation from "@/components/ayurveda/Navigation";
import Footer from "@/components/ayurveda/Footer";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import { useTranslation } from "@/lib/i18n/context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "min-h-screen bg-background relative",
        inter.variable,
        playfair.variable
      )}
    >
      {/* Subtle background pattern for visual appeal */}
      <div className="fixed inset-0 z-0 opacity-[0.02] dark:opacity-[0.05]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f97316' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
      <Navigation />
      <main className="relative z-10">{children}</main>
      <Footer />

      {/* WhatsApp Button - Available on all pages */}
      <WhatsAppButton
        phoneNumber={t("clinic.whatsapp")}
        variant="floating"
        position="bottom-right"
      />
    </div>
  );
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate structured data for SEO (runs on server)
  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <AppProvider>
      <LanguageProvider initialLanguage="en">
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

          <LayoutContent>{children}</LayoutContent>
        </>
      </LanguageProvider>
    </AppProvider>
  );
}
