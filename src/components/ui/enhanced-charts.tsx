"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Types
interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: Record<string, any>;
}

interface ChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  loading?: boolean;
  showTrend?: boolean;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period?: string;
  };
}

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: "sm" | "md" | "lg";
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = "md",
  thickness = 8,
  color = "#3b82f6",
  backgroundColor = "#e5e7eb",
  showPercentage = true,
  children,
  className,
}) => {
  const sizes = {
    sm: 60,
    md: 120,
    lg: 200,
  };

  const diameter = sizes[size];
  const radius = (diameter - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={diameter} height={diameter} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={thickness}
        />
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className="text-2xl font-bold text-foreground">
            {Math.round(progress)}%
          </span>
        ))}
      </div>
    </div>
  );
};

// Mini Bar Chart Component
const MiniBarChart: React.FC<ChartProps> = ({
  data,
  height = 60,
  className,
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={cn("flex items-end space-x-1", className)} style={{ height }}>
      {data.map((item, index) => (
        <div
          key={index}
          className="flex-1 bg-primary/20 rounded-t-sm transition-all duration-300 hover:bg-primary/40"
          style={{
            height: `${(item.value / maxValue) * 100}%`,
            backgroundColor: item.color || undefined,
          }}
          title={`${item.label}: ${item.value}`}
        />
      ))}
    </div>
  );
};

// Line Chart Component (SVG-based)
const MiniLineChart: React.FC<ChartProps> = ({
  data,
  height = 60,
  className,
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const width = 200;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((item.value - minValue) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={cn("w-full", className)}>
      <svg width="100%" height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((item.value - minValue) / range) * height;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="hsl(var(--primary))"
              className="drop-shadow-sm"
            />
          );
        })}
      </svg>
    </div>
  );
};

// Donut Chart Component
interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  className?: string;
  showLegend?: boolean;
  centerContent?: React.ReactNode;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  thickness = 30,
  className,
  showLegend = true,
  centerContent,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercentage = 0;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            const rotation = (accumulatedPercentage / 100) * 360;
            
            accumulatedPercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  transform: `rotate(${rotation}deg)`,
                }}
                className="transition-all duration-1000 ease-out"
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        {centerContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            {centerContent}
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${(index * 137.5) % 360}, 70%, 50%)` }}
              />
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Metric Card with Chart
interface MetricChartCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period?: string;
  };
  chartType?: "line" | "bar" | "progress";
  chartData?: ChartDataPoint[];
  progress?: number;
  className?: string;
  loading?: boolean;
}

const MetricChartCard: React.FC<MetricChartCardProps> = ({
  title,
  value,
  change,
  chartType = "line",
  chartData = [],
  progress,
  className,
  loading,
}) => {
  const renderChart = () => {
    if (loading) {
      return <div className="h-16 bg-muted/20 rounded animate-pulse" />;
    }

    switch (chartType) {
      case "line":
        return <MiniLineChart data={chartData} height={60} />;
      case "bar":
        return <MiniBarChart data={chartData} height={60} />;
      case "progress":
        return (
          <ProgressRing
            progress={progress || 0}
            size="sm"
            showPercentage={false}
          />
        );
      default:
        return null;
    }
  };

  const getTrendIcon = () => {
    if (!change) return null;
    
    switch (change.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={cn(
      "p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="flex-shrink-0">
          {renderChart()}
        </div>
      </div>
      
      {change && (
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={cn(
            "text-sm font-medium",
            change.direction === "up" && "text-green-600",
            change.direction === "down" && "text-red-600",
            change.direction === "neutral" && "text-gray-600"
          )}>
            {change.value}%
          </span>
          {change.period && (
            <span className="text-sm text-muted-foreground">
              {change.period}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Heatmap Component
interface HeatmapProps {
  data: { day: string; hour: number; value: number }[];
  className?: string;
}

const Heatmap: React.FC<HeatmapProps> = ({ data, className }) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxValue = Math.max(...data.map(d => d.value));

  const getIntensity = (value: number) => {
    return value / maxValue;
  };

  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.value || 0;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-25 gap-1">
        {/* Header row */}
        <div></div>
        {hours.map(hour => (
          <div key={hour} className="text-xs text-center text-muted-foreground">
            {hour % 6 === 0 ? hour : ""}
          </div>
        ))}
        
        {/* Data rows */}
        {days.map(day => (
          <React.Fragment key={day}>
            <div className="text-xs text-muted-foreground py-1 pr-2">
              {day}
            </div>
            {hours.map(hour => {
              const value = getCellData(day, hour);
              const intensity = getIntensity(value);
              return (
                <div
                  key={`${day}-${hour}`}
                  className="aspect-square rounded-sm border border-border/50"
                  style={{
                    backgroundColor: `hsl(var(--primary) / ${intensity * 0.8})`,
                  }}
                  title={`${day} ${hour}:00 - ${value} patients`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex space-x-1">
          {[0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
            <div
              key={intensity}
              className="w-3 h-3 rounded-sm border border-border/50"
              style={{
                backgroundColor: `hsl(var(--primary) / ${intensity * 0.8})`,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

// Analytics Dashboard Component
interface AnalyticsDashboardProps {
  className?: string;
  timeframe?: "today" | "week" | "month" | "year";
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className,
  // @ts-ignore - timeframe parameter reserved for future use
  timeframe = "today",
}) => {
  // Mock data - replace with real data from your APIs
  const mockPatientFlow = [
    { label: "9 AM", value: 5 },
    { label: "10 AM", value: 8 },
    { label: "11 AM", value: 12 },
    { label: "12 PM", value: 15 },
    { label: "1 PM", value: 10 },
    { label: "2 PM", value: 18 },
    { label: "3 PM", value: 14 },
    { label: "4 PM", value: 20 },
  ];

  const mockDoshaDistribution = [
    { label: "Vata", value: 35, color: "#3b82f6" },
    { label: "Pitta", value: 40, color: "#f59e0b" },
    { label: "Kapha", value: 25, color: "#10b981" },
  ];

  const mockWeeklyHeatmap = [
    { day: "Mon", hour: 9, value: 5 },
    { day: "Mon", hour: 10, value: 8 },
    { day: "Mon", hour: 14, value: 12 },
    { day: "Tue", hour: 9, value: 7 },
    { day: "Tue", hour: 11, value: 10 },
    { day: "Wed", hour: 10, value: 6 },
    { day: "Wed", hour: 15, value: 15 },
    { day: "Thu", hour: 9, value: 9 },
    { day: "Fri", hour: 14, value: 18 },
    // Add more data points...
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricChartCard
          title="Patient Flow"
          value="156"
          change={{ value: 12, direction: "up", period: "vs yesterday" }}
          chartType="line"
          chartData={mockPatientFlow}
        />
        
        <MetricChartCard
          title="Treatment Success"
          value="94%"
          change={{ value: 3, direction: "up", period: "this month" }}
          chartType="progress"
          progress={94}
        />
        
        <MetricChartCard
          title="Revenue"
          value="₹45,230"
          change={{ value: 8, direction: "up", period: "this week" }}
          chartType="bar"
          chartData={mockPatientFlow}
        />
        
        <MetricChartCard
          title="Satisfaction"
          value="4.8/5"
          change={{ value: 0.2, direction: "up", period: "this month" }}
          chartType="progress"
          progress={96}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Dosha Distribution</h3>
          <DonutChart
            data={mockDoshaDistribution}
            centerContent={
              <div className="text-center">
                <div className="text-2xl font-bold">100</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            }
          />
        </div>

        {/* Heatmap */}
        <div className="p-6 bg-card rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Patient Activity Heatmap</h3>
          <Heatmap data={mockWeeklyHeatmap} />
        </div>
      </div>
    </div>
  );
};

export {
  ProgressRing,
  MiniBarChart,
  MiniLineChart,
  DonutChart,
  MetricChartCard,
  Heatmap,
  AnalyticsDashboard,
};

export type { 
  ChartDataPoint, 
  ChartProps, 
  ProgressRingProps, 
  MetricChartCardProps,
  HeatmapProps,
  AnalyticsDashboardProps 
};