"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/utils/useHydrated";

import { type ThemeSwitcherProps } from "./theme-switcher.shared";

export function CompactThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const mounted = useHydrated();

  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center justify-center size-8 rounded-full transition-all duration-300 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300",
        className
      )}
      aria-label="Toggle theme"
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
