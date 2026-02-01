"use client";

import { useDetailedHealthStatus } from "@/hooks/query/useHealth";
import { cn } from "@/lib/utils/index";
import { motion } from "framer-motion";
import Link from "next/link";

export function MinimalStatusIndicator({ className }: { className?: string }) {
  const { data: healthStatus, isPending } = useDetailedHealthStatus();

  // Helper logic to determine global status
  const getGlobalStatus = () => {
    if (!healthStatus) return 'loading';
    
    const services = [
        healthStatus.database,
        healthStatus.cache,
        healthStatus.queue,
        healthStatus.communication,
        healthStatus.video
    ];

    const isUnhealthy = (s: any) => {
        if (!s) return false;
        if (s.status === 'down') return true;
        if ('healthy' in s && s.healthy === false) return true;
        if ('isHealthy' in s && s.isHealthy === false) return true;
        return false;
    };
  
    const isDegraded = (s: any) => {
        if (!s) return false;
        if (s.status === 'degraded') return true;
        if ('degraded' in s && s.degraded === true) return true;
        return false;
    };

    if (services.some(isUnhealthy)) return 'down';
    if (services.some(isDegraded)) return 'degraded';
    return 'operational';
  };

  const status = getGlobalStatus();

  // Map globalStatus to UI colors/labels
  let statusColor = "bg-emerald-500";
  let textColor = "text-emerald-500";
  let label = "All Systems Operational";

  if (isPending || status === 'loading') {
     statusColor = "bg-blue-500";
     textColor = "text-blue-500";
     label = "Checking Systems...";
  } else if (status === 'down') {
     statusColor = "bg-red-500";
     textColor = "text-red-500";
     label = "System Outage";
  } else if (status === 'degraded') {
     statusColor = "bg-amber-500";
     textColor = "text-amber-500";
     label = "Systems Degraded";
  } else {
     // Operational
     statusColor = "bg-emerald-500";
     textColor = "text-emerald-700 dark:text-emerald-400";
     label = "All systems normal.";
  }

  return (
    <Link href="/status" className={cn("inline-flex items-center group", className)}>
      <motion.div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all cursor-pointer",
          status === 'operational' 
            ? "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:hover:bg-emerald-950/50" 
            : "bg-background/50 backdrop-blur-sm hover:bg-accent/50",
          status === 'down' && "border-red-500/20 bg-red-50 text-red-700",
          status === 'degraded' && "border-amber-500/20 bg-amber-50 text-amber-700"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusColor)}></span>
          <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", statusColor)}></span>
        </span>
        <span className={cn("text-xs font-medium tracking-wide", textColor)}>
          {label}
        </span>
      </motion.div>
    </Link>
  );
}
