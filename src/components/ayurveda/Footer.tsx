"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Star,
  Award,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";

const Footer = () => {
  const { t } = useTranslation();

  const quickLinks = [
    { name: t("navigation.home"), href: "/" },
    { name: t("navigation.about"), href: "/about" },
    { name: t("navigation.treatments"), href: "/treatments" },
    { name: t("navigation.contact"), href: "/contact" },
  ];

  const treatments = [
    { name: t("navigation.panchakarma"), href: "/treatments/panchakarma" },
    { name: t("navigation.agnikarma"), href: "/treatments/agnikarma" },
    { name: t("navigation.viddhakarma"), href: "/treatments/viddha-karma" },
    { name: t("footer.services.fertility"), href: "/fertility" },
  ];

  const conditions = [
    t("footer.conditions.chronicPain"),
    t("footer.conditions.diabetes"),
    t("footer.conditions.arthritis"),
    t("footer.conditions.stress"),
    t("footer.conditions.digestive"),
    t("footer.conditions.skin"),
  ];

  return (
    <footer className="border-t border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] text-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                <img
                  src="/assets/logo/logowithoutbackground.png"
                  alt={t("clinic.name")}
                  className="w-full h-full object-cover dark:hidden"
                />
                <img
                  src="/assets/logo/dark-logo-withoutborder.png"
                  alt={t("clinic.name")}
                  className="hidden dark:block w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold tracking-tight">
                  {t("clinic.name")}
                </h3>
                <p className="mt-1 text-sm font-medium text-primary">
                  {t("footer.tagline")}
                </p>
              </div>
            </div>

            <p className="mb-6 max-w-sm leading-7 text-muted-foreground">
              {t("footer.description")}
            </p>

            {/* Trust Badges */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t("stats.certifications.governmentCertified.title")}
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
                <Award className="w-3 h-3 mr-1" />
                {t("stats.certifications.iso9001.title")}
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary shadow-none">
                <Star className="w-3 h-3 mr-1" />
                {t("stats.patientRating")}
              </Badge>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full border-border bg-background/70 p-0 text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full border-border bg-background/70 p-0 text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Instagram className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full border-border bg-background/70 p-0 text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Youtube className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 w-10 rounded-full border-border bg-background/70 p-0 text-muted-foreground hover:border-primary hover:text-foreground"
              >
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("footer.quickLinks.title")}
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("footer.services.title")}
            </h4>
            <ul className="space-y-3">
              {treatments.map((treatment) => (
                <li key={treatment.name}>
                  <Link
                    href={treatment.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {treatment.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditions Treated */}
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("footer.conditions.title")}
            </h4>
            <ul className="space-y-3">
              {conditions.map((condition) => (
                <li
                  key={condition}
                  className="text-muted-foreground flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t("footer.contact.title")}
            </h4>

            <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-muted-foreground">{t("clinic.address")}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-muted-foreground">{t("clinic.phone")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("footer.contact.emergency")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary" />
                <p className="text-muted-foreground">{t("clinic.email")}</p>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-muted-foreground">
                    {t("clinic.mondayToFriday")}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
              <h5 className="font-semibold text-destructive mb-2">
                {t("footer.emergency.title")}
              </h5>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t("footer.emergency.button")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-border/70">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-muted-foreground text-sm">
              {t("footer.copyright")}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-primary"
              >
                {t("footer.privacyPolicy")}
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-primary"
              >
                {t("footer.termsOfService")}
              </Link>
              <Link
                href="/disclaimer"
                className="text-muted-foreground hover:text-primary"
              >
                {t("footer.disclaimer")}
              </Link>
              <Link
                href="/sitemap.xml"
                className="text-muted-foreground hover:text-primary"
              >
                {t("footer.sitemap")}
              </Link>
            </div>

            <div className="text-muted-foreground text-sm flex items-center gap-4">
              <span>भारतात ❤️ सह बनवले</span>
              <MinimalStatusIndicator />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
