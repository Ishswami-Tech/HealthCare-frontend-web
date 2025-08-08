"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageCircle,
  Menu,
  X,
  Star,
  Users,
  Award,
  Clock,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", href: "/ayurveda" },
    { name: "Treatments", href: "/ayurveda/treatments" },
    { name: "Panchakarma", href: "/ayurveda/panchakarma" },
    { name: "Agnikarma", href: "/ayurveda/agnikarma" },
    { name: "Viddha Karma", href: "/ayurveda/viddha-karma" },
    { name: "Our Team", href: "/ayurveda/team" },
    { name: "About", href: "/ayurveda/about" },
    { name: "Contact", href: "/ayurveda/contact" },
  ];

  return (
    <>
      {/* Top Trust Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between text-xs md:text-sm">
          <div className="flex items-center space-x-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
              LIVE: 8 patients in treatment
            </Badge>
            <span className="hidden md:inline">✅ 5000+ Lives Transformed</span>
            <span className="hidden lg:inline">
              ⭐ 4.9/5 Rating (4,200+ Reviews)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span className="font-semibold">+91-XXXX-XXXX</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-orange-100"
            : "bg-white/80 backdrop-blur-sm"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/ayurveda" className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">🕉️</span>
              </div>
              <div className="hidden md:block">
                <h1 className="font-playfair text-xl font-bold text-gray-900">
                  Shri Vishwamurthi
                </h1>
                <p className="text-sm text-orange-600 -mt-1">Ayurvedalay</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-600 transition-all duration-200 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                className="hidden md:flex bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="hidden sm:flex border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                Book Consultation
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-orange-100 shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-orange-600 font-medium py-2 border-b border-gray-100 last:border-b-0"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="flex flex-col space-y-2 pt-4">
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Consultation
                  </Button>
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-600"
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Floating WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-lg animate-bounce"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    </>
  );
};

export default Navigation;
