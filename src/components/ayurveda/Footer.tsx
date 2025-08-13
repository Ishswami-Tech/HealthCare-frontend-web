"use client";

import React from "react";
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
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations();

  const quickLinks = [
    { name: t("navigation.home"), href: "/ayurveda" },
    { name: t("navigation.about"), href: "/ayurveda/about" },
    { name: t("navigation.treatments"), href: "/ayurveda/treatments" },
    { name: t("navigation.contact"), href: "/ayurveda/contact" },
  ];

  const treatments = [
    { name: t("navigation.panchakarma"), href: "/ayurveda/panchakarma" },
    { name: t("navigation.agnikarma"), href: "/ayurveda/agnikarma" },
    { name: t("navigation.viddhakarma"), href: "/ayurveda/viddha-karma" },
    { name: t("footer.fertilityTreatment"), href: "/ayurveda/fertility" },
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
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">🕉️</span>
              </div>
              <div>
                <h3 className="font-playfair text-xl font-bold">
                  Shri Vishwamurthi
                </h3>
                <p className="text-orange-400 text-sm">Ayurvedalay</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Experience authentic Ayurvedic healing with 20+ years of
              expertise. Transforming lives through ancient wisdom and modern
              excellence.
            </p>

            {/* Trust Badges */}
            <div className="space-y-2 mb-6">
              <Badge className="bg-green-600 text-white border-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Government Certified
              </Badge>
              <Badge className="bg-blue-600 text-white border-blue-500">
                <Award className="w-3 h-3 mr-1" />
                ISO 9001:2015
              </Badge>
              <Badge className="bg-yellow-600 text-white border-yellow-500">
                <Star className="w-3 h-3 mr-1" />
                4.9/5 Rating
              </Badge>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-gray-600 text-gray-400 hover:text-white hover:border-orange-500"
              >
                <Facebook className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-gray-600 text-gray-400 hover:text-white hover:border-orange-500"
              >
                <Instagram className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-gray-600 text-gray-400 hover:text-white hover:border-orange-500"
              >
                <Youtube className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full w-10 h-10 p-0 border-gray-600 text-gray-400 hover:text-white hover:border-orange-500"
              >
                <Twitter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-orange-400">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold text-lg mb-4 mt-8 text-orange-400">
              Treatments
            </h4>
            <ul className="space-y-3">
              {treatments.map((treatment) => (
                <li key={treatment.name}>
                  <Link
                    href={treatment.href}
                    className="text-gray-300 hover:text-orange-400 transition-colors duration-200"
                  >
                    {treatment.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Conditions Treated */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-orange-400">
              Conditions Treated
            </h4>
            <ul className="space-y-3">
              {conditions.map((condition) => (
                <li
                  key={condition}
                  className="text-gray-300 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-6 text-orange-400">
              Contact Information
            </h4>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-300">
                    123 Ayurveda Street,
                    <br />
                    Wellness District,
                    <br />
                    Mumbai, Maharashtra 400001
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-gray-300">+91-XXXX-XXXX</p>
                  <p className="text-sm text-gray-400">
                    24/7 Emergency Support
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-orange-400" />
                <p className="text-gray-300">info@vishwamurthiayurveda.com</p>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-gray-300">
                    Mon - Sat: 8:00 AM - 8:00 PM
                    <br />
                    Sunday: 9:00 AM - 5:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <h5 className="font-semibold text-red-400 mb-2">
                Emergency Consultation
              </h5>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Now
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Shri Vishwamurthi Ayurvedalay. All
              rights reserved.
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/ayurveda/privacy"
                className="text-gray-400 hover:text-orange-400"
              >
                Privacy Policy
              </Link>
              <Link
                href="/ayurveda/terms"
                className="text-gray-400 hover:text-orange-400"
              >
                Terms of Service
              </Link>
              <Link
                href="/ayurveda/disclaimer"
                className="text-gray-400 hover:text-orange-400"
              >
                Medical Disclaimer
              </Link>
              <Link
                href="/ayurveda/sitemap"
                className="text-gray-400 hover:text-orange-400"
              >
                Sitemap
              </Link>
            </div>

            <div className="text-gray-400 text-sm">
              Made with ❤️ for healing
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
