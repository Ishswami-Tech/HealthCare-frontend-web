"use client";

import React, { useState } from 'react';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { useLanguageSwitcher } from '@/lib/i18n/context';
import { SupportedLanguage } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'mobile';
  className?: string;
  showFlag?: boolean;
  showNativeName?: boolean;
}

export function LanguageSwitcher({
  variant = 'default',
  className,
  showFlag = true,
  showNativeName = true,
}: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages, isLoading } = useLanguageSwitcher();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md bg-gray-100 animate-pulse",
        className
      )}>
        <Globe className="w-4 h-4" />
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const currentLanguage = supportedLanguages[language];

  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  if (variant === 'compact') {
    return (
      <div className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Select language"
        >
          {showFlag && <span className="text-sm">{currentLanguage.flag}</span>}
          <span className="text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] bg-white border border-gray-200 rounded-md shadow-lg py-1">
              {Object.entries(supportedLanguages).map(([code, lang]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code as SupportedLanguage)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors",
                    language === code && "bg-blue-50 text-blue-600"
                  )}
                >
                  {showFlag && <span>{lang.flag}</span>}
                  <span>{lang.code.toUpperCase()}</span>
                  {language === code && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={cn("w-full", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
          <ChevronDown className={cn(
            "w-5 h-5 text-gray-400 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

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
                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
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

  // Default variant
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        {showFlag && <span>{currentLanguage.flag}</span>}
        <span className="font-medium">
          {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-400 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[180px] bg-white border border-gray-200 rounded-md shadow-lg py-1">
            {Object.entries(supportedLanguages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => handleLanguageChange(code as SupportedLanguage)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors",
                  language === code && "bg-blue-50 text-blue-600"
                )}
              >
                {showFlag && <span>{lang.flag}</span>}
                <div className="flex-1">
                  <div className="font-medium">{lang.name}</div>
                  {showNativeName && lang.nativeName !== lang.name && (
                    <div className="text-sm text-gray-500">{lang.nativeName}</div>
                  )}
                </div>
                {language === code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
