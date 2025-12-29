import React, { memo } from "react";

interface StatItem {
  label: string;
  value: string | number;
  valueClassName?: string;
}

interface DashboardCardProps {
  title: string;
  stats?: StatItem[];
  children?: React.ReactNode;
  className?: string;
}

function DashboardCardComponent({
  title,
  stats,
  children,
  className,
}: DashboardCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className || ""}`}>
      <h2 className="text-lg font-semibold mb-4 text-gray-900">{title}</h2>
      <div className="space-y-4">
        {stats
          ? stats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{stat.label}</span>
                <span
                  className={`font-semibold ${
                    stat.valueClassName || "text-gray-900"
                  }`}
                >
                  {stat.value}
                </span>
              </div>
            ))
          : children}
      </div>
    </div>
  );
}

// Export memoized DashboardCard for performance optimization
export const DashboardCard = memo(DashboardCardComponent);
