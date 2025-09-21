"use client";

import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="flex bg-gray-800 rounded-lg p-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-10 h-10 rounded-md bg-gray-700 animate-pulse"
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
    {
      name: t("common.systemTheme"),
      value: "system",
      icon: Monitor,
      activeColor: "bg-blue-500 text-white",
      hoverColor: "hover:bg-blue-400 hover:text-white",
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
                "relative flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800",
                isActive
                  ? `${themeOption.activeColor} shadow-sm`
                  : `text-gray-400 ${themeOption.hoverColor}`
              )}
              aria-label={`Switch to ${themeOption.name} theme`}
              title={themeOption.name}
            >
              <Icon className="h-4 w-4" />
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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
    {
      name: t("common.systemTheme"),
      value: "system",
      icon: Monitor,
      activeColor: "bg-blue-500 text-white",
      hoverColor: "hover:bg-blue-400 hover:text-white",
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
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{themeOption.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for mobile
export function CompactThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className={cn("flex items-center", className)}>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-full p-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const themes = [
    {
      value: "system",
      icon: Monitor,
      activeColor: "bg-blue-500 text-white",
      hoverColor: "hover:bg-blue-400 hover:text-white",
    },
    {
      value: "light",
      icon: Sun,
      activeColor: "bg-yellow-500 text-white",
      hoverColor: "hover:bg-yellow-400 hover:text-white",
    },
    {
      value: "dark",
      icon: Moon,
      activeColor: "bg-gray-800 text-white",
      hoverColor: "hover:bg-gray-700 hover:text-white",
    },
  ];

  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative flex bg-gray-200 dark:bg-gray-700 rounded-full p-1 gap-0.5">
        {themes.map((themeOption, index) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ease-in-out",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                isActive
                  ? `${themeOption.activeColor} shadow-md scale-105`
                  : `text-gray-500 dark:text-gray-400 ${themeOption.hoverColor}`
              )}
              aria-label={`Switch to ${themeOption.value} theme`}
            >
              <Icon className="h-3 w-3" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
