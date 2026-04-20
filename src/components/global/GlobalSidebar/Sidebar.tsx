// @ts-nocheck
"use client";

/**
 * ✅ GlobalSidebar - Refactored to use standard shadcn sidebar components
 * Follows SOLID, DRY, KISS principles
 * Uses: SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton
 */

import React, { useState, useCallback, useMemo, memo } from "react";
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
import { useRouter, usePathname } from "next/navigation";
import { useRBAC } from "@/hooks/utils/useRBAC";
import { Permission } from "@/types/rbac.types";
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
import { LogOut, Menu } from "lucide-react";
import { useLayoutStore } from "@/stores/layout.store";
import { motion } from "framer-motion";

// ============================================================================
// TYPES
// ============================================================================

import { SidebarLink } from "@/lib/utils/index";

export interface SidebarProps {
  links: SidebarLink[];
  user: { name: string; avatarUrl?: string; role?: string };
  children: React.ReactNode;
}

// ============================================================================
// LOGO COMPONENTS
// ============================================================================

const Logo = memo(function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 py-2"
    >
      <div className="size-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
        <span className="text-primary-foreground font-bold text-xl">I</span>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "linear" }}
        className="text-lg font-bold tracking-tight text-sidebar-foreground truncate"
      >
        Viddhakarma
      </motion.span>
    </Link>
  );
});

const LogoIcon = memo(function LogoIcon() {
  return (
    <Link
      href="/"
      className="flex items-center justify-center py-2"
    >
      <div className="size-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
        <span className="text-primary-foreground font-bold text-xl">I</span>
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
  const [avatarError, setAvatarError] = useState(false);

  const { hasPermission } = useRBAC();

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
    ASSISTANT_DOCTOR: "/doctor/profile",
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

  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      {/* Header with Logo */}
      <SidebarHeader className={cn("py-4 px-4 transition-all duration-300", !open && "px-2")}>
        <div className="flex items-center">
          <div className={cn("flex-1 flex items-center", open ? "justify-start" : "justify-center")}>
            {open ? <Logo /> : <LogoIcon />}
          </div>
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className={cn("flex-1 overflow-y-auto overflow-x-hidden", open ? "p-2" : "p-0 py-2")}>
        <SidebarMenu>
          {filteredLinks.map((link, idx) => {
            const isLogout = link.href === "#logout" || link.title === t("sidebar.logout");
            const Icon = link.icon;

            return (
              <SidebarMenuItem key={idx} className="">
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.href}
                  tooltip={link.title}
                  className={cn("text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors overflow-hidden", !open && "mx-auto justify-center")}
                  onClick={(e: any) => {
                    if (isLogout) {
                      e.preventDefault();
                      onLogoutClick();
                    }
                    handleLinkClick();
                  }}
                >
                  {isLogout ? (
                    <button className={cn("flex items-center gap-2 w-full text-destructive hover:text-destructive/80", !open && "justify-center")}>
                      <span className="size-4 flex items-center justify-center shrink-0">
                        {typeof Icon === 'function' && !Icon.render ? Icon() : <Icon className="size-4" />}
                      </span>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="truncate whitespace-pre"
                        >
                          {link.title}
                        </motion.span>
                      )}
                    </button>
                  ) : (
                    <Link href={link.href} className={cn("flex items-center gap-2 w-full", !open && "justify-center")}>
                      <span className="size-4 flex items-center justify-center shrink-0">
                        {typeof Icon === 'function' && !Icon.render ? Icon() : <Icon className="size-4" />}
                      </span>
                      {open && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="truncate whitespace-pre"
                        >
                          {link.title}
                        </motion.span>
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
      <SidebarFooter className="border-t border-sidebar-border/50 px-2 py-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              className={cn("h-auto p-2 hover:bg-sidebar-accent transition-colors overflow-hidden", !open && "mx-auto justify-center")}
              onClick={handleLinkClick}
            >
              <Link href={profileRoute} className={cn("flex items-center gap-3 w-full", !open && "justify-center")}>
                {!avatarError && user.avatarUrl ? (
                  <NextImage
                    src={user.avatarUrl}
                    className="size-8 shrink-0 rounded-full object-cover border border-sidebar-border/50"
                    width={32}
                    height={32}
                    alt="Avatar"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="size-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {firstLetter}
                  </div>
                )}
                {open && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col min-w-0 flex-1 text-left"
                  >
                    <span className="truncate text-sm text-sidebar-foreground font-semibold leading-tight">
                      {user.name}
                    </span>
                    <span className="truncate text-[10px] text-sidebar-foreground/50 uppercase tracking-wider font-bold">
                      {displayRole || t("common.user")}
                    </span>
                  </motion.div>
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
  const { logout } = useAuth();
  const router = useRouter();
  const { startLoading, stopLoading } = useGlobalLoading();
  const { t } = useTranslation();

  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((state) => state.setSidebarCollapsed);

  // Map "collapsed" to "open" logic: open is !collapsed
  const open = !isSidebarCollapsed;
  const setOpen = useCallback((o: boolean) => setSidebarCollapsed(!o), [setSidebarCollapsed]);



  const handleLogoutClick = useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    startLoading("Logging out...");
    try {
      await logout();
      router.replace(ROUTES.LOGIN);
    } catch {
      stopLoading();
      showErrorToast("Logout failed. Please try again.", {
        id: TOAST_IDS.AUTH.LOGOUT,
      });
      router.replace(ROUTES.LOGIN);
    } finally {
      setShowLogoutDialog(false);
    }
  }, [logout, router, startLoading, stopLoading]);

  return (
    <>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <div className={cn("flex h-screen w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden")}>
          <SidebarComponent
            collapsible="icon"
            className={cn(
              "border-none bg-neutral-100 dark:bg-neutral-900 text-sidebar-foreground transition-all duration-300 ease-in-out"
            )}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <SidebarInner
              links={links}
              user={user}
              onLogoutClick={handleLogoutClick}
            />
          </SidebarComponent>

          <div className="flex flex-1 overflow-hidden">
             <div className="flex flex-1 flex-col h-full w-full overflow-hidden rounded-tl-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-xl">
                {children}
             </div>
          </div>
        </div>
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
  );
}
