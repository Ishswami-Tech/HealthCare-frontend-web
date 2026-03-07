"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentClinic, useClinicStats, useActiveLocations } from "@/hooks/query/useClinics";
import { useRealTimeAppointments, useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { cn } from "@/lib/utils";
import {
  Settings,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  CalendarDays,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  UserPlus,
  IndianRupee,
  RefreshCcw,
} from "lucide-react";

export default function ClinicAdminDashboard() {
  const { data: currentClinic, isPending: isLoadingClinic } = useCurrentClinic();
  const clinicId = currentClinic?.id;

  const { data: locations = [] } = useActiveLocations(clinicId || "");
  const locationId = locations[0]?.id || "";

  // Real data fetching
  const { data: clinicStats, isPending: isLoadingStats, refetch: refetchStats } = useClinicStats(clinicId || "");
  const { data: appointmentsData } = useRealTimeAppointments({
    limit: 5,
  });
  const { data: queueData, isPending: isLoadingQueue } = useRealTimeQueueStatus(undefined, locationId);

  const appointments = (appointmentsData as any)?.data || [];
  const queueItems = (queueData as any)?.items || [];

  const stats = useMemo(() => {
    if (!clinicStats) return null;
    return {
      totalAppointments: clinicStats.totalAppointments || 0,
      todayAppointments: clinicStats.todayAppointments || 0,
      totalStaff: clinicStats.totalUsers || 0,
      activePatients: clinicStats.totalPatients || 0,
      revenue: clinicStats.revenue || 0,
      waitTime: clinicStats.avgWaitTime || 0,
      completionRate: clinicStats.completionRate || 0,
    };
  }, [clinicStats]);

  const recentEvents = useMemo(() => {
    return appointments.slice(0, 3).map((apt: any) => ({
      id: apt.id,
      type: "appointment",
      message: `Appointment scheduled for ${apt.patient?.name || apt.patient?.firstName || apt.patientName || "a patient"}`,
      time: new Date(apt.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(apt.createdAt).toLocaleDateString(),
    }));
  }, [appointments]);

  if (isLoadingClinic || isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse text-lg">Waking up the clinic dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-transparent min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 drop-shadow-sm">
                Control Hub
              </h1>
              <p className="text-muted-foreground font-medium flex items-center gap-2">
                <span className="text-primary font-bold">{currentClinic?.name}</span>
                <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                Live operational status
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-900 p-1.5 rounded-2xl shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-800">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetchStats()}
            className="h-10 px-4 font-bold flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Sync Data
          </Button>
          <Button className="h-10 px-6 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            New Appointment
          </Button>
        </div>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: "Appointments Today", 
            value: stats?.todayAppointments || 0, 
            sub: `${stats?.totalAppointments || 0} this month`, 
            icon: CalendarDays, 
            color: "text-blue-600", 
            bg: "bg-blue-500/10",
            trend: "+12%",
            isUp: true
          },
          { 
            label: "Clinic Revenue", 
            value: `₹${(stats?.revenue || 0).toLocaleString()}`, 
            sub: "Gross billing", 
            icon: IndianRupee, 
            color: "text-purple-600", 
            bg: "bg-purple-500/10",
            trend: "+8.4%",
            isUp: true
          },
          { 
            label: "Active Patients", 
            value: stats?.activePatients || 0, 
            sub: "Verified records", 
            icon: UserPlus, 
            color: "text-emerald-600", 
            bg: "bg-emerald-500/10",
            trend: "+21",
            isUp: true
          },
          { 
            label: "Queue Efficiency", 
            value: `${stats?.waitTime || 0}m`, 
            sub: "Average wait time", 
            icon: Clock, 
            color: "text-orange-600", 
            bg: "bg-orange-500/10",
            trend: "-2m",
            isUp: false
          }
        ].map((item, i) => (
          <Card key={i} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
            <div className={cn("h-1 w-full opacity-30 group-hover:opacity-100 transition-opacity", item.color.replace('text', 'bg'))} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2.5 rounded-xl shrink-0", item.bg)}>
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-lg",
                  item.isUp ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}>
                  {item.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {item.trend}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-black tracking-tight">{item.value}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <span className="text-[10px] font-medium text-neutral-400">{item.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-foreground">
        {/* Live Queue Tracker */}
        <Card className="lg:col-span-8 border-none shadow-lg bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <CardHeader className="p-6 border-b bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Live Clinic Queue
              </CardTitle>
              <CardDescription className="text-xs font-medium">Real-time patient flow across all departments</CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-none animate-pulse">
              Live Monitoring
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingQueue ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : queueItems.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {queueItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/10 to-blue-500/10 flex items-center justify-center font-black text-primary text-sm shadow-sm group-hover:scale-110 transition-transform">
                        {item.tokenNumber || idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{item.patientName || "Walk-in Patient"}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">{item.doctorName || "General Staff"}</span>
                          <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                          <span className="text-[10px] font-bold uppercase text-primary/80">{item.serviceType || "Consultation"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold">{item.checkInTime || "Now"}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.waitTime || "0"}m wait</p>
                      </div>
                      <Badge className={cn(
                        "rounded-lg border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                        item.status === "SERVING" ? "bg-blue-500 text-white" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      )}>
                        {item.status || "WAITING"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <h4 className="font-black">Queue is Empty</h4>
                  <p className="text-sm text-muted-foreground font-medium">No patients currently in the live queue.</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-neutral-50/80 dark:bg-neutral-900/80 border-t flex justify-center">
              <Button variant="link" className="text-xs font-black uppercase text-primary hover:no-underline">
                View Full Queue Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-8 text-neutral-900">
          {/* Recent Performance */}
          <Card className="border-none shadow-lg bg-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-24 h-24" />
            </div>
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-lg font-black text-white/90">Clinical Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="space-y-1">
                <h3 className="text-4xl font-black">{stats?.completionRate || 0}%</h3>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Appointment Strike Rate</p>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000" 
                  style={{ width: `${stats?.completionRate || 0}%` }} 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-black uppercase text-white/60 mb-1">Satisfied</p>
                  <p className="text-xl font-black">94%</p>
                </div>
                <div className="flex-1 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-black uppercase text-white/60 mb-1">On Time</p>
                  <p className="text-xl font-black">82%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-none shadow-lg bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
            <CardHeader className="p-6 border-b">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Clinical Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {recentEvents.length > 0 ? recentEvents.map((event: any, i: number) => (
                  <div key={i} className="flex gap-4 items-start relative pb-6 border-l-2 border-neutral-100 last:border-0 last:pb-0 pl-4 ml-2">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-background ring-2 ring-primary rounded-full shrink-0" />
                    <div className="space-y-1 -mt-1">
                      <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 leading-tight">{event.message}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-primary">{event.time}</span>
                        <span className="text-[10px] font-bold text-neutral-400">{event.date}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-sm text-neutral-400 py-8">No recent activity detected.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Action Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 text-foreground">
        <Card className="border-none bg-orange-50/50 dark:bg-orange-500/10 ring-1 ring-orange-100 dark:ring-orange-500/20 group hover:bg-orange-50 dark:hover:bg-orange-500/20 transition-colors">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-orange-900 dark:text-orange-100">Wait Time Threshold Exceeded</h4>
              <p className="text-xs font-semibold text-orange-700/70 dark:text-orange-300/70 uppercase tracking-tight">3 patients waiting over 45 minutes in Cardiology</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-blue-50/50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20 group hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-colors">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900 dark:text-blue-100">Monthly Reports Ready</h4>
              <p className="text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 uppercase tracking-tight">Performance and billing audits finalized for review</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
