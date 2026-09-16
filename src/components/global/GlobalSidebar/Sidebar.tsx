// @ts-nocheck
"use client";

/**
 * ✅ GlobalSidebar - Refactored to use standard shadcn sidebar components
 * Follows SOLID, DRY, KISS principles
 * Uses: SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton
 */

import React, { useState, useCallback, useMemo, memo, useRef } from "react";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  useSidebar,
} from "../../ui/sidebar";
import { cn } from "@/lib/utils/index";
import Link from "next/link";
import NextImage from "next/image";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
import { useQueryClient } from "@tanstack/react-query";
import { prefetchMyAppointments } from "@/hooks/query/useAppointments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useGlobalLoading } from "@/hooks/utils/useGlobalLoading";
import { ROUTES } from "@/lib/config/routes";
import { useTranslation } from "@/lib/i18n/context";
import { translateSidebarLinks } from "@/lib/utils/index";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutStore } from "@/stores/layout.store";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { MobileBottomBar } from "@/components/global/GlobalSidebar/MobileBottomBar";

// ============================================================================
// TYPES
// ============================================================================

import { SidebarLink } from "@/lib/utils/index";

function splitHref(href: string): { pathname: string; searchParams: URLSearchParams } {
  const [path, search = ""] = href.split("?");
  return {
    pathname: path || "/",
    searchParams: new URLSearchParams(search),
  };
}

/**
 * True if the link points at the (role-scoped) appointments list page.
 * Used to gate the hover-warm prefetch so we only warm the cache for the
 * page the user is actually about to visit.
 */
function isAppointmentsHref(href: string): boolean {
  if (!href || href.startsWith("#")) return false;
  return /\/appointments(\/|\?|$)/.test(href);
}

function normalizeSidebarPath(pathname: string): string {
  const aliasMap: Record<string, string> = {
    "/patient/check-in": "/patient/appointments",
  };

  return aliasMap[pathname] || pathname;
}

function isSidebarLinkActive(currentPathname: string, currentSearch: URLSearchParams, href: string): boolean {
  const { pathname: targetPathname, searchParams: targetSearch } = splitHref(href);
  const normalizedCurrentPathname = normalizeSidebarPath(currentPathname);
  const normalizedTargetPathname = normalizeSidebarPath(targetPathname);

  const pathMatches =
    normalizedCurrentPathname === normalizedTargetPathname ||
    (normalizedTargetPathname !== "/" &&
      normalizedCurrentPathname.startsWith(`${normalizedTargetPathname}/`));

  if (!pathMatches) {
    return false;
  }

  if ([...targetSearch.keys()].length === 0) {
    return true;
  }

  for (const [key, value] of targetSearch.entries()) {
    if (currentSearch.get(key) !== value) {
      return false;
    }
  }

  return true;
}

export interface SidebarProps {
  links: SidebarLink[];
  user: { name: string; avatarUrl?: string; role?: string };
  children: React.ReactNode;
}

// ============================================================================
// LOGO COMPONENTS
// ============================================================================

/** Heart-and-leaf brand mark. Inline SVG so it inherits the theme colours. */
const BrandMark = memo(function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <path
          d="M12 20.5s-6.8-4.2-6.8-9A3.9 3.9 0 0 1 12 8.3a3.9 3.9 0 0 1 6.8 3.2c0 4.8-6.8 9-6.8 9Z"
          fill="currentColor"
          opacity="0.95"
        />
        <path
          d="M12 8.4c0-2.7 1.9-4.9 4.6-5.2.3 2.9-1.6 5.2-4.6 5.6Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
    </span>
  );
});

const Logo = memo(function Logo() {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href="/" prefetch={false} className="flex items-center gap-2.5 py-1 min-w-0">
      <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-600/15 p-1 border border-emerald-500/20">
        {!imageError ? (
          <NextImage
            src="/assets/logo/logowithoutbackground.png"
            alt="Dr. Chandrakumar Deshmukh"
            width={32}
            height={32}
            className="object-contain size-full"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <BrandMark />
        )}
      </div>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "linear" }}
        className="flex min-w-0 flex-col leading-snug"
      >
        <span className="truncate text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
          Dr. Chandrakumar Deshmukh
        </span>
        <span className="truncate text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          Viddhakarma • Your Health, Our Care
        </span>
      </m.div>
    </Link>
  );
});

const LogoIcon = memo(function LogoIcon() {
  const [imageError, setImageError] = useState(false);

  return (
    <Link href="/" prefetch={false} className="flex items-center justify-center py-1">
      <div className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-600/15 p-1 border border-emerald-500/20">
        {!imageError ? (
          <NextImage
            src="/assets/logo/logowithoutbackground.png"
            alt="Dr. Chandrakumar Deshmukh"
            width={32}
            height={32}
            className="object-contain size-full"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <BrandMark />
        )}
      </div>
    </Link>
  );
});

// ============================================================================
// SIDEBAR CONTENT (Inner component to access useSidebar)
// ============================================================================

interface SidebarInnerProps {
  links: SidebarLink[];
  user: { name: string; avatarUrl?: string; role?: string };
  onLogoutClick: () => void;
}

function SidebarInner({ links, user, onLogoutClick }: SidebarInnerProps) {
  const { open, setOpenMobile, isMobile } = useSidebar(); // Access setOpen to toggle on hover
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [avatarError, setAvatarError] = useState(false);
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((state) => state.setSidebarCollapsed);

  const { hasPermission } = useRBAC();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  // Track which links have already been warmed so we only fire once per mount.
  const prefetchedHrefs = useRef<Set<string>>(new Set());

  /**
   * Hover-warm: when the user hovers an `/.../appointments` link in the
   * sidebar, kick off a background prefetch into the React Query cache.
   * The dashboard's bootstrap prefetch covers first paint, but this catches
   * users who land on a non-appointments page first and then hover the link
   * before navigating.
   */
  const handleAppointmentsHover = useCallback(
    (href: string) => {
      if (!session?.user?.id) return;
      if (prefetchedHrefs.current.has(href)) return;
      prefetchedHrefs.current.add(href);
      void prefetchMyAppointments(queryClient, {
        userId: session.user.id,
        userRole: session.user.role,
        hasPermission,
      });
    },
    [queryClient, session?.user?.id, session?.user?.role, hasPermission]
  );

  const translatedLinks = useMemo(
    () => translateSidebarLinks(links, t),
    [links, t]
  );

  const filteredLinks = useMemo(() => {
    return translatedLinks.filter(link => {
      if (!link.permission) return true;
      return hasPermission(link.permission);
    });
  }, [translatedLinks, hasPermission]);

  const profileRouteByRole: Record<string, string> = {
    SUPER_ADMIN: "/super-admin/settings",
    CLINIC_ADMIN: "/clinic-admin/settings",
    DOCTOR: "/doctor/profile",
    ASSISTANT_DOCTOR: "/assistant-doctor/profile",
    PATIENT: "/patient/profile",
    RECEPTIONIST: "/receptionist/profile",
    PHARMACIST: "/pharmacist/profile",
    FINANCE_BILLING: "/settings",
    CLINIC_LOCATION_HEAD: "/settings",
  };

  const normalizedRole = (user.role || "").toUpperCase().replace(/\s+/g, "_");
  const profileRoute = profileRouteByRole[normalizedRole] || "/patient/profile";
  const displayRole = (normalizedRole || "USER")
    .replace(/_/g, " ");
  const isProfileActive = isSidebarLinkActive(pathname, new URLSearchParams(searchParams.toString()), profileRoute);
  const activeNavClass =
    "!bg-emerald-50 !text-emerald-700 font-semibold dark:!bg-emerald-950/50 dark:!text-emerald-300";

  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      {/* Header with Logo */}
      {/* Header with Logo */}
      <SidebarHeader className={cn("py-4 transition-all duration-300", open ? "px-3" : "px-2")}>
        <div className={cn("flex items-center", open ? "justify-between" : "justify-center w-full")}>
          {open && (
            <div className="flex-1 flex items-center justify-start overflow-hidden">
              <Logo />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className={cn("hidden lg:flex text-muted-foreground hover:text-foreground hover:bg-muted shrink-0", open ? "h-8 w-8 ml-2" : "h-10 w-10")}
          >
            <Menu className={cn(open ? "h-5 w-5" : "h-6 w-6")} />
          </Button>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className={cn("flex-1 overflow-y-auto overflow-x-hidden", open ? "px-3 py-2" : "p-0 py-2")}>
        <SidebarMenu className="gap-1">
          {filteredLinks.map((link) => {
            const isLogout = link.href === "#logout" || link.title === t("sidebar.logout");
            const Icon = link.icon || Menu;
            const isActive = isSidebarLinkActive(pathname, searchParams, link.href);

            return (
              <SidebarMenuItem key={link.href} className="">
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={link.title}
                  className={cn(
                    "relative h-11 rounded-xl px-3 text-[13.5px] font-medium transition-colors overflow-hidden",
                    isActive
                      ? activeNavClass
                      : "text-sidebar-foreground/75 hover:bg-accent hover:text-sidebar-foreground",
                    !open && "mx-auto justify-center"
                  )}
                  onClick={(e: any) => {
                    if (isLogout) {
                      e.preventDefault();
                      onLogoutClick();
                      handleLinkClick();
                      return;
                    }
                    // Let Next <Link> own soft navigation + prefetch.
                    // preventDefault + router.push was delaying leaves from
                    // heavy pages (e.g. Payments) by several seconds.
                    handleLinkClick();
                  }}
                >
                  {isLogout ? (
                    <button type="button" className={cn("flex h-full items-center gap-3 w-full text-destructive hover:text-destructive/80", !open && "justify-center")}>
                      <span className="flex size-[18px] shrink-0 items-center justify-center">
                        <Icon className="size-[18px]" />
                      </span>
                      {open && (
                        <span className="truncate whitespace-pre">
                          {link.title}
                        </span>
                      )}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      prefetch
                      scroll={false}
                      onMouseEnter={
                        isAppointmentsHref(link.href)
                          ? () => handleAppointmentsHover(link.href)
                          : undefined
                      }
                      onFocus={
                        isAppointmentsHref(link.href)
                          ? () => handleAppointmentsHover(link.href)
                          : undefined
                      }
                      className={cn("relative flex h-full items-center gap-3 w-full", !open && "justify-center")}
                    >
                      {isActive && (
                        <span
                          className="absolute -left-3 top-1/2 h-[55%] w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-600 dark:bg-emerald-400"
                          aria-hidden="true"
                        />
                      )}
                      <span className="flex size-[18px] shrink-0 items-center justify-center">
                        <Icon className="size-[18px]" />
                      </span>
                      {open && (
                        <span className="truncate whitespace-pre">
                          {link.title}
                        </span>
                      )}
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "relative h-auto rounded-xl p-2 transition-colors overflow-hidden",
                isProfileActive ? activeNavClass : "hover:bg-accent",
                !open && "mx-auto justify-center"
              )}
              onClick={() => {
                handleLinkClick();
              }}
            >
              <Link
                href={profileRoute}
                prefetch
                scroll={false}
                className={cn("relative flex h-full items-center gap-3 w-full", !open && "justify-center")}
              >
                {isProfileActive && (
                  <span className="absolute -left-3 top-1/2 h-[55%] w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-600 dark:bg-emerald-400" aria-hidden="true" />
                )}
                {!avatarError && user.avatarUrl ? (
                  <NextImage
                    src={user.avatarUrl}
                    className="size-9 shrink-0 rounded-full object-cover border border-sidebar-border"
                    width={36}
                    height={36}
                    alt="Avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="size-9 flex items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shrink-0">
                    {firstLetter}
                  </div>
                )}
                {open && (
                  <m.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col min-w-0 flex-1 text-left"
                  >
                    <span className="truncate text-sm text-sidebar-foreground font-semibold leading-tight">
                      {user.name}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {displayRole || t("common.user")}
                    </span>
                  </m.div>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

// ============================================================================
// MAIN SIDEBAR COMPONENT
// ============================================================================

export default function Sidebar({ links, user, children }: SidebarProps) {
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { logout, logoutAsync } = useAuth();
  const { push } = useRouter();
  const { startLoading, stopLoading } = useGlobalLoading();
  const { t } = useTranslation();

  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((state) => state.setSidebarCollapsed);

  // Map "collapsed" to "open" logic: open is !collapsed
  const open = !isSidebarCollapsed;
  const setOpen = useCallback((o: boolean) => setSidebarCollapsed(!o), [setSidebarCollapsed]);



  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    startLoading("Logging out...");
    try {
      // Use logoutAsync for proper promise handling
      await logoutAsync();
      // Success and redirect is handled by useMutationOperation callbacks
      push(ROUTES.LOGIN);
    } catch {
      stopLoading();
      showErrorToast("Logout failed. Please try again.", {
        id: TOAST_IDS.AUTH.LOGOUT,
      });
      push(ROUTES.LOGIN);
    } finally {
      setShowLogoutDialog(false);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <>
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <div className={cn("flex h-screen w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden")}>
            <SidebarComponent
              collapsible="icon"
              className={cn(
                "border-none bg-neutral-100 dark:bg-neutral-900 text-sidebar-foreground transition-all duration-300 ease-in-out"
              )}
            >
              <Suspense fallback={null}>
                <SidebarInner
                  links={links}
                  user={user}
                  onLogoutClick={handleLogoutClick}
                />
              </Suspense>
            </SidebarComponent>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col h-full w-full overflow-hidden rounded-tl-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-xl">
                {children}
              </div>
            </div>
          </div>
          <MobileBottomBar links={links} />
        </SidebarProvider>

        {/* Logout Confirmation Dialog */}
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t("auth.logout")} {t("common.confirm")}
              </DialogTitle>
            </DialogHeader>
            <Alert variant="destructive">
              <AlertTitle>{t("auth.logoutSuccess")}?</AlertTitle>
              <AlertDescription>{t("auth.loginSuccess")}</AlertDescription>
            </Alert>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={handleLogoutConfirm}>
                <LogOut className="size-4 mr-2" />
                {t("sidebar.logout")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </LazyMotion>
  );
}
