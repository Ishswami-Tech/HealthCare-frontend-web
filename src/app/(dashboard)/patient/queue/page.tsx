"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, AlertCircle, ArrowLeft, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientQueuePage() {
  const router = useRouter();

  // Fetch patient's appointments to find active/in-queue ones
  const { data: appointmentsData, isPending: isAppointmentsPending, refetch: refetchAppointments } = useMyAppointments();
  
  // Find the active appointment (confirmed after clinic check-in or already in progress)
  const activeAppointment = useMemo(() => {
    const appointments = Array.isArray(appointmentsData)
      ? appointmentsData
      : appointmentsData?.appointments ||
        appointmentsData?.data?.appointments ||
        appointmentsData?.data ||
        [];
    if (!Array.isArray(appointments)) return null;
    return appointments.find(
      (apt: any) => apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS'
    );
  }, [appointmentsData]);

  // Fetch real-time queue stats
  const {
    data: queueStats,
    isPending: isQueueStatsPending,
    refetch: refetchQueueStats,
  } = useRealTimeQueueStatus(undefined, activeAppointment?.locationId);

  const handleRefresh = () => {
    void refetchAppointments();
    void refetchQueueStats?.();
  };

  const isLoading = isAppointmentsPending || isQueueStatsPending;

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Syncing patient queue...</p>
      </div>
    );
  }

  // ─── No Active Queue State ────────────────────────────────────────────────
  if (!activeAppointment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="max-w-md w-full space-y-6 flex flex-col items-center p-8 bg-white dark:bg-zinc-900 rounded-4xl border shadow-sm">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
             <Users className="w-10 h-10 text-primary opacity-80" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">No Active Queue</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">
              You don't have any confirmed queue appointments today. Scan the clinic QR code at the reception to join the live queue.
            </p>
          </div>
          <div className="flex flex-col w-full gap-3 pt-4">
            <Button 
               className="w-full h-12 rounded-xl text-base font-bold bg-primary"
               onClick={() => router.push('/patient/check-in')}
            >
              Scan Check-In QR
            </Button>
            <Button 
               variant="outline"
               className="w-full h-12 rounded-xl text-base font-semibold"
               onClick={() => router.push('/patient/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active Queue State ───────────────────────────────────────────────────
  const stats = (queueStats as any)?.data || {};
  const currentToken = stats.currentToken || 0;
  const userToken =
    activeAppointment.tokenNumber ||
    activeAppointment.queuePosition ||
    activeAppointment.metadata?.tokenNumber ||
    0;
  const isInProgress = activeAppointment.status === 'IN_PROGRESS';
  
  // Logic
  let peopleAhead = 0;
  if (activeAppointment.status === 'CONFIRMED' && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }
  const estimatedWait = typeof stats.estimatedWaitTime === 'number' ? stats.estimatedWaitTime : 15;
  const isUpNext = peopleAhead === 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted/50 -ml-2">
               <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
               <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Live Queue Status</h1>
               <p className="text-sm text-muted-foreground mt-1">Real-time tracking for your appointment</p>
            </div>
         </div>
         <Button variant="outline" size="icon" onClick={handleRefresh} className="rounded-full h-10 w-10 shadow-sm border-zinc-200" title="Refresh Queue">
            <RefreshCcw className="w-4 h-4 text-zinc-600" />
         </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key="active-queue"
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="relative"
        >
          {/* Main Card */}
          <Card className={cn(
             "border-2 shadow-xl overflow-hidden rounded-4xl",
             isInProgress 
                ? "border-green-500/50 bg-linear-to-b from-green-50/50 to-white dark:from-green-950/20 dark:to-zinc-950" 
                : "border-blue-500/30 bg-linear-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-zinc-950"
          )}>
            
            {/* Top Status Bar */}
            <div className={cn(
               "px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4",
               isInProgress ? "bg-green-600 dark:bg-green-700/80" : "bg-blue-600 dark:bg-blue-800"
            )}>
               <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                     <Users className="w-5 h-5" />
                  </div>
                  <div>
                     <h2 className="font-bold text-lg">Dr. {activeAppointment.doctor?.name || 'Assigned Doctor'}</h2>
                     <p className="text-white/80 text-sm font-medium">{activeAppointment.type || 'Consultation'}</p>
                  </div>
               </div>
               
               <Badge 
                 variant="secondary" 
                 className={cn(
                   "px-4 py-1.5 text-sm uppercase tracking-wide font-black rounded-full shadow-sm",
                   isInProgress ? "bg-white text-green-700 animate-pulse" : "bg-white text-blue-700"
                 )}
               >
                  {isInProgress ? 'Consultation In Progress' : 'Waiting in Queue'}
               </Badge>
            </div>

            <CardContent className="p-6 sm:p-10 space-y-10">
               {/* Huge Token Display */}
               <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16">
                  
                  <div className="flex flex-col items-center text-center space-y-2 group">
                     <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Your Token</span>
                     <div className={cn(
                        "w-36 h-36 sm:w-48 sm:h-48 rounded-[2.5rem] flex items-center justify-center border-4 shadow-inner transition-transform group-hover:scale-105",
                        isInProgress ? "border-green-500 bg-green-50 dark:bg-green-900/10 text-green-600" : "border-primary bg-primary/5 dark:bg-primary/10 text-primary"
                     )}>
                        <span className="text-6xl sm:text-8xl font-black">
                           {userToken || "--"}
                        </span>
                     </div>
                  </div>

                  <div className="flex flex-col items-center text-center space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                     <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Now Serving</span>
                     <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-4xl bg-muted border-2 flex items-center justify-center shadow-inner">
                        <span className="text-4xl sm:text-5xl font-black text-muted-foreground">
                           {currentToken || "--"}
                        </span>
                     </div>
                  </div>

               </div>

               {/* Metric Cards Row */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border">
                     <span className="text-xs font-bold uppercase text-muted-foreground mb-2">People Ahead</span>
                     <span className="text-3xl font-black text-foreground">
                        {isInProgress ? '0' : peopleAhead}
                     </span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border">
                     <span className="text-xs font-bold uppercase text-muted-foreground mb-2">Est. Wait</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground">
                           {isInProgress ? '0' : estimatedWait}
                        </span>
                        <span className="text-xs font-bold tracking-widest text-muted-foreground">MIN</span>
                     </div>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border">
                     <span className="text-xs font-bold uppercase text-muted-foreground mb-2">Patience Level</span>
                     <span className="text-3xl font-black text-foreground">
                        {isUpNext ? "🔥" : "🧘"}
                     </span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border">
                     <span className="text-xs font-bold uppercase text-muted-foreground mb-2">Avg Service</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground">{stats.averageServiceTime || 12}</span>
                        <span className="text-xs font-bold tracking-widest text-muted-foreground">MIN</span>
                     </div>
                  </div>
               </div>

               {/* Alerts */}
               {!isInProgress && (
                  <div className={cn(
                     "flex items-start gap-4 p-4 sm:p-6 rounded-2xl border shadow-sm",
                     isUpNext 
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30" 
                        : "bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                  )}>
                     <AlertCircle className={cn(
                        "w-6 h-6 shrink-0 mt-0.5 animate-pulse",
                        isUpNext ? "text-amber-500" : "text-blue-500"
                     )} />
                     <div>
                        <h4 className={cn(
                           "font-bold text-base mb-1",
                           isUpNext ? "text-amber-800 dark:text-amber-400" : "text-blue-800 dark:text-blue-300"
                        )}>
                           {isUpNext ? "You are up next!" : "Please stay nearby."}
                        </h4>
                        <p className={cn(
                           "text-sm font-medium",
                           isUpNext ? "text-amber-700/80 dark:text-amber-500/80" : "text-blue-700/80 dark:text-blue-400/80"
                        )}>
                           {isUpNext 
                              ? "Head towards the doctor's cabin. You will be called in shortly." 
                              : `There are ${peopleAhead} patients ahead of you. Track your live status here.`
                           }
                        </p>
                     </div>
                  </div>
               )}

            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
