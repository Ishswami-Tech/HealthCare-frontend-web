"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
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
    label: "therapies.agnikarma.name",
    description: "therapies.agnikarma.description",
    icon: Flame,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  VIDDHAKARMA: {
    label: "therapies.viddhakarma.name",
    description: "therapies.viddhakarma.description",
    icon: Zap,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  PANCHAKARMA: {
    label: "therapies.panchakarma.name",
    description: "therapies.panchakarma.description",
    icon: Droplets,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  SHIRODHARA: {
    label: "therapies.shirodhara.name",
    description: "therapies.shirodhara.description",
    icon: Leaf,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  CONSULTATION: {
    label: "therapies.consultation.name",
    description: "therapies.consultation.description",
    icon: Stethoscope,
    color: "bg-muted text-muted-foreground border-border",
    iconColor: "text-muted-foreground",
  },
  NADI_PARIKSHA: {
    label: "therapies.nadiPariksha.name",
    description: "therapies.nadiPariksha.description",
    icon: Wind,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  ABHYANGA: {
    label: "therapies.abhyanga.name",
    description: "therapies.abhyanga.description",
    icon: Sun,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  SWEDANA: {
    label: "therapies.swedana.name",
    description: "therapies.swedana.description",
    icon: Droplets,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  VIRECHANA: {
    label: "therapies.virechana.name",
    description: "therapies.virechana.description",
    icon: Leaf,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
  BASTI: {
    label: "therapies.basti.name",
    description: "therapies.basti.description",
    icon: Moon,
    color: "bg-primary/10 text-primary border-primary/20",
    iconColor: "text-primary",
  },
};

export default function TherapyBadge({
  type,
  variant = "default",
  size = "default",
  showIcon = true,
  className,
}: TherapyBadgeProps) {
  const { t } = useTranslation();
  const config = THERAPY_CONFIG[type];
  const Icon = config.icon;

  if (!config) {
    return (
      <Badge variant={variant} className={className}>
        {t("therapies.unknown")}
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
      title={t(config.description)}
    >
      {showIcon && (
        <Icon
          className={cn(
            iconSizes[size],
            variant === "default" ? config.iconColor : "current"
          )}
        />
      )}
      {t(config.label)}
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
export function getTherapyDuration(type: TherapyType): string {
  const durations: Record<TherapyType, string> = {
    CONSULTATION: "therapies.durations.consultation",
    NADI_PARIKSHA: "therapies.durations.nadiPariksha",
    AGNIKARMA: "therapies.durations.agnikarma",
    VIDDHAKARMA: "therapies.durations.viddhakarma",
    PANCHAKARMA: "therapies.durations.panchakarma",
    SHIRODHARA: "therapies.durations.shirodhara",
    ABHYANGA: "therapies.durations.abhyanga",
    SWEDANA: "therapies.durations.swedana",
    VIRECHANA: "therapies.durations.virechana",
    BASTI: "therapies.durations.basti",
  };

  return durations[type] || "therapies.durations.default";
}

// Helper function to get therapy category
export function getTherapyCategory(type: TherapyType): string {
  const categories: Record<TherapyType, string> = {
    CONSULTATION: "therapies.categories.diagnosis",
    NADI_PARIKSHA: "therapies.categories.diagnosis",
    AGNIKARMA: "therapies.categories.surgical",
    VIDDHAKARMA: "therapies.categories.surgical",
    PANCHAKARMA: "therapies.categories.detox",
    SHIRODHARA: "therapies.categories.relaxation",
    ABHYANGA: "therapies.categories.massage",
    SWEDANA: "therapies.categories.steam",
    VIRECHANA: "therapies.categories.detox",
    BASTI: "therapies.categories.detox",
  };

  return categories[type] || "therapies.categories.general";
}
