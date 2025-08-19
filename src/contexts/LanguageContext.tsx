"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Language, Translation, getTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translation;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem(
      "preferred-language"
    ) as Language;
    if (savedLanguage && ["en", "hi", "mr"].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("preferred-language", newLanguage);

    // Update document language attribute
    document.documentElement.lang = newLanguage;

    // Update document direction for RTL languages if needed
    // (Hindi and Marathi are LTR, but keeping this for future expansion)
    document.documentElement.dir = "ltr";
  };

  // Get current translation
  const t = getTranslation(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Language names for display
export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

// Language flags/icons (using emoji for simplicity)
export const languageFlags: Record<Language, string> = {
  en: "🇺🇸",
  hi: "🇮🇳",
  mr: "🇮🇳",
};

// Utility function to get language display info
export function getLanguageInfo(language: Language) {
  return {
    name: languageNames[language],
    flag: languageFlags[language],
    code: language,
  };
}

// Hook for easy language switching
export function useLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const switchToNext = () => {
    const languages: Language[] = ["en", "hi", "mr"];
    const currentIndex = languages.indexOf(language || 'en');
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLanguage = languages[nextIndex];
    if (nextLanguage) {
      setLanguage(nextLanguage);
    }
  };

  const switchTo = (targetLanguage: Language) => {
    setLanguage(targetLanguage);
  };

  return {
    currentLanguage: language,
    switchToNext,
    switchTo,
    availableLanguages: ["en", "hi", "mr"] as Language[],
  };
}
