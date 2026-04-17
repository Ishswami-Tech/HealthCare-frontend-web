"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverAnimation } from "@/components/ui/animated-wrapper";
import { useTranslation, useLanguageSwitcher } from "@/lib/i18n/context";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/lib/config/config";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { Role } from "@/types/auth.types";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Globe, ChevronDown, ChevronRight, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTreatmentsDropdownOpen, setIsTreatmentsDropdownOpen] =
    useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { setLanguage, language: currentLanguage } = useLanguageSwitcher();
  const { session, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const isAuthEnabled = APP_CONFIG.AUTH.ENABLED;

  // Get current language short form
  const getCurrentLanguageShort = () => {
    switch (currentLanguage) {
      case "en":
        return "EN";
      case "hi":
        return "HI";
      case "mr":
        return "MR";
      default:
        return "EN";
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.position = "unset";
      document.body.style.width = "unset";
    };
  }, [isMobileMenuOpen]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Enhanced hover handlers with timeout
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setIsTreatmentsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setIsTreatmentsDropdownOpen(false);
    }, 150); // Small delay to prevent accidental closes
    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Authentication handlers
  const handleLogin = () => {
    router.push(ROUTES.LOGIN);
  };

  const handleRegister = () => {
    router.push(ROUTES.REGISTER);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push(ROUTES.HOME);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDashboardNavigation = () => {
    if (!isAuthenticated || !session) {
      router.push(ROUTES.LOGIN);
      return;
    }
    // ✅ Use centralized getDashboardByRole function for consistency
    const dashboardPath = getDashboardByRole(session.user.role as Role);
    router.push(dashboardPath);
  };

  const treatmentsSubItems = [
    { name: t("navigation.agnikarma"), href: "/treatments/agnikarma" },
    { name: t("navigation.viddhakarma"), href: "/treatments/viddha-karma" },
    { name: t("navigation.panchakarma"), href: "/treatments/panchakarma" },
  ];

  const navItems = [
    { name: t("navigation.home"), href: "/" },
    {
      name: t("navigation.treatments"),
      href: "/treatments",
      hasDropdown: true,
      subItems: treatmentsSubItems,
    },
    { name: t("navigation.ourTeam"), href: "/team" },
    { name: t("navigation.about"), href: "/about" },
    { name: t("navigation.contact"), href: "/contact" },
  ];

  return (
    <>
      {/* Top Trust Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-700 dark:to-red-700 text-white py-2 px-4 relative z-40">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs md:text-sm gap-2 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-xs"
            >
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse mr-1"></div>
              {t("navigation.livePatients")}
            </Badge>
            <span className="hidden sm:inline text-xs">
              {t("navigation.livesTransformed")}
            </span>
            <span className="hidden lg:inline text-xs">
              {t("navigation.rating")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-semibold text-xs sm:text-sm">
                {t("navigation.phoneNumber")}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 sm:space-x-2 h-7 sm:h-8 px-2 sm:px-3 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-110 z-50 relative"
                >
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs font-semibold">
                    {getCurrentLanguageShort()}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[9999]">
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className="cursor-pointer"
                >
                  <span className="text-lg">🇺🇸</span>
                  <div className="flex flex-col ml-3">
                    <span className="font-medium">English</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      English
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("hi")}
                  className="cursor-pointer"
                >
                  <span className="text-lg">🇮🇳</span>
                  <div className="flex flex-col ml-3">
                    <span className="font-medium">हिंदी</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Hindi
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("mr")}
                  className="cursor-pointer"
                >
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

            {/* Theme Switcher */}
            <CompactThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <motion.nav
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          isScrolled
            ? "backdrop-blur-md shadow-lg border-b border-border"
            : "backdrop-blur-sm"
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.0, 0.0, 0.2, 1] }}
        style={{ zIndex: 40 }}
      >
        {/* Background Elements - Same as Hero */}
        <div className="absolute inset-0 z-0">
          {/* Base Background */}
          <div className="absolute inset-0 bg-background" />

          {/* Elegant Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-muted/20 dark:from-background dark:via-background/95 dark:to-muted/30" />

          {/* Secondary Gradient for Depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/3 to-secondary/8 dark:via-primary/5 dark:to-secondary/12" />

          {/* Subtle Geometric Pattern */}
          <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.04]">
            <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M30%2030c0-8.284-6.716-15-15-15s-15%206.716-15%2015%206.716%2015%2015%2015%2015-6.716%2015-15zm0%200c0%208.284%206.716%2015%2015%2015s15-6.716%2015-15-6.716-15-15-15-15%206.716-15%2015z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
          </div>
        </div>

        {/* Navigation Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-16 md:h-20 min-h-16 max-w-7xl mx-auto">
            {/* Left Section - Logo Only */}
            <div className="flex items-center shrink-0 min-w-0">
              <HoverAnimation type="scale">
                <Link
                  href="/"
                  className="flex items-center space-x-2 sm:space-x-3 touch-manipulation"
                >
                  <motion.div
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    <img
                      src="/logo.svg"
                      alt={t("navigation.clinicName")}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <div className="hidden sm:block min-w-0">
                    <h1 className="font-playfair text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                      {t("navigation.clinicName")}
                    </h1>
                    <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 -mt-1 truncate">
                      {t("navigation.clinicSubtitle")}
                    </p>
                  </div>
                </Link>
              </HoverAnimation>
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 flex-1 justify-center max-w-3xl">
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
                  className="relative"
                >
                  {item.hasDropdown ? (
                    <div
                      className="relative rounded-lg transition-all duration-200 hover:bg-orange-50/50 dark:hover:bg-orange-900/10 px-2 py-1"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setIsTreatmentsDropdownOpen(
                            !isTreatmentsDropdownOpen
                          );
                        }
                      }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-all duration-200 relative group text-sm xl:text-base whitespace-nowrap flex items-center space-x-1 hover:scale-105",
                          (pathname === item.href ||
                            item.subItems?.some(
                              (subItem) => pathname === subItem.href
                            )) &&
                            "text-orange-600 dark:text-orange-400"
                        )}
                      >
                        <span>{item.name}</span>
                        <motion.div
                          animate={{
                            rotate: isTreatmentsDropdownOpen ? 90 : 0,
                            scale: isTreatmentsDropdownOpen ? 1.1 : 1,
                          }}
                          transition={{
                            duration: 0.2,
                            ease: [0.0, 0.0, 0.2, 1],
                          }}
                        >
                          <ChevronRight className="w-3 h-3" />
                        </motion.div>
                        <motion.span
                          className="absolute -bottom-1 left-0 h-0.5 bg-orange-600 dark:bg-orange-400"
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                          animate={{
                            width:
                              pathname === item.href ||
                              item.subItems?.some(
                                (subItem) => pathname === subItem.href
                              )
                                ? "100%"
                                : 0,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: [0.0, 0.0, 0.2, 1],
                          }}
                        />
                      </Link>

                      {/* Animated Dropdown */}
                      <AnimatePresence>
                        {isTreatmentsDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{
                              duration: 0.2,
                              ease: [0.0, 0.0, 0.2, 1],
                            }}
                            className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            {item.subItems?.map((subItem, subIndex) => (
                              <motion.div
                                key={subItem.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: subIndex * 0.05,
                                  ease: [0.0, 0.0, 0.2, 1],
                                }}
                              >
                                <Link
                                  href={subItem.href}
                                  className={cn(
                                    "block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                                    pathname === subItem.href &&
                                      "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                  )}
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                    <span>{subItem.name}</span>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors duration-200 relative group text-sm xl:text-base whitespace-nowrap",
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
                  )}
                </motion.div>
              ))}
            </div>

            {/* Right Section - Clean and Simple */}
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
              {/* Authentication Buttons */}
              {isAuthenticated && session ? (
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center space-x-1 sm:space-x-2 h-8 px-2 sm:px-3 touch-manipulation"
                      >
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline text-sm truncate max-w-20">
                          {session.user.firstName || "User"}
                        </span>
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleDashboardNavigation}>
                        <User className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : isAuthEnabled ? (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <HoverAnimation type="scale">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleLogin}
                      className="text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                    >
                      <span className="hidden sm:inline">Login</span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  </HoverAnimation>
                  <HoverAnimation type="scale">
                    <Button
                      size="sm"
                      onClick={handleRegister}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                    >
                      <span className="hidden sm:inline">Register</span>
                      <span className="sm:hidden">Sign Up</span>
                    </Button>
                  </HoverAnimation>
                </div>
              ) : null}

              {/* Primary CTA Button */}
              <HoverAnimation type="scale">
                <Button
                  size="sm"
                  className="hidden lg:flex bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs sm:text-sm px-3 sm:px-4 shadow-lg"
                  onClick={() => (window.location.href = "tel:9860370961")}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  {t("navigation.bookConsultation")}
                </Button>
              </HoverAnimation>

              {/* Mobile Book Consultation Button */}
              <HoverAnimation type="scale">
                <Button
                  size="sm"
                  className="lg:hidden bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xs px-3 py-2 h-8 shadow-lg touch-manipulation"
                  onClick={() => (window.location.href = "tel:9860370961")}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  <span className="hidden sm:inline">
                    {t("navigation.bookConsultation")}
                  </span>
                  <span className="sm:hidden">Book</span>
                </Button>
              </HoverAnimation>

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden h-10 w-10 p-0 touch-manipulation hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    aria-label="Toggle mobile menu"
                  >
                    <Menu className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-80 p-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                >
                  <SheetHeader className="p-8 pb-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                    <SheetTitle className="text-left text-xl font-bold text-orange-600 dark:text-orange-400 leading-tight tracking-wide flex items-center space-x-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src="/logo.svg"
                          alt={t("navigation.clinicName")}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span>{t("navigation.clinicName")}</span>
                    </SheetTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                      Navigate to your destination
                    </p>
                  </SheetHeader>

                  <div className="flex flex-col h-full overflow-y-auto">
                    {/* Navigation Items */}
                    <div className="flex-1 px-8 py-6">
                      <div className="flex flex-col space-y-3">
                        {navItems.map((item) => (
                          <div key={item.name}>
                            {item.hasDropdown ? (
                              <div>
                                <button
                                  onClick={() =>
                                    setIsTreatmentsDropdownOpen(
                                      !isTreatmentsDropdownOpen
                                    )
                                  }
                                  className={cn(
                                    "w-full text-left text-gray-800 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold py-4 px-5 rounded-xl flex items-center justify-between transition-all duration-200 touch-manipulation min-h-[52px] border border-transparent hover:border-orange-200 dark:hover:border-orange-800 text-base",
                                    (pathname === item.href ||
                                      item.subItems?.some(
                                        (subItem) => pathname === subItem.href
                                      )) &&
                                      "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                                  )}
                                >
                                  <span>{item.name}</span>
                                  <div
                                    className={`transform transition-transform duration-150 ${
                                      isTreatmentsDropdownOpen
                                        ? "rotate-90"
                                        : "rotate-0"
                                    }`}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                </button>

                                {/* Mobile Accordion */}
                                {isTreatmentsDropdownOpen && (
                                  <div className="ml-4 space-y-1 py-2">
                                    {item.subItems?.map((subItem) => (
                                      <Link
                                        key={subItem.name}
                                        href={subItem.href}
                                        className={cn(
                                          "block text-sm text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 py-2 px-3 rounded-lg transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-800",
                                          pathname === subItem.href &&
                                            "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                                        )}
                                        onClick={() =>
                                          setIsMobileMenuOpen(false)
                                        }
                                      >
                                        <div className="flex items-center space-x-2">
                                          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                          <span>{subItem.name}</span>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(
                                  "text-gray-800 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-semibold py-4 px-5 rounded-xl flex items-center transition-all duration-200 touch-manipulation min-h-[52px] border border-transparent hover:border-orange-200 dark:hover:border-orange-800 text-base",
                                  pathname === item.href &&
                                    "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {item.name}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Authentication Section */}
                    <div className="p-8 pt-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      {isAuthenticated && session ? (
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <User className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                              {session.user.firstName || "User"}
                            </span>
                          </div>
                          <Button
                            onClick={handleDashboardNavigation}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white h-12 text-base touch-manipulation shadow-md"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Dashboard
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-12 text-base touch-manipulation"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                          </Button>
                        </div>
                      ) : isAuthEnabled ? (
                        <div className="flex flex-col space-y-4">
                          <Button
                            onClick={handleLogin}
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-12 text-base touch-manipulation"
                          >
                            Login
                          </Button>
                          <Button
                            onClick={handleRegister}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white h-12 text-base touch-manipulation shadow-md"
                          >
                            Register
                          </Button>
                        </div>
                      ) : null}

                      <Button
                        variant="outline"
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 h-12 text-base touch-manipulation mt-3 w-full"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t("navigation.bookConsultation")}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;
