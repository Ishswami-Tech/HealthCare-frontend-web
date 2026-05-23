"use client";

import dynamic from "next/dynamic";

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
      return type === "radar" ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="dosha" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
            <Radar
              name="Dosha level"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
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
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
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
