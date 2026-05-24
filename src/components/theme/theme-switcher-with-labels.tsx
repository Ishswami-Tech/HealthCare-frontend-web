"use client";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/utils/useHydrated";

import { type ThemeSwitcherProps, useThemeOptions } from "./theme-switcher.shared";

export function ThemeSwitcherWithLabels({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const themes = useThemeOptions();

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
