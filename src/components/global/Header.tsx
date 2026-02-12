"use client";

import React from "react";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { NotificationBell } from "@/components/notifications";
import { MinimalStatusIndicator } from "@/components/common/MinimalStatusIndicator";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  children?: React.ReactNode;
}

export function Header({ className, children }: HeaderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-200",
      className
    )}>
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Left side content (title, breadcrumbs, etc) */}
        <div className="flex-1 flex items-center">
          {children}
        </div>
        
        {/* Right side controls - Client only to prevent hydration/auth issues */}
        <div className="flex items-center gap-3">
           {mounted ? (
             <>
               <MinimalStatusIndicator />
               
               <div className="h-6 w-px bg-border mx-1" />
               
               <NotificationBell />
               <ThemeSwitcher />
               <LanguageSwitcher showLabel={false} />
             </>
           ) : (
             <div className="flex items-center gap-3 opacity-0">
                {/* Invisible placeholder to maintain layout height/width roughly */}
                <div className="w-24 h-8 bg-muted rounded" />
             </div>
           )}
        </div>
      </div>
    </header>
  );
}
