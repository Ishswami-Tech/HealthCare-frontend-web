"use client";

import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LazyMotion, domAnimation, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation, useLanguageSwitcher } from "@/lib/i18n/context";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/lib/config/config";
import { ROUTES, getDashboardByRole } from "@/lib/config/routes";
import { Role } from "@/types/auth.types";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Globe, ChevronDown, User, LogOut } from "lucide-react";
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

type NavigationItem = {
  name: string;
  href: string;
};

type MobileNavMenuItemProps = {
  item: NavigationItem;
  pathname: string;
  onSelect: () => void;
};

const MobileNavMenuItem = ({ item, pathname, onSelect }: MobileNavMenuItemProps) => (
  <Link
    href={item.href}
    prefetch={false}
    className={cn(
      "text-gray-800 dark:text-gray-200 hover:text-primary hover:bg-primary/8 font-semibold py-4 px-5 rounded-xl flex items-center transition-all duration-200 touch-manipulation min-h-[52px] border border-transparent hover:border-primary/25 text-base",
      pathname === item.href && "text-primary bg-primary/8 border-primary/25"
    )}
    onClick={onSelect}
  >
    {item.name}
  </Link>
);

const Navigation = () => {
  const mounted = useHydrated();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { setLanguage, language: currentLanguage } = useLanguageSwitcher();
  const { session, isAuthenticated, logout } = useAuth();
  const { push } = useRouter();
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
    window.addEventListener("scroll", handleScroll, { passive: true });
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

  // Authentication handlers
  const handleLogin = () => {
    push(ROUTES.LOGIN);
  };

  const handleRegister = () => {
    push(ROUTES.LOGIN);
  };

  const handleLogout = async () => {
    try {
      await logout();
      push(ROUTES.HOME);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDashboardNavigation = () => {
    if (!isAuthenticated || !session) {
      push(ROUTES.LOGIN);
      return;
    }
    // ✅ Use centralized getDashboardByRole function for consistency
    const dashboardPath = getDashboardByRole(session.user.role as Role);
    push(dashboardPath);
  };

  /* The three therapies sit at the top level — no Treatments dropdown.
     Home is reached through the logo, so it needs no tab of its own. */
  const navItems: NavigationItem[] = [
    { name: t("navigation.agnikarma"), href: "/treatments/agnikarma" },
    { name: t("navigation.viddhakarma"), href: "/treatments/viddha-karma" },
    { name: t("navigation.panchakarma"), href: "/treatments/panchakarma" },
    { name: t("navigation.about"), href: "/about" },
    { name: t("navigation.contact"), href: "/contact" },
  ];

  return (
    <>
      {/* Top Trust Bar */}
      <div className="bg-[oklch(0.22_0.045_163)] text-white py-2 px-4 relative z-40">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs md:text-sm gap-2 sm:gap-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-xs"
            >
              <div className="size-2 bg-destructive rounded-full animate-pulse mr-1"></div>
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
            <div className="flex items-center gap-x-1 sm:gap-x-2">
              <Phone className="size-3 sm:w-4 sm:h-4" />
              <span className="font-semibold text-xs sm:text-sm">
                {t("navigation.phoneNumber")}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-x-1 sm:gap-x-2 h-7 sm:h-8 px-2 sm:px-3 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors duration-200 z-50 relative"
                >
                  <Globe className="size-3 sm:w-4 sm:h-4" />
                  <span className="text-xs font-semibold">
                    {getCurrentLanguageShort()}
                  </span>
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-9999">
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
      <LazyMotion features={domAnimation}>
      <m.nav
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
          <div className="absolute inset-0 bg-linear-to-br from-background via-background/95 to-muted/20 dark:from-background dark:via-background/95 dark:to-muted/30" />

          {/* Secondary Gradient for Depth */}
          <div className="absolute inset-0 bg-linear-to-tr from-transparent via-primary/3 to-secondary/8 dark:via-primary/5 dark:to-secondary/12" />

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
              <Link
                href="/"
                prefetch={false}
                className="flex items-center gap-x-2 sm:gap-x-3 touch-manipulation"
              >
                  <m.div className="relative size-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shrink-0 rounded-2xl border border-border/60 bg-white/90 dark:bg-slate-950/80 shadow-sm">
                    <Image
                      src="/assets/logo/logowithoutbackground.png"
                      alt={t("navigation.clinicName")}
                      fill
                      sizes="56px"
                      className="object-cover dark:hidden"
                    />
                    <Image
                      src="/assets/logo/dark-logo-withoutborder.png"
                      alt={t("navigation.clinicName")}
                      fill
                      sizes="56px"
                      className="hidden object-cover dark:block"
                    />
                  </m.div>
                  <div className="hidden sm:block min-w-0">
                    <h1 className="font-playfair text-base sm:text-lg lg:text-lg font-semibold text-gray-900 dark:text-white leading-tight truncate">
                      {t("navigation.clinicName")}
                    </h1>
                    <p className="text-[10px] sm:text-xs lg:text-xs text-primary -mt-1 truncate">
                      {t("navigation.clinicSubtitle")}
                    </p>
                  </div>
              </Link>
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center gap-x-4 xl:gap-x-6 flex-1 justify-center max-w-3xl">
              {navItems.map((item, index) => (
                <m.div
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
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "text-gray-700 dark:text-gray-300 hover:text-primary font-medium transition-colors duration-200 relative group text-sm lg:text-sm xl:text-sm whitespace-nowrap",
                      pathname === item.href && "text-primary"
                    )}
                  >
                    {item.name}
                    <m.span
                      className="absolute -bottom-1 left-0 h-0.5 bg-primary"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      animate={{ width: pathname === item.href ? "100%" : 0 }}
                      transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
                    />
                  </Link>
                </m.div>
              ))}
            </div>

            {/* Right Section - Clean and Simple */}
            <div className="flex items-center gap-x-1 sm:gap-x-2 lg:gap-x-3 shrink-0">
              {mounted ? (
                <>
                  {/* Authentication Buttons */}
                  {isAuthenticated && session ? (
                    <div className="flex items-center gap-x-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-x-1 sm:gap-x-2 h-8 px-2 sm:px-3 touch-manipulation"
                          >
                            <User className="size-4 shrink-0" />
                            <span className="hidden sm:inline text-sm truncate max-w-20">
                              {session.user.firstName || "User"}
                            </span>
                            <ChevronDown className="size-3 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={handleDashboardNavigation}>
                            <User className="size-4 mr-2" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="size-4 mr-2" />
                            Logout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ) : isAuthEnabled ? (
                    <div className="flex items-center gap-x-1 sm:gap-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleLogin}
                        className="text-primary hover:bg-primary/8 text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                      >
                        <span className="hidden sm:inline">Login</span>
                        <span className="sm:hidden">Login</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleRegister}
                        className="bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm px-2 sm:px-3 touch-manipulation"
                      >
                        <span className="hidden sm:inline">Get Started</span>
                        <span className="sm:hidden">Start</span>
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-8 w-16 rounded-full bg-muted/50 animate-pulse" />
                  <div className="h-8 w-20 rounded-full bg-muted/50 animate-pulse" />
                </div>
              )}

              {/* Primary CTA Button */}
              <Button
                type="button"
                size="sm"
                className="hidden lg:flex bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm px-3 sm:px-4 shadow-lg"
                onClick={() => (window.location.href = "/drdeshmukh")}
              >
                <Phone className="size-3 mr-1" />
                {t("navigation.bookConsultation")}
              </Button>

              {/* Mobile Book Consultation Button */}
              <Button
                type="button"
                size="sm"
                className="lg:hidden bg-primary hover:bg-primary/90 text-white text-xs px-3 py-2 h-8 shadow-lg touch-manipulation"
                onClick={() => (window.location.href = "/drdeshmukh")}
              >
                <Phone className="size-3 mr-1" />
                <span className="hidden sm:inline">
                  {t("navigation.bookConsultation")}
                </span>
                <span className="sm:hidden">Book</span>
              </Button>

              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="lg:hidden size-10 p-0 touch-manipulation hover:bg-primary/8"
                    aria-label="Toggle mobile menu"
                  >
                    <Menu className="size-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="left"
                  className="w-[min(22rem,calc(100vw-1rem))] max-w-none gap-0 p-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                >
                  <SheetHeader className="shrink-0 p-6 pr-12 border-b border-gray-200 dark:border-gray-700 bg-primary/5">
                    <SheetTitle className="text-left text-lg font-bold text-primary leading-tight tracking-wide flex items-center gap-x-3 min-w-0">
                      <div className="relative size-9 flex items-center justify-center overflow-hidden shrink-0 rounded-xl border border-border/60 bg-white/90 dark:bg-slate-950/80 shadow-sm">
                        <Image
                          src="/assets/logo/logowithoutbackground.png"
                          alt={t("navigation.clinicName")}
                          fill
                          sizes="36px"
                          className="object-cover dark:hidden"
                        />
                        <Image
                          src="/assets/logo/dark-logo-withoutborder.png"
                          alt={t("navigation.clinicName")}
                          fill
                          sizes="36px"
                          className="hidden object-cover dark:block"
                        />
                      </div>
                      <span className="min-w-0 truncate">
                        {t("navigation.clinicName")}
                      </span>
                    </SheetTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                      Navigate to your destination
                    </p>
                  </SheetHeader>

                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                    {/* Navigation Items */}
                    <div className="flex-1 px-6 py-5">
                      <div className="flex flex-col gap-y-3">
                        {navItems.map((item) => (
                          <MobileNavMenuItem
                            key={item.name}
                            item={item}
                            pathname={pathname}
                            onSelect={() => setIsMobileMenuOpen(false)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Authentication Section */}
                    <div className="shrink-0 p-6 pt-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      {isAuthenticated && session ? (
                        <div className="flex flex-col gap-y-4">
                          <div className="flex items-center gap-x-2 p-3 bg-primary/8 rounded-lg">
                            <User className="size-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {session.user.firstName || "User"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleDashboardNavigation();
                            }}
                            className="bg-primary hover:bg-primary/90 text-white h-12 text-base touch-manipulation shadow-md"
                          >
                            <User className="size-4 mr-2" />
                            Dashboard
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleLogout();
                            }}
                            className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-12 text-base touch-manipulation"
                          >
                            <LogOut className="size-4 mr-2" />
                            Logout
                          </Button>
                        </div>
                      ) : isAuthEnabled ? (
                        <div className="flex flex-col gap-y-4">
                          <Button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleLogin();
                            }}
                            variant="outline"
                            className="border-primary/35 text-primary hover:bg-primary/8 h-12 text-base touch-manipulation"
                          >
                            Login
                          </Button>
                          <Button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              handleRegister();
                            }}
                            className="bg-primary hover:bg-primary/90 text-white h-12 text-base touch-manipulation shadow-md"
                          >
                            Get Started
                          </Button>
                        </div>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.href = "/drdeshmukh";
                        }}
                        className="border-primary/35 text-primary hover:bg-primary/8 h-12 text-base touch-manipulation mt-3 w-full"
                      >
                        <Phone className="size-4 mr-2" />
                        {t("navigation.bookConsultation")}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </m.nav>
      </LazyMotion>
    </>
  );
};

export default Navigation;



