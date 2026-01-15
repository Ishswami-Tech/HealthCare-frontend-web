/**
 * ✅ Consolidated i18n Utilities
 * Follows DRY, SOLID, KISS principles
 * Single source of truth for translation utilities
 */

import { translations } from './translations/index';
import { 
  SupportedLanguage, 
  Locale,
  SUPPORTED_LANGUAGES,
  localeDirections 
} from './config';

// Helper function to get nested translation value
export function getNestedTranslation(
  obj: Record<string, unknown>,
  path: string,
  fallback?: string
): string {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key] as Record<string, unknown>;
    } else {
      return fallback || path;
    }
  }
  
  return typeof current === 'string' ? current : fallback || path;
}

// Helper function to get nested translation value as array
export function getNestedTranslationArray(
  obj: Record<string, unknown>,
  path: string,
  fallback?: string[]
): string[] {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key] as Record<string, unknown>;
    } else {
      return fallback || [];
    }
  }
  
  return Array.isArray(current) ? current as string[] : fallback || [];
}

// Helper function to interpolate variables in translations
export function interpolateTranslation(
  template: string,
  variables: Record<string, string | number> = {}
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

// Helper function to get translation with fallback
export function getTranslationWithFallback(
  language: SupportedLanguage,
  path: string,
  variables?: Record<string, string | number>,
  fallbackLanguage: SupportedLanguage = 'en'
): string {
  const primaryTranslation = getNestedTranslation(translations[language] as unknown as Record<string, unknown>, path);
  
  // If primary translation is not found or is the same as path, try fallback
  if (primaryTranslation === path && language !== fallbackLanguage) {
    const fallbackTranslation = getNestedTranslation(translations[fallbackLanguage] as unknown as Record<string, unknown>, path);
    const finalTranslation = fallbackTranslation !== path ? fallbackTranslation : path;
    return variables ? interpolateTranslation(finalTranslation, variables) : finalTranslation;
  }
  
  return variables ? interpolateTranslation(primaryTranslation, variables) : primaryTranslation;
}

// Helper function to get array translation with fallback
export function getArrayTranslationWithFallback(
  language: SupportedLanguage,
  path: string,
  fallbackLanguage: SupportedLanguage = 'en'
): string[] {
  const primaryTranslation = getNestedTranslationArray(translations[language] as unknown as Record<string, unknown>, path);
  
  // If primary translation is empty, try fallback
  if (primaryTranslation.length === 0 && language !== fallbackLanguage) {
    const fallbackTranslation = getNestedTranslationArray(translations[fallbackLanguage] as unknown as Record<string, unknown>, path);
    return fallbackTranslation.length > 0 ? fallbackTranslation : [];
  }
  
  return primaryTranslation;
}

// ✅ Locale validation utilities (for compatibility with next-intl migration)
export function isValidLocale(locale: string): locale is Locale {
  return Object.keys(SUPPORTED_LANGUAGES).includes(locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split('/');
  const potentialLocale = segments[1];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return null;
}

export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/';
  }
  return pathname;
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  const cleanPathname = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPathname === '/' ? '' : cleanPathname}`;
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeDirections[locale] || 'ltr';
}
