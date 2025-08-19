"use client";

import React from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      name: "Light",
      value: "light",
      icon: Sun,
      description: "Light mode",
    },
    {
      name: "Dark",
      value: "dark",
      icon: Moon,
      description: "Dark mode",
    },
    {
      name: "System",
      value: "system",
      icon: Monitor,
      description: "System preference",
    },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2] || themes[0];
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "relative transition-all duration-200 hover:scale-105",
            className
          )}
          aria-label="Toggle theme"
        >
          <CurrentIcon className="h-4 w-4 transition-all duration-300" />
          {showLabel && (
            <span className="ml-2 text-sm font-medium">
              {currentTheme?.name || 'Theme'}
            </span>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;

          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                "flex items-center gap-2 cursor-pointer transition-colors",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive && "text-primary"
                )}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{themeOption.name}</span>
                <span className="text-xs text-muted-foreground">
                  {themeOption.description}
                </span>
              </div>
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple toggle button that cycles through themes
export function SimpleThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") return Sun;
    if (theme === "dark") return Moon;
    return Monitor;
  };

  const Icon = getIcon();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative transition-all duration-200 hover:scale-105",
        className
      )}
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4 transition-all duration-300" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Animated theme toggle with smooth transitions
export function AnimatedThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:scale-105",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative h-4 w-4">
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-500 ease-in-out",
            theme === "dark"
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-500 ease-in-out",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// Theme selector with color preview
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { name: "Light", value: "light", color: "bg-white border-gray-200" },
    { name: "Dark", value: "dark", color: "bg-gray-900 border-gray-700" },
    {
      name: "System",
      value: "system",
      color: "bg-gradient-to-r from-white to-gray-900",
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Palette className="h-4 w-4 text-muted-foreground" />
      <div className="flex gap-1">
        {themes.map((themeOption) => (
          <button
            key={themeOption.value}
            type="button"
            onClick={() => setTheme(themeOption.value)}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-all duration-200 hover:scale-110",
              themeOption.color,
              theme === themeOption.value
                ? "ring-2 ring-primary ring-offset-2"
                : "hover:ring-1 hover:ring-gray-300"
            )}
            aria-label={`Switch to ${themeOption.name} theme`}
            title={themeOption.name}
          />
        ))}
      </div>
    </div>
  );
}
