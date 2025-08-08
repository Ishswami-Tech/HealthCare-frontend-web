"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress"; // TODO: Add Progress component to shadcn/ui
import { cn } from "@/lib/utils";
import {
  User,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { DoshaData } from "./DoshaChart";

export interface PrakritiVikritiData {
  prakriti: DoshaData; // Natural constitution
  vikriti: DoshaData; // Current state
  patientName?: string;
  assessmentDate?: string;
  recommendations?: string[];
}

interface PrakritiVikritiCardProps {
  data: PrakritiVikritiData;
  showRecommendations?: boolean;
  className?: string;
}

const DOSHA_COLORS = {
  vata: "#8B5CF6",
  pitta: "#EF4444",
  kapha: "#10B981",
};

const DOSHA_NAMES = {
  vata: "Vata",
  pitta: "Pitta",
  kapha: "Kapha",
};

export default function PrakritiVikritiCard({
  data,
  showRecommendations = true,
  className,
}: PrakritiVikritiCardProps) {
  const { prakriti, vikriti, patientName, assessmentDate, recommendations } =
    data;

  // Calculate differences between Prakriti and Vikriti
  const getDifference = (doshaKey: keyof DoshaData) => {
    return vikriti[doshaKey] - prakriti[doshaKey];
  };

  const getDifferenceIcon = (difference: number) => {
    if (difference > 10) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (difference < -10)
      return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getDifferenceColor = (difference: number) => {
    if (Math.abs(difference) > 15) return "text-red-600";
    if (Math.abs(difference) > 10) return "text-orange-600";
    if (Math.abs(difference) > 5) return "text-yellow-600";
    return "text-green-600";
  };

  const getBalanceStatus = () => {
    const totalDifference =
      Math.abs(getDifference("vata")) +
      Math.abs(getDifference("pitta")) +
      Math.abs(getDifference("kapha"));

    if (totalDifference < 15)
      return { status: "balanced", color: "text-green-600", icon: CheckCircle };
    if (totalDifference < 30)
      return {
        status: "mild imbalance",
        color: "text-yellow-600",
        icon: AlertTriangle,
      };
    return {
      status: "significant imbalance",
      color: "text-red-600",
      icon: AlertTriangle,
    };
  };

  const balanceStatus = getBalanceStatus();
  const BalanceIcon = balanceStatus.icon;

  const DoshaComparison = ({ doshaKey }: { doshaKey: keyof DoshaData }) => {
    const prakritValue = prakriti[doshaKey];
    const vikritValue = vikriti[doshaKey];
    const difference = getDifference(doshaKey);
    const doshaName = DOSHA_NAMES[doshaKey];
    const color = DOSHA_COLORS[doshaKey];

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
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

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Prakriti (Natural)</span>
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
            <span className="text-gray-600">Vikriti (Current)</span>
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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Prakriti vs Vikriti Analysis
            {patientName && <Badge variant="outline">{patientName}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BalanceIcon className={cn("w-4 h-4", balanceStatus.color)} />
            <span
              className={cn(
                "text-sm font-medium capitalize",
                balanceStatus.color
              )}
            >
              {balanceStatus.status}
            </span>
          </div>
        </div>
        {assessmentDate && (
          <p className="text-sm text-gray-600">
            Assessment Date: {new Date(assessmentDate).toLocaleDateString()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Constitution Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Constitution Analysis
            </h3>
            <div className="space-y-4">
              <DoshaComparison doshaKey="vata" />
              <DoshaComparison doshaKey="pitta" />
              <DoshaComparison doshaKey="kapha" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Balance Overview</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <BalanceIcon className={cn("w-5 h-5", balanceStatus.color)} />
                <span
                  className={cn("font-medium capitalize", balanceStatus.color)}
                >
                  {balanceStatus.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Prakriti</strong> represents your natural constitution
                  - the unique balance of doshas you were born with.
                </p>
                <p>
                  <strong>Vikriti</strong> shows your current state, which may
                  differ from your natural constitution due to lifestyle, diet,
                  stress, or environmental factors.
                </p>
              </div>

              {/* Key Imbalances */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Observations:</h4>
                <div className="space-y-1">
                  {(["vata", "pitta", "kapha"] as const).map((dosha) => {
                    const diff = getDifference(dosha);
                    if (Math.abs(diff) > 10) {
                      return (
                        <div
                          key={dosha}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: DOSHA_COLORS[dosha] }}
                          />
                          <span className="capitalize">{dosha}</span>
                          <span className={getDifferenceColor(diff)}>
                            {diff > 0 ? "elevated" : "reduced"} by{" "}
                            {Math.abs(diff)}%
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {showRecommendations &&
          recommendations &&
          recommendations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Recommendations</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
