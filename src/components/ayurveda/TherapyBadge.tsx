"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Flame,
  Droplets,
  Leaf,
  Stethoscope,
  Zap,
  Wind,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "../ui/button";

export type TherapyType =
  | "AGNIKARMA"
  | "VIDDHAKARMA"
  | "PANCHAKARMA"
  | "SHIRODHARA"
  | "CONSULTATION"
  | "NADI_PARIKSHA"
  | "ABHYANGA"
  | "SWEDANA"
  | "VIRECHANA"
  | "BASTI";

interface TherapyBadgeProps {
  type: TherapyType;
  variant?: "default" | "secondary" | "outline" | "destructive";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

const THERAPY_CONFIG = {
  AGNIKARMA: {
    label: "Agnikarma",
    description: "Thermal Cautery Therapy",
    icon: Flame,
    color:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-800",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  VIDDHAKARMA: {
    label: "Viddhakarma",
    description: "Surgical Procedures",
    icon: Zap,
    color:
      "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800",
    iconColor: "text-red-600 dark:text-red-400",
  },
  PANCHAKARMA: {
    label: "Panchakarma",
    description: "Five-Action Detox",
    icon: Droplets,
    color:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  SHIRODHARA: {
    label: "Shirodhara",
    description: "Oil Pouring Therapy",
    icon: Leaf,
    color:
      "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800",
    iconColor: "text-green-600 dark:text-green-400",
  },
  CONSULTATION: {
    label: "Consultation",
    description: "General Consultation",
    icon: Stethoscope,
    color:
      "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
  NADI_PARIKSHA: {
    label: "Nadi Pariksha",
    description: "Pulse Diagnosis",
    icon: Wind,
    color:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  ABHYANGA: {
    label: "Abhyanga",
    description: "Oil Massage Therapy",
    icon: Sun,
    color:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  SWEDANA: {
    label: "Swedana",
    description: "Steam Therapy",
    icon: Droplets,
    color:
      "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  VIRECHANA: {
    label: "Virechana",
    description: "Purgation Therapy",
    icon: Leaf,
    color:
      "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  BASTI: {
    label: "Basti",
    description: "Enema Therapy",
    icon: Moon,
    color:
      "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
};

export default function TherapyBadge({
  type,
  variant = "default",
  size = "default",
  showIcon = true,
  className,
}: TherapyBadgeProps) {
  const config = THERAPY_CONFIG[type];
  const Icon = config.icon;

  if (!config) {
    return (
      <Badge variant={variant} className={className}>
        Unknown Therapy
      </Badge>
    );
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        variant === "default" && config.color,
        sizeClasses[size],
        "inline-flex items-center gap-1.5 font-medium border",
        className
      )}
      title={config.description}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            variant === "default" ? config.iconColor : "current"
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// Helper component for therapy selection
interface TherapySelectProps {
  selectedTherapy?: TherapyType;
  onSelect: (therapy: TherapyType) => void;
  availableTherapies?: TherapyType[];
  className?: string;
}

export function TherapySelect({
  selectedTherapy,
  onSelect,
  availableTherapies = Object.keys(THERAPY_CONFIG) as TherapyType[],
  className,
}: TherapySelectProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {availableTherapies.map((therapy) => (
        <Button
          key={therapy}
          onClick={() => onSelect(therapy)}
          className={cn(
            "transition-all duration-200 hover:scale-105",
            selectedTherapy === therapy && "ring-2 ring-blue-500 ring-offset-2"
          )}
        >
          <TherapyBadge
            type={therapy}
            variant={selectedTherapy === therapy ? "default" : "outline"}
          />
        </Button>
      ))}
    </div>
  );
}

// Helper function to get therapy duration
export function getTherapyDuration(type: TherapyType): number {
  const durations: Record<TherapyType, number> = {
    CONSULTATION: 30,
    NADI_PARIKSHA: 15,
    AGNIKARMA: 45,
    VIDDHAKARMA: 60,
    PANCHAKARMA: 120,
    SHIRODHARA: 60,
    ABHYANGA: 45,
    SWEDANA: 30,
    VIRECHANA: 90,
    BASTI: 45,
  };

  return durations[type] || 30;
}

// Helper function to get therapy category
export function getTherapyCategory(type: TherapyType): string {
  const categories: Record<TherapyType, string> = {
    CONSULTATION: "Diagnosis",
    NADI_PARIKSHA: "Diagnosis",
    AGNIKARMA: "Surgical",
    VIDDHAKARMA: "Surgical",
    PANCHAKARMA: "Detox",
    SHIRODHARA: "Relaxation",
    ABHYANGA: "Massage",
    SWEDANA: "Steam",
    VIRECHANA: "Detox",
    BASTI: "Detox",
  };

  return categories[type] || "General";
}
