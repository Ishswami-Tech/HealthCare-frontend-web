"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverAnimation } from "@/components/ui/animated-wrapper";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { useTranslation, useLanguageSwitcher } from "@/lib/i18n/context";
import { Globe, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, MessageCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { setLanguage } = useLanguageSwitcher();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: t("navigation.home"), href: "/ayurveda" },
    { name: t("navigation.treatments"), href: "/ayurveda/treatments" },
    { name: t("navigation.panchakarma"), href: "/ayurveda/panchakarma" },
    { name: t("navigation.agnikarma"), href: "/ayurveda/agnikarma" },
    { name: t("navigation.viddhakarma"), href: "/ayurveda/viddha-karma" },
    { name: t("navigation.ourTeam"), href: "/ayurveda/team" },
    { name: t("navigation.about"), href: "/ayurveda/about" },
    { name: t("navigation.contact"), href: "/ayurveda/contact" },
  ];

  return (
    <>
      {/* Top Trust Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 text-white py-2 px-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between text-xs md:text-sm">
          <div className="flex items-center space-x-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
              {t("navigation.livePatients")}
            </Badge>
            <span className="hidden md:inline">
              {t("navigation.livesTransformed")}
            </span>
            <span className="hidden lg:inline">{t("navigation.rating")}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span className="font-semibold">
                {t("navigation.phoneNumber")}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("navigation.language")}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  <span className="text-lg">🇺🇸</span>
                  <div className="flex flex-col ml-3">
                    <span className="font-medium">English</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      English
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("hi")}>
                  <span className="text-lg">🇮🇳</span>
                  <div className="flex flex-col ml-3">
                    <span className="font-medium">हिंदी</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Hindi
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("mr")}>
                  <span className="text-lg">🇮🇳</span>
                  <div className="flex flex-col ml-3">
                    <span className="font-medium">मराठी</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Marathi
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <motion.nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-orange-100 dark:border-gray-700"
            : "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <HoverAnimation type="scale">
              <Link href="/ayurveda" className="flex items-center space-x-3">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <img
                    src="/logo.svg"
                    alt={t("navigation.clinicName")}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="hidden md:block">
                  <h1 className="font-playfair text-xl font-bold text-gray-900 dark:text-white">
                    {t("navigation.clinicName")}
                  </h1>
                  <p className="text-sm text-orange-600 dark:text-orange-400 -mt-1">
                    {t("navigation.clinicSubtitle")}
                  </p>
                </div>
              </Link>
            </HoverAnimation>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: [0.0, 0.0, 0.2, 1],
                  }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors duration-200 relative group",
                      pathname === item.href &&
                        "text-orange-600 dark:text-orange-400"
                    )}
                  >
                    {item.name}
                    <motion.span
                      className="absolute -bottom-1 left-0 h-0.5 bg-orange-600 dark:bg-orange-400"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      animate={{ width: pathname === item.href ? "100%" : 0 }}
                      transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <HoverAnimation type="glow">
                <Button
                  size="sm"
                  className="hidden md:flex bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                  </motion.div>
                  {t("navigation.liveChat")}
                </Button>
              </HoverAnimation>

              <HoverAnimation type="scale">
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden sm:flex border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  {t("navigation.bookConsultation")}
                </Button>
              </HoverAnimation>

              {/* Mobile Menu Button */}
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <X className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Menu className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="lg:hidden bg-white border-t border-orange-100 shadow-lg overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
            >
              <div className="container mx-auto px-4 py-4">
                <motion.div
                  className="flex flex-col space-y-4"
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1 + 0.2,
                        ease: [0.0, 0.0, 0.2, 1],
                      }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "text-gray-700 hover:text-orange-600 font-medium py-2 border-b border-gray-100 last:border-b-0 block transition-colors duration-200",
                          pathname === item.href && "text-orange-600"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    className="flex flex-col space-y-2 pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                  >
                    <HoverAnimation type="scale">
                      <Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t("navigation.liveChat")}
                      </Button>
                    </HoverAnimation>
                    <HoverAnimation type="scale">
                      <Button
                        variant="outline"
                        className="border-orange-300 text-orange-600"
                      >
                        {t("navigation.bookConsultation")}
                      </Button>
                    </HoverAnimation>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Floating Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          delay: 1,
          type: "spring",
          stiffness: 200,
          damping: 10,
        }}
      >
        <HoverAnimation type="lift">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 bg-blue-500 hover:bg-blue-600 shadow-lg group relative"
          >
            {/* Online indicator */}
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </motion.div>
          </Button>
        </HoverAnimation>
      </motion.div>
    </>
  );
};

export default Navigation;
