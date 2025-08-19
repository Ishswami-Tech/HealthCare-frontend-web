"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/context";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export interface DoshaData {
  vata: number;
  pitta: number;
  kapha: number;
}

interface DoshaChartProps {
  doshaData: DoshaData;
  type?: "radar" | "pie";
  title?: string;
  showLegend?: boolean;
  className?: string;
}

const DOSHA_COLORS = {
  vata: "#8B5CF6", // Purple
  pitta: "#EF4444", // Red
  kapha: "#10B981", // Green
};

const DOSHA_DESCRIPTIONS = {
  vata: {
    name: "doshas.vata.name",
    element: "doshas.vata.element",
    qualities: "doshas.vata.qualities",
    color: DOSHA_COLORS.vata,
  },
  pitta: {
    name: "doshas.pitta.name",
    element: "doshas.pitta.element",
    qualities: "doshas.pitta.qualities",
    color: DOSHA_COLORS.pitta,
  },
  kapha: {
    name: "doshas.kapha.name",
    element: "doshas.kapha.element",
    qualities: "doshas.kapha.qualities",
    color: DOSHA_COLORS.kapha,
  },
};

export default function DoshaChart({
  doshaData,
  type = "radar",
  title = "Dosha Analysis",
  showLegend = true,
  className = "",
}: DoshaChartProps) {
  const { t } = useTranslation();
  // Prepare data for radar chart
  const radarData = [
    {
      dosha: t("doshas.vata.name"),
      value: doshaData.vata,
      fullMark: 100,
    },
    {
      dosha: t("doshas.pitta.name"),
      value: doshaData.pitta,
      fullMark: 100,
    },
    {
      dosha: t("doshas.kapha.name"),
      value: doshaData.kapha,
      fullMark: 100,
    },
  ];

  // Prepare data for pie chart
  const pieData = [
    { name: t("doshas.vata.name"), value: doshaData.vata, color: DOSHA_COLORS.vata },
    { name: t("doshas.pitta.name"), value: doshaData.pitta, color: DOSHA_COLORS.pitta },
    { name: t("doshas.kapha.name"), value: doshaData.kapha, color: DOSHA_COLORS.kapha },
  ];

  // Find dominant dosha
  const getDominantDosha = () => {
    const doshas = [
      { name: t("doshas.vata.name"), value: doshaData.vata },
      { name: t("doshas.pitta.name"), value: doshaData.pitta },
      { name: t("doshas.kapha.name"), value: doshaData.kapha },
    ];
    return doshas.reduce((prev, current) =>
      prev.value > current.value ? prev : current
    );
  };

  const dominantDosha = getDominantDosha();

  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dosha" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
        <Radar
          name={t("doshas.level")}
          dataKey="value"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} ${(percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">
              {t("doshas.dominant")}: {dominantDosha.name}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Chart */}
          <div className="w-full">
            {type === "radar" ? renderRadarChart() : renderPieChart()}
          </div>

          {/* Dosha Values */}
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(DOSHA_DESCRIPTIONS).map(([key, dosha]) => {
              const value = doshaData[key as keyof DoshaData];
              const isHighest =
                value ===
                Math.max(doshaData.vata, doshaData.pitta, doshaData.kapha);

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isHighest
                      ? "border-current bg-opacity-10"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                  style={{
                    borderColor: isHighest ? dosha.color : undefined,
                    backgroundColor: isHighest ? `${dosha.color}10` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dosha.color }}
                    />
                    <h4 className="font-semibold text-sm">{t(dosha.name)}</h4>
                    {isHighest && (
                      <Badge variant="secondary" className="text-xs">
                        {t("doshas.dominant")}
                      </Badge>
                    )}
                  </div>
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: dosha.color }}
                  >
                    {value}%
                  </div>
                  <div className="text-xs text-gray-600 mb-1">
                    {t(dosha.element)}
                  </div>
                  <div className="text-xs text-gray-500">{t(dosha.qualities)}</div>
                </div>
              );
            })}
          </div>

          {/* Balance Indicator */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">{t("doshas.constitutionAnalysis")}</h4>
            <div className="text-sm text-gray-600">
              {dominantDosha.value > 50 ? (
                <p>
                  <span
                    className="font-medium"
                    style={{
                      color:
                        DOSHA_COLORS[
                          dominantDosha.name.toLowerCase() as keyof typeof DOSHA_COLORS
                        ],
                    }}
                  >
                    {dominantDosha.name}
                  </span>{" "}
                  {t("doshas.dominantConstitution", { dosha: dominantDosha.name.toLowerCase() })}
                </p>
              ) : (
                <p>
                  {t("doshas.balancedConstitution")}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
