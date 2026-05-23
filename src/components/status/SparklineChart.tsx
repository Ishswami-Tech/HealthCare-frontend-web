"use client";

import dynamic from "next/dynamic";

export interface SparklineChartProps {
  data: Array<{ value: number }>;
  stroke: string;
  name: string;
}

const SparklineChart = dynamic(
  async () => {
    const { Area, AreaChart, ResponsiveContainer, YAxis } = await import(
      "recharts"
    );

    return function SparklineChart({
      data,
      stroke,
      name,
    }: SparklineChartProps) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <YAxis domain={["dataMin - 10", "dataMax + 10"]} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#gradient-${name})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => <div className="h-[60px] w-full" />,
  }
);

export default SparklineChart;
