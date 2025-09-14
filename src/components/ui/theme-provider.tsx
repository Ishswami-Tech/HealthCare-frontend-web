"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// Theme Provider Component
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Theme Toggle Hook
export const useTheme = () => {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme, systemTheme } = require("next-themes").useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? theme : undefined,
    setTheme,
    systemTheme: mounted ? systemTheme : undefined,
    mounted,
  };
};

// Re-export ThemeSwitcher as ThemeToggle for backward compatibility
export { ThemeSwitcher as ThemeToggle } from "../theme/ThemeSwitcher";
