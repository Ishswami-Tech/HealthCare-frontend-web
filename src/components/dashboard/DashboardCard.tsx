interface StatItem {
  label: string;
  value: string | number;
  valueClassName?: string;
}

interface DashboardCardProps {
  title: string;
  stats?: StatItem[];
  children?: React.ReactNode;
}

export function DashboardCard({ title, stats, children }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-4">
        {stats
          ? stats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{stat.label}</span>
                <span className={`font-semibold ${stat.valueClassName || ''}`}>
                  {stat.value}
                </span>
              </div>
            ))
          : children}
      </div>
    </div>
  );
}
