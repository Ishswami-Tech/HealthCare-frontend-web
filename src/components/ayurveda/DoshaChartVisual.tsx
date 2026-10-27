"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

type RadarPoint = {
  dosha: string;
  value: number;
  fullMark: number;
};

type PiePoint = {
  name: string;
  value: number;
  color: string;
};

export interface DoshaChartVisualProps {
  type: "radar" | "pie";
  radarData: RadarPoint[];
  pieData: PiePoint[];
  showLegend: boolean;
}

const DoshaChartVisual = dynamic(
  async () => {
    const {
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
    } = await import("recharts");

    return function DoshaChartVisual({
      type,
      radarData,
      pieData,
      showLegend,
    }: DoshaChartVisualProps) {
      // recharts draws its own SVG, so it needs real colors, not Tailwind `dark:` classes — pick
      // them from the resolved theme instead of recharts' demo-purple/gray defaults, which read
      // as washed out (or invisible) on a dark card.
      const { resolvedTheme } = useTheme();
      const isDark = resolvedTheme === "dark";
      // Same emerald pair BillingSplitChart.tsx uses for its "paid" series (the app's --primary).
      const seriesColor = isDark ? "#34d399" : "#047857";
      const gridColor = isDark ? "#374151" : "#e5e7eb";
      const tickColor = isDark ? "#9ca3af" : "#6b7280";

      return type === "radar" ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={gridColor} />
            <PolarAngleAxis dataKey="dosha" tick={{ fill: tickColor }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar
              name="Dosha level"
              dataKey="value"
              stroke={seriesColor}
              fill={seriesColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? "#1f2937" : "#ffffff",
                borderColor: gridColor,
                color: isDark ? "#f9fafb" : "#111827",
              }}
            />
            {showLegend && <Legend wrapperStyle={{ color: tickColor }} />}
          </PieChart>
        </ResponsiveContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => <div className="h-[300px] w-full" />,
  }
);

export default DoshaChartVisual;
