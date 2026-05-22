"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context"; // ✅ Use consolidated i18n
import { useHydrated } from "@/hooks/utils/useHydrated";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const mounted = useHydrated();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="flex bg-gray-800 rounded-lg p-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="size-10 rounded-md bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const themes = [
    {
      name: t("common.lightTheme"),
      value: "light",
      icon: Sun,
      activeColor: "bg-yellow-500 text-white",
      hoverColor: "hover:bg-yellow-400 hover:text-white",
    },
    {
      name: t("common.darkTheme"),
      value: "dark",
      icon: Moon,
      activeColor: "bg-gray-800 text-white",
      hoverColor: "hover:bg-gray-700 hover:text-white",
    },
  ];

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex bg-gray-800 rounded-lg p-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "relative flex items-center justify-center size-10 rounded-md transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800",
                isActive
                  ? `${themeOption.activeColor} shadow-sm`
                  : `text-gray-400 ${themeOption.hoverColor}`
              )}
              aria-label={`Switch to ${themeOption.name} theme`}
              title={themeOption.name}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Alternative version with labels
export function ThemeSwitcherWithLabels({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const mounted = useHydrated();

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="flex bg-gray-800 rounded-lg p-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="px-3 py-2 rounded-md bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const themes = [
    {
      name: t("common.lightTheme"),
      value: "light",
      icon: Sun,
      activeColor: "bg-yellow-500 text-white",
      hoverColor: "hover:bg-yellow-400 hover:text-white",
    },
    {
      name: t("common.darkTheme"),
      value: "dark",
      icon: Moon,
      activeColor: "bg-gray-800 text-white",
      hoverColor: "hover:bg-gray-700 hover:text-white",
    },
  ];

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex bg-gray-800 rounded-lg p-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800",
                isActive
                  ? `${themeOption.activeColor} shadow-sm`
                  : `text-gray-400 ${themeOption.hoverColor}`
              )}
              aria-label={`Switch to ${themeOption.name} theme`}
            >
              <Icon className="size-4" />
              <span className="text-sm font-medium">{themeOption.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for mobile (Toggle)
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


