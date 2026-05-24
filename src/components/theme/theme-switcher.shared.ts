"use client";

import { Moon, Sun } from "lucide-react";

import { useTranslation } from "@/lib/i18n/context";

export interface ThemeSwitcherProps {
  className?: string;
}

export type ThemeOption = {
  name: string;
  value: "light" | "dark";
  icon: typeof Sun;
  activeColor: string;
  hoverColor: string;
};

export function useThemeOptions(): ThemeOption[] {
  const { t } = useTranslation();

  return [
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
}
