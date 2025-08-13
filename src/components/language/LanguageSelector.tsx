"use client";

import React from "react";
import { Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = "ghost",
  size = "default",
  showLabel = true,
  className,
}: LanguageSelectorProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const languages: {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
  }[] = [
    { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
    { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  ];

  const setLanguage = (newLocale: string) => {
    // Set locale cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    // Refresh the page to apply new locale
    window.location.reload();
  };

  const currentLanguage =
    languages.find((lang) => lang.code === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("flex items-center space-x-2", className)}
        >
          <Globe className="w-4 h-4" />
          {showLabel && (
            <>
              <span className="hidden sm:inline">
                {currentLanguage.nativeName}
              </span>
              <span className="sm:hidden">{currentLanguage.flag}</span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center space-x-3 cursor-pointer",
              locale === lang.code &&
                "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lang.name}
              </span>
            </div>
            {locale === lang.code && (
              <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact language selector for mobile/small spaces
export function CompactLanguageSelector({ className }: { className?: string }) {
  const locale = useLocale();

  const setLanguage = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  };

  const languages = [
    { code: "en", label: "EN", nativeName: "English" },
    { code: "hi", label: "हि", nativeName: "हिंदी" },
    { code: "mr", label: "मर", nativeName: "मराठी" },
  ];

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded transition-colors",
            locale === lang.code
              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800"
              : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10"
          )}
          title={lang.nativeName}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}

// Inline language switcher for navigation
export function InlineLanguageSelector({ className }: { className?: string }) {
  const locale = useLocale();

  const setLanguage = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=lax`;
    window.location.reload();
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिंदी" },
    { code: "mr", name: "मराठी" },
  ];

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {languages.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "text-sm transition-colors",
              locale === lang.code
                ? "text-orange-600 dark:text-orange-400 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400"
            )}
          >
            {lang.name}
          </button>
          {index < languages.length - 1 && (
            <span className="text-gray-400 dark:text-gray-600">|</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
