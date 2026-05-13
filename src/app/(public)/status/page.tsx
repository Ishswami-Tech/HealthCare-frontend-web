"use client";

import { useDetailedHealthStatus } from "@/hooks/query/useHealth";
import { cn } from "@/lib/utils/index";
import { formatTimeInIST } from "@/lib/utils/date-time";
import { CheckCircle2, AlertTriangle, RefreshCw, Loader2, Activity, XCircle, Clock, Server, Database, Wifi, HardDrive, Video, Zap, Rocket, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Icon & Name */}
        <div className="flex items-center gap-4">
          <div className={cn(
            "relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors shadow-sm",
            "border-border/70 bg-muted/45",
            isHealthy && "text-emerald-600 dark:text-emerald-400",
            isWarning && "text-amber-600 dark:text-amber-400",
            isError && "text-red-600 dark:text-red-400",
            isLoading && "text-sky-600 dark:text-sky-400"
          )}>
            <service.icon className="h-5 w-5" />
            {isHealthy && <div className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground sm:text-base">{service.name}</h3>
            {service.error ? (
               <p className="mt-0.5 max-w-[240px] truncate text-xs text-red-600 dark:text-red-400">{service.error}</p>
            ) : (
               <div className="flex flex-col gap-0.5 mt-0.5">
                  <p className="text-xs text-muted-foreground">
                      {service.endpoint === '/health' ? 'Health Check Protocol' : 'Service Monitor'}
                  </p>
                  {service.lastChecked && (
                      <p className="text-[10px] text-muted-foreground/80">
                          Last checked: {formatTimeInIST(service.lastChecked)}
                      </p>
                  )}
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Latency & Status */}
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">

             {/* Latency - Small & Clean */}
             {service.responseTime && service.responseTime > 0 && (
                 <div className="text-right hidden sm:block">
                    <span className={cn(
                        "block font-mono text-sm font-bold tracking-tight",
                        isHealthy ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                    )}>
                        {Math.round(service.responseTime)}ms
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">Latency</span>
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
        "flex min-w-[132px] items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-all",
        isHealthy && "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/5",
        isWarning && "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/5",
        isError && "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/5",
        isLoading && "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 dark:bg-sky-500/5"
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

  // Track app uptime in the browser so refreshes do not reset the timer.
  const [appUptime, setAppUptime] = useState(0);

  useEffect(() => {
    const storageKey = "status-page-app-started-at";
    const storedStartedAt = window.localStorage.getItem(storageKey);
    const startedAt = storedStartedAt ? Number(storedStartedAt) : Date.now();

    if (!storedStartedAt) {
      window.localStorage.setItem(storageKey, String(startedAt));
    }

    const interval = setInterval(() => {
      setAppUptime(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    setAppUptime(Math.floor((Date.now() - startedAt) / 1000));

    return () => clearInterval(interval);
  }, []);

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
  const latestCheckLabel = lastUpdate ? formatTimeInIST(lastUpdate) : "Pending first check";

  const isHealthy = healthPercentage === 100;
  const isDegraded = healthPercentage < 100 && healthPercentage > 60;
  // const isError = healthPercentage <= 60; // Unused

  // Backend server uptime from health status
  const systemUptime = healthStatus?.uptime || 0;
  // Next.js app uptime (client-side tracking)
  const frontendUptime = appUptime;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted)/0.34)_100%)] py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--secondary)/0.08),transparent_32%)]" />
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none">
                <Activity className="mr-2 h-4 w-4" />
                Live service health
              </Badge>
              <h1 className="max-w-5xl font-playfair text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                System status with clear, current operational visibility
              </h1>
              <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg lg:text-xl">
                Track platform readiness, response health, uptime, and core service availability in one lightweight status view.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => {
                    void refetch();
                  }}
                  disabled={isFetching}
                  className="w-full gap-2 sm:w-auto"
                >
                  <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                  {isFetching ? "Refreshing" : "Refresh status"}
                </Button>
                <div className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  Last checked: <span className="font-medium text-foreground">{latestCheckLabel}</span>
                </div>
              </div>
            </div>

            <Card className="border-border/70 bg-card/96 shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
              <CardContent className="p-6 sm:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Overall health
                </p>
                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-5xl font-black tracking-tight text-foreground">
                      {healthPercentage}%
                    </span>
                    <span className={cn(
                      "rounded-full border px-3 py-1 text-sm font-semibold",
                      isHealthy ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" :
                      isDegraded ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" :
                      "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                    )}>
                      {isHealthy ? "Operational" : isDegraded ? "Degraded" : "Attention needed"}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Healthy services
                      </p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {healthyServices}/{totalServices}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Monitoring scope
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        Infrastructure, delivery, build pipeline, and communication services.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/70 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Backend uptime
                      </p>
                      <div className="mt-1 text-xl font-bold text-foreground">
                        <FormatUptime seconds={systemUptime} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        App uptime
                      </p>
                      <div className="mt-1 text-xl font-bold text-foreground">
                        <FormatUptime seconds={frontendUptime} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Services tracked
                      </p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {totalServices}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RefreshCw className={cn("h-5 w-5", isFetching && "animate-spin")} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Check state
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {isFetching ? "Refreshing now" : latestCheckLabel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                  Service monitor
                </p>
                <h2 className="mt-3 font-playfair text-3xl font-bold text-foreground sm:text-4xl">
                  Core platform services
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Each item shows availability, last check timing, and latency where the service provides it.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  void refetch();
                }}
                disabled={isFetching}
                className="w-full gap-2 sm:w-auto"
              >
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                Refresh
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {services.map((service) => (
                <StatusServiceRow key={service.name} service={service} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
