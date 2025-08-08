"use client";

import React from "react";
import { Globe, Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  showFlag?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "icon",
  showLabel = false,
  showFlag = true,
  className,
}: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = async (newLocale: Locale) => {
    // Set locale in cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh the page to apply new locale
    window.location.reload();
  };

  const currentLocale = locales.find((l) => l === locale) || locales[0];
  const currentFlag = localeFlags[currentLocale];
  const currentName = localeNames[currentLocale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "relative transition-all duration-200 hover:scale-105",
            className
          )}
          aria-label={t("selectLanguage")}
        >
          {showFlag ? (
            <span className="text-lg">{currentFlag}</span>
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {showLabel && (
            <span className="ml-2 text-sm font-medium">{currentName}</span>
          )}
          <span className="sr-only">{t("selectLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((localeOption) => {
          const isActive = locale === localeOption;
          const flag = localeFlags[localeOption];
          const name = localeNames[localeOption];

          return (
            <DropdownMenuItem
              key={localeOption}
              onClick={() => handleLanguageChange(localeOption)}
              className={cn(
                "flex items-center gap-3 cursor-pointer transition-colors",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <span className="text-lg">{flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground uppercase">
                  {localeOption}
                </span>
              </div>
              {isActive && <Check className="ml-auto h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple language toggle that cycles through languages
export function SimpleLanguageToggle({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const toggleLanguage = () => {
    const currentIndex = locales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    const nextLocale = locales[nextIndex];

    // Set locale in cookie
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh the page to apply new locale
    window.location.reload();
  };

  const currentFlag = localeFlags[locale];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      className={cn(
        "relative transition-all duration-200 hover:scale-105",
        className
      )}
      aria-label="Toggle language"
    >
      <span className="text-lg">{currentFlag}</span>
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}

// Language selector with text labels
export function LanguageSelector({ className }: { className?: string }) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;

  const handleLanguageChange = (newLocale: Locale) => {
    // Set locale in cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh the page to apply new locale
    window.location.reload();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Languages className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {locales.map((localeOption) => (
          <button
            key={localeOption}
            type="button"
            onClick={() => handleLanguageChange(localeOption)}
            className={cn(
              "px-2 py-1 text-xs font-medium rounded transition-all duration-200 hover:scale-105",
              locale === localeOption
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            aria-label={`Switch to ${localeNames[localeOption]}`}
            title={localeNames[localeOption]}
          >
            {localeOption.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact language switcher for mobile
export function CompactLanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const currentFlag = localeFlags[locale];

  const handleLanguageChange = (newLocale: Locale) => {
    // Set locale in cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Refresh the page to apply new locale
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
        >
          <span className="text-sm">{currentFlag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {locales.map((localeOption) => {
          const isActive = locale === localeOption;
          const flag = localeFlags[localeOption];
          const name = localeNames[localeOption];

          return (
            <DropdownMenuItem
              key={localeOption}
              onClick={() => handleLanguageChange(localeOption)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                isActive && "bg-accent"
              )}
            >
              <span>{flag}</span>
              <span className="text-xs">{name}</span>
              {isActive && <Check className="ml-auto h-3 w-3" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
