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
    <footer className="bg-background text-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src="/logo.svg"
                  alt={t("clinic.name")}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold">
                  {t("clinic.name")}
                </h3>
                <p className="text-primary text-sm">{t("footer.tagline")}</p>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t("footer.description")}
            </p>

            {/* Trust Badges */}
            <div className="space-y-2 mb-6">
              <Badge className="bg-primary text-primary-foreground border-primary">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t("stats.certifications.governmentCertified.title")}
              </Badge>
              <Badge className="bg-primary text-primary-foreground border-primary">
                <Award className="w-3 h-3 mr-1" />
                {t("stats.certifications.iso9001.title")}
              </Badge>
              <Badge className="bg-primary text-primary-foreground border-primary">
                <Star className="w-3 h-3 mr-1" />
                {t("stats.patientRating")}
              </Badge>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-border text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-border text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Instagram className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-border text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Youtube className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-border text-muted-foreground hover:text-foreground hover:border-primary"
              >
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-primary">
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

            <h4 className="font-semibold text-lg mb-4 mt-8 text-orange-400">
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
            <h4 className="font-semibold text-lg mb-6 text-primary">
              {t("footer.conditions.title")}
            </h4>
            <ul className="space-y-3">
              {conditions.map((condition) => (
                <li
                  key={condition}
                  className="text-muted-foreground flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-primary">
              {t("footer.contact.title")}
            </h4>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
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
                <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="text-muted-foreground">
                    {t("clinic.mondayToFriday")}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
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
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
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
                href="/sitemap"
                className="text-muted-foreground hover:text-primary"
              >
                {t("footer.sitemap")}
              </Link>
            </div>

            <div className="text-muted-foreground text-sm">
              भारतात ❤️ सह बनवले
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
