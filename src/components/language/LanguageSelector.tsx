"use client";

import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, languageNames, languageFlags } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({
  variant = 'ghost',
  size = 'default',
  showLabel = true,
  className,
}: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "flex items-center space-x-2",
            className
          )}
        >
          <Globe className="w-4 h-4" />
          {showLabel && (
            <>
              <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
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
              language === lang.code && "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{lang.nativeName}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</span>
            </div>
            {language === lang.code && (
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
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as Language, label: 'EN', nativeName: 'English' },
    { code: 'hi' as Language, label: 'हि', nativeName: 'हिंदी' },
    { code: 'mr' as Language, label: 'मर', nativeName: 'मराठी' },
  ];

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded transition-colors",
            language === lang.code
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
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'hi' as Language, name: 'हिंदी' },
    { code: 'mr' as Language, name: 'मराठी' },
  ];

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {languages.map((lang, index) => (
        <React.Fragment key={lang.code}>
          <button
            onClick={() => setLanguage(lang.code)}
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
