"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  SupportedLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "./config";
import {
  getTranslationWithFallback,
  getArrayTranslationWithFallback,
} from "./utils";

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, variables?: Record<string, string | number>) => string;
  tArray: (path: string) => string[];
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
}

// Helper function to detect browser language
function detectBrowserLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.split("-")[0] as SupportedLanguage;
  return Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)
    ? browserLang
    : DEFAULT_LANGUAGE;
}

// Helper function to get stored language
function getStoredLanguage(): SupportedLanguage | null {
  if (typeof window === "undefined") return null;

  // Check localStorage first
  try {
    const stored = localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    ) as SupportedLanguage;
    if (stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to read language from localStorage:", error);
  }

  // Check cookie
  try {
    const cookies = document.cookie.split(";");
    const langCookie = cookies.find((cookie) =>
      cookie.trim().startsWith(`${LANGUAGE_COOKIE_NAME}=`)
    );

    if (langCookie) {
      const cookieValue = langCookie.split("=")[1] as SupportedLanguage;
      if (Object.keys(SUPPORTED_LANGUAGES).includes(cookieValue)) {
        return cookieValue;
      }
    }
  } catch (error) {
    console.warn("Failed to read language from cookie:", error);
  }

  return null;
}

// Helper function to store language preference
function storeLanguage(language: SupportedLanguage) {
  if (typeof window === "undefined") return;

  // Store in localStorage
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn("Failed to store language in localStorage:", error);
  }

  // Store in cookie
  try {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1); // 1 year expiry
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${language}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.warn("Failed to store language in cookie:", error);
  }
}

export function LanguageProvider({
  children,
  initialLanguage,
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    initialLanguage || DEFAULT_LANGUAGE
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on mount
  useEffect(() => {
    const storedLanguage = getStoredLanguage();
    const detectedLanguage = detectBrowserLanguage();

    const finalLanguage =
      storedLanguage || detectedLanguage || DEFAULT_LANGUAGE;

    setLanguageState(finalLanguage);
    setIsLoading(false);

    // Store the detected/default language if none was stored
    if (!storedLanguage) {
      storeLanguage(finalLanguage);
    }
  }, []);

  const setLanguage = (newLanguage: SupportedLanguage) => {
    if (Object.keys(SUPPORTED_LANGUAGES).includes(newLanguage)) {
      setLanguageState(newLanguage);
      storeLanguage(newLanguage);

      // Update document language attribute
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLanguage;
        document.documentElement.dir = SUPPORTED_LANGUAGES[newLanguage].dir;
      }
    }
  };

  const t = (
    path: string,
    variables?: Record<string, string | number>
  ): string => {
    return getTranslationWithFallback(language, path, variables);
  };

  const tArray = (path: string): string[] => {
    return getArrayTranslationWithFallback(language, path);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tArray,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
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

// Hook for translation only (lighter than useLanguage)
export function useTranslation() {
  const { t, tArray, language } = useLanguage();
  return { t, tArray, language };
}

// Hook for language switching
export function useLanguageSwitcher() {
  const { language, setLanguage, supportedLanguages, isLoading } =
    useLanguage();
  return { language, setLanguage, supportedLanguages, isLoading };
}
