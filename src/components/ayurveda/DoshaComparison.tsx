"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DoshaData } from "./DoshaChart";

interface DoshaComparisonProps {
  doshaKey: keyof DoshaData;
  prakriti: DoshaData;
  vikriti: DoshaData;
  getDifference: (doshaKey: keyof DoshaData) => number;
  getDifferenceIcon: (difference: number) => React.ReactNode;
  getDifferenceColor: (difference: number) => string;
  DOSHA_NAMES: Record<keyof DoshaData, string>;
  DOSHA_COLORS: Record<string, string>;
  translation: (key: string) => string;
}

const DoshaComparison = ({
  doshaKey,
  prakriti,
  vikriti,
  getDifference,
  getDifferenceIcon,
  getDifferenceColor,
  DOSHA_NAMES,
  DOSHA_COLORS,
  translation,
}: DoshaComparisonProps) => {
  const prakritValue = prakriti[doshaKey];
  const vikritValue = vikriti[doshaKey];
  const difference = getDifference(doshaKey);
  const doshaName = DOSHA_NAMES[doshaKey];
  const color = DOSHA_COLORS[doshaKey];

  return (
    <div className="gap-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <div
            className="size-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          {doshaName}
        </h4>
        <div className="flex items-center gap-2">
          {getDifferenceIcon(difference)}
          <span
            className={cn(
              "text-sm font-medium",
              getDifferenceColor(difference)
            )}
          >
            {difference > 0 ? "+" : ""}
            {difference}%
          </span>
        </div>
      </div>

      <div className="gap-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{translation("prakritiVikriti.prakritNatural")}</span>
          <span className="font-medium">{prakritValue}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${prakritValue}%`,
              backgroundColor: color,
            }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{translation("prakritiVikriti.vikritiCurrent")}</span>
          <span className="font-medium">{vikritValue}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${vikritValue}%`,
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DoshaComparison;