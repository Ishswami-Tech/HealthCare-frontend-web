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
import { useRouter } from "next/navigation";
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
  const { logout } = useAuth();
  const { push } = useRouter();
  
  // ─── Zustand Store State ───────────────────────────────────────────────────
  const displayUser = useLayoutStore((state) => state.displayUser);
  const pageTitle = useLayoutStore((state) => state.pageTitle);
  const normalizedRole = displayUser?.role?.toUpperCase().replace(/\s+/g, "_") || "";

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
      // Some roles might have specific settings, others use shared
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
      <header className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200 border-b border-border/10 bg-background/80 backdrop-blur-md",
        className
      )}>
      <div className="flex h-12 md:h-14 items-center px-3 md:px-5 gap-3 max-w-6xl mx-auto">
        {/* Left side content (title, breadcrumbs, etc) */}
        <div className="flex-1 flex items-center min-w-0">
          {showSidebarTrigger && (
            <SidebarTrigger className="-ml-1 mr-1.5 md:hidden shrink-0 size-7" />
          )}
          
          {pageTitle && (
            <m.h1 
              key={pageTitle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm md:text-base font-semibold tracking-tight text-foreground truncate pl-1 border-l-2 border-primary/50 ml-1"
            >
              {pageTitle}
            </m.h1>
          )}
          {children}
        </div>
        
        {/* Right side controls - Client only to prevent hydration issues */}
        <div className="flex items-center gap-2">
          {mounted ? (
            <>
              {/* 1. Status Indicator */}
              <div className="hidden lg:flex items-center">
                <MinimalStatusIndicator />
              </div>

              <div className="hidden sm:block h-4 w-px bg-border/40 mx-2" />

              {/* 2. Utility Cluster */}
              <div className="flex items-center gap-1 p-0.5 bg-muted/30 dark:bg-muted/10 rounded-full border border-border/50 backdrop-blur-md shadow-sm">
                <NotificationBell className="size-7 rounded-full hover:bg-muted/50 transition-colors" />
                
                <div className="h-4 w-px bg-border/40 mx-0.5" />
                
                <CompactThemeSwitcher />
                
                <div className="h-4 w-px bg-border/40 mx-0.5" />
                
                <LanguageSwitcher 
                  variant="compact" 
                  size="icon" 
                  showFlag={true} 
                  showLabel={false}
                  className="size-7 rounded-full hover:bg-muted/50 transition-colors" 
                />

                {/* 3. Profile Dropdown (Connected to Zustand) */}
                {displayUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "relative size-7 rounded-full bg-linear-to-br flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-primary/20 hover:ring-primary/40 transition-all overflow-hidden",
                          getAvatarGradient(displayUser.initials)
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
                    <DropdownMenuContent className="w-64 p-2 mt-2 mr-4 rounded-2xl shadow-2xl border border-border" align="end">
                      <DropdownMenuLabel className="font-normal p-3">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-bold leading-none">{displayUser.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{displayUser.email}</p>
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-5">
                              {displayUser.role.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="opacity-50" />
                      
                      <div className="p-1 gap-y-1">
                        <DropdownMenuItem onClick={handleProfileClick} className="rounded-xl cursor-pointer py-2 focus:bg-primary/5">
                          <User className="mr-3 size-4 text-primary" />
                          <span>{normalizedRole === "PATIENT" ? "Profile" : "My Profile"}</span>
                        </DropdownMenuItem>
                        {normalizedRole !== "PATIENT" && (
                          <DropdownMenuItem onClick={handleSettingsClick} className="rounded-xl cursor-pointer py-2 focus:bg-primary/5">
                            <Settings className="mr-3 size-4 text-primary" />
                            <span>Settings</span>
                          </DropdownMenuItem>
                        )}
                      </div>
                      
                      <DropdownMenuSeparator className="opacity-50" />
                      
                      <div className="p-1">
                        <DropdownMenuItem 
                          onClick={() => logout()} 
                          className="rounded-xl cursor-pointer py-2 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
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
            <div className="h-10 w-40 bg-muted/50 rounded-full animate-pulse" />
          )}
        </div>
      </div>
      </header>
    </LazyMotion>
  );
}


