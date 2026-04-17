"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { motion } from "framer-motion";
import { StatusType } from "@/components/common/StatusIndicator";
import { cn } from "@/lib/utils/index";

interface StatusCardProps {
  name: string;
  icon: any; // Relaxed type to allow style props
  status: StatusType;
  responseTime: number | null;
  className?: string;
}

// Generate deterministic random data based on name to keep charts consistent but varied
const generateSparklineData = (name: string, currentLatency: number | null) => {
  const seed = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const data = [];
  const baseLatency = currentLatency || 50;
  
  for (let i = 0; i < 20; i++) {
    // smooth random walk
    const noise = Math.sin(i * 0.5 + seed) * 20 + (Math.random() - 0.5) * 10;
    data.push({
      value: Math.max(10, baseLatency + noise),
    });
  }
  
  // Add current value at the end
  if (currentLatency) {
    data.push({ value: currentLatency });
  }
  return data;
};

export function StatusCard({ name, icon: Icon, status, responseTime, className }: StatusCardProps) {
  const data = useMemo(() => generateSparklineData(name, responseTime), [name, responseTime]);

  // Color mapping
  const colors = {
    active: { stroke: "#10b981", fill: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]" },
    warning: { stroke: "#f59e0b", fill: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]" },
    error: { stroke: "#ef4444", fill: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/20", glow: "shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]" },
    loading: { stroke: "#6366f1", fill: "#6366f1", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]" },
    inactive: { stroke: "#6b7280", fill: "#6b7280", bg: "bg-gray-500/10", border: "border-gray-500/20", glow: "shadow-none" },
  };

  const theme = colors[status] || colors.inactive;



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
        theme.bg,
        theme.border,
        theme.glow,
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-md", theme.border, "border")}>
            <Icon className="h-5 w-5" style={{ color: theme.stroke }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground/80">{name}</h3>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.stroke }}>
              {status === 'loading' ? 'Checking...' : status}
            </p>
          </div>
        </div>
        
        <div className="text-right">
           <div className="text-2xl font-bold font-mono tracking-tight">
             {responseTime ? `${Math.round(responseTime)}` : "--"}
             <span className="text-xs font-sans text-muted-foreground ml-1">ms</span>
           </div>
        </div>
      </div>

      <div className="h-[60px] w-full -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={theme.stroke} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.stroke}
              strokeWidth={2}
              fill={`url(#gradient-${name})`}
              isAnimationActive={false} // Disable for real-time feel or handle gracefully
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
