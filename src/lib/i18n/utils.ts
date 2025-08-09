import { translations } from './translations';
import { SupportedLanguage } from './config';

// Helper function to get nested translation value
export function getNestedTranslation(
  obj: any,
  path: string,
  fallback?: string
): string {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return fallback || path;
    }
  }
  
  return typeof current === 'string' ? current : fallback || path;
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
  const primaryTranslation = getNestedTranslation(translations[language], path);
  
  // If primary translation is not found or is the same as path, try fallback
  if (primaryTranslation === path && language !== fallbackLanguage) {
    const fallbackTranslation = getNestedTranslation(translations[fallbackLanguage], path);
    const finalTranslation = fallbackTranslation !== path ? fallbackTranslation : path;
    return variables ? interpolateTranslation(finalTranslation, variables) : finalTranslation;
  }
  
  return variables ? interpolateTranslation(primaryTranslation, variables) : primaryTranslation;
}
