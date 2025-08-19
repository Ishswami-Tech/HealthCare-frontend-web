"use client";

import React from "react";
import { LanguageProvider } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { WhatsAppButton } from "@/components/contact/whatsapp-button";
import {
  AccessibilityProvider,
  AccessibilityToolbar,
  SkipNavigation,
} from "@/components/ui/accessibility";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { useTranslation } from "@/lib/i18n/context";

interface AyurvedaLayoutProps {
  children: React.ReactNode;
  className?: string;
  showLanguageSwitcher?: boolean;
  showWhatsApp?: boolean;
  showAccessibility?: boolean;
  initialLanguage?: "en" | "hi" | "mr";
}

interface AyurvedaLayoutContentProps {
  children: React.ReactNode;
  className?: string | undefined;
  showLanguageSwitcher?: boolean;
  showWhatsApp?: boolean;
  showAccessibility?: boolean;
}

export function AyurvedaLayout({
  children,
  className,
  showLanguageSwitcher = true,
  showWhatsApp = true,
  showAccessibility = true,
  initialLanguage = "en",
}: AyurvedaLayoutProps) {
  return (
    <AccessibilityProvider>
      <LanguageProvider initialLanguage={initialLanguage}>
        <AyurvedaLayoutContent
          className={className ?? undefined}
          showLanguageSwitcher={showLanguageSwitcher}
          showWhatsApp={showWhatsApp}
          showAccessibility={showAccessibility}
        >
          {children}
        </AyurvedaLayoutContent>
      </LanguageProvider>
    </AccessibilityProvider>
  );
}

function AyurvedaLayoutContent({
  children,
  className,
  showLanguageSwitcher = true,
  showWhatsApp = true,
  showAccessibility = true,
}: AyurvedaLayoutContentProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Skip Navigation for Accessibility */}
      {showAccessibility && <SkipNavigation />}

      {/* Language Switcher */}
      {showLanguageSwitcher && (
        <div className="fixed top-4 right-4 z-40">
          <LanguageSwitcher variant="compact" />
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className="relative">
        {children}
      </main>

      {/* WhatsApp Button */}
      {showWhatsApp && (
        <WhatsAppButton
          phoneNumber={t("clinic.whatsapp")}
          variant="floating"
          position="bottom-right"
        />
      )}

      {/* Accessibility Toolbar */}
      {showAccessibility && <AccessibilityToolbar />}
    </div>
  );
}

// Navigation component for Ayurveda website
interface AyurvedaNavigationProps {
  className?: string;
  variant?: "header" | "mobile" | "footer";
}

export function AyurvedaNavigation({
  className,
  variant = "header",
}: AyurvedaNavigationProps) {
  const { t } = useTranslation();
  const navigationItems = [
    { key: "home", href: "/" },
    { key: "about", href: "/about" },
    { key: "services", href: "/services" },
    { key: "treatments", href: "/treatments" },
    { key: "gallery", href: "/gallery" },
    { key: "testimonials", href: "/testimonials" },
    { key: "contact", href: "/contact" },
  ];

  if (variant === "mobile") {
    return (
      <nav
        className={cn("space-y-2", className)}
        role="navigation"
        aria-label="Main navigation"
      >
        {navigationItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t(`navigation.${item.key}`)}
          </a>
        ))}
      </nav>
    );
  }

  if (variant === "footer") {
    return (
      <nav
        className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}
        role="navigation"
        aria-label="Footer navigation"
      >
        {navigationItems.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className="text-gray-600 hover:text-green-600 transition-colors text-sm"
          >
            {t(`navigation.${item.key}`)}
          </a>
        ))}
      </nav>
    );
  }

  // Header variant
  return (
    <nav
      className={cn("hidden md:flex items-center space-x-8", className)}
      role="navigation"
      aria-label="Main navigation"
    >
      {navigationItems.map((item) => (
        <a
          key={item.key}
          href={item.href}
          className="text-gray-700 hover:text-green-600 font-medium transition-colors relative group"
        >
          {t(`navigation.${item.key}`)}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 transition-all group-hover:w-full"></span>
        </a>
      ))}
    </nav>
  );
}

// Header component for Ayurveda website
interface AyurvedaHeaderProps {
  className?: string;
  sticky?: boolean;
}

export function AyurvedaHeader({
  className,
  sticky = true,
}: AyurvedaHeaderProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "bg-white shadow-sm border-b border-gray-200",
        sticky && "sticky top-0 z-30",
        className
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.svg"
                  alt={t("navigation.clinicName")}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {t("header.clinicName")}
                </h1>
                <p className="text-xs text-green-600">
                  {t("header.clinicTagline")}
                </p>
              </div>
            </a>
          </div>

          {/* Desktop Navigation */}
          <AyurvedaNavigation />

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/contact"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t("header.bookAppointment")}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 p-2"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <AyurvedaNavigation variant="mobile" />
            <div className="mt-4 px-4">
              <a
                href="/contact"
                className="block w-full text-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {t("header.bookAppointment")}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Footer component for Ayurveda website
interface AyurvedaFooterProps {
  className?: string;
}

export function AyurvedaFooter({ className }: AyurvedaFooterProps) {
  const { t } = useTranslation();
  return (
    <footer
      className={cn("bg-gray-900 text-white", className)}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Clinic Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {t("footer.logo")}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold">{t("footer.clinicName")}</h3>
                <p className="text-green-400">{t("footer.tagline")}</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed">
              {t("footer.description")}
            </p>
            <div className="text-sm text-gray-400">
              <p>{t("footer.address")}</p>
              <p className="mt-2">{t("footer.phone")}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {t("footer.quickLinks.title")}
            </h4>
            <AyurvedaNavigation variant="footer" />
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {t("footer.services.title")}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-400">
                {t("footer.services.panchakarma")}
              </p>
              <p className="text-gray-400">
                {t("footer.services.viddhakarma")}
              </p>
              <p className="text-gray-400">{t("footer.services.agnikarma")}</p>
              <p className="text-gray-400">
                {t("footer.footerServices.neurological")}
              </p>
              <p className="text-gray-400">
                {t("footer.footerServices.jointBone")}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">{t("footer.copyright")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a
              href="/privacy"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("footer.privacyPolicy")}
            </a>
            <a
              href="/terms"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("footer.termsOfService")}
            </a>
            <a
              href="/disclaimer"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              {t("footer.disclaimer")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
