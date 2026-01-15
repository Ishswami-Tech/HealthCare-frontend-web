/**
 * ✅ Consolidated Language Switcher Component
 * Single source of truth for all language switching UI
 * Follows DRY, SOLID, KISS principles
 * Supports multiple variants for different use cases
 */

"use client";

import React, { useState } from "react";
import { ChevronDown, Globe, Check, Languages } from "lucide-react";
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

// ============================================================================
// MAIN LANGUAGE SWITCHER
// ============================================================================

export interface LanguageSwitcherProps {
  variant?: "default" | "compact" | "mobile" | "ghost" | "outline" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showFlag?: boolean;
  showLabel?: boolean;
  showNativeName?: boolean;
}

/**
 * ✅ Consolidated Language Switcher
 * Supports multiple variants for different UI contexts
 */
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
        <Globe className="w-4 h-4" />
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const currentLanguage = supportedLanguages[language];
  const locale = language as Locale;
  const currentLocale = locales.find((l) => l === locale) || (locales.length > 0 ? locales[0] : undefined);
  const defaultLocale = locales.length > 0 ? locales[0] : undefined;
  const currentFlag = currentLocale ? localeFlags[currentLocale] : (defaultLocale ? localeFlags[defaultLocale] : '🌐');
  const currentName = currentLocale ? localeNames[currentLocale] : (defaultLocale ? localeNames[defaultLocale] : 'Language');

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  // Compact variant (icon only with dropdown)
  if (variant === "compact") {
    return (
      <div className={cn("relative", className)}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative transition-all duration-200 hover:scale-105"
              aria-label="Select language"
            >
              {showFlag ? (
                <span className="text-sm">{currentLanguage.flag}</span>
              ) : (
                <Globe className="h-4 w-4" />
              )}
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
                {language === code && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Mobile variant (full width with expanded view)
  if (variant === "mobile") {
    return (
      <div className={cn("w-full", className)}>
        <Button
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
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
              "w-5 h-5 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <button
                key={code}
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
                    <div className="text-sm text-gray-500">
                      {lang.nativeName}
                    </div>
                  )}
                </div>
                {language === code && <Check className="w-5 h-5" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant (dropdown with button)
  const buttonVariant = variant === "ghost" || variant === "outline" || variant === "secondary" 
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
            <Globe className="h-4 w-4" />
          )}
          {showLabel && (
            <span className="font-medium">
              {showNativeName ? currentName : currentLanguage.name}
            </span>
          )}
          {showLabel && <ChevronDown className="w-4 h-4" />}
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
            {language === code && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// SIMPLE LANGUAGE TOGGLE (Icon only, no dropdown)
// ============================================================================

export interface SimpleLanguageToggleProps {
  className?: string;
}

/**
 * ✅ Simple Language Toggle
 * Icon-only button that cycles through languages
 */
export function SimpleLanguageToggle({ className }: SimpleLanguageToggleProps) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const languages = Object.keys(supportedLanguages) as SupportedLanguage[];
  const currentIndex = languages.indexOf(language);
  const nextLanguage = languages[(currentIndex + 1) % languages.length];

  const handleToggle = () => {
    if (nextLanguage) {
      setLanguage(nextLanguage);
    }
  };

  const currentLanguage = supportedLanguages[language];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("transition-all duration-200 hover:scale-105", className)}
      aria-label={`Switch to ${nextLanguage ? supportedLanguages[nextLanguage]?.name : 'next language'}`}
    >
      <span className="text-lg">{currentLanguage.flag}</span>
      <span className="sr-only">Toggle language</span>
    </Button>
  );
}

// ============================================================================
// LANGUAGE SELECTOR (Text-based, inline)
// ============================================================================

export interface LanguageSelectorProps {
  className?: string;
  variant?: "inline" | "compact";
}

/**
 * ✅ Language Selector
 * Text-based language selector for inline use
 */
export function LanguageSelector({ 
  className, 
  variant = "inline" 
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const locale = language as Locale;

  const handleLanguageChange = (newLocale: Locale) => {
    setLanguage(newLocale as SupportedLanguage);
  };

  if (variant === "compact") {
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

  // Inline variant
  const { supportedLanguages: supportedLangs } = useLanguage();
  const languages = Object.entries(supportedLangs || {}).map(([code, lang]: [string, any]) => ({
    code,
    name: lang.nativeName,
  }));

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {languages.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={() => handleLanguageChange(lang.code as Locale)}
            className={cn(
              "text-sm transition-colors",
              language === lang.code
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

// ============================================================================
// COMPACT LANGUAGE SWITCHER (Mobile-optimized)
// ============================================================================

export interface CompactLanguageSwitcherProps {
  className?: string;
}

/**
 * ✅ Compact Language Switcher
 * Mobile-optimized compact version
 */
export function CompactLanguageSwitcher({ className }: CompactLanguageSwitcherProps) {
  return <LanguageSwitcher variant="compact" {...(className ? { className } : {})} />;
}

// ✅ Consolidated: All language switching components are in this file
// No backward compatibility re-exports needed
