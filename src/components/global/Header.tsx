"use client";

import React from "react";
import Image from "next/image";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationBell } from "@/components/notifications";
import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLayoutStore } from "@/stores/layout.store";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
  showSidebarTrigger?: boolean;
}

const AVATAR_GRADIENTS = [
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-orange-500 via-amber-500 to-rose-500",
  "from-violet-500 via-fuchsia-500 to-pink-600",
  "from-rose-500 via-red-500 to-orange-500",
] as const;

function getAvatarGradient(initials?: string) {
  const value = String(initials || "U").toUpperCase();
  const hash = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

export function Header({ className, children, showSidebarTrigger = true }: HeaderProps) {
  const mounted = useHydrated();
  const { logoutAsync } = useAuth();
  const { push } = useRouter();
  const pathname = usePathname();

  const displayUser = useLayoutStore((state) => state.displayUser);
  const pageTitle = useLayoutStore((state) => state.pageTitle);
  const normalizedRole = displayUser?.role?.toUpperCase().replace(/\s+/g, "_") || "";
  // Patient pages already have in-page titles — hide the duplicate top label.
  const showPageTitle = Boolean(pageTitle) && !pathname?.startsWith("/patient");

  const handleProfileClick = () => {
    if (displayUser?.role) {
      const rolePath = displayUser.role.toLowerCase().replace(/_/g, "-");
      push(`/${rolePath}/profile`);
    } else {
      push("/patient/profile");
    }
  };

  const handleSettingsClick = () => {
    if (normalizedRole === "PATIENT") {
      push("/patient/profile");
      return;
    }
    if (displayUser?.role) {
      const rolePath = displayUser.role.toLowerCase().replace(/_/g, "-");
      if (["SUPER_ADMIN", "CLINIC_ADMIN"].includes(displayUser.role)) {
        push(`/${rolePath}/settings`);
      } else {
        push("/settings");
      }
    } else {
      push("/settings");
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200 border-b border-border/10 bg-background/80 backdrop-blur-md",
          className,
        )}
      >
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-3 px-3 md:h-14 md:px-5">
          <div className="flex min-w-0 flex-1 items-center">
            {showSidebarTrigger && (
              <SidebarTrigger className="-ml-1 mr-1.5 size-7 shrink-0 md:hidden" />
            )}

            {showPageTitle && (
              <m.h1
                key={pageTitle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate border-l-2 border-primary/50 pl-1 ml-1 text-sm font-semibold tracking-tight text-foreground md:text-base"
              >
                {pageTitle}
              </m.h1>
            )}
            {children}
          </div>

          <div className="flex items-center gap-2">
            {mounted ? (
              <>
                <div className="hidden items-center lg:flex">
                  <MinimalStatusIndicator />
                </div>

                <div className="mx-2 hidden h-4 w-px bg-border/40 sm:block" />

                <div className="flex items-center gap-1 rounded-full border border-border/50 bg-muted/30 p-0.5 shadow-sm backdrop-blur-md dark:bg-muted/10">
                  <NotificationBell className="size-7 rounded-full transition-colors hover:bg-muted/50" />

                  <div className="mx-0.5 h-4 w-px bg-border/40" />

                  <CompactThemeSwitcher />

                  <div className="mx-0.5 h-4 w-px bg-border/40" />

                  <LanguageSwitcher
                    variant="compact"
                    size="icon"
                    showFlag={true}
                    showLabel={false}
                    className="size-7 rounded-full transition-colors hover:bg-muted/50"
                  />

                  {displayUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "relative flex size-7 items-center justify-center overflow-hidden rounded-full bg-linear-to-br text-[10px] font-bold text-white ring-2 ring-primary/20 transition-all hover:ring-primary/40",
                            getAvatarGradient(displayUser.initials),
                          )}
                        >
                          {displayUser.avatar ? (
                            <Image
                              src={displayUser.avatar}
                              alt={displayUser.name}
                              fill
                              sizes="28px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="tracking-wide">{displayUser.initials}</span>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="mt-2 mr-4 w-64 rounded-2xl border border-border p-2 shadow-2xl"
                        align="end"
                      >
                        <DropdownMenuLabel className="p-3 font-normal">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold leading-none">{displayUser.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{displayUser.email}</p>
                            <div className="mt-2">
                              <Badge
                                variant="secondary"
                                className="h-5 px-2 py-0 text-[10px] font-bold uppercase tracking-wider"
                              >
                                {displayUser.role.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="opacity-50" />

                        <div className="gap-y-1 p-1">
                          <DropdownMenuItem
                            onClick={handleProfileClick}
                            className="cursor-pointer rounded-xl py-2 focus:bg-primary/5"
                          >
                            <User className="mr-3 size-4 text-primary" />
                            <span>{normalizedRole === "PATIENT" ? "Profile" : "My Profile"}</span>
                          </DropdownMenuItem>
                          {normalizedRole !== "PATIENT" && (
                            <DropdownMenuItem
                              onClick={handleSettingsClick}
                              className="cursor-pointer rounded-xl py-2 focus:bg-primary/5"
                            >
                              <Settings className="mr-3 size-4 text-primary" />
                              <span>Settings</span>
                            </DropdownMenuItem>
                          )}
                        </div>

                        <DropdownMenuSeparator className="opacity-50" />

                        <div className="p-1">
                          <DropdownMenuItem
                            onClick={() => logoutAsync()}
                            className="cursor-pointer rounded-xl py-2 text-destructive transition-colors focus:bg-destructive/5 focus:text-destructive"
                          >
                            <LogOut className="mr-3 size-4" />
                            <span>Log out</span>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            ) : (
              <div className="h-10 w-40 animate-pulse rounded-full bg-muted/50" />
            )}
          </div>
        </div>
      </header>
    </LazyMotion>
  );
}
