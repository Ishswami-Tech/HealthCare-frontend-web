/**
 * Consolidated Language Switcher Component
 * Single source of truth for all language switching UI
 */

"use client";

import { useState } from "react";
import { ChevronDown, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/context";
import { SupportedLanguage, locales, localeNames, localeFlags, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils/index";

export interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "mobile" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showFlag?: boolean;
  showLabel?: boolean;
  showNativeName?: boolean;
}

export function LanguageSwitcher({
  variant = "default",
  size = "default",
  className,
  showFlag = true,
  showLabel = false,
  showNativeName = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 animate-pulse",
          className
        )}
      >
        <Globe className="size-4" />
        <div className="w-16 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  const currentLanguage = supportedLanguages[language];
  const locale = language as Locale;
  const currentLocale =
    locales.find((l) => l === locale) || (locales.length > 0 ? locales[0] : undefined);
  const defaultLocale = locales.length > 0 ? locales[0] : undefined;
  const currentFlag = currentLocale
    ? localeFlags[currentLocale]
    : defaultLocale
      ? localeFlags[defaultLocale]
      : "🌐";
  const currentName = currentLocale
    ? localeNames[currentLocale]
    : defaultLocale
      ? localeNames[defaultLocale]
      : "Language";

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative transition-all duration-300 size-8 rounded-full hover:bg-muted/50 active:scale-95",
                isOpen && "bg-muted/50 scale-95"
              )}
              aria-label="Select language"
            >
              <span className="text-base leading-none select-none">
                {currentLanguage.flag}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 p-1.5 rounded-xl border-border/50 shadow-xl backdrop-blur-xl bg-background/95"
          >
            <div className="px-2 py-1.5 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Select Language
            </div>
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <DropdownMenuItem
                key={code}
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2 transition-colors",
                  language === code
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted focus:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm truncate">{lang.name}</span>
                  {showNativeName && lang.nativeName !== lang.name && (
                    <span className="text-[10px] opacity-60 truncate">
                      {lang.nativeName}
                    </span>
                  )}
                </div>
                {language === code && <Check className="size-3.5 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className={cn("w-full", className)}>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <Globe className="size-5 text-gray-500" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Language</div>
              <div className="text-sm text-gray-500">
                {showFlag && `${currentLanguage.flag} `}
                {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "size-5 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <button
                key={code}
                type="button"
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg",
                  language === code && "bg-blue-50 text-blue-600"
                )}
              >
                {showFlag && <span className="text-lg">{lang.flag}</span>}
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  {showNativeName && lang.nativeName !== lang.name && (
                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
                  )}
                </div>
                {language === code && <Check className="size-5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const buttonVariant =
    variant === "ghost" || variant === "outline" || variant === "secondary"
      ? variant
      : "default";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={buttonVariant}
          size={size}
          className={cn(
            "flex items-center gap-2 transition-all duration-200 hover:scale-105",
            className
          )}
          aria-label="Select language"
        >
          {showFlag ? (
            <span className="text-lg">{currentFlag}</span>
          ) : (
            <Globe className="size-4" />
          )}
          {showLabel && (
            <span className="font-medium">
              {showNativeName ? currentName : currentLanguage.name}
            </span>
          )}
          {showLabel && <ChevronDown className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(supportedLanguages).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguage)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              language === code && "bg-accent text-accent-foreground"
            )}
          >
            {showFlag && <span className="text-lg">{lang.flag}</span>}
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium">{lang.name}</span>
              {showNativeName && lang.nativeName !== lang.name && (
                <span className="text-xs text-muted-foreground">
                  {lang.nativeName}
                </span>
              )}
            </div>
            {language === code && <Check className="size-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
