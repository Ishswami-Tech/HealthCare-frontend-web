"use client";

import React from "react";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateWebsiteSchema,
} from "@/lib/config/seo";

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
    <>
      {/* SEO Schema Markup */}
      <Script
        id="public-layout-schema"
        type="application/ld+json"
        strategy="afterInteractive"
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
  );
}
