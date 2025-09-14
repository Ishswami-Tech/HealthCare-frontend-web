// ✅ Translation Hook - Placeholder for i18n integration

export const useTranslation = () => {
  // Simple implementation for now
  const t = (key: string, defaultValue?: string) => {
    // Return the key as-is for now, can be enhanced with actual translations
    return defaultValue || key;
  };

  return {
    t,
    language: 'en',
    changeLanguage: (lang: string) => {
      // Placeholder for language switching
      console.log(`Switching language to: ${lang}`);
    }
  };
};