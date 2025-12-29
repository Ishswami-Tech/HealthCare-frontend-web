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
import { useLanguage } from "@/lib/i18n/context";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/config";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "default",
  showLabel = true,
  className,
}: LanguageSwitcherProps) {
  const { language, setLanguage, isLoading, supportedLanguages } = useLanguage();
  const t = useTranslations("ui.languageSwitcher");

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={cn("min-w-[100px]", className)}
      >
        <Globe className="h-4 w-4" />
        {showLabel && size !== "icon" && (
          <span className="ml-2">{t("loading")}</span>
        )}
      </Button>
    );
  }

  const currentLangInfo = supportedLanguages[language];
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "gap-2",
            size === "icon" ? "w-10 h-10" : "min-w-[100px]",
            className
          )}
        >
          <span className="text-base">{currentLangInfo.flag}</span>
          {showLabel && size !== "icon" && (
            <>
              <span className="hidden sm:inline">{currentLangInfo.name}</span>
              <span className="sm:hidden">{language.toUpperCase()}</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => {
          const langInfo = supportedLanguages[lang];
          const isActive = language === lang;

          return (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <span className="text-base">{langInfo.flag || "🌐"}</span>
              <span className="flex-1">{langInfo.name}</span>
              {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact version for mobile
export function CompactLanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];

  const handleClick = () => {
    const currentIndex = languages.indexOf(language || 'en');
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex];
    if (nextLanguage) {
      setLanguage(nextLanguage);
    }
  };

  const currentLangInfo = supportedLanguages[language];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn("gap-1 px-2", className)}
      title={`Switch language (Current: ${currentLangInfo.name})`}
    >
      <Globe className="h-4 w-4" />
      <span className="text-xs font-medium">{language.toUpperCase()}</span>
    </Button>
  );
}

// Inline language switcher for headers
export function InlineLanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {languages.map((lang, index) => {
        const isActive = language === lang;
        const langInfo = supportedLanguages[lang];

        return (
          <React.Fragment key={lang}>
            <button
              onClick={() => setLanguage(lang)}
              className={cn(
                "px-2 py-1 text-sm font-medium rounded transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={langInfo.name}
            >
              {lang.toUpperCase()}
            </button>
            {index < languages.length - 1 && (
              <span className="text-muted-foreground">|</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Language switcher with flags only
export function FlagLanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {languages.map((lang) => {
        const isActive = language === lang;
        const langInfo = supportedLanguages[lang];

        return (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all",
              isActive
                ? "ring-2 ring-primary ring-offset-2 scale-110"
                : "hover:scale-105 opacity-70 hover:opacity-100"
            )}
            title={langInfo.name}
          >
            {langInfo.flag}
          </button>
        );
      })}
    </div>
  );
}
