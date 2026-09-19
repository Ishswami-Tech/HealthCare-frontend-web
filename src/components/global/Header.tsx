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
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
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
          "sticky top-0 z-40 w-full border-b border-border bg-card",
          className,
        )}
      >
        <div className="flex h-14 w-full items-center gap-3 px-4 sm:px-6 md:h-16 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showSidebarTrigger && (
              <SidebarTrigger className="-ml-1 size-8 shrink-0 md:hidden" />
            )}

            {showPageTitle && (
              <m.h1
                key={pageTitle}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate text-sm font-semibold tracking-tight text-foreground md:text-base"
              >
                {pageTitle}
              </m.h1>
            )}
            {children}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {mounted ? (
              <>
                <div className="hidden items-center lg:flex">
                  <MinimalStatusIndicator />
                </div>

                <NotificationBell className="size-9 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />

                <CompactThemeSwitcher />

                <LanguageSwitcher
                  variant="compact"
                  size="icon"
                  showFlag={true}
                  showLabel={false}
                  className="size-9 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                />

                {displayUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1 pl-1 pr-2 text-left transition-colors hover:bg-accent sm:pr-3"
                      >
                        <span
                          className={cn(
                            "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br text-[11px] font-bold text-white",
                            getAvatarGradient(displayUser.initials),
                          )}
                        >
                          {displayUser.avatar ? (
                            <Image
                              src={displayUser.avatar}
                              alt={displayUser.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <span className="tracking-wide">{displayUser.initials}</span>
                          )}
                        </span>
                        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
                          <span className="truncate text-[13px] font-semibold text-foreground">
                            {displayUser.name}
                          </span>
                          <span className="truncate text-[11px] capitalize text-muted-foreground">
                            {displayUser.role.replace(/_/g, " ").toLowerCase()}
                          </span>
                        </span>
                        <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
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
              </>
            ) : (
              <div className="h-10 w-40 animate-pulse rounded-xl bg-muted/50" />
            )}
          </div>
        </div>
      </header>
    </LazyMotion>
  );
}
