"use client";

import { useBackendHealth, BackendService } from "@/hooks/utils/useBackendHealth";
import { cn } from "@/lib/utils/index";
import { CheckCircle2, AlertTriangle, ArrowLeft, RefreshCw, Loader2, Activity, Moon, Sun, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// --- Service Row ---

function StatusServiceRow({ service }: { service: BackendService }) {
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

export default function StatusPage() {
  const { backendStatus, checkAllServices } = useBackendHealth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const services = [
    backendStatus.api,
    backendStatus.database,
    backendStatus.cache,
    backendStatus.video,
    backendStatus.websocket,
    // backendStatus.realtime, // Removed as per request
    backendStatus.build,
    backendStatus.cicd,
  ];

  const isHealthy = backendStatus.globalStatus === 'operational';
  const isDegraded = backendStatus.globalStatus === 'degraded';
  
  const glowColor = isHealthy ? "rgba(16, 185, 129, 0.15)" : isDegraded ? "rgba(245, 158, 11, 0.15)" : "rgba(239, 68, 68, 0.15)";

  return (
    <div className="min-h-screen bg-background dark:bg-[#050911] text-foreground dark:text-slate-50 font-sans selection:bg-emerald-500/30 overflow-hidden relative transition-colors duration-300">
      
      {/* Ambient Background Glow */}
      <div 
        className="fixed top-[-20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-40 pointer-events-none transition-colors duration-1000 dark:opacity-40 opacity-0"
        style={{ background: glowColor }}
      />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border dark:border-white/5 bg-background/80 dark:bg-[#050911]/80 backdrop-blur-xl transition-colors">
        <div className="container mx-auto flex h-20 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="rounded-full p-2.5 transition-all hover:bg-muted/50 dark:hover:bg-white/5 border border-transparent hover:border-border dark:hover:border-white/10">
               <ArrowLeft className="h-5 w-5 text-muted-foreground dark:text-slate-400" />
            </Link>
            <div className="h-6 w-[1px] bg-border dark:bg-white/10" />
            <div className="flex items-center gap-3">
               <div className="relative flex h-3 w-3">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isHealthy ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500")} />
                  <span className={cn("relative inline-flex rounded-full h-3 w-3", isHealthy ? "bg-emerald-500" : isDegraded ? "bg-amber-500" : "bg-red-500")} />
               </div>
               <span className="font-bold tracking-tight text-lg text-foreground dark:text-slate-100">System Status</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="rounded-full p-2.5 hover:bg-muted dark:hover:bg-white/5 border border-transparent hover:border-border transition-all"
               title="Toggle Theme"
             >
                {mounted && theme === 'dark' ? <Sun className="h-5 w-5 text-slate-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
             </button>

             <button 
               onClick={() => checkAllServices(true)}
               disabled={backendStatus.isChecking}
               className="group flex items-center gap-2.5 rounded-full border border-border dark:border-white/10 bg-card dark:bg-white/5 px-5 py-2 text-xs font-semibold text-muted-foreground dark:text-slate-300 transition-all hover:border-foreground/20 dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-white/10 disabled:opacity-50"
             >
               <RefreshCw className={cn("h-4 w-4 transition-all group-hover:text-foreground dark:group-hover:text-white", backendStatus.isChecking && "animate-spin")} />
               <span>REFRESH</span>
             </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-12 md:py-20 relative z-10">
        
        {/* Metrics Banner */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 md:col-span-2 relative overflow-hidden rounded-3xl border border-border dark:border-white/10 bg-card/50 dark:bg-white/[0.02] p-8 backdrop-blur-md shadow-sm">
                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />
                
                <h2 className="text-sm font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest mb-1">Overall Health</h2>
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 mt-2">
                    <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground dark:from-white dark:to-slate-400">
                        {backendStatus.healthPercentage}%
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
                   <span>Monitoring {services.length} core services and infrastructure</span>
                </div>
            </div>

            <div className="col-span-1 rounded-3xl border border-border dark:border-white/10 bg-card/50 dark:bg-white/[0.02] p-6 backdrop-blur-md flex flex-col justify-center gap-6 shadow-sm">
                 {/* Backend Uptime */}
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <h2 className="text-xs font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">API Server</h2>
                    </div>
                    <div className="text-2xl font-bold font-mono text-foreground dark:text-slate-200">
                        <FormatUptime seconds={backendStatus.systemUptime || 0} />
                    </div>
                 </div>

                 <div className="h-px bg-border dark:bg-white/5 w-full" />

                 {/* Frontend System Uptime */}
                 <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <h2 className="text-xs font-semibold text-muted-foreground dark:text-slate-500 uppercase tracking-widest">App Server</h2>
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground dark:text-slate-300">
                        <FormatUptime seconds={backendStatus.frontendUptime || 0} />
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

      </main>
    </div>
  );
}
