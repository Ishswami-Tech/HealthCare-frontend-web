"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

export interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  availableLocales: readonly Locale[];
  isLoading: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const currentLocale = useLocale() as Locale;
  const [locale, setLocaleState] = useState<Locale>(currentLocale || defaultLocale);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentLocale && currentLocale !== locale) {
      setLocaleState(currentLocale);
    }
  }, [currentLocale, locale]);

  const setLocale = async (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    setIsLoading(true);
    
    try {
      // Set locale in cookie
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      
      // Update state
      setLocaleState(newLocale);
      
      // Reload page to apply new locale
      window.location.reload();
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: LocaleContextType = {
    locale,
    setLocale,
    availableLocales: locales,
    isLoading,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
}

// Hook for getting locale information
export function useLocaleInfo() {
  const locale = useLocale() as Locale;
  
  return {
    locale,
    isRTL: false, // None of our supported languages are RTL
    direction: 'ltr' as const,
  };
}
