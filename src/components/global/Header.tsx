"use client";

import React from "react";
import { CompactThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationBell } from "@/components/notifications";
import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
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
import { motion } from "framer-motion";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export function Header({ className, children }: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  
  // ─── Zustand Store State ───────────────────────────────────────────────────
  const displayUser = useLayoutStore((state) => state.displayUser);
  const pageTitle = useLayoutStore((state) => state.pageTitle);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleProfileClick = () => {
    if (displayUser?.role) {
      const rolePath = displayUser.role.toLowerCase().replace(/_/g, "-");
      router.push(`/${rolePath}/profile`);
    } else {
      router.push("/patient/profile");
    }
  };

  const handleSettingsClick = () => {
    if (displayUser?.role) {
      const rolePath = displayUser.role.toLowerCase().replace(/_/g, "-");
      // Some roles might have specific settings, others use shared
      if (["SUPER_ADMIN", "CLINIC_ADMIN"].includes(displayUser.role)) {
        router.push(`/${rolePath}/settings`);
      } else {
        router.push("/settings");
      }
    } else {
      router.push("/settings");
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-200",
      className
    )}>
      <div className="flex h-16 items-center px-6 gap-4 max-w-6xl mx-auto">
        {/* Left side content (title, breadcrumbs, etc) */}
        <div className="flex-1 flex items-center">
          {pageTitle && (
            <motion.h1 
              key={pageTitle}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold tracking-tight text-foreground truncate pl-1 border-l-2 border-primary/50 ml-1"
            >
              {pageTitle}
            </motion.h1>
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
              <div className="flex items-center gap-1.5 p-1 bg-muted/30 dark:bg-muted/10 rounded-full border border-border/50 backdrop-blur-md shadow-sm">
                <NotificationBell className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors" />
                
                <div className="h-4 w-px bg-border/40 mx-0.5" />
                
                <CompactThemeSwitcher />
                
                <div className="h-4 w-px bg-border/40 mx-0.5" />
                
                <LanguageSwitcher 
                  variant="compact" 
                  size="icon" 
                  showFlag={true} 
                  showLabel={false}
                  className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors" 
                />

                {/* 3. Profile Dropdown (Connected to Zustand) */}
                {displayUser && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-primary/20 hover:ring-primary/40 transition-all overflow-hidden">
                        {displayUser.avatar ? (
                          <img src={displayUser.avatar} alt={displayUser.name} className="h-full w-full object-cover" />
                        ) : (
                          displayUser.initials
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
                      
                      <div className="p-1 space-y-1">
                        <DropdownMenuItem onClick={handleProfileClick} className="rounded-xl cursor-pointer py-2 focus:bg-primary/5">
                          <User className="mr-3 h-4 w-4 text-primary" />
                          <span>My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSettingsClick} className="rounded-xl cursor-pointer py-2 focus:bg-primary/5">
                          <Settings className="mr-3 h-4 w-4 text-primary" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                      </div>
                      
                      <DropdownMenuSeparator className="opacity-50" />
                      
                      <div className="p-1">
                        <DropdownMenuItem 
                          onClick={() => logout()} 
                          className="rounded-xl cursor-pointer py-2 text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
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
  );
}
