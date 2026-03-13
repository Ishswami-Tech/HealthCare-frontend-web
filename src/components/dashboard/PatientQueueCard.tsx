"use client";

import { useRealTimeQueueStatus } from "@/hooks/realtime/useRealTimeQueries";
import { useMyAppointments } from "@/hooks/query/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, AlertCircle, Maximize2 } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PatientQueueCard() {
  const router = useRouter();
  // Fetch patient's appointments to find one that is active/in queue
  const { data: appointmentsData, isPending: isAppointmentsPending } = useMyAppointments();
  
  // Find the active appointment (confirmed after clinic check-in or in progress)
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
  const { data: queueStats } = useRealTimeQueueStatus(undefined, activeAppointment?.locationId);

  if (isAppointmentsPending) {
    return (
      <Card className="border-l-4 border-l-blue-500 bg-card/95">
         <CardContent className="p-6 flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading queue status...</p>
         </CardContent>
      </Card>
    );
  }

  // If no active appointment, we don't show the queue card
  if (!activeAppointment) {
     return null; 
  }

  const stats = (queueStats as any)?.data || {};
  const currentToken = stats.currentToken || 0;
  // Try to find patient's token number in appointment or metadata
  const userToken =
    activeAppointment.tokenNumber ||
    activeAppointment.queuePosition ||
    activeAppointment.metadata?.tokenNumber ||
    0;
  const totalInQueue = stats.totalInQueue || 0;
  
  // Calculate people ahead
  let peopleAhead = 0;
  if (activeAppointment.status === 'CONFIRMED' && userToken > currentToken) {
    peopleAhead = userToken - currentToken;
  }

  const estimatedWait = typeof stats.estimatedWaitTime === 'number' ? stats.estimatedWaitTime : 15;

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-600 bg-linear-to-r from-blue-50/60 to-background shadow-lg dark:from-blue-950/30">
      <CardHeader className="border-b bg-background/70 pb-2 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
             <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Live Queue Status
            </CardTitle>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Badge 
                variant={activeAppointment.status === 'IN_PROGRESS' ? 'default' : 'secondary'} 
                className={cn(
                  "animate-pulse capitalize",
                  activeAppointment.status === 'IN_PROGRESS'
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                )}
              >
                  {activeAppointment.status === 'IN_PROGRESS' ? 'Now Serving' : 'Waiting in Queue'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => router.push('/patient/queue')} title="Full Screen View">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Your Token */}
            <div className="flex flex-col items-center rounded-xl border border-blue-100 bg-background/85 p-3 shadow-sm dark:border-blue-900/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Your Token</span>
                <span className="text-3xl font-black text-blue-600 dark:text-blue-300">
                    {userToken || "--"}
                </span>
            </div>

            {/* Current Token */}
            <div className="flex flex-col items-center rounded-xl border border-orange-100 bg-background/85 p-3 shadow-sm dark:border-orange-900/30">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Now Serving</span>
                <span className="text-3xl font-black text-orange-600 dark:text-orange-300">
                    {currentToken || "--"}
                </span>
            </div>
            
            {/* People Ahead */}
            <div className="flex flex-col items-center rounded-xl border bg-background/85 p-3 shadow-sm">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">People Ahead</span>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-black text-foreground">
                        {activeAppointment.status === 'IN_PROGRESS' ? '0' : peopleAhead}
                    </span>
                </div>
            </div>

            {/* Wait Time */}
            <div className="flex flex-col items-center rounded-xl border bg-background/85 p-3 shadow-sm">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Est. Wait</span>
                <div className="flex items-center gap-0.5">
                    <span className="text-2xl font-black text-foreground">
                      {activeAppointment.status === 'IN_PROGRESS' ? '0' : estimatedWait}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground mt-2">MIN</span>
                </div>
            </div>
        </div>

        {/* Detailed Stats Footer */}
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-blue-100/50 bg-blue-50/60 px-4 py-3 dark:border-blue-900/30 dark:bg-blue-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {totalInQueue} patients currently in queue
                </span>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-semibold text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Total Waiting: {stats.waitingCount || totalInQueue}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Avg Service: {stats.averageServiceTime || 12}m</span>
                </div>
            </div>
        </div>
        
        {activeAppointment.status === 'CONFIRMED' && (
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground italic px-2">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                <p>
                    Stay nearby. You will be called when token <span className="font-bold text-foreground">#{userToken}</span> is up.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
