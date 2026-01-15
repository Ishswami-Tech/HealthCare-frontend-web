"use client";
import React, { useState, useCallback, useMemo, memo } from "react";
import { Sidebar as SidebarComponent, SidebarBody, SidebarLink } from "../../ui/sidebar";
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
import { useLoadingOverlay } from "@/app/providers/LoadingOverlayContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher"; // ✅ Use consolidated component
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/context";
import { translateSidebarLinks } from "@/lib/utils/index";

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

const Logo = memo(() => (
  <Link
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    <span className="font-medium whitespace-pre text-black dark:text-white">
      Ishswami
    </span>
  </Link>
));

const LogoIcon = memo(() => (
  <Link
    href="#"
    className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
  >
    {/* <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-red-500 dark:bg-white" /> */}
    I
  </Link>
));

export default function Sidebar({
  links,
  user,
  children,
}: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const firstLetter = user.name?.charAt(0).toUpperCase() || "U";
  const { logout } = useAuth();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { setOverlay } = useLoadingOverlay();
  const { t } = useTranslation();

  // Translate sidebar links
  const translatedLinks = useMemo(
    () => translateSidebarLinks(links, t),
    [links, t]
  );

  // Memoize a random color for this user (based on their name)
  const avatarColor = React.useMemo(() => {
    const COLORS = [
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
      "bg-primary",
    ];
    if (!user.name) return COLORS[0];
    const hash = user.name
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return COLORS[hash % COLORS.length];
  }, [user.name]);

  const handleLinkClick = useCallback(
    (link: SidebarLinkItem, e: React.MouseEvent) => {
      if (link.label === "Logout") {
        e.preventDefault();
        setShowLogoutDialog(true);
      }
    },
    []
  );

  const handleLogoutConfirm = useCallback(async () => {
    setOverlay({ show: true, variant: "logout" }); // Show global overlay
    try {
      await logout();
      router.replace("/auth/login");
    } catch {
      setOverlay({ show: false });
      toast.error("Logout failed. Please try again.");
      router.replace("/auth/login");
    } finally {
      setShowLogoutDialog(false);
    }
  }, [logout, router, setOverlay]);

  return (
    <>
      <div
        className={cn(
          "flex w-full flex-1 flex-col overflow-hidden border-border bg-muted md:flex-row",
          "h-screen"
        )}
      >
        <SidebarComponent open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-muted text-foreground rounded-lg border-1 m-1 border-border ">
            <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <div className="bg-white rounded-lg shadow p-3 my-6 flex items-center justify-center">
                {open ? <Logo /> : <LogoIcon />}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {translatedLinks.map((link, idx) => {
                  const isLogout =
                    link.label === t("sidebar.logout") ||
                    link.label === "Logout";
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={
                        isLogout ? (e) => handleLinkClick(link, e) : undefined
                      }
                      className="w-full text-left"
                      disabled={!isLogout}
                      aria-label={isLogout ? t("sidebar.logout") : undefined}
                    >
                      <SidebarLink
                        link={{ ...link, href: isLogout ? "#" : link.href }}
                        className={
                          isLogout
                            ? "bg-destructive/10 hover:bg-destructive/20 active:bg-destructive/30 text-destructive font-semibold  transition-colors duration-200 rounded-lg px-2 py-2"
                            : "hover:bg-muted active:bg-muted/80 transition-colors duration-200 rounded-lg px-2  py-2 text-foreground "
                        }
                      />
                    </button>
                  );
                })}
              </div>

              {/* Theme and Language Controls */}
              {open && (
                <div className="mt-4 space-y-3">
                  <Separator />
                  <div className="px-2 space-y-2">
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
            </div>
            <div>
              <SidebarLink
                link={{
                  label: user.name,
                  href: "#",
                  icon:
                    !avatarError && user.avatarUrl ? (
                      <NextImage
                        src={user.avatarUrl}
                        className="size-9 shrink-0 rounded-full object-cover"
                        width={50}
                        height={50}
                        alt="Avatar"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div
                        className={`size-6 flex items-center justify-center rounded-lg ${avatarColor} text-white font-bold text-md`}
                      >
                        {firstLetter}
                      </div>
                    ),
                }}
                className="bg-muted rounded-lg px-3 py-2 text-foreground transition-colors duration-200 hover:bg-muted/80"
              />
            </div>
          </SidebarBody>
        </SidebarComponent>
        <div className=" bg-background flex-1 overflow-x-auto ">{children}</div>
      </div>

      {/* Dialog moved outside sidebar structure to ensure it appears above mobile sidebar */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent showCloseButton={true} className="!z-[9999]">
          <DialogHeader>
            <DialogTitle>
              {t("auth.logout")} {t("common.confirm")}
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTitle>{t("auth.logoutSuccess")}?</AlertTitle>
            <AlertDescription>{t("auth.loginSuccess")}</AlertDescription>
          </Alert>
          <DialogFooter>
            <button
              type="button"
              className="bg-muted text-foreground rounded px-4 py-2 mr-2"
              onClick={() => setShowLogoutDialog(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="bg-destructive text-destructive-foreground rounded px-4 py-2 flex items-center gap-2"
              onClick={handleLogoutConfirm}
            >
              {t("sidebar.logout")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
