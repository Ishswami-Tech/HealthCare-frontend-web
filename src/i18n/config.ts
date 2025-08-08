import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'hi', 'mr'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी'
};

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  hi: '🇮🇳',
  mr: '🇮🇳'
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});

// Utility functions for locale handling
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
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

// Direction support for RTL languages (if needed in future)
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  hi: 'ltr',
  mr: 'ltr'
};

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeDirections[locale] || 'ltr';
}
