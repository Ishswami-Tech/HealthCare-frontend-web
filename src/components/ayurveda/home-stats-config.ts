import type { LucideIcon } from "lucide-react";
import { Award, Clock, Star, Users } from "lucide-react";

export type HomeStatAccent = "teal" | "green" | "orange" | "blue";

export type HomeStatDefinition = {
  icon: LucideIcon;
  number: string;
  labelKey:
    | "stats.livesTransformed"
    | "stats.yearsLegacy"
    | "stats.patientRating"
    | "stats.successRate";
  descriptionKey:
    | "stats.patientsSuccessfullyTreated"
    | "stats.authenticAyurvedicPractice"
    | "stats.basedOnReviews"
    | "stats.chronicConditions";
  accent: HomeStatAccent;
};

export const HOME_STAT_DEFINITIONS: HomeStatDefinition[] = [
  {
    icon: Users,
    number: "5000+",
    labelKey: "stats.livesTransformed",
    descriptionKey: "stats.patientsSuccessfullyTreated",
    accent: "teal",
  },
  {
    icon: Clock,
    number: "20+",
    labelKey: "stats.yearsLegacy",
    descriptionKey: "stats.authenticAyurvedicPractice",
    accent: "green",
  },
  {
    icon: Star,
    number: "4.9",
    labelKey: "stats.patientRating",
    descriptionKey: "stats.basedOnReviews",
    accent: "orange",
  },
  {
    icon: Award,
    number: "95%",
    labelKey: "stats.successRate",
    descriptionKey: "stats.chronicConditions",
    accent: "blue",
  },
];

export const ACCENT_STYLES: Record<
  HomeStatAccent,
  { iconBg: string; numberClass: string }
> = {
  teal: {
    iconBg: "bg-[#2DD4BF]",
    numberClass: "text-white",
  },
  green: {
    iconBg: "bg-[#22C55E]",
    numberClass: "text-white",
  },
  orange: {
    iconBg: "bg-[#F59E0B]",
    numberClass: "text-white",
  },
  blue: {
    iconBg: "bg-[#3B82F6]",
    numberClass: "text-[#2DD4BF]",
  },
};
