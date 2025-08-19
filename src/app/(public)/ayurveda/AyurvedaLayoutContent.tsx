"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Navigation from "@/components/ayurveda/Navigation";
import Footer from "@/components/ayurveda/Footer";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import { AccessibilityToolbar } from "@/components/ui/accessibility";
import { useTranslation } from "@/lib/i18n/context";

interface AyurvedaLayoutContentProps {
  children: React.ReactNode;
  inter: string;
  playfair: string;
}

export default function AyurvedaLayoutContent({
  children,
  inter,
  playfair,
}: AyurvedaLayoutContentProps) {
  const { t } = useTranslation();

  return (
    <>
      <div
        className={cn(
          "min-h-screen bg-gradient-to-br from-orange-50 to-red-50",
          inter,
          playfair
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
          phoneNumber={t("clinic.whatsapp")}
          variant="floating"
          position="bottom-right"
        />

        {/* Accessibility Toolbar */}
        <AccessibilityToolbar />
      </div>
    </>
  );
}
