"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

// Optimized ThemeProvider for 100K users with performance enhancements

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Optimized useTheme hook with error boundary
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider = React.memo(function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Memoize theme setter for performance
  const memoizedSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  useEffect(() => {
    // Set mounted state and load saved theme from localStorage with error handling
    setMounted(true);

    try {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
    }
  }, []);

  // Memoize resolved theme calculation with SSR safety
  const resolvedTheme = useMemo(() => {
    if (theme === "system") {
      // Check if we're on the client side
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      // Default to light theme during SSR
      return "light";
    }
    return theme as "light" | "dark";
  }, [theme]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    // Batch DOM operations for better performance
    requestAnimationFrame(() => {
      // Remove previous theme classes
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
    });

    setActualTheme(resolvedTheme);

    // Save to localStorage with error handling
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
    }
  }, [theme, resolvedTheme]);

  // Memoized change handler for system theme changes
  const handleSystemThemeChange = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const newResolvedTheme = mediaQuery.matches ? "dark" : "light";

    // Batch DOM operations
    requestAnimationFrame(() => {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newResolvedTheme);
    });

    setActualTheme(newResolvedTheme);
  }, []);

  // Optimized system theme change listener
  useEffect(() => {
    if (
      theme !== "system" ||
      typeof window === "undefined" ||
      !window.matchMedia
    )
      return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme, handleSystemThemeChange]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      theme,
      setTheme: memoizedSetTheme,
      actualTheme,
      mounted,
    }),
    [theme, memoizedSetTheme, actualTheme, mounted]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
});

// Re-export ThemeSwitcher as ThemeToggle for backward compatibility
export { ThemeSwitcher as ThemeToggle } from "./ThemeSwitcher";
