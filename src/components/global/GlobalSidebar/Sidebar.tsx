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
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useGlobalLoading } from "@/hooks/utils/useGlobalLoading";
import { ROUTES } from "@/lib/config/routes";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/context";
import { translateSidebarLinks } from "@/lib/utils/index";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface SidebarLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarProps {
  links: SidebarLinkItem[];
  user: { name: string; avatarUrl?: string };
  children: React.ReactNode;
}

// ============================================================================
// LOGO COMPONENTS
// ============================================================================

const Logo = memo(function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 py-2 text-lg font-semibold"
    >
      <span className="text-primary">Ishswami</span>
    </Link>
  );
});

const LogoIcon = memo(function LogoIcon() {
  return (
    <Link
      href="/"
      className="flex items-center justify-center py-2 text-lg font-bold text-primary"
    >
      I
    </Link>
  );
});

// ============================================================================
// SIDEBAR CONTENT (Inner component to access useSidebar)
// ============================================================================

interface SidebarInnerProps {
  links: SidebarLinkItem[];
  user: { name: string; avatarUrl?: string };
  onLogoutClick: () => void;
}

function SidebarInner({ links, user, onLogoutClick }: SidebarInnerProps) {
  const { open } = useSidebar();
  const { t } = useTranslation();
  const [avatarError, setAvatarError] = useState(false);

  const translatedLinks = useMemo(
    () => translateSidebarLinks(links, t),
    [links, t]
  );

  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";

  return (
    <>
      {/* Header with Logo */}
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-center">
          {open ? <Logo /> : <LogoIcon />}
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
          {translatedLinks.map((link, idx) => {
            const isLogout =
              link.label === t("sidebar.logout") || link.label === "Logout";

            if (isLogout) {
              return (
                <SidebarMenuItem key={idx}>
                  <SidebarMenuButton
                    onClick={onLogoutClick}
                    className="text-destructive hover:bg-destructive/10"
                    {...(!open && { tooltip: link.label })}
                  >
                    <LogOut className="size-4" />
                    {open && <span>{link.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={idx}>
                <SidebarMenuButton asChild {...(!open && { tooltip: link.label })}>
                  <Link href={link.href}>
                    <span className="size-4 flex items-center justify-center">
                      {link.icon}
                    </span>
                    {open && <span>{link.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {/* Theme and Language Controls - Only when expanded */}
        {open && (
          <div className="mt-4 space-y-3 px-2">
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("theme.toggleTheme")}
                </span>
                <ThemeSwitcher />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("language.changeLanguage")}
                </span>
                <LanguageSwitcher showLabel={true} />
              </div>
            </div>
          </div>
        )}
      </SidebarContent>

      {/* Footer with User Info */}
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start" {...(!open && { tooltip: user.name })}>
              {!avatarError && user.avatarUrl ? (
                <NextImage
                  src={user.avatarUrl}
                  className="size-8 shrink-0 rounded-full object-cover"
                  width={32}
                  height={32}
                  alt="Avatar"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="size-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {firstLetter}
                </div>
              )}
              {open && (
                <span className="truncate text-sm font-medium">{user.name}</span>
              )}
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
      toast.error("Logout failed. Please try again.");
      router.replace(ROUTES.LOGIN);
    } finally {
      setShowLogoutDialog(false);
    }
  }, [logout, router, startLoading, stopLoading]);

  return (
    <>
      <SidebarProvider defaultOpen={false}>
        <div className={cn("flex h-screen w-full")}>
          <SidebarComponent collapsible="icon" className="border-r">
            <SidebarInner
              links={links}
              user={user}
              onLogoutClick={handleLogoutClick}
            />
          </SidebarComponent>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
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
