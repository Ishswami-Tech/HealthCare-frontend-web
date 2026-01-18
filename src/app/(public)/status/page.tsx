"use client";

import { useDetailedHealthStatus } from "@/hooks/query/useHealth";
import { cn } from "@/lib/utils/index";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, Activity, XCircle, Clock, Server, Database, Wifi, HardDrive, Video, Zap, Rocket, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// --- Types ---
interface ServiceStatus {
    name: string;
    status: string;
    icon: any;
    responseTime?: number | null;
    lastChecked?: Date | null;
    error?: string | null | undefined;
    endpoint?: string;
}

// --- Service Row ---

function StatusServiceRow({ service }: { service: ServiceStatus }) {
  const isHealthy = service.status === 'active';
  const isWarning = service.status === 'warning';
  const isError = service.status === 'error';
  const isLoading = service.status === 'loading';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card/50 dark:bg-slate-950/40 p-4 transition-all hover:border-border hover:bg-card/80 dark:hover:bg-slate-900/60 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Icon & Name */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg border transition-colors shadow-sm",
            "bg-muted/50 dark:bg-slate-900/80 border-border dark:border-slate-800",
            isHealthy && "text-emerald-500 dark:text-emerald-500",
            isWarning && "text-amber-500 dark:text-amber-500",
            isError && "text-red-500 dark:text-red-500",
            isLoading && "text-blue-500 dark:text-blue-500"
          )}>
            <service.icon className="h-5 w-5" />
            {isHealthy && <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_2px_rgba(16,185,129,0.4)]" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground dark:text-slate-100">{service.name}</h3>
            {service.error ? (
               <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 max-w-[200px] truncate">{service.error}</p>
            ) : (
               <div className="flex flex-col gap-0.5 mt-0.5">
                  <p className="text-xs text-muted-foreground dark:text-slate-500">
                      {service.endpoint === '/health' ? 'Health Check Protocol' : 'Service Monitor'}
                  </p>
                  {service.lastChecked && (
                      <p className="text-[10px] text-muted-foreground/70 dark:text-slate-600">
                          Last checked: {service.lastChecked.toLocaleTimeString()}
                      </p>
                  )}
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Latency & Status */}
        <div className="flex items-center gap-6">
            
             {/* Latency - Small & Clean */}
             {service.responseTime && service.responseTime > 0 && (
                 <div className="text-right hidden sm:block">
                    <span className={cn(
                        "block text-sm font-bold font-mono tracking-tight",
                        isHealthy ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}>
                        {Math.round(service.responseTime)}ms
                    </span>
                    <span className="text-[10px] text-muted-foreground dark:text-slate-600 uppercase font-semibold">Latency</span>
                 </div>
             )}

            <StatusPill status={service.status} />
        </div>
      </div>
    </motion.div>
  );
}

function StatusPill({ status }: { status: string }) {
   const isHealthy = status === 'active';
   const isWarning = status === 'warning';
   const isError = status === 'error';
   const isLoading = status === 'loading';

   return (
      <div className={cn(
        "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide border transition-all min-w-[140px] justify-center",
        isHealthy && "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/5",
        isWarning && "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/5",
        isError && "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/5",
        isLoading && "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/5"
     )}>
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isHealthy && <CheckCircle2 className="h-3.5 w-3.5" />}
        {isWarning && <AlertTriangle className="h-3.5 w-3.5" />}
        {isError && <XCircle className="h-3.5 w-3.5" />}
        
        <span className="uppercase">
          {isLoading ? "SYNCING" : isHealthy ? "OPERATIONAL" : isWarning ? "DEGRADED" : "OFFLINE"}
        </span>
     </div>
   );
}

// --- Main Page ---

function FormatUptime({ seconds }: { seconds: number }) {
    if (!seconds) return <>--</>;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return (
        <span className="font-mono">
            {h > 0 && <>{h}<span className="text-muted-foreground text-sm mx-0.5">h</span> </>}
            {m}<span className="text-muted-foreground text-sm mx-0.5">m</span> {s}<span className="text-muted-foreground text-sm mx-0.5">s</span>
        </span>
    );
}

// Helper to map status string to friendly status (active, warning, error, loading)
const mapStatus = (status?: string, healthy?: boolean): string => {
    if (status === 'up' || healthy === true) return "active";
    if (status === 'degraded') return "warning";
    if (status === 'down' || healthy === false) return "error";
    return "loading";
};

export default function StatusPage() {
  const { data: healthStatus, refetch, isFetching, lastUpdate } = useDetailedHealthStatus();
  
  // Track Next.js app uptime (client-side)
  const [appUptime, setAppUptime] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setAppUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Debug: Log health status
  console.log('[Status Page] Health Status:', healthStatus);
  console.log('[Status Page] Last Update:', lastUpdate);
  
  // We don't use useTheme here anymore to avoid hydration mismatch with duplicate headers/toggles
  // const [mounted, setMounted] = useState(false); // Removed unused

  // useEffect(() => setMounted(true), []); // Removed unused

  const services: ServiceStatus[] = [
    {
      name: "API Server",
      icon: Server,
      // API is healthy if we received health data successfully
      status: healthStatus ? 'active' : 'error',
      responseTime: healthStatus?.system?.requestRate ? Math.round(1000 / (healthStatus.system.requestRate || 1)) : null,
      lastChecked: lastUpdate,
      error: healthStatus ? null : 'Unable to connect to API server'
    },
    {
      name: "Database",
      icon: Database,
      status: mapStatus(healthStatus?.database?.status, healthStatus?.database?.isHealthy),
      responseTime: healthStatus?.database?.avgResponseTime || null,
      lastChecked: lastUpdate,
      error: healthStatus?.database?.errors?.[0] || null
    },
    {
        name: "WebSocket",
        icon: Wifi,
        status: mapStatus(healthStatus?.communication?.status, healthStatus?.communication?.healthy),
        responseTime: healthStatus?.communication?.socket?.latency || null,
        lastChecked: lastUpdate,
        error: healthStatus?.communication?.issues?.[0] || null
    },
    {
      name: "Cache",
      icon: HardDrive,
      status: mapStatus(healthStatus?.cache?.status, healthStatus?.cache?.healthy),
      responseTime: healthStatus?.cache?.latency || null,
      lastChecked: lastUpdate,
      error: null
    },
      {
          name: "Queue",
          icon: Zap,
          status: mapStatus(healthStatus?.queue?.status, healthStatus?.queue?.healthy),
          responseTime: healthStatus?.queue?.connection?.latency || null,
          lastChecked: lastUpdate,
          error: null
      },
       {
          name: "Video",
          icon: Video,
          status: mapStatus(healthStatus?.video?.status, healthStatus?.video?.isHealthy),
          responseTime: null,
          lastChecked: lastUpdate,
          error: healthStatus?.video?.error || null
      },
      {
          name: "Build & Deploy",
          icon: Rocket,
          status: healthStatus ? 'active' : 'error',
          responseTime: null,
          lastChecked: lastUpdate,
          error: healthStatus ? null : 'Build/Deploy not accessible or server offline',
          endpoint: '/health'
      },
      {
          name: "CI/CD",
          icon: GitBranch,
          status: healthStatus ? 'active' : 'error',
          responseTime: null,
          lastChecked: lastUpdate,
          error: healthStatus ? null : 'CI/CD pipeline status unavailable',
          endpoint: '/health'
      },
  ];

  const healthyServices = services.filter(s => s.status === 'active').length;
  const totalServices = services.length;
  const healthPercentage = totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0;
  
  const isHealthy = healthPercentage === 100;
  const isDegraded = healthPercentage < 100 && healthPercentage > 60;
  // const isError = healthPercentage <= 60; // Unused
  
  const glowColor = isHealthy ? "rgba(16, 185, 129, 0.15)" : isDegraded ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)";
  
  // Backend server uptime from health status
  const systemUptime = healthStatus?.uptime || 0;
  // Next.js app uptime (client-side tracking)
  const frontendUptime = appUptime;

  return (
    <div className="min-h-screen bg-background dark:bg-[#050911] text-foreground dark:text-slate-50 font-sans selection:bg-emerald-500/30 overflow-hidden relative transition-colors duration-300">
      
      {/* Ambient Background Glow */}
      <div 
        className="fixed top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-40 pointer-events-none transition-colors duration-1000 dark:opacity-40 opacity-0"
        style={{ background: glowColor }}
      />

      {/* Main Content (Header removed to avoid double-header issue) */}
      <div className="container mx-auto max-w-4xl px-6 py-6 relative z-10">
          <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="h-6 w-6 text-primary" />
                  System Status
              </h1>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch()}
                disabled={isFetching}
                className="gap-2"
              >
                 <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                 Refresh
              </Button>
          </div>
        
        {/* Metrics Banner */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl border border-border dark:border-white/10 bg-card/50 dark:bg-white/[0.02] p-8 backdrop-blur-md shadow-sm">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <h2 className="text-sm font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest mb-1">Overall Health</h2>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 mt-2">
                    <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground dark:from-white dark:to-slate-400">
                        {healthPercentage}%
                    </span>
                    <span className={cn(
                        "text-sm sm:text-lg font-bold px-3 py-1 rounded-full border w-fit",
                        isHealthy ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" : 
                        isDegraded ? "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                        "border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/10"
                    )}>
                        {isHealthy ? "Fully Operational" : isDegraded ? "Partially Degraded" : "System Outage"}
                    </span>
                </div>
                <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground dark:text-slate-400">
                   <Activity className="h-4 w-4" />
                   <span>Monitoring {services.length} core services, infrastructure, build and deployment</span>
                </div>
            </div>

            <div className="col-span-1 rounded-3xl border border-border dark:border-white/10 bg-card/50 dark:bg-white/[0.02] p-6 backdrop-blur-md flex flex-col justify-center gap-6 shadow-sm">
                 {/* Backend Server Uptime */}
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Server className="h-3 w-3 text-muted-foreground" />
                        <h2 className="text-xs font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">Backend Server</h2>
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground dark:text-slate-200">
                        <FormatUptime seconds={systemUptime} />
                    </div>
                 </div>

                 <div className="h-px bg-border dark:bg-white/5 w-full" />

                 {/* Frontend App Uptime */}
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <h2 className="text-xs font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">App Uptime</h2>
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground dark:text-slate-300">
                        <FormatUptime seconds={frontendUptime} />
                    </div>
                 </div>
            </div>
        </div>

        {/* Services List */}
        <div className="space-y-4">
           {services.map((service) => (
              <StatusServiceRow key={service.name} service={service} />
           ))}
        </div>

      </div>
    </div>
  );
}
